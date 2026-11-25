"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bookmark, Eye, PauseCircle, PlayCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Option } from "@/components/ui/Select";
import { useProfile } from "@/components/profile/ProfileContext";
import ProfileOverviewTab from "@/components/profile/ProfileOverviewTab";
import ProfileMediaTab from "@/components/profile/ProfileMediaTab";
import { LOG_CONFIG, type LogMediaType, type LogStatus } from "@/lib/media/log";
import {
  PROFILE_MEDIA_CONFIG,
  PROFILE_PAGE_SIZE,
  PROFILE_SORTS,
  profileSelect,
  rowToCard,
  statusFilterOptions,
  type ProfileCardItem,
  type ProfileLogRow,
  type ProfileSort,
} from "@/lib/profile/media";

const STATUS_ICONS: Record<LogStatus, React.ReactNode> = {
  watching: <PlayCircle className="w-3.5 h-3.5 text-accent" />,
  watched: <Eye className="w-3.5 h-3.5 text-accent" />,
  paused: <PauseCircle className="w-3.5 h-3.5 text-amber-400" />,
  dropped: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
  watchlist: <Bookmark className="w-3.5 h-3.5 text-accent fill-accent" />,
};

const SORT_OPTIONS: Option[] = PROFILE_SORTS.map(({ id, label }) => ({ id, label }));

interface ListState {
  key: string;
  items: ProfileCardItem[];
  loaded: boolean;
  hasMore: boolean;
  loadingMore: boolean;
}

const emptyState = (key: string): ListState => ({
  key,
  items: [],
  loaded: false,
  hasMore: false,
  loadingMore: false,
});

