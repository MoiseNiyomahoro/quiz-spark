import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Users, BookOpen, Gamepad2, ArrowLeft, LayoutDashboard, Trophy, TrendingUp, TrendingDown, Crown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, user, loading } = useAuth();
  const [stats, setStats] = useState({ users: 0, quizzes: 0, sessions: 0 });
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [sessionLogs, setSessionLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [u, q, s] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("quizzes").select("id", { count: "exact", head: true }),
        supabase.from("sessions").select("id", { count: "exact", head: true }),
      ]);
      setStats({ users: u.count ?? 0, quizzes: q.count ?? 0, sessions: s.count ?? 0 });
      const { data: rq } = await supabase.from("quizzes").select("*, profiles!quizzes_creator_id_fkey(name)").order("created_at", { ascending: false }).limit(10);
      setRecentQuizzes(rq ?? []);
      const { data: ru } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(10);
      setRecentUsers(ru ?? []);
      const { data: logs } = await supabase
        .from("sessions")
        .select("id, pin_code, status, created_at, ended_at, quizzes(title, profiles!quizzes_creator_id_fkey(name)), participants(id)")
        .order("created_at", { ascending: false })
        .limit(50);
      setSessionLogs(logs ?? []);
    })();
  }, [isAdmin]);

  if (loading) return <div className="min-h-screen grid place-items-center"><p>Loading...</p></div>;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Card className="max-w-md mx-auto p-8">
            <h2 className="font-bold text-xl">Admins only</h2>
            <p className="text-sm text-muted-foreground mt-2">
              You don't have the admin role yet. Ask an existing admin to grant you the role, or run this in the Cloud SQL editor:
            </p>
            <pre className="mt-3 text-xs bg-muted p-3 rounded text-left overflow-auto">{`INSERT INTO public.user_roles (user_id, role)\nVALUES ('${user?.id ?? "<your-user-id>"}', 'admin');`}</pre>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Admin</p>
            <h1 className="text-3xl font-bold tracking-tight">Platform overview</h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard"><ArrowLeft className="size-4" /> Back to dashboard</Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-primary">
              <Link to="/dashboard"><LayoutDashboard className="size-4" /> My quizzes</Link>
            </Button>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard icon={Users} label="Users" value={stats.users} />
          <StatCard icon={BookOpen} label="Quizzes" value={stats.quizzes} />
          <StatCard icon={Gamepad2} label="Total sessions" value={stats.sessions} />
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <h2 className="font-bold">Recent quizzes</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {recentQuizzes.map((q) => (
                <li key={q.id} className="flex justify-between border-b pb-2">
                  <span>{q.title}</span>
                  <span className="text-muted-foreground">{q.profiles?.name ?? "—"}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="font-bold">Recent users</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {recentUsers.map((u) => (
                <li key={u.id} className="flex justify-between border-b pb-2">
                  <span>{u.name}</span>
                  <span className="text-muted-foreground">{u.email}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="font-bold">Game history (all sessions)</h2>
          <p className="text-xs text-muted-foreground">Latest 50 hosted sessions across the platform</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">When</th>
                  <th className="py-2 pr-3">Quiz</th>
                  <th className="py-2 pr-3">Host</th>
                  <th className="py-2 pr-3">PIN</th>
                  <th className="py-2 pr-3">Players</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Ended</th>
                </tr>
              </thead>
              <tbody>
                {sessionLogs.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="py-2 pr-3 whitespace-nowrap">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-3">{s.quizzes?.title ?? "—"}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{s.quizzes?.profiles?.name ?? "—"}</td>
                    <td className="py-2 pr-3 font-mono">{s.pin_code}</td>
                    <td className="py-2 pr-3">{s.participants?.length ?? 0}</td>
                    <td className="py-2 pr-3"><Badge variant={s.status === "ended" ? "secondary" : "default"}>{s.status}</Badge></td>
                    <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{s.ended_at ? new Date(s.ended_at).toLocaleString() : "—"}</td>
                  </tr>
                ))}
                {sessionLogs.length === 0 && (
                  <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No sessions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="p-5 bg-gradient-card border-2">
      <Icon className="size-5 text-primary" />
      <p className="text-xs text-muted-foreground mt-2">{label}</p>
      <p className="text-3xl font-bold font-display">{value}</p>
    </Card>
  );
}
