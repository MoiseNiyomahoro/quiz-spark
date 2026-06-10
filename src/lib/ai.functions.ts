import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({
  topic: z.string().min(2).max(200),
  count: z.number().int().min(3).max(20).default(8),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).default("mixed"),
  notes: z.string().max(20000).optional(),
});

export const generateAIQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured.");

    const systemPrompt = `You generate high-quality educational quizzes. Always return STRICT JSON matching this TypeScript type:
{
  "title": string,
  "description": string,
  "questions": Array<{
    "type": "multiple_choice" | "true_false",
    "question_text": string,
    "options": string[],           // 4 options for multiple_choice, ["True","False"] for true_false
    "correct_answer": string,      // must EXACTLY equal one of the options
    "explanation": string,
    "difficulty": "easy" | "medium" | "hard"
  }>
}
No markdown, no commentary. Only JSON.`;

    const userPrompt = `Topic: ${data.topic}
Number of questions: ${data.count}
Difficulty: ${data.difficulty}
Audience: school / educational. Cover the topic broadly and avoid duplicate questions.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("AI rate limit reached. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Cloud settings.");
    if (!res.ok) throw new Error(`AI error (${res.status})`);

    const body = await res.json();
    const text: string = body.choices?.[0]?.message?.content ?? "{}";
    let parsed: { title?: string; description?: string; questions?: any[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try to extract JSON block
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }
    return {
      title: parsed.title ?? data.topic,
      description: parsed.description ?? `AI-generated quiz on ${data.topic}`,
      questions: (parsed.questions ?? []).map((q: any) => ({
        type: q.type === "true_false" ? "true_false" : "multiple_choice",
        question_text: String(q.question_text ?? ""),
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        correct_answer: String(q.correct_answer ?? ""),
        explanation: q.explanation ? String(q.explanation) : "",
        difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "medium",
        timer_seconds: 20,
        points: 100,
      })),
    };
  });
