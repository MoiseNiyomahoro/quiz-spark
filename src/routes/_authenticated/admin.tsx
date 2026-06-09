import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Users, BookOpen, Gamepad2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, user, loading } = useAuth();
  const [stats, setStats] = useState({ users: 0, quizzes: 0, sessions: 0 });
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

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
        <h1 className="text-3xl font-bold tracking-tight">Admin overview</h1>
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
