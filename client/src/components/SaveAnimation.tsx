import { useEffect, useState } from "react";

export default function SaveAnimation({ trigger }: { trigger: number }) {
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

  return (
    <div className="fixed inset-0 z-[9986] pointer-events-none flex items-center justify-center">
      {/* Pulsing circle */}
      <div
        key={`pulse-${key}`}
        className="absolute w-20 h-20 rounded-full bg-emerald-400/20"
        style={{ animation: "save-pulse 0.8s ease-out forwards" }}
      />

      {/* Checkmark */}
      <div
        key={`check-${key}`}
        style={{ animation: "save-check 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}
        className="relative select-none"
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          style={{ filter: "drop-shadow(0 0 15px rgba(16, 185, 129, 0.5))" }}
        >
          <circle cx="32" cy="32" r="28" fill="#10b981" />
          <path
            d="M20 32L28 40L44 24"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 40,
              strokeDashoffset: 40,
              animation: "save-draw 0.4s ease-out 0.25s forwards",
            }}
          />
        </svg>
      </div>

      {/* "SAVED" text */}
      <span
        key={`text-${key}`}
        className="absolute mt-24 text-sm font-bold text-emerald-500 tracking-wider"
        style={{ animation: "save-text 0.8s ease-out forwards" }}
      >
        SAVED ✓
      </span>
    </div>
  );
}
