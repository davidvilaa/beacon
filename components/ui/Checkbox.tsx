"use client";

import React from "react";
import { Check } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export default function Checkbox({
  checked,
  onChange,
  label,
  id,
  disabled = false,
  className = "",
}: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2 select-none text-xs transition-colors ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer text-zinc-400 hover:text-zinc-200"
      } ${className}`}
    >
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) onChange(!checked);
        }}
        className={`w-4 h-4 rounded border transition-all flex items-center justify-center shrink-0 ${
          checked
            ? "bg-[#a8dadc] border-[#a8dadc] text-zinc-950"
            : "bg-zinc-900 border-zinc-700 hover:border-zinc-500"
        }`}
      >
        {checked && <Check className="w-3 h-3 stroke-[3]" />}
      </button>
      {label && <span>{label}</span>}
    </label>
  );
}
