"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/media-utils";

interface Company {
  id: number;
  name: string;
  origin_country?: string;
}

interface Genre {
  id: number;
  name: string;
}

interface DetailsTabProps {
  productionCompanies?: Company[];
  originalTitle?: string | null;
  status?: string | null;
  originalLanguage?: string | null;
  budget?: number | null;
  revenue?: number | null;
  seasonsCount?: number | null;
  episodesCount?: number | null;
  genres?: Genre[];
}

export default function DetailsTab({
  productionCompanies,
  originalTitle,
  status,
  originalLanguage,
  budget,
  revenue,
  seasonsCount,
  episodesCount,
  genres,
}: DetailsTabProps) {
  const hasCompanies = productionCompanies && productionCompanies.length > 0;
  const companiesLabel =
    productionCompanies && productionCompanies.length === 1 ? "Studio" : "Studios";

  return (
    <div className="divide-y divide-zinc-700/80">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
        <div className="w-36 sm:w-44 shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
            {companiesLabel}
          </span>
        </div>
        <div className="flex-1 flex flex-wrap gap-2 items-center">
          {hasCompanies ? (
            productionCompanies.map((company) => (
              <Link
                key={company.id}
                href={`/company/${company.id}`}
                className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700/80 hover:border-[#a8dadc]/60 hover:bg-zinc-700/50 transition-all group cursor-pointer"
              >
                <span className="text-xs font-medium text-zinc-200 group-hover:text-[#a8dadc] transition-colors">
                  {company.name}
                </span>
                {company.origin_country && (
                  <span className="ml-1.5 shrink-0 text-[9px] font-bold uppercase tracking-wider px-1 rounded bg-zinc-700/60 text-zinc-300 border border-zinc-600/50 group-hover:border-[#a8dadc]/40 transition-colors">
                    {company.origin_country}
                  </span>
                )}
              </Link>
            ))
          ) : (
            <span className="text-xs text-zinc-500">—</span>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
        <div className="w-36 sm:w-44 shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
            Original title
          </span>
        </div>
        <div className="flex-1 flex items-center">
          <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80 max-w-full">
            <span
              className="text-xs sm:text-sm font-medium text-zinc-200 truncate"
              title={originalTitle || "—"}
            >
              {originalTitle || "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
        <div className="w-36 sm:w-44 shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
            Status
          </span>
        </div>
        <div className="flex-1 flex items-center">
          <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80">
            <span className="text-xs sm:text-sm font-medium text-zinc-200">
              {status || "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
        <div className="w-36 sm:w-44 shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
            Original language
          </span>
        </div>
        <div className="flex-1 flex items-center">
          <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80">
            <span className="text-xs font-bold uppercase text-zinc-200">
              {originalLanguage?.toUpperCase() || "—"}
            </span>
          </div>
        </div>
      </div>

      {typeof seasonsCount === "number" && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
          <div className="w-36 sm:w-44 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Seasons & Episodes
            </span>
          </div>
          <div className="flex-1 flex items-center">
            <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80">
              <span className="text-xs sm:text-sm font-medium text-zinc-200">
                {seasonsCount} Seasons • {episodesCount ?? 0} Episodes
              </span>
            </div>
          </div>
        </div>
      )}

      {typeof budget === "number" && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
          <div className="w-36 sm:w-44 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Budget
            </span>
          </div>
          <div className="flex-1 flex items-center">
            <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80">
              <span className="text-xs sm:text-sm font-medium text-zinc-200">
                {formatCurrency(budget)}
              </span>
            </div>
          </div>
        </div>
      )}

      {typeof revenue === "number" && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
          <div className="w-36 sm:w-44 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Revenue
            </span>
          </div>
          <div className="flex-1 flex items-center">
            <div className="inline-flex items-center px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700/80">
              <span className="text-xs sm:text-sm font-medium text-zinc-200">
                {formatCurrency(revenue)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors">
        <div className="w-36 sm:w-44 shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
            Genres
          </span>
        </div>
        <div className="flex-1 flex flex-wrap gap-2 items-center">
          {genres && genres.length > 0 ? (
            genres.map((g) => (
              <div
                key={g.id}
                className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700/80"
              >
                <span className="text-xs font-medium text-zinc-200">
                  {g.name}
                </span>
              </div>
            ))
          ) : (
            <span className="text-xs text-zinc-500">—</span>
          )}
        </div>
      </div>
    </div>
  );
}
