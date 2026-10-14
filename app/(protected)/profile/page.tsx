"use client";

import Link from "next/link";
import { Film, Tv, Gamepad2, Sparkles, ArrowRight, Clock } from "lucide-react";

export default function ProfileGeneralPage() {
  const activeModules = [
    {
      id: "movies",
      title: "Películas",
      icon: Film,
      href: "/profile/movies",
      stats: "0 vistas · 0 en watchlist",
      desc: "Tu diario de cine, notas y listas personalizadas.",
    },
    {
      id: "series",
      title: "Series",
      icon: Tv,
      href: "/profile/series",
      stats: "0 seguidas",
      desc: "Control de episodios y temporadas al día.",
    },
    {
      id: "anime",
      title: "Anime",
      icon: Sparkles,
      href: "/profile/anime",
      stats: "0 vistos",
      desc: "Registro de animes en emisión y completados.",
    },
    {
      id: "games",
      title: "Videojuegos",
      icon: Gamepad2,
      href: "/profile/games",
      stats: "0 completados",
      desc: "Backlog y biblioteca de juegos terminados.",
    },
  ];

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Tus módulos activos
          </h2>
          <span className="text-xs text-zinc-600">
            {activeModules.length} instalados
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.id}
                href={mod.href}
                className="group p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-[#a8dadc]/60 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-[#a8dadc] group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">
                      {mod.stats}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-zinc-100 group-hover:text-[#a8dadc] transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs text-[#a8dadc] font-medium mt-4 pt-3 border-t border-zinc-800/60 opacity-80 group-hover:opacity-100">
                  <span>Abrir módulo</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Actividad reciente
          </h2>
        </div>

        <div className="p-8 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 text-center flex flex-col items-center justify-center">
          <Clock className="w-8 h-8 text-zinc-700 mb-2" />
          <p className="text-xs text-zinc-500">
            No tienes actividad reciente en tus módulos.
          </p>
        </div>
      </section>
    </div>
  );
}
