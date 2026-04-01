import { useState, useEffect } from "react";
import { playStartup } from "@/lib/sounds";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);
  // 0: dark screen
  // 1: letters animate in
  // 2: glow pulse
  // 3: fade out

  useEffect(() => {
    const timers = [
      setTimeout(() => { setPhase(1); playStartup(); }, 200),
      setTimeout(() => setPhase(2), 1400),
      setTimeout(() => setPhase(3), 2200),
      setTimeout(() => onComplete(), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const letters = "BAVARO".split("");

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0f]
        transition-opacity duration-500
        ${phase >= 3 ? "opacity-0 pointer-events-none" : "opacity-100"}
      `}
    >
      {/* Ambient glow behind text */}
      <div
        className={`
          absolute w-[400px] h-[400px] rounded-full
          transition-all duration-1000 ease-out
          ${phase >= 2
            ? "bg-purple-500/20 blur-[120px] scale-100"
            : "bg-purple-500/0 blur-[80px] scale-50"
          }
        `}
      />

      {/* Subtle particle lines */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`
              absolute h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent
              transition-all ease-out
              ${phase >= 1 ? "opacity-100" : "opacity-0"}
            `}
            style={{
              top: `${30 + i * 8}%`,
              left: phase >= 1 ? "-10%" : "110%",
              width: "120%",
              transitionDuration: `${800 + i * 150}ms`,
              transitionDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>

      {/* Main text */}
      <div className="relative flex items-center gap-[2px] sm:gap-1">
        {letters.map((letter, i) => (
          <span
            key={i}
            className={`
              text-5xl sm:text-7xl md:text-8xl font-black tracking-tight
              transition-all ease-out
              ${phase >= 2
                ? "text-white drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                : phase >= 1
                  ? "text-white/90"
                  : "text-white/0 translate-y-8 scale-75"
              }
            `}
            style={{
              transitionDuration: "600ms",
              transitionDelay: phase >= 1 ? `${i * 80}ms` : "0ms",
              fontFamily: "'General Sans', system-ui, sans-serif",
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Underline accent */}
      <div
        className={`
          absolute bottom-[42%] h-[3px] rounded-full
          bg-gradient-to-r from-purple-500 via-violet-400 to-purple-500
          transition-all ease-out
          ${phase >= 1
            ? "w-[200px] sm:w-[320px] opacity-100"
            : "w-0 opacity-0"
          }
        `}
        style={{
          transitionDuration: "800ms",
          transitionDelay: "600ms",
        }}
      />

      {/* Subtle tagline */}
      <span
        className={`
          absolute bottom-[36%] text-[10px] sm:text-xs tracking-[0.3em] uppercase font-medium
          text-purple-300/70
          transition-all duration-500
          ${phase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
        `}
      >
        HSC Machine
      </span>
    </div>
  );
}
