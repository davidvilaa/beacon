import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Loading from "@/components/ui/Loading";
import CompanyView from "./CompanyView";
import { getCompanyDetail } from "@/lib/details/company";
import { buildMediaMetadata, notFoundMetadata } from "@/lib/details/metadata";
import { getPosterUrl } from "@/lib/providers/tmdb/client";

interface CompanyPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { id } = await params;
  const company = await getCompanyDetail(id);
  if (!company) return notFoundMetadata;
  return buildMediaMetadata({
    title: company.name,
    description: company.description,
    image: getPosterUrl(company.logo_path ?? null, "w500"),
  });
}

async function CompanyContent({ params }: CompanyPageProps) {
  const { id } = await params;
  const company = await getCompanyDetail(id);
  if (!company) notFound();
  return <CompanyView key={id} company={company} />;
}

export default function CompanyPage({ params }: CompanyPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      }
    >
      <CompanyContent params={params} />
    </Suspense>
  );
}
