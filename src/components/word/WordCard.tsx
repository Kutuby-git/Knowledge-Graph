"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArabicText } from "@/components/ui/ArabicText";
import type { Word } from "@/types/database";
import { UNIT_COLORS } from "@/lib/graph/colors";

interface WordCardProps {
  word: Word;
  unitCode?: string;
  showLink?: boolean;
  compact?: boolean;
}

export function WordCard({
  word,
  unitCode,
  showLink = true,
  compact = false,
}: WordCardProps) {
  const color = unitCode ? UNIT_COLORS[unitCode] : "#6B7280";

  const content = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-2xl border-2 bg-white shadow-sm hover:shadow-md
                  transition-shadow ${compact ? "p-3" : "p-5"}`}
      style={{ borderColor: color + "40" }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <ArabicText size={compact ? "md" : "lg"} className="text-gray-900">
          {word.arabic}
        </ArabicText>

        {word.transliteration && (
          <p className="text-sm text-gray-500 italic">{word.transliteration}</p>
        )}

        <p
          className={`font-[family-name:var(--font-nunito)] font-semibold ${
            compact ? "text-sm" : "text-base"
          }`}
          style={{ color }}
        >
          {word.kids_glossary}
        </p>

        {!compact && word.surah_ayah && (
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
            {word.surah_ayah}
          </span>
        )}

        {!compact && word.difficulty_score && (
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`text-xs ${
                  i < word.difficulty_score! ? "text-yellow-400" : "text-gray-200"
                }`}
              >
                ★
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

  if (showLink) {
    return <Link href={`/word/${word.id}`}>{content}</Link>;
  }
  return content;
}

interface WordBadgeProps {
  word: Word;
  unitCode?: string;
}

export function WordBadge({ word, unitCode }: WordBadgeProps) {
  const color = unitCode ? UNIT_COLORS[unitCode] : "#6B7280";

  return (
    <Link href={`/word/${word.id}`}>
      <span
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                   text-sm hover:scale-105 transition-transform cursor-pointer"
        style={{ backgroundColor: color + "15", color }}
      >
        <span className="font-[family-name:var(--font-amiri)]" dir="rtl">
          {word.arabic}
        </span>
        <span className="text-gray-500">·</span>
        <span>{word.kids_glossary}</span>
      </span>
    </Link>
  );
}
