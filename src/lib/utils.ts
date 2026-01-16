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