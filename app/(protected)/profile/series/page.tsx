"use client";

import { useEffect, useState, useMemo } from "react";
import { Eye, Bookmark, Heart, PlayCircle, PauseCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Option } from "@/components/ui/Select";
import ProfileFilterBar from "@/components/profile/ProfileFilterBar";
import ProfileMediaGrid from "@/components/profile/ProfileMediaGrid";
import { ProfileMediaCardProps } from "@/components/profile/ProfileMediaCard";

interface UserSeriesEntry {
  id: string;
  series_id: number;
  season_number: number;
  status: "watching" | "watched" | "paused" | "dropped" | "watchlist";
  is_favorite: boolean;
  rating: number | null;
  review: string | null;
  has_spoilers: boolean;
  custom_poster_path: string | null;
  custom_backdrop_path: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  series: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string | null;
    number_of_seasons?: number;
    number_of_episodes?: number;
  } | null;
}

const STATUS_OPTIONS: Option[] = [
  { id: "all", label: "All status" },
  { id: "watching", label: "Watching", icon: <PlayCircle className="w-3.5 h-3.5 text-[#a8dadc]" /> },
  { id: "watched", label: "Watched", icon: <Eye className="w-3.5 h-3.5 text-[#a8dadc]" /> },
  { id: "paused", label: "Paused", icon: <PauseCircle className="w-3.5 h-3.5 text-amber-400" /> },
  { id: "dropped", label: "Dropped", icon: <XCircle className="w-3.5 h-3.5 text-rose-400" /> },
  { id: "watchlist", label: "Watchlist", icon: <Bookmark className="w-3.5 h-3.5 text-[#a8dadc] fill-[#a8dadc]" /> },
];

const FAVORITE_OPTIONS: Option[] = [
  { id: "all", label: "All series" },
  { id: "favorites", label: "Favorites only", icon: <Heart className="w-3.5 h-3.5 text-[#a8dadc] fill-[#a8dadc]" /> },
];

const SORT_OPTIONS: Option[] = [
  { id: "recent", label: "Recently added" },
  { id: "rating_desc", label: "Highest rating" },
  { id: "rating_asc", label: "Lowest rating" },
  { id: "name_asc", label: "Title (A-Z)" },
  { id: "name_desc", label: "Title (Z-A)" },
];

export default function ProfileSeriesPage() {
  const [series, setSeries] = useState<UserSeriesEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [favoriteFilter, setFavoriteFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;

    async function fetchUserSeries() {
      try {
        setLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) return;

        const { data, error } = await supabase
          .from("user_series")
          .select(`
            id,
            series_id,
            season_number,
            status,
            is_favorite,
            rating,
            review,
            has_spoilers,
            custom_poster_path,
            custom_backdrop_path,
            start_date,
            end_date,
            created_at,
            updated_at,
            series (
              id,
              name,
              poster_path,
              backdrop_path,
              overview,
              number_of_seasons,
              number_of_episodes
            )
          `)
          .eq("user_id", session.user.id)
          .order("updated_at", { ascending: false });

        if (ignore) return;

        if (data) {
          setSeries(data as unknown as UserSeriesEntry[]);
        }
      } catch (err) {
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchUserSeries();

    return () => {
      ignore = true;
    };
  }, [supabase]);

  const filteredSeries = useMemo(() => {
    let result = [...series];

    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }

    if (favoriteFilter === "favorites") {
      result = result.filter((s) => s.is_favorite);
    }

    switch (sortBy) {
      case "recent":
        result.sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at).getTime();
          const dateB = new Date(b.updated_at || b.created_at).getTime();
          return dateB - dateA;
        });
        break;
      case "rating_desc":
        result.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
        break;
      case "rating_asc":
        result.sort((a, b) => (Number(a.rating) || 0) - (Number(b.rating) || 0));
        break;
      case "name_asc":
        result.sort((a, b) =>
          (a.series?.name || "").localeCompare(b.series?.name || "")
        );
        break;
      case "name_desc":
        result.sort((a, b) =>
          (b.series?.name || "").localeCompare(a.series?.name || "")
        );
        break;
    }

    return result;
  }, [series, statusFilter, favoriteFilter, sortBy]);

  const cardItems = useMemo<ProfileMediaCardProps[]>(() => {
    return filteredSeries.map((s) => ({
      id: `${s.series_id}-${s.season_number}`,
      title: s.series?.name || "Series",
      posterPath: s.custom_poster_path || s.series?.poster_path || null,
      href: `/tv/${s.series_id}?season=${s.season_number}`,
      mediaType: "tv",
      rating: s.rating ? Number(s.rating) : null,
      status: s.status,
      isFavorite: s.is_favorite,
      subtitle: s.season_number > 0 ? `Season ${s.season_number}` : undefined,
    }));
  }, [filteredSeries]);

  return (
    <div>
      <ProfileFilterBar
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
        favoriteValue={favoriteFilter}
        onFavoriteChange={setFavoriteFilter}
        favoriteOptions={FAVORITE_OPTIONS}
        sortValue={sortBy}
        onSortChange={setSortBy}
        sortOptions={SORT_OPTIONS}
        totalCount={filteredSeries.length}
        itemLabel="series"
      />

      <ProfileMediaGrid
        items={cardItems}
        isLoading={loading}
        emptyTitle="No series found"
        emptyDescription="No series match your selected filters. Try changing or clearing your filters."
      />
    </div>
  );
}
