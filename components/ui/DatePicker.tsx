"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseDate(str: string): Date | null {
  if (!str) return null;
  const parts = str.split("-").map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return null;
  }
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatDateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(str: string): string {
  const d = parseDate(str);
  if (!d) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  className = "",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = parseDate(value) || new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  useEffect(() => {
    const d = parseDate(value);
    if (d) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(viewYear, viewMonth, day);
    onChange(formatDateToIso(selected));
    setIsOpen(false);
  };

  const handleSetToday = () => {
    const today = new Date();
    onChange(formatDateToIso(today));
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonthDays = Array.from(
    { length: firstDayOfWeek },
    (_, i) => daysInPrevMonth - firstDayOfWeek + i + 1
  );
  const currentMonthDays = Array.from(
    { length: daysInMonth },
    (_, i) => i + 1
  );

  const totalGridCells = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysCount =
    totalGridCells % 7 === 0 ? 0 : 7 - (totalGridCells % 7);
  const nextMonthDays = Array.from(
    { length: nextMonthDaysCount },
    (_, i) => i + 1
  );

  const selectedDate = parseDate(value);
  const isSelected = (day: number) =>
    selectedDate !== null &&
    selectedDate.getFullYear() === viewYear &&
    selectedDate.getMonth() === viewMonth &&
    selectedDate.getDate() === day;

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-sm bg-zinc-800 border text-xs font-medium transition-all cursor-pointer ${
          isOpen
            ? "border-[#a8dadc] text-zinc-100 bg-zinc-700/60"
            : "border-zinc-700/80 text-zinc-300 hover:border-[#a8dadc]/60 hover:text-white hover:bg-zinc-700/50"
        }`}
      >
        <CalendarIcon className="w-3.5 h-3.5 text-[#a8dadc] shrink-0" />
        <span className={value ? "text-zinc-200" : "text-zinc-400 font-mono tracking-wider"}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-64 bg-zinc-950 border border-zinc-700/80 rounded-sm shadow-2xl p-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
            <span className="text-xs font-bold text-zinc-200">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous month"
                className="p-1 rounded-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Next month"
                className="p-1 rounded-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_SHORT.map((d) => (
              <span
                key={d}
                className="text-[10px] font-bold text-zinc-500 py-0.5 uppercase"
              >
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {prevMonthDays.map((d) => (
              <span
                key={`prev-${d}`}
                className="h-7 flex items-center justify-center text-[11px] text-zinc-600 opacity-40 select-none"
              >
                {d}
              </span>
            ))}

            {currentMonthDays.map((d) => {
              const active = isSelected(d);
              const current = isToday(d);
              return (
                <button
                  key={`cur-${d}`}
                  type="button"
                  onClick={() => handleSelectDay(d)}
                  className={`h-7 rounded-sm text-[11px] font-medium transition-all flex items-center justify-center cursor-pointer ${
                    active
                      ? "bg-[#a8dadc] text-zinc-950 font-bold"
                      : current
                      ? "border border-[#a8dadc]/50 text-zinc-200 hover:bg-zinc-800"
                      : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {d}
                </button>
              );
            })}

            {nextMonthDays.map((d) => (
              <span
                key={`next-${d}`}
                className="h-7 flex items-center justify-center text-[11px] text-zinc-600 opacity-40 select-none"
              >
                {d}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-zinc-800 text-[11px]">
            <button
              type="button"
              onClick={handleSetToday}
              className="text-[#a8dadc] hover:underline font-semibold cursor-pointer"
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
