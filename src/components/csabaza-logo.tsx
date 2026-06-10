import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/csabaza-logo.png.asset.json";

export function CSAbazaLogo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center ${className}`}>
      <img
        src={logoAsset.url}
        alt="CSAbaza"
        className="h-12 w-auto sm:h-14"
        loading="eager"
      />
    </Link>
  );
}
