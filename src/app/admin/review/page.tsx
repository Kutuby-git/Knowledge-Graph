"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { ArabicText } from "@/components/ui/ArabicText";
import type { Word } from "@/types/database";

type ReviewStatus = "pending" | "approved" | "rejected";

interface ReviewableWord extends Word {
  review_status?: ReviewStatus;
}

export default function AdminReviewPage() {
  const [words, setWords] = useState<ReviewableWord[]>([]);
  const [filter, setFilter] = useState<"needs_root" | "needs_difficulty" | "all">("needs_root");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDifficulty, setEditDifficulty] = useState<number>(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase.from("words").select("*").order("id").limit(100);

      if (filter === "needs_root") {
        query = query.is("root_id", null);
      } else if (filter === "needs_difficulty") {
        query = query.is("difficulty_score", null);
      }

      const { data } = await query;
      setWords((data as ReviewableWord[]) || []);
      setLoading(false);
    }
    load();
  }, [filter]);

  const saveDifficulty = useCallback(
    async (wordId: number, score: number) => {
      await supabase
        .from("words")
        .update({ difficulty_score: score } )
        .eq("id", wordId);

      setWords((prev) =>
        prev.map((w) =>
          w.id === wordId ? { ...w, difficulty_score: score } : w
        )
      );
      setEditingId(null);
    },
    []
  );

  const stats = {
    total: words.length,
    withRoot: words.filter((w) => w.root_id).length,
    withDifficulty: words.filter((w) => w.difficulty_score).length,
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            ← Home
          </Link>
          <h1 className="font-[family-name:var(--font-nunito)] font-bold text-xl text-gray-900">
            Admin: Review Enrichments
          </h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-500">Showing</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-green-600">{stats.withRoot}</p>
            <p className="text-sm text-gray-500">Have Root</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{stats.withDifficulty}</p>
            <p className="text-sm text-gray-500">Have Difficulty</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(
            [
              ["needs_root", "Missing Root"],
              ["needs_difficulty", "Missing Difficulty"],
              ["all", "All Words"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Word list */}
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <div className="space-y-2">
            {words.map((word) => (
              <div
                key={word.id}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border"
              >
                <span className="text-gray-300 text-sm w-8">#{word.id}</span>

                <ArabicText size="md" className="text-gray-900 min-w-[120px] text-right">
                  {word.arabic}
                </ArabicText>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {word.kids_glossary}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {word.transliteration}
                  </p>
                </div>

                {/* Difficulty editor */}
                {editingId === word.id ? (
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          setEditDifficulty(n);
                          saveDifficulty(word.id, n);
                        }}
                        className={`w-8 h-8 rounded-full text-sm font-bold ${
                          n <= editDifficulty
                            ? "bg-yellow-400 text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(word.id);
                      setEditDifficulty(word.difficulty_score || 1);
                    }}
                    className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    {word.difficulty_score
                      ? `${"★".repeat(word.difficulty_score)}${"☆".repeat(5 - word.difficulty_score)}`
                      : "Set difficulty"}
                  </button>
                )}

                <span className="text-xs text-gray-400">
                  {word.surah_ayah || "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
