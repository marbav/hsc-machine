import { useState, useRef, lazy, Suspense } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, BarChart3, Flag, Download, Upload, ShoppingBag, FileText, Trophy } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGame, getLevel } from "@/lib/gameState";
import SaveAnimation from "./SaveAnimation";
import CheatModal from "./CheatModal";
import { playSave } from "@/lib/sounds";

const SnakeGame = lazy(() => import("./SnakeGame"));

const navItems = [
  { href: "/", label: "Practice", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/flagged", label: "Review", icon: Flag },
  { href: "/mock-exam", label: "Generate", icon: FileText },
  { href: "/themes", label: "Store", icon: ShoppingBag },
];

function HscLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="HSC Machine Logo">
      <rect width="36" height="36" rx="8" fill="currentColor" className="text-primary" />
      <rect x="8" y="9" width="3" height="18" rx="1" fill="white" opacity="0.95" />
      <rect x="14" y="9" width="3" height="18" rx="1" fill="white" opacity="0.95" />
      <rect x="8" y="15.5" width="9" height="3" rx="1" fill="white" opacity="0.95" />
      <path d="M24 27V13M24 13L20 17M24 13L28 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}

function XpBar() {
  const { level, xpInLevel, xpForNext, xp, activeTitle } = useGame();
  const [showCheats, setShowCheats] = useState(false);
  const pct = Math.round((xpInLevel / xpForNext) * 100);

  return (
    <>
      {showCheats && <CheatModal onClose={() => setShowCheats(false)} />}
      <button
        onClick={() => setShowCheats(true)}
        className="flex items-center gap-2 px-3 hover:opacity-70 transition-opacity"
        title="Click for cheat codes"
      >
        <span className="text-[10px] font-bold text-primary whitespace-nowrap flex items-center gap-1">
          <span>{activeTitle.emoji}</span>
          LVL {level}
        </span>
        <div className="w-20 sm:w-32 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[9px] text-muted-foreground hidden sm:inline">
          {xpInLevel}/{xpForNext}
        </span>
      </button>
    </>
  );
}

function SaveLoadButtons() {
  const { toast } = useToast();
  const { exportState, importState } = useGame();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveTrigger, setSaveTrigger] = useState(0);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiRequest("GET", "/api/export");
      const data = await res.json();
      // Include game state
      data.gameState = exportState();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hsc-machine-progress-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSaveTrigger((t) => t + 1);
      playSave();
      toast({
        title: "Progress saved",
        description: `${data.responses.length} responses + XP & themes exported`,
      });
    } catch (e) {
      toast({ title: "Save failed", description: "Could not export progress" });
    }
    setSaving(false);
  };

  const handleLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.responses || !Array.isArray(data.responses)) {
        toast({ title: "Invalid file", description: "This doesn't look like an HSC Machine save file" });
        setLoading(false);
        return;
      }

      const res = await apiRequest("POST", "/api/import", data);
      const result = await res.json();

      // Import game state if present
      if (data.gameState) {
        importState(data.gameState);
      }

      queryClient.invalidateQueries();

      toast({
        title: "Progress loaded",
        description: `${result.imported} responses + XP & themes imported`,
      });
    } catch (e) {
      toast({ title: "Load failed", description: "Could not import progress file" });
    }
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
    <SaveAnimation trigger={saveTrigger} />
    <div className="flex items-center gap-1">
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        title="Save progress to file"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{saving ? "..." : "Save"}</span>
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        title="Load progress from file"
      >
        <Upload className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{loading ? "..." : "Load"}</span>
      </button>
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleLoad} className="hidden" />
    </div>
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [showSnake, setShowSnake] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showSnake && (
        <Suspense fallback={null}>
          <SnakeGame onClose={() => setShowSnake(false)} />
        </Suspense>
      )}

      {/* Top navigation bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2.5 cursor-pointer group" data-testid="logo">
                <HscLogo className="w-8 h-8" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-tight leading-none">HSC MACHINE</span>
                  <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase leading-none mt-0.5">Build. Understand. Venture.</span>
                </div>
              </div>
            </Link>

            {/* Right side: XP + Save/Load + Nav */}
            <div className="flex items-center gap-1">
              <XpBar />
              <div className="w-px h-5 bg-border mx-1 hidden sm:block" />
              <SaveLoadButtons />
              <div className="w-px h-5 bg-border mx-1" />
              <nav className="flex items-center gap-0.5">
                {navItems.map(({ href, label, icon: Icon }) => {
                  const isActive = location === href;
                  const isExam = label === "Generate";
                  return (
                    <Link key={href} href={href}>
                      <button
                        data-testid={`nav-${label.toLowerCase()}`}
                        className={`
                          relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium
                          transition-all duration-200
                          ${isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : isExam && !isActive
                              ? "text-primary hover:text-foreground hover:bg-muted nav-glow"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden lg:inline">{label}</span>
                        {isExam && !isActive && (
                          <span className="absolute -top-1.5 -right-1.5 px-1 py-0 text-[8px] font-bold bg-primary text-primary-foreground rounded-full leading-tight">
                            NEW
                          </span>
                        )}
                      </button>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Questions sourced from NESA HSC past papers. Some answers may not match their question — always verify with the original paper. Some questions reference diagrams from the original.
          </p>
          <button
            onClick={() => { setShowSnake(true); }}
            className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            Created by MB
          </button>
        </div>
      </footer>
    </div>
  );
}
