"use client";

import { useEffect, useState, useMemo, Suspense, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  TvDetails,
  TvSeasonDetails,
  MovieImage,
  getPosterUrl,
  getBackdropUrl,
} from "@/lib/tmdb";
import Loading from "@/components/ui/Loading";
import SeasonRevolver from "@/components/ui/SeasonRevolver";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import MediaLayout from "@/components/modules/MediaLayout";
import MediaActionColumn, { MediaStatus } from "@/components/modules/columns/MediaActionColumn";
import MediaInfoColumn from "@/components/modules/columns/MediaInfoColumn";
import MediaReviewModal, { MediaReviewData } from "@/components/modules/modals/MediaReviewModal";
import ListModal from "@/components/modules/modals/ListModal";
import ArtworkPickerModal from "@/components/modules/modals/ArtworkPickerModal";
import BackdropPickerModal from "@/components/modules/modals/BackdropPickerModal";
import MediaTabsNav from "@/components/modules/tabs/MediaTabsNav";
import CastTab from "@/components/modules/tabs/CastTab";
import CrewTab from "@/components/modules/tabs/CrewTab";
import DetailsTab from "@/components/modules/tabs/DetailsTab";
import EpisodesTab from "@/components/modules/tabs/EpisodesTab";
import { getTvCrewSections } from "@/lib/media-utils";

function TvDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;

  const initialSeasonParam = parseInt(searchParams.get("season") || "1", 10);
  const startingSeason = isNaN(initialSeasonParam) ? 1 : initialSeasonParam;

  const [tv, setTv] = useState<TvDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeSeason, setActiveSeason] = useState<number>(startingSeason);
  const [seasonCache, setSeasonCache] = useState<Record<number, TvSeasonDetails>>({});
  const [isSeasonLoading, setIsSeasonLoading] = useState(false);

  const [customPosters, setCustomPosters] = useState<Record<number, string>>({});
  const [selectedBackdrop, setSelectedBackdrop] = useState<string | null>(null);
  const [isBackdropLoaded, setIsBackdropLoaded] = useState(false);
  const [isPosterPickerOpen, setIsPosterPickerOpen] = useState(false);
  const [isBackdropPickerOpen, setIsBackdropPickerOpen] = useState(false);
  const [availablePosters, setAvailablePosters] = useState<Record<number, MovieImage[]>>({});
  const [loadingPosters, setLoadingPosters] = useState(false);
  const [dedupedBackdrops, setDedupedBackdrops] = useState<MovieImage[] | null>(null);
  const [loadingBackdrops, setLoadingBackdrops] = useState(false);

  const [seriesStatus, setSeriesStatus] = useState<MediaStatus>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [canAddFavorite, setCanAddFavorite] = useState(true);
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>("");
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<"cast" | "crew" | "details" | "episodes">("cast");

  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => {
    let ignore = false;
    async function fetchUserSeasonLog() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !id) return;

        const { data } = await supabase
          .from("user_series")
          .select("*")
          .eq("series_id", id)
          .eq("season_number", activeSeason)
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (ignore) return;

        if (data) {
          setSeriesStatus(data.status);
          setIsFavorite(Boolean(data.is_favorite));
          setRating(data.rating ? Number(data.rating) : 0);
          setReview(data.review || "");
          setHasSpoilers(Boolean(data.has_spoilers));
          setStartDate(data.start_date || "");
          setEndDate(data.end_date || "");
          if (data.custom_poster_path) {
            setCustomPosters((prev) => ({
              ...prev,
              [activeSeason]: data.custom_poster_path,
            }));
          }
          if (data.custom_backdrop_path) {
            setSelectedBackdrop(data.custom_backdrop_path);
          }
        } else {
          setSeriesStatus(null);
          setIsFavorite(false);
          setRating(0);
          setReview("");
          setHasSpoilers(false);
          setStartDate("");
          setEndDate("");
        }

        const { data: favData } = await supabase
          .from("user_series")
          .select("series_id, season_number")
          .eq("user_id", session.user.id)
          .eq("is_favorite", true);

        const currentIsFav = Boolean(data?.is_favorite);
        const otherFavCount = (favData || []).filter(
          (f) => !(f.series_id === id && f.season_number === activeSeason)
        ).length;
        setCanAddFavorite(otherFavCount < 5);
      } catch (err) {
      }
    }
    fetchUserSeasonLog();
    return () => {
      ignore = true;
    };
  }, [id, activeSeason, supabase]);

  const handleQuickAction = async (newStatus: MediaStatus, newFavorite: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        addToast("Please log in to track series", "error");
        return;
      }
      if (!tv) return;

      if (!newStatus) {
        const { error } = await supabase
          .from("user_series")
          .delete()
          .eq("user_id", session.user.id)
          .eq("series_id", tv.id)
          .eq("season_number", activeSeason);

        if (error) {
          addToast("Error removing log", "error");
          return;
        }

        setSeriesStatus(null);
        setIsFavorite(false);
        setRating(0);
        setReview("");
        setHasSpoilers(false);
        setStartDate("");
        setEndDate("");
        setCanAddFavorite(true);
        addToast("Removed from your library", "info");
        return;
      }

      if (newFavorite && !isFavorite) {
        const { data: favData } = await supabase
          .from("user_series")
          .select("series_id, season_number")
          .eq("user_id", session.user.id)
          .eq("is_favorite", true);

        const otherFavCount = (favData || []).filter(
          (f) => !(f.series_id === tv.id && f.season_number === activeSeason)
        ).length;

        if (otherFavCount >= 5) {
          addToast("You can only have up to 5 favorite series", "error");
          setCanAddFavorite(false);
          return;
        }
      }

      await supabase.from("series").upsert({
        id: tv.id,
        name: tv.name,
        overview: tv.overview,
        poster_path: tv.poster_path,
        backdrop_path: tv.backdrop_path,
        number_of_seasons: tv.number_of_seasons,
        number_of_episodes: tv.number_of_episodes,
      });

      const { error } = await supabase.from("user_series").upsert(
        {
          user_id: session.user.id,
          series_id: tv.id,
          season_number: activeSeason,
          status: newStatus,
          is_favorite: newFavorite,
          rating: rating > 0 ? rating : null,
          review: review.trim() || null,
          has_spoilers: hasSpoilers,
          start_date: startDate || null,
          end_date: endDate || null,
          custom_poster_path: customPosters[activeSeason] || null,
          custom_backdrop_path: selectedBackdrop,
        },
        { onConflict: "user_id,series_id,season_number" }
      );

      if (error) {
        addToast("Error saving action", "error");
        return;
      }

      setSeriesStatus(newStatus);
      setIsFavorite(newFavorite);

      if (newStatus !== seriesStatus) {
        if (newStatus === "watching") addToast("Marked as Watching", "success");
        else if (newStatus === "watched") addToast("Marked as Watched", "success");
        else if (newStatus === "paused") addToast("Marked as Paused", "info");
        else if (newStatus === "dropped") addToast("Marked as Dropped", "info");
        else if (newStatus === "watchlist") addToast("Added to Watchlist", "success");
      } else if (newFavorite !== isFavorite) {
        if (newFavorite) addToast("Added to favourites", "success");
        else addToast("Removed from favourites", "info");
      }
    } catch (err) {
      addToast("Error saving action", "error");
    }
  };

  const handleDeleteReview = async () => {
    try {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        addToast("Please log in to manage reviews", "error");
        setIsSaving(false);
        return;
      }
      if (!tv) return;

      const { error } = await supabase
        .from("user_series")
        .delete()
        .eq("user_id", session.user.id)
        .eq("series_id", tv.id)
        .eq("season_number", activeSeason);

      if (error) {
        addToast("Error deleting review", "error");
        return;
      }

      setSeriesStatus(null);
      setIsFavorite(false);
      setRating(0);
      setReview("");
      setHasSpoilers(false);
      setStartDate("");
      setEndDate("");

      addToast("Season log deleted successfully", "info");
      setIsLogModalOpen(false);
    } catch (err) {
      addToast("Something went wrong", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReview = async (reviewData: MediaReviewData) => {
    try {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        addToast("Please log in to save your review", "error");
        setIsSaving(false);
        return;
      }

      if (!tv) return;

      if (reviewData.isFavorite && !isFavorite) {
        const { data: favData } = await supabase
          .from("user_series")
          .select("series_id, season_number")
          .eq("user_id", session.user.id)
          .eq("is_favorite", true);

        const otherFavCount = (favData || []).filter(
          (f) => !(f.series_id === tv.id && f.season_number === activeSeason)
        ).length;

        if (otherFavCount >= 5) {
          addToast("You can only have up to 5 favorite series", "error");
          setIsSaving(false);
          setCanAddFavorite(false);
          return;
        }
      }

      const { error: seriesError } = await supabase.from("series").upsert({
        id: tv.id,
        name: tv.name,
        overview: tv.overview,
        poster_path: tv.poster_path,
        backdrop_path: tv.backdrop_path,
        number_of_seasons: tv.number_of_seasons,
        number_of_episodes: tv.number_of_episodes,
      });

      if (seriesError) {
        addToast("Error saving series data", "error");
        setIsSaving(false);
        return;
      }

      const { error: logError } = await supabase.from("user_series").upsert(
        {
          user_id: session.user.id,
          series_id: tv.id,
          season_number: activeSeason,
          status: reviewData.status,
          is_favorite: reviewData.isFavorite,
          rating: reviewData.rating > 0 ? reviewData.rating : null,
          review: reviewData.review.trim() || null,
          has_spoilers: reviewData.hasSpoilers,
          start_date: reviewData.startDate || null,
          end_date: reviewData.endDate || null,
          custom_poster_path:
            reviewData.customPosterPath !== undefined
              ? reviewData.customPosterPath
              : (customPosters[activeSeason] || null),
          custom_backdrop_path:
            reviewData.customBackdropPath !== undefined
              ? reviewData.customBackdropPath
              : selectedBackdrop,
        },
        { onConflict: "user_id,series_id,season_number" }
      );

      if (logError) {
        addToast("Error saving review", "error");
        setIsSaving(false);
        return;
      }

      if (reviewData.customPosterPath) {
        setCustomPosters((prev) => ({
          ...prev,
          [activeSeason]: reviewData.customPosterPath!,
        }));
      }
      if (reviewData.customBackdropPath) {
        setSelectedBackdrop(reviewData.customBackdropPath);
      }

      setSeriesStatus(reviewData.status);
      setIsFavorite(reviewData.isFavorite);
      setRating(reviewData.rating);
      setReview(reviewData.review);
      setHasSpoilers(reviewData.hasSpoilers);
      setStartDate(reviewData.startDate || "");
      setEndDate(reviewData.endDate || "");

      addToast("Season review saved successfully", "success");
      setIsLogModalOpen(false);
    } catch (err) {
      addToast("Something went wrong", "error");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function fetchTv() {
      try {
        setLoading(true);
        const res = await fetch(`/api/tv/${id}`);
        if (!res.ok) throw new Error("Failed to fetch tv details");
        const data: TvDetails = await res.json();

        if (ignore) return;
        setTv(data);

        const regular = (data.seasons || []).filter((s) => s.season_number > 0);
        const hasActive = regular.some((s) => s.season_number === activeSeason);
        const validSeason = hasActive ? activeSeason : (regular[0]?.season_number ?? 1);
        if (validSeason !== activeSeason) {
          setActiveSeason(validSeason);
        }

        const rawBackdrops = data.images?.backdrops || [];
        const validBackdrops = rawBackdrops.filter(
          (b) =>
            Boolean(b.file_path) &&
            (!b.aspect_ratio || (b.aspect_ratio >= 1.4 && b.aspect_ratio <= 2.2))
        );

        const defaultBackdrop = data.backdrop_path;
        let candidates: string[] = [];

        const highQualityScenic = validBackdrops
          .filter(
            (b) =>
              b.file_path !== defaultBackdrop &&
              (b.width ?? 0) >= 1920 &&
              (b.iso_639_1 === null || b.iso_639_1 === "en")
          )
          .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));

        if (highQualityScenic.length > 0) {
          candidates = highQualityScenic.slice(0, 10).map((b) => b.file_path);
        } else {
          const withoutDefault = validBackdrops
            .filter((b) => b.file_path !== defaultBackdrop)
            .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));
          candidates = withoutDefault.slice(0, 10).map((b) => b.file_path);
        }

        if (candidates.length === 0) {
          candidates = validBackdrops
            .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
            .slice(0, 10)
            .map((b) => b.file_path);
          if (data.backdrop_path && !candidates.includes(data.backdrop_path)) {
            candidates.unshift(data.backdrop_path);
          }
        }

        let chosenBackdrop = data.backdrop_path;
        if (candidates.length > 0) {
          chosenBackdrop = candidates[Math.floor(Math.random() * candidates.length)];
        }
        setSelectedBackdrop(chosenBackdrop);
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
      fetchTv();
    }

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    const seasonParam = parseInt(searchParams.get("season") || "", 10);
    if (!isNaN(seasonParam) && seasonParam > 0 && seasonParam !== activeSeason) {
      setActiveSeason(seasonParam);
    }
  }, [searchParams, activeSeason]);

  const handleSelectSeason = useCallback(
    async (seasonNum: number) => {
      if (seasonNum === activeSeason) return;

      setActiveSeason(seasonNum);

      const newUrl = `/tv/${id}?season=${seasonNum}`;
      window.history.replaceState(null, "", newUrl);

      if (seasonCache[seasonNum]) {
        return;
      }

      try {
        setIsSeasonLoading(true);
        const res = await fetch(`/api/tv/${id}/season/${seasonNum}`);
        if (res.ok) {
          const seasonData: TvSeasonDetails = await res.json();
          setSeasonCache((prev) => ({ ...prev, [seasonNum]: seasonData }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSeasonLoading(false);
      }
    },
    [activeSeason, id, seasonCache]
  );

  useEffect(() => {
    if (!id || availablePosters[activeSeason]) return;

    let ignore = false;

    async function fetchPosters() {
      try {
        setLoadingPosters(true);
        const res = await fetch(`/api/tv/${id}/posters?season=${activeSeason}`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.posters?.length) {
            setAvailablePosters((prev) => ({
              ...prev,
              [activeSeason]: data.posters,
            }));
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
  }, [id, activeSeason, availablePosters]);

  useEffect(() => {
    setDedupedBackdrops(null);
  }, [id]);

  useEffect(() => {
    if (!id || dedupedBackdrops) return;

    let ignore = false;

    async function fetchBackdrops() {
      try {
        setLoadingBackdrops(true);
        const res = await fetch(`/api/tv/${id}/backdrops`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.backdrops?.length) {
            setDedupedBackdrops(data.backdrops);
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
        }
      } finally {
        if (!ignore) {
          setLoadingBackdrops(false);
        }
      }
    }

    fetchBackdrops();

    return () => {
      ignore = true;
    };
  }, [id, dedupedBackdrops]);

  const handleSelectPoster = async (path: string) => {
    setCustomPosters((prev) => ({
      ...prev,
      [activeSeason]: path,
    }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && tv && seriesStatus) {
        await supabase
          .from("user_series")
          .update({ custom_poster_path: path })
          .eq("user_id", session.user.id)
          .eq("series_id", tv.id)
          .eq("season_number", activeSeason);
      }
    } catch {}
  };

  const handleSelectBackdrop = async (path: string) => {
    setSelectedBackdrop(path);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && tv && seriesStatus) {
        await supabase
          .from("user_series")
          .update({ custom_backdrop_path: path })
          .eq("user_id", session.user.id)
          .eq("series_id", tv.id)
          .eq("season_number", activeSeason);
      }
    } catch {}
  };

  useEffect(() => {
    if (!id || seasonCache[activeSeason]) return;

    let ignore = false;

    async function fetchInitialSeason() {
      try {
        setIsSeasonLoading(true);
        const res = await fetch(`/api/tv/${id}/season/${activeSeason}`);
        if (res.ok) {
          const data: TvSeasonDetails = await res.json();
          if (!ignore) {
            setSeasonCache((prev) => ({ ...prev, [activeSeason]: data }));
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
        }
      } finally {
        if (!ignore) {
          setIsSeasonLoading(false);
        }
      }
    }

    fetchInitialSeason();

    return () => {
      ignore = true;
    };
  }, [id, activeSeason, seasonCache]);

  const regularSeasons = useMemo(() => {
    if (!tv?.seasons) return [];
    return tv.seasons
      .filter((s) => s.season_number > 0)
      .sort((a, b) => a.season_number - b.season_number);
  }, [tv]);

  const currentSeasonSummary = useMemo(() => {
    return tv?.seasons?.find((s) => s.season_number === activeSeason) || null;
  }, [tv, activeSeason]);

  const currentSeasonDetails = seasonCache[activeSeason] || null;

  const rawDate =
    currentSeasonDetails?.air_date ||
    currentSeasonSummary?.air_date ||
    tv?.first_air_date;

  const totalRuntimeMinutes = useMemo(() => {
    if (!currentSeasonDetails?.episodes) return 0;
    return currentSeasonDetails.episodes.reduce(
      (acc, ep) => acc + (ep.runtime || 0),
      0
    );
  }, [currentSeasonDetails]);

  const castList = useMemo(() => {
    return (
      currentSeasonDetails?.credits?.cast ||
      tv?.credits?.cast ||
      []
    );
  }, [currentSeasonDetails, tv]);

  const crewList = useMemo(() => {
    return (
      currentSeasonDetails?.credits?.crew ||
      tv?.credits?.crew ||
      []
    );
  }, [currentSeasonDetails, tv]);

  const crewSections = useMemo(() => {
    return getTvCrewSections(crewList, tv?.created_by);
  }, [crewList, tv?.created_by]);

  if (loading) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
        <Loading />
      </div>
    );
  }

  if (!tv) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 text-center">
        <p className="text-zinc-400 mb-4">TV Show could not be found.</p>
        <Link href="/search" className="text-xs text-[#a8dadc] hover:underline">
          ← Back to search
        </Link>
      </div>
    );
  }

  const posterPath =
    customPosters[activeSeason] ||
    currentSeasonDetails?.poster_path ||
    currentSeasonSummary?.poster_path ||
    tv.poster_path;
  const posterUrl = getPosterUrl(posterPath, "w500");
  const backdropUrl = getBackdropUrl(selectedBackdrop, "original");

  const overviewText =
    currentSeasonDetails?.overview ||
    currentSeasonSummary?.overview ||
    tv.overview ||
    "";

  const episodesCount =
    currentSeasonDetails?.episodes?.length ??
    currentSeasonSummary?.episode_count ??
    0;

  const seasonYear = currentSeasonSummary?.air_date
    ? new Date(currentSeasonSummary.air_date).getFullYear()
    : tv.first_air_date
    ? new Date(tv.first_air_date).getFullYear()
    : "—";

  return (
    <>
      <MediaLayout
        backdropUrl={backdropUrl}
        backdropAlt={tv.name}
        isBackdropLoaded={isBackdropLoaded}
        onBackdropLoaded={() => setIsBackdropLoaded(true)}
        hasMultipleBackdrops={(dedupedBackdrops?.length || tv.images?.backdrops?.length || 0) > 1}
        onOpenBackdropPicker={() => setIsBackdropPickerOpen(true)}
        posterColumn={
          <MediaActionColumn
            posterUrl={posterUrl}
            title={tv.name}
            hasMultiplePosters={true}
            onOpenPosterPicker={() => setIsPosterPickerOpen(true)}
            mediaType="tv"
            status={seriesStatus}
            isFavorite={isFavorite}
            hasLog={Boolean(seriesStatus)}
            onOpenLogModal={() => setIsLogModalOpen(true)}
            onOpenListModal={() => setIsListModalOpen(true)}
            onQuickStatusChange={(newStatus) => {
              handleQuickAction(newStatus, isFavorite);
            }}
            onToggleFavorite={() => {
              const nextFav = !isFavorite;
              if (nextFav && !canAddFavorite) {
                addToast("You can only have up to 5 favorite series", "error");
                return;
              }
              const nextStatus = seriesStatus || "watched";
              handleQuickAction(nextStatus, nextFav);
            }}
          >
            {regularSeasons.length > 0 && (
              <>
                <div className="hidden sm:flex absolute -left-20 sm:-left-24 lg:-left-26 top-1/2 -translate-y-1/2 z-30 flex-col items-center">
                  <SeasonRevolver
                    seasons={regularSeasons}
                    activeSeason={activeSeason}
                    onSelectSeason={handleSelectSeason}
                  />
                </div>
                <div className="sm:hidden flex items-center justify-center mb-3 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
                  <SeasonRevolver
                    seasons={regularSeasons}
                    activeSeason={activeSeason}
                    onSelectSeason={handleSelectSeason}
                  />
                </div>
              </>
            )}
          </MediaActionColumn>
        }
      >
        <MediaInfoColumn
          typeLabel="Series"
          title={tv.name}
          originalTitle={tv.original_name}
          releaseDate={rawDate}
          runtimeMinutes={totalRuntimeMinutes}
          episodesCount={episodesCount}
          tagline={tv.tagline}
          overview={overviewText}
        >
          <MediaTabsNav
            tabs={[
              { key: "cast", label: "Cast" },
              { key: "crew", label: "Crew" },
              { key: "details", label: "Details" },
              { key: "episodes", label: "Episodes" },
            ]}
            activeTab={activeTab}
            onChange={(key) => setActiveTab(key as any)}
          />

          {activeTab === "cast" && (
            <CastTab
              cast={castList}
              emptyMessage="No cast information available for this season."
            />
          )}
          {activeTab === "crew" && <CrewTab sections={crewSections} />}
          {activeTab === "details" && (
            <DetailsTab
              productionCompanies={tv.production_companies}
              originalTitle={tv.original_name}
              status={tv.status}
              originalLanguage={tv.original_language}
              seasonsCount={tv.number_of_seasons}
              episodesCount={tv.number_of_episodes}
              genres={tv.genres}
            />
          )}
          {activeTab === "episodes" && (
            <EpisodesTab
              episodes={currentSeasonDetails?.episodes}
              isLoading={isSeasonLoading}
            />
          )}
        </MediaInfoColumn>
      </MediaLayout>

      <ArtworkPickerModal
        isOpen={isPosterPickerOpen}
        onClose={() => setIsPosterPickerOpen(false)}
        title="CHANGE ARTWORK"
        type="poster"
        images={availablePosters[activeSeason] || []}
        selectedImage={posterPath}
        onSelectImage={handleSelectPoster}
        isLoading={loadingPosters}
      />

      <BackdropPickerModal
        isOpen={isBackdropPickerOpen}
        onClose={() => setIsBackdropPickerOpen(false)}
        title="CHANGE BANNER"
        images={dedupedBackdrops || (tv.images?.backdrops || []).slice(0, 30)}
        selectedImage={selectedBackdrop}
        onSelectImage={handleSelectBackdrop}
        isLoading={loadingBackdrops}
      />

      <MediaReviewModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        typeLabel="Series"
        title={tv.name}
        releaseDate={rawDate}
        runtimeMinutes={totalRuntimeMinutes}
        episodesCount={episodesCount}
        year={seasonYear}
        posterUrl={posterUrl}
        backdropUrl={backdropUrl}
        mediaType="tv"
        status={seriesStatus}
        isFavorite={isFavorite}
        canAddFavorite={canAddFavorite}
        rating={rating}
        review={review}
        hasSpoilers={hasSpoilers}
        startDate={startDate}
        endDate={endDate}
        isSaving={isSaving}
        onSave={handleSaveReview}
        onDelete={handleDeleteReview}
        availablePosters={availablePosters[activeSeason] || []}
        availableBackdrops={dedupedBackdrops || (tv.images?.backdrops || []).slice(0, 30)}
        selectedPoster={posterPath}
        selectedBackdrop={selectedBackdrop}
        onSelectPoster={handleSelectPoster}
        onSelectBackdrop={handleSelectBackdrop}
        loadingPosters={loadingPosters}
        loadingBackdrops={loadingBackdrops}
      />

      <ListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        media={{
          mediaType: "tv",
          mediaId: tv.id,
          title: tv.name,
          overview: tv.overview,
          posterPath: tv.poster_path,
          backdropPath: tv.backdrop_path,
          customPosterPath: posterPath,
          customBackdropPath: selectedBackdrop,
          numberOfSeasons: tv.number_of_seasons,
          numberOfEpisodes: tv.number_of_episodes,
        }}
        availablePosters={availablePosters[activeSeason] || []}
        availableBackdrops={dedupedBackdrops || (tv.images?.backdrops || []).slice(0, 30)}
        selectedPoster={posterPath}
        selectedBackdrop={selectedBackdrop}
        onSelectPoster={handleSelectPoster}
        onSelectBackdrop={handleSelectBackdrop}
        loadingPosters={loadingPosters}
        loadingBackdrops={loadingBackdrops}
      />
    </>
  );
}

export default function TvPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      }
    >
      <TvDetailContent />
    </Suspense>
  );
}
