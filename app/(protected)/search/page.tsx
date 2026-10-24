"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Film,
  Tv,
  Sparkles,
  Gamepad2,
  BookOpen,
  BookCopy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Movie, getPosterUrl } from "@/lib/tmdb";
import Loading from "@/components/ui/Loading";

interface SearchMovieItem extends Movie {
  moduleType?: string;
  media_type?: string;
}

const allModules = [
  { id: "movies", title: "Movies", icon: Film },
  { id: "series", title: "Series", icon: Tv },
  { id: "anime", title: "Anime", icon: Sparkles },
  { id: "games", title: "Games", icon: Gamepad2 },
  { id: "manga", title: "Manga", icon: BookOpen },
  { id: "comics", title: "Comics", icon: BookCopy },
];

function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get("q") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [movies, setMovies] = useState<SearchMovieItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setMovies([]);
      setTotalPages(0);
      setTotalResults(0);
      setLoading(false);
      return;
    }

    let isCancelled = false;
    setLoading(true);

    const moduleParam = selectedModule ? `&module=${encodeURIComponent(selectedModule)}` : "";

    fetch(
      `/api/movies/search?q=${encodeURIComponent(query.trim())}&page=${currentPage}${moduleParam}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled) {
          setMovies(data.results || []);
          setTotalPages(data.total_pages || 0);
          setTotalResults(data.total_results || 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error(err);
          setMovies([]);
          setTotalPages(0);
          setTotalResults(0);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [query, currentPage, selectedModule]);

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage || newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/search?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleModuleClick = (moduleId: string) => {
    setSelectedModule((prev) => (prev === moduleId ? null : moduleId));
    if (currentPage !== 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", "1");
      router.push(`/search?${params.toString()}`);
    }
  };

  const filteredMovies = movies;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 font-[family-name:var(--font-geist-sans)]">
      <p className="text-sm italic text-zinc-400 mb-8">
        results for{" "}
        <span className="text-[#a8dadc] not-italic font-medium">
          &ldquo;{query.toLowerCase()}&rdquo;
        </span>
      </p>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Modules
          </h2>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {allModules.map((mod) => {
            const Icon = mod.icon;
            const isSelected = selectedModule === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => handleModuleClick(mod.id)}
                title={mod.title}
                aria-label={mod.title}
                className={`w-14 h-14 rounded-md border flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0 ${
                  isSelected
                    ? "border-[#a8dadc] bg-[#a8dadc]/15 text-[#a8dadc]"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900"
                }`}
              >
                <Icon className="w-6 h-6" />
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Results
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-44 sm:h-48 md:h-52 rounded-xl bg-zinc-900/30 border border-zinc-800/60 animate-pulse flex items-stretch overflow-hidden"
              >
                <div className="h-full aspect-[2/3] bg-zinc-800/60 shrink-0 border-r border-zinc-800/60" />
                <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between overflow-hidden">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-zinc-800/70 rounded w-1/3" />
                      <div className="h-3 bg-zinc-800/40 rounded w-10" />
                    </div>
                    <div className="h-3 bg-zinc-800/30 rounded w-full" />
                    <div className="h-3 bg-zinc-800/20 rounded w-4/5" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredMovies.length > 0 ? (
            filteredMovies.map((movie) => {
              const posterUrl = getPosterUrl(movie.poster_path, "w342");
              const releaseYear = movie.release_date
                ? movie.release_date.slice(0, 4)
                : "-";

              const isMovie = movie.media_type === "movie" || movie.moduleType === "movies";
              const cardClass =
                "group relative flex items-stretch rounded-xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-[#a8dadc]/60 hover:scale-[1.03] hover:z-10 transition-all duration-200 cursor-pointer overflow-hidden h-44 sm:h-48 md:h-52";

              const cardContent = (
                <>
                  <div className="relative h-full aspect-[2/3] shrink-0 bg-zinc-900 border-r border-zinc-800/80 overflow-hidden">
                    {posterUrl ? (
                      <Image
                        src={posterUrl}
                        alt={movie.title}
                        fill
                        sizes="(max-width: 640px) 120px, (max-width: 768px) 130px, 140px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 p-2 text-center">
                        <Film className="w-6 h-6 text-zinc-700 mb-1" />
                        <span className="text-[10px] text-zinc-600 font-semibold line-clamp-2">
                          {movie.title}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between overflow-hidden">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h3 className="text-sm sm:text-base font-semibold text-zinc-100 group-hover:text-[#a8dadc] transition-colors truncate min-w-0">
                          {movie.title}
                        </h3>

                        <div className="flex items-center shrink-0 text-xs text-zinc-500 font-mono">
                          <span className="inline-block w-[4ch] text-center">
                            {releaseYear}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-400 line-clamp-4 sm:line-clamp-5 leading-relaxed">
                        {movie.overview || "No overview available."}
                      </p>
                    </div>
                  </div>
                </>
              );

              return (
                <Link
                  key={`${movie.moduleType || "media"}-${movie.id}`}
                  href={isMovie ? `/movie/${movie.id}` : `/tv/${movie.id}`}
                  className={cardClass}
                >
                  {cardContent}
                </Link>
              );
            })
          ) : (
            <div className="py-16 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20" />
          )}
        </div>

        {!loading && totalPages > 1 && (!selectedModule || selectedModule === "movies" || selectedModule === "series") && (
          <div className="flex items-center justify-center gap-1.5 mt-8 pt-6 border-t border-zinc-800/60">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label="Previous page"
              className="w-8 h-8 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:text-zinc-100 text-zinc-400 flex items-center justify-center transition-colors cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers(currentPage, totalPages).map((p, idx) => {
              if (p === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-8 h-8 flex items-center justify-center text-xs text-zinc-600 select-none"
                  >
                    ...
                  </span>
                );
              }

              const pageNum = Number(p);
              const isActive = pageNum === currentPage;

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-md text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                    isActive
                      ? "bg-[#a8dadc] text-zinc-950 font-bold border border-[#a8dadc]"
                      : "border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Next page"
              className="w-8 h-8 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:text-zinc-100 text-zinc-400 flex items-center justify-center transition-colors cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[40vh]">
          <Loading />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
