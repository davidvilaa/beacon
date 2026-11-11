"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Pencil,
  Trash2,
  X,
  UserCircle,
  ArrowLeft,
  Film,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Loading from "@/components/ui/Loading";
import MediaCard from "@/components/ui/MediaCard";
import { useToast } from "@/components/ui/Toast";
import CreateListModal, {
  CreatedOrUpdatedList,
} from "@/components/modules/modals/CreateListModal";
import { fetchCachedMediaMap } from "@/lib/lists";

interface ListOwner {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface ListDetailRecord {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  owner: ListOwner | null;
}

interface ListGridItem {
  id: string;
  mediaType: "movie" | "tv" | "anime" | "game";
  mediaId: number;
  title: string;
  posterPath: string | null;
}

function ListDetailContent() {
  const params = useParams<{ id: string }>();
  const listId = params?.id || "";
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToast();

  const [list, setList] = useState<ListDetailRecord | null>(null);
  const [items, setItems] = useState<ListGridItem[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadListDetail() {
      if (!listId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [{ data: sessionData }, { data: listData, error }] =
          await Promise.all([
            supabase.auth.getSession(),
            supabase
              .from("lists")
              .select(`
                id,
                user_id,
                title,
                description,
                is_private,
                created_at,
                updated_at,
                users (
                  id,
                  username,
                  avatar_url
                ),
                list_items (
                  id,
                  media_type,
                  media_id,
                  position,
                  created_at
                )
              `)
              .eq("id", listId)
              .maybeSingle(),
          ]);

        if (ignore) return;

        if (error || !listData) {
          setList(null);
          setItems([]);
          setLoading(false);
          return;
        }

        const rawOwner = Array.isArray((listData as any).users)
          ? (listData as any).users[0]
          : (listData as any).users;

        const sortedRawItems = [...((listData as any).list_items || [])].sort(
          (a: any, b: any) => {
            if (a.position !== b.position) return a.position - b.position;
            return (
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          }
        );

        const mediaMap = await fetchCachedMediaMap(supabase, sortedRawItems);
        if (ignore) return;

        const mappedItems: ListGridItem[] = sortedRawItems.map((item: any) => {
          const cached = mediaMap.get(`${item.media_type}-${item.media_id}`);
          return {
            id: item.id,
            mediaType: item.media_type,
            mediaId: item.media_id,
            title: cached?.title || "Media",
            posterPath: cached?.posterPath || null,
          };
        });

        setList({
          id: listData.id,
          user_id: listData.user_id,
          title: listData.title,
          description: listData.description,
          is_private: listData.is_private,
          created_at: listData.created_at,
          updated_at: listData.updated_at,
          owner: rawOwner || null,
        });
        setItems(mappedItems);
        setIsOwner(
          Boolean(
            sessionData?.session?.user?.id &&
              listData.user_id === sessionData.session.user.id
          )
        );
      } catch {
        if (!ignore) {
          setList(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadListDetail();

    return () => {
      ignore = true;
    };
  }, [listId, supabase]);

  const handleListUpdated = (updated: CreatedOrUpdatedList) => {
    setList((prev) =>
      prev
        ? {
            ...prev,
            title: updated.title,
            description: updated.description,
            is_private: updated.is_private,
            updated_at: updated.updated_at,
          }
        : prev
    );
  };

  const handleDeleteList = async () => {
    if (!list || !isOwner) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from("lists")
        .delete()
        .eq("id", list.id)
        .eq("user_id", list.user_id);

      if (error) {
        addToast("Error deleting list", "error");
        return;
      }

      addToast("List deleted", "info");
      if (list.owner?.username) {
        router.push(`/profile/${encodeURIComponent(list.owner.username)}/lists`);
      } else {
        router.push("/profile");
      }
    } catch {
      addToast("Something went wrong", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!list || !isOwner) return;

    try {
      const { error } = await supabase
        .from("list_items")
        .delete()
        .eq("id", itemId)
        .eq("list_id", list.id);

      if (error) {
        addToast("Error removing item", "error");
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== itemId));
      addToast("Removed from list", "info");
    } catch {
      addToast("Error removing item", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-24 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center font-[family-name:var(--font-geist-sans)]">
        <Lock className="w-12 h-12 text-zinc-700 mb-3 stroke-[1.5]" />
        <h1 className="text-xl font-bold text-zinc-200 mb-1">
          List not found
        </h1>
        <p className="text-sm text-zinc-500 mb-6 max-w-sm">
          This list does not exist or is set to private.
        </p>
        <Link
          href="/profile"
          className="text-xs font-semibold text-[#a8dadc] hover:underline"
        >
          Back to profile
        </Link>
      </div>
    );
  }

  const ownerListsHref = list.owner?.username
    ? `/profile/${encodeURIComponent(list.owner.username)}/lists`
    : "/profile";

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 font-[family-name:var(--font-geist-sans)]">
      <div className="mb-6">
        <Link
          href={ownerListsHref}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-[#a8dadc] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to lists</span>
        </Link>
      </div>

      <div className="pb-6 mb-8 border-b border-zinc-800/70 flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div className="space-y-2.5 min-w-0">
          {list.owner && (
            <Link
              href={`/profile/${encodeURIComponent(list.owner.username)}`}
              className="inline-flex items-center gap-2 group"
            >
              {list.owner.avatar_url ? (
                <img
                  src={list.owner.avatar_url}
                  alt={list.owner.username}
                  className="w-6 h-6 rounded-full object-cover border border-zinc-800"
                />
              ) : (
                <UserCircle className="w-6 h-6 text-zinc-600" />
              )}
              <span className="text-xs font-semibold text-zinc-400 group-hover:text-[#a8dadc] transition-colors">
                {list.owner.username}
              </span>
            </Link>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-4xl font-black text-zinc-100 tracking-tight">
              {list.title}
            </h1>
            {list.is_private && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/80 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <Lock className="w-3 h-3" />
                <span>Private</span>
              </span>
            )}
          </div>

          {list.description && (
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl whitespace-pre-wrap">
              {list.description}
            </p>
          )}

          <p className="text-xs font-semibold text-zinc-500">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-[#a8dadc]/60 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            {isConfirmingDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDeleteList}
                  disabled={isDeleting}
                  className="px-3 py-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Confirm delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  disabled={isDeleting}
                  className="px-2.5 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-rose-500/50 text-xs font-semibold text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-20 rounded-xl border border-zinc-800/40 bg-zinc-900/10 flex flex-col items-center justify-center text-center p-6 min-h-[260px]">
          <Film className="w-10 h-10 text-zinc-700 mb-3 stroke-[1.5]" />
          <h4 className="text-sm font-bold text-zinc-300 mb-1">
            This list is empty
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
            {isOwner
              ? "Open any movie or series page and add it from the quick actions menu."
              : "No items have been added to this list yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5 sm:gap-3">
          {items.map((item) => (
            <div key={item.id} className="relative group/card">
              <MediaCard
                id={item.mediaId}
                mediaType={item.mediaType}
                title={item.title}
                posterPath={item.posterPath}
                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 16vw, 125px"
              />

              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  title="Remove from list"
                  aria-label="Remove from list"
                  className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full bg-black/80 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-rose-400 hover:border-rose-500/60 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isOwner && (
        <CreateListModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSaved={handleListUpdated}
          listToEdit={{
            id: list.id,
            title: list.title,
            description: list.description,
            is_private: list.is_private,
          }}
        />
      )}
    </div>
  );
}

export default function ListDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-24 flex items-center justify-center">
          <Loading />
        </div>
      }
    >
      <ListDetailContent />
    </Suspense>
  );
}
