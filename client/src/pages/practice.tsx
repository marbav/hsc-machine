import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/gameState";
import Confetti from "@/components/Confetti";
import ReactionOverlay from "@/components/ReactionOverlay";
import FlagAnimation from "@/components/FlagAnimation";
import { playWhoosh, playConfetti, playFlag, playUnflag } from "@/lib/sounds";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  Flag,
  Eye,
  EyeOff,
  Star,
  Gauge,
  Calendar,
  Hash,
  Loader2,
  Shuffle,
  BookOpen,
  Check,
  X,
  ChevronDown,
  Keyboard,
  Quote,
  FileText,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { Link } from "wouter";

import { useToast } from "@/hooks/use-toast";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { getDailyQuote } from "@/lib/quotes";
import type { Question, Response as UserResponse } from "@shared/schema";

// Render question text with markdown table support
function QuestionText({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    if (
      lines[i]?.includes("|") &&
      i + 1 < lines.length &&
      /^[\s|:-]+$/.test(lines[i + 1])
    ) {
      const tableLines: string[] = [];
      const startIdx = i;
      while (i < lines.length && lines[i]?.includes("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const parseRow = (row: string) =>
        row.split("|").map((c) => c.trim()).filter((c) => c && !/^[-:]+$/.test(c));
      const headers = parseRow(tableLines[0]);
      const dataRows = tableLines.slice(2).map(parseRow);

      elements.push(
        <div key={`table-${startIdx}`} className="my-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/50">
                {headers.map((h, hi) => (
                  <th key={hi} className="border border-border px-3 py-2 text-left font-semibold text-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "" : "bg-muted/20"}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-border px-3 py-2 text-foreground">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      const line = lines[i];
      elements.push(
        <p key={`line-${i}`} className={`${line?.startsWith("(") ? "ml-4" : ""} ${line?.startsWith('"') ? "font-medium" : ""} text-foreground leading-relaxed`}>
          {line || <br />}
        </p>
      );
      i++;
    }
  }
  return <>{elements}</>;
}

// Multi-select chip component
function MultiChipSelect({
  label,
  options,
  selected,
  onToggle,
  onClear,
  disabled,
  testId,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (val: string) => void;
  onClear: () => void;
  disabled?: boolean;
  testId?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleOptions = expanded ? options : options.slice(0, 8);
  const hasMore = options.length > 8;

  if (disabled || options.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        <p className="text-xs text-muted-foreground italic">Select subjects first</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid={testId}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        {selected.size > 0 && (
          <button
            onClick={onClear}
            className="text-[10px] text-primary hover:text-primary/80 font-medium flex items-center gap-0.5"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visibleOptions.map((opt) => {
          const isSelected = selected.has(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={`
                px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150
                ${isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                }
              `}
            >
              {isSelected && <Check className="w-3 h-3 inline mr-1" />}
              {opt}
            </button>
          );
        })}
        {hasMore && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-border text-muted-foreground hover:text-foreground flex items-center gap-0.5"
          >
            +{options.length - 8} more <ChevronDown className="w-3 h-3" />
          </button>
        )}
        {hasMore && expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-border text-muted-foreground hover:text-foreground"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
}

// Help modal section component
function Section({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
        <span className="text-base">{emoji}</span> {title}
      </h4>
      <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed pl-7">
        {children}
      </div>
    </div>
  );
}

const difficultyColors = {
  easy: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  hard: "bg-rose-100 text-rose-700 border-rose-200",
};

const ratingLabels = ["", "Poor", "Below Average", "Average", "Good", "Excellent"];

export default function PracticePage() {
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState<string>("");
  const [currentRating, setCurrentRating] = useState<number>(0);
  const [isFlagged, setIsFlagged] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [ripple, setRipple] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [stopwatchStart, setStopwatchStart] = useState<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [lastTime, setLastTime] = useState<number | null>(null);
  const [reaction, setReaction] = useState<{ text: string; color: string; trigger: number }>({ text: "", color: "", trigger: 0 });
  const [flagAnim, setFlagAnim] = useState<{ trigger: number; unflag: boolean }>({ trigger: 0, unflag: false });
  const rippleKey = useRef(0);
  const { toast } = useToast();
  const { earnQuestionXp, activeAnimation, trackQuestion, unlockAchievement } = useGame();
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const dailyQuote = useMemo(() => getDailyQuote(), []);

  // Fetch subjects
  const { data: subjects = [] } = useQuery<string[]>({
    queryKey: ["/api/subjects"],
  });

  // Fetch topics for selected subjects
  const subjectsKey = Array.from(selectedSubjects).sort().join(",");
  const { data: availableTopics = [] } = useQuery<string[]>({
    queryKey: ["/api/subjects", subjectsKey, "topics"],
    queryFn: async () => {
      if (!subjectsKey) return [];
      const res = await apiRequest("GET", `/api/subjects/${encodeURIComponent(subjectsKey)}/topics`);
      return res.json();
    },
    enabled: selectedSubjects.size > 0,
  });

  // Build query params for random question
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedSubjects.size > 0) {
      params.set("subjects", Array.from(selectedSubjects).join(","));
    }
    if (selectedTopics.size > 0) {
      params.set("topics", Array.from(selectedTopics).join(","));
    }
    return params.toString();
  }, [selectedSubjects, selectedTopics]);

  // Fetch random question
  const {
    data: questionData,
    isLoading,
    refetch,
  } = useQuery<{ question: Question; response: UserResponse | null }>({
    queryKey: ["/api/questions/random", queryParams],
    queryFn: async () => {
      let url = "/api/questions/random";
      if (queryParams) url += `?${queryParams}`;
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  // Reset state when question changes
  useEffect(() => {
    if (questionData) {
      setShowAnswer(false);
      setHasSubmitted(false);
      if (questionData.response) {
        setCurrentDifficulty(questionData.response.difficulty || "");
        setCurrentRating(questionData.response.selfRating || 0);
        setIsFlagged(!!questionData.response.flagged);
        if (questionData.response.difficulty || questionData.response.selfRating) {
          setHasSubmitted(true);
        }
      } else {
        setCurrentDifficulty("");
        setCurrentRating(0);
        setIsFlagged(false);
      }
    }
  }, [questionData]);

  // Save response mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/responses", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/responses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/responses/flagged"] });
    },
  });

  const handleSaveResponse = (overrides?: any) => {
    if (!questionData?.question) return;
    const data = {
      questionId: questionData.question.id,
      difficulty: overrides?.difficulty ?? (currentDifficulty || null),
      selfRating: overrides?.selfRating ?? (currentRating || null),
      flagged: overrides?.flagged !== undefined ? (overrides.flagged ? 1 : 0) : (isFlagged ? 1 : 0),
      completedAt: new Date().toISOString(),
      sessionId: getSessionId(),
    };
    saveMutation.mutate(data);
  };

  // Stopwatch tick
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - stopwatchStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [stopwatchStart]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleNextQuestion = () => {
    // Record time spent
    setLastTime(elapsed);
    // Reset stopwatch
    setStopwatchStart(Date.now());
    setElapsed(0);
    // Trigger ripple animation + sound
    rippleKey.current++;
    setRipple(true);
    playWhoosh();
    setTimeout(() => setRipple(false), 500);
    refetch();
  };

  const handleDifficulty = (diff: string) => {
    setCurrentDifficulty(diff);
    setHasSubmitted(true);
    handleSaveResponse({ difficulty: diff });
    toast({ title: `Rated as ${diff}`, description: "Difficulty saved" });
    // Track for achievements
    if (questionData?.question) {
      trackQuestion(questionData.question.subject, diff, undefined, elapsed);
    }
    // Show reaction
    const reactions: Record<string, { text: string; color: string }> = {
      easy: { text: "EASY 😎", color: "#10b981" },
      medium: { text: "NOT BAD", color: "#f59e0b" },
      hard: { text: "TOUGH 😤", color: "#ef4444" },
    };
    const r = reactions[diff];
    if (r) setReaction({ ...r, trigger: Date.now() });
  };

  const handleSelfRating = (rating: number) => {
    setCurrentRating(rating);
    setHasSubmitted(true);
    handleSaveResponse({ selfRating: rating });
    earnQuestionXp(rating);
    // Track for achievements
    if (questionData?.question) {
      trackQuestion(questionData.question.subject, currentDifficulty || undefined, rating, elapsed);
    }
    toast({ title: `Self-rating: ${rating}/5`, description: ratingLabels[rating] });
    // Reactions + confetti for self-rating
    const ratingReactions: Record<number, { text: string; color: string }> = {
      1: { text: "OOF 💀", color: "#ef4444" },
      2: { text: "ROUGH", color: "#f97316" },
      3: { text: "OKAY 👍", color: "#eab308" },
      4: { text: "NICE! 🔥", color: "#10b981" },
      5: { text: "PERFECT ⭐", color: "#a855f7" },
    };
    const r = ratingReactions[rating];
    if (r) setReaction({ ...r, trigger: Date.now() });
    if (rating >= 4) {
      setConfettiTrigger((prev) => prev + 1);
      playConfetti();
    }
  };

  const handleFlag = () => {
    const newFlagged = !isFlagged;
    setIsFlagged(newFlagged);
    handleSaveResponse({ flagged: newFlagged });
    // Animation + sound
    setFlagAnim({ trigger: Date.now(), unflag: !newFlagged });
    if (newFlagged) playFlag(); else playUnflag();
    toast({
      title: newFlagged ? "Question flagged" : "Flag removed",
      description: newFlagged ? "Added to your review list" : "Removed from review list",
    });
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subject)) {
        next.delete(subject);
      } else {
        next.add(subject);
      }
      return next;
    });
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) {
        next.delete(topic);
      } else {
        next.add(topic);
      }
      return next;
    });
  };

  // Keyboard shortcuts
  const { showHelp: kbHelp, setShowHelp: setKbHelp } = useKeyboardShortcuts({
    onNext: handleNextQuestion,
    onReveal: () => setShowAnswer(prev => !prev),
    onRate: (r) => handleSelfRating(r),
    onFlag: handleFlag,
    onDifficultyEasy: () => handleDifficulty("easy"),
    onDifficultyMedium: () => handleDifficulty("medium"),
    onDifficultyHard: () => handleDifficulty("hard"),
  });

  useEffect(() => {
    setShowShortcutsHelp(kbHelp);
  }, [kbHelp]);

  // Spacebar shortcut for Next Question
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        handleNextQuestion();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Clear invalid topics when subjects change
  useEffect(() => {
    if (availableTopics.length > 0 && selectedTopics.size > 0) {
      const validTopics = new Set(availableTopics);
      setSelectedTopics((prev) => {
        const next = new Set<string>();
        for (const t of prev) {
          if (validTopics.has(t)) next.add(t);
        }
        return next;
      });
    }
    if (selectedSubjects.size === 0) {
      setSelectedTopics(new Set());
    }
  }, [subjectsKey, availableTopics]);

  const question = questionData?.question;

  return (
    <div className="space-y-5">
      <Confetti trigger={confettiTrigger} />
      <ReactionOverlay text={reaction.text} color={reaction.color} trigger={reaction.trigger} />
      <FlagAnimation trigger={flagAnim.trigger} unflag={flagAnim.unflag} />

      {/* Keyboard shortcuts help modal */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 z-[9993] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowShortcutsHelp(false)}>
          <div className="w-[380px] max-w-[90vw] bg-background rounded-2xl border border-border shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-primary" /> Keyboard Shortcuts
              </h3>
              <button onClick={() => setShowShortcutsHelp(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ["Space / N", "Next Question"],
                ["R", "Reveal / Hide Answer"],
                ["1-5", "Self Rating"],
                ["E", "Rate Easy"],
                ["M", "Rate Medium"],
                ["H", "Rate Hard"],
                ["F", "Flag / Unflag"],
                ["?", "Toggle this help"],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{desc}</span>
                  <kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono font-semibold">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* How to Use modal */}
      {showHowToUse && (
        <div className="fixed inset-0 z-[9993] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowHowToUse(false)}>
          <div className="w-[520px] max-w-[95vw] max-h-[85vh] bg-background rounded-2xl border border-border shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 pb-3 border-b border-border">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" /> How to Use HSC Machine
              </h3>
              <button onClick={() => setShowHowToUse(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-5 text-sm">

              <Section emoji="📖" title="Practice Questions">
                <p>The main page. Filter by <b>subject</b> and <b>topic</b>, then hit <b>Next Question</b> to get a random HSC past paper question.</p>
                <p>Rate each question's <b>difficulty</b> (Easy / Medium / Hard) and how you went with a <b>self-rating</b> (1-5). Rating 4+ triggers confetti and bonus XP.</p>
                <p><b>Flag</b> any question you want to revisit later — it'll appear in the Review tab.</p>
                <p>A <b>stopwatch</b> tracks how long you spend on each question.</p>
              </Section>

              <Section emoji="📝" title="Mock Exam Generator">
                <p>Go to the <b>Generate</b> tab to create a printable HSC-style mock exam.</p>
                <p>Pick a time limit: <b>30 min</b> (~20 marks), <b>1.5 hours</b> (~50 marks), or <b>3 hours</b> (~100 marks).</p>
                <p>Optionally filter by subjects and topics. Hit Generate, then <b>Print / Save as PDF</b> to get a paper with a cover page, numbered questions, writing lines, and sample answers at the back.</p>
                <p>English Advanced is excluded since those questions need writing booklets.</p>
              </Section>

              <Section emoji="📊" title="Analytics Dashboard">
                <p>Track your <b>study streak</b>, total questions completed, coverage percentage, average rating, and flagged count.</p>
                <p>See charts for <b>questions per day</b>, <b>self-rating trend</b>, <b>difficulty breakdown</b>, and progress by subject.</p>
                <p>The <b>Subject Performance</b> section shows your best and weakest subjects based on average self-ratings.</p>
                <p><b>Achievements</b> — 17 milestones to unlock, including 2 hidden secret ones. Track them all on this page.</p>
              </Section>

              <Section emoji="🚩" title="Flagged & Failed (Review)">
                <p>Questions land here if you <b>flagged</b> them, rated them as <b>hard</b>, or gave yourself a <b>low score</b> (1-2).</p>
                <p>Filter by reason. Expand any question to see the full text and answer.</p>
                <p>Use <b>Quiz Mode</b> to test yourself on flagged questions without seeing the answer first.</p>
                <p>Hit <b>Dismiss</b> on a question when you've mastered it.</p>
              </Section>

              <Section emoji="🎨" title="Store (Themes, Animations, Titles)">
                <p>Earn <b>XP</b> by answering questions (10 XP each, +5 bonus for rating 4+). Every 100 XP = 1 level.</p>
                <p>Unlock <b>20 themes</b> (including 3 glass landscape themes and 2 secret ones), <b>10 animations</b> for the next-question transition, and <b>11 title badges</b> that show next to your level.</p>
                <p>Equip items from each tab in the Store.</p>
              </Section>

              <Section emoji="💾" title="Save & Load Progress">
                <p>Click <b>Save</b> in the header to download your progress as a JSON file. This includes all responses, XP, unlocked themes, animations, titles, and achievements.</p>
                <p>Click <b>Load</b> to import a previously saved file. Your progress persists across sessions this way.</p>
              </Section>

              <Section emoji="⌨️" title="Keyboard Shortcuts">
                <p>Press <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">?</kbd> anytime to see all shortcuts. Key ones: <b>Space/N</b> = next question, <b>R</b> = reveal answer, <b>1-5</b> = rate, <b>F</b> = flag.</p>
              </Section>

            </div>
          </div>
        </div>
      )}

      {/* Mock Exam permanent banner */}
      <Link href="/mock-exam">
        <div className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">New: Mock Exam Generator</p>
            <p className="text-[11px] text-muted-foreground">Create a printable HSC-style exam paper with real past questions, writing lines, and solutions</p>
          </div>
          <span className="text-xs font-semibold text-primary shrink-0 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
            Try it <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>

      {/* Daily motivational quote */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10">
        <Quote className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground italic leading-relaxed">
          "{dailyQuote.text}"
          <span className="text-foreground font-medium not-italic ml-1.5">— {dailyQuote.author}</span>
        </p>
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowHowToUse(true)}
            className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted flex items-center gap-1 text-xs font-medium"
          >
            <HelpCircle className="w-3.5 h-3.5" /> How to Use
          </button>
          <button
            onClick={() => setShowShortcutsHelp(true)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <Card className={`border border-border shadow-sm ${ripple ? "filter-bounce" : ""}`}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Filters</h3>
            <div className="flex items-center gap-2">
              {(selectedSubjects.size > 0 || selectedTopics.size > 0) && (
                <button
                  onClick={() => {
                    setSelectedSubjects(new Set());
                    setSelectedTopics(new Set());
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
              <Button
                onClick={handleNextQuestion}
                className="gap-2"
                size="sm"
                data-testid="button-next-question"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Next Question
              </Button>
            </div>
          </div>

          <MultiChipSelect
            label="Subjects"
            options={subjects}
            selected={selectedSubjects}
            onToggle={toggleSubject}
            onClear={() => setSelectedSubjects(new Set())}
            testId="filter-subjects"
          />

          <MultiChipSelect
            label="Topics"
            options={availableTopics}
            selected={selectedTopics}
            onToggle={toggleTopic}
            onClear={() => setSelectedTopics(new Set())}
            disabled={selectedSubjects.size === 0}
            testId="filter-topics"
          />

          {/* Active filter summary */}
          {(selectedSubjects.size > 0 || selectedTopics.size > 0) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border">
              <span>Filtering:</span>
              {selectedSubjects.size > 0 && (
                <span className="font-medium text-foreground">
                  {selectedSubjects.size === subjects.length ? "All subjects" : `${selectedSubjects.size} subject${selectedSubjects.size > 1 ? "s" : ""}`}
                </span>
              )}
              {selectedTopics.size > 0 && (
                <>
                  <span>&middot;</span>
                  <span className="font-medium text-foreground">
                    {selectedTopics.size} topic{selectedTopics.size > 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ripple overlay */}
      {ripple && (
        <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
          <div
            key={rippleKey.current}
            className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/30"
            style={{ animation: "ripple-wave 0.6s ease-out forwards" }}
          />
        </div>
      )}

      {/* Question card */}
      {isLoading ? (
        <Card className="border border-border shadow-md">
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : question ? (
        <div className="space-y-4">
          <Card className={`border border-border shadow-md overflow-hidden ${ripple ? activeAnimation.cardClass : ""}`}>
            {/* Question header */}
            <div className="px-5 py-3.5 border-b border-border bg-muted/30 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1 font-medium">
                <BookOpen className="w-3 h-3" />
                {question.subject}
              </Badge>
              <Badge variant="outline" className="text-xs">{question.topic}</Badge>
              <div className="flex-1" />
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {question.year} HSC
                </span>
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {question.questionNumber}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {question.marks} {question.marks === 1 ? "mark" : "marks"}
                </span>
                <span className="flex items-center gap-1 font-mono tabular-nums text-primary font-medium">
                  ⏱ {formatTime(elapsed)}
                </span>
                {lastTime !== null && (
                  <span className="flex items-center gap-1 text-muted-foreground/60">
                    (last: {formatTime(lastTime)})
                  </span>
                )}
              </div>
            </div>

            {/* Question body */}
            <CardContent className="p-5 sm:p-6">
              <div className="prose prose-sm max-w-none">
                <QuestionText text={question.questionText} />
              </div>

              {/* Diagram image or NESA link fallback */}
              {(question as any).diagramImageUrl ? (
                <div className="mt-5">
                  <div className="bg-muted/20 rounded-lg p-3 border border-border">
                    <img
                      src={`.${(question as any).diagramImageUrl}`}
                      alt={question.diagramCaption || "Question diagram"}
                      className="max-w-full h-auto mx-auto rounded"
                      style={{ maxHeight: "400px" }}
                    />
                  </div>
                  {question.diagramCaption && (
                    <p className="text-xs text-muted-foreground mt-2 text-center italic">
                      {question.diagramCaption}
                    </p>
                  )}
                  {(question as any).nesaPaperUrl && (
                    <div className="text-center mt-1">
                      <a
                        href={(question as any).nesaPaperUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                      >
                        View original NESA paper →
                      </a>
                    </div>
                  )}
                </div>
              ) : question.diagramCaption ? (
                <div className="mt-4 p-3.5 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/30 dark:border-blue-800">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM7.25 5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0V5Zm.75 7a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"/></svg>
                    This question includes a diagram — see the original paper
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 ml-5">
                    {question.diagramCaption}
                  </p>
                  {(question as any).nesaPaperUrl && (
                    <a
                      href={(question as any).nesaPaperUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 ml-5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      View {question.year} {question.subject} HSC Paper
                    </a>
                  )}
                </div>
              ) : null}

              {/* Show/hide answer */}
              <div className="mt-6 pt-5 border-t border-border">
                <Button
                  variant={showAnswer ? "secondary" : "outline"}
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="gap-2"
                  data-testid="button-toggle-answer"
                >
                  {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAnswer ? "Hide" : "Reveal"} Sample Answer
                </Button>

                {showAnswer && question.sampleAnswer && (
                  <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/15">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                      Sample Answer / Marking Criteria
                    </h4>
                    <div className="text-sm text-foreground leading-relaxed space-y-2">
                      {question.sampleAnswer.split("\n").map((line, i) => (
                        <p key={i}>{line || <br />}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rating panel */}
          <Card className={`border border-border shadow-sm ${ripple ? activeAnimation.cardClass : ""}`} style={{ animationDelay: "80ms" }}>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Difficulty rating */}
                <div className="flex-1 space-y-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5" />
                    Difficulty
                  </h4>
                  <div className="flex gap-2">
                    {(["easy", "medium", "hard"] as const).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => handleDifficulty(diff)}
                        data-testid={`button-difficulty-${diff}`}
                        className={`
                          px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all duration-200
                          ${currentDifficulty === diff
                            ? difficultyColors[diff]
                            : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                          }
                        `}
                      >
                        {currentDifficulty === diff && <Check className="w-3 h-3 inline mr-1" />}
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Self rating */}
                <div className="flex-1 space-y-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5" />
                    How did you go?
                  </h4>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        key={r}
                        onClick={() => handleSelfRating(r)}
                        data-testid={`button-rating-${r}`}
                        className={`
                          w-9 h-9 rounded-lg text-sm font-semibold transition-all duration-200 border
                          ${currentRating >= r
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                          }
                        `}
                      >
                        {r}
                      </button>
                    ))}
                    {currentRating > 0 && (
                      <span className="text-xs text-muted-foreground self-center ml-2">
                        {ratingLabels[currentRating]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Flag button */}
                <div className="flex items-end">
                  <Button
                    variant={isFlagged ? "default" : "outline"}
                    size="sm"
                    onClick={handleFlag}
                    className="gap-2"
                    data-testid="button-flag"
                  >
                    <Flag className={`w-4 h-4 ${isFlagged ? "fill-current" : ""}`} />
                    {isFlagged ? "Flagged" : "Flag"}
                  </Button>
                </div>
              </div>

              {/* Submit confirmation */}
              {hasSubmitted && (
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Response saved
                  </p>
                  <Button
                    onClick={handleNextQuestion}
                    size="sm"
                    className="gap-1.5"
                    data-testid="button-next-after-submit"
                  >
                    Next Question
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mock Exam CTA — show after submitting a rating */}
          {hasSubmitted && (
            <Link href="/mock-exam">
              <div className="group relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Ready for a mock exam?</p>
                    <p className="text-xs text-muted-foreground">Generate a printable HSC-style paper with real past questions</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          )}

          <p className="text-[11px] text-muted-foreground text-center leading-relaxed px-4 py-2">
            Some questions reference diagrams from the original NESA paper. Use the link provided to view the real diagram.
          </p>

        </div>
      ) : (
        <Card className="border border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-foreground">No questions found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters or selecting a different subject.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Generate a session ID per browser session
function getSessionId(): string {
  if (!(window as any).__hscSessionId) {
    (window as any).__hscSessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return (window as any).__hscSessionId;
}
