"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, Bookmark, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Option } from "@/components/ui/Select";
import ProfileFilterBar from "@/components/profile/ProfileFilterBar";
import ProfileMediaGrid from "@/components/profile/ProfileMediaGrid";
import ProfileFavoriteSlots, { FavoriteSlotItem } from "@/components/profile/ProfileFavoriteSlots";
import { ProfileMediaCardProps } from "@/components/profile/ProfileMediaCard";

interface UserMovieEntry {
  id: string;
  movie_id: number;
  status: "watched" | "watchlist";
  is_favorite: boolean;
  rating: number | null;
  review: string | null;
  has_spoilers: boolean;
  custom_poster_path: string | null;
  custom_backdrop_path: string | null;
  watched_date: string | null;
  created_at: string;
  updated_at: string;
  movies: {
    id: number;
    title: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string | null;
  } | null;
}

const STATUS_OPTIONS: Option[] = [
  { id: "all", label: "All status" },
  { id: "watched", label: "Watched", icon: <Eye className="w-3.5 h-3.5 text-[#a8dadc]" /> },
  { id: "watchlist", label: "Watchlist", icon: <Bookmark className="w-3.5 h-3.5 text-[#a8dadc] fill-[#a8dadc]" /> },
];

const FAVORITE_OPTIONS: Option[] = [
  { id: "all", label: "All movies" },
  { id: "favorites", label: "Favorites only", icon: <Heart className="w-3.5 h-3.5 text-[#a8dadc] fill-[#a8dadc]" /> },
];

const SORT_OPTIONS: Option[] = [
  { id: "recent", label: "Recently added" },
  { id: "rating_desc", label: "Highest rating" },
  { id: "rating_asc", label: "Lowest rating" },
  { id: "title_asc", label: "Title (A-Z)" },
  { id: "title_desc", label: "Title (Z-A)" },
];

function ProfileMoviesContent() {
  const searchParams = useSearchParams();
  const currentSubTab = searchParams.get("tab") || "overview";

  const [movies, setMovies] = useState<UserMovieEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [favoriteFilter, setFavoriteFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;

    async function fetchUserMovies() {
      try {
        setLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) return;

        const { data } = await supabase
          .from("user_movies")
          .select(`
            id,
            movie_id,
            status,
            is_favorite,
            rating,
            review,
            has_spoilers,
            custom_poster_path,
            custom_backdrop_path,
            watched_date,
            created_at,
            updated_at,
            movies (
              id,
              title,
              poster_path,
              backdrop_path,
              overview
            )
          `)
          .eq("user_id", session.user.id)
          .order("updated_at", { ascending: false });

        if (ignore) return;

        if (data) {
          setMovies(data as unknown as UserMovieEntry[]);
        }
      } catch (err) {
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchUserMovies();

    return () => {
      ignore = true;
    };
  }, [supabase]);

  const favoriteItems = useMemo<FavoriteSlotItem[]>(() => {
    return movies
      .filter((m) => m.is_favorite)
      .slice(0, 5)
      .map((m) => ({
        id: m.movie_id,
        title: m.movies?.title || "Movie",
        posterPath: m.custom_poster_path || m.movies?.poster_path || null,
        href: `/movie/${m.movie_id}`,
        mediaType: "movie",
        rating: m.rating ? Number(m.rating) : null,
      }));
  }, [movies]);

  const filteredMovies = useMemo(() => {
    let result = [...movies];

    if (statusFilter !== "all") {
      result = result.filter((m) => m.status === statusFilter);
    }

    if (favoriteFilter === "favorites") {
      result = result.filter((m) => m.is_favorite);
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
      case "title_asc":
        result.sort((a, b) =>
          (a.movies?.title || "").localeCompare(b.movies?.title || "")
        );
        break;
      case "title_desc":
        result.sort((a, b) =>
          (b.movies?.title || "").localeCompare(a.movies?.title || "")
        );
        break;
    }

    return result;
  }, [movies, statusFilter, favoriteFilter, sortBy]);

  const cardItems = useMemo<ProfileMediaCardProps[]>(() => {
    return filteredMovies.map((m) => ({
      id: m.movie_id,
      title: m.movies?.title || "Movie",
      posterPath: m.custom_poster_path || m.movies?.poster_path || null,
      href: `/movie/${m.movie_id}`,
      mediaType: "movie",
      rating: m.rating ? Number(m.rating) : null,
      status: m.status,
      isFavorite: m.is_favorite,
    }));
  }, [filteredMovies]);

  if (currentSubTab === "overview") {
    return (
      <div className="space-y-8">
        <ProfileFavoriteSlots
          title="Favorite movies"
          items={favoriteItems}
          viewAllHref="/profile/movies?tab=movies"
          isLoading={loading}
        />
      </div>
    );
  }

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
        totalCount={filteredMovies.length}
        itemLabel="movie"
      />

      <ProfileMediaGrid
        items={cardItems}
        isLoading={loading}
        emptyTitle="No movies found"
        emptyDescription="No movies match your selected filters. Try changing or clearing your filters."
      />
    </div>
  );
}

export default function ProfileMoviesPage() {
  return (
    <Suspense fallback={<div className="min-h-[300px]" />}>
      <ProfileMoviesContent />
    </Suspense>
  );
}
