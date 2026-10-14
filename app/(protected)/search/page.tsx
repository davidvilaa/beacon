"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Film, Tv, Gamepad2 } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const allModules = [
    { id: "movies", title: "Movies", icon: Film, href: "/movies" },
    { id: "anime", title: "Anime", icon: Tv, href: "#" },
    { id: "gaming", title: "Gaming", icon: Gamepad2, href: "#" },
  ];

  const matchedModules = query
    ? allModules.filter(
        (m) =>
          m.title.toLowerCase().includes(query.toLowerCase()) ||
          m.id.toLowerCase().includes(query.toLowerCase())
      )
    : allModules;

  const displayModules = matchedModules.length > 0 ? matchedModules : allModules;

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 font-[family-name:var(--font-geist-sans)]">
      <p className="text-sm italic text-zinc-400 mb-10">
        resultados para{" "}
        <span className="text-[#a8dadc] not-italic font-medium">
          "{query.toLowerCase()}"
        </span>
      </p>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Módulos encontrados
          </h2>
          <span className="text-xs text-zinc-600">
            {displayModules.length} disponibles
          </span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {displayModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.id}
                href={mod.href}
                title={mod.title}
                aria-label={mod.title}
                className="w-14 h-14 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-[#a8dadc]/60 flex items-center justify-center text-zinc-400 hover:text-[#a8dadc] transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
              >
                <Icon className="w-6 h-6" />
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
          <span className="text-xs text-zinc-600">0 disponibles</span>
        </div>

        <div className="flex flex-col gap-2.5"></div>
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
