import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Loading from "@/components/ui/Loading";
import GameView from "./GameView";
import { getGameArtworkLists, getGameDetail } from "@/lib/details/game";
import { buildMediaMetadata, notFoundMetadata } from "@/lib/details/metadata";
import { withTimeout } from "@/lib/details/timeout";
import { getInitialMediaLog } from "@/lib/media/log-server";
import { getIgdbImageUrl } from "@/lib/providers/igdb/client";

const ARTWORK_TIMEOUT_MS = 1500;
const RANDOM_POOL = 10;

function pickRandom(list: string[]): string | null {
  const pool = list.slice(0, RANDOM_POOL);
  return pool[Math.floor(Math.random() * pool.length)] || null;
}

interface GamePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { id } = await params;
  const game = await getGameDetail(Number(id) || 0);
  if (!game) return notFoundMetadata;
  return buildMediaMetadata({
    title: game.name,
    year: game.first_release_date ? new Date(game.first_release_date * 1000).getUTCFullYear() : null,
    description: game.summary,
    image:
      getIgdbImageUrl(game.artworks?.[0]?.image_id || game.screenshots?.[0]?.image_id, "1080p") ??
      getIgdbImageUrl(game.cover?.image_id, "1080p"),
  });
}

async function GameContent({ params }: GamePageProps) {
  const { id } = await params;
  const gameId = Number(id) || 0;
  const [game, initialLog, artwork] = await Promise.all([
    getGameDetail(gameId),
    getInitialMediaLog("game", gameId),
    withTimeout(getGameArtworkLists(gameId), ARTWORK_TIMEOUT_MS, null),
  ]);
  if (!game) notFound();

  await connection();

  return (
    <GameView
      game={game}
      initialLog={initialLog}
      randomPoster={artwork ? pickRandom(artwork.posters) : null}
      randomBackdrop={artwork ? pickRandom(artwork.backdrops) : null}
      posterCount={artwork?.posters.length ?? 0}
      backdropCount={artwork?.backdrops.length ?? 0}
    />
  );
}

export default function GamePage({ params }: GamePageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      }
    >
      <GameContent params={params} />
    </Suspense>
  );
}
