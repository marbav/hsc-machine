import { useGame } from "@/lib/gameState";
import { useEffect, useState } from "react";
import type { AchievementDef } from "@/lib/achievements";

export default function AchievementToast() {
  const { latestAchievement, clearLatestAchievement } = useGame();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<AchievementDef | null>(null);

  useEffect(() => {
    if (latestAchievement) {
      setCurrent(latestAchievement);
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setCurrent(null), 500);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [latestAchievement]);

  if (!current) return null;

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-[9995] transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-95"
      }`}
    >
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-background/95 border border-primary/30 shadow-xl backdrop-blur-lg"
        style={{ boxShadow: "0 0 30px hsl(var(--primary) / 0.15), 0 8px 32px rgba(0,0,0,0.12)" }}
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0"
          style={{ animation: "achievement-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          {current.emoji}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Achievement Unlocked
          </p>
          <p className="text-sm font-bold">{current.name}</p>
          <p className="text-xs text-muted-foreground">{current.description}</p>
        </div>
      </div>
    </div>
  );
}
