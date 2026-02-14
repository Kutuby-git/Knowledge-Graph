"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { KnowledgeGraph } from "@/components/graph/KnowledgeGraph";
import { GraphControls } from "@/components/graph/GraphControls";
import {
  buildUnitOverviewGraph,
  buildUnitDetailGraph,
  type GraphData,
  type GraphNode,
} from "@/lib/graph/transform";
import type { Unit, SubTheme, Word } from "@/types/database";
import Link from "next/link";

export default function ExplorePage() {
  const router = useRouter();
  const [zoomLevel, setZoomLevel] = useState<1 | 2 | 3>(1);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [units, setUnits] = useState<Unit[]>([]);
  const [activeUnit, setActiveUnit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load units on mount
  useEffect(() => {
    async function loadUnits() {
      const { data } = await supabase
        .from("units")
        .select("*")
        .order("display_order");

      if (data) {
        setUnits(data);

        // Get word counts per unit
        const counts: Record<string, number> = {};
        for (const unit of data) {
          const { count } = await supabase
            .from("word_themes")
            .select("id", { count: "exact", head: true })
            .in(
              "sub_theme_id",
              (
                await supabase
                  .from("sub_themes")
                  .select("id")
                  .eq("unit_id", unit.id)
              ).data?.map((st: { id: number }) => st.id) || []
            );
          counts[unit.code] = count || 0;
        }

        setGraphData(buildUnitOverviewGraph(data, counts));
      }
      setLoading(false);
    }
    loadUnits();
  }, []);

  // Load unit detail when zooming in
  const loadUnitDetail = useCallback(
    async (unitCode: string) => {
      setLoading(true);
      const unit = units.find((u) => u.code === unitCode);
      if (!unit) return;

      const [subThemesRes, wordsRes] = await Promise.all([
        supabase
          .from("sub_themes")
          .select("*")
          .eq("unit_id", unit.id)
          .order("display_order"),
        supabase.rpc("get_unit_graph", { unit_code: unitCode }),
      ]);

      const subThemes = (subThemesRes.data as SubTheme[]) || [];
      const graphResult = wordsRes.data as {
        words?: Array<Word & { sub_theme_id: number }>;
      } | null;

      const words = graphResult?.words || [];

      setGraphData(buildUnitDetailGraph(unit, subThemes, words));
      setActiveUnit(unitCode);
      setZoomLevel(2);
      setLoading(false);
    },
    [units]
  );

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.type === "unit" && zoomLevel === 1) {
        const code = node.id.replace("unit-", "");
        loadUnitDetail(code);
      } else if (node.type === "word") {
        const wordId = node.id.replace("word-", "");
        router.push(`/word/${wordId}`);
      } else if (node.type === "sub_theme" && zoomLevel === 2) {
        // Could zoom to sub-theme level
      }
    },
    [zoomLevel, loadUnitDetail, router]
  );

  const handleBack = useCallback(() => {
    if (zoomLevel === 3) {
      if (activeUnit) {
        loadUnitDetail(activeUnit);
      } else {
        setZoomLevel(1);
        setGraphData(buildUnitOverviewGraph(units, {}));
      }
    } else if (zoomLevel === 2) {
      setZoomLevel(1);
      setActiveUnit(null);
      setGraphData(buildUnitOverviewGraph(units, {}));
    }
  }, [zoomLevel, activeUnit, units, loadUnitDetail]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-4">
        <Link
          href="/"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Home
        </Link>
        <h1 className="font-[family-name:var(--font-nunito)] font-bold text-xl text-gray-900">
          Knowledge Graph
        </h1>
      </header>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <GraphControls
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          activeUnit={activeUnit || undefined}
          onUnitFilter={(code) => {
            if (code) {
              loadUnitDetail(code);
            } else {
              setZoomLevel(1);
              setActiveUnit(null);
              setGraphData(buildUnitOverviewGraph(units, {}));
            }
          }}
          onBack={handleBack}
        />
      </div>

      {/* Graph */}
      <div className="max-w-7xl mx-auto px-4">
        {loading ? (
          <div className="flex items-center justify-center h-[600px] bg-white rounded-xl">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-gray-400">Loading graph...</p>
            </div>
          </div>
        ) : (
          <KnowledgeGraph
            data={graphData}
            height={600}
            zoomLevel={zoomLevel}
            onNodeClick={handleNodeClick}
          />
        )}
      </div>

      {/* Legend */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <span>Click a node to explore deeper</span>
          <span>Scroll to zoom</span>
          <span>Drag to pan</span>
        </div>
      </div>
    </div>
  );
}
