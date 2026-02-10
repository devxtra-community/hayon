"use client";
import { motion, Variants } from "framer-motion";

export const LoadingH = () => {
  const dotVariants: Variants = {
    initial: { opacity: 0.3, scale: 0.9 },
    animate: (i: number) => ({
      opacity: [0.3, 1, 0.3],
      scale: [0.9, 1.1, 0.9],
      transition: {
        duration: 2,
        repeat: Infinity,
        delay: i * 0.15,
        ease: "easeInOut",
      },
    }),
  };

  // 7 dots forming the H as per image:
  // Top row: [0,0], [2,0]
  // Mid row: [0,1], [1,1], [2,1]
  // Bot row: [0,2], [2,2]

  const dotBaseClass =
    "w-8 h-8 bg-gradient-to-br from-[#238c5f] to-[#31ba81] shadow-lg shadow-green-500/20";

  return (
    <div className="flex items-center justify-center min-h-[200px] w-full bg-transparent">
      <div className="relative grid grid-cols-3 grid-rows-3 gap-1.5">
        {/* Row 1 */}
        <motion.div
          custom={0}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          className={`${dotBaseClass} rounded-[10px] rounded-tl-[26px]`}
        />
        <div /> {/* Empty center-top */}
        <motion.div
          custom={4}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          className={`${dotBaseClass} rounded-[10px] rounded-tr-[26px]`}
        />
        {/* Row 2 */}
        <motion.div
          custom={1}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          className={`${dotBaseClass} rounded-[10px]`}
        />
        <motion.div
          custom={2}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          className={`${dotBaseClass} rounded-[10px]`}
        />
        <motion.div
          custom={3}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          className={`${dotBaseClass} rounded-[10px]`}
        />
        {/* Row 3 */}
        <motion.div
          custom={6}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          className={`${dotBaseClass} rounded-[10px] rounded-bl-[32px]`}
        />
        <div /> {/* Empty center-bottom */}
        <motion.div
          custom={5}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          className={`${dotBaseClass} rounded-[10px] rounded-br-[32px]`}
        />
      </div>
    </div>
  );
};
