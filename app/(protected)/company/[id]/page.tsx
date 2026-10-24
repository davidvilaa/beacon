"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Building2, Film, Globe } from "lucide-react";
import { CompanyDetails, CompanyWorkCredit, getPosterUrl } from "@/lib/tmdb";
import Loading from "@/components/ui/Loading";
import Select, { Option } from "@/components/ui/Select";

const MEDIA_OPTIONS: Option[] = [
  { id: "all", label: "All Formats" },
  { id: "movie", label: "Movies" },
  { id: "tv", label: "Series" },
];

const SORT_OPTIONS: Option[] = [
  { id: "popularity", label: "Most Popular" },
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
];

function CompanyDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const [mediaFilter, setMediaFilter] = useState<"all" | "movie" | "tv">("all");
  const [sortBy, setSortBy] = useState<"popularity" | "newest" | "oldest">("popularity");

  useEffect(() => {
    let ignore = false;

    async function fetchCompany() {
      try {
        setLoading(true);
        const res = await fetch(`/api/company/${id}`);
        if (!res.ok) {
          throw new Error("Failed to load company");
        }
        const data: CompanyDetails = await res.json();
        if (!ignore) {
          setCompany(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (id) {
      fetchCompany();
    }

    return () => {
      ignore = true;
    };
  }, [id]);

  const displayedWorks = useMemo(() => {
    if (!company?.works) return [];

    let list = [...company.works];

    if (mediaFilter !== "all") {
      list = list.filter((item) => item.media_type === mediaFilter);
    }

    return list.sort((a, b) => {
      if (sortBy === "popularity") {
        const votesA = a.vote_count ?? 0;
        const votesB = b.vote_count ?? 0;
        if (votesB !== votesA) return votesB - votesA;
        return (b.popularity ?? 0) - (a.popularity ?? 0);
      }

      const dateA = a.release_date || a.first_air_date || "";
      const dateB = b.release_date || b.first_air_date || "";

      if (sortBy === "newest") {
        if (!dateA && !dateB) return (b.vote_count ?? 0) - (a.vote_count ?? 0);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.localeCompare(dateA);
      }

      if (sortBy === "oldest") {
        if (!dateA && !dateB) return (a.vote_count ?? 0) - (b.vote_count ?? 0);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.localeCompare(dateB);
      }

      return 0;
    });
  }, [company?.works, mediaFilter, sortBy]);

  if (loading) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
        <Loading />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 text-center">
        <p className="text-zinc-400 mb-4">Studio could not be found.</p>
        <button
          onClick={() => router.back()}
          className="text-xs text-[#a8dadc] hover:underline cursor-pointer"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const logoUrl = getPosterUrl(company.logo_path, "w500");

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 font-[family-name:var(--font-geist-sans)]">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        <aside className="w-full lg:w-80 shrink-0">
          <div className="w-56 sm:w-64 lg:w-full mx-auto rounded-2xl overflow-hidden bg-zinc-900/40 border border-zinc-800 shadow-xl">
            <div className={`relative aspect-[2/3] w-full border-b border-zinc-800 flex items-center justify-center p-6 ${logoUrl ? "bg-white" : "bg-zinc-900"}`}>
              {logoUrl ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={logoUrl}
                    alt={company.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 256px, 320px"
                    className="object-contain p-6"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 bg-zinc-900 p-6">
                  <Building2 className="w-16 h-16 mb-2 stroke-[1.5] text-zinc-700" />
                  <span className="text-xs uppercase tracking-wider font-bold text-zinc-600">
                    No Logo
                  </span>
                </div>
              )}
            </div>

            <div className="p-5 space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800">
                Studio Info
              </h3>

              <div className="space-y-3 text-xs">
                {company.origin_country && (
                  <div>
                    <span className="text-zinc-500 block uppercase tracking-wider text-[10px] font-semibold">
                      Origin Country
                    </span>
                    <p className="text-zinc-200 font-medium mt-1">
                      {company.origin_country}
                    </p>
                  </div>
                )}

                {company.headquarters && (
                  <div>
                    <span className="text-zinc-500 block uppercase tracking-wider text-[10px] font-semibold">
                      Headquarters
                    </span>
                    <p className="text-zinc-200 font-medium mt-1 leading-snug">
                      {company.headquarters}
                    </p>
                  </div>
                )}

                {company.parent_company && (
                  <div>
                    <span className="text-zinc-500 block uppercase tracking-wider text-[10px] font-semibold">
                      Parent Company
                    </span>
                    <Link
                      href={`/company/${company.parent_company.id}`}
                      className="text-[#a8dadc] hover:underline font-medium mt-1 block truncate"
                    >
                      {company.parent_company.name}
                    </Link>
                  </div>
                )}

                {company.homepage && (
                  <div>
                    <span className="text-zinc-500 block uppercase tracking-wider text-[10px] font-semibold">
                      Website
                    </span>
                    <a
                      href={company.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#a8dadc] hover:underline font-medium mt-1 inline-flex items-center gap-1 max-w-full truncate"
                    >
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {company.homepage.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                      </span>
                    </a>
                  </div>
                )}

                {!company.origin_country &&
                  !company.headquarters &&
                  !company.parent_company &&
                  !company.homepage && (
                    <p className="text-xs text-zinc-500 italic">
                      No studio info available.
                    </p>
                  )}
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1 min-w-0 w-full">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Studio
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-100 tracking-tight leading-tight">
              {company.name}
            </h1>
          </div>

          <div className="mt-4 sm:mt-5 pb-3.5 border-b border-zinc-800/80 flex items-center gap-2.5 flex-wrap">
            <Select
              value={mediaFilter}
              onChange={(val) => setMediaFilter(val as "all" | "movie" | "tv")}
              options={MEDIA_OPTIONS}
              variant="compact"
              className="w-36 sm:w-40"
            />

            <Select
              value={sortBy}
              onChange={(val) => setSortBy(val as "popularity" | "newest" | "oldest")}
              options={SORT_OPTIONS}
              variant="compact"
              className="w-36 sm:w-40"
            />
          </div>

          <div className="mt-6">
            {displayedWorks.length === 0 ? (
              <div className="py-20 rounded-xl border border-zinc-800/40 bg-zinc-900/10 min-h-[180px]" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {displayedWorks.map((work, idx) => {
                  const posterUrl = getPosterUrl(work.poster_path, "w500");
                  const title = work.title || work.name || "Untitled";

                  const isMovie = work.media_type === "movie";
                  const cardClass =
                    "group relative aspect-[2/3] w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:border-[#a8dadc]/60 transition-all cursor-pointer";

                  const cardContent = (
                    <>
                      {posterUrl ? (
                        <Image
                          src={posterUrl}
                          alt={title}
                          fill
                          sizes="(max-width: 640px) 180px, (max-width: 1024px) 240px, 280px"
                          className="object-cover group-hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-zinc-900">
                          <Film className="w-8 h-8 text-zinc-700 mb-1" />
                          <span className="text-[10px] text-zinc-500 font-semibold line-clamp-2">
                            {title}
                          </span>
                        </div>
                      )}

                      {work.media_type === "tv" && (
                        <div className="absolute top-2 left-2 z-10">
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-950/80 backdrop-blur-md text-zinc-300 border border-zinc-800">
                            TV
                          </span>
                        </div>
                      )}
                    </>
                  );

                  if (isMovie) {
                    return (
                      <Link
                        key={`${work.media_type}-${work.id}-${idx}`}
                        href={`/movie/${work.id}`}
                        title={title}
                        className={cardClass}
                      >
                        {cardContent}
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={`${work.media_type}-${work.id}-${idx}`}
                      title={title}
                      className={cardClass}
                    >
                      {cardContent}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function CompanyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      }
    >
      <CompanyDetailContent />
    </Suspense>
  );
}
