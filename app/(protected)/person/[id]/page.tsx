import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Loading from "@/components/ui/Loading";
import PersonView from "./PersonView";
import { getPersonDetail } from "@/lib/details/person";
import { buildMediaMetadata, notFoundMetadata } from "@/lib/details/metadata";
import { getPosterUrl } from "@/lib/providers/tmdb/client";

interface PersonPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PersonPageProps): Promise<Metadata> {
  const { id } = await params;
  const person = await getPersonDetail(id);
  if (!person) return notFoundMetadata;
  return buildMediaMetadata({
    title: person.name,
    description: person.biography,
    image: getPosterUrl(person.profile_path ?? null, "w500"),
  });
}

async function PersonContent({ params }: PersonPageProps) {
  const { id } = await params;
  const person = await getPersonDetail(id);
  if (!person) notFound();
  return <PersonView key={id} person={person} />;
}

export default function PersonPage({ params }: PersonPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      }
    >
      <PersonContent params={params} />
    </Suspense>
  );
}
