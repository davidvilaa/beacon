import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Loading from "@/components/ui/Loading";
import MovieView from "./MovieView";
import { getMovieDetail } from "@/lib/details/movie";
import { buildMediaMetadata, notFoundMetadata } from "@/lib/details/metadata";
import { getInitialMediaLog } from "@/lib/media/log-server";
import { pickRandomBackdrop, pickRandomPoster } from "@/lib/artwork/pick";
import { getBackdropUrl, getPosterUrl } from "@/lib/providers/tmdb/client";

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const { id } = await params;
  const movie = await getMovieDetail(id);
  if (!movie) return notFoundMetadata;
  return buildMediaMetadata({
    title: movie.title,
    year: movie.release_date?.slice(0, 4),
    description: movie.overview,
    image: getBackdropUrl(movie.backdrop_path, "w1280") ?? getPosterUrl(movie.poster_path, "w500"),
  });
}

async function MovieContent({ params }: MoviePageProps) {
  const { id } = await params;
  const [movie, initialLog] = await Promise.all([
    getMovieDetail(id),
    getInitialMediaLog("movie", Number(id) || 0),
  ]);
  if (!movie) notFound();

  await connection();

  return (
    <MovieView
      movie={movie}
      initialLog={initialLog}
      randomPoster={pickRandomPoster(movie.images?.posters, movie.poster_path)}
      randomBackdrop={pickRandomBackdrop(movie.images?.backdrops, movie.backdrop_path)}
    />
  );
}

export default function MoviePage({ params }: MoviePageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      }
    >
      <MovieContent params={params} />
    </Suspense>
  );
}
