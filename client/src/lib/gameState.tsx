import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import glassMountainUrl from "@assets/glass-bg.jpg";
import glassAuroraUrl from "@assets/glass-aurora.jpg";
import glassBeachUrl from "@assets/glass-beach.jpg";
import { ANIMATIONS, type AnimationDef } from "./animations";
import { TITLES, type TitleDef } from "./titles";
import { ACHIEVEMENTS, type AchievementDef } from "./achievements";

// ── Theme definitions ──
export interface ThemeDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlockLevel: number;
  colors: {
    primary: string;       // HSL without hsl() wrapper, e.g. "255 65% 52%"
    background: string;
    foreground: string;
    card: string;
    muted: string;
    mutedForeground: string;
    border: string;
    accent: string;
  };
  font: string;            // CSS font-family
  dark?: boolean;
}

export const THEMES: ThemeDef[] = [
  // ── FREE ──
  {
    id: "default",
    name: "Violet",
    emoji: "💜",
    description: "The classic HSC Machine look",
    unlockLevel: 0,
    colors: {
      primary: "255 65% 52%",
      background: "30 20% 98%",
      foreground: "240 10% 10%",
      card: "0 0% 100%",
      muted: "240 5% 93%",
      mutedForeground: "240 4% 46%",
      border: "240 6% 90%",
      accent: "255 65% 52%",
    },
    font: "'General Sans', system-ui, sans-serif",
  },
  // ── LEVEL 2 ──
  {
    id: "midnight",
    name: "Midnight",
    emoji: "🌙",
    description: "Crisp dark mode for late night grinding",
    unlockLevel: 2,
    colors: {
      primary: "220 90% 65%",
      background: "225 25% 6%",
      foreground: "210 20% 93%",
      card: "225 20% 10%",
      muted: "225 15% 15%",
      mutedForeground: "220 15% 55%",
      border: "225 15% 17%",
      accent: "220 90% 65%",
    },
    font: "'Outfit', system-ui, sans-serif",
    dark: true,
  },
  // ── LEVEL 3 ──
  {
    id: "ocean",
    name: "Deep Blue",
    emoji: "🌊",
    description: "Calm ocean depths, teal accents",
    unlockLevel: 3,
    colors: {
      primary: "185 80% 40%",
      background: "195 30% 96%",
      foreground: "200 25% 8%",
      card: "0 0% 100%",
      muted: "195 20% 91%",
      mutedForeground: "195 15% 42%",
      border: "195 18% 86%",
      accent: "170 75% 35%",
    },
    font: "'Satoshi', system-ui, sans-serif",
  },
  // ── LEVEL 4 ──
  {
    id: "ember",
    name: "Ember",
    emoji: "🔥",
    description: "Fiery reds and warm charcoal",
    unlockLevel: 4,
    colors: {
      primary: "10 85% 55%",
      background: "15 8% 7%",
      foreground: "15 15% 90%",
      card: "15 8% 11%",
      muted: "15 8% 16%",
      mutedForeground: "15 10% 50%",
      border: "15 8% 18%",
      accent: "30 90% 55%",
    },
    font: "'Clash Display', system-ui, sans-serif",
    dark: true,
  },
  // ── LEVEL 5 ──
  {
    id: "sakura",
    name: "Sakura",
    emoji: "🌸",
    description: "Soft blush pink, elegant serif accents",
    unlockLevel: 5,
    colors: {
      primary: "340 65% 58%",
      background: "345 40% 97%",
      foreground: "340 20% 12%",
      card: "345 30% 99%",
      muted: "340 25% 93%",
      mutedForeground: "340 12% 48%",
      border: "340 20% 90%",
      accent: "320 60% 52%",
    },
    font: "'Crimson Pro', Georgia, serif",
  },
  // ── LEVEL 6 ──
  {
    id: "forest",
    name: "Evergreen",
    emoji: "🌲",
    description: "Deep forest greens with earthy warmth",
    unlockLevel: 6,
    colors: {
      primary: "155 55% 35%",
      background: "150 10% 6%",
      foreground: "140 15% 88%",
      card: "150 10% 10%",
      muted: "150 8% 15%",
      mutedForeground: "150 10% 48%",
      border: "150 8% 17%",
      accent: "85 50% 50%",
    },
    font: "'Cabinet Grotesk', system-ui, sans-serif",
    dark: true,
  },
  // ── LEVEL 7 ──
  {
    id: "arctic",
    name: "Arctic",
    emoji: "❄️",
    description: "Ice white, pale blue, frosty clean",
    unlockLevel: 7,
    colors: {
      primary: "210 70% 55%",
      background: "210 40% 98%",
      foreground: "215 30% 12%",
      card: "210 50% 100%",
      muted: "210 30% 94%",
      mutedForeground: "210 15% 50%",
      border: "210 25% 90%",
      accent: "195 80% 48%",
    },
    font: "'Space Grotesk', system-ui, sans-serif",
  },
  // ── LEVEL 8 ──
  {
    id: "sunset",
    name: "Golden Hour",
    emoji: "🌅",
    description: "Warm amber sunset glow on dark canvas",
    unlockLevel: 8,
    colors: {
      primary: "38 95% 55%",
      background: "25 15% 7%",
      foreground: "35 20% 90%",
      card: "25 12% 11%",
      muted: "25 10% 16%",
      mutedForeground: "30 12% 50%",
      border: "25 10% 18%",
      accent: "15 85% 55%",
    },
    font: "'Boska', Georgia, serif",
    dark: true,
  },
  // ── LEVEL 9 ──
  {
    id: "lavender",
    name: "Lavender Haze",
    emoji: "🪷",
    description: "Soft purple pastels, dreamy and light",
    unlockLevel: 9,
    colors: {
      primary: "270 55% 60%",
      background: "270 30% 97%",
      foreground: "270 15% 15%",
      card: "270 25% 99%",
      muted: "270 20% 93%",
      mutedForeground: "270 12% 48%",
      border: "270 18% 89%",
      accent: "290 55% 55%",
    },
    font: "'Outfit', system-ui, sans-serif",
  },
  // ── LEVEL 10 ──
  {
    id: "hacker",
    name: "Terminal",
    emoji: "💻",
    description: "Green phosphor on black. Old school.",
    unlockLevel: 10,
    colors: {
      primary: "120 100% 42%",
      background: "0 0% 3%",
      foreground: "120 50% 72%",
      card: "0 0% 6%",
      muted: "0 0% 10%",
      mutedForeground: "120 25% 38%",
      border: "120 15% 12%",
      accent: "120 100% 42%",
    },
    font: "'Space Mono', 'Courier New', monospace",
    dark: true,
  },
  // ── LEVEL 11 ──
  {
    id: "rose",
    name: "Rosé",
    emoji: "🍷",
    description: "Sophisticated dusty rose and warm grey",
    unlockLevel: 11,
    colors: {
      primary: "350 50% 52%",
      background: "20 15% 96%",
      foreground: "350 10% 15%",
      card: "0 0% 100%",
      muted: "350 12% 92%",
      mutedForeground: "350 8% 48%",
      border: "350 10% 88%",
      accent: "10 45% 50%",
    },
    font: "'Zodiak', Georgia, serif",
  },
  // ── LEVEL 12 ──
  {
    id: "neon",
    name: "Neon Nights",
    emoji: "⚡",
    description: "Hot pink and electric blue cyberpunk",
    unlockLevel: 12,
    colors: {
      primary: "325 100% 60%",
      background: "250 20% 5%",
      foreground: "0 0% 93%",
      card: "250 18% 9%",
      muted: "250 12% 14%",
      mutedForeground: "250 10% 52%",
      border: "325 25% 16%",
      accent: "190 100% 50%",
    },
    font: "'Syne', system-ui, sans-serif",
    dark: true,
  },
  // ── LEVEL 13 ──
  {
    id: "mono",
    name: "Monochrome",
    emoji: "◼️",
    description: "Pure black and white. Zero distraction.",
    unlockLevel: 13,
    colors: {
      primary: "0 0% 15%",
      background: "0 0% 100%",
      foreground: "0 0% 5%",
      card: "0 0% 98%",
      muted: "0 0% 94%",
      mutedForeground: "0 0% 45%",
      border: "0 0% 88%",
      accent: "0 0% 15%",
    },
    font: "'Archivo Black', 'Impact', sans-serif",
  },
  // ── LEVEL 14 ──
  {
    id: "retrowave",
    name: "Retrowave",
    emoji: "🌆",
    description: "80s synthwave purple sunset grid",
    unlockLevel: 14,
    colors: {
      primary: "290 90% 60%",
      background: "260 30% 5%",
      foreground: "280 20% 90%",
      card: "260 25% 9%",
      muted: "260 18% 14%",
      mutedForeground: "280 15% 52%",
      border: "290 20% 16%",
      accent: "45 100% 55%",
    },
    font: "'Clash Display', system-ui, sans-serif",
    dark: true,
  },
  // ── LEVEL 15 ──
  {
    id: "gold",
    name: "Gold Rush",
    emoji: "👑",
    description: "Black and gold luxury. You earned this.",
    unlockLevel: 15,
    colors: {
      primary: "42 90% 50%",
      background: "40 8% 6%",
      foreground: "40 20% 90%",
      card: "40 8% 10%",
      muted: "40 6% 15%",
      mutedForeground: "40 15% 48%",
      border: "42 15% 17%",
      accent: "42 90% 50%",
    },
    font: "'DM Serif Display', Georgia, serif",
    dark: true,
  },
  // ── SECRET: MARCUS (cheat code only) ──
  {
    id: "marcus",
    name: "MARCUS",
    emoji: "🔮",
    description: "The secret theme. You know the code.",
    unlockLevel: 999,
    colors: {
      primary: "160 100% 45%",
      background: "220 30% 4%",
      foreground: "160 30% 90%",
      card: "220 25% 8%",
      muted: "220 18% 13%",
      mutedForeground: "160 20% 48%",
      border: "160 20% 14%",
      accent: "280 80% 65%",
    },
    font: "'JetBrains Mono', 'Courier New', monospace",
    dark: true,
  },
  // ── LEVEL 16: Glass Mountain Sunset ──
  {
    id: "glass-mountain",
    name: "Glass: Mountain",
    emoji: "🏔️",
    description: "Purple mountain sunset behind frosted glass",
    unlockLevel: 16,
    colors: {
      primary: "270 70% 65%",
      background: "260 25% 10%",
      foreground: "0 0% 95%",
      card: "260 20% 14%",
      muted: "260 15% 18%",
      mutedForeground: "260 15% 60%",
      border: "270 20% 25%",
      accent: "340 70% 60%",
    },
    font: "'Satoshi', system-ui, sans-serif",
    dark: true,
  },
  // ── LEVEL 17: Glass Aurora ──
  {
    id: "glass-aurora",
    name: "Glass: Aurora",
    emoji: "🌌",
    description: "Northern lights dancing behind frosted panels",
    unlockLevel: 17,
    colors: {
      primary: "160 80% 50%",
      background: "220 30% 8%",
      foreground: "0 0% 95%",
      card: "220 25% 12%",
      muted: "220 18% 16%",
      mutedForeground: "160 20% 55%",
      border: "160 25% 22%",
      accent: "280 60% 60%",
    },
    font: "'Space Grotesk', system-ui, sans-serif",
    dark: true,
  },
  // ── LEVEL 18: Glass Beach ──
  {
    id: "glass-beach",
    name: "Glass: Beach",
    emoji: "🏖️",
    description: "Tropical sunset paradise behind frosted glass",
    unlockLevel: 18,
    colors: {
      primary: "25 90% 55%",
      background: "220 20% 10%",
      foreground: "0 0% 95%",
      card: "220 15% 13%",
      muted: "220 12% 17%",
      mutedForeground: "30 20% 58%",
      border: "25 20% 22%",
      accent: "340 70% 55%",
    },
    font: "'Outfit', system-ui, sans-serif",
    dark: true,
  },
  // ── SECRET: GLASS (cheat code only — unlocks all glass themes) ──
  {
    id: "glass",
    name: "Glass: Original",
    emoji: "💎",
    description: "The original frosted glass. Cheat code only.",
    unlockLevel: 999,
    colors: {
      primary: "210 80% 60%",
      background: "220 25% 10%",
      foreground: "0 0% 95%",
      card: "220 20% 14%",
      muted: "220 15% 18%",
      mutedForeground: "210 15% 60%",
      border: "210 20% 25%",
      accent: "260 70% 65%",
    },
    font: "'Satoshi', system-ui, sans-serif",
    dark: true,
  },
];

