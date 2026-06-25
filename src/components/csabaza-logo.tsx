import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/csabaza-logo.png.asset.json";

export function CSAbazaLogo({ className = "", showTagline = true }: { className?: string; showTagline?: boolean }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src={logoAsset.url}
        alt="CSAbaza"
        className="h-12 w-auto sm:h-14"
        loading="eager"
      />
      {showTagline && (
        <span className="hidden sm:inline text-xs font-medium text-muted-foreground leading-tight max-w-[10rem]">
          Quizzes that <span className="bg-gradient-primary bg-clip-text text-transparent font-semibold">turn classrooms</span> into game shows
        </span>
      )}
    </Link>
  );
}
