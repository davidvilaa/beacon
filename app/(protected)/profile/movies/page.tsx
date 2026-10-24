"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export default function ProfileMoviesPage() {
  return (
    <div>
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Favorite movies
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Link
              key={index}
              href="/search?module=movies"
              className="group aspect-[2/3] rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 hover:border-[#a8dadc]/60 hover:bg-zinc-900/40 transition-all flex flex-col items-center justify-center text-zinc-600 hover:text-[#a8dadc] cursor-pointer"
            >
              <Plus className="w-6 h-6 stroke-[1.5] mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium text-zinc-500 group-hover:text-zinc-300">
                Add favorite
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
