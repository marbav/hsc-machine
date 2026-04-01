import {
  type Question, type InsertQuestion, questions,
  type Response as UserResponse, type InsertResponse, responses,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, sql, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  // Questions
  getAllQuestions(): Question[];
  getQuestionById(id: number): Question | undefined;
  getQuestionsBySubject(subject: string): Question[];
  getQuestionsBySubjectAndTopic(subject: string, topic: string): Question[];
  getRandomQuestion(subjects?: string[], topics?: string[]): Question | undefined;
  getSubjects(): string[];
  getTopicsBySubject(subject: string): string[];
  insertQuestion(q: InsertQuestion): Question;

  // Responses
  getResponseByQuestionId(questionId: number): UserResponse | undefined;
  getAllResponses(): UserResponse[];
  getFlaggedResponses(): UserResponse[];
  upsertResponse(r: InsertResponse): UserResponse;
  getResponseStats(): any;
}

export class DatabaseStorage implements IStorage {
  getAllQuestions(): Question[] {
    return db.select().from(questions).all();
  }

  getQuestionById(id: number): Question | undefined {
    return db.select().from(questions).where(eq(questions.id, id)).get();
  }

  getQuestionsBySubject(subject: string): Question[] {
    return db.select().from(questions).where(eq(questions.subject, subject)).all();
  }

  getQuestionsBySubjectAndTopic(subject: string, topic: string): Question[] {
    return db.select().from(questions)
      .where(and(eq(questions.subject, subject), eq(questions.topic, topic)))
      .all();
  }

  getRandomQuestion(subjects?: string[], topics?: string[]): Question | undefined {
    let query = db.select().from(questions);
    const conditions = [];
    if (subjects && subjects.length > 0) {
      if (subjects.length === 1) {
        conditions.push(eq(questions.subject, subjects[0]));
      } else {
        conditions.push(sql`${questions.subject} IN (${sql.join(subjects.map(s => sql`${s}`), sql`, `)})`);
      }
    }
    if (topics && topics.length > 0) {
      if (topics.length === 1) {
        conditions.push(eq(questions.topic, topics[0]));
      } else {
        conditions.push(sql`${questions.topic} IN (${sql.join(topics.map(t => sql`${t}`), sql`, `)})`);
      }
    }
    
    if (conditions.length > 0) {
      return (query as any).where(and(...conditions)).orderBy(sql`RANDOM()`).limit(1).get();
    }
    return query.orderBy(sql`RANDOM()`).limit(1).get();
  }

  getSubjects(): string[] {
    const rows = db.selectDistinct({ subject: questions.subject }).from(questions).all();
    return rows.map(r => r.subject);
  }

  getTopicsBySubject(subject: string): string[] {
    const rows = db.selectDistinct({ topic: questions.topic })
      .from(questions)
      .where(eq(questions.subject, subject))
      .all();
    return rows.map(r => r.topic);
  }

  insertQuestion(q: InsertQuestion): Question {
    return db.insert(questions).values(q).returning().get();
  }

  // Responses
  getResponseByQuestionId(questionId: number): UserResponse | undefined {
    return db.select().from(responses).where(eq(responses.questionId, questionId)).get();
  }

  getAllResponses(): UserResponse[] {
    return db.select().from(responses).all();
  }

  getFlaggedResponses(): UserResponse[] {
    return db.select().from(responses).where(eq(responses.flagged, 1)).all();
  }

  upsertResponse(r: InsertResponse): UserResponse {
    // Check if response exists for this question
    const existing = db.select().from(responses).where(eq(responses.questionId, r.questionId)).get();
    if (existing) {
      // Update
      return db.update(responses)
        .set({
          difficulty: r.difficulty ?? existing.difficulty,
          selfRating: r.selfRating ?? existing.selfRating,
          flagged: r.flagged ?? existing.flagged,
          completedAt: r.completedAt,
          sessionId: r.sessionId ?? existing.sessionId,
        })
        .where(eq(responses.questionId, r.questionId))
        .returning()
        .get();
    }
    return db.insert(responses).values(r).returning().get();
  }

  getResponseStats(): any {
    const allResponses = this.getAllResponses();
    const allQuestions = this.getAllQuestions();

    // Build topic coverage
    const topicCoverage: Record<string, { total: number; completed: number }> = {};
    const respondedQuestionIds = new Set(allResponses.map(r => r.questionId));

    for (const q of allQuestions) {
      const key = `${q.subject}|||${q.topic}`;
      if (!topicCoverage[key]) {
        topicCoverage[key] = { total: 0, completed: 0 };
      }
      topicCoverage[key].total++;
      if (respondedQuestionIds.has(q.id)) {
        topicCoverage[key].completed++;
      }
    }

    // Performance over time
    const performanceOverTime = allResponses
      .filter(r => r.selfRating)
      .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
      .map(r => {
        const q = allQuestions.find(q => q.id === r.questionId);
        return {
          date: r.completedAt,
          rating: r.selfRating,
          subject: q?.subject,
          topic: q?.topic,
        };
      });

    // Difficulty breakdown
    const difficultyBreakdown: Record<string, Record<string, number>> = {};
    for (const r of allResponses) {
      if (!r.difficulty) continue;
      const q = allQuestions.find(q => q.id === r.questionId);
      if (!q) continue;
      const key = `${q.subject}|||${q.topic}`;
      if (!difficultyBreakdown[key]) {
        difficultyBreakdown[key] = { easy: 0, medium: 0, hard: 0 };
      }
      difficultyBreakdown[key][r.difficulty]++;
    }

    // Session history
    const sessionHistory: Record<string, number> = {};
    for (const r of allResponses) {
      const date = r.completedAt.split("T")[0];
      sessionHistory[date] = (sessionHistory[date] || 0) + 1;
    }

    return {
      topicCoverage,
      performanceOverTime,
      difficultyBreakdown,
      sessionHistory,
      totalCompleted: allResponses.length,
      totalQuestions: allQuestions.length,
      totalFlagged: allResponses.filter(r => r.flagged).length,
    };
  }
}

export const storage = new DatabaseStorage();
