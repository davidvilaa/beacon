import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import Loading from "@/components/ui/Loading";
import TvView from "./TvView";
import { getTvDetail, resolveSeason } from "@/lib/details/tv";
import { buildMediaMetadata, notFoundMetadata } from "@/lib/details/metadata";
import { getInitialMediaLog } from "@/lib/media/log-server";
import { pickRandomBackdrop, pickRandomPoster } from "@/lib/artwork/pick";
import { getBackdropUrl, getPosterUrl } from "@/lib/providers/tmdb/client";
import { regularSeasons, seasonHref, seasonTitle } from "@/lib/media/seasons";

interface SeasonPageProps {
  params: Promise<{ id: string; season: string }>;
}

function parseSeason(value: string): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

export async function generateMetadata({ params }: SeasonPageProps): Promise<Metadata> {
  const { id, season } = await params;
  const tv = await getTvDetail(id, parseSeason(season));
  if (!tv) return notFoundMetadata;
  const seasons = regularSeasons(tv.seasons);
  const current = seasons.find((s) => s.season_number === parseSeason(season));
  return buildMediaMetadata({
    title: seasonTitle(tv.name, current, seasons.length),
    year: (current?.air_date || tv.first_air_date)?.slice(0, 4),
    description: current?.overview || tv.overview,
    image: getBackdropUrl(tv.backdrop_path, "w1280") ?? getPosterUrl(tv.poster_path, "w500"),
  });
}

async function SeasonContent({ params }: SeasonPageProps) {
  const { id, season } = await params;
  const requested = parseSeason(season);
  const tv = await getTvDetail(id, requested);
  if (!tv) notFound();

  const initialSeason = resolveSeason(tv, requested);
  if (initialSeason !== requested || season !== String(requested)) {
    redirect(seasonHref(tv.id, initialSeason));
  }

  const initialLog = await getInitialMediaLog("tv", tv.id, initialSeason);

  await connection();

  const seasonSummary = tv.seasons?.find((s) => s.season_number === initialSeason);
  const seasonPoster = tv.initialSeason?.poster_path || seasonSummary?.poster_path || tv.poster_path;

  return (
    <TvView
      key={`${tv.id}-${initialSeason}`}
      tv={tv}
      initialSeason={initialSeason}
      initialLog={initialLog}
      randomPoster={pickRandomPoster(tv.initialSeason?.images?.posters, seasonPoster)}
      randomBackdrop={pickRandomBackdrop(tv.images?.backdrops, tv.backdrop_path)}
    />
  );
}

export default function SeasonPage({ params }: SeasonPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      }
    >
      <SeasonContent params={params} />
    </Suspense>
  );
}
