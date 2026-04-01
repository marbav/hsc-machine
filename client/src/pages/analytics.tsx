import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGame } from "@/lib/gameState";
import { Link } from "wouter";

import {
  BarChart3,
  BookOpen,
  Target,
  Flame,
  TrendingUp,
  CheckCircle2,
  Flag,
  Loader2,
  Trophy,
  Award,
  Lock,
  Star,
  ArrowUp,
  ArrowDown,
  FileText,
  ArrowRight,
  Printer,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Stats {
  topicCoverage: Record<string, { total: number; completed: number }>;
  performanceOverTime: Array<{ date: string; rating: number; subject?: string; topic?: string }>;
  difficultyBreakdown: Record<string, Record<string, number>>;
  sessionHistory: Record<string, number>;
  totalCompleted: number;
  totalQuestions: number;
  totalFlagged: number;
}

const CHART_COLORS = [
  "hsl(255, 65%, 52%)",
  "hsl(220, 70%, 50%)",
  "hsl(170, 55%, 42%)",
  "hsl(45, 75%, 52%)",
  "hsl(330, 65%, 55%)",
  "hsl(195, 60%, 48%)",
  "hsl(280, 55%, 58%)",
];

const DIFFICULTY_COLORS = {
  easy: "#10b981",
  medium: "#f59e0b",
  hard: "#ef4444",
};

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });
  const { unlockedAchievements, allAchievements, totalQuestionsAnswered } = useGame();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const completionPct = stats.totalQuestions > 0
    ? Math.round((stats.totalCompleted / stats.totalQuestions) * 100)
    : 0;

  // Prepare topic coverage data grouped by subject
  const coverageBySubject: Record<string, Array<{ topic: string; total: number; completed: number; pct: number }>> = {};
  for (const [key, val] of Object.entries(stats.topicCoverage)) {
    const [subject, topic] = key.split("|||");
    if (!coverageBySubject[subject]) coverageBySubject[subject] = [];
    coverageBySubject[subject].push({
      topic,
      total: val.total,
      completed: val.completed,
      pct: val.total > 0 ? Math.round((val.completed / val.total) * 100) : 0,
    });
  }

  // Prepare session history chart data
  const sessionData = Object.entries(stats.sessionHistory)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
      questions: count,
    }));

  // Prepare performance data
  const perfData = stats.performanceOverTime.slice(-20).map((p, i) => ({
    index: i + 1,
    rating: p.rating,
    subject: p.subject?.split(" ")[0] || "",
  }));

  // Prepare difficulty pie data
  const diffTotals = { easy: 0, medium: 0, hard: 0 };
  for (const breakdown of Object.values(stats.difficultyBreakdown)) {
    diffTotals.easy += breakdown.easy || 0;
    diffTotals.medium += breakdown.medium || 0;
    diffTotals.hard += breakdown.hard || 0;
  }
  const diffPieData = [
    { name: "Easy", value: diffTotals.easy, color: DIFFICULTY_COLORS.easy },
    { name: "Medium", value: diffTotals.medium, color: DIFFICULTY_COLORS.medium },
    { name: "Hard", value: diffTotals.hard, color: DIFFICULTY_COLORS.hard },
  ].filter(d => d.value > 0);

  const avgRating = stats.performanceOverTime.length > 0
    ? (stats.performanceOverTime.reduce((s, p) => s + (p.rating || 0), 0) / stats.performanceOverTime.length).toFixed(1)
    : "—";

  // Calculate streak
  const sortedDates = Object.keys(stats.sessionHistory).sort().reverse();
  let streak = 0;
  if (sortedDates.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    // Streak counts if you studied today or yesterday
    let checkDate = sortedDates[0] === today || sortedDates[0] === yesterday
      ? new Date(sortedDates[0])
      : null;
    if (checkDate) {
      streak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(checkDate);
        prev.setDate(prev.getDate() - 1);
        const prevStr = prev.toISOString().split("T")[0];
        if (sortedDates[i] === prevStr) {
          streak++;
          checkDate = prev;
        } else {
          break;
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your HSC study progress across all subjects.</p>
      </div>

      {/* Mock Exam CTA */}
      <Link href="/mock-exam">
        <div className="group relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 p-5 cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
              <Printer className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Test yourself with a Mock Exam</p>
              <p className="text-xs text-muted-foreground mt-0.5">Pick your time limit, subjects, and topics. Get a printable HSC-style paper with cover page, writing lines, and solutions.</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shrink-0 group-hover:gap-2.5 transition-all">
              Try it <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </Link>


      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <SummaryCard
          icon={<Flame className="w-4 h-4" />}
          label="Streak"
          value={`${streak}`}
          sub={streak === 1 ? "day" : "days"}
          accent="text-orange-500"
        />
        <SummaryCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Completed"
          value={`${stats.totalCompleted}`}
          sub={`of ${stats.totalQuestions} questions`}
          accent="text-emerald-600"
        />
        <SummaryCard
          icon={<Target className="w-4 h-4" />}
          label="Coverage"
          value={`${completionPct}%`}
          sub="of all questions"
          accent="text-primary"
        />
        <SummaryCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Avg Rating"
          value={avgRating}
          sub="out of 5"
          accent="text-amber-600"
        />
        <SummaryCard
          icon={<Flag className="w-4 h-4" />}
          label="Flagged"
          value={`${stats.totalFlagged}`}
          sub="to revisit"
          accent="text-rose-500"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Session history */}
        <Card className="border border-border shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              Questions Per Day
            </h3>
            {sessionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sessionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="questions" fill="hsl(255, 65%, 52%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Complete some questions to see your activity" />
            )}
          </CardContent>
        </Card>

        {/* Performance over time */}
        <Card className="border border-border shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Self-Rating Trend
            </h3>
            {perfData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={perfData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="index" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" label={{ value: "Question #", position: "insideBottom", offset: -2, fontSize: 11 }} />
                  <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line type="monotone" dataKey="rating" stroke="hsl(255, 65%, 52%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Rate yourself on questions to see your trend" />
            )}
          </CardContent>
        </Card>

        {/* Difficulty breakdown */}
        <Card className="border border-border shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Difficulty Breakdown
            </h3>
            {diffPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={diffPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                    {diffPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Rate question difficulty to see the breakdown" />
            )}
          </CardContent>
        </Card>

        {/* Quick stats by subject */}
        <Card className="border border-border shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Questions by Subject
            </h3>
            <div className="space-y-3">
              {Object.entries(coverageBySubject).map(([subject, topics], i) => {
                const total = topics.reduce((s, t) => s + t.total, 0);
                const completed = topics.reduce((s, t) => s + t.completed, 0);
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div key={subject} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium truncate">{subject}</span>
                      <span className="text-muted-foreground">{completed}/{total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Subject Performance Analysis */}
      <Card className="border border-border shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            Subject Performance
          </h3>
          {(() => {
            // Compute avg rating per subject from performance data
            const subjectRatings: Record<string, { sum: number; count: number }> = {};
            for (const p of stats.performanceOverTime) {
              const subj = p.subject || "Unknown";
              if (!subjectRatings[subj]) subjectRatings[subj] = { sum: 0, count: 0 };
              subjectRatings[subj].sum += p.rating || 0;
              subjectRatings[subj].count += 1;
            }
            const subjectAvgs = Object.entries(subjectRatings)
              .map(([subject, { sum, count }]) => ({
                subject,
                avg: count > 0 ? sum / count : 0,
                count,
              }))
              .filter(s => s.count >= 2)
              .sort((a, b) => b.avg - a.avg);

            if (subjectAvgs.length === 0) return (
              <p className="text-sm text-muted-foreground text-center py-6">Rate a few questions to see subject analysis</p>
            );

            const best = subjectAvgs[0];
            const worst = subjectAvgs[subjectAvgs.length - 1];

            return (
              <div className="space-y-4">
                {/* Best & Worst subjects */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold mb-1">
                      <ArrowUp className="w-3 h-3" /> Best Subject
                    </div>
                    <p className="text-sm font-bold truncate">{best.subject}</p>
                    <p className="text-xs text-muted-foreground">Avg rating: {best.avg.toFixed(1)}/5 ({best.count} Q's)</p>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold mb-1">
                      <ArrowDown className="w-3 h-3" /> Needs Work
                    </div>
                    <p className="text-sm font-bold truncate">{worst.subject}</p>
                    <p className="text-xs text-muted-foreground">Avg rating: {worst.avg.toFixed(1)}/5 ({worst.count} Q's)</p>
                  </div>
                </div>

                {/* All subjects bar */}
                <div className="space-y-2">
                  {subjectAvgs.map((s, i) => (
                    <div key={s.subject} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-28 truncate">{s.subject}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${(s.avg / 5) * 100}%`,
                            backgroundColor: s.avg >= 4 ? '#10b981' : s.avg >= 3 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-8 text-right">{s.avg.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="border border-border shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Achievements
          </h3>
          <p className="text-xs text-muted-foreground mb-4">{unlockedAchievements.length} of {allAchievements.filter(a => !a.secret).length} unlocked</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {allAchievements.map((ach) => {
              const isUnlocked = unlockedAchievements.includes(ach.id);
              const isHidden = ach.secret && !isUnlocked;
              return (
                <div
                  key={ach.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all ${
                    isUnlocked
                      ? "border-primary/20 bg-primary/5"
                      : isHidden
                        ? "border-border/50 opacity-40"
                        : "border-border opacity-60"
                  }`}
                >
                  <span className={`text-xl ${!isUnlocked ? "grayscale" : ""}`}>
                    {isHidden ? "?" : ach.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-[11px] font-semibold truncate ${isUnlocked ? "" : "text-muted-foreground"}`}>
                      {isHidden ? "???" : ach.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {isHidden ? "Secret achievement" : ach.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Topic coverage detail */}
      <Card className="border border-border shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Topic Coverage
          </h3>
          <div className="space-y-6">
            {Object.entries(coverageBySubject).map(([subject, topics], si) => (
              <div key={subject}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {subject}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {topics.map((t) => (
                    <div key={t.topic} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{t.topic}</p>
                        <p className="text-[10px] text-muted-foreground">{t.completed}/{t.total} questions</p>
                      </div>
                      <div className="w-16">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${t.pct}%`,
                              backgroundColor: CHART_COLORS[si % CHART_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 min-w-[36px] justify-center">
                        {t.pct}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <Card className="border border-border shadow-sm">
      <CardContent className="p-4">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${accent} mb-1.5`}>
          {icon}
          {label}
        </div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
      {message}
    </div>
  );
}
