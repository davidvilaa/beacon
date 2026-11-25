import type { MediaType } from "@/lib/media/types";
export function isMediaReleased(
  mediaType: MediaType,
  status?: string | null,
  releaseOrAirDate?: string | null
): boolean {
  if (mediaType === "movie" || mediaType === "game") {
    if (!status) {
      if (releaseOrAirDate) {
        const parsed = new Date(releaseOrAirDate);
        if (!isNaN(parsed.getTime())) return parsed.getTime() <= Date.now();
      }
      return true;
    }
    return status.toLowerCase() === "released";
  }

  if (mediaType === "tv") {
    if (!status) return true;
    const s = status.toLowerCase();
    if (s === "returning series" || s === "ended") {
      if (releaseOrAirDate) {
        const parsed = new Date(releaseOrAirDate);
        if (!isNaN(parsed.getTime())) return parsed.getTime() <= Date.now();
      }
      return true;
    }
    if (s === "canceled") {
      if (!releaseOrAirDate) return true;
      const parsed = new Date(releaseOrAirDate);
      if (!isNaN(parsed.getTime())) return parsed.getTime() <= Date.now();
      return true;
    }
    return false;
  }

  if (mediaType === "anime") {
    if (!status) return true;
    const s = status.toUpperCase();
    if (s === "FINISHED" || s === "RELEASING") return true;
    if (s === "NOT_YET_RELEASED") return false;
    if (releaseOrAirDate) {
      const parsed = new Date(releaseOrAirDate);
      if (!isNaN(parsed.getTime())) return parsed.getTime() <= Date.now();
    }
    return true;
  }

  return true;
}