function ProfileMediaContent({ mediaType }: { mediaType: LogMediaType }) {
  const config = PROFILE_MEDIA_CONFIG[mediaType];
  const logConfig = LOG_CONFIG[mediaType];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { profileUser, isLoadingProfile } = useProfile();
  const supabase = useMemo(() => createClient(), []);

  const isOverview = (searchParams.get("tab") || "overview") === "overview";
  const filterOptions = useMemo(() => statusFilterOptions(mediaType), [mediaType]);
  const statusParam = searchParams.get("status");
  const status = filterOptions.some((o) => o.id === statusParam) ? (statusParam as string) : "all";
  const sortParam = searchParams.get("sort");
  const sort: ProfileSort = PROFILE_SORTS.some((s) => s.id === sortParam)
    ? (sortParam as ProfileSort)
    : "recent";

  const userId = profileUser?.id ?? null;
  const queryKey = `${mediaType}|${userId}|${isOverview ? "overview" : `${status}|${sort}`}`;

  const [state, setState] = useState<ListState>(() => emptyState(queryKey));
  const loadingMoreRef = useRef(false);

  if (state.key !== queryKey) {
    setState(emptyState(queryKey));
  }

  const fetchRows = useCallback(
    async (offset: number): Promise<ProfileLogRow[]> => {
      if (!userId) return [];
      const base = supabase
        .from(logConfig.table)
        .select(profileSelect(mediaType))
        .eq("user_id", userId);

      if (isOverview) {
        const { data } = await base
          .eq("is_favorite", true)
          .order("updated_at", { ascending: false })
          .limit(5);
        return (data || []) as unknown as ProfileLogRow[];
      }

      const filtered = status === "all" ? base : base.eq("status", status);
      const titleOrder = `${config.relation}(${config.titleColumn})`;
      const ordered =
        sort === "rating_desc"
          ? filtered.order("rating", { ascending: false, nullsFirst: false }).order("updated_at", { ascending: false })
          : sort === "rating_asc"
          ? filtered.order("rating", { ascending: true, nullsFirst: false }).order("updated_at", { ascending: false })
          : sort === "title_asc"
          ? filtered.order(titleOrder, { ascending: true })
          : sort === "title_desc"
          ? filtered.order(titleOrder, { ascending: false })
          : filtered.order("updated_at", { ascending: false });

      const { data } = await ordered
        .order("id", { ascending: true })
        .range(offset, offset + PROFILE_PAGE_SIZE - 1);
      return (data || []) as unknown as ProfileLogRow[];
    },
    [userId, supabase, logConfig.table, mediaType, isOverview, status, sort, config.relation, config.titleColumn]
  );

  useEffect(() => {
    if (!userId || state.loaded || state.key !== queryKey) return;
    let ignore = false;
    fetchRows(0)
      .catch(() => [] as ProfileLogRow[])
      .then((rows) => {
        if (ignore) return;
        setState((prev) =>
          prev.key === queryKey
            ? {
                ...prev,
                items: rows.map((row) => rowToCard(mediaType, row)),
                loaded: true,
                hasMore: !isOverview && rows.length === PROFILE_PAGE_SIZE,
              }
            : prev
        );
      });
    return () => {
      ignore = true;
    };
  }, [userId, state.loaded, state.key, queryKey, fetchRows, mediaType, isOverview]);

  const loadMore = useCallback(() => {
    if (!state.hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    const key = state.key;
    setState((prev) => (prev.key === key ? { ...prev, loadingMore: true } : prev));
    fetchRows(state.items.length)
      .catch(() => [] as ProfileLogRow[])
      .then((rows) => {
        loadingMoreRef.current = false;
        setState((prev) => {
          if (prev.key !== key) return prev;
          const seen = new Set(prev.items.map((item) => item.key));
          const next = rows.map((row) => rowToCard(mediaType, row)).filter((item) => !seen.has(item.key));
          return {
            ...prev,
            items: [...prev.items, ...next],
            hasMore: rows.length === PROFILE_PAGE_SIZE,
            loadingMore: false,
          };
        });
      });
  }, [state.hasMore, state.key, state.items.length, fetchRows, mediaType]);

  const updateParam = (name: "status" | "sort", value: string, defaultValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === defaultValue) params.delete(name);
    else params.set(name, value);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const statusOptions = useMemo<Option[]>(
    () => [
      { id: "all", label: "All status" },
      ...filterOptions.map((o) => ({ id: o.id, label: o.label, icon: STATUS_ICONS[o.status] })),
    ],
    [filterOptions]
  );

  const isLoading = isLoadingProfile || (Boolean(userId) && !state.loaded);

  if (isOverview) {
    return (
      <ProfileOverviewTab
        title={config.favoritesTitle}
        items={state.items.map((item) => ({
          id: item.key,
          title: item.title,
          posterPath: item.posterPath,
          href: item.href,
          mediaType,
        }))}
        isLoading={isLoading}
      />
    );
  }

  return (
    <ProfileMediaTab
      items={state.items.map((item) => ({
        id: item.key,
        entryLogId: item.entryLogId,
        reviewHref: profileUser
          ? `/profile/${encodeURIComponent(profileUser.username)}/reviews/${mediaType}/${item.entryLogId}`
          : undefined,
        title: item.title,
        posterPath: item.posterPath,
        href: item.href,
        mediaType,
        rating: item.rating,
        review: item.review,
        hasSpoilers: item.hasSpoilers,
        seasonNumber: item.seasonNumber,
      }))}
      statusValue={status}
      onStatusChange={(value) => updateParam("status", value, "all")}
      statusOptions={statusOptions}
      sortValue={sort}
      onSortChange={(value) => updateParam("sort", value, "recent")}
      sortOptions={SORT_OPTIONS}
      isLoading={isLoading}
      emptyTitle={config.emptyTitle}
      emptyDescription={config.emptyDescription}
      hasMore={state.hasMore}
      isLoadingMore={state.loadingMore}
      onLoadMore={loadMore}
    />
  );
}

export default function ProfileMediaPage({ mediaType }: { mediaType: LogMediaType }) {
  return (
    <Suspense fallback={<div className="min-h-[300px]" />}>
      <ProfileMediaContent mediaType={mediaType} />
    </Suspense>
  );
}
