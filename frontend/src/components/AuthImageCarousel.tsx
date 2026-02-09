"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const images = [
  {
    src: "/images/auth/auth-workspace.png",
    alt: "Workspace Automation",
    text: "Simplify your daily tasks",
  },
  {
    src: "/images/auth/auth-ai-models.png",
    alt: "AI Integration",
    text: "Seamlessly integrate with top AI models",
  },
  {
    src: "/images/auth/auth-verification.png",
    alt: "Secure Verification",
    text: "Secure and verified workflow",
  },
];

export default function AuthImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      <div className="relative w-full max-w-[350px] aspect-square flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Image
              src={images[currentIndex].src}
              alt={images[currentIndex].alt}
              width={350}
              height={350}
              className="w-full h-auto object-contain drop-shadow-xl"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 min-h-[4rem] flex flex-col items-center justify-center w-full">
        <AnimatePresence mode="wait">
          <motion.h2
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-bold text-zinc-900 text-center px-4"
          >
            {images[currentIndex].text}
          </motion.h2>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? "w-6 bg-zinc-900" : "bg-zinc-300 hover:bg-zinc-400"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
