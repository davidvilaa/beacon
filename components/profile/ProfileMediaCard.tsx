"use client";

import Link from "next/link";
import Image from "next/image";
import { Film, Tv, Star, Heart, Eye, Bookmark, PlayCircle, PauseCircle, XCircle } from "lucide-react";
import { getPosterUrl } from "@/lib/tmdb";

export interface ProfileMediaCardProps {
  id: number | string;
  title: string;
  posterPath: string | null;
  href: string;
  mediaType: "movie" | "tv";
  rating?: number | null;
  status?: string | null;
  isFavorite?: boolean;
  subtitle?: string | null;
  priority?: boolean;
  className?: string;
}

export default function ProfileMediaCard({
  id,
  title,
  posterPath,
  href,
  mediaType,
  rating,
  status,
  isFavorite,
  subtitle,
  priority = false,
  className = "",
}: ProfileMediaCardProps) {
  const posterUrl = getPosterUrl(posterPath, "w500");

  const renderStatusIcon = () => {
    switch (status) {
      case "watched":
        return <Eye className="w-3 h-3 text-[#a8dadc]" />;
      case "watching":
        return <PlayCircle className="w-3 h-3 text-[#a8dadc]" />;
      case "paused":
        return <PauseCircle className="w-3 h-3 text-amber-400" />;
      case "dropped":
        return <XCircle className="w-3 h-3 text-rose-400" />;
      case "watchlist":
        return <Bookmark className="w-3 h-3 text-[#a8dadc] fill-[#a8dadc]" />;
      default:
        return null;
    }
  };

  return (
    <Link
      href={href}
      title={title}
      className={`group relative aspect-[2/3] w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 transition-all duration-200 hover:border-[#a8dadc]/60 hover:scale-[1.02] cursor-pointer shadow-md select-none block ${className}`}
    >
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-zinc-900 text-zinc-600">
          {mediaType === "movie" ? (
            <Film className="w-8 h-8 mb-1.5 text-zinc-700" />
          ) : (
            <Tv className="w-8 h-8 mb-1.5 text-zinc-700" />
          )}
          <span className="text-[11px] font-semibold text-zinc-400 line-clamp-2">
            {title}
          </span>
        </div>
      )}

      <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none z-10">
        <div>
          {rating !== undefined && rating !== null && rating > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-sm border border-zinc-700/70 text-[10px] font-bold text-zinc-100 shadow-md">
              <Star className="w-3 h-3 text-[#a8dadc] fill-[#a8dadc]" />
              <span>{Number(rating).toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isFavorite && (
            <div className="p-1 rounded-md bg-black/80 backdrop-blur-sm border border-zinc-700/70 text-[#a8dadc] shadow-md">
              <Heart className="w-3 h-3 fill-[#a8dadc]" />
            </div>
          )}
          {status && (
            <div className="p-1 rounded-md bg-black/80 backdrop-blur-sm border border-zinc-700/70 shadow-md">
              {renderStatusIcon()}
            </div>
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 pt-10 pb-2 px-2.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col justify-end pointer-events-none transition-opacity duration-200">
        <h4 className="text-xs font-bold text-zinc-100 truncate group-hover:text-[#a8dadc] transition-colors">
          {title}
        </h4>
        {subtitle && (
          <p className="text-[10px] font-medium text-zinc-400 truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </Link>
  );
}
