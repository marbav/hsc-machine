import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Questions table - stores all HSC past paper questions
export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subject: text("subject").notNull(),
  topic: text("topic").notNull(),
  year: integer("year").notNull(),
  marks: integer("marks").notNull(),
  questionNumber: text("question_number").notNull(),
  questionText: text("question_text").notNull(),
  // SVG diagram content if this question needs a visual
  diagramSvg: text("diagram_svg"),
  diagramCaption: text("diagram_caption"),
  nesaPaperUrl: text("nesa_paper_url"), // Link to original NESA paper
  diagramImageUrl: text("diagram_image_url"), // Path to generated diagram image
  sampleAnswer: text("sample_answer"),
  paper: text("paper"), // e.g. "Paper 1", "Paper 2"
});

// User responses - tracks ratings, difficulty, flags
export const responses = sqliteTable("responses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  questionId: integer("question_id").notNull(),
  difficulty: text("difficulty"), // "easy", "medium", "hard"
  selfRating: integer("self_rating"), // 1-5
  flagged: integer("flagged").notNull().default(0), // 0 or 1
  completedAt: text("completed_at").notNull(),
  sessionId: text("session_id"),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertResponseSchema = createInsertSchema(responses).omit({ id: true });

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type Question = typeof questions.$inferSelect;
export type Response = typeof responses.$inferSelect;
