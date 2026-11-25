import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Loading from "@/components/ui/Loading";
import ReviewView from "./ReviewView";
import { loadReviewPage } from "@/lib/details/review";
import { buildMediaMetadata, notFoundMetadata } from "@/lib/details/metadata";
import { getBackdropUrl, getPosterUrl } from "@/lib/providers/tmdb/client";

interface ReviewPageProps {
  params: Promise<{ username: string; type: string; id: string }>;
}

async function readParams(params: ReviewPageProps["params"]) {
  const { username, type, id } = await params;
  return { username: decodeURIComponent(username), type, id };
}

export async function generateMetadata({ params }: ReviewPageProps): Promise<Metadata> {
  const { username, type, id } = await readParams(params);
  const { review, tmdbMeta } = await loadReviewPage(type, id, username);
  if (!review) return notFoundMetadata;
  const title = tmdbMeta?.title || review.title;
  const backdrop = review.custom_backdrop_path || review.backdrop_path || tmdbMeta?.backdrop_path || null;
  const poster = review.custom_poster_path || review.poster_path || tmdbMeta?.poster_path || null;
  return buildMediaMetadata({
    title: `${title} review by ${review.users?.username || username}`,
    description: review.has_spoilers ? null : review.review,
    image: getBackdropUrl(backdrop, "w1280") ?? getPosterUrl(poster, "w500"),
  });
}

async function ReviewContent({ params }: ReviewPageProps) {
  const { username, type, id } = await readParams(params);
  const data = await loadReviewPage(type, id, username);
  if (!data.review) notFound();

  return (
    <ReviewView
      initialReview={data.review}
      tmdbMeta={data.tmdbMeta}
      tvSeasons={data.tvSeasons}
      currentUserId={data.currentUserId}
    />
  );
}

export default function ReviewPage({ params }: ReviewPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      }
    >
      <ReviewContent params={params} />
    </Suspense>
  );
}
