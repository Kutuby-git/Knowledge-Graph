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

/** Cosmic theme palette */
export const COSMIC = {
  bg: "#0A0E1A",
  bgLight: "#0F1628",
  text: "#F5F0E8",
  textDim: "#7A82A0",
  textMid: "#A0A8C0",
  glow: "#1E2A4A",
  border: "#1A2040",
} as const;

/** Relationship type -> color mapping */
export const RELATIONSHIP_COLORS: Record<string, string> = {
  same_root: "#FFD700",
  opposite: "#4ECDC4",
  virtue_pair: "#2ECC71",
  semantic_similar: "#96CEB4",
  same_theme: "#FFEAA7",
  contains: "#334155",
};

/** Lighten a hex color by a given amount (0-1) */
export function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** Darken a hex color by a given amount (0-1) */
export function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** Convert hex to rgba string */
export function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Get a semi-transparent version of a unit color */
export function unitColorAlpha(code: string, alpha: number): string {
  const hex = UNIT_COLORS[code] || "#888888";
  return hexToRgba(hex, alpha);
}
