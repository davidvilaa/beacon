"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { IGDBGameDetail, getIgdbImageUrl } from "@/lib/igdb";
import { MovieImage } from "@/lib/tmdb";
import Loading from "@/components/ui/Loading";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import MediaLayout from "@/components/modules/MediaLayout";
import MediaActionColumn, {
  MediaStatus,
} from "@/components/modules/columns/MediaActionColumn";
import MediaInfoColumn from "@/components/modules/columns/MediaInfoColumn";
import MediaReviewModal, {
  MediaReviewData,
} from "@/components/modules/modals/MediaReviewModal";
import ListModal from "@/components/modules/modals/ListModal";
import ArtworkPickerModal from "@/components/modules/modals/ArtworkPickerModal";
import BackdropPickerModal from "@/components/modules/modals/BackdropPickerModal";
import MediaTabsNav from "@/components/modules/tabs/MediaTabsNav";
import DetailsTab from "@/components/modules/tabs/DetailsTab";
import FranchiseSlider, { FranchiseItem } from "@/components/ui/FranchiseSlider";
import { isMediaReleased, gameStatusToShared, sharedStatusToGame } from "@/lib/media-utils";

async function syncGameRecord(supabaseClient: any, currentGame: IGDBGameDetail) {
  const coverUrl = getIgdbImageUrl(currentGame.cover?.image_id, "1080p");
  const backdropUrl = getIgdbImageUrl(
    currentGame.artworks?.[0]?.image_id || currentGame.screenshots?.[0]?.image_id,
    "1080p"
  );
  const releaseDateIso = currentGame.first_release_date
    ? new Date(currentGame.first_release_date * 1000).toISOString()
    : null;

  const { error } = await supabaseClient.from("games").upsert({
    id: currentGame.id,
    name: currentGame.name,
    summary: currentGame.summary || null,
    cover_url: coverUrl,
    backdrop_url: backdropUrl,
    first_release_date: releaseDateIso,
  });
  if (error) throw error;
}

function GameDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [game, setGame] = useState<IGDBGameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [customPoster, setCustomPoster] = useState<string | null>(null);
  const [customBackdrop, setCustomBackdrop] = useState<string | null>(null);
  const [fallbackPoster, setFallbackPoster] = useState<string | null>(null);
  const [fallbackBackdrop, setFallbackBackdrop] = useState<string | null>(null);
  const [availablePosters, setAvailablePosters] = useState<MovieImage[]>([]);
  const [availableBackdrops, setAvailableBackdrops] = useState<MovieImage[]>([]);
  const [loadingPosters, setLoadingPosters] = useState(false);
  const [loadingBackdrops, setLoadingBackdrops] = useState(false);
  const [isPosterPickerOpen, setIsPosterPickerOpen] = useState(false);
  const [isBackdropPickerOpen, setIsBackdropPickerOpen] = useState(false);
  const [isBackdropLoaded, setIsBackdropLoaded] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  const supabase = createClient();
  const { addToast } = useToast();

  const [gameStatus, setGameStatus] = useState<MediaStatus>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [canAddFavorite, setCanAddFavorite] = useState(true);
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>("");
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [hoursPlayed, setHoursPlayed] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<string>("details");

  const releaseDateStr = useMemo(() => {
    if (!game?.first_release_date) return null;
    return new Date(game.first_release_date * 1000).toISOString().split("T")[0];
  }, [game]);

  const releaseYear = useMemo(() => {
    if (!game?.first_release_date) return null;
    return new Date(game.first_release_date * 1000).getFullYear();
  }, [game]);

  const isReleased = useMemo(() => {
    if (!game) return true;
    return isMediaReleased("movie", null, releaseDateStr);
  }, [game, releaseDateStr]);

  const developersList = useMemo(() => {
    return (game?.involved_companies || [])
      .filter((c) => c.developer)
      .map((c) => c.company.name);
  }, [game?.involved_companies]);

  const publishersList = useMemo(() => {
    return (game?.involved_companies || [])
      .filter((c) => c.publisher)
      .map((c) => c.company.name);
  }, [game?.involved_companies]);

  const platformsList = useMemo(() => {
    return (game?.platforms || []).map((p) => p.name);
  }, [game?.platforms]);

  const trailerVideo = useMemo(() => {
    if (!game?.videos || game.videos.length === 0) return null;
    const trailer = game.videos.find((v) =>
      v.name?.toLowerCase().includes("trailer")
    );
    return trailer || game.videos[0];
  }, [game?.videos]);

  const dlcItems = useMemo<FranchiseItem[]>(() => {
    if (!game) return [];
    const allDlcs = [
      ...(game.dlcs || []),
      ...(game.expansions || []),
      ...(game.remakes || []),
      ...(game.remasters || []),
    ];
    const seen = new Set<number>();
    const items: FranchiseItem[] = [];
    for (const d of allDlcs) {
      if (!seen.has(d.id)) {
        seen.add(d.id);
        const year = d.first_release_date
          ? new Date(d.first_release_date * 1000).getFullYear()
          : null;
        items.push({
          id: d.id,
          title: d.name,
          posterPath: getIgdbImageUrl(d.cover?.image_id, "1080p"),
          mediaType: "game",
          year,
        });
      }
    }
    return items;
  }, [game]);

  const franchiseItems = useMemo<FranchiseItem[]>(() => {
    if (!game) return [];
    const gamesInFranchise: any[] = [];
    for (const f of game.franchises || []) {
      if (f.games) gamesInFranchise.push(...f.games);
    }
    for (const c of game.collections || []) {
      if (c.games) gamesInFranchise.push(...c.games);
    }
    const seen = new Set<number>();
    const items: FranchiseItem[] = [];
    for (const g of gamesInFranchise) {
      if (!seen.has(g.id)) {
        seen.add(g.id);
        const year = g.first_release_date
          ? new Date(g.first_release_date * 1000).getFullYear()
          : null;
        items.push({
          id: g.id,
          title: g.name,
          posterPath: getIgdbImageUrl(g.cover?.image_id, "1080p"),
          mediaType: "game",
          year,
        });
      }
    }
    return items.sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));
  }, [game]);

  const tabs = useMemo(() => {
    const list: { key: string; label: string }[] = [
      { key: "details", label: "Details" },
    ];
    if (trailerVideo) {
      list.push({ key: "trailer", label: "Trailer" });
    }
    if (dlcItems.length > 0) {
      list.push({ key: "dlcs", label: "DLCs & Expansions" });
    }
    if (franchiseItems.length > 1) {
      list.push({ key: "franchise", label: "Franchise" });
    }
    return list;
  }, [trailerVideo, dlcItems.length, franchiseItems.length]);

  const defaultPoster = getIgdbImageUrl(game?.cover?.image_id, "1080p");
  const defaultBackdrop = getIgdbImageUrl(
    game?.artworks?.[0]?.image_id || game?.screenshots?.[0]?.image_id,
    "1080p"
  );

  const posterUrl = customPoster || fallbackPoster || defaultPoster || null;
  const backdropUrl = customBackdrop || fallbackBackdrop || defaultBackdrop || null;

  useEffect(() => {
    let ignore = false;
    async function fetchUserLog() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session || !id) return;

        const { data } = await supabase
          .from("user_games")
          .select("*")
          .eq("game_id", id)
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (ignore) return;

        if (data) {
          setGameStatus(gameStatusToShared(data.status));
          setIsFavorite(Boolean(data.is_favorite));
          setRating(data.rating ? Number(data.rating) : 0);
          setReview(data.review || "");
          setHasSpoilers(Boolean(data.has_spoilers));
          setStartDate(data.start_date || "");
          setEndDate(data.end_date || "");
          setHoursPlayed(data.hours_played ? Number(data.hours_played) : 0);
          if (data.custom_poster_path) setCustomPoster(data.custom_poster_path);
          if (data.custom_backdrop_path) setCustomBackdrop(data.custom_backdrop_path);
        } else {
          setGameStatus(null);
          setIsFavorite(false);
          setRating(0);
          setReview("");
          setHasSpoilers(false);
          setStartDate("");
          setEndDate("");
          setHoursPlayed(0);
        }

        const { count: favCount } = await supabase
          .from("user_games")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .eq("is_favorite", true);

        const currentIsFav = Boolean(data?.is_favorite);
        setCanAddFavorite(currentIsFav || (favCount || 0) < 5);
      } catch (err) {
        if (!ignore) {
          console.error(err);
        }
      }
    }

    fetchUserLog();
    return () => {
      ignore = true;
    };
  }, [id, supabase]);

  useEffect(() => {
    let ignore = false;
    async function fetchGame() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/games/${id}`);
        if (!res.ok) throw new Error("Failed to fetch game");
        const data: IGDBGameDetail = await res.json();
        if (!ignore) {
          setGame(data);
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

    fetchGame();
    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    setFallbackPoster(null);
    setFallbackBackdrop(null);
  }, [id]);

  useEffect(() => {
    let ignore = false;

    async function fetchPosters() {
      if (!id) return;
      try {
        setLoadingPosters(true);
        const res = await fetch(`/api/games/${id}/posters`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.posters?.length) {
            setAvailablePosters(data.posters);
          }
        }
      } catch (err) {
        if (!ignore) console.error(err);
      } finally {
        if (!ignore) setLoadingPosters(false);
      }
    }

    async function fetchBackdrops() {
      if (!id) return;
      try {
        setLoadingBackdrops(true);
        const res = await fetch(`/api/games/${id}/backdrops`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.backdrops?.length) {
            setAvailableBackdrops(data.backdrops);
          }
        }
      } catch (err) {
        if (!ignore) console.error(err);
      } finally {
        if (!ignore) setLoadingBackdrops(false);
      }
    }

    fetchPosters();
    fetchBackdrops();

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleSelectPoster = (filePath: string) => {
    setFallbackPoster(filePath);
    setIsPosterPickerOpen(false);
  };

  const handleSelectBackdrop = (filePath: string) => {
    setFallbackBackdrop(filePath);
    setIsBackdropPickerOpen(false);
  };

  const handleQuickAction = async (
    newStatus: MediaStatus,
    newFavorite: boolean
  ) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      if (!game) return;

      if (!newStatus && !newFavorite && rating === 0 && !review.trim()) {
        const { error } = await supabase
          .from("user_games")
          .delete()
          .eq("user_id", session.user.id)
          .eq("game_id", game.id);
        if (error) throw error;
        setGameStatus(null);
        setIsFavorite(false);
        addToast("Removed from games log", "info");
        return;
      }

      await syncGameRecord(supabase, game);

      const effectiveStatus =
        newStatus || (isReleased ? "watched" : "watchlist");

      const payload: any = {
        user_id: session.user.id,
        game_id: game.id,
        status: sharedStatusToGame(effectiveStatus),
        is_favorite: newFavorite,
        rating: rating > 0 ? rating : null,
        review: review.trim() || null,
        has_spoilers: hasSpoilers,
        start_date: startDate || null,
        end_date: endDate || null,
        hours_played: hoursPlayed,
        custom_poster_path: customPoster || null,
        custom_backdrop_path: customBackdrop || null,
      };

      const { error } = await supabase
        .from("user_games")
        .upsert(payload, { onConflict: "user_id,game_id" });

      if (error) throw error;

      setGameStatus(effectiveStatus);
      setIsFavorite(newFavorite);
      addToast("Game log updated", "success");
    } catch (err: any) {
      addToast(err?.message || "Failed to update game", "error");
    }
  };

  const handleToggleFavorite = () => {
    const nextFav = !isFavorite;
    if (nextFav && !canAddFavorite) {
      addToast("You can only have up to 5 favorite games", "error");
      return;
    }
    const nextStatus = gameStatus || (isReleased ? "watched" : "watchlist");
    handleQuickAction(nextStatus, nextFav);
  };

  const handleSaveReview = async (data: MediaReviewData) => {
    try {
      setIsSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      if (!game) return;

      if (data.isFavorite && !canAddFavorite && !isFavorite) {
        addToast("You can only have up to 5 favorite games", "error");
        return;
      }

      await syncGameRecord(supabase, game);

      const payload: any = {
        user_id: session.user.id,
        game_id: game.id,
        status: sharedStatusToGame(data.status),
        is_favorite: data.isFavorite,
        rating: data.rating > 0 ? data.rating : null,
        review: data.review.trim() || null,
        has_spoilers: data.hasSpoilers,
        start_date: data.startDate || null,
        end_date: data.endDate || null,
        custom_poster_path: data.customPosterPath ?? customPoster ?? null,
        custom_backdrop_path: data.customBackdropPath ?? customBackdrop ?? null,
      };

      const { error } = await supabase
        .from("user_games")
        .upsert(payload, { onConflict: "user_id,game_id" });

      if (error) throw error;

      setGameStatus(data.status);
      setIsFavorite(data.isFavorite);
      setRating(data.rating);
      setReview(data.review);
      setHasSpoilers(data.hasSpoilers);
      setStartDate(data.startDate || "");
      setEndDate(data.endDate || "");
      if (data.customPosterPath !== undefined) {
        setCustomPoster(data.customPosterPath);
      }
      if (data.customBackdropPath !== undefined) {
        setCustomBackdrop(data.customBackdropPath);
      }
      setIsLogModalOpen(false);
      addToast("Game review saved", "success");
    } catch (err: any) {
      addToast(err?.message || "Failed to save review", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLog = async () => {
    try {
      setIsSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !game) return;

      const { error } = await supabase
        .from("user_games")
        .delete()
        .eq("user_id", session.user.id)
        .eq("game_id", game.id);

      if (error) throw error;

      setGameStatus(null);
      setIsFavorite(false);
      setRating(0);
      setReview("");
      setHasSpoilers(false);
      setStartDate("");
      setEndDate("");
      setIsLogModalOpen(false);
      addToast("Game log removed", "info");
    } catch (err: any) {
      addToast(err?.message || "Failed to delete log", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const listMediaPayload = useMemo(() => {
    if (!game) return null;
    return {
      mediaType: "game" as const,
      mediaId: game.id,
      title: game.name,
      overview: game.summary || null,
      posterPath: posterUrl,
      backdropPath: backdropUrl,
      customPosterPath: customPoster,
      customBackdropPath: customBackdrop,
    };
  }, [game, posterUrl, backdropUrl, customPoster, customBackdrop]);

  if (loading) return <Loading />;
  if (!game) return null;

  const activePosterPath = posterUrl;
  const activeBackdropPath = backdropUrl;
  const hasMultiplePosters = availablePosters.length > 0;
  const hasMultipleBackdrops = availableBackdrops.length > 0;

  return (
    <>
      <MediaLayout
        backdropUrl={backdropUrl}
        backdropAlt={game.name}
        isBackdropLoaded={isBackdropLoaded}
        onBackdropLoaded={() => setIsBackdropLoaded(true)}
        hasMultipleBackdrops={hasMultipleBackdrops}
        onOpenBackdropPicker={() => setIsBackdropPickerOpen(true)}
        posterColumn={
          <MediaActionColumn
            posterUrl={posterUrl}
            title={game.name}
            hasMultiplePosters={hasMultiplePosters}
            onOpenPosterPicker={() => setIsPosterPickerOpen(true)}
            mediaType="game"
            status={gameStatus}
            isFavorite={isFavorite}
            hasLog={Boolean(gameStatus)}
            isReleased={isReleased}
            onOpenLogModal={() => setIsLogModalOpen(true)}
            onOpenListModal={() => setIsListModalOpen(true)}
            onQuickStatusChange={(newStatus) => {
              handleQuickAction(newStatus, isFavorite);
            }}
            onToggleFavorite={handleToggleFavorite}
          />
        }
      >
        <MediaInfoColumn
          typeLabel="Game"
          title={game.name}
          originalTitle={game.name}
          releaseDate={releaseDateStr}
          tagline={null}
          overview={game.summary || game.storyline || null}
        >
          <MediaTabsNav
            tabs={tabs}
            activeTab={activeTab}
            onChange={(key) => setActiveTab(key as any)}
          />

          {activeTab === "details" && (
            <DetailsTab
              developers={developersList}
              publishers={publishersList}
              platforms={platformsList}
              genres={game.genres?.map((g) => g.name) || []}
              gameModes={game.game_modes?.map((m) => m.name) || []}
              themes={game.themes?.map((t) => t.name) || []}
              storyline={
                game.storyline && game.storyline !== game.summary
                  ? game.storyline
                  : null
              }
            />
          )}

          {activeTab === "trailer" && trailerVideo && (
            <div className="aspect-video w-full max-w-4xl rounded-sm overflow-hidden border border-zinc-800 bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${trailerVideo.video_id}`}
                title="Game Trailer"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {activeTab === "dlcs" && dlcItems.length > 0 && (
            <div className="mt-4">
              <FranchiseSlider
                parts={dlcItems}
                currentMovieId={game.id}
                mediaType="game"
              />
            </div>
          )}

          {activeTab === "franchise" && franchiseItems.length > 0 && (
            <div className="mt-4">
              <FranchiseSlider
                parts={franchiseItems}
                currentMovieId={game.id}
                mediaType="game"
              />
            </div>
          )}
        </MediaInfoColumn>
      </MediaLayout>

      <ArtworkPickerModal
        isOpen={isPosterPickerOpen}
        onClose={() => setIsPosterPickerOpen(false)}
        title="CHANGE COVER"
        type="poster"
        images={availablePosters}
        selectedImage={activePosterPath}
        onSelectImage={handleSelectPoster}
        isLoading={loadingPosters}
      />

      <BackdropPickerModal
        isOpen={isBackdropPickerOpen}
        onClose={() => setIsBackdropPickerOpen(false)}
        title="CHANGE BANNER"
        images={availableBackdrops}
        selectedImage={activeBackdropPath}
        onSelectImage={handleSelectBackdrop}
        isLoading={loadingBackdrops}
      />

      <MediaReviewModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title={game.name}
        typeLabel="Game"
        year={releaseYear}
        releaseDate={releaseDateStr}
        posterUrl={activePosterPath}
        backdropUrl={activeBackdropPath}
        mediaType="game"
        status={gameStatus}
        isFavorite={isFavorite}
        canAddFavorite={canAddFavorite}
        rating={rating}
        review={review}
        hasSpoilers={hasSpoilers}
        startDate={startDate}
        endDate={endDate}
        isSaving={isSaving}
        onSave={handleSaveReview}
        onDelete={gameStatus ? handleDeleteLog : undefined}
        availablePosters={availablePosters}
        availableBackdrops={availableBackdrops}
        selectedPoster={fallbackPoster || customPoster}
        selectedBackdrop={fallbackBackdrop || customBackdrop}
        loadingPosters={loadingPosters}
        loadingBackdrops={loadingBackdrops}
        isReleased={isReleased}
      />

      {listMediaPayload && (
        <ListModal
          isOpen={isListModalOpen}
          onClose={() => setIsListModalOpen(false)}
          media={listMediaPayload}
          availablePosters={availablePosters}
          availableBackdrops={availableBackdrops}
          selectedPoster={customPoster || fallbackPoster}
          selectedBackdrop={customBackdrop || fallbackBackdrop}
          loadingPosters={loadingPosters}
          loadingBackdrops={loadingBackdrops}
        />
      )}
    </>
  );
}

export default function GameDetailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <GameDetailContent />
    </Suspense>
  );
}
