"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { KnowledgeGraph } from "@/components/graph/KnowledgeGraph";
import { CosmicHeader } from "@/components/graph/CosmicHeader";
import { NodeInfoPanel } from "@/components/graph/NodeInfoPanel";
import { LevelIndicator } from "@/components/graph/LevelIndicator";
import { GraphLegend } from "@/components/graph/GraphLegend";
import { UnitFilterBar } from "@/components/graph/UnitFilterBar";
import { SearchOverlay } from "@/components/graph/SearchOverlay";
import { LoadingCosmic } from "@/components/graph/LoadingCosmic";
import {
  buildGalaxyGraph,
  buildClusterGraph,
  buildStarGraph,
  type GraphData,
  type GraphNode,
  type CrossUnitConnection,
  type WordFocusData,
} from "@/lib/graph/transform";
import type { Unit, SubTheme, Word } from "@/types/database";

interface BreadcrumbItem {
  label: string;
  level: 1 | 2 | 3;
  unitCode?: string;
  wordId?: number;
}

export default function ExplorePage() {
  const [zoomLevel, setZoomLevel] = useState<1 | 2 | 3>(1);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [units, setUnits] = useState<Unit[]>([]);
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});
  const [crossUnitLinks, setCrossUnitLinks] = useState<CrossUnitConnection[]>([]);
  const [activeUnit, setActiveUnit] = useState<string | null>(null);
  const [, setActiveWord] = useState<number | null>(null);
  const [, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([
    { label: "Galaxy", level: 1 },
  ]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const [windowSize, setWindowSize] = useState({ w: 800, h: 600 });

  // Track window size for fullscreen graph
  useEffect(() => {
    const update = () =>
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ─── Level 1: Load Galaxy Data ──────────────────────────────────────────

  useEffect(() => {
    async function loadGalaxy() {
      const [unitsRes, crossRes] = await Promise.all([
        supabase.from("units").select("*").order("display_order"),
        supabase.rpc("get_cross_unit_connections"),
      ]);

      const unitData = (unitsRes.data as Unit[]) || [];
      setUnits(unitData);

      // Get word counts per unit
      const counts: Record<string, number> = {};
      const countPromises = unitData.map(async (unit) => {
        const subThemesRes = await supabase
          .from("sub_themes")
          .select("id")
          .eq("unit_id", unit.id);
        const stIds = subThemesRes.data?.map((st: { id: number }) => st.id) || [];
        if (stIds.length === 0) {
          counts[unit.code] = 0;
          return;
        }
        const { count } = await supabase
          .from("word_themes")
          .select("id", { count: "exact", head: true })
          .in("sub_theme_id", stIds);
        counts[unit.code] = count || 0;
      });
      await Promise.all(countPromises);

      setWordCounts(counts);
      const crossLinks = (crossRes.data as CrossUnitConnection[]) || [];
      setCrossUnitLinks(crossLinks);
      setGraphData(buildGalaxyGraph(unitData, counts, crossLinks));
      setLoading(false);

      // Zoom to fit after data loads
      setTimeout(() => {
        graphRef.current?.zoomToFit?.(800, 60);
      }, 500);
    }
    loadGalaxy();
  }, []);

  // ─── Level 2: Load Cluster Data ─────────────────────────────────────────

  const loadCluster = useCallback(
    async (unitCode: string) => {
      setLoading(true);
      const unit = units.find((u) => u.code === unitCode);
      if (!unit) return;

      const [subThemesRes, wordsRes, relsRes] = await Promise.all([
        supabase
          .from("sub_themes")
          .select("*")
          .eq("unit_id", unit.id)
          .order("display_order"),
        supabase.rpc("get_unit_graph", { unit_code: unitCode }),
        supabase
          .from("word_relationships")
          .select("*"),
      ]);

      const subThemes = (subThemesRes.data as SubTheme[]) || [];
      const graphResult = wordsRes.data as {
        words?: Array<Word & { sub_theme_id: number }>;
      } | null;
      const words = graphResult?.words || [];
      const relationships = (relsRes.data as Array<{
        id: number;
        word_id_1: number;
        word_id_2: number;
        relationship_type: string;
        weight: number;
      }>) || [];

      setGraphData(buildClusterGraph(unit, subThemes, words, relationships));
      setActiveUnit(unitCode);
      setActiveWord(null);
      setZoomLevel(2);
      setSelectedNode(null);
      setBreadcrumb([
        { label: "Galaxy", level: 1 },
        { label: unit.name, level: 2, unitCode },
      ]);
      setLoading(false);

      // Camera animation
      setTimeout(() => {
        graphRef.current?.centerAt?.(0, 0, 600);
        graphRef.current?.zoom?.(1.5, 600);
      }, 100);
    },
    [units]
  );

  // ─── Level 3: Load Star Data ────────────────────────────────────────────

  const loadStar = useCallback(
    async (wordId: number) => {
      setLoading(true);

      const { data } = await supabase.rpc("get_word_focus_data", {
        target_word_id: wordId,
      });

      const focusData = (data as unknown as WordFocusData[])?.[0] ??
        (data as unknown as WordFocusData);
      if (!focusData?.word) {
        setLoading(false);
        return;
      }

      setGraphData(buildStarGraph(focusData));
      setActiveWord(wordId);
      setZoomLevel(3);
      setSelectedNode(null);

      const wordLabel =
        focusData.word.kids_glossary || focusData.word.transliteration || "Word";
      setBreadcrumb((prev) => {
        const base = prev.filter((b) => b.level < 3);
        return [...base, { label: wordLabel, level: 3, wordId }];
      });
      setLoading(false);

      setTimeout(() => {
        graphRef.current?.centerAt?.(0, 0, 600);
        graphRef.current?.zoom?.(2, 600);
      }, 100);
    },
    []
  );

  // ─── Node Click Handler ─────────────────────────────────────────────────

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.type === "unit" && zoomLevel === 1) {
        const code = node.id.replace("unit-", "");
        loadCluster(code);
      } else if (node.type === "word") {
        const wordId = parseInt(node.id.replace("word-", ""), 10);
        if (zoomLevel === 2) {
          loadStar(wordId);
        } else if (zoomLevel === 3) {
          // Re-center on new word at L3
          loadStar(wordId);
        }
      } else if (node.type === "sub_theme") {
        // Show info panel
        setSelectedNode(node);
      }
    },
    [zoomLevel, loadCluster, loadStar]
  );

  // ─── Node Hover Handler ─────────────────────────────────────────────────

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
    if (node) {
      setSelectedNode(node);
    }
  }, []);

  // ─── Back Navigation ───────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    if (zoomLevel === 3) {
      if (activeUnit) {
        loadCluster(activeUnit);
      } else {
        goToGalaxy();
      }
    } else if (zoomLevel === 2) {
      goToGalaxy();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomLevel, activeUnit, loadCluster]);

  const goToGalaxy = useCallback(() => {
    setZoomLevel(1);
    setActiveUnit(null);
    setActiveWord(null);
    setSelectedNode(null);
    setBreadcrumb([{ label: "Galaxy", level: 1 }]);
    setGraphData(buildGalaxyGraph(units, wordCounts, crossUnitLinks));
    setTimeout(() => {
      graphRef.current?.zoomToFit?.(800, 60);
    }, 100);
  }, [units, wordCounts, crossUnitLinks]);

  // ─── Breadcrumb Navigation ─────────────────────────────────────────────

  const handleBreadcrumbClick = useCallback(
    (item: BreadcrumbItem) => {
      if (item.level === 1) goToGalaxy();
      else if (item.level === 2 && item.unitCode) loadCluster(item.unitCode);
      else if (item.level === 3 && item.wordId) loadStar(item.wordId);
    },
    [goToGalaxy, loadCluster, loadStar]
  );

  // ─── Level Indicator Navigation ────────────────────────────────────────

  const handleLevelClick = useCallback(
    (level: 1 | 2 | 3) => {
      if (level === 1) goToGalaxy();
      else if (level === 2 && activeUnit) loadCluster(activeUnit);
    },
    [goToGalaxy, activeUnit, loadCluster]
  );

  // ─── Search Handler ────────────────────────────────────────────────────

  const handleSearchSelect = useCallback(
    (wordId: number) => {
      loadStar(wordId);
    },
    [loadStar]
  );

  // ─── Unit Filter Click ────────────────────────────────────────────────

  const handleUnitFilterClick = useCallback(
    (code: string) => {
      loadCluster(code);
    },
    [loadCluster]
  );

  return (
    <div className="h-screen w-screen bg-[#0A0E1A] relative overflow-hidden">
      {/* Loading overlay */}
      {loading && <LoadingCosmic />}

      {/* Graph fills viewport */}
      <KnowledgeGraph
        data={graphData}
        width={windowSize.w}
        height={windowSize.h}
        zoomLevel={zoomLevel}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        graphRef={graphRef}
      />

      {/* Overlay UI */}
      <CosmicHeader
        breadcrumb={breadcrumb}
        onBack={handleBack}
        onBreadcrumbClick={handleBreadcrumbClick}
      />

      <LevelIndicator
        currentLevel={zoomLevel}
        onLevelClick={handleLevelClick}
      />

      <NodeInfoPanel
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onExploreUnit={(code) => loadCluster(code)}
      />

      <GraphLegend zoomLevel={zoomLevel} />

      <UnitFilterBar
        activeUnit={activeUnit}
        onUnitClick={handleUnitFilterClick}
        visible={zoomLevel === 1}
      />

      <SearchOverlay onSelectWord={handleSearchSelect} />
    </div>
  );
}
