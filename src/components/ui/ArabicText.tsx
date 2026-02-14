"use client";

import { cn } from "@/lib/utils";

interface ArabicTextProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  as?: "span" | "p" | "h1" | "h2" | "h3" | "div";
}

const sizeClasses = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
  "2xl": "text-5xl",
};

export function ArabicText({
  children,
  className,
  size = "md",
  as: Component = "span",
}: ArabicTextProps) {
  return (
    <Component
      className={cn(
        "font-[family-name:var(--font-amiri)] leading-relaxed",
        sizeClasses[size],
        className
      )}
      dir="rtl"
      lang="ar"
    >
      {children}
    </Component>
  );
}
