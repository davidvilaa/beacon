"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Film, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Movie, getPosterUrl } from "@/lib/tmdb";

export default function TrendingMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch("/api/movies/trending");
        if (res.ok) {
          const data = await res.json();
          setMovies(data.results || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchTrending();
  }, []);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.75;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Películas en tendencia
          </h2>
          <span className="text-xs text-zinc-600">
            {loading ? "Cargando..." : `${movies.length} disponibles`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            aria-label="Anterior"
            className="w-7 h-7 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:text-zinc-100 text-zinc-400 flex items-center justify-center transition-colors cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={loading || movies.length === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll("right")}
            aria-label="Siguiente"
            className="w-7 h-7 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:text-zinc-100 text-zinc-400 flex items-center justify-center transition-colors cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={loading || movies.length === 0}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="w-[calc(25%-12px)] min-w-[190px] sm:min-w-[210px] md:min-w-[220px] max-w-[245px] shrink-0 animate-pulse"
            >
              <div className="aspect-[2/3] w-full rounded-xl bg-zinc-900/80 border border-zinc-800/60" />
              <div className="h-4 bg-zinc-900 rounded-md mt-3 w-3/4" />
              <div className="h-3 bg-zinc-900/60 rounded-md mt-1.5 w-1/3" />
            </div>
          ))
        ) : movies.length > 0 ? (
          movies.map((movie) => {
            const posterUrl = getPosterUrl(movie.poster_path, "w500");
            const releaseYear = movie.release_date
              ? movie.release_date.slice(0, 4)
              : "—";

            return (
              <div
                key={movie.id}
                className="group w-[calc(25%-12px)] min-w-[190px] sm:min-w-[210px] md:min-w-[220px] max-w-[245px] shrink-0 snap-start cursor-pointer select-none"
              >
                <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 group-hover:border-[#a8dadc]/60 group-hover:shadow-[0_0_20px_rgba(168,218,220,0.12)] transition-all duration-300">
                  {posterUrl ? (
                    <Image
                      src={posterUrl}
                      alt={movie.title}
                      fill
                      sizes="(max-width: 640px) 190px, (max-width: 1024px) 220px, 245px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-zinc-900">
                      <Film className="w-8 h-8 text-zinc-700 mb-2" />
                      <span className="text-xs text-zinc-500 line-clamp-2">
                        {movie.title}
                      </span>
                    </div>
                  )}

                  {movie.vote_average > 0 && (
                    <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 text-[11px] font-semibold text-zinc-200">
                      <Star className="w-3 h-3 text-[#a8dadc] fill-[#a8dadc]" />
                      <span>{movie.vote_average.toFixed(1)}</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 pointer-events-none">
                    <p className="text-[11px] text-zinc-300 line-clamp-3 leading-snug">
                      {movie.overview || "Sin descripción disponible."}
                    </p>
                  </div>
                </div>

                <div className="mt-2.5">
                  <h3 className="text-sm font-semibold text-zinc-200 truncate group-hover:text-[#a8dadc] transition-colors">
                    {movie.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-zinc-500 mt-0.5">
                    <span>{releaseYear}</span>
                    {movie.vote_average > 0 && (
                      <span className="flex items-center gap-1 text-zinc-400 sm:hidden">
                        <Star className="w-3 h-3 text-[#a8dadc] fill-[#a8dadc]" />
                        {movie.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="w-full py-10 text-center text-sm text-zinc-500">
            No se pudieron cargar las películas en tendencia.
          </div>
        )}
      </div>
    </section>
  );
}
