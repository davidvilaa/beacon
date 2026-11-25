"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { upsertMediaCache, type MediaCacheInput } from "@/lib/media/cache";
import {
  EMPTY_LOG,
  LOG_CONFIG,
  favoriteLimitToast,
  fetchMediaLog,
  hasLogContent,
  logSeason,
  logToRow,
  statusToast,
  type InitialMediaLog,
  type LogMediaType,
  type LogStatus,
  type MediaLogState,
} from "@/lib/media/log";

export interface MediaReviewInput {
  status: LogStatus | null;
  isFavorite: boolean;
  rating: number;
  review: string;
  hasSpoilers: boolean;
  watchedDate?: string;
  startDate?: string;
  endDate?: string;
  hoursPlayed?: number;
  customPosterPath?: string | null;
  customBackdropPath?: string | null;
}

interface UseMediaLogOptions {
  mediaType: LogMediaType;
  mediaId: number | null;
  seasonNumber?: number;
  cacheInput: MediaCacheInput | null;
  isReleased: boolean;
  episodeCount?: number;
  defaultPoster?: string | null;
  defaultBackdrop?: string | null;
  initial?: InitialMediaLog | null;
}

export function useMediaLog({
  mediaType,
  mediaId,
  seasonNumber,
  cacheInput,
  isReleased,
  episodeCount = 0,
  defaultPoster = null,
  defaultBackdrop = null,
  initial = null,
}: UseMediaLogOptions) {
  const config = LOG_CONFIG[mediaType];
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { addToast } = useToast();

  const season = logSeason(mediaType, seasonNumber);
  const logKey = `${mediaType}:${mediaId}:${season}`;
  const initialKey = initial ? `${mediaType}:${mediaId}:${initial.seasonNumber}` : null;
  const initialMatches = initialKey === logKey;

  const [log, setLog] = useState<MediaLogState>(() => (initialMatches && initial ? initial.log : EMPTY_LOG));
  const [userId, setUserId] = useState<string | null>(initial?.userId ?? null);
  const [canAddFavorite, setCanAddFavorite] = useState(() =>
    initialMatches && initial ? initial.canAddFavorite : true
  );
  const [isSaving, setIsSaving] = useState(false);
  const [pagePoster, setPagePoster] = useState<string | null>(null);
  const [pageBackdrop, setPageBackdrop] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState(logKey);
  const serverLoadedKey = useRef<string | null>(initialMatches ? logKey : null);

  if (loadedKey !== logKey) {
    setLoadedKey(logKey);
    setLog(EMPTY_LOG);
    setPagePoster(null);
    setPageBackdrop(null);
  }

  const rowFilter = useCallback(
    (uid: string, id: number): Record<string, string | number> => ({
      user_id: uid,
      [config.idColumn]: id,
      ...(season !== null ? { season_number: season } : {}),
    }),
    [config.idColumn, season]
  );

  useEffect(() => {
    if (serverLoadedKey.current === logKey) return;
    let ignore = false;

    async function load() {
      if (!mediaId) return;
      const uid = initial ? initial.userId : (await supabase.auth.getSession()).data.session?.user.id ?? null;
      if (!uid || ignore) return;
      setUserId(uid);
      const result = await fetchMediaLog(supabase, mediaType, uid, mediaId, season);
      if (ignore) return;
      setLog(result.log);
      setCanAddFavorite(result.canAddFavorite);
    }

    load().catch(() => {});
    return () => {
      ignore = true;
    };
  }, [supabase, mediaType, mediaId, season, logKey, initial]);

  const requireAccount = useCallback((): boolean => {
    if (userId) return true;
    addToast("Sign in to track and review", "info");
    router.push("/login");
    return false;
  }, [userId, addToast, router]);

  const persist = useCallback(
    async (next: MediaLogState, includeArtwork: boolean): Promise<"saved" | "deleted" | "failed"> => {
      if (!userId || !mediaId || !cacheInput) return "failed";

      if (!hasLogContent(next)) {
        if (log.exists) {
          const { error } = await supabase.from(config.table).delete().match(rowFilter(userId, mediaId));
          if (error) {
            addToast("Error removing log", "error");
            return "failed";
          }
        }
        setLog(EMPTY_LOG);
        setPagePoster(null);
        setPageBackdrop(null);
        setCanAddFavorite((prev) => prev || log.isFavorite);
        return "deleted";
      }

      const cacheError = await upsertMediaCache(supabase, mediaType, cacheInput);
      if (cacheError) {
        addToast("Error saving media data", "error");
        return "failed";
      }

      const row: Record<string, unknown> = {
        user_id: userId,
        [config.idColumn]: mediaId,
        ...logToRow(mediaType, next, includeArtwork),
      };
      if (season !== null) row.season_number = season;

      const { error } = await supabase.from(config.table).upsert(row, { onConflict: config.conflict });
      if (error) {
        addToast(
          error.message.includes("Maximum of 5 favorite") ? favoriteLimitToast(mediaType) : "Error saving log",
          "error"
        );
        return "failed";
      }

      setLog({ ...next, exists: true });
      return "saved";
    },
    [userId, mediaId, cacheInput, log.exists, log.isFavorite, rowFilter, supabase, config.table, config.idColumn, config.conflict, mediaType, season, addToast]
  );

  const withCompletedEpisodes = useCallback(
    (next: MediaLogState): MediaLogState =>
      config.tracksEpisodes && next.status === "watched" && episodeCount > 0
        ? { ...next, lastWatchedEpisode: episodeCount }
        : next,
    [config.tracksEpisodes, episodeCount]
  );

  const setStatus = useCallback(
    async (status: LogStatus | null) => {
      if (!requireAccount()) return;
      if (!isReleased && status && status !== "watchlist") {
        addToast("This has not been released yet", "error");
        return;
      }
      const result = await persist(withCompletedEpisodes({ ...log, status }), false);
      if (result === "deleted") addToast("Removed from your library", "info");
      else if (result === "saved") {
        addToast(status ? statusToast(mediaType, status) : "Status removed", status ? "success" : "info");
      }
    },
    [requireAccount, isReleased, log, persist, withCompletedEpisodes, mediaType, addToast]
  );

  const toggleFavorite = useCallback(async () => {
    if (!requireAccount()) return;
    const isFavorite = !log.isFavorite;
    if (isFavorite && !canAddFavorite) {
      addToast(favoriteLimitToast(mediaType), "error");
      return;
    }
    const status = log.exists ? log.status : isReleased ? "watched" : "watchlist";
    const result = await persist(withCompletedEpisodes({ ...log, status, isFavorite }), false);
    if (result === "deleted") addToast("Removed from your library", "info");
    else if (result === "saved") {
      addToast(isFavorite ? "Added to favourites" : "Removed from favourites", isFavorite ? "success" : "info");
    }
  }, [requireAccount, log, canAddFavorite, isReleased, persist, withCompletedEpisodes, mediaType, addToast]);

  const changeEpisode = useCallback(
    async (delta: number) => {
      if (!requireAccount()) return;
      const max = episodeCount || 9999;
      const lastWatchedEpisode = Math.max(0, Math.min(max, log.lastWatchedEpisode + delta));
      if (lastWatchedEpisode === log.lastWatchedEpisode) return;
      const status: LogStatus =
        episodeCount > 0 && lastWatchedEpisode >= episodeCount ? "watched" : "watching";
      const result = await persist({ ...log, status, lastWatchedEpisode }, false);
      if (result === "saved" && status === "watched" && log.status !== "watched") {
        addToast(config.completedToast, "success");
      }
    },
    [requireAccount, episodeCount, log, persist, config.completedToast, addToast]
  );

  const saveReview = useCallback(
    async (data: MediaReviewInput): Promise<boolean> => {
      if (data.isFavorite && !log.isFavorite && !canAddFavorite) {
        addToast(favoriteLimitToast(mediaType), "error");
        return false;
      }
      setIsSaving(true);
      try {
        const next = withCompletedEpisodes({
          ...log,
          status: data.status,
          isFavorite: data.isFavorite,
          rating: data.rating,
          review: data.review,
          hasSpoilers: data.hasSpoilers,
          watchedDate: data.watchedDate || "",
          startDate: data.startDate || "",
          endDate: data.endDate || "",
          hoursPlayed: data.hoursPlayed ?? log.hoursPlayed,
          customPoster: data.customPosterPath ?? null,
          customBackdrop: data.customBackdropPath ?? null,
        });
        const result = await persist(next, true);
        if (result === "failed") return false;
        setPagePoster(null);
        setPageBackdrop(null);
        addToast(result === "deleted" ? "Removed from your library" : "Review saved", result === "deleted" ? "info" : "success");
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [log, canAddFavorite, withCompletedEpisodes, persist, mediaType, addToast]
  );

  const deleteLog = useCallback(async (): Promise<boolean> => {
    if (!userId || !mediaId) return false;
    setIsSaving(true);
    try {
      const { error } = await supabase.from(config.table).delete().match(rowFilter(userId, mediaId));
      if (error) {
        addToast("Error deleting log", "error");
        return false;
      }
      setLog(EMPTY_LOG);
      setPagePoster(null);
      setPageBackdrop(null);
      setCanAddFavorite((prev) => prev || log.isFavorite);
      addToast("Log deleted", "info");
      return true;
    } finally {
      setIsSaving(false);
    }
  }, [userId, mediaId, rowFilter, supabase, config.table, log.isFavorite, addToast]);

  const poster = pagePoster ?? log.customPoster ?? defaultPoster;
  const backdrop = pageBackdrop ?? log.customBackdrop ?? defaultBackdrop;

  return {
    ...log,
    hasLog: log.exists,
    isSignedIn: Boolean(userId),
    requireAccount,
    canAddFavorite,
    isSaving,
    poster,
    backdrop,
    setPoster: setPagePoster,
    setBackdrop: setPageBackdrop,
    setStatus,
    toggleFavorite,
    changeEpisode,
    saveReview,
    deleteLog,
  };
}
