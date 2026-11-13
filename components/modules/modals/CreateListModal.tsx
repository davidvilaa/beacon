"use client";

import { useState, useEffect } from "react";
import { X, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Checkbox from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/Toast";

export interface CreatedOrUpdatedList {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (list: CreatedOrUpdatedList) => void;
  listToEdit?: {
    id: string;
    title: string;
    description: string | null;
    is_private: boolean;
  } | null;
}

export default function CreateListModal({
  isOpen,
  onClose,
  onSaved,
  listToEdit = null,
}: CreateListModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();
  const { addToast } = useToast();

  const isEditMode = Boolean(listToEdit);

  useEffect(() => {
    if (isOpen) {
      setTitle(listToEdit?.title || "");
      setDescription(listToEdit?.description || "");
      setIsPrivate(listToEdit?.is_private || false);
    }
  }, [isOpen, listToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      addToast("Please enter a list title", "error");
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

      if (isEditMode && listToEdit) {
        const { data, error } = await supabase
          .from("lists")
          .update({
            title: trimmedTitle,
            description: description.trim(),
            is_private: isPrivate,
          })
          .eq("id", listToEdit.id)
          .eq("user_id", session.user.id)
          .select("id, user_id, title, description, is_private, created_at, updated_at")
          .single();

        if (error || !data) {
          addToast("Error updating list", "error");
          return;
        }

        addToast("List updated successfully", "success");
        onSaved(data as CreatedOrUpdatedList);
        onClose();
      } else {
        const { data, error } = await supabase
          .from("lists")
          .insert({
            user_id: session.user.id,
            title: trimmedTitle,
            description: description.trim(),
            is_private: isPrivate,
          })
          .select("id, user_id, title, description, is_private, created_at, updated_at")
          .single();

        if (error || !data) {
          addToast("Error creating list", "error");
          return;
        }

        addToast("List created successfully", "success");
        onSaved(data as CreatedOrUpdatedList);
        onClose();
      }
    } catch {
      addToast("Something went wrong", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
        <div className="p-3.5 sm:px-5 border-b border-zinc-800/80 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            {isEditMode ? "EDIT LIST" : "NEW LIST"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close"
            className="text-zinc-400 hover:text-white p-1.5 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="e.g. Best Sci-Fi Movies, Weekend Binge..."
              autoFocus
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#a8dadc]/80 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Description
            </label>
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg overflow-hidden focus-within:border-[#a8dadc]/80 transition-colors">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a short description... (optional)"
                maxLength={500}
                rows={4}
                className="w-full bg-transparent p-3.5 text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed block"
              />

              <div className="border-t border-zinc-800/80 px-3.5 py-2.5 bg-zinc-900/50 flex items-center justify-between">
                <Checkbox
                  checked={isPrivate}
                  onChange={setIsPrivate}
                  label="Private list (only visible to you)"
                />
                {isPrivate && <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-md text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-md text-xs font-bold bg-[#a8dadc] text-zinc-950 hover:bg-[#8ec5c8] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving
                ? "Saving..."
                : isEditMode
                ? "Save changes"
                : "Create list"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
