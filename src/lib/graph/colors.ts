/** 15 distinct unit colors matching the database seed values */
export const UNIT_COLORS: Record<string, string> = {
  A: "#E74C3C", // Animals - Red
  B: "#27AE60", // Plants - Green
  C: "#3498DB", // People - Blue
  D: "#8B4513", // Places - Brown
  E: "#F1C40F", // Allah - Gold
  F: "#9B59B6", // Salah - Purple
  G: "#E67E22", // Time - Orange
  H: "#1ABC9C", // Character - Teal
  I: "#E91E63", // Body - Pink
  J: "#2196F3", // Opposites - Light Blue
  K: "#FF9800", // Prophets - Amber
  L: "#4CAF50", // Virtues - Light Green
  M: "#C2185B", // Heart - Deep Pink
  N: "#00BCD4", // Emotions - Cyan
  O: "#795548", // Colors - Brown
};

export const UNIT_ICONS: Record<string, string> = {
  A: "🐪",
  B: "🌿",
  C: "👨‍👩‍👧‍👦",
  D: "🏔️",
  E: "✨",
  F: "🕌",
  G: "🕐",
  H: "⚖️",
  I: "👁️",
  J: "☯️",
  K: "📖",
  L: "💎",
  M: "❤️",
  N: "🌊",
  O: "🎨",
};

export const UNIT_NAMES: Record<string, string> = {
  A: "Animals",
  B: "Plants",
  C: "People",
  D: "Places",
  E: "Names of Allah",
  F: "Salah & Worship",
  G: "Time & Numbers",
  H: "Character & Ethics",
  I: "Body & Senses",
  J: "Opposites",
  K: "Prophets & People",
  L: "Virtue Pairs",
  M: "Heart Actions",
  N: "Emotions",
  O: "Colors & Descriptors",
};

/** Lighten a hex color by a given amount (0-1) */
export function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** Get a semi-transparent version of a unit color */
export function unitColorAlpha(code: string, alpha: number): string {
  const hex = UNIT_COLORS[code] || "#888888";
  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
