"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/profile/ProfileContext";
import ProfileListsTab, {
  ProfileListCard,
  ProfileListPreviewItem,
} from "@/components/profile/ProfileListsTab";
import CreateListModal, {
  CreatedOrUpdatedList,
} from "@/components/modules/modals/CreateListModal";
import { fetchCachedMediaMap, RawListItemRef } from "@/lib/lists";

interface RawListRow {
  id: string;
  title: string;
  description: string | null;
  is_private: boolean;
  updated_at: string;
  list_items: {
    id: string;
    media_type: string;
    media_id: number;
    position: number;
    custom_poster_path: string | null;
    created_at: string;
  }[];
}

export default function ProfileListsPage() {
  const { profileUser, isOwner, isLoadingProfile } = useProfile();
  const [lists, setLists] = useState<ProfileListCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;

    async function loadLists() {
      if (isLoadingProfile) return;

      if (!profileUser?.id) {
        setLists([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data } = await supabase
          .from("lists")
          .select(`
            id,
            title,
            description,
            is_private,
            updated_at,
            list_items (
              id,
              media_type,
              media_id,
              position,
              custom_poster_path,
              created_at
            )
          `)
          .eq("user_id", profileUser.id)
          .order("updated_at", { ascending: false });

        if (ignore) return;

        const rawLists = (data || []) as unknown as RawListRow[];
        const sortedItemsByList = new Map<string, RawListRow["list_items"]>();
        const previewRefs: RawListItemRef[] = [];

        for (const list of rawLists) {
          const sorted = [...(list.list_items || [])].sort((a, b) => {
            if (a.position !== b.position) return a.position - b.position;
            return (
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
          sortedItemsByList.set(list.id, sorted);
          for (const item of sorted.slice(0, 5)) {
            previewRefs.push({
              media_type: item.media_type,
              media_id: item.media_id,
            });
          }
        }

        const mediaMap = await fetchCachedMediaMap(supabase, previewRefs);
        if (ignore) return;

        const formatted: ProfileListCard[] = rawLists.map((list) => {
          const allItems = sortedItemsByList.get(list.id) || [];
          const previewItems: ProfileListPreviewItem[] = allItems
            .slice(0, 5)
            .map((item) => {
              const cached = mediaMap.get(`${item.media_type}-${item.media_id}`);
              return {
                id: item.id,
                mediaType: item.media_type,
                mediaId: item.media_id,
                title: cached?.title || "Media",
                posterPath: item.custom_poster_path || cached?.posterPath || null,
              };
            });

          return {
            id: list.id,
            title: list.title,
            description: list.description,
            isPrivate: list.is_private,
            itemCount: allItems.length,
            updatedAt: list.updated_at,
            previewItems,
          };
        });

        setLists(formatted);
      } catch {
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadLists();

    return () => {
      ignore = true;
    };
  }, [supabase, profileUser?.id, isLoadingProfile]);

  const handleListCreated = (newList: CreatedOrUpdatedList) => {
    setLists((prev) => [
      {
        id: newList.id,
        title: newList.title,
        description: newList.description,
        isPrivate: newList.is_private,
        itemCount: 0,
        updatedAt: newList.updated_at,
        previewItems: [],
      },
      ...prev,
    ]);
  };

  return (
    <>
      <ProfileListsTab
        lists={lists}
        isOwner={isOwner}
        isLoading={loading || isLoadingProfile}
        onCreateList={isOwner ? () => setIsCreateModalOpen(true) : undefined}
      />

      {isOwner && (
        <CreateListModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSaved={handleListCreated}
        />
      )}
    </>
  );
}
