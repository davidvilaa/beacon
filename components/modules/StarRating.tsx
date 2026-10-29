"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange: (val: number) => void;
}

export default function StarRating({ value, onChange }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setHoverValue(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFull = displayValue >= star;
          const isHalf = !isFull && displayValue >= star - 0.5;

          return (
            <div key={star} className="relative w-5 h-5 select-none cursor-pointer">
              <Star className="w-5 h-5 text-zinc-700 stroke-[1.5]" />

              {isFull && (
                <div className="absolute inset-0">
                  <Star className="w-5 h-5 text-[#a8dadc] fill-[#a8dadc] stroke-[1.5]" />
                </div>
              )}

              {isHalf && (
                <div className="absolute inset-0 overflow-hidden w-1/2">
                  <Star className="w-5 h-5 text-[#a8dadc] fill-[#a8dadc] stroke-[1.5]" />
                </div>
              )}

              <div
                className="absolute left-0 top-0 bottom-0 w-1/2 z-10"
                onMouseEnter={() => setHoverValue(star - 0.5)}
                onClick={() => onChange(value === star - 0.5 ? 0 : star - 0.5)}
              />

              <div
                className="absolute right-0 top-0 bottom-0 w-1/2 z-10"
                onMouseEnter={() => setHoverValue(star)}
                onClick={() => onChange(value === star ? 0 : star)}
              />
            </div>
          );
        })}
      </div>
      <span className="text-[11px] font-semibold text-zinc-400 min-h-[16px]">
        {displayValue > 0 ? `${displayValue.toFixed(1)} / 5.0` : "No rating"}
      </span>
    </div>
  );
}
