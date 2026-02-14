/**
 * Transform database records into force-graph compatible data structures.
 * Supports three zoom levels: Galaxy (units), Cluster (unit detail), Star (word focus).
 */

import type { Unit, SubTheme, Word } from "@/types/database";
import { UNIT_COLORS, UNIT_ICONS, UNIT_NAMES, RELATIONSHIP_COLORS } from "./colors";

export interface GraphNode {
  id: string;
  label: string;
  arabicLabel?: string;
  type: "unit" | "sub_theme" | "word";
  color: string;
  size: number;
  unitCode?: string;
  emoji?: string;
  wordCount?: number;
  subThemeCount?: number;
  secondaryUnitCode?: string;
  /** Opacity for fade-in animation, lerps from 0 to 1 */
  _opacity?: number;
  // force-graph positions
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
  color: string;
  width: number;
  dashed?: boolean;
  curvature?: number;
  sharedWordCount?: number;
  /** Opacity for fade animation */
  _opacity?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ─── Cross-Unit Connection Type ─────────────────────────────────────────────

export interface CrossUnitConnection {
  unit_code_1: string;
  unit_code_2: string;
  shared_word_count: number;
  sample_words: Array<{ id: number; arabic: string; transliteration: string }> | null;
}

// ─── Word Focus Data Type ───────────────────────────────────────────────────

export interface WordFocusData {
  word: {
    id: number;
    arabic: string;
    transliteration: string | null;
    kids_glossary: string | null;
    surah_ayah: string | null;
    difficulty_score: number | null;
    part_of_speech: string | null;
    root: { letters: string; meaning: string } | null;
  };
  units: Array<{ code: string; name: string; color: string }>;
  relationships: Array<{
    word_id: number;
    arabic: string;
    transliteration: string | null;
    kids_glossary: string | null;
    relationship_type: string;
    weight: number;
  }>;
  theme_siblings: Array<{
    word_id: number;
    arabic: string;
    transliteration: string | null;
    kids_glossary: string | null;
    sub_theme_label: string;
    unit_code: string;
  }>;
}

// ─── Level 1: Galaxy View ───────────────────────────────────────────────────

export function buildGalaxyGraph(
  units: Unit[],
  wordCounts: Record<string, number>,
  crossUnitLinks: CrossUnitConnection[]
): GraphData {
  const nodes: GraphNode[] = units.map((u) => {
    const count = wordCounts[u.code] || 0;
    return {
      id: `unit-${u.code}`,
      label: UNIT_NAMES[u.code] || u.name,
      type: "unit" as const,
      color: u.color || UNIT_COLORS[u.code] || "#888",
      size: Math.max(30, Math.min(55, 30 + (count / 8))),
      unitCode: u.code,
      emoji: UNIT_ICONS[u.code],
      wordCount: count,
      _opacity: 0,
    };
  });

  const links: GraphLink[] = crossUnitLinks.map((conn) => ({
    source: `unit-${conn.unit_code_1}`,
    target: `unit-${conn.unit_code_2}`,
    type: "cross_unit",
    color: "#4A5580",
    width: Math.max(0.5, Math.min(3, conn.shared_word_count / 10)),
    dashed: true,
    curvature: 0.3,
    sharedWordCount: conn.shared_word_count,
    _opacity: 0,
  }));

  return { nodes, links };
}

// ─── Level 2: Cluster View ──────────────────────────────────────────────────

export function buildClusterGraph(
  unit: Unit,
  subThemes: SubTheme[],
  words: Array<Word & { sub_theme_id: number }>,
  relationships?: Array<{
    id: number;
    word_id_1: number;
    word_id_2: number;
    relationship_type: string;
    weight: number;
  }>
): GraphData {
  const color = unit.color || UNIT_COLORS[unit.code] || "#888";
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const wordIdSet = new Set<string>();

  // Central unit node (pinned at center)
  nodes.push({
    id: `unit-${unit.code}`,
    label: UNIT_NAMES[unit.code] || unit.name,
    type: "unit",
    color,
    size: 35,
    unitCode: unit.code,
    emoji: UNIT_ICONS[unit.code],
    wordCount: words.length,
    subThemeCount: subThemes.length,
    fx: 0,
    fy: 0,
    _opacity: 0,
  });

  // Sub-theme nodes
  for (const st of subThemes) {
    const stId = `st-${st.id}`;
    nodes.push({
      id: stId,
      label: st.label,
      type: "sub_theme",
      color,
      size: 13,
      unitCode: unit.code,
      _opacity: 0,
    });
    links.push({
      source: `unit-${unit.code}`,
      target: stId,
      type: "contains",
      color: RELATIONSHIP_COLORS.contains,
      width: 1.5,
      _opacity: 0,
    });
  }

  // Word nodes
  for (const w of words) {
    const wId = `word-${w.id}`;
    if (!wordIdSet.has(wId)) {
      wordIdSet.add(wId);
      nodes.push({
        id: wId,
        label: w.kids_glossary || w.transliteration || "",
        arabicLabel: w.arabic,
        type: "word",
        color,
        size: 6,
        unitCode: unit.code,
        _opacity: 0,
      });
    }
    links.push({
      source: `st-${w.sub_theme_id}`,
      target: wId,
      type: "contains",
      color: RELATIONSHIP_COLORS.contains,
      width: 0.5,
      _opacity: 0,
    });
  }

  // Word relationship edges
  if (relationships) {
    for (const rel of relationships) {
      const srcId = `word-${rel.word_id_1}`;
      const tgtId = `word-${rel.word_id_2}`;
      if (wordIdSet.has(srcId) && wordIdSet.has(tgtId)) {
        links.push({
          source: srcId,
          target: tgtId,
          type: rel.relationship_type,
          color: RELATIONSHIP_COLORS[rel.relationship_type] || "#DFE6E9",
          width: rel.weight * 2,
          dashed: rel.relationship_type === "opposite" || rel.relationship_type === "semantic_similar",
          _opacity: 0,
        });
      }
    }
  }

  return { nodes, links };
}

// ─── Level 3: Star View ────────────────────────────────────────────────────

export function buildStarGraph(focusData: WordFocusData): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeIds = new Set<string>();
  const primaryColor = focusData.units?.[0]?.color || "#888";
  const primaryCode = focusData.units?.[0]?.code || "A";

