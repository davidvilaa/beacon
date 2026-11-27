import { connection } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  EMPTY_LOG,
  fetchMediaLog,
  logSeason,
  type InitialMediaLog,
  type LogMediaType,
} from "@/lib/media/log";

export async function getInitialMediaLog(
  mediaType: LogMediaType,
  mediaId: number,
  seasonNumber?: number | null
): Promise<InitialMediaLog> {
  const season = logSeason(mediaType, seasonNumber);
  const empty: InitialMediaLog = { userId: null, seasonNumber: season, log: EMPTY_LOG, canAddFavorite: true };

  await connection();

  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase.auth.getClaims();
    const userId = (data?.claims?.sub as string | undefined) ?? null;
    if (!userId) return empty;
    const result = await fetchMediaLog(supabase, mediaType, userId, mediaId, season);
    return { userId, seasonNumber: season, ...result };
  } catch {
    return empty;
  }
}
