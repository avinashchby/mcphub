import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getSecurityColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

export function getSecurityBgColor(score: number): string {
  if (score >= 80) return "bg-green-500/10 border-green-500/20";
  if (score >= 50) return "bg-amber-500/10 border-amber-500/20";
  return "bg-red-500/10 border-red-500/20";
}

export function getSecurityLabel(score: number): string {
  if (score >= 80) return "Verified";
  if (score >= 50) return "Caution";
  return "Unverified";
}