// ── XP & Leveling ──
const XP_PER_QUESTION = 10;
const XP_BONUS_GOOD_RATING = 5;  // bonus for rating 4+
const XP_PER_LEVEL = 100;        // XP needed per level (flat for simplicity)

export function getLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL);
}

export function getXpInLevel(xp: number): number {
  return xp % XP_PER_LEVEL;
}

export function getXpForNextLevel(): number {
  return XP_PER_LEVEL;
}

// ── Context ──
interface GameState {
  xp: number;
  activeThemeId: string;
  unlockedThemeIds: string[];
  activeAnimationId: string;
  unlockedAnimationIds: string[];
  activeTitleId: string;
  unlockedTitleIds: string[];
  unlockedAchievementIds: string[];
  totalQuestionsAnswered: number;
  subjectsTriedIds: string[];
  consecutiveEasyCount: number;
}

interface GameContextType {
  xp: number;
  level: number;
  xpInLevel: number;
  xpForNext: number;
  activeTheme: ThemeDef;
  unlockedThemes: string[];
  activeAnimation: AnimationDef;
  unlockedAnimations: string[];
  activeTitle: TitleDef;
  unlockedTitles: string[];
  setTitle: (titleId: string) => void;
  allTitles: TitleDef[];
  addXp: (amount: number) => void;
  earnQuestionXp: (selfRating?: number) => void;
  setTheme: (themeId: string) => void;
  setAnimation: (animId: string) => void;
  allThemes: ThemeDef[];
  allAnimations: AnimationDef[];
  exportState: () => GameState;
  importState: (state: GameState) => void;
  applyCheat: (code: string) => { success: boolean; message: string };
  // Achievements
  unlockedAchievements: string[];
  allAchievements: AchievementDef[];
  unlockAchievement: (id: string) => boolean; // returns true if newly unlocked
  totalQuestionsAnswered: number;
  trackQuestion: (subject: string, difficulty?: string, selfRating?: number, elapsedSecs?: number) => void;
  trackMockExam: () => void;
  trackSnakeEasterEgg: () => void;
  // Latest achievement (for toast notification)
  latestAchievement: AchievementDef | null;
  clearLatestAchievement: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be inside GameProvider");
  return ctx;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [xp, setXp] = useState(0);
  const [activeThemeId, setActiveThemeId] = useState("default");
  const [unlockedThemeIds, setUnlockedThemeIds] = useState<string[]>(["default"]);
  const [activeAnimationId, setActiveAnimationId] = useState("default");
  const [unlockedAnimationIds, setUnlockedAnimationIds] = useState<string[]>(["default"]);
  const [activeTitleId, setActiveTitleId] = useState("rookie");
  const [unlockedTitleIds, setUnlockedTitleIds] = useState<string[]>(["rookie"]);
  const [themeTransition, setThemeTransition] = useState(false);
  const [unlockedAchievementIds, setUnlockedAchievementIds] = useState<string[]>([]);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);
  const [subjectsTriedIds, setSubjectsTriedIds] = useState<string[]>([]);
  const [consecutiveEasyCount, setConsecutiveEasyCount] = useState(0);
  const [latestAchievement, setLatestAchievement] = useState<AchievementDef | null>(null);
  const allSubjectsRef = useRef<string[]>([]);

  const level = getLevel(xp);
  const xpInLevel = getXpInLevel(xp);
  const xpForNext = getXpForNextLevel();
  const activeTheme = THEMES.find((t) => t.id === activeThemeId) || THEMES[0];
  const activeAnimation = ANIMATIONS.find((a) => a.id === activeAnimationId) || ANIMATIONS[0];
  const activeTitle = TITLES.find((t) => t.id === activeTitleId) || TITLES[0];

  // Check for newly unlocked themes and animations when XP changes
  useEffect(() => {
    const newThemeUnlocks: string[] = [];
    for (const theme of THEMES) {
      if (level >= theme.unlockLevel && !unlockedThemeIds.includes(theme.id)) {
        newThemeUnlocks.push(theme.id);
      }
    }
    if (newThemeUnlocks.length > 0) {
      setUnlockedThemeIds((prev) => [...prev, ...newThemeUnlocks]);
    }
    const newAnimUnlocks: string[] = [];
    for (const anim of ANIMATIONS) {
      if (level >= anim.unlockLevel && !unlockedAnimationIds.includes(anim.id)) {
        newAnimUnlocks.push(anim.id);
      }
    }
    if (newAnimUnlocks.length > 0) {
      setUnlockedAnimationIds((prev) => [...prev, ...newAnimUnlocks]);
    }
    const newTitleUnlocks: string[] = [];
    for (const title of TITLES) {
      if (level >= title.unlockLevel && !unlockedTitleIds.includes(title.id)) {
        newTitleUnlocks.push(title.id);
      }
    }
    if (newTitleUnlocks.length > 0) {
      setUnlockedTitleIds((prev) => [...prev, ...newTitleUnlocks]);
    }
  }, [level, unlockedThemeIds, unlockedAnimationIds, unlockedTitleIds]);

  // Apply theme to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    const c = activeTheme.colors;
    root.style.setProperty("--primary", c.primary);
    root.style.setProperty("--background", c.background);
    root.style.setProperty("--foreground", c.foreground);
    root.style.setProperty("--card", c.card);
    root.style.setProperty("--card-foreground", c.foreground);
    root.style.setProperty("--muted", c.muted);
    root.style.setProperty("--muted-foreground", c.mutedForeground);
    root.style.setProperty("--border", c.border);
    root.style.setProperty("--accent", c.accent);
    root.style.setProperty("--accent-foreground", c.foreground);
    root.style.setProperty("--ring", c.primary);
    root.style.setProperty("--primary-foreground", activeTheme.dark ? "0 0% 100%" : "0 0% 100%");
    root.style.setProperty("--popover", c.card);
    root.style.setProperty("--popover-foreground", c.foreground);
    root.style.setProperty("--secondary", c.muted);
    root.style.setProperty("--secondary-foreground", c.foreground);
    root.style.setProperty("--destructive", "0 84% 60%");
    root.style.setProperty("--destructive-foreground", "0 0% 98%");
    root.style.setProperty("--input", c.border);
    document.body.style.fontFamily = activeTheme.font;
    // Apply theme-specific body classes and backgrounds
    document.body.classList.remove("theme-glass-base", "theme-marcus");
    const glassBgMap: Record<string, string> = {
      "glass": glassMountainUrl,
      "glass-mountain": glassMountainUrl,
      "glass-aurora": glassAuroraUrl,
      "glass-beach": glassBeachUrl,
    };
    const isGlass = activeTheme.id in glassBgMap;
    if (isGlass) {
      document.body.classList.add("theme-glass-base");
      document.body.style.backgroundImage = `url(${glassBgMap[activeTheme.id]})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
    } else {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      document.body.style.backgroundPosition = "";
      document.body.style.backgroundAttachment = "";
    }
    if (activeTheme.id === "marcus") document.body.classList.add("theme-marcus");
  }, [activeTheme]);

  const addXp = useCallback((amount: number) => {
    setXp((prev) => prev + amount);
  }, []);

  const earnQuestionXp = useCallback((selfRating?: number) => {
    let earned = XP_PER_QUESTION;
    if (selfRating && selfRating >= 4) earned += XP_BONUS_GOOD_RATING;
    addXp(earned);
  }, [addXp]);

  const setAnimation = useCallback((animId: string) => {
    if (!unlockedAnimationIds.includes(animId)) return;
    setActiveAnimationId(animId);
  }, [unlockedAnimationIds]);

  const setTitle = useCallback((titleId: string) => {
    if (!unlockedTitleIds.includes(titleId)) return;
    setActiveTitleId(titleId);
  }, [unlockedTitleIds]);

  const setTheme = useCallback((themeId: string) => {
    if (!unlockedThemeIds.includes(themeId)) return;
    // Trigger transition animation
    setThemeTransition(true);
    setTimeout(() => {
      setActiveThemeId(themeId);
      setTimeout(() => setThemeTransition(false), 400);
    }, 200);
  }, [unlockedThemeIds]);

  // Achievement system
  const unlockAchievement = useCallback((id: string): boolean => {
    if (unlockedAchievementIds.includes(id)) return false;
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def) return false;
    setUnlockedAchievementIds(prev => [...prev, id]);
    setLatestAchievement(def);
    // Auto-clear after 4 seconds
    setTimeout(() => setLatestAchievement(null), 4000);
    return true;
  }, [unlockedAchievementIds]);

  const clearLatestAchievement = useCallback(() => setLatestAchievement(null), []);

  const trackQuestion = useCallback((subject: string, difficulty?: string, selfRating?: number, elapsedSecs?: number) => {
    setTotalQuestionsAnswered(prev => {
      const next = prev + 1;
      // First question
      if (next === 1) unlockAchievement("first_question");
      if (next === 50) unlockAchievement("fifty_questions");
      if (next === 100) unlockAchievement("hundred_questions");
      if (next === 500) unlockAchievement("five_hundred");
      return next;
    });

    // Track subjects
    setSubjectsTriedIds(prev => {
      if (prev.includes(subject)) return prev;
      const next = [...prev, subject];
      // Check if all 7 subjects tried
      if (next.length >= 7) unlockAchievement("all_subjects");
      return next;
    });

    // Self rating
    if (selfRating === 5) unlockAchievement("five_star");

    // Speed demon
    if (elapsedSecs !== undefined && elapsedSecs < 30 && elapsedSecs > 0) {
      unlockAchievement("speed_demon");
    }

    // Difficulty tracking
    if (difficulty === "easy") {
      setConsecutiveEasyCount(prev => {
        const next = prev + 1;
        if (next >= 5) unlockAchievement("all_easy");
        return next;
      });
    } else if (difficulty) {
      setConsecutiveEasyCount(0);
    }

    // Time-based
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) unlockAchievement("night_owl");
    if (hour >= 4 && hour < 6) unlockAchievement("early_bird");
  }, [unlockAchievement]);

  const trackMockExam = useCallback(() => {
    unlockAchievement("mock_exam");
  }, [unlockAchievement]);

  const trackSnakeEasterEgg = useCallback(() => {
    unlockAchievement("snake_master");
  }, [unlockAchievement]);

  // Check level-based achievements
  useEffect(() => {
    if (level >= 10) unlockAchievement("level_ten");
  }, [level, unlockAchievement]);

  // Check glass theme achievement
  useEffect(() => {
    const glassIds = ["glass", "glass-mountain", "glass-aurora", "glass-beach"];
    if (unlockedThemeIds.some(id => glassIds.includes(id))) {
      unlockAchievement("glass_theme");
    }
  }, [unlockedThemeIds, unlockAchievement]);

  const exportState = useCallback((): GameState => ({
    xp,
    activeThemeId,
    unlockedThemeIds,
    activeAnimationId,
    unlockedAnimationIds,
    activeTitleId,
    unlockedTitleIds,
    unlockedAchievementIds,
    totalQuestionsAnswered,
    subjectsTriedIds,
    consecutiveEasyCount,
  }), [xp, activeThemeId, unlockedThemeIds, activeAnimationId, unlockedAnimationIds, activeTitleId, unlockedTitleIds, unlockedAchievementIds, totalQuestionsAnswered, subjectsTriedIds, consecutiveEasyCount]);

  const importState = useCallback((state: GameState) => {
    if (state.xp !== undefined) setXp(state.xp);
    if (state.activeThemeId) setActiveThemeId(state.activeThemeId);
    if (state.unlockedThemeIds) setUnlockedThemeIds(state.unlockedThemeIds);
    if (state.activeAnimationId) setActiveAnimationId(state.activeAnimationId);
    if (state.unlockedAnimationIds) setUnlockedAnimationIds(state.unlockedAnimationIds);
    if (state.activeTitleId) setActiveTitleId(state.activeTitleId);
    if (state.unlockedTitleIds) setUnlockedTitleIds(state.unlockedTitleIds);
    if (state.unlockedAchievementIds) setUnlockedAchievementIds(state.unlockedAchievementIds);
    if (state.totalQuestionsAnswered !== undefined) setTotalQuestionsAnswered(state.totalQuestionsAnswered);
    if (state.subjectsTriedIds) setSubjectsTriedIds(state.subjectsTriedIds);
    if (state.consecutiveEasyCount !== undefined) setConsecutiveEasyCount(state.consecutiveEasyCount);
  }, []);

  const applyCheat = useCallback((code: string): { success: boolean; message: string } => {
    const normalised = code.toLowerCase().trim();
    // Track cheat code achievement
    unlockAchievement("cheat_code");
    switch (normalised) {
      case "themes": {
        const allIds = THEMES.map((t) => t.id);
        setUnlockedThemeIds(allIds);
        return { success: true, message: "All themes unlocked." };
      }
      case "marcus": {
        setUnlockedThemeIds((prev) => {
          if (prev.includes("marcus")) return prev;
          return [...prev, "marcus"];
        });
        setActiveThemeId("marcus");
        setThemeTransition(true);
        setTimeout(() => setThemeTransition(false), 600);
        return { success: true, message: "Secret theme activated. Welcome, Marcus." };
      }
      case "glass": {
        const glassIds = ["glass", "glass-mountain", "glass-aurora", "glass-beach"];
        setUnlockedThemeIds((prev) => {
          const next = new Set(prev);
          glassIds.forEach(id => next.add(id));
          return Array.from(next);
        });
        setActiveThemeId("glass-mountain");
        setThemeTransition(true);
        setTimeout(() => setThemeTransition(false), 600);
        return { success: true, message: "All glass themes unlocked. Mountains, Aurora, Beach — they're all yours." };
      }
      case "xp": {
        setXp((prev) => prev + 500);
        return { success: true, message: "+500 XP added." };
      }
      case "animations": {
        const allAnimIds = ANIMATIONS.map((a) => a.id);
        setUnlockedAnimationIds(allAnimIds);
        return { success: true, message: "All animations unlocked." };
      }
      case "titles": {
        const allTitleIds = TITLES.map((t) => t.id);
        setUnlockedTitleIds(allTitleIds);
        return { success: true, message: "All titles unlocked. Including BAVARO." };
      }
      case "achievements": {
        const allAchIds = ACHIEVEMENTS.map(a => a.id);
        setUnlockedAchievementIds(allAchIds);
        return { success: true, message: "All achievements unlocked." };
      }
      case "everything": {
        setXp(prev => prev + 2000);
        setUnlockedThemeIds(THEMES.map(t => t.id));
        setUnlockedAnimationIds(ANIMATIONS.map(a => a.id));
        setUnlockedTitleIds(TITLES.map(t => t.id));
        setUnlockedAchievementIds(ACHIEVEMENTS.map(a => a.id));
        return { success: true, message: "Everything unlocked. You have it all." };
      }
      case "reset": {
        setXp(0);
        setActiveThemeId("default");
        setUnlockedThemeIds(["default"]);
        setActiveAnimationId("default");
        setUnlockedAnimationIds(["default"]);
        setActiveTitleId("rookie");
        setUnlockedTitleIds(["rookie"]);
        setUnlockedAchievementIds([]);
        setTotalQuestionsAnswered(0);
        setSubjectsTriedIds([]);
        setConsecutiveEasyCount(0);
        return { success: true, message: "Progress reset." };
      }
      default:
        return { success: false, message: "Unknown cheat code." };
    }
  }, []);

  return (
    <GameContext.Provider
      value={{
        xp, level, xpInLevel, xpForNext,
        activeTheme, unlockedThemes: unlockedThemeIds,
        addXp, earnQuestionXp, setTheme, setAnimation, setTitle,
        activeAnimation, unlockedAnimations: unlockedAnimationIds,
        activeTitle, unlockedTitles: unlockedTitleIds,
        allThemes: THEMES, allAnimations: ANIMATIONS, allTitles: TITLES,
        exportState, importState, applyCheat,
        unlockedAchievements: unlockedAchievementIds,
        allAchievements: ACHIEVEMENTS,
        unlockAchievement,
        totalQuestionsAnswered,
        trackQuestion,
        trackMockExam,
        trackSnakeEasterEgg,
        latestAchievement,
        clearLatestAchievement,
      }}
    >
      {/* Theme transition overlay */}
      {themeTransition && (
        <div className="fixed inset-0 z-[9997] pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: `hsl(${activeTheme.colors.primary} / 0.15)`,
              animation: "theme-flash 0.6s ease-out forwards",
            }}
          />
        </div>
      )}
      {children}
    </GameContext.Provider>
  );
}
