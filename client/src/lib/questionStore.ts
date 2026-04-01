/**
 * Client-side question store that replaces all server API calls.
 * Loads questions from questions.json and stores responses in memory.
 */

// Types matching the shared schema (without drizzle dependency)
export interface Question {
  id: number;
  subject: string;
  topic: string;
  year: number;
  marks: number;
  questionNumber: string;
  questionText: string;
  diagramSvg: string | null;
  diagramCaption: string | null;
  nesaPaperUrl: string | null;
  diagramImageUrl: string | null;
  sampleAnswer: string | null;
  paper: string | null;
}

export interface UserResponse {
  id: number;
  questionId: number;
  difficulty: string | null;
  selfRating: number | null;
  flagged: number;
  completedAt: string;
  sessionId: string | null;
}

let questions: Question[] = [];
let responses: UserResponse[] = [];
let nextResponseId = 1;
let loaded = false;
let loadPromise: Promise<void> | null = null;

function rewriteDiagramUrl(url: string | null): string | null {
  if (!url) return null;
  // /api/diagrams/Biology_2019_Q3.jpg -> ./diagrams/Biology_2019_Q3.jpg
  return url.replace(/^\/api\/diagrams\//, "./diagrams/");
}

export async function loadQuestions(): Promise<void> {
  if (loaded) return;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const res = await fetch("./questions.json");
    const data: Question[] = await res.json();
    questions = data.map(q => ({
      ...q,
      diagramImageUrl: rewriteDiagramUrl(q.diagramImageUrl),
    }));
    loaded = true;
  })();
  return loadPromise;
}

export function isLoaded(): boolean {
  return loaded;
}

// ── Question queries ──

export function getSubjects(): string[] {
  const set = new Set(questions.map(q => q.subject));
  return Array.from(set).sort();
}

export function getTopicsBySubject(subjects: string[]): string[] {
  const allTopics = new Set<string>();
  for (const q of questions) {
    if (subjects.includes(q.subject)) {
      allTopics.add(q.topic);
    }
  }
  return Array.from(allTopics).sort();
}

export function getRandomQuestion(
  subjects?: string[],
  topics?: string[],
): { question: Question; response: UserResponse | null } | null {
  let pool = questions;

  if (subjects && subjects.length > 0) {
    pool = pool.filter(q => subjects.includes(q.subject));
  }
  if (topics && topics.length > 0) {
    pool = pool.filter(q => topics.includes(q.topic));
  }

  if (pool.length === 0) return null;

  const question = pool[Math.floor(Math.random() * pool.length)];
  const response = getResponseByQuestionId(question.id);
  return { question, response };
}

export function getQuestionById(id: number): { question: Question; response: UserResponse | null } | null {
  const question = questions.find(q => q.id === id);
  if (!question) return null;
  return { question, response: getResponseByQuestionId(id) };
}

// ── Response operations ──

function getResponseByQuestionId(questionId: number): UserResponse | null {
  return responses.find(r => r.questionId === questionId) ?? null;
}

export function getAllResponses(): UserResponse[] {
  return [...responses];
}

export function upsertResponse(data: {
  questionId: number;
  difficulty?: string | null;
  selfRating?: number | null;
  flagged?: number;
  completedAt: string;
  sessionId?: string | null;
}): UserResponse {
  const existingIdx = responses.findIndex(r => r.questionId === data.questionId);
  if (existingIdx >= 0) {
    const existing = responses[existingIdx];
    const updated: UserResponse = {
      ...existing,
      difficulty: data.difficulty ?? existing.difficulty,
      selfRating: data.selfRating ?? existing.selfRating,
      flagged: data.flagged ?? existing.flagged,
      completedAt: data.completedAt,
      sessionId: data.sessionId ?? existing.sessionId,
    };
    responses[existingIdx] = updated;
    return updated;
  }
  const newResponse: UserResponse = {
    id: nextResponseId++,
    questionId: data.questionId,
    difficulty: data.difficulty ?? null,
    selfRating: data.selfRating ?? null,
    flagged: data.flagged ?? 0,
    completedAt: data.completedAt,
    sessionId: data.sessionId ?? null,
  };
  responses.push(newResponse);
  return newResponse;
}

// ── Flagged / review ──

interface FlaggedItem extends UserResponse {
  question?: Question;
  reviewReasons?: string[];
}

export function getFlaggedResponses(): FlaggedItem[] {
  const qMap = new Map(questions.map(q => [q.id, q]));

  const reviewItems = responses.filter(
    r => r.flagged === 1 || r.difficulty === "hard" || (r.selfRating !== null && r.selfRating <= 2),
  );

  // Deduplicate by questionId (keep most recent)
  const seen = new Map<number, UserResponse>();
  for (const r of reviewItems) {
    if (!seen.has(r.questionId) || r.completedAt > seen.get(r.questionId)!.completedAt) {
      seen.set(r.questionId, r);
    }
  }

  return Array.from(seen.values()).map(r => {
    const q = qMap.get(r.questionId);
    const reasons: string[] = [];
    if (r.flagged === 1) reasons.push("flagged");
    if (r.difficulty === "hard") reasons.push("hard");
    if (r.selfRating !== null && r.selfRating <= 2) reasons.push("low-rating");
    return { ...r, question: q, reviewReasons: reasons };
  });
}

