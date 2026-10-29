"use client";

import { useEffect, useState, useRef, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import { MovieDetails, MovieImage, getPosterUrl, getBackdropUrl } from "@/lib/tmdb";
import Loading from "@/components/ui/Loading";
import FranchiseSlider from "@/components/ui/FranchiseSlider";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import MediaLayout from "@/components/media/MediaLayout";
import MediaPosterCard from "@/components/media/MediaPosterCard";
import MediaActionBar, { MediaStatus } from "@/components/media/MediaActionBar";
import MediaReviewModal from "@/components/media/MediaReviewModal";
import ArtworkPickerModal from "@/components/media/ArtworkPickerModal";
import { formatRuntime, formatFullDate } from "@/lib/media-utils";

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
  const [isBackdropPickerOpen, setIsBackdropPickerOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const supabase = createClient();
  const { addToast } = useToast();

  const [movieStatus, setMovieStatus] = useState<MediaStatus>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>("");
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [watchedDate, setWatchedDate] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function fetchUserLog() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !id) return;

        const { data } = await supabase
          .from("user_movies")
          .select("*")
          .eq("movie_id", id)
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (ignore || !data) return;

        setMovieStatus(data.status);
        setIsFavorite(Boolean(data.is_favorite));
        setRating(data.rating ? Number(data.rating) : 0);
        setReview(data.review || "");
        setHasSpoilers(Boolean(data.has_spoilers));
        setWatchedDate(data.watched_date || "");
        if (data.custom_poster_path) setSelectedPoster(data.custom_poster_path);
        if (data.custom_backdrop_path) setSelectedBackdrop(data.custom_backdrop_path);
      } catch (err) {
      }
    }
    fetchUserLog();
    return () => {
      ignore = true;
    };
  }, [id, supabase]);

  const handleQuickAction = async (newStatus: MediaStatus, newFavorite: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !movie) return;

      await supabase.from("movies").upsert({
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
      });

      await supabase.from("user_movies").upsert(
        {
          user_id: session.user.id,
          movie_id: movie.id,
          status: newStatus,
          is_favorite: newFavorite,
          custom_poster_path: selectedPoster,
          custom_backdrop_path: selectedBackdrop,
        },
        { onConflict: "user_id,movie_id" }
      );
    } catch (err) {
    }
  };

  const handleSaveReview = async () => {
    try {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        addToast("Please log in to save your review", "error");
        setIsSaving(false);
        return;
      }

      if (!movie) return;

      const { error: movieError } = await supabase.from("movies").upsert({
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
      });

      if (movieError) {
        addToast("Error saving movie data", "error");
        setIsSaving(false);
        return;
      }

      const { error: logError } = await supabase.from("user_movies").upsert(
        {
          user_id: session.user.id,
          movie_id: movie.id,
          status: movieStatus,
          is_favorite: isFavorite,
          rating: rating > 0 ? rating : null,
          review: review.trim() || null,
          has_spoilers: hasSpoilers,
          watched_date: watchedDate || null,
          custom_poster_path: selectedPoster,
          custom_backdrop_path: selectedBackdrop,
        },
        { onConflict: "user_id,movie_id" }
      );

      if (logError) {
        addToast("Error saving review", "error");
        setIsSaving(false);
        return;
      }

      addToast("Review saved successfully", "success");
      setIsLogModalOpen(false);
    } catch (err) {
      addToast("Something went wrong", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const [activeTab, setActiveTab] = useState<"cast" | "staff" | "details" | "releases">("cast");
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    let ignore = false;

    async function fetchMovie() {
      try {
        setLoading(true);
        const res = await fetch(`/api/movies/${id}`);
        if (!res.ok) throw new Error("Failed to fetch movie");
        const data: MovieDetails = await res.json();

        if (!ignore) {
          const rawBackdrops = data.images?.backdrops || [];
          const validBackdrops = rawBackdrops.filter(
            (b) =>
              Boolean(b.file_path) &&
              (!b.aspect_ratio || (b.aspect_ratio >= 1.4 && b.aspect_ratio <= 2.2))
          );

          const defaultBackdrop = data.backdrop_path;
          const highQualityScenic = validBackdrops
            .filter(
              (b) =>
                b.file_path !== defaultBackdrop &&
                (b.width ?? 0) >= 1920 &&
                (b.iso_639_1 === null || b.iso_639_1 === "en")
            )
            .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));

          let chosenBackdrop = defaultBackdrop;

          if (highQualityScenic.length > 0) {
            const topCandidates = highQualityScenic.slice(0, 10);
            chosenBackdrop =
              topCandidates[Math.floor(Math.random() * topCandidates.length)].file_path;
          } else {
            const withoutDefault = validBackdrops
              .filter((b) => b.file_path !== defaultBackdrop)
              .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));

            if (withoutDefault.length > 0) {
              const topCandidates = withoutDefault.slice(0, 10);
              chosenBackdrop =
                topCandidates[Math.floor(Math.random() * topCandidates.length)].file_path;
            } else if (validBackdrops.length > 0) {
              chosenBackdrop = validBackdrops[0].file_path;
            }
          }

          const rawPosters = data.images?.posters || [];
          const validPosters = rawPosters.filter(
            (p) =>
              Boolean(p.file_path) &&
              (!p.aspect_ratio || (p.aspect_ratio >= 0.6 && p.aspect_ratio <= 0.75))
          );

          const sortedPosters = [...validPosters].sort((a, b) => {
            const langA = a.iso_639_1 === "en" ? 2 : a.iso_639_1 === null ? 1 : 0;
            const langB = b.iso_639_1 === "en" ? 2 : b.iso_639_1 === null ? 1 : 0;
            if (langA !== langB) return langB - langA;
            return (b.vote_count ?? 0) - (a.vote_count ?? 0);
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
    if (!id || dedupedPosters) return;

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
  }, [id, dedupedPosters]);

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
    <>
      <MediaLayout
        backdropUrl={backdropUrl}
        backdropAlt={movie.title}
        isBackdropLoaded={isBackdropLoaded}
        onBackdropLoaded={() => setIsBackdropLoaded(true)}
        posterColumn={
          <>
            <MediaPosterCard
              posterUrl={posterUrl}
              title={movie.title}
              hasMultiplePosters={hasMultiplePosters}
              onOpenPosterPicker={() => setIsPosterPickerOpen(true)}
            />
            <MediaActionBar
              mediaType="movie"
              status={movieStatus}
              isFavorite={isFavorite}
              onOpenLogModal={() => setIsLogModalOpen(true)}
              onQuickStatusChange={(newStatus) => {
                setMovieStatus(newStatus);
                handleQuickAction(newStatus, isFavorite);
              }}
              onToggleFavorite={() => {
                const nextFav = !isFavorite;
                setIsFavorite(nextFav);
                handleQuickAction(movieStatus, nextFav);
              }}
            />
          </>
        }
      >
        <div className="w-full">
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
                      {displayedCast.map((actor) => {
                        const profileUrl = actor.profile_path
                          ? getPosterUrl(actor.profile_path, "w185")
                          : null;
                        return (
                          <Link
                            key={actor.id}
                            href={`/person/${actor.id}`}
                            className="flex items-stretch rounded-lg bg-zinc-800 border border-zinc-700/80 hover:border-[#a8dadc]/60 hover:bg-zinc-700/50 transition-all group cursor-pointer min-w-0 overflow-hidden h-10 sm:h-11"
                          >
                            <div className="relative h-full aspect-square w-10 sm:w-11 shrink-0 bg-zinc-900 border-r border-zinc-700/60 overflow-hidden flex items-center justify-center">
                              {profileUrl ? (
                                <Image
                                  src={profileUrl}
                                  alt={actor.name}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4 text-zinc-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 px-2 sm:px-2.5 flex flex-col justify-center">
                              <p className="text-xs sm:text-sm font-semibold text-zinc-100 group-hover:text-[#a8dadc] transition-colors truncate leading-tight">
                                {actor.name}
                              </p>
                              {actor.character && (
                                <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate leading-tight mt-0.5">
                                  as <span className="text-zinc-300 font-medium">{actor.character}</span>
                                </p>
                              )}
                            </div>
                          </Link>
                        );
                      })}
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
      </MediaLayout>

      <ArtworkPickerModal
        isOpen={isPosterPickerOpen}
        onClose={() => setIsPosterPickerOpen(false)}
        title="CHANGE ARTWORK"
        type="poster"
        images={dedupedPosters || []}
        selectedImage={selectedPoster}
        onSelectImage={(path) => setSelectedPoster(path)}
        isLoading={loadingPosters}
      />

      <ArtworkPickerModal
        isOpen={isBackdropPickerOpen}
        onClose={() => setIsBackdropPickerOpen(false)}
        title="CHANGE BANNER"
        type="backdrop"
        images={(movie.images?.backdrops || []).slice(0, 30)}
        selectedImage={selectedBackdrop}
        onSelectImage={(path) => setSelectedBackdrop(path)}
      />

      <MediaReviewModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title={movie.title}
        year={movie.release_date ? new Date(movie.release_date).getFullYear() : "—"}
        posterUrl={posterUrl}
        backdropUrl={backdropUrl}
        mediaType="movie"
        status={movieStatus}
        isFavorite={isFavorite}
        rating={rating}
        review={review}
        hasSpoilers={hasSpoilers}
        watchedDate={watchedDate}
        isSaving={isSaving}
        onStatusChange={setMovieStatus}
        onFavoriteChange={setIsFavorite}
        onRatingChange={setRating}
        onReviewChange={setReview}
        onSpoilersChange={setHasSpoilers}
        onWatchedDateChange={setWatchedDate}
        onSave={handleSaveReview}
        onOpenPosterPicker={() => setIsPosterPickerOpen(true)}
        onOpenBackdropPicker={() => setIsBackdropPickerOpen(true)}
      />
    </>
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
