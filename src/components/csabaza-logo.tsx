import { Link } from "@tanstack/react-router";

export function CSAbazaLogo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 font-display font-bold text-lg ${className}`}>
      <div className="relative size-9 rounded-xl bg-gradient-primary shadow-glow grid place-items-center text-primary-foreground">
        <span className="text-base font-black">CS</span>
        <span className="absolute -bottom-1 -right-1 size-3 rounded-full bg-warning border-2 border-background" />
      </div>
      <span className="tracking-tight">
        CS<span className="text-primary">Abaza</span>
      </span>
    </Link>
  );
}
