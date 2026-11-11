"use client";

import { useState, useEffect } from "react";
import { X, Plus, Lock, Check, ListPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Loading from "@/components/ui/Loading";
import { useToast } from "@/components/ui/Toast";
import CreateListModal, { CreatedOrUpdatedList } from "./CreateListModal";

export interface ListMediaPayload {
  mediaType: "movie" | "tv";
  mediaId: number;
  title: string;
  overview?: string | null;
  posterPath?: string | null;
  backdropPath?: string | null;
  customPosterPath?: string | null;
  customBackdropPath?: string | null;
  numberOfSeasons?: number | null;
  numberOfEpisodes?: number | null;
}

interface UserListSummary {
  id: string;
  title: string;
  is_private: boolean;
  updated_at: string;
  itemCount: number;
}

interface ListModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: ListMediaPayload;
}

export default function ListModal({
  isOpen,
  onClose,
  media,
}: ListModalProps) {
  const [lists, setLists] = useState<UserListSummary[]>([]);
  const [initialSelectedIds, setInitialSelectedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;

    const loadUserLists = async () => {
      try {
        setIsLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          addToast("Please log in to manage lists", "error");
          onClose();
          return;
        }

        const [{ data: listsData, error: listsError }, { data: membershipData }] =
          await Promise.all([
            supabase
              .from("lists")
              .select("id, title, is_private, updated_at, list_items(count)")
              .eq("user_id", session.user.id)
              .order("updated_at", { ascending: false }),
            supabase
              .from("list_items")
              .select("list_id")
              .eq("media_type", media.mediaType)
              .eq("media_id", media.mediaId),
          ]);

        if (ignore) return;

        if (listsError) {
          addToast("Error loading your lists", "error");
          setLists([]);
          return;
        }

        const formattedLists: UserListSummary[] = (listsData || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          is_private: Boolean(row.is_private),
          updated_at: row.updated_at,
          itemCount: row.list_items?.[0]?.count ?? 0,
        }));

        const ownedIds = new Set(formattedLists.map((l) => l.id));
        const activeIds = new Set<string>(
          (membershipData || [])
            .map((m: { list_id: string }) => m.list_id)
            .filter((id: string) => ownedIds.has(id))
        );

        setLists(formattedLists);
        setInitialSelectedIds(activeIds);
        setSelectedIds(new Set(activeIds));
      } catch {
        if (!ignore) {
          addToast("Error loading your lists", "error");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadUserLists();

    return () => {
      ignore = true;
    };
  }, [isOpen, media.mediaType, media.mediaId, supabase, addToast, onClose]);

  if (!isOpen) return null;

  const toggleList = (listId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(listId)) {
        next.delete(listId);
      } else {
        next.add(listId);
      }
      return next;
    });
  };

  const handleListCreated = (newList: CreatedOrUpdatedList) => {
    setLists((prev) => [
      {
        id: newList.id,
        title: newList.title,
        is_private: newList.is_private,
        updated_at: newList.updated_at,
        itemCount: 0,
      },
      ...prev,
    ]);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.add(newList.id);
      return next;
    });
  };

  const handleSave = async () => {
    const toAdd = Array.from(selectedIds).filter((id) => !initialSelectedIds.has(id));
    const toRemove = Array.from(initialSelectedIds).filter((id) => !selectedIds.has(id));

    if (toAdd.length === 0 && toRemove.length === 0) {
      onClose();
      return;
    }

    try {
      setIsSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        addToast("Please log in to manage lists", "error");
        return;
      }

      if (toAdd.length > 0) {
        if (media.mediaType === "movie") {
          const { error: cacheError } = await supabase.from("movies").upsert({
            id: media.mediaId,
            title: media.title,
            overview: media.overview ?? null,
            poster_path: media.posterPath ?? null,
            backdrop_path: media.backdropPath ?? null,
          });
          if (cacheError) {
            addToast("Error saving movie metadata", "error");
            return;
          }
        } else {
          const { error: cacheError } = await supabase.from("series").upsert({
            id: media.mediaId,
            name: media.title,
            overview: media.overview ?? null,
            poster_path: media.posterPath ?? null,
            backdrop_path: media.backdropPath ?? null,
            number_of_seasons: media.numberOfSeasons ?? 0,
            number_of_episodes: media.numberOfEpisodes ?? 0,
          });
          if (cacheError) {
            addToast("Error saving series metadata", "error");
            return;
          }
        }

        const rowsToInsert = toAdd.map((listId) => {
          const foundList = lists.find((l) => l.id === listId);
          return {
            list_id: listId,
            media_type: media.mediaType,
            media_id: media.mediaId,
            position: foundList ? foundList.itemCount : 0,
            custom_poster_path: media.customPosterPath ?? null,
            custom_backdrop_path: media.customBackdropPath ?? null,
          };
        });

        const { error: insertError } = await supabase
          .from("list_items")
          .upsert(rowsToInsert, { onConflict: "list_id,media_type,media_id" });

        if (insertError) {
          addToast("Error adding item to lists", "error");
          return;
        }
      }

      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("list_items")
          .delete()
          .in("list_id", toRemove)
          .eq("media_type", media.mediaType)
          .eq("media_id", media.mediaId);

        if (deleteError) {
          addToast("Error removing item from lists", "error");
          return;
        }
      }

      const touchedListIds = [...toAdd, ...toRemove];
      await supabase
        .from("lists")
        .update({ updated_at: new Date().toISOString() })
        .in("id", touchedListIds);

      addToast("Lists updated", "success");
      onClose();
    } catch {
      addToast("Something went wrong", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
          <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                Add to list
              </h3>
              <p className="text-xs text-zinc-500 truncate mt-0.5">
                {media.title}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-zinc-900 border border-zinc-800 hover:border-[#a8dadc]/60 text-[#a8dadc] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New list</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 max-h-[55vh] overflow-y-auto">
            {isLoading ? (
              <div className="py-12 flex items-center justify-center">
                <Loading />
              </div>
            ) : lists.length === 0 ? (
              <div className="py-10 px-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 flex flex-col items-center justify-center text-center">
                <ListPlus className="w-9 h-9 text-zinc-700 mb-2.5 stroke-[1.5]" />
                <p className="text-sm font-semibold text-zinc-300 mb-1">
                  No lists yet
                </p>
                <p className="text-xs text-zinc-500 mb-4 max-w-xs">
                  Create your first list to organize movies, series, and more.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 rounded-md text-xs font-bold bg-[#a8dadc] text-zinc-950 hover:bg-[#8ec5c8] transition-colors cursor-pointer"
                >
                  Create list
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {lists.map((list) => {
                  const isChecked = selectedIds.has(list.id);
                  return (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => toggleList(list.id)}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        isChecked
                          ? "bg-zinc-900/90 border-[#a8dadc]/50"
                          : "bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-4 h-4 rounded border transition-all flex items-center justify-center shrink-0 ${
                            isChecked
                              ? "bg-[#a8dadc] border-[#a8dadc] text-zinc-950"
                              : "bg-zinc-950 border-zinc-700"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span className="text-sm font-semibold text-zinc-200 truncate">
                          {list.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-xs text-zinc-500">
                        {list.is_private && (
                          <Lock className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                        <span>
                          {list.itemCount} {list.itemCount === 1 ? "item" : "items"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-zinc-800/80 bg-zinc-950 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-md text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-5 py-2 rounded-md text-xs font-bold bg-[#a8dadc] text-zinc-950 hover:bg-[#8ec5c8] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSaved={handleListCreated}
      />
    </>
  );
}
