import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { calcScore } from "./csabaza";

export const joinSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      pin: z.string().regex(/^\d{6}$/),
      nickname: z.string().trim().min(1).max(20),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: session, error } = await supabaseAdmin
      .from("sessions")
      .select("id, status, quiz_id")
      .eq("pin_code", data.pin)
      .maybeSingle();
    if (error || !session) throw new Error("Invalid PIN");
    if (session.status === "ended") throw new Error("This game has ended.");

    const nickname = data.nickname.trim();
    // Dedupe: if same nickname already joined this session, reuse it
    const { data: existing } = await supabaseAdmin
      .from("participants")
      .select("id, nickname")
      .eq("session_id", session.id)
      .ilike("nickname", nickname)
      .maybeSingle();
    if (existing) {
      return { sessionId: session.id, participantId: existing.id, nickname: existing.nickname };
    }

    const { data: p, error: pErr } = await supabaseAdmin
      .from("participants")
      .insert({ session_id: session.id, nickname })
      .select("*")
      .single();
    if (pErr) throw new Error(pErr.message);
    return { sessionId: session.id, participantId: p.id, nickname: p.nickname };
  });

export const submitAnswer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      participantId: z.string(),
      questionId: z.string(),
      selectedAnswer: z.string(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: p } = await supabaseAdmin
      .from("participants")
      .select("id, session_id, score")
      .eq("id", data.participantId)
      .single();
    if (!p) throw new Error("Participant not found");

    const { data: session } = await supabaseAdmin
      .from("sessions")
      .select("current_question_started_at, status")
      .eq("id", p.session_id)
      .single();
    if (!session) throw new Error("Session not found");

    const { data: question } = await supabaseAdmin
      .from("questions")
      .select("id, type, question_text, correct_answer, explanation, timer_seconds, points")
      .eq("id", data.questionId)
      .single();
    if (!question) throw new Error("Question not found");

    const startedAt = session.current_question_started_at ? new Date(session.current_question_started_at).getTime() : Date.now();
    const elapsed = Date.now() - startedAt;

    function parsePairs(s: string): Array<[string, string]> {
      return s
        .split(";")
        .map((p) => {
          const [l = "", r = ""] = p.split("|");
          return [l.trim().toLowerCase(), r.trim().toLowerCase()] as [string, string];
        })
        .filter(([l, r]) => l && r);
    }

    async function aiEquivalent(qText: string, expected: string, given: string): Promise<boolean> {
      const apiKey = process.env.LOVABLE_API_KEY;
      if (!apiKey) return false;
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content:
                  "You grade short fill-in-the-blank quiz answers. Reply with STRICT JSON only: {\"correct\": boolean, \"reason\": string}. Accept the student's answer as correct if it is the same concept as the expected answer — ignore case, punctuation, whitespace, word order, common abbreviations/expansions (e.g. FIFO ↔ First In First Out), and minor spelling/pluralization. Reject unrelated or factually wrong answers.",
              },
              {
                role: "user",
                content: `Question: ${qText}\nExpected answer: ${expected}\nStudent answer: ${given}`,
              },
            ],
            response_format: { type: "json_object" },
          }),
        });
        if (!res.ok) return false;
        const body = await res.json();
        const txt = body.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(txt);
        return parsed.correct === true;
      } catch {
        return false;
      }
    }

    let isCorrect = false;
    let pts = 0;
    if (question.correct_answer) {
      if (question.type === "matching") {
        const correctPairs = parsePairs(question.correct_answer);
        const userPairs = new Map(parsePairs(data.selectedAnswer));
        const total = correctPairs.length;
        let right = 0;
        for (const [l, r] of correctPairs) {
          if (userPairs.get(l) === r) right += 1;
        }
        isCorrect = total > 0 && right === total;
        // Partial credit: proportional to correctly-matched pairs.
        // Speed bonus only awarded when all pairs are correct.
        if (total > 0) {
          const base = Math.round((question.points * right) / total);
          const remaining = Math.max(0, question.timer_seconds - elapsed / 1000);
          const speedBonus = isCorrect ? Math.round(remaining * 5) : 0;
          pts = base + speedBonus;
        }
      } else {
        const norm = (s: string) => s.trim().toLowerCase().replace(/[\s\p{P}]+/gu, " ").trim();
        isCorrect = norm(question.correct_answer) === norm(data.selectedAnswer);
        // For fill-in-the-blank, use AI to accept semantically equivalent answers
        // (e.g. "FIFO" ↔ "First in first out"), ignoring case/word-order/abbreviation.
        if (!isCorrect && question.type === "fill_blank" && data.selectedAnswer.trim().length > 0) {
          isCorrect = await aiEquivalent(question.question_text, question.correct_answer, data.selectedAnswer);
        }
        pts = calcScore(isCorrect, question.timer_seconds, elapsed, question.points);
      }
    }


    const { error: rErr } = await supabaseAdmin.from("responses").upsert(
      {
        participant_id: data.participantId,
        session_id: p.session_id,
        question_id: data.questionId,
        selected_answer: data.selectedAnswer,
        is_correct: isCorrect,
        response_time_ms: elapsed,
        points: pts,
      },
      { onConflict: "participant_id,question_id" },
    );
    if (rErr) throw new Error(rErr.message);

    if (pts > 0) {
      await supabaseAdmin.from("participants").update({ score: p.score + pts }).eq("id", p.id);
    }
    return {
      isCorrect,
      points: pts,
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
    };
  });

export const getPlayBootstrap = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ pin: z.string().regex(/^\d{6}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: session, error } = await supabaseAdmin
      .from("sessions")
      .select("id, quiz_id, status, current_question_index, current_question_started_at, ended_at, created_at")
      .eq("pin_code", data.pin)
      .maybeSingle();
    if (error || !session) throw new Error("Game not found");

    // Safe question payload — never expose correct_answer or explanation to students before reveal
    const { data: questions } = await supabaseAdmin
      .from("questions")
      .select("id, type, question_text, options, image_url, timer_seconds, order_index")
      .eq("quiz_id", session.quiz_id)
      .order("order_index");

    const { data: participants } = await supabaseAdmin
      .from("participants")
      .select("id, nickname, score")
      .eq("session_id", session.id);

    return { session, questions: questions ?? [], participants: participants ?? [] };
  });
