"use client";

import { forwardRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Film } from "lucide-react";
import { getPosterUrl, getBackdropUrl } from "@/lib/tmdb";

function CardGradientBorder({
  className = "",
  roundedClassName = "rounded-xl",
}: {
  className?: string;
  roundedClassName?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${roundedClassName} border border-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-10 ${className}`}
      style={{
        background:
          "linear-gradient(to top left, rgba(168, 218, 220, 0.95) 0%, rgba(168, 218, 220, 0.4) 35%, transparent 70%) border-box",
        WebkitMask:
          "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
    />
  );
}

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
          className={`group flex items-center gap-4 sm:gap-5 py-3.5 sm:py-4 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors cursor-pointer min-w-0 ${className}`}
        >
          <div className="relative w-16 sm:w-20 md:w-24 aspect-[2/3] rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-zinc-800/80">
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={title}
                fill
                priority={priority}
                sizes={sizes || "(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"}
                className="object-cover transition-opacity duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center text-zinc-600 bg-zinc-900">
                <Film className="w-5 h-5 mb-1 text-zinc-700" />
                <span className="text-[9px] text-zinc-500 font-semibold truncate max-w-[60px]">
                  {title}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 min-w-0 mb-1 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-200 group-hover:text-[#a8dadc] transition-colors truncate">
                {title}
              </h3>
              {year && (
                <span className="text-xs text-zinc-400 font-mono shrink-0 font-normal">
                  {year}
                </span>
              )}
            </div>

            {overview && (
              <p className="text-xs text-zinc-400 line-clamp-2 sm:line-clamp-3 leading-relaxed">
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
        className={`group relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all duration-200 select-none ${
          isCurrent
            ? "border-2 border-[#a8dadc]"
            : "border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:scale-[1.03] hover:z-10"
        } ${hasFooter ? "w-full" : "aspect-[2/3] w-full"} ${className}`}
      >
        {!isCurrent && <CardGradientBorder />}

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
            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-zinc-900">
              <Film className="w-8 h-8 text-zinc-700 mb-1" />
              <span className="text-[10px] text-zinc-500 font-semibold line-clamp-2">
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
