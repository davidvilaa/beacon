"use client";

import { useEffect, useState, useRef, Suspense, useMemo } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  Calendar,
  Film,
  ArrowLeft,
  Bookmark,
  Eye,
  Heart,
  Check,
  X,
  Star,
} from "lucide-react";
import { MovieDetails, MovieImage, getPosterUrl, getBackdropUrl } from "@/lib/tmdb";
import Loading from "@/components/ui/Loading";

function formatRuntime(minutes: number | null): string {
  if (!minutes) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function MovieDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPoster, setSelectedPoster] = useState<string | null>(null);
  const [isPosterPickerOpen, setIsPosterPickerOpen] = useState(false);

  const [isWatched, setIsWatched] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  const [activeTab, setActiveTab] = useState<"cast" | "staff" | "details">(
    "cast"
  );
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    async function fetchMovie() {
      try {
        const res = await fetch(`/api/movies/${id}`);
        if (res.ok) {
          const data: MovieDetails = await res.json();
          setMovie(data);
          setSelectedPoster(data.poster_path);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchMovie();
    }
  }, [id]);

  useEffect(() => {
    const currentTabEl = tabRefs.current[activeTab];
    if (currentTabEl) {
      setIndicatorStyle({
        left: currentTabEl.offsetLeft,
        width: currentTabEl.offsetWidth,
      });
    }
  }, [activeTab, movie]);

  const rawPosters = movie?.images?.posters || [];
  const postersList = useMemo(() => {
    const valid = rawPosters.filter((p) => {
      if (p.aspect_ratio && (p.aspect_ratio < 0.55 || p.aspect_ratio > 0.8)) {
        return false;
      }
      return Boolean(p.file_path);
    });

    const sorted = [...valid].sort((a, b) => {
      const countDiff = (b.vote_count ?? 0) - (a.vote_count ?? 0);
      if (countDiff !== 0) return countDiff;
      return (b.vote_average ?? 0) - (a.vote_average ?? 0);
    });

    const curated: MovieImage[] = [];
    const seen = new Set<string>();

    if (selectedPoster) {
      const current = rawPosters.find((p) => p.file_path === selectedPoster);
      if (current) {
        curated.push(current);
        seen.add(current.file_path);
      }
    }

    for (const p of sorted) {
      if (!seen.has(p.file_path)) {
        seen.add(p.file_path);
        curated.push(p);
      }
      if (curated.length >= 30) break;
    }

    return curated;
  }, [rawPosters, selectedPoster]);

  const posterShelves = useMemo(() => {
    const chunkSize = 5;
    const shelves: MovieImage[][] = [];
    for (let i = 0; i < postersList.length; i += chunkSize) {
      shelves.push(postersList.slice(i, i + chunkSize));
    }
    return shelves;
  }, [postersList]);

  if (loading) {
    return (
      <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
        <Loading />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-16 text-center">
        <p className="text-zinc-400 mb-4">Movie could not be found.</p>
        <button
          onClick={() => router.back()}
          className="text-xs text-[#a8dadc] hover:underline cursor-pointer"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const backdropUrl = getBackdropUrl(movie.backdrop_path, "original");
  const posterUrl = getPosterUrl(selectedPoster, "w500");
  const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : "—";
  const hasMultiplePosters = postersList.length > 1;

  const topCast = (movie.credits?.cast || []).slice(0, 15);
  const priorityJobs = [
    "Director",
    "Screenplay",
    "Writer",
    "Story",
    "Director of Photography",
    "Original Music Composer",
    "Editor",
    "Producer",
  ];
  const staffList = (movie.credits?.crew || [])
    .filter((c) => priorityJobs.includes(c.job))
    .slice(0, 15);

  return (
    <div className="relative flex-1 w-full font-[family-name:var(--font-geist-sans)] pb-20">
      {backdropUrl && (
        <div className="absolute top-0 left-0 right-0 h-96 sm:h-[480px] -z-10 overflow-hidden pointer-events-none">
          <Image
            src={backdropUrl}
            alt={movie.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-top opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-900/80 to-zinc-900" />
        </div>
      )}

      <main className="w-full max-w-5xl mx-auto px-6 pt-6 sm:pt-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400 hover:text-[#a8dadc] transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full sm:w-64 md:w-72 shrink-0 flex flex-col items-center">
            <div
              onClick={
                hasMultiplePosters
                  ? () => setIsPosterPickerOpen(true)
                  : undefined
              }
              title={
                hasMultiplePosters
                  ? "Click to change poster"
                  : undefined
              }
              className={`relative aspect-[2/3] w-56 sm:w-full rounded-t-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl ${
                hasMultiplePosters ? "cursor-pointer group" : ""
              }`}
            >
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={movie.title}
                  fill
                  priority
                  sizes="(max-width: 640px) 224px, 288px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
                  <Film className="w-12 h-12 mb-2" />
                  <span className="text-xs text-zinc-500">No poster</span>
                </div>
              )}

              {hasMultiplePosters && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              )}
            </div>

            <div className="w-56 sm:w-full flex items-center justify-around py-2.5 px-3 bg-zinc-900 border border-t-0 border-zinc-800 rounded-b-2xl shadow-xl">
              <button
                type="button"
                onClick={() => setIsWatched(!isWatched)}
                title={isWatched ? "Watched" : "Mark as watched"}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  isWatched
                    ? "text-[#a8dadc] bg-[#a8dadc]/15"
                    : "text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/60"
                }`}
              >
                <Eye className={`w-5 h-5 ${isWatched ? "stroke-[2.5]" : ""}`} />
              </button>

              <button
                type="button"
                onClick={() => setIsLiked(!isLiked)}
                title={isLiked ? "Liked" : "Like"}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  isLiked
                    ? "text-rose-400 bg-rose-500/15"
                    : "text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/60"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${
                    isLiked ? "fill-rose-400 text-rose-400" : ""
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() => setIsWatchlisted(!isWatchlisted)}
                title={isWatchlisted ? "On watchlist" : "Add to watchlist"}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  isWatchlisted
                    ? "text-[#a8dadc] bg-[#a8dadc]/15"
                    : "text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/60"
                }`}
              >
                <Bookmark
                  className={`w-5 h-5 ${
                    isWatchlisted ? "fill-[#a8dadc] text-[#a8dadc]" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-100 tracking-tight leading-tight">
              {movie.title}
            </h1>

            {movie.original_title && movie.original_title !== movie.title && (
              <p className="text-sm text-zinc-500 italic mt-1">
                {movie.original_title}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-zinc-400 mt-3 pb-3 border-b border-zinc-800/80">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>{releaseYear}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>{formatRuntime(movie.runtime)}</span>
              </span>
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="text-[10px] sm:text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 space-y-2 max-w-2xl">
              {movie.tagline && (
                <p className="text-sm italic font-medium text-[#a8dadc]">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}
              <p className="text-sm text-zinc-300 leading-relaxed">
                {movie.overview || "No overview available."}
              </p>
            </div>

            <div className="mt-8">
              <div className="relative border-b border-zinc-800/60 mb-6">
                <div className="flex items-center gap-6">
                  <button
                    ref={(el) => {
                      tabRefs.current["cast"] = el;
                    }}
                    type="button"
                    onClick={() => setActiveTab("cast")}
                    className={`text-sm font-bold uppercase tracking-wider pb-3 transition-colors cursor-pointer ${
                      activeTab === "cast"
                        ? "text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Cast
                  </button>
                  <button
                    ref={(el) => {
                      tabRefs.current["staff"] = el;
                    }}
                    type="button"
                    onClick={() => setActiveTab("staff")}
                    className={`text-sm font-bold uppercase tracking-wider pb-3 transition-colors cursor-pointer ${
                      activeTab === "staff"
                        ? "text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Crew
                  </button>
                  <button
                    ref={(el) => {
                      tabRefs.current["details"] = el;
                    }}
                    type="button"
                    onClick={() => setActiveTab("details")}
                    className={`text-sm font-bold uppercase tracking-wider pb-3 transition-colors cursor-pointer ${
                      activeTab === "details"
                        ? "text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Details
                  </button>
                </div>

                <span
                  className="absolute bottom-0 h-0.5 bg-[#a8dadc] transition-all duration-300 ease-out shadow-[0_0_8px_rgba(168,218,220,0.6)]"
                  style={{
                    left: `${indicatorStyle.left}px`,
                    width: `${indicatorStyle.width}px`,
                  }}
                />
              </div>

              {activeTab === "cast" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {topCast.length > 0 ? (
                    topCast.map((actor) => {
                      const actorPhoto = actor.profile_path
                        ? getPosterUrl(actor.profile_path, "w185")
                        : null;
                      return (
                        <div
                          key={actor.id}
                          className="flex items-center h-14 rounded-full bg-zinc-900/60 border border-zinc-800 hover:border-[#a8dadc]/50 hover:bg-zinc-900 transition-all pr-4 pl-0 group overflow-hidden"
                        >
                          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-zinc-800 shrink-0 border-r border-zinc-800">
                            {actorPhoto ? (
                              <Image
                                src={actorPhoto}
                                alt={actor.name}
                                fill
                                sizes="56px"
                                className="object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500 font-bold">
                                {actor.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="pl-3 min-w-0 flex-1">
                            <p className="text-xs font-semibold text-zinc-200 group-hover:text-zinc-100 truncate">
                              {actor.name}
                            </p>
                            <p className="text-[11px] text-zinc-500 truncate">
                              {actor.character}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-zinc-500 py-4">
                      No cast information available.
                    </p>
                  )}
                </div>
              )}

              {activeTab === "staff" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {staffList.length > 0 ? (
                    staffList.map((person, index) => {
                      const photo = person.profile_path
                        ? getPosterUrl(person.profile_path, "w185")
                        : null;
                      return (
                        <div
                          key={`${person.id}-${person.job}-${index}`}
                          className="flex items-center h-14 rounded-full bg-zinc-900/60 border border-zinc-800 hover:border-[#a8dadc]/50 hover:bg-zinc-900 transition-all pr-4 pl-0 group overflow-hidden"
                        >
                          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-zinc-800 shrink-0 border-r border-zinc-800">
                            {photo ? (
                              <Image
                                src={photo}
                                alt={person.name}
                                fill
                                sizes="56px"
                                className="object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500 font-bold">
                                {person.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="pl-3 min-w-0 flex-1">
                            <p className="text-xs font-semibold text-zinc-200 group-hover:text-zinc-100 truncate">
                              {person.name}
                            </p>
                            <p className="text-[11px] text-zinc-500 truncate">
                              {person.job}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-zinc-500 py-4">
                      No crew information available.
                    </p>
                  )}
                </div>
              )}

              {activeTab === "details" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Original title
                    </p>
                    <p className="text-sm font-semibold text-zinc-200">
                      {movie.original_title || "—"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Status
                    </p>
                    <p className="text-sm font-semibold text-zinc-200">
                      {movie.status || "—"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Original language
                    </p>
                    <p className="text-sm font-semibold text-zinc-200">
                      {movie.original_language?.toUpperCase() || "—"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Budget
                    </p>
                    <p className="text-sm font-semibold text-zinc-200">
                      {movie.budget && movie.budget > 0
                        ? `$${movie.budget.toLocaleString("en-US")}`
                        : "Not available"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Revenue
                    </p>
                    <p className="text-sm font-semibold text-zinc-200">
                      {movie.revenue && movie.revenue > 0
                        ? `$${movie.revenue.toLocaleString("en-US")}`
                        : "Not available"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      TMDB Rating
                    </p>
                    <p className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-[#a8dadc] fill-[#a8dadc]" />
                      <span>{movie.vote_average.toFixed(1)} / 10</span>
                      <span className="text-xs text-zinc-500 font-normal">
                        ({movie.vote_count.toLocaleString("en-US")} votes)
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {isPosterPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3.5 sm:px-5 border-b border-zinc-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                CHANGE ARTWORK
              </h3>
              <button
                type="button"
                onClick={() => setIsPosterPickerOpen(false)}
                aria-label="Close"
                className="text-zinc-400 hover:text-white p-1.5 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-8 pt-16 sm:pt-24 md:pt-28 pb-24 sm:pb-32 overflow-y-auto overflow-x-hidden">
              {posterShelves.map((shelf, shelfIdx) => {
                const baseZ = shelfIdx + 1;
                return (
                  <div
                    key={shelfIdx}
                    className={`relative flex items-center justify-center -space-x-4 sm:-space-x-6 md:-space-x-8 ${
                      shelfIdx > 0 ? "-mt-20 sm:-mt-28 md:-mt-36" : ""
                    }`}
                  >
                    {shelf.map((poster) => {
                      const url = getPosterUrl(poster.file_path, "w342");
                      const isSelected = selectedPoster === poster.file_path;
                      return (
                        <div
                          key={poster.file_path}
                          style={{ zIndex: baseZ }}
                          className="relative shrink-0 transition-all duration-300 ease-out hover:!z-50 hover:-translate-y-16 sm:hover:-translate-y-24 md:hover:-translate-y-28 hover:scale-105 group/card"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPoster(poster.file_path);
                              setIsPosterPickerOpen(false);
                            }}
                            className={`relative block w-28 sm:w-36 md:w-44 aspect-[2/3] rounded-xl overflow-hidden border-2 transition-all cursor-pointer shadow-2xl shadow-black/80 group-hover/card:shadow-[0_25px_45px_rgba(0,0,0,0.95)] ${
                              isSelected
                                ? "border-[#a8dadc] shadow-[0_0_20px_rgba(168,218,220,0.4)]"
                                : "border-zinc-800 group-hover/card:border-[#a8dadc]"
                            }`}
                          >
                            {url && (
                              <Image
                                src={url}
                                alt="Poster option"
                                fill
                                sizes="(max-width: 640px) 112px, 176px"
                                className="object-cover"
                              />
                            )}
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#a8dadc] text-zinc-950 flex items-center justify-center shadow-md z-20">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MovieDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      }
    >
      <MovieDetailContent />
    </Suspense>
  );
}
