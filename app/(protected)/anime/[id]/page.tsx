import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Loading from "@/components/ui/Loading";
import AnimeView from "./AnimeView";
import { getAnimeDetail } from "@/lib/details/anime";
import { buildMediaMetadata, notFoundMetadata } from "@/lib/details/metadata";
import { withTimeout } from "@/lib/details/timeout";
import { getInitialMediaLog } from "@/lib/media/log-server";
import { getAnimeArtworkCandidates } from "@/lib/artwork/sources";
import { pickRandomPath } from "@/lib/artwork/pick";
import {
  getAnimeBackdropUrl,
  getAnimePosterUrl,
  getAnimeTitle,
  stripHtml,
} from "@/lib/providers/anilist/client";

const ARTWORK_TIMEOUT_MS = 1500;

interface AnimePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AnimePageProps): Promise<Metadata> {
  const { id } = await params;
  const anime = await getAnimeDetail(Number(id) || 0);
  if (!anime) return notFoundMetadata;
  return buildMediaMetadata({
    title: getAnimeTitle(anime.title),
    year: anime.startDate?.year,
    description: stripHtml(anime.description),
    image: getAnimeBackdropUrl(anime) ?? getAnimePosterUrl(anime),
  });
}

async function AnimeContent({ params }: AnimePageProps) {
  const { id } = await params;
  const animeId = Number(id) || 0;
  const [anime, initialLog, artwork] = await Promise.all([
    getAnimeDetail(animeId),
    getInitialMediaLog("anime", animeId),
    withTimeout(getAnimeArtworkCandidates(animeId), ARTWORK_TIMEOUT_MS, null),
  ]);
  if (!anime) notFound();

  await connection();

  return (
    <AnimeView
      anime={anime}
      initialLog={initialLog}
      randomPoster={artwork ? pickRandomPath(artwork.posters) : null}
      randomBackdrop={artwork ? pickRandomPath(artwork.backdrops) : null}
      posterCount={artwork?.posters.length ?? 0}
      backdropCount={artwork?.backdrops.length ?? 0}
    />
  );
}

export default function AnimePage({ params }: AnimePageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      }
    >
      <AnimeContent params={params} />
    </Suspense>
  );
}
