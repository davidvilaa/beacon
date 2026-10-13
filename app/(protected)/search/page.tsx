"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { Film, Tv, Gamepad2, Star, ArrowRight, Clock, CheckCircle } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const mockModules = [
    {
      id: "movies",
      title: "Movies",
      category: "Cine & Series",
      description: "Tu diario de cine personal, listas y valoraciones estilo Letterboxd.",
      icon: Film,
      href: "/movies",
      active: true,
      count: "124 películas registradas",
    },
    {
      id: "anime",
      title: "Anime",
      category: "Manga & Animación",
      description: "Seguimiento de episodios, temporadas y puntuaciones estilo AniList.",
      icon: Tv,
      href: "#",
      active: false,
      count: "Próximamente",
    },
    {
      id: "gaming",
      title: "Gaming & Mounts",
      category: "Videojuegos",
      description: "Tracker de monturas de WoW, logros, drops y coleccionables.",
      icon: Gamepad2,
      href: "#",
      active: false,
      count: "Próximamente",
    },
  ];

  const mockResults = [
    {
      id: "1",
      title: "Interstellar",
      year: "2014",
      module: "Movies",
      status: "Vista",
      rating: "9.5",
      type: "Película",
    },
    {
      id: "2",
      title: "Blade Runner 2049",
      year: "2017",
      module: "Movies",
      status: "Pendiente",
      rating: "—",
      type: "Película",
    },
    {
      id: "3",
      title: "Dune: Parte Dos",
      year: "2024",
      module: "Movies",
      status: "Vista",
      rating: "9.0",
      type: "Película",
    },
    {
      id: "4",
      title: "Riendas de Invencible",
      year: "WotLK",
      module: "Monturas",
      status: "Pendiente (47 intentos)",
      rating: "—",
      type: "Coleccionable",
    },
  ];

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 font-[family-name:var(--font-geist-sans)]">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#a8dadc] mb-1">
          Búsqueda global
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
          {query ? (
            <>
              Resultados para <span className="text-[#a8dadc] italic">"{query}"</span>
            </>
          ) : (
            "Explorar módulos y contenidos"
          )}
        </h1>
      </div>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Módulos encontrados
          </h2>
          <span className="text-xs text-zinc-500 font-mono">
            {mockModules.length} disponibles
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {mockModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.id}
                href={mod.href}
                className="group shrink-0 w-80 p-5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-[#a8dadc]/50 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-[#a8dadc] group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-medium text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/50">
                      {mod.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-zinc-100 group-hover:text-[#a8dadc] transition-colors mb-1">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    {mod.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
                  <span className="text-zinc-500">{mod.count}</span>
                  <span className="text-[#a8dadc] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    {mod.active ? "Abrir" : "Próximamente"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Resultados
          </h2>
          <span className="text-xs text-zinc-500 font-mono">
            {mockResults.length} coincidencias
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {mockResults.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-lg border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0 text-zinc-400 font-bold text-xs">
                  {item.year}
                </div>
                <div className="truncate">
                  <h4 className="text-sm font-semibold text-zinc-100 truncate">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-medium text-[#a8dadc]">
                      {item.module}
                    </span>
                    <span className="text-zinc-600 text-xs">•</span>
                    <span className="text-[11px] text-zinc-400">{item.type}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400">
                  {item.status.includes("Vista") ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{item.status}</span>
                </div>

                {item.rating !== "—" && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-zinc-200 bg-zinc-800 px-2 py-1 rounded border border-zinc-700/50">
                    <Star className="w-3 h-3 text-[#a8dadc] fill-[#a8dadc]" />
                    <span>{item.rating}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Cargando resultados...</div>}>
      <SearchContent />
    </Suspense>
  );
}
