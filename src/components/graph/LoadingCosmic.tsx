"use client";

import { motion } from "framer-motion";

export function LoadingCosmic() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0A0E1A]">
      {/* Background dots */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.1, 0.5, 0.1],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Central glow */}
      <div className="relative flex flex-col items-center gap-4">
        <motion.div
          className="w-16 h-16 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(200,210,240,0.3) 0%, rgba(200,210,240,0.05) 50%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.p
          className="text-sm text-[#7A82A0] font-[family-name:var(--font-nunito)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Exploring the cosmos...
        </motion.p>
      </div>
    </div>
  );
}