  // Central word node
  const centralId = `word-${focusData.word.id}`;
  nodeIds.add(centralId);
  nodes.push({
    id: centralId,
    label: focusData.word.kids_glossary || focusData.word.transliteration || "",
    arabicLabel: focusData.word.arabic,
    type: "word",
    color: primaryColor,
    size: 25,
    unitCode: primaryCode,
    fx: 0,
    fy: 0,
    _opacity: 0,
  });

  // Relationship connections (inner ring)
  for (const rel of focusData.relationships) {
    const wId = `word-${rel.word_id}`;
    if (!nodeIds.has(wId)) {
      nodeIds.add(wId);
      nodes.push({
        id: wId,
        label: rel.kids_glossary || rel.transliteration || "",
        arabicLabel: rel.arabic,
        type: "word",
        color: RELATIONSHIP_COLORS[rel.relationship_type] || primaryColor,
        size: 12,
        _opacity: 0,
      });
    }
    links.push({
      source: centralId,
      target: wId,
      type: rel.relationship_type,
      color: RELATIONSHIP_COLORS[rel.relationship_type] || "#DFE6E9",
      width: rel.weight * 2.5,
      dashed: rel.relationship_type === "opposite" || rel.relationship_type === "semantic_similar",
      _opacity: 0,
    });
  }

  // Theme siblings (outer ring) - limit to 20 to keep it manageable
  const siblings = focusData.theme_siblings.slice(0, 20);
  for (const sib of siblings) {
    const wId = `word-${sib.word_id}`;
    if (!nodeIds.has(wId)) {
      nodeIds.add(wId);
      const sibColor = UNIT_COLORS[sib.unit_code] || primaryColor;
      nodes.push({
        id: wId,
        label: sib.kids_glossary || sib.transliteration || "",
        arabicLabel: sib.arabic,
        type: "word",
        color: sibColor,
        size: 7,
        unitCode: sib.unit_code,
        _opacity: 0,
      });
    }
    links.push({
      source: centralId,
      target: wId,
      type: "same_theme",
      color: RELATIONSHIP_COLORS.same_theme,
      width: 0.8,
      _opacity: 0,
    });
  }

  return { nodes, links };
}

// ─── Legacy Compat: buildWordFocusGraph (used by /word/[id] page) ───────────

export function buildWordFocusGraph(
  centralWord: Word,
  connections: Array<{
    word: Word;
    relationship_type: string;
    weight: number;
  }>,
  unitCode: string
): GraphData {
  const focusData: WordFocusData = {
    word: {
      id: centralWord.id,
      arabic: centralWord.arabic,
      transliteration: centralWord.transliteration,
      kids_glossary: centralWord.kids_glossary,
      surah_ayah: centralWord.surah_ayah,
      difficulty_score: centralWord.difficulty_score,
      part_of_speech: centralWord.part_of_speech,
      root: null,
    },
    units: [{ code: unitCode, name: UNIT_NAMES[unitCode] || "", color: UNIT_COLORS[unitCode] || "#888" }],
    relationships: connections.map((c) => ({
      word_id: c.word.id,
      arabic: c.word.arabic,
      transliteration: c.word.transliteration,
      kids_glossary: c.word.kids_glossary,
      relationship_type: c.relationship_type,
      weight: c.weight,
    })),
    theme_siblings: [],
  };
  return buildStarGraph(focusData);
}
