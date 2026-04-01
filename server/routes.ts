import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertResponseSchema } from "@shared/schema";
import { seedQuestions } from "./seed-questions";
import { db } from "./storage";
import { questions } from "@shared/schema";
import path from "path";
import fs from "fs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Seed questions if DB is empty
  const existing = storage.getAllQuestions();
  if (existing.length === 0 && seedQuestions.length > 0) {
    console.log(`Seeding question database with ${seedQuestions.length} questions...`);
    // Batch insert in chunks of 100 for performance
    const chunkSize = 100;
    for (let i = 0; i < seedQuestions.length; i += chunkSize) {
      const chunk = seedQuestions.slice(i, i + chunkSize);
      db.insert(questions).values(chunk).run();
    }
    console.log(`Seeded ${seedQuestions.length} questions.`);
  }

  // Serve ads.txt for AdSense verification
  app.get("/ads.txt", (_req, res) => {
    const adsPath = path.resolve(__dirname, "public", "ads.txt");
    const altPath = path.resolve(process.cwd(), "dist", "public", "ads.txt");
    if (fs.existsSync(adsPath)) return res.type("text/plain").sendFile(adsPath);
    if (fs.existsSync(altPath)) return res.type("text/plain").sendFile(altPath);
    res.status(404).send("Not found");
  });

  // Serve diagram images
  app.get("/api/diagrams/:filename", (req, res) => {
    const filename = req.params.filename;
    // Try multiple paths
    const tryPaths = [
      path.resolve(__dirname, "public", "diagrams", filename),
      path.resolve(process.cwd(), "dist", "public", "diagrams", filename),
      path.resolve(process.cwd(), "client", "public", "diagrams", filename),
    ];
    for (const p of tryPaths) {
      if (fs.existsSync(p)) {
        res.setHeader("Cache-Control", "public, max-age=31536000");
        return res.sendFile(p);
      }
    }
    res.status(404).json({ error: "Diagram not found" });
  });

  // Get all subjects
  app.get("/api/subjects", (_req, res) => {
    const subjects = storage.getSubjects();
    res.json(subjects);
  });

  // Get topics for a subject (supports comma-separated subjects)
  app.get("/api/subjects/:subject/topics", (req, res) => {
    const subjectParam = req.params.subject;
    const subjects = subjectParam.split(",").map(s => s.trim());
    const allTopics = new Set<string>();
    for (const s of subjects) {
      for (const t of storage.getTopicsBySubject(s)) {
        allTopics.add(t);
      }
    }
    res.json(Array.from(allTopics).sort());
  });

  // Get a random question (supports comma-separated subjects and topics)
  app.get("/api/questions/random", (req, res) => {
    const { subjects: subjectsParam, topics: topicsParam, subject, topic } = req.query;
    // Support both old single params and new multi params
    const subjectList = subjectsParam
      ? (subjectsParam as string).split(",").map(s => s.trim())
      : subject ? [subject as string] : undefined;
    const topicList = topicsParam
      ? (topicsParam as string).split(",").map(t => t.trim())
      : topic ? [topic as string] : undefined;
    const question = storage.getRandomQuestion(
      subjectList && subjectList.length > 0 ? subjectList : undefined,
      topicList && topicList.length > 0 ? topicList : undefined
    );
    if (!question) {
      res.status(404).json({ message: "No questions found" });
      return;
    }
    // Also get existing response
    const response = storage.getResponseByQuestionId(question.id);
    res.json({ question, response });
  });

  // Get a specific question
  app.get("/api/questions/:id", (req, res) => {
    const question = storage.getQuestionById(parseInt(req.params.id));
    if (!question) {
      res.status(404).json({ message: "Question not found" });
      return;
    }
    const response = storage.getResponseByQuestionId(question.id);
    res.json({ question, response });
  });

  // Get all questions (for filtering)
  app.get("/api/questions", (req, res) => {
    const { subject, topic } = req.query;
    let qs;
    if (subject && topic) {
      qs = storage.getQuestionsBySubjectAndTopic(subject as string, topic as string);
    } else if (subject) {
      qs = storage.getQuestionsBySubject(subject as string);
    } else {
      qs = storage.getAllQuestions();
    }
    res.json(qs);
  });

  // Save/update a response
  app.post("/api/responses", (req, res) => {
    try {
      const data = insertResponseSchema.parse(req.body);
      const response = storage.upsertResponse(data);
      res.json(response);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Get all responses
  app.get("/api/responses", (_req, res) => {
    const allResponses = storage.getAllResponses();
    res.json(allResponses);
  });

  // Get flagged AND struggled questions
  app.get("/api/responses/flagged", (_req, res) => {
    const allResponses = storage.getAllResponses();
    const allQuestions = storage.getAllQuestions();
    const qMap = new Map(allQuestions.map(q => [q.id, q]));

    // Include: flagged OR rated hard OR self-rating <= 2
    const reviewItems = allResponses.filter(r =>
      r.flagged === 1 ||
      r.difficulty === "hard" ||
      (r.selfRating !== null && r.selfRating <= 2)
    );

    // Deduplicate by questionId (keep the most recent response)
    const seen = new Map<number, typeof reviewItems[0]>();
    for (const r of reviewItems) {
      if (!seen.has(r.questionId) || r.completedAt > seen.get(r.questionId)!.completedAt) {
        seen.set(r.questionId, r);
      }
    }

    const enriched = Array.from(seen.values()).map(r => {
      const q = qMap.get(r.questionId);
      // Tag the reason it's in the review list
      const reasons: string[] = [];
      if (r.flagged === 1) reasons.push("flagged");
      if (r.difficulty === "hard") reasons.push("hard");
      if (r.selfRating !== null && r.selfRating <= 2) reasons.push("low-rating");
      return { ...r, question: q, reviewReasons: reasons };
    });

    res.json(enriched);
  });

  // Dismiss a question from review (reset difficulty/rating so it no longer appears)
  app.post("/api/responses/dismiss", (req, res) => {
    try {
      const { questionId } = req.body;
      if (!questionId) {
        res.status(400).json({ message: "questionId required" });
        return;
      }
      // Update the response to clear hard difficulty and low rating
      const existing = storage.getResponseByQuestionId(questionId);
      if (existing) {
        storage.upsertResponse({
          questionId,
          difficulty: "medium",
          selfRating: 3,
          flagged: 0,
          completedAt: existing.completedAt,
          sessionId: existing.sessionId || "dismissed",
        });
      }
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Analytics stats
  app.get("/api/stats", (_req, res) => {
    const stats = storage.getResponseStats();
    res.json(stats);
  });

  // Generate a mock exam
  app.post("/api/mock-exam", (req, res) => {
    try {
      const { targetMarks, subjects, topics } = req.body;
      if (!targetMarks || targetMarks < 10) {
        res.status(400).json({ message: "targetMarks must be at least 10" });
        return;
      }

      let allQuestions = storage.getAllQuestions();

      // Filter by subjects
      if (subjects && subjects.length > 0) {
        allQuestions = allQuestions.filter(q => subjects.includes(q.subject));
      }

      // Filter by topics
      if (topics && topics.length > 0) {
        allQuestions = allQuestions.filter(q => topics.includes(q.topic));
      }

      // Filter out English Advanced (needs writing booklets)
      allQuestions = allQuestions.filter(q => q.subject !== "English Advanced");

      if (allQuestions.length === 0) {
        res.status(404).json({ message: "No questions match your filters" });
        return;
      }

      // Group sub-parts together under parent questions
      // e.g. Q26a, Q26b, Q26c become one group picked together
      const groups: Map<string, typeof allQuestions> = new Map();
      for (const q of allQuestions) {
        const qn = q.questionNumber;
        // Extract base question number: "Q26b" -> "Q26", "15c" -> "15", "Section II Q4b" -> "Section II Q4"
        const base = qn.replace(/[a-e](\(.*\))?$/i, "").replace(/\([a-e]\)$/i, "");
        const groupKey = `${q.subject}|||${q.year}|||${base}`;
        if (!groups.has(groupKey)) groups.set(groupKey, []);
        groups.get(groupKey)!.push(q);
      }

      // Convert to array of groups with total marks
      const groupList = Array.from(groups.values()).map(qs => ({
        questions: qs.sort((a, b) => a.questionNumber.localeCompare(b.questionNumber)),
        totalMarks: qs.reduce((sum, q) => sum + q.marks, 0),
      }));

      // Shuffle groups
      const shuffled = groupList.sort(() => Math.random() - 0.5);

      // Select groups to hit target marks
      const selected: typeof allQuestions = [];
      let totalMarks = 0;

      for (const group of shuffled) {
        if (totalMarks >= targetMarks) break;
        if (totalMarks + group.totalMarks <= targetMarks + 8) {
          selected.push(...group.questions);
          totalMarks += group.totalMarks;
        }
      }

      // Sort selected by subject then question number for nice ordering
      selected.sort((a, b) => {
        if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
        return a.questionNumber.localeCompare(b.questionNumber);
      });

      res.json({
        questions: selected,
        totalMarks,
        questionCount: selected.length,
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Export all progress data
  app.get("/api/export", (_req, res) => {
    const allResponses = storage.getAllResponses();
    // Include question identifiers so we can re-match on import
    const allQuestions = storage.getAllQuestions();
    const qMap = new Map(allQuestions.map(q => [q.id, { subject: q.subject, year: q.year, questionNumber: q.questionNumber }]));
    const exportData = allResponses.map(r => {
      const qInfo = qMap.get(r.questionId);
      return {
        ...r,
        _questionSubject: qInfo?.subject,
        _questionYear: qInfo?.year,
        _questionNumber: qInfo?.questionNumber,
      };
    });
    res.json({
      version: 1,
      exportedAt: new Date().toISOString(),
      responses: exportData,
    });
  });

  // Import progress data
  app.post("/api/import", (req, res) => {
    try {
      const { responses } = req.body;
      if (!Array.isArray(responses)) {
        res.status(400).json({ message: "Invalid import data" });
        return;
      }
      // Match by question identifiers and import
      const allQuestions = storage.getAllQuestions();
      const qLookup = new Map<string, number>();
      for (const q of allQuestions) {
        qLookup.set(`${q.subject}|||${q.year}|||${q.questionNumber}`, q.id);
      }

      let imported = 0;
      for (const r of responses) {
        const key = `${r._questionSubject}|||${r._questionYear}|||${r._questionNumber}`;
        const questionId = qLookup.get(key);
        if (!questionId) continue;
        storage.upsertResponse({
          questionId,
          difficulty: r.difficulty || null,
          selfRating: r.selfRating || null,
          flagged: r.flagged || 0,
          completedAt: r.completedAt || new Date().toISOString(),
          sessionId: r.sessionId || "imported",
        });
        imported++;
      }
      res.json({ imported, total: responses.length });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  return httpServer;
}
