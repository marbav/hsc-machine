import { useEffect, useState } from "react";

interface ReactionProps {
  text: string;
  color: string;
  trigger: number;
}

export default function ReactionOverlay({ text, color, trigger }: ReactionProps) {
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (trigger === 0) return;
    setKey((k) => k + 1);
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 800);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9985] pointer-events-none flex items-center justify-center">
      <span
        key={key}
        className="select-none"
        style={{
          fontSize: "clamp(3rem, 12vw, 8rem)",
          fontWeight: 900,
          color,
          textShadow: `0 0 40px ${color}44, 0 4px 20px rgba(0,0,0,0.15)`,
          fontFamily: "'General Sans', system-ui, sans-serif",
          letterSpacing: "-0.03em",
          animation: "reaction-pop 0.8s ease-out forwards",
        }}
      >
        {text}
      </span>
    </div>
  );
}
