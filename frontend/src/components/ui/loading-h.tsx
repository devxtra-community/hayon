"use client";
import { motion } from "framer-motion";

export type LoadingHTheme = "user" | "admin";

type LoadingHProps = {
  theme?: LoadingHTheme;
  className?: string;
};

export const LoadingH = ({ theme = "user", className }: LoadingHProps) => {
  // 7 dots forming the H:
  // Row 1: Col 1, Col 3
  // Row 2: Col 1, Col 2, Col 3
  // Row 3: Col 1, Col 3

  const dotThemeClass =
    theme === "admin"
      ? "from-[#FF5800] to-[#FF8A00] shadow-orange-500/25"
      : "from-[#238c5f] to-[#31ba81] shadow-green-500/20";

  const dotBaseClass = `w-8 h-8 bg-gradient-to-br ${dotThemeClass} shadow-lg`;

  const Dot = ({ index, extraClass = "" }: { index: number; extraClass?: string }) => (
    <motion.div
      initial={{ opacity: 0.3, scale: 0.9 }}
      animate={{
        opacity: [0.3, 1, 0.3],
        scale: [0.9, 1.1, 0.9],
      }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        delay: index * 0.1,
        ease: "easeInOut",
      }}
      className={`${dotBaseClass} rounded-[10px] ${extraClass}`}
    />
  );

  return (
    <div
      className={`flex items-center justify-center min-h-[200px] w-full bg-transparent ${className ?? ""}`}
    >
      <div className="relative grid grid-cols-3 grid-rows-3 gap-1.5">
        {/* Row 1 */}
        <Dot index={0} extraClass="rounded-tl-[26px]" />
        <div /> {/* Empty center-top */}
        <Dot index={4} extraClass="rounded-tr-[26px]" />
        {/* Row 2 */}
        <Dot index={1} />
        <Dot index={2} />
        <Dot index={3} />
        {/* Row 3 */}
        <Dot index={6} extraClass="rounded-bl-[32px]" />
        <div /> {/* Empty center-bottom */}
        <Dot index={5} extraClass="rounded-br-[32px]" />
      </div>
    </div>
  );
};
