import type { InsertQuestion } from "@shared/schema";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load all 2124 questions from the comprehensive JSON data file
// Extracted from every NESA HSC past paper under current syllabuses:
// English Advanced: 2019-2025 (Paper 1 & Paper 2)
// Biology: 2019-2025
// Mathematics Advanced: 2020-2025
// Mathematics Extension 1: 2020-2025
// Legal Studies: 2015-2025
// Studies of Religion I: 2015-2025
// Business Studies: 2015-2025

function loadSeedData(): InsertQuestion[] {
  try {
    // Try multiple paths to find the seed data
    const paths = [
      resolve(__dirname, "seed-data.json"),
      resolve(process.cwd(), "server/seed-data.json"),
      resolve(process.cwd(), "seed-data.json"),
    ];

    for (const p of paths) {
      try {
        const raw = readFileSync(p, "utf-8");
        const data = JSON.parse(raw);
        console.log(`Loaded ${data.length} questions from ${p}`);
        return data as InsertQuestion[];
      } catch {
        continue;
      }
    }

    console.error("Could not find seed-data.json");
    return [];
  } catch (e) {
    console.error("Error loading seed data:", e);
    return [];
  }
}

export const seedQuestions: InsertQuestion[] = loadSeedData();
