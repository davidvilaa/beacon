"use client";

import { useEffect, useState, useRef, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  Calendar,
  Film,
  Bookmark,
  Eye,
  ListPlus,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { MovieDetails, MovieImage, getPosterUrl, getBackdropUrl } from "@/lib/tmdb";
import Loading from "@/components/ui/Loading";
import FranchiseSlider from "@/components/ui/FranchiseSlider";

function formatRuntime(minutes: number | null): string {
  if (!minutes) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function formatFullDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const [year, month, day] = parts;
  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const mIndex = parseInt(month, 10) - 1;
  const monthName = MONTHS[mIndex] || month;
  return `${monthName} ${parseInt(day, 10)}, ${year}`;
}

interface CrewSectionConfig {
  key: string;
  singular: string;
  plural: string;
  jobs: string[];
}

const CREW_SECTIONS: CrewSectionConfig[] = [
  {
    key: "directors",
    singular: "Director",
    plural: "Directors",
    jobs: ["Director"],
  },
  {
    key: "producers",
    singular: "Producer",
    plural: "Producers",
    jobs: ["Producer", "Co-Producer"],
  },
  {
    key: "exec_producers",
    singular: "Executive Producer",
    plural: "Executive Producers",
    jobs: ["Executive Producer", "Associate Producer"],
  },
  {
    key: "writers",
    singular: "Writer",
    plural: "Writers",
    jobs: [
      "Screenplay",
      "Writer",
      "Story",
      "Original Story",
      "Author",
      "Characters",
      "Novel",
      "Adaptation",
    ],
  },
  {
    key: "casting",
    singular: "Casting",
    plural: "Casting",
    jobs: ["Casting", "Casting Director"],
  },
  {
    key: "editors",
    singular: "Editor",
    plural: "Editors",
    jobs: ["Editor", "Film Editor", "Supervising Film Editor"],
  },
  {
    key: "cinematography",
    singular: "Cinematography",
    plural: "Cinematography",
    jobs: ["Director of Photography", "Cinematography"],
  },
  {
    key: "production_design",
    singular: "Production Design",
    plural: "Production Design",
    jobs: ["Production Design", "Art Direction", "Set Decoration"],
  },
  {
    key: "costume_design",
    singular: "Costume Design",
    plural: "Costume Design",
    jobs: ["Costume Design", "Costume Supervisor"],
  },
  {
    key: "makeup",
    singular: "Hair & Makeup",
    plural: "Hair & Makeup",
    jobs: [
      "Makeup Artist",
      "Hair Department Head",
      "Makeup Department Head",
      "Key Makeup Artist",
      "Hairstylist",
    ],
  },
  {
    key: "music",
    singular: "Music",
    plural: "Music",
    jobs: ["Original Music Composer", "Music", "Music Supervisor"],
  },
  {
    key: "sound",
    singular: "Sound",
    plural: "Sound",
    jobs: [
      "Sound Designer",
      "Sound Re-Recording Mixer",
      "Supervising Sound Editor",
      "Sound Mixer",
      "Sound Effects Editor",
    ],
  },
  {
    key: "vfx",
    singular: "Visual Effects",
    plural: "Visual Effects",
    jobs: [
      "Visual Effects Supervisor",
      "Animation Supervisor",
      "Visual Effects Producer",
    ],
  },
];

function MovieDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPoster, setSelectedPoster] = useState<string | null>(null);
  const [selectedBackdrop, setSelectedBackdrop] = useState<string | null>(null);
  const [isBackdropLoaded, setIsBackdropLoaded] = useState(false);
  const [isCastExpanded, setIsCastExpanded] = useState(false);
  const [isPosterPickerOpen, setIsPosterPickerOpen] = useState(false);

  const [isWatched, setIsWatched] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "cast" | "staff" | "details" | "releases"
  >("cast");
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    let ignore = false;

    async function fetchMovie() {
      try {
        const res = await fetch(`/api/movies/${id}`);
        if (res.ok) {
          const data: MovieDetails = await res.json();
          if (ignore) return;

          const validBackdrops = (data.images?.backdrops || []).filter(
            (b) =>
              Boolean(b.file_path) &&
              (!b.aspect_ratio || (b.aspect_ratio >= 1.4 && b.aspect_ratio <= 2.2))
          );

          const sortedBackdrops = [...validBackdrops].sort(
            (a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0)
          );

          const topBackdrops = sortedBackdrops
            .slice(0, 15)
            .map((b) => b.file_path);

          if (data.backdrop_path && !topBackdrops.includes(data.backdrop_path)) {
            topBackdrops.unshift(data.backdrop_path);
          }

          let chosenBackdrop = data.backdrop_path;
          if (topBackdrops.length > 0) {
            chosenBackdrop =
              topBackdrops[Math.floor(Math.random() * topBackdrops.length)];
          }

          const validPosters = (data.images?.posters || []).filter(
            (p) =>
              Boolean(p.file_path) &&
              (!p.aspect_ratio || (p.aspect_ratio >= 0.55 && p.aspect_ratio <= 0.8))
          );

          const sortedPosters = [...validPosters].sort((a, b) => {
            const countDiff = (b.vote_count ?? 0) - (a.vote_count ?? 0);
            if (countDiff !== 0) return countDiff;
            return (b.vote_average ?? 0) - (a.vote_average ?? 0);
          });

          const chosenPoster = sortedPosters[0]?.file_path || data.poster_path;

          setSelectedBackdrop(chosenBackdrop);
          setSelectedPoster(chosenPoster);
          setIsCastExpanded(false);
          setMovie(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (id) {
      fetchMovie();
    }

    return () => {
      ignore = true;
    };
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

  useEffect(() => {
    setIsBackdropLoaded(false);
  }, [selectedBackdrop]);

  const [dedupedPosters, setDedupedPosters] = useState<MovieImage[] | null>(null);
  const [loadingPosters, setLoadingPosters] = useState(false);

  useEffect(() => {
    setDedupedPosters(null);
    setIsCastExpanded(false);
  }, [id]);

  useEffect(() => {
    if (!id || !isPosterPickerOpen || dedupedPosters) return;

    let ignore = false;

    async function fetchPosters() {
      try {
        setLoadingPosters(true);
        const res = await fetch(`/api/movies/${id}/posters`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.posters?.length) {
            setDedupedPosters(data.posters);
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
        }
      } finally {
        if (!ignore) {
          setLoadingPosters(false);
        }
      }
    }

    fetchPosters();

    return () => {
      ignore = true;
    };
  }, [id, isPosterPickerOpen, dedupedPosters]);

  const sectionCrew = useMemo(() => {
    const raw = movie?.credits?.crew || [];
    return CREW_SECTIONS.map((section) => {
      const peopleMap = new Map<number, { id: number; name: string }>();
      raw.forEach((member) => {
        if (member && member.job && section.jobs.includes(member.job)) {
          if (!peopleMap.has(member.id)) {
            peopleMap.set(member.id, { id: member.id, name: member.name });
          }
        }
      });
      const people = Array.from(peopleMap.values());
      return {
        key: section.key,
        label: people.length > 1 ? section.plural : section.singular,
        people,
      };
    }).filter((section) => section.people.length > 0);
  }, [movie]);

  const releaseDateGroups = useMemo(() => {
    const raw = movie?.release_dates?.results || [];
    let regionNames: Intl.DisplayNames | null = null;
    try {
      regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      regionNames = null;
    }

    const map = new Map<string, { code: string; country: string; certification: string }[]>();

    raw.forEach((item) => {
      let countryName = item.iso_3166_1;
      try {
        if (regionNames) {
          countryName = regionNames.of(item.iso_3166_1) || item.iso_3166_1;
        }
      } catch {
        countryName = item.iso_3166_1;
      }

      const validDates = (item.release_dates || []).filter((r) => Boolean(r.release_date));
      if (validDates.length === 0) return;

      const theatrical =
        validDates.find((r) => r.type === 3) ||
        validDates.find((r) => r.type === 2) ||
        validDates[0];

      const cert =
        validDates.find((r) => Boolean(r.certification?.trim()))?.certification?.trim() || "";

      const dateStr = theatrical?.release_date ? theatrical.release_date.slice(0, 10) : "";
      if (!dateStr) return;

      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push({
        code: item.iso_3166_1,
        country: countryName,
        certification: cert,
      });
    });

    const groups = Array.from(map.entries()).map(([date, countries]) => ({
      date,
      formattedDate: formatFullDate(date),
      countries: countries.sort((a, b) => a.country.localeCompare(b.country)),
    }));

    return groups.sort((a, b) => a.date.localeCompare(b.date));
  }, [movie]);

  if (loading) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
        <Loading />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 text-center">
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

  const backdropUrl = getBackdropUrl(selectedBackdrop, "original");
  const posterUrl = getPosterUrl(selectedPoster, "w500");
  const formattedReleaseDate = formatFullDate(movie.release_date);
  const hasMultiplePosters = (movie.images?.posters?.length || 0) > 1;

  const allCast = movie.credits?.cast || [];
  const displayedCast = isCastExpanded ? allCast : allCast.slice(0, 12);

  return (
    <div className="relative flex-1 w-full font-[family-name:var(--font-geist-sans)] pb-20">
      {backdropUrl && (
        <div className="absolute top-0 left-0 right-0 h-[380px] sm:h-[460px] md:h-[520px] lg:h-[560px] overflow-hidden pointer-events-none select-none -z-0">
          <div
            className="relative mx-auto w-full max-w-[1550px] h-full"
            style={{
              maskImage:
                "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.03) 2%, rgba(0,0,0,0.12) 5%, rgba(0,0,0,0.30) 9%, rgba(0,0,0,0.60) 13%, rgba(0,0,0,0.88) 17%, rgba(0,0,0,1) 21%, rgba(0,0,0,1) 79%, rgba(0,0,0,0.88) 83%, rgba(0,0,0,0.60) 87%, rgba(0,0,0,0.30) 91%, rgba(0,0,0,0.12) 95%, rgba(0,0,0,0.03) 98%, rgba(0,0,0,0) 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.03) 2%, rgba(0,0,0,0.12) 5%, rgba(0,0,0,0.30) 9%, rgba(0,0,0,0.60) 13%, rgba(0,0,0,0.88) 17%, rgba(0,0,0,1) 21%, rgba(0,0,0,1) 79%, rgba(0,0,0,0.88) 83%, rgba(0,0,0,0.60) 87%, rgba(0,0,0,0.30) 91%, rgba(0,0,0,0.12) 95%, rgba(0,0,0,0.03) 98%, rgba(0,0,0,0) 100%)",
            }}
          >
            <div
              className="relative w-full h-full"
              style={{
                maskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 35%, rgba(0,0,0,0.65) 65%, rgba(0,0,0,0.2) 85%, rgba(0,0,0,0) 98%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 35%, rgba(0,0,0,0.65) 65%, rgba(0,0,0,0.2) 85%, rgba(0,0,0,0) 98%)",
              }}
            >
              <Image
                src={backdropUrl}
                alt={movie.title}
                fill
                priority
                sizes="(max-width: 1550px) 100vw, 1550px"
                onLoad={() => setIsBackdropLoaded(true)}
                className={`object-cover object-top transition-opacity duration-500 ease-out ${
                  isBackdropLoaded ? "opacity-95 sm:opacity-100" : "opacity-0"
                }`}
              />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-zinc-950/60 to-transparent pointer-events-none" />
        </div>
      )}

      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-6 sm:pt-8">
        <div
          className={`flex flex-col md:flex-row gap-8 items-start ${
            backdropUrl ? "mt-64 sm:mt-80 md:mt-96 lg:mt-[460px]" : ""
          }`}
        >
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

            <div className="w-56 sm:w-full grid grid-cols-3 bg-zinc-900 border border-t-0 border-zinc-800 rounded-b-2xl overflow-hidden shadow-xl">
              <button
                type="button"
                onClick={() => setIsWatched(!isWatched)}
                title={isWatched ? "Watched" : "Mark as watched"}
                className={`flex items-center justify-center py-3 sm:py-3.5 transition-colors cursor-pointer ${
                  isWatched
                    ? "text-[#a8dadc] bg-[#a8dadc]/15 hover:bg-[#a8dadc]/25"
                    : "text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/70"
                }`}
              >
                <Eye className={`w-5 h-5 ${isWatched ? "stroke-[2.5]" : ""}`} />
              </button>

              <button
                type="button"
                onClick={() => setIsWatchlisted(!isWatchlisted)}
                title={isWatchlisted ? "On watchlist" : "Add to watchlist"}
                className={`flex items-center justify-center py-3 sm:py-3.5 transition-colors cursor-pointer ${
                  isWatchlisted
                    ? "text-[#a8dadc] bg-[#a8dadc]/15 hover:bg-[#a8dadc]/25"
                    : "text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/70"
                }`}
              >
                <Bookmark
                  className={`w-5 h-5 ${
                    isWatchlisted ? "fill-[#a8dadc] text-[#a8dadc]" : ""
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() => setIsInList(!isInList)}
                title={isInList ? "In list" : "Add to list"}
                className={`flex items-center justify-center py-3 sm:py-3.5 transition-colors cursor-pointer ${
                  isInList
                    ? "text-[#a8dadc] bg-[#a8dadc]/15 hover:bg-[#a8dadc]/25"
                    : "text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/70"
                }`}
              >
                <ListPlus className={`w-5 h-5 ${isInList ? "stroke-[2.5]" : ""}`} />
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Movie
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-100 tracking-tight leading-tight">
              {movie.title}
            </h1>

            {movie.original_title && movie.original_title !== movie.title && (
              <p className="text-sm text-zinc-500 italic mt-1">
                {movie.original_title}
              </p>
            )}

            <div className="flex items-center gap-2.5 text-xs text-zinc-400 mt-3 pb-3 border-b border-zinc-800/80">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>{formattedReleaseDate}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>{formatRuntime(movie.runtime)}</span>
              </span>
            </div>

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
                  <button
                    ref={(el) => {
                      tabRefs.current["releases"] = el;
                    }}
                    type="button"
                    onClick={() => setActiveTab("releases")}
                    className={`text-sm font-bold uppercase tracking-wider pb-3 transition-colors cursor-pointer ${
                      activeTab === "releases"
                        ? "text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Releases
                  </button>
                </div>

                <span
                  className="absolute bottom-0 h-0.5 bg-[#a8dadc] transition-all duration-300 ease-out"
                  style={{
                    left: `${indicatorStyle.left}px`,
                    width: `${indicatorStyle.width}px`,
                  }}
                />
              </div>

              {activeTab === "cast" && (
                <div>
                  {displayedCast.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                        {displayedCast.map((actor) => (
                          <Link
                            key={actor.id}
                            href={`/person/${actor.id}`}
                            className="flex flex-col justify-center px-3.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700/80 hover:border-[#a8dadc]/60 hover:bg-zinc-700/50 transition-all group cursor-pointer min-w-0"
                          >
                            <p className="text-xs sm:text-sm font-semibold text-zinc-100 group-hover:text-[#a8dadc] transition-colors truncate">
                              {actor.name}
                            </p>
                            {actor.character && (
                              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                as <span className="text-zinc-300 font-medium">{actor.character}</span>
                              </p>
                            )}
                          </Link>
                        ))}
                      </div>

                      {allCast.length > 12 && (
                        <div className="flex justify-start mt-4">
                          <button
                            type="button"
                            onClick={() => setIsCastExpanded(!isCastExpanded)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-[#a8dadc]/60 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
                          >
                            <span>{isCastExpanded ? "less..." : "more..."}</span>
                            {isCastExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-zinc-500 py-4 col-span-full">
                      No cast information available.
                    </p>
                  )}
                </div>
              )}

              {activeTab === "staff" && (
                <div>
                  {sectionCrew.length > 0 ? (
                    <div className="divide-y divide-zinc-700/80">
                      {sectionCrew.map((section) => (
                        <div
                          key={section.key}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors"
                        >
                          <div className="w-36 sm:w-44 shrink-0">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                              {section.label}
                            </span>
                          </div>

                          <div className="flex-1 flex flex-wrap gap-2 items-center">
                            {section.people.map((person) => (
                              <Link
                                key={person.id}
                                href={`/person/${person.id}`}
                                className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700/80 hover:border-[#a8dadc]/60 hover:bg-zinc-700/50 transition-all group cursor-pointer"
                              >
                                <span className="text-xs font-medium text-zinc-200 group-hover:text-[#a8dadc] transition-colors">
                                  {person.name}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 py-4">
                      No crew information available.
                    </p>
                  )}
                </div>
              )}

              {activeTab === "details" && (
                <div className="divide-y divide-zinc-700/80">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
                    <div className="w-36 sm:w-44 shrink-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                        {movie.production_companies && movie.production_companies.length === 1 ? "Studio" : "Studios"}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-wrap gap-2 items-center">
                      {movie.production_companies && movie.production_companies.length > 0 ? (
                        movie.production_companies.map((company) => (
                          <Link
                            key={company.id}
                            href={`/company/${company.id}`}
                            className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700/80 hover:border-[#a8dadc]/60 hover:bg-zinc-700/50 transition-all group cursor-pointer"
                          >
                            <span className="text-xs font-medium text-zinc-200 group-hover:text-[#a8dadc] transition-colors">
                              {company.name}
                            </span>
                            {company.origin_country && (
                              <span className="ml-1.5 shrink-0 text-[9px] font-bold uppercase tracking-wider px-1 rounded bg-zinc-700/60 text-zinc-300 border border-zinc-600/50 group-hover:border-[#a8dadc]/40 transition-colors">
                                {company.origin_country}
                              </span>
                            )}
                          </Link>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-500">—</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
                    <div className="w-36 sm:w-44 shrink-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                        Original title
                      </span>
                    </div>
                    <div className="flex-1 flex items-center">
                      <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80 max-w-full">
                        <span
                          className="text-xs sm:text-sm font-medium text-zinc-200 truncate"
                          title={movie.original_title || "—"}
                        >
                          {movie.original_title || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
                    <div className="w-36 sm:w-44 shrink-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                        Status
                      </span>
                    </div>
                    <div className="flex-1 flex items-center">
                      <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80">
                        <span className="text-xs sm:text-sm font-medium text-zinc-200">
                          {movie.status || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
                    <div className="w-36 sm:w-44 shrink-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                        Original language
                      </span>
                    </div>
                    <div className="flex-1 flex items-center">
                      <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80">
                        <span className="text-xs font-bold uppercase text-zinc-200">
                          {movie.original_language?.toUpperCase() || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
                    <div className="w-36 sm:w-44 shrink-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                        Budget
                      </span>
                    </div>
                    <div className="flex-1 flex items-center">
                      <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80">
                        <span className="text-xs sm:text-sm font-medium text-zinc-200">
                          {movie.budget && movie.budget > 0
                            ? `$${movie.budget.toLocaleString("en-US")}`
                            : "Not available"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
                    <div className="w-36 sm:w-44 shrink-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                        Revenue
                      </span>
                    </div>
                    <div className="flex-1 flex items-center">
                      <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80">
                        <span className="text-xs sm:text-sm font-medium text-zinc-200">
                          {movie.revenue && movie.revenue > 0
                            ? `$${movie.revenue.toLocaleString("en-US")}`
                            : "Not available"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
                    <div className="w-36 sm:w-44 shrink-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                        Genres
                      </span>
                    </div>
                    <div className="flex-1 flex flex-wrap gap-2 items-center">
                      {movie.genres && movie.genres.length > 0 ? (
                        movie.genres.map((g) => (
                          <div
                            key={g.id}
                            className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700/80"
                          >
                            <span className="text-xs font-medium text-zinc-200">
                              {g.name}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-500">—</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "releases" && (
                <div>
                  {releaseDateGroups.length > 0 ? (
                    <div className="divide-y divide-zinc-700/80">
                      {releaseDateGroups.map((group) => (
                        <div
                          key={group.date}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors"
                        >
                          <div className="w-32 sm:w-36 shrink-0">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                              {group.formattedDate}
                            </span>
                          </div>

                          <div className="flex-1 flex flex-wrap gap-2 items-center">
                            {group.countries.map((c) => (
                              <div
                                key={c.code}
                                className="inline-flex items-center rounded-md bg-zinc-800 border border-zinc-700/80 overflow-hidden min-w-0"
                              >
                                <img
                                  src={`https://flagcdn.com/w80/${c.code.toLowerCase()}.png`}
                                  alt=""
                                  className="w-6 self-stretch object-cover shrink-0 border-r border-zinc-700/60"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                                <div className="flex items-center gap-1.5 px-2.5 py-1 min-w-0">
                                  <span
                                    className="text-xs font-medium text-zinc-200 truncate max-w-[140px] sm:max-w-[180px]"
                                    title={c.country}
                                  >
                                    {c.country}
                                  </span>
                                  {c.certification && (
                                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-zinc-700/60 text-zinc-300 border border-zinc-600/50">
                                      {c.certification}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 py-4">
                      No release date information available.
                    </p>
                  )}
                </div>
              )}
            </div>

            {movie.collection?.parts && movie.collection.parts.length > 0 && (
              <div className="mt-12 sm:mt-14">
                <div className="relative border-b border-zinc-800/60 mb-6 pb-3">
                  <span className="text-sm font-bold uppercase tracking-wider text-zinc-100">
                    Franchise
                  </span>
                </div>

                <FranchiseSlider
                  parts={movie.collection.parts}
                  currentMovieId={movie.id}
                />
              </div>
            )}
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

            <div className="p-4 sm:p-6 overflow-y-auto min-h-[300px]">
              {loadingPosters || !dedupedPosters ? (
                <div className="flex items-center justify-center py-24">
                  <Loading />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {dedupedPosters.map((poster) => {
                    const url = getPosterUrl(poster.file_path, "w342");
                    const isSelected = selectedPoster === poster.file_path;
                    return (
                      <button
                        key={poster.file_path}
                        type="button"
                        onClick={() => {
                          setSelectedPoster(poster.file_path);
                          setIsPosterPickerOpen(false);
                        }}
                        className={`relative aspect-[2/3] w-full rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#a8dadc]"
                            : "border-zinc-800 hover:border-zinc-600 hover:opacity-80"
                        }`}
                      >
                        {url && (
                          <Image
                            src={url}
                            alt="Poster option"
                            fill
                            sizes="(max-width: 640px) 150px, (max-width: 1024px) 180px, 200px"
                            className="object-cover"
                          />
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#a8dadc] text-zinc-950 flex items-center justify-center shadow-md z-10">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
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
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      }
    >
      <MovieDetailContent />
    </Suspense>
  );
}
