"use client";

import Link from "next/link";
import { Film, Star, Bookmark, Calendar, Plus, Search } from "lucide-react";
import { PrimaryButton } from "@/components/ui/Button";

export default function ProfileMoviesPage() {
  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
            Cinema Diary
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Your watched films, ratings, reviews, and watchlist.
          </p>
        </div>

        <Link href="/search?module=movies">
          <PrimaryButton className="text-xs py-2 px-3.5 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            <span>Search movies</span>
          </PrimaryButton>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
            <Film className="w-3.5 h-3.5 text-[#a8dadc]" />
            <span>Watched</span>
          </div>
          <p className="text-2xl font-black text-zinc-100">0</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
            <Bookmark className="w-3.5 h-3.5 text-[#a8dadc]" />
            <span>Watchlist</span>
          </div>
          <p className="text-2xl font-black text-zinc-100">0</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
            <Star className="w-3.5 h-3.5 text-[#a8dadc]" />
            <span>Average rating</span>
          </div>
          <p className="text-2xl font-black text-zinc-100">—</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
            <Calendar className="w-3.5 h-3.5 text-[#a8dadc]" />
            <span>This year</span>
          </div>
          <p className="text-2xl font-black text-zinc-100">0</p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Favorite movies
          </h3>
          <span className="text-xs text-zinc-600">4 selected</span>
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

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Recent logs
          </h3>
        </div>

        <div className="p-10 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 text-center flex flex-col items-center justify-center">
          <Film className="w-8 h-8 text-zinc-700 mb-2" />
          <p className="text-xs text-zinc-400 font-medium mb-1">
            You haven&apos;t logged any movies yet
          </p>
          <p className="text-[11px] text-zinc-500 max-w-sm mb-4">
            Search for any movie in global search to start building your diary.
          </p>
          <Link href="/search?module=movies">
            <PrimaryButton className="text-xs py-2 px-3.5">
              Search catalog
            </PrimaryButton>
          </Link>
        </div>
      </section>
    </div>
  );
}
