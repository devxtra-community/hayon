"use client";

import { useState } from "react";

interface ReadMoreTextProps {
  text: string;
  maxLength?: number;
}

export const ReadMoreText = ({ text, maxLength = 160 }: ReadMoreTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;
  if (text.length <= maxLength) {
    return <span className="whitespace-pre-wrap">{text}</span>;
  }

  return (
    <span className="whitespace-pre-wrap">
      {isExpanded ? text : `${text.slice(0, maxLength)}...`}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="ml-1 text-[#0085ff] hover:underline font-semibold text-xs inline-block"
      >
        {isExpanded ? "Show Less" : "Read More"}
      </button>
    </span>
  );
};
