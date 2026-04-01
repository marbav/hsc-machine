// Unlockable title badges that show next to your level
export interface TitleDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlockLevel: number;
}

export const TITLES: TitleDef[] = [
  { id: "rookie", name: "Rookie", emoji: "🌱", description: "Just getting started", unlockLevel: 0 },
  { id: "learner", name: "Learner", emoji: "📖", description: "Building foundations", unlockLevel: 1 },
  { id: "student", name: "Student", emoji: "🎓", description: "Getting into the groove", unlockLevel: 3 },
  { id: "grinder", name: "Grinder", emoji: "⚡", description: "Putting in the work", unlockLevel: 5 },
  { id: "scholar", name: "Scholar", emoji: "🧠", description: "Knowledge is power", unlockLevel: 7 },
  { id: "warrior", name: "Exam Warrior", emoji: "⚔️", description: "Battle-tested and ready", unlockLevel: 9 },
  { id: "elite", name: "Elite", emoji: "💎", description: "Top tier performance", unlockLevel: 11 },
  { id: "master", name: "Master", emoji: "👑", description: "Mastery achieved", unlockLevel: 13 },
  { id: "legend", name: "Legend", emoji: "🔥", description: "Legendary status", unlockLevel: 15 },
  { id: "goat", name: "G.O.A.T.", emoji: "🐐", description: "Greatest of all time", unlockLevel: 18 },
  { id: "bavaro", name: "BAVARO", emoji: "🔮", description: "The one and only", unlockLevel: 999 },
];
