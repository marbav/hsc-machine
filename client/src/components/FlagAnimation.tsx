import { useEffect, useState } from "react";

export default function FlagAnimation({ trigger, unflag }: { trigger: number; unflag?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (trigger === 0) return;
    setKey((k) => k + 1);
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (!visible) return null;

  if (unflag) {
    return (
      <div className="fixed inset-0 z-[9986] pointer-events-none flex items-center justify-center">
        <div
          key={key}
          style={{ animation: "flag-dissolve 0.8s ease-out forwards" }}
          className="text-6xl sm:text-8xl select-none"
        >
          🏳️
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9986] pointer-events-none flex items-center justify-center">
      {/* Shockwave ring */}
      <div
        key={`ring-${key}`}
        className="absolute w-16 h-16 rounded-full border-2 border-primary/40"
        style={{ animation: "flag-ring 0.6s ease-out forwards" }}
      />

      {/* Flag itself */}
      <div
        key={`flag-${key}`}
        style={{ animation: "flag-plant 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}
        className="relative select-none"
      >
        {/* Flag emoji with glow */}
        <span
          className="text-6xl sm:text-8xl block"
          style={{ filter: "drop-shadow(0 0 20px rgba(168, 85, 247, 0.5))" }}
        >
          🚩
        </span>
      </div>

      {/* Sparkle particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`spark-${key}-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary"
          style={{
            animation: `flag-spark 0.6s ease-out forwards`,
            animationDelay: `${0.1 + i * 0.04}s`,
            transform: `rotate(${i * 45}deg) translateY(-30px)`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
