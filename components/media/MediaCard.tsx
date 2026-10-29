"use client";

import { forwardRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Film } from "lucide-react";
import { getPosterUrl } from "@/lib/tmdb";
import CardGradientBorder from "@/components/ui/CardGradientBorder";

export interface MediaCardProps {
  id?: number | string;
  mediaType?: "movie" | "tv" | "anime" | "game";
  href?: string;
  title: string;
  posterPath?: string | null;
  subtitle?: string | React.ReactNode;
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
      subtitle,
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
      variant === "horizontal" ? "w342" : "w500"
    );

    if (variant === "horizontal") {
      return (
        <Link
          ref={ref}
          href={resolvedHref}
          title={title}
          className={`group relative flex items-stretch rounded-xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/60 hover:scale-[1.03] hover:z-10 transition-all duration-200 cursor-pointer overflow-hidden h-44 sm:h-48 md:h-52 ${className}`}
        >
          {!isCurrent && <CardGradientBorder />}

          <div className="relative h-full aspect-[2/3] shrink-0 bg-zinc-900 border-r border-zinc-800/80 overflow-hidden">
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={title}
                fill
                priority={priority}
                sizes={sizes || "(max-width: 640px) 120px, (max-width: 768px) 130px, 140px"}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 p-2 text-center">
                <Film className="w-6 h-6 text-zinc-700 mb-1" />
                <span className="text-[10px] text-zinc-600 font-semibold line-clamp-2">
                  {title}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <h3 className="text-sm sm:text-base font-semibold text-zinc-100 group-hover:text-[#a8dadc] transition-colors truncate min-w-0">
                  {title}
                </h3>

                {year && (
                  <div className="flex items-center shrink-0 text-xs text-zinc-500 font-mono">
                    <span className="inline-block w-[4ch] text-center">
                      {year}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-zinc-400 line-clamp-4 sm:line-clamp-5 leading-relaxed">
                {overview || "No overview available."}
              </p>
            </div>
          </div>
        </Link>
      );
    }

    const hasFooter = Boolean(subtitle);

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
          <div className="py-2.5 px-3 bg-zinc-900/50 group-hover:bg-zinc-900/80 transition-colors text-center">
            {typeof subtitle === "string" ? (
              <p
                className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors truncate"
                title={subtitle}
              >
                {subtitle}
              </p>
            ) : (
              subtitle
            )}
          </div>
        )}
      </Link>
    );
  }
);

MediaCard.displayName = "MediaCard";

export default MediaCard;
