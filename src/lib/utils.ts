import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const VULN_TYPES = [
  "xss",
  "sqli",
  "idor",
  "ssrf",
  "rce",
  "lfi",
  "open-redirect",
  "info-disclosure",
  "auth-bypass",
  "csrf",
  "xxe",
  "business-logic",
  "race-condition",
  "other",
] as const;

export const SEVERITIES = ["critical", "high", "medium", "low", "info"] as const;

export const FINDING_STATUSES = [
  "draft",
  "reported",
  "triaged",
  "accepted",
  "resolved",
  "duplicate",
  "na",
] as const;

export const TARGET_STATUSES = ["recon", "hunting", "reported", "idle"] as const;

export const PLATFORMS = [
  "hackerone",
  "bugcrowd",
  "intigriti",
  "independent",
] as const;

export const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  info: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  reported: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  triaged: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  accepted: "bg-green-500/20 text-green-400 border-green-500/30",
  resolved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  duplicate: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  na: "bg-red-500/20 text-red-400 border-red-500/30",
  recon: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  hunting: "bg-green-500/20 text-green-400 border-green-500/30",
  idle: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};
