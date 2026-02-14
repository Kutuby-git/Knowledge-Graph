"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Unit } from "@/types/database";
import { UNIT_ICONS } from "@/lib/graph/colors";

interface UnitGridProps {
  units: Unit[];
  wordCounts: Record<string, number>;
}

export function UnitGrid({ units, wordCounts }: UnitGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
      {units.map((unit, i) => (
        <motion.div
          key={unit.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <Link href={`/unit/${unit.code}`}>
            <div
              className="relative rounded-2xl p-6 text-white cursor-pointer
                         hover:scale-105 active:scale-95 transition-transform
                         shadow-lg hover:shadow-xl min-h-[160px]
                         flex flex-col items-center justify-center gap-2"
              style={{ backgroundColor: unit.color }}
            >
              <span className="text-4xl" role="img" aria-label={unit.name}>
                {UNIT_ICONS[unit.code] || "📚"}
              </span>
              <h3 className="font-[family-name:var(--font-nunito)] font-bold text-lg text-center leading-tight">
                {unit.name}
              </h3>
              <span className="text-sm opacity-80">
                {wordCounts[unit.code] || 0} words
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
