"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Building2, User as UserIcon } from "lucide-react";
import { getPosterUrl } from "@/lib/providers/tmdb/client";
import type { Movie } from "@/lib/providers/tmdb/types";
import Loading from "@/components/ui/Loading";
import MediaCard from "@/components/media/MediaCard";
import ListCard from "@/components/lists/ListCard";
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

function itemKey(item: SearchMovieItem): string {
  return item.href || `${item.moduleType || item.media_type || "media"}-${item.id}`;
}

function SearchContent() {
  const searchParams = useSearchParams();

  const query = searchParams.get("q") || "";

  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [movies, setMovies] = useState<SearchMovieItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastQuery, setLastQuery] = useState(query);
  const requestKeyRef = useRef("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  if (lastQuery !== query) {
    setLastQuery(query);
    setSelectedFilter("all");
    setSortBy("popularity");
  }

  useEffect(() => {
    const handleSearchExecuted = () => {
      setSelectedFilter("all");
      setSortBy("popularity");
    };
    window.addEventListener("beacon-search-executed", handleSearchExecuted);
    return () => window.removeEventListener("beacon-search-executed", handleSearchExecuted);
  }, []);

  const fetchPage = useCallback(
    async (pageNumber: number) => {
      const filterParam =
        selectedFilter !== "all" ? `&module=${encodeURIComponent(selectedFilter)}` : "";
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query.trim())}&page=${pageNumber}${filterParam}&sort_by=${encodeURIComponent(sortBy)}`
      );
      const data = await res.json();
      return {
        results: (data.results || []) as SearchMovieItem[],
        hasMore: Boolean(data.has_more),
      };
    },
    [query, selectedFilter, sortBy]
  );

  useEffect(() => {
    const key = `${query}|${selectedFilter}|${sortBy}`;
    requestKeyRef.current = key;

    if (!query.trim()) {
      setMovies([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setMovies([]);
    setPage(1);
    fetchPage(1)
      .then(({ results, hasMore: more }) => {
        if (requestKeyRef.current !== key) return;
        setMovies(results);
        setHasMore(more);
      })
      .catch(() => {
        if (requestKeyRef.current !== key) return;
        setMovies([]);
        setHasMore(false);
      })
      .finally(() => {
        if (requestKeyRef.current === key) setLoading(false);
      });
  }, [query, selectedFilter, sortBy, fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || loadingMore) return;
    const key = requestKeyRef.current;
    const nextPage = page + 1;
    setLoadingMore(true);
    fetchPage(nextPage)
      .then(({ results, hasMore: more }) => {
        if (requestKeyRef.current !== key) return;
        setMovies((prev) => {
          const seen = new Set(prev.map(itemKey));
          return [...prev, ...results.filter((item) => !seen.has(itemKey(item)))];
        });
        setPage(nextPage);
        setHasMore(more);
      })
      .catch(() => {
        if (requestKeyRef.current === key) setHasMore(false);
      })
      .finally(() => setLoadingMore(false));
  }, [hasMore, loading, loadingMore, page, fetchPage]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore, movies.length]);

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
            onChange={setSelectedFilter}
            options={RESULT_OPTIONS}
            variant="compact"
            className="w-36 sm:w-44"
          />

          <Select
            value={sortBy}
            onChange={setSortBy}
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
                  key={itemKey(movie)}
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

        {hasMore && !loading && (
          <div ref={sentinelRef} className="py-6">
            {loadingMore && <Loading text="" className="py-0" />}
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
