"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ProfileFavoriteSlots, { FavoriteSlotItem } from "@/components/profile/ProfileFavoriteSlots";

export default function ProfileGeneralPage() {
  const [favoriteMovies, setFavoriteMovies] = useState<FavoriteSlotItem[]>([]);
  const [favoriteSeries, setFavoriteSeries] = useState<FavoriteSlotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;

    async function fetchFavorites() {
      try {
        setLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) return;

        const [moviesRes, seriesRes] = await Promise.all([
          supabase
            .from("user_movies")
            .select("id, movie_id, rating, custom_poster_path, movies(id, title, poster_path)")
            .eq("user_id", session.user.id)
            .eq("is_favorite", true)
            .order("updated_at", { ascending: false })
            .limit(5),
          supabase
            .from("user_series")
            .select("id, series_id, season_number, rating, custom_poster_path, series(id, name, poster_path)")
            .eq("user_id", session.user.id)
            .eq("is_favorite", true)
            .order("updated_at", { ascending: false })
            .limit(5),
        ]);

        if (ignore) return;

        if (moviesRes.data) {
          const mappedMovies: FavoriteSlotItem[] = moviesRes.data.map((item: any) => ({
            id: item.movie_id,
            title: item.movies?.title || "Movie",
            posterPath: item.custom_poster_path || item.movies?.poster_path || null,
            href: `/movie/${item.movie_id}`,
            mediaType: "movie",
            rating: item.rating ? Number(item.rating) : null,
          }));
          setFavoriteMovies(mappedMovies);
        }

        if (seriesRes.data) {
          const mappedSeries: FavoriteSlotItem[] = seriesRes.data.map((item: any) => ({
            id: `${item.series_id}-${item.season_number}`,
            title: item.series?.name || "Series",
            posterPath: item.custom_poster_path || item.series?.poster_path || null,
            href: `/tv/${item.series_id}?season=${item.season_number}`,
            mediaType: "tv",
            rating: item.rating ? Number(item.rating) : null,
            subtitle: item.season_number > 0 ? `Season ${item.season_number}` : undefined,
          }));
          setFavoriteSeries(mappedSeries);
        }
      } catch (err) {
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchFavorites();

    return () => {
      ignore = true;
    };
  }, [supabase]);

  return (
    <div className="space-y-10">
      <ProfileFavoriteSlots
        title="Favorite movies"
        items={favoriteMovies}
        viewAllHref="/profile/movies"
        isLoading={loading}
      />

      <ProfileFavoriteSlots
        title="Favorite series"
        items={favoriteSeries}
        viewAllHref="/profile/series"
        isLoading={loading}
      />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Recent activity
          </h2>
        </div>
      </section>
    </div>
  );
}
