import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Flag,
  Calendar,
  Star,
  BookOpen,
  Loader2,
  FlagOff,
  ChevronDown,
  ChevronUp,
  Play,
  ArrowRight,
  FileText,
  Printer,
  Check,
  X,
  Eye,
  AlertTriangle,
  Shuffle,
  ArrowDownAZ,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

import type { Question, Response as UserResponse } from "@shared/schema";

interface FlaggedItem extends UserResponse {
  question?: Question;
  reviewReasons?: string[];
}

const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-700",
};

const reasonLabels: Record<string, { label: string; color: string; emoji: string }> = {
  flagged: { label: "Flagged", color: "bg-purple-100 text-purple-700", emoji: "🚩" },
  hard: { label: "Rated Hard", color: "bg-rose-100 text-rose-700", emoji: "💪" },
  "low-rating": { label: "Low Score", color: "bg-amber-100 text-amber-700", emoji: "📉" },
};

type ReasonFilter = "all" | "flagged" | "struggled";
type SortMode = "random" | "hardest-first" | "lowest-rating";

// Expandable flagged question card
function FlaggedCard({ item, onUnflag, onDismiss }: { item: FlaggedItem; onUnflag: () => void; onDismiss: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const q = item.question;
  if (!q) return null;

  return (
    <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <Badge variant="secondary" className="text-xs">{q.subject}</Badge>
              <Badge variant="outline" className="text-xs">{q.topic}</Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" /> {q.year}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3" /> {q.marks}m
              </span>
              {/* Reason tags */}
              {item.reviewReasons?.map(reason => {
                const r = reasonLabels[reason];
                return r ? (
                  <Badge key={reason} className={`text-[9px] px-1.5 py-0 ${r.color}`}>
                    {r.emoji} {r.label}
                  </Badge>
                ) : null;
              })}
            </div>

            {/* Question text — expandable */}
            <div className={`text-sm text-foreground ${expanded ? "" : "line-clamp-2"}`}>
              {q.questionText.split("\n").map((line, i) => (
                <p key={i} className="leading-relaxed">{line || <br />}</p>
              ))}
            </div>

            {q.questionText.length > 120 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-primary font-medium mt-1 flex items-center gap-0.5 hover:underline"
              >
                {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
              </button>
            )}

            {/* Scores */}
            <div className="flex items-center gap-3 mt-2">
              {item.difficulty && (
                <Badge className={`text-[10px] ${difficultyColors[item.difficulty] || ""}`}>
                  {item.difficulty}
                </Badge>
              )}
              {item.selfRating && (
                <span className="text-xs text-muted-foreground">Self-rating: {item.selfRating}/5</span>
              )}
            </div>
          </div>

          <div className="flex sm:flex-col gap-2 sm:items-end shrink-0">
            {item.flagged === 1 && (
              <Button variant="outline" size="sm" onClick={onUnflag} className="gap-1.5 text-xs">
                <FlagOff className="w-3.5 h-3.5" /> Unflag
              </Button>
            )}
            {(item.reviewReasons?.includes("hard") || item.reviewReasons?.includes("low-rating")) && (
              <Button variant="outline" size="sm" onClick={onDismiss} className="gap-1.5 text-xs text-muted-foreground">
                <X className="w-3.5 h-3.5" /> Dismiss
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quiz mode component
function QuizMode({ items, onExit }: { items: FlaggedItem[]; onExit: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedMC, setSelectedMC] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const current = items[currentIdx];
  const q = current?.question;
  if (!q) return null;

  const mcOptions: string[] = [];
  const lines = q.questionText.split("\n");
  for (const line of lines) {
    const match = line.trim().match(/^([A-D])\.\s+(.+)/);
    if (match) mcOptions.push(match[0]);
  }
  const isMC = mcOptions.length >= 3;
  // Extract correct MC letter — handles "A", "(A)", "A.", "Answer: A", etc.
  const correctMC = (() => {
    const ans = (q.sampleAnswer || "").trim();
    const match = ans.match(/^\(?([A-D])\)?/i);
    return match ? match[1].toUpperCase() : "";
  })();

  const handleSubmit = () => {
    if (isMC) {
      const isCorrect = selectedMC.toUpperCase() === correctMC;
      setScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
    } else {
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
    }
    setShowResult(true);
  };

  const handleNext = () => {
    setUserAnswer("");
    setSelectedMC("");
    setShowResult(false);
    if (currentIdx < items.length - 1) setCurrentIdx(currentIdx + 1);
  };

  const isLast = currentIdx >= items.length - 1;
  const progress = ((currentIdx + 1) / items.length) * 100;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Quiz Mode</h2>
          <p className="text-xs text-muted-foreground">
            Question {currentIdx + 1} of {items.length}
            {score.total > 0 && ` — ${score.correct}/${score.total} correct`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onExit} className="gap-1.5 text-xs">
          <X className="w-3.5 h-3.5" /> Exit Quiz
        </Button>
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <Card className="border border-border shadow-md">
        <div className="px-5 py-3 border-b border-border bg-muted/30 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs">{q.subject}</Badge>
          <Badge variant="outline" className="text-xs">{q.topic}</Badge>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">{q.year} HSC — {q.marks} marks</span>
        </div>
        <CardContent className="p-5">
          <div className="text-sm leading-relaxed space-y-1">
            {q.questionText.split("\n").map((line, i) => (
              <p key={i}>{line || <br />}</p>
            ))}
          </div>
          {q.diagramCaption && (
            <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800 italic">Diagram in original paper: {q.diagramCaption}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {!showResult ? (
        <Card className="border border-border shadow-sm">
          <CardContent className="p-5 space-y-4">
            {isMC ? (
              <>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select your answer</h3>
                <div className="grid grid-cols-2 gap-2">
                  {["A", "B", "C", "D"].map(letter => (
                    <button key={letter} onClick={() => setSelectedMC(letter)}
                      className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                        selectedMC === letter ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-foreground/20"
                      }`}>{letter}</button>
                  ))}
                </div>
                <Button onClick={handleSubmit} disabled={!selectedMC} className="w-full gap-2">
                  <Check className="w-4 h-4" /> Check Answer
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type your answer</h3>
                <textarea value={userAnswer} onChange={e => setUserAnswer(e.target.value)}
                  placeholder="Write your answer here..."
                  className="w-full min-h-[120px] p-3 rounded-lg border border-border bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                <Button onClick={handleSubmit} disabled={!userAnswer.trim()} className="w-full gap-2">
                  <Eye className="w-4 h-4" /> Compare to Sample Answer
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border shadow-sm">
          <CardContent className="p-5 space-y-4">
            {isMC && (
              <div className={`p-4 rounded-lg border-2 ${
                selectedMC.toUpperCase() === correctMC ? "border-emerald-300 bg-emerald-50" : "border-rose-300 bg-rose-50"
              }`}>
                <p className={`text-sm font-bold ${selectedMC.toUpperCase() === correctMC ? "text-emerald-700" : "text-rose-700"}`}>
                  {selectedMC.toUpperCase() === correctMC ? "✓ Correct!" : `✗ Incorrect — the answer is ${correctMC}`}
                </p>
              </div>
            )}
            {!isMC && userAnswer && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Your Answer</h4>
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm">{userAnswer}</div>
              </div>
            )}
            {q.sampleAnswer && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Sample Answer / Marking Criteria</h4>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/15 text-sm space-y-1">
                  {q.sampleAnswer.split("\n").map((line, i) => (<p key={i}>{line || <br />}</p>))}
                </div>
              </div>
            )}
            <Button onClick={isLast ? onExit : handleNext} className="w-full gap-2">
              {isLast ? <><Check className="w-4 h-4" /> Finish Quiz</> : <><ArrowRight className="w-4 h-4" /> Next Question</>}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function FlaggedPage() {
  const { toast } = useToast();
  const [quizMode, setQuizMode] = useState(false);
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("hardest-first");
  const [subjectFilter, setSubjectFilter] = useState<Set<string>>(new Set());

  const { data: flagged = [], isLoading } = useQuery<FlaggedItem[]>({
    queryKey: ["/api/responses/flagged"],
  });

  const unflagMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const res = await apiRequest("POST", "/api/responses", {
        questionId, flagged: 0, completedAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/responses/flagged"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Unflagged", description: "Question removed from review list" });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const res = await apiRequest("POST", "/api/responses/dismiss", { questionId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/responses/flagged"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Dismissed", description: "Question removed from review list" });
    },
  });

  // Get unique subjects from flagged items
  const subjects = useMemo(() => {
    const s = new Set(flagged.map(f => f.question?.subject).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [flagged]);

  // Apply filters
  const filtered = useMemo(() => {
    let items = [...flagged];

    // Reason filter
    if (reasonFilter === "flagged") {
      items = items.filter(i => i.reviewReasons?.includes("flagged"));
    } else if (reasonFilter === "struggled") {
      items = items.filter(i => i.reviewReasons?.includes("hard") || i.reviewReasons?.includes("low-rating"));
    }

    // Subject filter
    if (subjectFilter.size > 0) {
      items = items.filter(i => i.question && subjectFilter.has(i.question.subject));
    }

    // Sort
    if (sortMode === "hardest-first") {
      items.sort((a, b) => {
        const aScore = (a.difficulty === "hard" ? 3 : a.difficulty === "medium" ? 2 : 1) + (a.selfRating ? (6 - a.selfRating) : 0);
        const bScore = (b.difficulty === "hard" ? 3 : b.difficulty === "medium" ? 2 : 1) + (b.selfRating ? (6 - b.selfRating) : 0);
        return bScore - aScore;
      });
    } else if (sortMode === "lowest-rating") {
      items.sort((a, b) => (a.selfRating || 99) - (b.selfRating || 99));
    } else {
      items.sort(() => Math.random() - 0.5);
    }

    return items;
  }, [flagged, reasonFilter, subjectFilter, sortMode]);

  if (isLoading) {
    return (<div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>);
  }

  if (quizMode && filtered.length > 0) {
    return <QuizMode items={filtered} onExit={() => setQuizMode(false)} />;
  }

  const toggleSubject = (s: string) => {
    setSubjectFilter(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  // Count by reason
  const flaggedCount = flagged.filter(i => i.reviewReasons?.includes("flagged")).length;
  const struggledCount = flagged.filter(i => i.reviewReasons?.includes("hard") || i.reviewReasons?.includes("low-rating")).length;

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Flag className="w-5 h-5 text-primary" />
            Flagged & Failed
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {flagged.length} question{flagged.length !== 1 ? "s" : ""} to review — flagged, rated hard, or scored low.
          </p>
        </div>
        {filtered.length > 0 && (
          <Button onClick={() => setQuizMode(true)} className="gap-2">
            <Play className="w-4 h-4" /> Quiz Mode
          </Button>
        )}
      </div>

      {/* Filters */}
      {flagged.length > 0 && (
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4 space-y-3">
            {/* Reason filter */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Show</span>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { id: "all" as const, label: `All (${flagged.length})` },
                  { id: "flagged" as const, label: `Flagged (${flaggedCount})` },
                  { id: "struggled" as const, label: `Struggled (${struggledCount})` },
                ] as const).map(opt => (
                  <button key={opt.id} onClick={() => setReasonFilter(opt.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      reasonFilter === opt.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                    }`}>
                    {reasonFilter === opt.id && <Check className="w-3 h-3 inline mr-1" />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject filter */}
            {subjects.length > 1 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subjects</span>
                  {subjectFilter.size > 0 && (
                    <button onClick={() => setSubjectFilter(new Set())}
                      className="text-[10px] text-primary hover:text-primary/80 font-medium flex items-center gap-0.5">
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {subjects.map(s => {
                    const isSelected = subjectFilter.has(s);
                    return (
                      <button key={s} onClick={() => toggleSubject(s)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          isSelected ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                        }`}>
                        {isSelected && <Check className="w-3 h-3 inline mr-1" />}{s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sort */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order</span>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { id: "hardest-first" as const, label: "Hardest First", icon: AlertTriangle },
                  { id: "lowest-rating" as const, label: "Lowest Rating", icon: ArrowDownAZ },
                  { id: "random" as const, label: "Random", icon: Shuffle },
                ] as const).map(opt => (
                  <button key={opt.id} onClick={() => setSortMode(opt.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${
                      sortMode === opt.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                    }`}>
                    <opt.icon className="w-3 h-3" /> {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground pt-1 border-t border-border">
              Showing {filtered.length} of {flagged.length} questions
            </p>
          </CardContent>
        </Card>
      )}

      {flagged.length === 0 ? (
        <Card className="border border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FlagOff className="w-10 h-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-foreground">Nothing to review yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Flag questions, rate them as hard, or score yourself low to add them here.
            </p>
            <div className="flex gap-2 mt-4">
              <Link href="/">
                <Button className="gap-2" variant="outline">
                  <BookOpen className="w-4 h-4" /> Start practising
                </Button>
              </Link>
              <Link href="/mock-exam">
                <Button className="gap-2">
                  <Printer className="w-4 h-4" /> Generate Mock Exam
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No questions match your current filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <FlaggedCard key={item.id} item={item}
              onUnflag={() => unflagMutation.mutate(item.questionId)}
              onDismiss={() => dismissMutation.mutate(item.questionId)} />
          ))}

          {/* Mock exam CTA at bottom of review list */}
          <Link href="/mock-exam">
            <div className="group flex items-center gap-3 p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all cursor-pointer mt-4">
              <Printer className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Done reviewing? Generate a mock exam</p>
                <p className="text-xs text-muted-foreground">Test yourself under timed conditions with a printable paper</p>
              </div>
              <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
