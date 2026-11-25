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
import type { GameStatus } from "@/lib/media-utils";

interface UserGameEntry {
  id: string;
  game_id: number;
  status: GameStatus;
  is_favorite: boolean;
  rating: number | null;
  review: string | null;
  has_spoilers: boolean;
  custom_poster_path: string | null;
  custom_backdrop_path: string | null;
  hours_played: number;
  platform: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  games: {
    id: number;
    name: string;
    cover_url: string | null;
    backdrop_url: string | null;
    summary: string | null;
  } | null;
}

const STATUS_OPTIONS: Option[] = [
  { id: "all", label: "All status" },
  {
    id: "playing",
    label: "Playing",
    icon: <PlayCircle className="w-3.5 h-3.5 text-[#a8dadc]" />,
  },
  {
    id: "completed",
    label: "Completed",
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
    id: "backlog",
    label: "Backlog",
    icon: <Bookmark className="w-3.5 h-3.5 text-[#a8dadc] fill-[#a8dadc]" />,
  },
];

const SORT_OPTIONS: Option[] = [
  { id: "recent", label: "Recently added" },
  { id: "rating_desc", label: "Highest rating" },
  { id: "rating_asc", label: "Lowest rating" },
  { id: "title_asc", label: "Title (A-Z)" },
  { id: "title_desc", label: "Title (Z-A)" },
];

function ProfileGamesContent() {
  const searchParams = useSearchParams();
  const currentSubTab = searchParams.get("tab") || "overview";
  const { profileUser, isLoadingProfile } = useProfile();

  const [gamesList, setGamesList] = useState<UserGameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const supabase = createClient();

  useEffect(() => {
    setStatusFilter("all");
    setSortBy("recent");
  }, [currentSubTab, profileUser?.id]);

  useEffect(() => {
    return () => {
      setStatusFilter("all");
      setSortBy("recent");
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function fetchUserGames() {
      if (isLoadingProfile) return;

      if (!profileUser?.id) {
        setGamesList([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data } = await supabase
          .from("user_games")
          .select(`
            id,
            game_id,
            status,
            is_favorite,
            rating,
            review,
            has_spoilers,
            custom_poster_path,
            custom_backdrop_path,
            hours_played,
            platform,
            start_date,
            end_date,
            created_at,
            updated_at,
            games (
              id,
              name,
              cover_url,
              backdrop_url,
              summary
            )
          `)
          .eq("user_id", profileUser.id)
          .order("updated_at", { ascending: false });

        if (ignore) return;

        if (data) {
          setGamesList(data as unknown as UserGameEntry[]);
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

    fetchUserGames();

    return () => {
      ignore = true;
    };
  }, [profileUser?.id, isLoadingProfile, supabase]);

  const favoriteItems = useMemo<FavoriteMediaItem[]>(() => {
    return gamesList
      .filter((g) => g.is_favorite)
      .slice(0, 5)
      .map((g) => ({
        id: g.game_id,
        title: g.games?.name || "Game",
        posterPath: g.custom_poster_path || g.games?.cover_url || null,
        href: `/game/${g.game_id}`,
        mediaType: "game",
      }));
  }, [gamesList]);

  const filteredGames = useMemo(() => {
    let result = [...gamesList];

    if (statusFilter !== "all") {
      result = result.filter((g) => g.status === statusFilter);
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
          (a.games?.name || "").localeCompare(b.games?.name || "")
        );
        break;
      case "title_desc":
        result.sort((a, b) =>
          (b.games?.name || "").localeCompare(a.games?.name || "")
        );
        break;
    }

    return result;
  }, [gamesList, statusFilter, sortBy]);

  const catalogItems = useMemo<ProfileMediaItem[]>(() => {
    return filteredGames.map((g) => ({
      id: g.game_id,
      entryLogId: g.id,
      title: g.games?.name || "Game",
      posterPath: g.custom_poster_path || g.games?.cover_url || null,
      href: `/game/${g.game_id}`,
      mediaType: "game",
      rating: g.rating ? Number(g.rating) : null,
      review: g.review,
      hasSpoilers: Boolean(g.has_spoilers),
    }));
  }, [filteredGames]);

  const isEffectiveLoading = loading || isLoadingProfile;

  if (currentSubTab === "overview") {
    return (
      <ProfileOverviewTab
        title="Favorite games"
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
      emptyTitle="No games found"
      emptyDescription="No games match your selected filters. Try changing or clearing your filters."
    />
  );
}

export default function ProfileGamesPage() {
  return (
    <Suspense fallback={<div className="min-h-[300px]" />}>
      <ProfileGamesContent />
    </Suspense>
  );
}
