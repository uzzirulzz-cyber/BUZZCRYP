"use client";

import { Badge } from "@/components/ui/badge";

export const LEVELS: Record<number, { name: string; color: string; bg: string; icon: string }> = {
  1: { name: "Bronze",   color: "#cd7f32", bg: "rgba(205, 127, 50, 0.15)",  icon: "🥉" },
  2: { name: "Silver",   color: "#c0c0c0", bg: "rgba(192, 192, 192, 0.15)", icon: "🥈" },
  3: { name: "Gold",     color: "#f5b400", bg: "rgba(245, 180, 0, 0.15)",   icon: "🥇" },
  4: { name: "Platinum", color: "#00e5ff", bg: "rgba(0, 229, 255, 0.15)",   icon: "💎" },
  5: { name: "Diamond",  color: "#b388ff", bg: "rgba(179, 136, 255, 0.15)", icon: "💠" },
};

export function LevelBadge({ level }: { level: number }) {
  const info = LEVELS[level] || LEVELS[1];
  return (
    <Badge
      variant="outline"
      className="text-[9px] px-1.5 py-0 font-medium"
      style={{
        borderColor: `${info.color}40`,
        color: info.color,
        backgroundColor: info.bg,
      }}
    >
      {info.icon} {info.name}
    </Badge>
  );
}

export function getLevelName(level: number): string {
  return LEVELS[level]?.name || "Bronze";
}
