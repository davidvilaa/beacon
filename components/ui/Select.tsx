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
}

export default function Select({ value, onChange, options, placeholder = "Select...", className = "" }: SelectProps) {
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

  const selectedOption = options.find(o => o.id === value);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2 bg-zinc-950 border ${isOpen ? 'border-[#a8dadc]' : 'border-zinc-800'} rounded-md focus:outline-none text-sm text-left hover:bg-zinc-900/50 transition-colors ${!selectedOption ? 'text-zinc-500' : 'text-zinc-300'}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl py-1 max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                value === option.id 
                  ? 'bg-zinc-800 text-[#a8dadc] font-medium' 
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {option.icon && (
                <span className={value === option.id ? 'text-[#a8dadc]' : 'text-zinc-400'}>
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
