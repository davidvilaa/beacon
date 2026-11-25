"use client";

import { useCallback, useEffect, useState } from "react";
import type { MovieImage } from "@/lib/tmdb";
import { pickRandomPath } from "@/lib/artwork/pick";

interface CachedArtwork {
  images: MovieImage[];
  random: string | null;
}

interface ArtworkList extends CachedArtwork {
  url: string | null;
  loading: boolean;
  loaded: boolean;
}

const RANDOM_POOL = 10;
const artworkCache = new Map<string, CachedArtwork>();
const inFlight = new Map<string, Promise<CachedArtwork>>();

function listFor(url: string | null): ArtworkList {
  const cached = url ? artworkCache.get(url) : undefined;
  return {
    url,
    images: cached?.images || [],
    random: cached?.random || null,
    loading: false,
    loaded: Boolean(cached),
  };
}

function requestArtwork(
  url: string,
  key: "posters" | "backdrops",
  randomPool: number
): Promise<CachedArtwork> {
  const pending = inFlight.get(url);
  if (pending) return pending;
  const request = fetch(url)
    .then((res): Promise<Record<string, unknown>> => (res.ok ? res.json() : Promise.resolve({})))
    .then((data) => {
      const value = data[key];
      const images = Array.isArray(value) ? (value as MovieImage[]) : [];
      const entry = { images, random: pickRandomPath(images, randomPool) };
      artworkCache.set(url, entry);
      return entry;
    })
    .catch(() => ({ images: [], random: null }))
    .finally(() => inFlight.delete(url));
  inFlight.set(url, request);
  return request;
}

interface UseArtworkOptionsParams {
  postersUrl: string | null;
  backdropsUrl: string | null;
  eagerPosters?: boolean;
  eagerBackdrops?: boolean;
  randomPool?: number;
}

export function useArtworkOptions({
  postersUrl,
  backdropsUrl,
  eagerPosters = false,
  eagerBackdrops = false,
  randomPool = RANDOM_POOL,
}: UseArtworkOptionsParams) {
  const [posters, setPosters] = useState<ArtworkList>(() => listFor(postersUrl));
  const [backdrops, setBackdrops] = useState<ArtworkList>(() => listFor(backdropsUrl));

  if (posters.url !== postersUrl) setPosters(listFor(postersUrl));
  if (backdrops.url !== backdropsUrl) setBackdrops(listFor(backdropsUrl));

  const loadList = useCallback(
    (
      url: string | null,
      key: "posters" | "backdrops",
      setList: React.Dispatch<React.SetStateAction<ArtworkList>>,
      markLoading: boolean
    ) => {
      if (!url || artworkCache.has(url)) return;
      if (markLoading) setList((prev) => (prev.url === url ? { ...prev, loading: true } : prev));
      requestArtwork(url, key, randomPool).then((entry) => {
        setList((prev) =>
          prev.url === url ? { url, ...entry, loading: false, loaded: true } : prev
        );
      });
    },
    [randomPool]
  );

  const load = useCallback(() => {
    loadList(postersUrl, "posters", setPosters, true);
    loadList(backdropsUrl, "backdrops", setBackdrops, true);
  }, [postersUrl, backdropsUrl, loadList]);

  useEffect(() => {
    if (eagerPosters) loadList(postersUrl, "posters", setPosters, false);
  }, [eagerPosters, postersUrl, loadList]);

  useEffect(() => {
    if (eagerBackdrops) loadList(backdropsUrl, "backdrops", setBackdrops, false);
  }, [eagerBackdrops, backdropsUrl, loadList]);

  return {
    posters: posters.images,
    backdrops: backdrops.images,
    randomPoster: posters.random,
    randomBackdrop: backdrops.random,
    postersLoaded: posters.loaded,
    backdropsLoaded: backdrops.loaded,
    loadingPosters: posters.loading || (eagerPosters && Boolean(postersUrl) && !posters.loaded),
    loadingBackdrops: backdrops.loading || (eagerBackdrops && Boolean(backdropsUrl) && !backdrops.loaded),
    load,
  };
}
