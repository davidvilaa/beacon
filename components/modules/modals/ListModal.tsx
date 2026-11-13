"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Plus, Lock, Check, ListPlus, Film } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Loading from "@/components/ui/Loading";
import { useToast } from "@/components/ui/Toast";
import CreateListModal, { CreatedOrUpdatedList } from "./CreateListModal";
import ArtworkPickerModal from "./ArtworkPickerModal";
import BackdropPickerModal from "./BackdropPickerModal";
import { getPosterUrl, getBackdropUrl } from "@/lib/tmdb";

export interface ListMediaPayload {
  mediaType: "movie" | "tv";
  mediaId: number;
  title: string;
  seasonNumber?: number | null;
  seasonTitle?: string | null;
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
  availablePosters?: { file_path: string }[];
  availableBackdrops?: { file_path: string }[];
  selectedPoster?: string | null;
  selectedBackdrop?: string | null;
  loadingPosters?: boolean;
  loadingBackdrops?: boolean;
}

export default function ListModal({
  isOpen,
  onClose,
  media,
  availablePosters,
  availableBackdrops,
  selectedPoster,
  selectedBackdrop,
  loadingPosters,
  loadingBackdrops,
}: ListModalProps) {
  const [lists, setLists] = useState<UserListSummary[]>([]);
  const [initialSelectedIds, setInitialSelectedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPosterPickerOpen, setIsPosterPickerOpen] = useState(false);
  const [isBackdropPickerOpen, setIsBackdropPickerOpen] = useState(false);
  const [draftPoster, setDraftPoster] = useState<string | null>(
    selectedPoster ?? media.customPosterPath ?? media.posterPath ?? null
  );
  const [draftBackdrop, setDraftBackdrop] = useState<string | null>(
    selectedBackdrop ?? media.customBackdropPath ?? media.backdropPath ?? null
  );

  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setDraftPoster(selectedPoster ?? media.customPosterPath ?? media.posterPath ?? null);
      setDraftBackdrop(selectedBackdrop ?? media.customBackdropPath ?? media.backdropPath ?? null);
    }
  }, [isOpen]);

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

        let membershipQuery = supabase
          .from("list_items")
          .select("list_id")
          .eq("media_type", media.mediaType)
          .eq("media_id", media.mediaId);

        if (media.mediaType === "tv" && typeof media.seasonNumber === "number") {
          membershipQuery = membershipQuery.eq("season_number", media.seasonNumber);
        } else {
          membershipQuery = membershipQuery.is("season_number", null);
        }

        const [{ data: listsData, error: listsError }, { data: membershipData }] =
          await Promise.all([
            supabase
              .from("lists")
              .select("id, title, is_private, updated_at, list_items(count)")
              .eq("user_id", session.user.id)
              .order("updated_at", { ascending: false }),
            membershipQuery,
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
  }, [isOpen, media.mediaType, media.mediaId, media.seasonNumber, supabase, addToast, onClose]);

  if (!isOpen) return null;

  const handleSelectPosterInternal = (filePath: string) => {
    setDraftPoster(filePath);
  };

  const handleSelectBackdropInternal = (filePath: string) => {
    setDraftBackdrop(filePath);
  };

  const currentPosterUrl = draftPoster
    ? getPosterUrl(draftPoster, "w500")
    : media.customPosterPath
    ? getPosterUrl(media.customPosterPath, "w500")
    : media.posterPath
    ? getPosterUrl(media.posterPath, "w500")
    : null;

  const currentBackdropUrl = draftBackdrop
    ? getBackdropUrl(draftBackdrop, "original")
    : media.customBackdropPath
    ? getBackdropUrl(media.customBackdropPath, "original")
    : media.backdropPath
    ? getBackdropUrl(media.backdropPath, "original")
    : null;

  const canChangePoster = Boolean(
    (availablePosters?.length ?? 0) > 0 || loadingPosters
  );
  const canChangeBackdrop = Boolean(
    (availableBackdrops?.length ?? 0) > 0 || loadingBackdrops
  );

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

    const effectivePoster = draftPoster ?? media.customPosterPath ?? null;
    const effectiveBackdrop = draftBackdrop ?? media.customBackdropPath ?? null;
    const hasArtworkChanged =
      effectivePoster !== (media.customPosterPath ?? null) ||
      effectiveBackdrop !== (media.customBackdropPath ?? null);

    if (toAdd.length === 0 && toRemove.length === 0 && !hasArtworkChanged) {
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

      const seasonNum =
        media.mediaType === "tv" && typeof media.seasonNumber === "number"
          ? media.seasonNumber
          : null;

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
            season_number: seasonNum,
            position: foundList ? foundList.itemCount : 0,
            custom_poster_path: effectivePoster,
            custom_backdrop_path: effectiveBackdrop,
          };
        });

        const { error: insertError } = await supabase
          .from("list_items")
          .upsert(rowsToInsert, {
            onConflict: "list_id,media_type,media_id,season_number",
          });

        if (insertError) {
          addToast("Error adding item to lists", "error");
          return;
        }
      }

      if (toRemove.length > 0) {
        let deleteQuery = supabase
          .from("list_items")
          .delete()
          .in("list_id", toRemove)
          .eq("media_type", media.mediaType)
          .eq("media_id", media.mediaId);

        if (seasonNum !== null) {
          deleteQuery = deleteQuery.eq("season_number", seasonNum);
        } else {
          deleteQuery = deleteQuery.is("season_number", null);
        }

        const { error: deleteError } = await deleteQuery;

        if (deleteError) {
          addToast("Error removing item from lists", "error");
          return;
        }
      }

      const remainingActiveIds = Array.from(selectedIds).filter((id) => !toRemove.includes(id));
      if (hasArtworkChanged && remainingActiveIds.length > 0) {
        let updateQuery = supabase
          .from("list_items")
          .update({
            custom_poster_path: effectivePoster,
            custom_backdrop_path: effectiveBackdrop,
          })
          .in("list_id", remainingActiveIds)
          .eq("media_type", media.mediaType)
          .eq("media_id", media.mediaId);

        if (seasonNum !== null) {
          updateQuery = updateQuery.eq("season_number", seasonNum);
        } else {
          updateQuery = updateQuery.is("season_number", null);
        }

        await updateQuery;
      }

      const touchedListIds = Array.from(
        new Set([...toAdd, ...toRemove, ...(hasArtworkChanged ? remainingActiveIds : [])])
      );
      if (touchedListIds.length > 0) {
        await supabase
          .from("lists")
          .update({ updated_at: new Date().toISOString() })
          .in("id", touchedListIds);
      }

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
        <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
          <div
            onClick={canChangeBackdrop ? () => setIsBackdropPickerOpen(true) : undefined}
            title={canChangeBackdrop ? "Click to change banner" : undefined}
            className={`relative h-36 sm:h-48 md:h-52 w-full bg-zinc-900 overflow-hidden ${
              canChangeBackdrop ? "cursor-pointer group" : ""
            }`}
          >
            {currentBackdropUrl ? (
              <Image
                src={currentBackdropUrl}
                alt="Media banner"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-zinc-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-black/30" />

            {canChangeBackdrop && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              disabled={isSaving}
              aria-label="Close"
              className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 border border-zinc-700/60 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 sm:px-8 pb-6 sm:pb-8">
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start -mt-14 sm:-mt-20 relative z-10 mb-5">
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div
                  onClick={canChangePoster ? () => setIsPosterPickerOpen(true) : undefined}
                  title={canChangePoster ? "Click to change poster" : undefined}
                  className={`relative w-28 sm:w-36 aspect-[2/3] rounded-lg overflow-hidden bg-zinc-900 border-2 border-zinc-800 shadow-2xl ${
                    canChangePoster ? "cursor-pointer group" : ""
                  }`}
                >
                  {currentPosterUrl ? (
                    <Image
                      src={currentPosterUrl}
                      alt={media.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                      <Film className="w-8 h-8" />
                    </div>
                  )}

                  {canChangePoster && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 pt-2 sm:pt-14 md:pt-16">
                <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Add to list
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight leading-tight truncate">
                      {media.title}
                    </h2>
                    {media.mediaType === "tv" && media.seasonNumber && (
                      <p className="text-xs font-semibold text-[#a8dadc] mt-0.5">
                        {media.seasonTitle || `Season ${media.seasonNumber}`}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-zinc-900 border border-zinc-800 hover:border-[#a8dadc]/60 text-[#a8dadc] transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>New list</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-zinc-800/80 pt-4">
              <div className="max-h-[42vh] overflow-y-auto pr-1">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-end gap-2.5">
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
      </div>

      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSaved={handleListCreated}
      />

      {availablePosters && (
        <ArtworkPickerModal
          isOpen={isPosterPickerOpen}
          onClose={() => setIsPosterPickerOpen(false)}
          title="CHANGE ARTWORK"
          type="poster"
          images={availablePosters}
          selectedImage={draftPoster}
          onSelectImage={handleSelectPosterInternal}
          isLoading={loadingPosters}
          zIndexClassName="z-[60]"
        />
      )}

      {availableBackdrops && (
        <BackdropPickerModal
          isOpen={isBackdropPickerOpen}
          onClose={() => setIsBackdropPickerOpen(false)}
          title="CHANGE BANNER"
          images={availableBackdrops}
          selectedImage={draftBackdrop}
          onSelectImage={handleSelectBackdropInternal}
          isLoading={loadingBackdrops}
          zIndexClassName="z-[60]"
        />
      )}
    </>
  );
}
