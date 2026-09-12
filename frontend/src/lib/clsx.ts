import { clsx as base, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, with later Tailwind utilities winning. */
export function clsx(...inputs: ClassValue[]): string {
  return twMerge(base(inputs));
}

export type { ClassValue };
