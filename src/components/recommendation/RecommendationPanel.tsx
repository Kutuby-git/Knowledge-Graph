"use client";

import { useEffect, useState } from "react";
import { WordBadge } from "@/components/word/WordCard";
import type { Word } from "@/types/database";

interface Recommendation {
  word: Word;
  score: number;
  reasons: string[];
}

interface RecommendationPanelProps {
  wordId: number;
  unitCode?: string;
}

export function RecommendationPanel({ wordId, unitCode }: RecommendationPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/recommendations?wordId=${wordId}&limit=8`);
      const data = await res.json();
      setRecommendations(data.recommendations || []);
      setLoading(false);
    }
    load();
  }, [wordId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded-full w-40" />
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div>
      <h3 className="font-[family-name:var(--font-nunito)] font-bold text-sm text-gray-500 uppercase tracking-wide mb-2">
        Learn Next
      </h3>
      <div className="flex flex-wrap gap-2">
        {recommendations.map((rec) => (
          <div key={rec.word.id} className="group relative">
            <WordBadge word={rec.word} unitCode={unitCode} />
            <div className="hidden group-hover:block absolute bottom-full left-0 mb-1 px-2 py-1
                          bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
              {rec.reasons.join(", ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
