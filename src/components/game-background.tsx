import { Gamepad2, Zap, Star, Trophy, Rocket, Brain, Flame, CircleHelp } from "lucide-react";

export function GameBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-game-bg">
      {/* Big drifting color blobs */}
      <div
        className="absolute -top-20 -left-20 size-[45vw] rounded-full game-a blur-3xl opacity-30 animate-drift"
        style={{ animationDuration: "12s" }}
      />
      <div
        className="absolute -bottom-20 -right-20 size-[40vw] rounded-full game-b blur-3xl opacity-30 animate-drift"
        style={{ animationDuration: "14s", animationDelay: "-4s" }}
      />
      <div
        className="absolute top-1/4 -right-20 size-[28vw] rounded-full game-c blur-3xl opacity-25 animate-float"
        style={{ animationDuration: "7s" }}
      />
      <div
        className="absolute bottom-1/4 -left-10 size-[24vw] rounded-full game-d blur-3xl opacity-25 animate-wiggle"
        style={{ animationDuration: "8s" }}
      />

      {/* Floating game icons */}
      <FloatingIcon icon={Gamepad2} className="top-[10%] left-[8%] text-primary" />
      <FloatingIcon icon={Zap} className="top-[18%] right-[10%] text-warning" />
      <FloatingIcon icon={Star} className="bottom-[22%] left-[12%] text-chart-3" />
      <FloatingIcon icon={Trophy} className="bottom-[12%] right-[10%] text-success" />
      <FloatingIcon icon={Rocket} className="top-[50%] left-[5%] text-secondary-foreground" />
      <FloatingIcon icon={Brain} className="top-[40%] right-[6%] text-chart-2" />
      <FloatingIcon icon={Flame} className="top-[75%] left-[30%] text-destructive" />
      <FloatingIcon icon={CircleHelp} className="top-[8%] left-[45%] text-chart-1" />
    </div>
  );
}

function FloatingIcon({ icon: Icon, className }: { icon: React.ElementType; className: string }) {
  return (
    <Icon
      className={`absolute size-10 opacity-15 animate-drift ${className}`}
      aria-hidden="true"
    />
  );
}