export function dismissResponse(questionId: number): { ok: boolean } {
  const existing = getResponseByQuestionId(questionId);
  if (existing) {
    upsertResponse({
      questionId,
      difficulty: "medium",
      selfRating: 3,
      flagged: 0,
      completedAt: existing.completedAt,
      sessionId: existing.sessionId || "dismissed",
    });
  }
  return { ok: true };
}

// ── Stats ──

export function getStats() {
  const respondedQuestionIds = new Set(responses.map(r => r.questionId));

  // Topic coverage
  const topicCoverage: Record<string, { total: number; completed: number }> = {};
  for (const q of questions) {
    const key = `${q.subject}|||${q.topic}`;
    if (!topicCoverage[key]) topicCoverage[key] = { total: 0, completed: 0 };
    topicCoverage[key].total++;
    if (respondedQuestionIds.has(q.id)) topicCoverage[key].completed++;
  }

  // Performance over time
  const performanceOverTime = responses
    .filter(r => r.selfRating)
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
    .map(r => {
      const q = questions.find(q => q.id === r.questionId);
      return { date: r.completedAt, rating: r.selfRating, subject: q?.subject, topic: q?.topic };
    });

  // Difficulty breakdown
  const difficultyBreakdown: Record<string, Record<string, number>> = {};
  for (const r of responses) {
    if (!r.difficulty) continue;
    const q = questions.find(q => q.id === r.questionId);
    if (!q) continue;
    const key = `${q.subject}|||${q.topic}`;
    if (!difficultyBreakdown[key]) difficultyBreakdown[key] = { easy: 0, medium: 0, hard: 0 };
    difficultyBreakdown[key][r.difficulty]++;
  }

  // Session history
  const sessionHistory: Record<string, number> = {};
  for (const r of responses) {
    const date = r.completedAt.split("T")[0];
    sessionHistory[date] = (sessionHistory[date] || 0) + 1;
  }

  return {
    topicCoverage,
    performanceOverTime,
    difficultyBreakdown,
    sessionHistory,
    totalCompleted: responses.length,
    totalQuestions: questions.length,
    totalFlagged: responses.filter(r => r.flagged).length,
  };
}

// ── Mock exam ──

export function generateMockExam(
  targetMarks: number,
  subjects?: string[],
  topics?: string[],
): { questions: Question[]; totalMarks: number; questionCount: number } {
  let pool = [...questions];

  if (subjects && subjects.length > 0) {
    pool = pool.filter(q => subjects.includes(q.subject));
  }
  if (topics && topics.length > 0) {
    pool = pool.filter(q => topics.includes(q.topic));
  }

  // Filter out English Advanced (needs writing booklets)
  pool = pool.filter(q => q.subject !== "English Advanced");

  if (pool.length === 0) {
    throw new Error("No questions match your filters");
  }

  // Group sub-parts together
  const groups = new Map<string, Question[]>();
  for (const q of pool) {
    const base = q.questionNumber.replace(/[a-e](\(.*\))?$/i, "").replace(/\([a-e]\)$/i, "");
    const groupKey = `${q.subject}|||${q.year}|||${base}`;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey)!.push(q);
  }

  const groupList = Array.from(groups.values()).map(qs => ({
    questions: qs.sort((a, b) => a.questionNumber.localeCompare(b.questionNumber)),
    totalMarks: qs.reduce((sum, q) => sum + q.marks, 0),
  }));

  // Shuffle
  const shuffled = groupList.sort(() => Math.random() - 0.5);

  const selected: Question[] = [];
  let totalMarks = 0;

  for (const group of shuffled) {
    if (totalMarks >= targetMarks) break;
    if (totalMarks + group.totalMarks <= targetMarks + 8) {
      selected.push(...group.questions);
      totalMarks += group.totalMarks;
    }
  }

  selected.sort((a, b) => {
    if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
    return a.questionNumber.localeCompare(b.questionNumber);
  });

  return { questions: selected, totalMarks, questionCount: selected.length };
}

// ── Export / Import ──

export function exportProgress() {
  const qMap = new Map(questions.map(q => [q.id, { subject: q.subject, year: q.year, questionNumber: q.questionNumber }]));
  const exportData = responses.map(r => {
    const qInfo = qMap.get(r.questionId);
    return {
      ...r,
      _questionSubject: qInfo?.subject,
      _questionYear: qInfo?.year,
      _questionNumber: qInfo?.questionNumber,
    };
  });
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    responses: exportData,
  };
}

export function importProgress(data: { responses: any[] }): { imported: number; total: number } {
  if (!Array.isArray(data.responses)) throw new Error("Invalid import data");

  const qLookup = new Map<string, number>();
  for (const q of questions) {
    qLookup.set(`${q.subject}|||${q.year}|||${q.questionNumber}`, q.id);
  }

  let imported = 0;
  for (const r of data.responses) {
    const key = `${r._questionSubject}|||${r._questionYear}|||${r._questionNumber}`;
    const questionId = qLookup.get(key);
    if (!questionId) continue;
    upsertResponse({
      questionId,
      difficulty: r.difficulty || null,
      selfRating: r.selfRating || null,
      flagged: r.flagged || 0,
      completedAt: r.completedAt || new Date().toISOString(),
      sessionId: r.sessionId || "imported",
    });
    imported++;
  }
  return { imported, total: data.responses.length };
}

// ── Replace responses (used when loading from external state) ──

export function setResponses(newResponses: UserResponse[]): void {
  responses = [...newResponses];
  nextResponseId = responses.length > 0 ? Math.max(...responses.map(r => r.id)) + 1 : 1;
}

export function getQuestions(): Question[] {
  return questions;
}
