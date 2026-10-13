"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { PrimaryButton } from "@/components/ui/Button";
import { Film, Plus, Star, Bookmark, Calendar, Search } from "lucide-react";

export default function MoviesPage() {
  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 font-[family-name:var(--font-geist-sans)]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-zinc-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">
              Módulo de Cine & Series
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-100 tracking-tight">
              Tu diario cinematográfico
            </h1>
            <p className="text-sm text-zinc-400 mt-2 max-w-xl leading-relaxed">
              Registra cada película que veas, puntúala, escribe tus reseñas y mantén tu lista de pendientes siempre organizada.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <PrimaryButton className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Registrar película</span>
            </PrimaryButton>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
              <Film className="w-3.5 h-3.5 text-[#a8dadc]" />
              <span>Películas vistas</span>
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
              <span>Nota media</span>
            </div>
            <p className="text-2xl font-black text-zinc-100">—</p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
              <Calendar className="w-3.5 h-3.5 text-[#a8dadc]" />
              <span>Este año</span>
            </div>
            <p className="text-2xl font-black text-zinc-100">0</p>
          </div>
        </div>

        <div className="p-12 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#a8dadc] mb-4">
            <Film className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-200 mb-1">
            Módulo Movies listo para programar
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mb-6">
            Aquí montaremos el buscador de TMDB para autocompletar carátulas, sinopsis y fechas, además del diario de visionados.
          </p>
        </div>
      </main>
  );
}
