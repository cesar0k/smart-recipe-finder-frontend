import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const capitalize = (s: string) => {
  if (typeof s !== "string" || s.length === 0) {
    return s;
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const DIFFICULTY_KEYS = {
  Easy: "difficulty.Easy",
  Medium: "difficulty.Medium",
  Hard: "difficulty.Hard",
} as const;

export const getDifficultyKey = (
  difficulty: string
): (typeof DIFFICULTY_KEYS)[keyof typeof DIFFICULTY_KEYS] => {
  const capitalized = capitalize(difficulty);
  if (capitalized in DIFFICULTY_KEYS) {
    return DIFFICULTY_KEYS[capitalized as keyof typeof DIFFICULTY_KEYS];
  }
  return "difficulty.Easy";
};