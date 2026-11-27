import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Loading from "@/components/ui/Loading";
import { getTvDetail, resolveSeason } from "@/lib/details/tv";
import { seasonHref } from "@/lib/media/seasons";

interface TvPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string }>;
}

async function TvRedirect({ params, searchParams }: TvPageProps): Promise<null> {
  const [{ id }, { season }] = await Promise.all([params, searchParams]);
  const requested = parseInt(season || "1", 10);
  const tv = await getTvDetail(id, isNaN(requested) || requested < 1 ? 1 : requested);
  if (!tv) notFound();
  redirect(seasonHref(tv.id, resolveSeason(tv, requested)));
  return null;
}

export default function TvPage(props: TvPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      }
    >
      <TvRedirect {...props} />
    </Suspense>
  );
}
