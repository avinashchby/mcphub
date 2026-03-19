"use client";

import * as React from "react";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSecurityColor,
  getSecurityBgColor,
  getSecurityLabel,
} from "@/lib/utils";

interface SecurityBadgeProps {
  /** Security score from 0–100. */
  score: number;
  /** Visual size of the badge. */
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: {
    wrapper: "px-1.5 py-0.5 text-xs gap-1",
    icon: "h-3 w-3",
    score: "text-xs",
  },
  md: {
    wrapper: "px-2 py-1 text-sm gap-1.5",
    icon: "h-3.5 w-3.5",
    score: "text-sm",
  },
  lg: {
    wrapper: "px-3 py-1.5 text-base gap-2",
    icon: "h-4 w-4",
    score: "text-base font-bold",
  },
};

/** Color-coded security badge showing score and verification label. */
export function SecurityBadge({ score, size = "md" }: SecurityBadgeProps) {
  const colorClass = getSecurityColor(score);
  const bgClass = getSecurityBgColor(score);
  const label = getSecurityLabel(score);
  const sz = sizeClasses[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        bgClass,
        colorClass,
        sz.wrapper
      )}
      title={`Security score: ${score}/100`}
    >
      <Shield className={cn(sz.icon, "shrink-0")} />
      <span className={sz.score}>{score}</span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
