"use client";

import { motion } from "framer-motion";

interface LevelIndicatorProps {
  currentLevel: 1 | 2 | 3;
  onLevelClick?: (level: 1 | 2 | 3) => void;
}

const levels = [
  { level: 1 as const, label: "Galaxy", icon: "🌌" },
  { level: 2 as const, label: "Cluster", icon: "🪐" },
  { level: 3 as const, label: "Star", icon: "⭐" },
];

export function LevelIndicator({ currentLevel, onLevelClick }: LevelIndicatorProps) {
  return (
    <motion.div
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="absolute left-3 top-1/2 -translate-y-1/2 z-20
                 flex flex-col items-center gap-3"
    >
      {levels.map(({ level, label, icon }) => {
        const isActive = currentLevel === level;
        const isPast = currentLevel > level;
        return (
          <button
            key={level}
            onClick={() => onLevelClick?.(level)}
            disabled={!isPast && !isActive}
            className="group relative flex flex-col items-center"
            title={label}
          >
            {/* Glow ring for active */}
            {isActive && (
              <motion.div
                layoutId="level-glow"
                className="absolute inset-0 -m-1 rounded-full"
                style={{
                  boxShadow: "0 0 12px 3px rgba(200, 210, 240, 0.2)",
                }}
              />
            )}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm
                         transition-all ${
                           isActive
                             ? "bg-white/10 ring-1 ring-white/20"
                             : isPast
                             ? "bg-white/5 hover:bg-white/10 cursor-pointer"
                             : "bg-white/[0.02] opacity-40"
                         }`}
            >
              {icon}
            </div>
            <span
              className={`text-[9px] mt-1 font-[family-name:var(--font-nunito)] transition-colors ${
                isActive
                  ? "text-[#F5F0E8]/70"
                  : "text-[#7A82A0]/50"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}

      {/* Connecting line between dots */}
      <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-px h-[calc(100%-36px)] bg-white/5 -z-10" />
    </motion.div>
  );
}
