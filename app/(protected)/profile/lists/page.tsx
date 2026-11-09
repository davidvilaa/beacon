"use client";

import { ListPlus } from "lucide-react";

export default function ProfileListsPage() {
  return (
    <div className="py-20 rounded-xl border border-zinc-800/40 bg-zinc-900/10 flex flex-col items-center justify-center text-center p-6 min-h-[300px]">
      <ListPlus className="w-12 h-12 text-zinc-700 mb-3 stroke-[1.5]" />
      <h3 className="text-base font-bold text-zinc-200 mb-1">Custom Lists</h3>
      <p className="text-xs text-zinc-500 max-w-sm leading-relaxed mb-6">
        Create and share collections of movies, series, anime, and games.
      </p>
    </div>
  );
}
