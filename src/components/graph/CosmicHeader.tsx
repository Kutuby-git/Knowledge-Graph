"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowLeft, Sparkles } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  level: 1 | 2 | 3;
  unitCode?: string;
  wordId?: number;
}

interface CosmicHeaderProps {
  breadcrumb: BreadcrumbItem[];
  onBack?: () => void;
  onBreadcrumbClick?: (item: BreadcrumbItem) => void;
}

export function CosmicHeader({
  breadcrumb,
  onBack,
  onBreadcrumbClick,
}: CosmicHeaderProps) {
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="absolute top-0 left-0 right-0 z-20 px-4 py-3
                 bg-[#0A0E1A]/80 backdrop-blur-lg border-b border-white/5"
    >
      <div className="flex items-center gap-3 max-w-screen-2xl mx-auto">
        {/* Back button */}
        <AnimatePresence>
          {breadcrumb.length > 1 && onBack && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={onBack}
              className="flex items-center justify-center w-8 h-8 rounded-full
                         bg-white/5 hover:bg-white/10 text-[#A0A8C0] hover:text-white
                         transition-colors shrink-0"
            >
              <ArrowLeft size={16} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Home link */}
        <Link
          href="/"
          className="text-[#7A82A0] hover:text-[#A0A8C0] transition-colors shrink-0"
        >
          <Sparkles size={18} />
        </Link>

        {/* Title + Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <h1 className="font-[family-name:var(--font-nunito)] font-bold text-sm
                         text-[#F5F0E8]/90 whitespace-nowrap">
            Knowledge Galaxy
          </h1>

          {breadcrumb.length > 1 && (
            <div className="flex items-center gap-1 text-xs text-[#7A82A0] overflow-hidden">
              {breadcrumb.map((item, i) => (
                <span key={`${item.level}-${item.label}`} className="flex items-center gap-1 shrink-0">
                  <ChevronRight size={12} className="text-[#7A82A0]/50" />
                  <button
                    onClick={() => onBreadcrumbClick?.(item)}
                    className={`whitespace-nowrap transition-colors ${
                      i === breadcrumb.length - 1
                        ? "text-[#F5F0E8]/80 font-medium"
                        : "text-[#7A82A0] hover:text-[#A0A8C0]"
                    }`}
                  >
                    {item.label}
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
