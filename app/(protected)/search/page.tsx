"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Movie, getPosterUrl } from "@/lib/tmdb";
import Loading from "@/components/ui/Loading";
import MediaCard from "@/components/ui/MediaCard";
import ListCard from "@/components/ui/ListCard";
import Select, { Option } from "@/components/ui/Select";

interface SearchMovieItem extends Omit<Movie, "id"> {
  id: number | string;
  moduleType?: string;
  media_type?: string;
  username?: string;
  author?: string | null;
  href?: string;
  famous_works?: string | null;
  description?: string | null;
  isPrivate?: boolean;
  isNumbered?: boolean;
  itemCount?: number;
  updatedAt?: string;
  previewPosters?: (string | null)[];
}

const RESULT_OPTIONS: Option[] = [
  { id: "all", label: "All Formats" },
  { id: "movie", label: "Movies" },
  { id: "tv", label: "Series" },
  { id: "anime", label: "Anime" },
  { id: "game", label: "Games" },
  { id: "user", label: "Users", dividerAbove: true },
  { id: "person", label: "People" },
  { id: "company", label: "Companies" },
  { id: "list", label: "Lists" },
];

const SORT_OPTIONS: Option[] = [
  { id: "popularity", label: "Most Popular" },
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
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

  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [movies, setMovies] = useState<SearchMovieItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedFilter("all");
    setSortBy("popularity");
  }, [query]);

  useEffect(() => {
    const handleSearchExecuted = () => {
      setSelectedFilter("all");
      setSortBy("popularity");
    };
    window.addEventListener("beacon-search-executed", handleSearchExecuted);
    return () => {
      window.removeEventListener("beacon-search-executed", handleSearchExecuted);
      setSelectedFilter("all");
      setSortBy("popularity");
    };
  }, []);

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

    const filterParam =
      selectedFilter !== "all"
        ? `&module=${encodeURIComponent(selectedFilter)}`
        : "";
    const sortParam = `&sort_by=${encodeURIComponent(sortBy)}`;

    fetch(
      `/api/search?q=${encodeURIComponent(
        query.trim()
      )}&page=${currentPage}${filterParam}${sortParam}`
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
  }, [query, currentPage, selectedFilter, sortBy]);

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage || newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/search?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (filterId: string) => {
    setSelectedFilter(filterId);
    if (currentPage !== 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", "1");
      router.push(`/search?${params.toString()}`);
    }
  };

  const handleSortChange = (sortId: string) => {
    setSortBy(sortId);
    if (currentPage !== 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", "1");
      router.push(`/search?${params.toString()}`);
    }
  };

  const filteredMovies = movies;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 font-[family-name:var(--font-geist-sans)]">
      <div className="pb-5 mb-8 border-b border-zinc-800/80 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm italic text-zinc-400">
          results for{" "}
          <span className="text-accent not-italic font-medium">
            &ldquo;{query.toLowerCase()}&rdquo;
          </span>
        </p>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Select
            value={selectedFilter}
            onChange={handleFilterChange}
            options={RESULT_OPTIONS}
            variant="compact"
            className="w-36 sm:w-44"
          />

          <Select
            value={sortBy}
            onChange={handleSortChange}
            options={SORT_OPTIONS}
            variant="compact"
            className="w-36 sm:w-44"
          />
        </div>
      </div>

      <section>
        <div className="divide-y divide-zinc-700/80">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-start gap-4 sm:gap-5 py-4 px-2 animate-pulse"
              >
                <div className="w-20 sm:w-28 md:w-32 aspect-[2/3] rounded-sm bg-zinc-900 border border-zinc-800/80 shrink-0" />
                <div className="flex-1 min-w-0 pt-0.5 sm:pt-1 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-zinc-800/70 rounded-sm w-1/3" />
                    <div className="h-3 bg-zinc-800/40 rounded-sm w-10" />
                  </div>
                  <div className="h-3 bg-zinc-800/30 rounded-sm w-full" />
                  <div className="h-3 bg-zinc-800/20 rounded-sm w-4/5" />
                  <div className="h-3 bg-zinc-800/20 rounded-sm w-2/3" />
                </div>
              </div>
            ))
          ) : filteredMovies.length > 0 ? (
            filteredMovies.map((movie) => {
              if (
                movie.media_type === "list" ||
                movie.moduleType === "list" ||
                movie.moduleType === "lists"
              ) {
                return (
                  <ListCard
                    key={`list-${movie.id}`}
                    list={{
                      id: String(movie.id),
                      title: movie.title,
                      author: movie.author || null,
                      description: movie.description || movie.overview || null,
                      isPrivate: movie.isPrivate,
                      isNumbered: movie.isNumbered,
                      itemCount: movie.itemCount,
                      updatedAt: movie.updatedAt,
                      previewPosters: movie.previewPosters || [],
                    }}
                    href={`/lists/${movie.id}`}
                  />
                );
              }

              if (
                movie.media_type === "user" ||
                movie.moduleType === "user" ||
                movie.moduleType === "users"
              ) {
                const avatarUrl = movie.poster_path;
                const username = movie.username || movie.title;
                return (
                  <Link
                    key={`user-${movie.id}`}
                    href={`/profile/${encodeURIComponent(username)}`}
                    title={username}
                    className="group flex items-start gap-4 sm:gap-5 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors cursor-pointer min-w-0"
                  >
                    <div className="w-20 sm:w-28 md:w-32 shrink-0 flex items-start justify-center">
                      {avatarUrl ? (
                        <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-900 shrink-0">
                          <Image
                            src={avatarUrl}
                            alt={username}
                            fill
                            sizes="(max-width: 640px) 80px, (max-width: 768px) 112px, 128px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-zinc-900 flex items-center justify-center border-2 border-zinc-800 text-zinc-600 shrink-0">
                          <UserIcon className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 text-zinc-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
                      <h3 className="text-xs sm:text-sm md:text-base font-bold uppercase tracking-wider text-zinc-200 group-hover:text-accent transition-colors truncate">
                        {username}
                      </h3>
                      {movie.overview && (
                        <p className="text-xs sm:text-sm text-zinc-400 line-clamp-3 sm:line-clamp-4 leading-relaxed mt-2">
                          {movie.overview}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              }

              if (
                movie.media_type === "person" ||
                movie.moduleType === "person" ||
                movie.moduleType === "people"
              ) {
                const profileUrl = getPosterUrl(movie.poster_path, "w500");
                const famousWorks = movie.famous_works || movie.overview;
                return (
                  <Link
                    key={`person-${movie.id}`}
                    href={`/person/${movie.id}`}
                    title={movie.title}
                    className="group flex items-start gap-4 sm:gap-5 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors cursor-pointer min-w-0"
                  >
                    <div className="relative w-20 sm:w-28 md:w-32 aspect-[2/3] rounded-sm overflow-hidden shrink-0 bg-zinc-900 border border-zinc-800/80">
                      {profileUrl ? (
                        <Image
                          src={profileUrl}
                          alt={movie.title}
                          fill
                          sizes="(max-width: 640px) 80px, (max-width: 768px) 112px, 128px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-2 text-center bg-zinc-900">
                          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500 line-clamp-3 leading-snug select-none">
                            {movie.title}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
                      <h3 className="text-xs sm:text-sm md:text-base font-bold uppercase tracking-wider text-zinc-200 group-hover:text-accent transition-colors truncate">
                        {movie.title}
                      </h3>
                      {famousWorks && (
                        <p className="text-xs sm:text-sm text-zinc-400 line-clamp-3 leading-relaxed mt-2">
                          {famousWorks}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              }

              if (
                movie.media_type === "company" ||
                movie.moduleType === "company" ||
                movie.moduleType === "companies"
              ) {
                const logoUrl = getPosterUrl(movie.poster_path, "w500");
                const famousWorks = movie.famous_works || movie.overview;
                return (
                  <Link
                    key={`company-${movie.id}`}
                    href={`/company/${movie.id}`}
                    title={movie.title}
                    className="group flex items-start gap-4 sm:gap-5 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors cursor-pointer min-w-0"
                  >
                    <div
                      className={`relative w-20 sm:w-28 md:w-32 aspect-[2/3] rounded-sm overflow-hidden shrink-0 border border-zinc-800/80 flex items-center justify-center p-2.5 ${
                        logoUrl ? "bg-white" : "bg-zinc-900"
                      }`}
                    >
                      {logoUrl ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <Image
                            src={logoUrl}
                            alt={movie.title}
                            fill
                            sizes="(max-width: 640px) 80px, (max-width: 768px) 112px, 128px"
                            className="object-contain p-1 sm:p-2"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 p-2 text-center">
                          <Building2 className="w-6 h-6 text-zinc-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
                      <h3 className="text-xs sm:text-sm md:text-base font-bold uppercase tracking-wider text-zinc-200 group-hover:text-accent transition-colors truncate">
                        {movie.title}
                      </h3>
                      {famousWorks && (
                        <p className="text-xs sm:text-sm text-zinc-400 line-clamp-3 leading-relaxed mt-2">
                          {famousWorks}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              }

              const isMovie =
                movie.media_type === "movie" || movie.moduleType === "movies";
              const isAnime =
                movie.media_type === "anime" || movie.moduleType === "anime";
              const isGame =
                movie.media_type === "game" || movie.moduleType === "games";
              const releaseYear = movie.release_date
                ? movie.release_date.slice(0, 4)
                : "";

              const resolvedHref =
                movie.href ||
                (isGame
                  ? `/game/${movie.id}`
                  : isAnime
                  ? `/anime/${movie.id}`
                  : isMovie
                  ? `/movie/${movie.id}`
                  : `/tv/${movie.id}`);

              const resolvedMediaType = isGame
                ? "game"
                : isAnime
                ? "anime"
                : isMovie
                ? "movie"
                : "tv";

              return (
                <MediaCard
                  key={`${movie.moduleType || "media"}-${movie.id}`}
                  variant="horizontal"
                  id={movie.id}
                  href={resolvedHref}
                  mediaType={resolvedMediaType}
                  title={movie.title}
                  posterPath={movie.poster_path}
                  backdropPath={movie.backdrop_path}
                  year={releaseYear}
                  overview={movie.overview}
                />
              );
            })
          ) : (
            <div className="py-16 rounded-sm border border-dashed border-zinc-800 bg-zinc-900/20" />
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-8 pt-6 border-t border-zinc-800/60">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label="Previous page"
              className="w-8 h-8 rounded-sm border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:text-zinc-100 text-zinc-400 flex items-center justify-center transition-colors cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
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
                  className={`w-8 h-8 rounded-sm text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                    isActive
                      ? "bg-accent text-zinc-950 font-bold border border-accent"
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
              className="w-8 h-8 rounded-sm border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:text-zinc-100 text-zinc-400 flex items-center justify-center transition-colors cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
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
