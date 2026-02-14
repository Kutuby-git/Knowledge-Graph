"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { ArabicText } from "@/components/ui/ArabicText";
import { UNIT_ICONS } from "@/lib/graph/colors";
import type { Unit, Word } from "@/types/database";

interface LearningPath {
  unit: Unit;
  words: Word[];
}

export default function LearnPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [activeUnit, setActiveUnit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPaths() {
      const { data: units } = await supabase
        .from("units")
        .select("*")
        .order("display_order");

      if (!units) return;

      const allPaths: LearningPath[] = [];
      for (const unit of units) {
        // Get words ordered by difficulty then theme order
        const { data: subThemes } = await supabase
          .from("sub_themes")
          .select("id")
          .eq("unit_id", unit.id);

        if (!subThemes?.length) continue;

        const stIds = subThemes.map((st) => st.id);
        const { data: wts } = await supabase
          .from("word_themes")
          .select("word_id")
          .in("sub_theme_id", stIds);

        if (!wts?.length) continue;

        const wordIds = [...new Set(wts.map((wt) => wt.word_id))];
        const { data: words } = await supabase
          .from("words")
          .select("*")
          .in("id", wordIds)
          .order("difficulty_score", { ascending: true, nullsFirst: true })
          .order("id");

        if (words) {
          allPaths.push({ unit, words });
        }
      }

      setPaths(allPaths);
      if (allPaths.length > 0) setActiveUnit(allPaths[0].unit.code);
      setLoading(false);
    }
    loadPaths();
  }, []);

  const activePath = paths.find((p) => p.unit.code === activeUnit);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            ← Home
          </Link>
          <h1 className="font-[family-name:var(--font-nunito)] font-bold text-xl text-gray-900">
            Learning Paths
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <>
            {/* Unit selector tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {paths.map(({ unit }) => (
                <button
                  key={unit.code}
                  onClick={() => setActiveUnit(unit.code)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeUnit === unit.code
                      ? "text-white shadow-md"
                      : "bg-white text-gray-600 hover:shadow"
                  }`}
                  style={
                    activeUnit === unit.code
                      ? { backgroundColor: unit.color }
                      : {}
                  }
                >
                  {UNIT_ICONS[unit.code]} {unit.name}
                </button>
              ))}
            </div>

            {/* Word sequence */}
            {activePath && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-4">
                  <h2
                    className="font-bold text-xl"
                    style={{ color: activePath.unit.color }}
                  >
                    {activePath.unit.full_name}
                  </h2>
                  <span className="text-gray-400 text-sm">
                    {activePath.words.length} words
                  </span>
                </div>

                {activePath.words.map((word, i) => (
                  <Link key={word.id} href={`/word/${word.id}`}>
                    <div className="flex items-center gap-4 p-4 bg-white rounded-xl hover:shadow-md transition-shadow border-l-4"
                      style={{ borderColor: activePath.unit.color }}
                    >
                      <span className="text-gray-300 text-sm font-mono w-8">
                        {i + 1}
                      </span>
                      <ArabicText size="md" className="text-gray-900 min-w-[100px] text-right">
                        {word.arabic}
                      </ArabicText>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {word.kids_glossary}
                        </p>
                        <p className="text-xs text-gray-400">
                          {word.transliteration}
                        </p>
                      </div>
                      {word.difficulty_score && (
                        <span className="text-xs text-yellow-500">
                          {"★".repeat(word.difficulty_score)}
                        </span>
                      )}
                      {word.is_advanced && (
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                          ADV
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
