"use client";

import Link from "next/link";
import CardGradientBorder from "@/components/ui/CardGradientBorder";
import { formatCurrency } from "@/lib/media-utils";

interface Company {
  id: number | string;
  name: string;
  origin_country?: string;
  href?: string;
}

interface Genre {
  id?: number | string;
  name: string;
}

interface DetailsTabProps {
  productionCompanies?: Company[];
  developers?: string[];
  publishers?: string[];
  platforms?: string[];
  gameModes?: string[];
  themes?: string[];
  originalTitle?: string | null;
  status?: string | null;
  originalLanguage?: string | null;
  budget?: number | null;
  revenue?: number | null;
  seasonsCount?: number | null;
  episodesCount?: number | null;
  genres?: (Genre | string)[];
  format?: string | null;
  season?: string | null;
  storyline?: string | null;
}

export default function DetailsTab({
  productionCompanies,
  developers,
  publishers,
  platforms,
  gameModes,
  themes,
  originalTitle,
  status,
  originalLanguage,
  budget,
  revenue,
  seasonsCount,
  episodesCount,
  genres,
  format,
  season,
  storyline,
}: DetailsTabProps) {
  const hasCompanies = productionCompanies && productionCompanies.length > 0;
  const companiesLabel =
    productionCompanies && productionCompanies.length === 1 ? "Studio" : "Studios";

  return (
    <div className="divide-y divide-zinc-700/80">
      {productionCompanies !== undefined && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors">
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
                  href={company.href || `/company/${company.id}`}
                  className="relative inline-flex items-center px-2.5 py-1 rounded-sm bg-zinc-800 border border-zinc-700/80 hover:bg-zinc-700/50 transition-all group cursor-pointer overflow-hidden"
                >
                  <CardGradientBorder roundedClassName="rounded-sm" />
                  <span className="text-xs font-medium text-zinc-200 group-hover:text-accent transition-colors">
                    {company.name}
                  </span>
                  {company.origin_country && (
                    <span className="ml-1.5 shrink-0 text-[9px] font-bold uppercase tracking-wider px-1 rounded-sm bg-zinc-700/60 text-zinc-300 border border-zinc-600/50 group-hover:border-accent/40 transition-colors">
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
      )}

      {developers && developers.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors">
          <div className="w-36 sm:w-44 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              {developers.length === 1 ? "Developer" : "Developers"}
            </span>
          </div>
          <div className="flex-1 flex flex-wrap gap-2 items-center">
            {developers.map((dev, idx) => (
              <div
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded-sm bg-zinc-800 border border-zinc-700/80"
              >
                <span className="text-xs font-medium text-zinc-200">
                  {dev}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {publishers && publishers.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors">
          <div className="w-36 sm:w-44 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              {publishers.length === 1 ? "Publisher" : "Publishers"}
            </span>
          </div>
          <div className="flex-1 flex flex-wrap gap-2 items-center">
            {publishers.map((pub, idx) => (
              <div
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded-sm bg-zinc-800 border border-zinc-700/80"
              >
                <span className="text-xs font-medium text-zinc-200">
                  {pub}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors">
        <div className="w-36 sm:w-44 shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
            Original title
          </span>
        </div>
        <div className="flex-1 flex items-center">
          <div className="inline-flex items-center px-3 py-1 rounded-sm bg-zinc-800 border border-zinc-700/80 max-w-full">
            <span
              className="text-xs sm:text-sm font-medium text-zinc-200 truncate"
              title={originalTitle || "—"}
            >
              {originalTitle || "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors">
        <div className="w-36 sm:w-44 shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
            Status
          </span>
        </div>
        <div className="flex-1 flex items-center">
          <div className="inline-flex items-center px-3 py-1 rounded-sm bg-zinc-800 border border-zinc-700/80">
            <span className="text-xs sm:text-sm font-medium text-zinc-200 capitalize">
              {status || "—"}
            </span>
          </div>
        </div>
      </div>

      {format && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors">
          <div className="w-36 sm:w-44 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Format
            </span>
          </div>
          <div className="flex-1 flex items-center">
            <div className="inline-flex items-center px-3 py-1 rounded-sm bg-zinc-800 border border-zinc-700/80">
              <span className="text-xs sm:text-sm font-medium text-zinc-200">
                {format}
              </span>
            </div>
          </div>
        </div>
      )}

      {season && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors">
          <div className="w-36 sm:w-44 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Season
            </span>
          </div>
          <div className="flex-1 flex items-center">
            <div className="inline-flex items-center px-3 py-1 rounded-sm bg-zinc-800 border border-zinc-700/80">
              <span className="text-xs sm:text-sm font-medium text-zinc-200 capitalize">
                {season}
              </span>
            </div>
          </div>
        </div>
      )}

      {originalLanguage && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors">
          <div className="w-36 sm:w-44 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Original language
            </span>
          </div>
          <div className="flex-1 flex items-center">
            <div className="inline-flex items-center px-3 py-1 rounded-sm bg-zinc-800 border border-zinc-700/80">
              <span className="text-xs font-bold uppercase text-zinc-200">
                {originalLanguage.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {typeof seasonsCount === "number" && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors">
          <div className="w-36 sm:w-44 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Seasons & Episodes
            </span>
          </div>
          <div className="flex-1 flex items-center">
            <div className="inline-flex items-center px-3 py-1 rounded-sm bg-zinc-800 border border-zinc-700/80">
              <span className="text-xs sm:text-sm font-medium text-zinc-200">
                {seasonsCount} Seasons • {episodesCount ?? 0} Episodes
              </span>
            </div>
          </div>
        </div>
      )}

      {typeof seasonsCount !== "number" && typeof episodesCount === "number" && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors">
          <div className="w-36 sm:w-44 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Episodes
            </span>
          </div>
          <div className="flex-1 flex items-center">
            <div className="inline-flex items-center px-3 py-1 rounded-sm bg-zinc-800 border border-zinc-700/80">
              <span className="text-xs sm:text-sm font-medium text-zinc-200">
                {episodesCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {typeof budget === "number" && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors">
          <div className="w-36 sm:w-44 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Budget
            </span>
          </div>
          <div className="flex-1 flex items-center">
            <div className="inline-flex items-center px-3 py-1 rounded-sm bg-zinc-800 border border-zinc-700/80">
              <span className="text-xs sm:text-sm font-medium text-zinc-200">
                {formatCurrency(budget)}
              </span>
            </div>
          </div>
        </div>
      )}

      {typeof revenue === "number" && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors">
          <div className="w-36 sm:w-44 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Revenue
            </span>
          </div>
          <div className="flex-1 flex items-center">
            <div className="inline-flex items-center px-3 py-1 rounded-sm bg-zinc-800 border border-zinc-700/80">
              <span className="text-xs sm:text-sm font-medium text-zinc-200">
                {formatCurrency(revenue)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors">
        <div className="w-36 sm:w-44 shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
            Genres
          </span>
        </div>
        <div className="flex-1 flex flex-wrap gap-2 items-center">
          {genres && genres.length > 0 ? (
            genres.map((g, idx) => {
              const genreName = typeof g === "string" ? g : g.name;
              const genreKey =
                typeof g === "string" ? `${g}-${idx}` : g.id ?? `${g.name}-${idx}`;
              return (
                <div
                  key={genreKey}
                  className="inline-flex items-center px-2.5 py-1 rounded-sm bg-zinc-800 border border-zinc-700/80"
                >
                  <span className="text-xs font-medium text-zinc-200">
                    {genreName}
                  </span>
                </div>
              );
            })
          ) : (
            <span className="text-xs text-zinc-500">—</span>
          )}
        </div>
      </div>

      {platforms && platforms.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors">
          <div className="w-36 sm:w-44 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Platforms
            </span>
          </div>
          <div className="flex-1 flex flex-wrap gap-2 items-center">
            {platforms.map((plat, idx) => (
              <div
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded-sm bg-zinc-800 border border-zinc-700/80"
              >
                <span className="text-xs font-medium text-zinc-200">
                  {plat}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {gameModes && gameModes.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors">
          <div className="w-36 sm:w-44 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Game Modes
            </span>
          </div>
          <div className="flex-1 flex flex-wrap gap-2 items-center">
            {gameModes.map((mode, idx) => (
              <div
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded-sm bg-zinc-800 border border-zinc-700/80"
              >
                <span className="text-xs font-medium text-zinc-200">
                  {mode}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {themes && themes.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors">
          <div className="w-36 sm:w-44 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Themes
            </span>
          </div>
          <div className="flex-1 flex flex-wrap gap-2 items-center">
            {themes.map((theme, idx) => (
              <div
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded-sm bg-zinc-800 border border-zinc-700/80"
              >
                <span className="text-xs font-medium text-zinc-200">
                  {theme}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {storyline && (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-8 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors">
          <div className="w-36 sm:w-44 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Storyline
            </span>
          </div>
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {storyline}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
