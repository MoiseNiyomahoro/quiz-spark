import { Link } from "@tanstack/react-router";
import { CSAbazaLogo } from "./csabaza-logo";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 w-full glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <CSAbazaLogo />
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition">Home</Link>
          {user && <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition">Dashboard</Link>}
          {isAdmin && <Link to="/admin" className="text-muted-foreground hover:text-foreground transition">Admin</Link>}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="size-4" /> Sign out
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Teacher login</Link>
              </Button>
              <Button size="sm" asChild className="bg-gradient-primary shadow-elegant">
                <Link to="/">Join game</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
