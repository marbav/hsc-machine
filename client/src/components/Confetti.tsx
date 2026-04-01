import { useEffect, useRef } from "react";

const COLORS = ["#a855f7", "#7c3aed", "#3b82f6", "#10b981", "#eab308", "#ef4444", "#ec4899", "#06b6d4"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  width: number;
  height: number;
  color: string;
  life: number;
}

export default function Confetti({ trigger }: { trigger: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animFrame = useRef<number>(0);

  useEffect(() => {
    if (trigger === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Spawn particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < 80; i++) {
      newParticles.push({
        x: canvas.width * (0.3 + Math.random() * 0.4),
        y: canvas.height * 0.3,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 14 - 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        width: 6 + Math.random() * 6,
        height: 4 + Math.random() * 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1,
      });
    }
    particles.current = newParticles;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const ps = particles.current;
      const alive: Particle[] = [];

      for (const p of ps) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // gravity
        p.vx *= 0.99;
        p.rotation += p.rotationSpeed;
        p.life -= 0.008;

        if (p.life > 0 && p.y < canvas.height + 20) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.min(p.life, 1);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
          ctx.restore();
          alive.push(p);
        }
      }

      particles.current = alive;

      if (alive.length > 0) {
        animFrame.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animFrame.current = requestAnimationFrame(render);

    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [trigger]);

  if (trigger === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9990] pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
