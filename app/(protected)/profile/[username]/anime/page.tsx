"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, Bookmark, PlayCircle, PauseCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Option } from "@/components/ui/Select";
import { useProfile } from "@/components/profile/ProfileContext";
import ProfileOverviewTab, {
  FavoriteMediaItem,
} from "@/components/profile/ProfileOverviewTab";
import ProfileMediaTab, {
  ProfileMediaItem,
} from "@/components/profile/ProfileMediaTab";

interface UserAnimeEntry {
  id: string;
  anime_id: number;
  status: "watching" | "watched" | "paused" | "dropped" | "watchlist";
  is_favorite: boolean;
  rating: number | null;
  review: string | null;
  has_spoilers: boolean;
  custom_poster_path: string | null;
  custom_backdrop_path: string | null;
  last_watched_episode: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  animes: {
    id: number;
    title: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string | null;
    episodes?: number;
  } | null;
}

const STATUS_OPTIONS: Option[] = [
  { id: "all", label: "All status" },
  {
    id: "watching",
    label: "Watching",
    icon: <PlayCircle className="w-3.5 h-3.5 text-[#a8dadc]" />,
  },
  {
    id: "watched",
    label: "Watched",
    icon: <Eye className="w-3.5 h-3.5 text-[#a8dadc]" />,
  },
  {
    id: "paused",
    label: "Paused",
    icon: <PauseCircle className="w-3.5 h-3.5 text-amber-400" />,
  },
  {
    id: "dropped",
    label: "Dropped",
    icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
  },
  {
    id: "watchlist",
    label: "Watchlist",
    icon: (
      <Bookmark className="w-3.5 h-3.5 text-[#a8dadc] fill-[#a8dadc]" />
    ),
  },
];

const SORT_OPTIONS: Option[] = [
  { id: "recent", label: "Recently added" },
  { id: "rating_desc", label: "Highest rating" },
  { id: "rating_asc", label: "Lowest rating" },
  { id: "title_asc", label: "Title (A-Z)" },
  { id: "title_desc", label: "Title (Z-A)" },
];

function ProfileAnimeContent() {
  const searchParams = useSearchParams();
  const currentSubTab = searchParams.get("tab") || "overview";
  const { profileUser, isLoadingProfile } = useProfile();

  const [animeList, setAnimeList] = useState<UserAnimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;

    async function fetchUserAnime() {
      if (isLoadingProfile) return;

      if (!profileUser?.id) {
        setAnimeList([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data } = await supabase
          .from("user_animes")
          .select(`
            id,
            anime_id,
            status,
            is_favorite,
            rating,
            review,
            has_spoilers,
            custom_poster_path,
            custom_backdrop_path,
            last_watched_episode,
            start_date,
            end_date,
            created_at,
            updated_at,
            animes (
              id,
              title,
              poster_path,
              backdrop_path,
              overview,
              episodes
            )
          `)
          .eq("user_id", profileUser.id)
          .order("updated_at", { ascending: false });

        if (ignore) return;

        if (data) {
          setAnimeList(data as unknown as UserAnimeEntry[]);
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

    fetchUserAnime();

    return () => {
      ignore = true;
    };
  }, [supabase, profileUser?.id, isLoadingProfile]);

  const favoriteItems = useMemo<FavoriteMediaItem[]>(() => {
    return animeList
      .filter((a) => a.is_favorite)
      .slice(0, 5)
      .map((a) => {
        const rawTitle = a.animes?.title as any;
        const titleStr =
          typeof rawTitle === "object" && rawTitle !== null
            ? rawTitle.english || rawTitle.romaji || rawTitle.native || "Anime"
            : String(rawTitle || "Anime");
        return {
          id: a.anime_id,
          title: titleStr,
          posterPath: a.custom_poster_path || a.animes?.poster_path || null,
          href: `/anime/${a.anime_id}`,
          mediaType: "anime",
        };
      });
  }, [animeList]);

  const filteredAnime = useMemo(() => {
    let result = [...animeList];

    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
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
          (a.animes?.title || "").localeCompare(b.animes?.title || "")
        );
        break;
      case "title_desc":
        result.sort((a, b) =>
          (b.animes?.title || "").localeCompare(a.animes?.title || "")
        );
        break;
    }

    return result;
  }, [animeList, statusFilter, sortBy]);

  const catalogItems = useMemo<ProfileMediaItem[]>(() => {
    return filteredAnime.map((a) => {
      const rawTitle = a.animes?.title as any;
      const titleStr =
        typeof rawTitle === "object" && rawTitle !== null
          ? rawTitle.english || rawTitle.romaji || rawTitle.native || "Anime"
          : String(rawTitle || "Anime");
      return {
        id: a.anime_id,
        entryLogId: a.id,
        title: titleStr,
        posterPath: a.custom_poster_path || a.animes?.poster_path || null,
        href: `/anime/${a.anime_id}`,
        mediaType: "anime",
        rating: a.rating ? Number(a.rating) : null,
        review: a.review,
        hasSpoilers: Boolean(a.has_spoilers),
      };
    });
  }, [filteredAnime]);

  const isEffectiveLoading = loading || isLoadingProfile;

  if (currentSubTab === "overview") {
    return (
      <ProfileOverviewTab
        title="Favorite anime"
        items={favoriteItems}
        isLoading={isEffectiveLoading}
      />
    );
  }

  return (
    <ProfileMediaTab
      items={catalogItems}
      statusValue={statusFilter}
      onStatusChange={setStatusFilter}
      statusOptions={STATUS_OPTIONS}
      sortValue={sortBy}
      onSortChange={setSortBy}
      sortOptions={SORT_OPTIONS}
      isLoading={isEffectiveLoading}
      emptyTitle="No anime found"
      emptyDescription="No anime match your selected filters. Try changing or clearing your filters."
    />
  );
}

export default function ProfileAnimePage() {
  return (
    <Suspense fallback={<div className="min-h-[300px]" />}>
      <ProfileAnimeContent />
    </Suspense>
  );
}
