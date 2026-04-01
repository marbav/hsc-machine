import { useState, useRef, useEffect } from "react";
import { X, Terminal, Zap } from "lucide-react";
import { useGame } from "@/lib/gameState";

export default function CheatModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { applyCheat } = useGame();

  useEffect(() => {
    inputRef.current?.focus();
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSubmit = () => {
    if (!code.trim()) return;
    const res = applyCheat(code);
    setResult(res);

    if (res.success) {
      setCode("");
      // Auto-close on success after a moment
      setTimeout(() => onClose(), 1500);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`relative w-[340px] bg-[#0c0c14] rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden ${shake ? "animate-shake" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-purple-400 tracking-widest uppercase font-mono">
              Cheat Codes
            </span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 bg-black/50 rounded-lg border border-purple-500/20 px-3 py-2.5 mt-2">
            <span className="text-purple-400 font-mono text-sm">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setResult(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="Enter code..."
              className="flex-1 bg-transparent text-white font-mono text-sm outline-none placeholder:text-purple-400/30"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              onClick={handleSubmit}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>

          {/* Result message */}
          {result && (
            <div className={`mt-3 text-xs font-mono px-1 ${result.success ? "text-emerald-400" : "text-red-400"}`}>
              {result.success ? "✓" : "✗"} {result.message}
            </div>
          )}

          {/* Hints */}
          <div className="mt-4 space-y-1">
            <p className="text-[10px] text-purple-400/30 font-mono">
              Codes are case-insensitive. Some codes are secret.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
