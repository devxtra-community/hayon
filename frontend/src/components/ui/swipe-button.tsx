"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useState, useRef } from "react";

interface SwipeButtonProps {
  onSwipeComplete: () => void;
  text?: string;
  className?: string;
}

export const SwipeButton = ({
  onSwipeComplete,
  text = "swipe to sign up",
  className = "",
}: SwipeButtonProps) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  // Calculate the track width minus the button width
  const trackWidth = 280;
  const buttonSize = 56;
  const maxDrag = trackWidth - buttonSize - 8; // 8px for padding

  // Transform for text opacity (fades as you drag)
  const textOpacity = useTransform(x, [0, maxDrag * 0.5], [1, 0]);

  // Transform for background color progress
  // const bgProgress = useTransform(x, [0, maxDrag], [0, 1]);

  const handleDragEnd = () => {
    const currentX = x.get();
    if (currentX >= maxDrag * 0.8) {
      // Swiped far enough - complete the action
      setIsCompleted(true);
      setTimeout(() => {
        onSwipeComplete();
      }, 400);
    }
  };

  return (
    <div
      ref={constraintsRef}
      className={`relative h-16 w-[280px] md:w-[320px] rounded-full bg-gray-200/80 flex items-center overflow-hidden shadow-inner ${className}`}
    >
      {/* Background fill on swipe */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 bg-[#318d62]/10 rounded-full"
        style={{ width: useTransform(x, [0, maxDrag], ["0%", "100%"]) }}
      />

      {/* Text */}
      <motion.span
        style={{ opacity: textOpacity }}
        className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium pl-14 select-none"
      >
        {text}
      </motion.span>

      {/* Draggable Button */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        animate={isCompleted ? { x: maxDrag } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={`absolute left-1 w-14 h-14 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg transition-colors duration-300 ${
          isCompleted ? "bg-[#318d62]" : "bg-gray-900"
        }`}
      >
        {isCompleted ? (
          <Check className="w-6 h-6 text-white" />
        ) : (
          <ArrowRight className="w-6 h-6 text-white" />
        )}
      </motion.div>
    </div>
  );
};
