import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { joinSession } from "@/lib/student.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

export const Route = createFileRoute("/join/$pin")({
  component: JoinPage,
});

function JoinPage() {
  const { pin } = Route.useParams();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const join = useServerFn(joinSession);
  const navigate = useNavigate();

  // If already joined this pin, skip the form
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`csabaza:pin:${pin}`);
      if (stored) navigate({ to: "/play/$pin", params: { pin }, replace: true });
    } catch {}
  }, [pin, navigate]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await join({ data: { pin, nickname: nickname.trim() } });
      const payload = JSON.stringify(res);
      localStorage.setItem(`csabaza:${res.sessionId}`, payload);
      localStorage.setItem(`csabaza:pin:${pin}`, payload);
      navigate({ to: "/play/$pin", params: { pin }, replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not join");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-hero">
      <Header />
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Card className="glass w-full max-w-md p-8 border-2 shadow-elegant">
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Game PIN</p>
            <p className="text-4xl font-display font-black tracking-[0.3em] mt-1">{pin}</p>
          </div>
          <form onSubmit={handleJoin} className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-medium">Pick a nickname</label>
              <Input
                autoFocus
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. SuperLearner42"
                className="mt-1 text-lg"
                required
              />
            </div>
            <Button type="submit" size="lg" disabled={loading || !nickname.trim()} className="w-full bg-gradient-primary">
              Enter the lobby
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
