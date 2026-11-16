"use client";

import { useEffect, useState, MouseEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing?: boolean;
  onToggle?: (isFollowing: boolean) => void;
  className?: string;
  size?: "sm" | "md";
}

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  onToggle,
  className = "",
  size = "md",
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState<boolean>(
    initialIsFollowing ?? false
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(
    initialIsFollowing === undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;

    async function checkFollowState() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (ignore) return;
      const uid = session?.user?.id || null;
      setCurrentUserId(uid);

      if (!uid || uid === targetUserId) {
        setLoading(false);
        return;
      }

      if (initialIsFollowing !== undefined) {
        setIsFollowing(initialIsFollowing);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", uid)
        .eq("following_id", targetUserId)
        .maybeSingle();

      if (ignore) return;
      if (!error && data) {
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
      }
      setLoading(false);
    }

    checkFollowState();

    return () => {
      ignore = true;
    };
  }, [targetUserId, initialIsFollowing, supabase]);

  if (!currentUserId || currentUserId === targetUserId) {
    return null;
  }

  const handleToggle = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting) return;

    const previousState = isFollowing;
    const nextState = !previousState;

    setIsFollowing(nextState);
    onToggle?.(nextState);
    setIsSubmitting(true);

    try {
      if (previousState) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUserId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        });

        if (error) throw error;
      }
    } catch {
      setIsFollowing(previousState);
      onToggle?.(previousState);
      addToast("Could not update follow status", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSmall = size === "sm";

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading || isSubmitting}
      className={`rounded-sm font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 disabled:opacity-50 select-none ${
        isSmall ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"
      } ${
        isFollowing
          ? "bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:border-rose-500/60 hover:text-rose-400 hover:bg-rose-500/10"
          : "bg-[#a8dadc] text-zinc-950 hover:bg-[#a8dadc]/90 border border-transparent"
      } ${className}`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
