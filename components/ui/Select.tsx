"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export interface Option {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface SelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  variant?: "default" | "compact";
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  variant = "default",
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.id === value);
  const isCompact = variant === "compact";

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-md focus:outline-none text-left transition-all cursor-pointer ${
          isCompact
            ? `px-2.5 py-1 bg-zinc-800 border ${
                isOpen ? "border-[#a8dadc]" : "border-zinc-700/80"
              } text-xs font-medium hover:bg-zinc-700/50 hover:border-[#a8dadc]/60 ${
                !selectedOption ? "text-zinc-400" : "text-zinc-200"
              }`
            : `p-2 bg-zinc-950 border ${
                isOpen ? "border-[#a8dadc]" : "border-zinc-800"
              } text-sm hover:bg-zinc-900/50 ${
                !selectedOption ? "text-zinc-500" : "text-zinc-300"
              }`
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`${
            isCompact ? "w-3.5 h-3.5 ml-1.5" : "w-4 h-4 ml-2"
          } text-zinc-400 shrink-0`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700/80 rounded-md shadow-xl py-1 max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 transition-colors cursor-pointer ${
                isCompact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
              } ${
                value === option.id
                  ? "bg-zinc-800 text-[#a8dadc] font-medium"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {option.icon && (
                <span
                  className={
                    value === option.id ? "text-[#a8dadc]" : "text-zinc-400"
                  }
                >
                  {option.icon}
                </span>
              )}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
