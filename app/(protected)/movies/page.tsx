"use client";

import { Film } from "lucide-react";
import { TrendingMovies } from "@/components/modules/movies";

export default function MoviesPage() {
  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 font-[family-name:var(--font-geist-sans)]">
      <TrendingMovies />

      <section className="w-full mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Actividad de tus amigos
          </h2>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="w-[calc(25%-12px)] min-w-[190px] sm:min-w-[210px] md:min-w-[220px] max-w-[245px] shrink-0"
            >
              <div className="aspect-[2/3] w-full rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 flex flex-col items-center justify-center text-zinc-700">
                <Film className="w-8 h-8 stroke-[1.5] mb-2 opacity-40" />
                <span className="text-[11px] text-zinc-600 font-medium">
                  Sin actividad
                </span>
              </div>
              <div className="mt-2.5 space-y-1.5">
                <div className="h-3.5 bg-zinc-900/50 rounded-md w-3/4" />
                <div className="h-2.5 bg-zinc-900/30 rounded-md w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
