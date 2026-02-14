/**
 * Transform database records into force-graph compatible data structures.
 * Supports three zoom levels: Unit Overview, Sub-Theme View, Word Focus.
 */

import type { Unit, SubTheme, Word } from "@/types/database";
import { UNIT_COLORS } from "./colors";

export interface GraphNode {
  id: string;
  label: string;
  arabicLabel?: string;
  type: "unit" | "sub_theme" | "word";
  color: string;
  size: number;
  unitCode?: string;
  // force-graph uses these
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: "contains" | "same_root" | "opposite" | "virtue_pair" | "semantic_similar" | "same_theme";
  color: string;
  width: number;
  dashed?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

/** Level 1: 15 unit nodes with connections based on shared words */
export function buildUnitOverviewGraph(
  units: Unit[],
  wordThemeCounts: Record<string, number>
): GraphData {
  const nodes: GraphNode[] = units.map((u) => ({
    id: `unit-${u.code}`,
    label: u.name,
    type: "unit" as const,
    color: u.color || UNIT_COLORS[u.code] || "#888",
    size: Math.max(20, Math.min(50, (wordThemeCounts[u.code] || 0) / 2)),
    unitCode: u.code,
  }));

  // No links at unit level - units are independent clusters
  return { nodes, links: [] };
}

/** Level 2: Sub-themes + words for a selected unit */
export function buildUnitDetailGraph(
  unit: Unit,
  subThemes: SubTheme[],
  words: Array<Word & { sub_theme_id: number }>
): GraphData {
  const color = unit.color || UNIT_COLORS[unit.code] || "#888";
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // Unit center node
  nodes.push({
    id: `unit-${unit.code}`,
    label: unit.name,
    type: "unit",
    color,
    size: 40,
    unitCode: unit.code,
  });

  // Sub-theme nodes
  for (const st of subThemes) {
    const stId = `st-${st.id}`;
    nodes.push({
      id: stId,
      label: st.label,
      type: "sub_theme",
      color,
      size: 15,
      unitCode: unit.code,
    });
    links.push({
      source: `unit-${unit.code}`,
      target: stId,
      type: "contains",
      color,
      width: 2,
    });
  }

  // Word nodes
  for (const w of words) {
    const wId = `word-${w.id}`;
    if (!nodes.find((n) => n.id === wId)) {
      nodes.push({
        id: wId,
        label: w.kids_glossary || w.transliteration || "",
        arabicLabel: w.arabic,
        type: "word",
        color,
        size: 8,
        unitCode: unit.code,
      });
    }
    links.push({
      source: `st-${w.sub_theme_id}`,
      target: wId,
      type: "contains",
      color,
      width: 1,
    });
  }

  return { nodes, links };
}

/** Level 3: Word focus - selected word at center with all connections */
export function buildWordFocusGraph(
  centralWord: Word,
  connections: Array<{
    word: Word;
    relationship_type: string;
    weight: number;
  }>,
  unitCode: string
): GraphData {
  const color = UNIT_COLORS[unitCode] || "#888";
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // Central word (larger)
  nodes.push({
    id: `word-${centralWord.id}`,
    label: centralWord.kids_glossary || centralWord.transliteration || "",
    arabicLabel: centralWord.arabic,
    type: "word",
    color,
    size: 25,
    unitCode,
  });

  // Connected words
  for (const conn of connections) {
    const wId = `word-${conn.word.id}`;
    if (!nodes.find((n) => n.id === wId)) {
      nodes.push({
        id: wId,
        label: conn.word.kids_glossary || conn.word.transliteration || "",
        arabicLabel: conn.word.arabic,
        type: "word",
        color: getRelationshipColor(conn.relationship_type),
        size: 12,
      });
    }
    links.push({
      source: `word-${centralWord.id}`,
      target: wId,
      type: conn.relationship_type as GraphLink["type"],
      color: getRelationshipColor(conn.relationship_type),
      width: conn.weight * 3,
      dashed: conn.relationship_type === "semantic_similar",
    });
  }

  return { nodes, links };
}

function getRelationshipColor(type: string): string {
  switch (type) {
    case "same_root":
      return "#FF6B6B";
    case "opposite":
      return "#4ECDC4";
    case "virtue_pair":
      return "#45B7D1";
    case "semantic_similar":
      return "#96CEB4";
    case "same_theme":
      return "#FFEAA7";
    default:
      return "#DFE6E9";
  }
}
