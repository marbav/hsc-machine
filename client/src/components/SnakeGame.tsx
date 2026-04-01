import { useState, useEffect, useCallback, useRef } from "react";
import { X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const GRID = 20;
const CELL = 18;
const TICK_MS = 100;

type Pos = { x: number; y: number };
type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";

const NEON_COLORS = [
  "#a855f7", "#7c3aed", "#6366f1", "#3b82f6", "#06b6d4",
  "#10b981", "#22c55e", "#eab308", "#f97316", "#ef4444",
];

function getColor(i: number) {
  return NEON_COLORS[i % NEON_COLORS.length];
}

export default function SnakeGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Pos[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Pos>({ x: 15, y: 10 });
  const [dir, setDir] = useState<Dir>("RIGHT");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>>([]);
  const [started, setStarted] = useState(false);

  const dirRef = useRef(dir);
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const gameOverRef = useRef(gameOver);
  const particlesRef = useRef(particles);

  dirRef.current = dir;
  snakeRef.current = snake;
  foodRef.current = food;
  gameOverRef.current = gameOver;
  particlesRef.current = particles;

  const spawnFood = useCallback((currentSnake: Pos[]): Pos => {
    let pos: Pos;
    do {
      pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (currentSnake.some((s) => s.x === pos.x && s.y === pos.y));
    return pos;
  }, []);

  const addParticles = useCallback((x: number, y: number) => {
    const newP = Array.from({ length: 12 }, () => ({
      x: x * CELL + CELL / 2,
      y: y * CELL + CELL / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 1,
      color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
    }));
    setParticles((prev) => [...prev, ...newP]);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (!started && !gameOver) { setStarted(true); }
      if (gameOver && (e.key === " " || e.key === "Enter")) {
        // Restart
        setSnake([{ x: 10, y: 10 }]);
        setDir("RIGHT");
        setFood(spawnFood([{ x: 10, y: 10 }]));
        setScore(0);
        setGameOver(false);
        setStarted(true);
        setParticles([]);
        return;
      }
      const d = dirRef.current;
      switch (e.key) {
        case "ArrowUp": case "w": case "W": if (d !== "DOWN") setDir("UP"); break;
        case "ArrowDown": case "s": case "S": if (d !== "UP") setDir("DOWN"); break;
        case "ArrowLeft": case "a": case "A": if (d !== "RIGHT") setDir("LEFT"); break;
        case "ArrowRight": case "d": case "D": if (d !== "LEFT") setDir("RIGHT"); break;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameOver, started, onClose, spawnFood]);

  // Touch controls
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleTouchStart = (e: TouchEvent) => {
      if (!started) setStarted(true);
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;
      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;
      const d = dirRef.current;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 20 && d !== "LEFT") setDir("RIGHT");
        else if (dx < -20 && d !== "RIGHT") setDir("LEFT");
      } else {
        if (dy > 20 && d !== "UP") setDir("DOWN");
        else if (dy < -20 && d !== "DOWN") setDir("UP");
      }
    };
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [started]);

  // Game loop
  useEffect(() => {
    if (!started || gameOver) return;
    const interval = setInterval(() => {
      const s = [...snakeRef.current];
      const head = { ...s[0] };

      switch (dirRef.current) {
        case "UP": head.y--; break;
        case "DOWN": head.y++; break;
        case "LEFT": head.x--; break;
        case "RIGHT": head.x++; break;
      }

      // Wall collision
      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
        setGameOver(true);
        setHighScore((prev) => Math.max(prev, score));
        return;
      }

      // Self collision
      if (s.some((seg) => seg.x === head.x && seg.y === head.y)) {
        setGameOver(true);
        setHighScore((prev) => Math.max(prev, score));
        return;
      }

      s.unshift(head);

      // Food collision
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        setScore((prev) => prev + 1);
        addParticles(head.x, head.y);
        setFood(spawnFood(s));
      } else {
        s.pop();
      }

      setSnake(s);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [started, gameOver, score, spawnFood, addParticles]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animFrame: number;

    const render = () => {
      ctx.clearRect(0, 0, GRID * CELL, GRID * CELL);

      // Background grid
      ctx.fillStyle = "#0a0a12";
      ctx.fillRect(0, 0, GRID * CELL, GRID * CELL);
      ctx.strokeStyle = "rgba(139, 92, 246, 0.06)";
      for (let i = 0; i <= GRID; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL, 0);
        ctx.lineTo(i * CELL, GRID * CELL);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL);
        ctx.lineTo(GRID * CELL, i * CELL);
        ctx.stroke();
      }

      // Food glow
      const f = foodRef.current;
      const gradient = ctx.createRadialGradient(
        f.x * CELL + CELL / 2, f.y * CELL + CELL / 2, 2,
        f.x * CELL + CELL / 2, f.y * CELL + CELL / 2, CELL * 1.5
      );
      gradient.addColorStop(0, "rgba(239, 68, 68, 0.4)");
      gradient.addColorStop(1, "rgba(239, 68, 68, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(f.x * CELL - CELL, f.y * CELL - CELL, CELL * 3, CELL * 3);

      // Food
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(f.x * CELL + CELL / 2, f.y * CELL + CELL / 2, CELL / 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Snake
      const s = snakeRef.current;
      s.forEach((seg, i) => {
        const color = getColor(i);
        const size = i === 0 ? CELL - 2 : CELL - 3;
        const offset = i === 0 ? 1 : 1.5;

        // Glow
        ctx.shadowColor = color;
        ctx.shadowBlur = i === 0 ? 15 : 8;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(seg.x * CELL + offset, seg.y * CELL + offset, size, size, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Particles
      const ps = particlesRef.current;
      const newPs: typeof ps = [];
      for (const p of ps) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        p.vx *= 0.95;
        p.vy *= 0.95;
        if (p.life > 0) {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          newPs.push(p);
        }
      }
      ctx.globalAlpha = 1;
      if (newPs.length !== ps.length) setParticles(newPs);

      // Game over overlay
      if (gameOverRef.current) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, GRID * CELL, GRID * CELL);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 24px 'General Sans', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", GRID * CELL / 2, GRID * CELL / 2 - 20);
        ctx.font = "14px 'General Sans', system-ui, sans-serif";
        ctx.fillStyle = "#a78bfa";
        ctx.fillText(`Score: ${score}`, GRID * CELL / 2, GRID * CELL / 2 + 10);
        ctx.fillStyle = "#666";
        ctx.font = "12px 'General Sans', system-ui, sans-serif";
        ctx.fillText("Press SPACE to restart", GRID * CELL / 2, GRID * CELL / 2 + 40);
      }

      // Start screen
      if (!started && !gameOverRef.current) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, GRID * CELL, GRID * CELL);
        ctx.fillStyle = "#a855f7";
        ctx.font = "bold 20px 'General Sans', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🐍 SNAKE", GRID * CELL / 2, GRID * CELL / 2 - 15);
        ctx.fillStyle = "#888";
        ctx.font = "12px 'General Sans', system-ui, sans-serif";
        ctx.fillText("Arrow keys or WASD to play", GRID * CELL / 2, GRID * CELL / 2 + 15);
        ctx.fillText("Swipe on mobile", GRID * CELL / 2, GRID * CELL / 2 + 35);
      }

      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [started, score]);

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-[#0a0a12] rounded-2xl p-4 shadow-2xl border border-purple-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-purple-400 tracking-wider uppercase">Snake</span>
            <span className="text-xs text-purple-300/60">Score: {score}</span>
            {highScore > 0 && (
              <span className="text-xs text-amber-400/60 flex items-center gap-1">
                <Trophy className="w-3 h-3" /> {highScore}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={GRID * CELL}
          height={GRID * CELL}
          className="rounded-lg"
          style={{ touchAction: "none" }}
        />

        <p className="text-[10px] text-purple-400/40 text-center mt-2">
          ESC to close
        </p>
      </div>
    </div>
  );
}
