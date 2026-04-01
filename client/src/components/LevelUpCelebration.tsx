import { useEffect, useState } from "react";
import { useGame } from "@/lib/gameState";
import { playConfetti } from "@/lib/sounds";

export default function LevelUpCelebration() {
  const { level } = useGame();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [displayLevel, setDisplayLevel] = useState(0);
  const [prevLevel, setPrevLevel] = useState(level);

  useEffect(() => {
    if (level > prevLevel && prevLevel > 0) {
      setDisplayLevel(level);
      setShowLevelUp(true);
      playConfetti();
      const timer = setTimeout(() => setShowLevelUp(false), 2800);
      return () => clearTimeout(timer);
    }
    setPrevLevel(level);
  }, [level]);

  if (!showLevelUp) return null;

  return (
    <div className="fixed inset-0 z-[9996] pointer-events-none flex items-center justify-center">
      {/* Background flash */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
          animation: "level-up-bg 2.8s ease-out forwards",
        }}
      />

      {/* Main text */}
      <div
        className="flex flex-col items-center gap-2"
        style={{ animation: "level-up-text 2.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}
      >
        <span className="text-5xl sm:text-7xl font-black tracking-tighter text-primary drop-shadow-lg"
          style={{ textShadow: "0 0 40px hsl(var(--primary) / 0.4)" }}
        >
          LEVEL {displayLevel}
        </span>
        <span className="text-sm sm:text-lg font-semibold text-primary/80 uppercase tracking-[0.3em]">
          Level Up
        </span>
      </div>

      {/* Particle rings */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute w-32 h-32 rounded-full border-2 border-primary/30"
          style={{
            animation: `level-up-ring 1.5s ease-out ${i * 0.2}s forwards`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
