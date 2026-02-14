"use client";

import { motion } from "framer-motion";
import { UNIT_COLORS, UNIT_ICONS, UNIT_NAMES } from "@/lib/graph/colors";

interface UnitFilterBarProps {
  activeUnit: string | null;
  onUnitClick: (code: string) => void;
  visible: boolean;
}

const unitCodes = Object.keys(UNIT_COLORS);

export function UnitFilterBar({ activeUnit, onUnitClick, visible }: UnitFilterBarProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20
                 flex items-center gap-1.5 px-3 py-2 rounded-full
                 bg-[#0A0E1A]/80 backdrop-blur-lg border border-white/5"
    >
      {unitCodes.map((code) => {
        const isActive = activeUnit === code;
        return (
          <button
            key={code}
            onClick={() => onUnitClick(code)}
            title={UNIT_NAMES[code]}
            className={`relative w-7 h-7 rounded-full flex items-center justify-center
                       text-xs transition-all ${
                         isActive
                           ? "ring-2 ring-white/30 scale-110"
                           : "opacity-60 hover:opacity-100 hover:scale-105"
                       }`}
            style={{ backgroundColor: `${UNIT_COLORS[code]}${isActive ? "CC" : "40"}` }}
          >
            <span className="text-[10px]">{UNIT_ICONS[code]}</span>
          </button>
        );
      })}
    </motion.div>
  );
}
