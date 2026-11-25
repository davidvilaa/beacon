"use client";

import { forwardRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { getPosterUrl, getBackdropUrl } from "@/lib/tmdb";
import CardGradientBorder from "./CardGradientBorder";

export interface MediaCardProps {
  id?: number | string;
  mediaType?: "movie" | "tv" | "anime" | "game";
  href?: string;
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  subtitle?: string | React.ReactNode;
  asRole?: string | null;
  year?: string | number | null;
  overview?: string | null;
  isCurrent?: boolean;
  variant?: "poster" | "horizontal";
  className?: string;
  priority?: boolean;
  sizes?: string;
}

const MediaCard = forwardRef<HTMLAnchorElement, MediaCardProps>(
  (
    {
      id,
      mediaType = "movie",
      href,
      title,
      posterPath,
      backdropPath,
      subtitle,
      asRole,
      year,
      overview,
      isCurrent = false,
      variant = "poster",
      className = "",
      priority = false,
      sizes,
    },
    ref
  ) => {
    const resolvedHref = href || (id ? `/${mediaType}/${id}` : "#");
    const posterUrl = getPosterUrl(
      posterPath || null,
      variant === "horizontal" ? "w500" : "w500"
    );

    if (variant === "horizontal") {
      return (
        <Link
          ref={ref}
          href={resolvedHref}
          title={title}
          className={`group flex items-start gap-4 sm:gap-5 py-4 px-2 hover:bg-zinc-800/40 rounded-sm transition-colors cursor-pointer min-w-0 ${className}`}
        >
          <div className="relative w-20 sm:w-28 md:w-32 aspect-[2/3] rounded-sm overflow-hidden shrink-0 bg-zinc-900 border border-zinc-800/80">
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={title}
                fill
                priority={priority}
                sizes={sizes || "(max-width: 640px) 80px, (max-width: 768px) 112px, 128px"}
                className="object-cover transition-opacity duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-2 text-center bg-zinc-900">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500 line-clamp-3 leading-snug select-none">
                  {title}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
            <div className="flex items-baseline gap-2.5 min-w-0 mb-1.5 flex-wrap">
              <h3 className="text-xs sm:text-sm md:text-base font-bold uppercase tracking-wider text-zinc-200 group-hover:text-accent transition-colors truncate">
                {title}
              </h3>
              {year && (
                <span className="text-xs sm:text-sm text-zinc-400 font-mono shrink-0 font-normal">
                  {year}
                </span>
              )}
            </div>

            {overview && (
              <p className="text-xs sm:text-sm text-zinc-400 line-clamp-3 sm:line-clamp-4 leading-relaxed mt-2">
                {overview}
              </p>
            )}
          </div>
        </Link>
      );
    }

    const hasFooter = Boolean(subtitle || asRole);

    return (
      <Link
        ref={ref}
        href={resolvedHref}
        title={title}
        className={`group relative flex flex-col rounded-sm overflow-hidden cursor-pointer transition-all duration-200 select-none ${
          isCurrent
            ? "border-2 border-accent"
            : "border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:scale-[1.03] hover:z-10"
        } ${hasFooter ? "w-full" : "aspect-[2/3] w-full"} ${className}`}
      >
        {!isCurrent && <CardGradientBorder roundedClassName="rounded-sm" />}

        <div
          className={`relative bg-zinc-900 overflow-hidden ${
            hasFooter
              ? "aspect-[2/3] w-full border-b border-zinc-800/80"
              : "w-full h-full"
          }`}
        >
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              priority={priority}
              sizes={sizes || "(max-width: 640px) 180px, (max-width: 1024px) 240px, 280px"}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-3 text-center bg-zinc-900">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-500 line-clamp-4 leading-snug select-none">
                {title}
              </span>
            </div>
          )}
        </div>

        {hasFooter && (
          <div className="py-1.5 px-2.5 bg-zinc-900/50 group-hover:bg-zinc-900/80 transition-colors text-center overflow-hidden">
            <p
              className="text-[11px] leading-tight text-zinc-400 group-hover:text-zinc-300 transition-colors truncate block w-full min-w-0"
              title={
                asRole
                  ? `as ${asRole}`
                  : typeof subtitle === "string"
                  ? subtitle
                  : undefined
              }
            >
              {asRole ? (
                <>
                  <span className="text-zinc-500 font-normal group-hover:text-zinc-400 transition-colors">
                    as{" "}
                  </span>
                  <span className="text-zinc-200 font-medium group-hover:text-zinc-100 transition-colors">
                    {asRole}
                  </span>
                </>
              ) : (
                subtitle
              )}
            </p>
          </div>
        )}
      </Link>
    );
  }
);

MediaCard.displayName = "MediaCard";

export default MediaCard;
