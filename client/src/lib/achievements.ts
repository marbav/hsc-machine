// Achievement definitions
export interface AchievementDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  secret?: boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_question", name: "First Steps", emoji: "👣", description: "Complete your first question" },
  { id: "ten_streak", name: "On Fire", emoji: "🔥", description: "Reach a 10-day study streak" },
  { id: "five_star", name: "Perfectionist", emoji: "⭐", description: "Rate yourself 5/5 on a question" },
  { id: "all_subjects", name: "Renaissance", emoji: "🎨", description: "Try a question from every subject" },
  { id: "fifty_questions", name: "Half Century", emoji: "🏏", description: "Complete 50 questions" },
  { id: "hundred_questions", name: "Century", emoji: "💯", description: "Complete 100 questions" },
  { id: "five_hundred", name: "Scholar", emoji: "📚", description: "Complete 500 questions" },
  { id: "night_owl", name: "Night Owl", emoji: "🦉", description: "Study after midnight" },
  { id: "early_bird", name: "Early Bird", emoji: "🐦", description: "Study before 6am" },
  { id: "speed_demon", name: "Speed Demon", emoji: "⚡", description: "Answer a question in under 30 seconds" },
  { id: "flag_ten", name: "Careful Eye", emoji: "🚩", description: "Flag 10 questions for review" },
  { id: "mock_exam", name: "Exam Ready", emoji: "📝", description: "Generate your first mock exam" },
  { id: "all_easy", name: "Confidence", emoji: "😎", description: "Rate 5 questions as Easy in a row" },
  { id: "snake_master", name: "Snake Charmer", emoji: "🐍", description: "Find the snake game easter egg", secret: true },
  { id: "cheat_code", name: "Hacker", emoji: "💻", description: "Use a cheat code", secret: true },
  { id: "level_ten", name: "Double Digits", emoji: "🔟", description: "Reach level 10" },
  { id: "glass_theme", name: "Through the Glass", emoji: "💎", description: "Unlock a glass theme" },
];
