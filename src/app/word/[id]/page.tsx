"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { ArabicText } from "@/components/ui/ArabicText";
import { WordBadge } from "@/components/word/WordCard";
import { KnowledgeGraph } from "@/components/graph/KnowledgeGraph";
import { buildWordFocusGraph, type GraphData } from "@/lib/graph/transform";
import { UNIT_ICONS, UNIT_NAMES } from "@/lib/graph/colors";
import type { Word } from "@/types/database";

interface WordPageProps {
  params: Promise<{ id: string }>;
}

interface WordConnection {
  word: Word;
  relationship_type: string;
  weight: number;
}

interface WordUnit {
  code: string;
  name: string;
  color: string;
}

export default function WordPage({ params }: WordPageProps) {
  const { id } = use(params);
  const [word, setWord] = useState<Word | null>(null);
  const [connections, setConnections] = useState<WordConnection[]>([]);
  const [themeSiblings, setThemeSiblings] = useState<Array<Word & { shared_theme: string }>>([]);
  const [units, setUnits] = useState<WordUnit[]>([]);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWord() {
      const wordId = parseInt(id);

      // Fetch the word
      const { data: wordData } = await supabase
        .from("words")
        .select("*")
        .eq("id", wordId)
        .single();

      if (!wordData) return;
      setWord(wordData);

      // Fetch connections (relationships)
      const { data: connData } = await supabase.rpc("get_word_connections" , {
        target_word_id: wordId,
      });

      const wordConnections: WordConnection[] = [];
      if (connData) {
        for (const conn of connData as Array<{
          word_id: number;
          arabic: string;
          transliteration: string;
          kids_glossary: string;
          relationship_type: string;
          weight: number;
        }>) {
          wordConnections.push({
            word: {
              id: conn.word_id,
              arabic: conn.arabic,
              transliteration: conn.transliteration,
              kids_glossary: conn.kids_glossary,
            } as Word,
            relationship_type: conn.relationship_type,
            weight: conn.weight,
          });
        }
      }
      setConnections(wordConnections);

      // Fetch theme siblings
      const { data: siblings } = await supabase.rpc("get_theme_siblings" , {
        target_word_id: wordId,
      });
      if (siblings) {
        setThemeSiblings(
          (siblings as Array<{
            word_id: number;
            arabic: string;
            transliteration: string;
            kids_glossary: string;
            shared_theme: string;
          }>).map((s) => ({
            id: s.word_id,
            arabic: s.arabic,
            transliteration: s.transliteration,
            kids_glossary: s.kids_glossary,
            shared_theme: s.shared_theme,
          })) as Array<Word & { shared_theme: string }>
        );
      }

      // Find which unit(s) this word belongs to
      const { data: wtData } = await supabase
        .from("word_themes")
        .select("sub_theme_id")
        .eq("word_id", wordId);

      const unitCodes = new Set<string>();
      if (wtData) {
        for (const wt of wtData) {
          const { data: st } = await supabase
            .from("sub_themes")
            .select("unit_id, units(code, name, color)")
            .eq("id", wt.sub_theme_id)
            .single();
          if (st?.units) {
            const u = st.units as unknown as { code: string; name: string; color: string };
            unitCodes.add(u.code);
            setUnits((prev) => {
              if (prev.find((p) => p.code === u.code)) return prev;
              return [...prev, u];
            });
          }
        }
      }

      // Build focus graph
      const firstUnit = [...unitCodes][0] || "A";
      setGraphData(
        buildWordFocusGraph(wordData, wordConnections, firstUnit)
      );

      setLoading(false);
    }
    loadWord();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!word) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Word not found</p>
      </div>
    );
  }

  const primaryColor = units[0]?.color || "#6B7280";

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link
            href="/"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Home
          </Link>
          {units.map((u) => (
            <Link
              key={u.code}
              href={`/unit/${u.code}`}
              className="text-sm px-2 py-0.5 rounded-full"
              style={{ backgroundColor: u.color + "20", color: u.color }}
            >
              {UNIT_ICONS[u.code]} {UNIT_NAMES[u.code]}
            </Link>
          ))}
        </div>
      </header>

      {/* Word Detail Card */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-t-4" style={{ borderColor: primaryColor }}>
          <ArabicText size="2xl" className="text-gray-900 block mb-4">
            {word.arabic}
          </ArabicText>

          {word.transliteration && (
            <p className="text-lg text-gray-500 italic mb-2">
              {word.transliteration}
            </p>
          )}

          <p
            className="font-[family-name:var(--font-nunito)] font-bold text-2xl mb-4"
            style={{ color: primaryColor }}
          >
            {word.kids_glossary}
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {word.surah_ayah && (
              <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
                Surah:Ayah {word.surah_ayah}
              </span>
            )}
            {word.is_advanced && (
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                Advanced
              </span>
            )}
            {word.part_2 && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                Part 2
              </span>
            )}
            {word.difficulty_score && (
              <span className="bg-yellow-50 px-3 py-1 rounded-full text-sm">
                {"★".repeat(word.difficulty_score)}
                {"☆".repeat(5 - word.difficulty_score)}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Connection Graph */}
      {connections.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 pb-6">
          <h2 className="font-[family-name:var(--font-nunito)] font-bold text-lg mb-3">
            Word Connections
          </h2>
          <KnowledgeGraph data={graphData} height={350} zoomLevel={3} />
        </section>
      )}

      {/* Relationships */}
      {connections.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 pb-6">
          <h2 className="font-[family-name:var(--font-nunito)] font-bold text-lg mb-3">
            Related Words
          </h2>
          <div className="space-y-3">
            {connections.map((conn) => (
              <Link
                key={conn.word.id}
                href={`/word/${conn.word.id}`}
                className="flex items-center gap-4 p-3 bg-white rounded-xl hover:shadow-md transition-shadow"
              >
                <ArabicText size="md" className="text-gray-900">
                  {conn.word.arabic}
                </ArabicText>
                <div className="flex-1">
                  <p className="font-medium">{conn.word.kids_glossary}</p>
                  <p className="text-xs text-gray-400">
                    {conn.word.transliteration}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {conn.relationship_type.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Theme Siblings */}
      {themeSiblings.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 pb-8">
          <h2 className="font-[family-name:var(--font-nunito)] font-bold text-lg mb-3">
            Words in Same Theme
          </h2>
          <div className="flex flex-wrap gap-2">
            {themeSiblings.slice(0, 20).map((s) => (
              <WordBadge
                key={s.id}
                word={s}
                unitCode={units[0]?.code}
              />
            ))}
            {themeSiblings.length > 20 && (
              <span className="text-sm text-gray-400 self-center">
                +{themeSiblings.length - 20} more
              </span>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
