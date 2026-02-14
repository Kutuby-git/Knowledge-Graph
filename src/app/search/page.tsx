"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { WordCard } from "@/components/word/WordCard";
import type { Word } from "@/types/database";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Word[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setResults([]);
      return;
    }
    setSearching(true);
    setHasSearched(true);

    const { data } = await supabase.rpc("search_words", {
      query_text: q.trim(),
    });

    setResults((data as Word[]) || []);
    setSearching(false);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link
            href="/"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Home
          </Link>
          <h1 className="font-[family-name:var(--font-nunito)] font-bold text-xl text-gray-900">
            Search Words
          </h1>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 py-8">
        {/* Search Input */}
        <div className="relative mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              search(e.target.value);
            }}
            placeholder="Search Arabic, English, or transliteration..."
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200
                       focus:border-blue-400 focus:outline-none text-lg
                       font-[family-name:var(--font-nunito)] bg-white shadow-sm"
            dir="auto"
            autoFocus
          />
          {searching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {results.map((word) => (
              <WordCard key={word.id} word={word} compact />
            ))}
          </div>
        ) : hasSearched && !searching ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No words found</p>
            <p className="text-gray-300 text-sm mt-1">
              Try searching in Arabic, English, or transliteration
            </p>
          </div>
        ) : !hasSearched ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-400 text-lg">
              Search 768 Quranic Arabic words
            </p>
            <p className="text-gray-300 text-sm mt-1">
              Type in Arabic, English, or transliteration
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
