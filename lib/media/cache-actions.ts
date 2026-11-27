"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  animeCacheInput,
  gameCacheInput,
  movieCacheInput,
  tvCacheInput,
  upsertMediaCache,
  type MediaCacheInput,
} from "@/lib/media/cache";
import { getMovieDetail } from "@/lib/details/movie";
import { getTvDetail } from "@/lib/details/tv";
import { getAnimeDetail } from "@/lib/details/anime";
import { getGameDetail } from "@/lib/details/game";
import { MEDIA_TYPES, type MediaType } from "@/lib/media/types";

async function loadCacheInput(mediaType: MediaType, mediaId: number): Promise<MediaCacheInput | null> {
  if (mediaType === "movie") {
    const movie = await getMovieDetail(String(mediaId));
    return movie ? movieCacheInput(movie) : null;
  }
  if (mediaType === "tv") {
    const tv = await getTvDetail(String(mediaId), 1);
    return tv ? tvCacheInput(tv) : null;
  }
  if (mediaType === "anime") {
    const anime = await getAnimeDetail(mediaId);
    return anime ? animeCacheInput(anime) : null;
  }
  const game = await getGameDetail(mediaId);
  return game ? gameCacheInput(game) : null;
}

export async function ensureMediaCached(mediaType: MediaType, mediaId: number): Promise<boolean> {
  if (!MEDIA_TYPES.includes(mediaType) || !Number.isInteger(mediaId) || mediaId <= 0) return false;

  try {
    const session = await createServerSupabase();
    const { data } = await session.auth.getClaims();
    if (!data?.claims?.sub) return false;

    const input = await loadCacheInput(mediaType, mediaId);
    if (!input) return false;

    const error = await upsertMediaCache(createAdminClient() ?? session, mediaType, input);
    return !error;
  } catch {
    return false;
  }
}
