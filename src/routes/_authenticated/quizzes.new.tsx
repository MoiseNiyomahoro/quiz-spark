import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Header } from "@/components/header";
import { QuizEditor } from "@/components/quiz-editor";

export const Route = createFileRoute("/_authenticated/quizzes/new")({
  validateSearch: z.object({ ai: z.string().optional() }),
  component: NewQuiz,
});

function NewQuiz() {
  const { ai } = Route.useSearch();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Create a quiz</h1>
        <QuizEditor initialAI={ai === "1"} />
      </div>
    </div>
  );
}
