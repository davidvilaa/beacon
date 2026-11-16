"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ProfileUser } from "@/components/profile/ProfileContext";
import CardGradientBorder from "@/components/ui/CardGradientBorder";

interface NetworkUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface ProfileNetworkTabProps {
  profileUser: ProfileUser;
}

export default function ProfileNetworkTab({
  profileUser,
}: ProfileNetworkTabProps) {
  const [followers, setFollowers] = useState<NetworkUser[]>([]);
  const [following, setFollowing] = useState<NetworkUser[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;

    async function loadNetwork() {
      setLoading(true);

      const [followersRes, followingRes] = await Promise.all([
        supabase
          .from("follows")
          .select("follower_id")
          .eq("following_id", profileUser.id),
        supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", profileUser.id),
      ]);

      if (ignore) return;

      const followerIds = Array.from(
        new Set((followersRes.data || []).map((r: any) => r.follower_id))
      );
      const followingIds = Array.from(
        new Set((followingRes.data || []).map((r: any) => r.following_id))
      );

      const allUserIds = Array.from(
        new Set([...followerIds, ...followingIds])
      );

      let usersMap = new Map<string, NetworkUser>();

      if (allUserIds.length > 0) {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, username, avatar_url")
          .in("id", allUserIds);

        if (ignore) return;

        for (const u of usersData || []) {
          usersMap.set(u.id, {
            id: u.id,
            username: u.username,
            avatar_url: u.avatar_url,
          });
        }
      }

      if (!ignore) {
        setFollowers(
          followerIds.map((id) => usersMap.get(id)).filter(Boolean) as NetworkUser[]
        );
        setFollowing(
          followingIds.map((id) => usersMap.get(id)).filter(Boolean) as NetworkUser[]
        );
        setLoading(false);
      }
    }

    loadNetwork();

    return () => {
      ignore = true;
    };
  }, [profileUser.id, supabase]);

  const renderColumn = (
    title: string,
    users: NetworkUser[],
    emptyMessage: string
  ) => {
    return (
      <div className="flex-1 min-w-0">
        <div className="border-b border-zinc-700/80 rounded-b-sm pb-3 mb-6 flex items-center gap-2">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-400">
            {title}
          </h2>
          <span className="text-xs sm:text-sm font-mono text-zinc-400 font-normal">
            {users.length}
          </span>
        </div>

        {users.length === 0 ? (
          <div className="py-12 rounded-sm border border-dashed border-zinc-800 bg-zinc-900/20 text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 sm:gap-3">
            {users.map((u) => (
              <Link
                key={u.id}
                href={`/profile/${encodeURIComponent(u.username)}`}
                className="relative flex items-stretch w-full rounded-sm bg-zinc-800 border border-zinc-700/80 hover:bg-zinc-700/50 transition-all group cursor-pointer min-w-0 overflow-hidden h-10 sm:h-11"
              >
                <CardGradientBorder roundedClassName="rounded-sm" />
                <div className="relative h-full aspect-square w-10 sm:w-11 shrink-0 bg-zinc-900 border-r border-zinc-700/60 overflow-hidden flex items-center justify-center">
                  {u.avatar_url ? (
                    <img
                      src={u.avatar_url}
                      alt={u.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-zinc-500" />
                  )}
                </div>

                <div className="px-3.5 flex items-center text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-100 group-hover:text-[#a8dadc] transition-colors whitespace-nowrap">
                  {u.username}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 animate-pulse">
        <div className="space-y-4">
          <div className="h-6 w-36 border-b border-zinc-700/80 rounded-b-sm bg-zinc-800/40" />
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <div className="h-10 sm:h-11 w-full bg-zinc-800/50 rounded-sm" />
            <div className="h-10 sm:h-11 w-full bg-zinc-800/40 rounded-sm" />
            <div className="h-10 sm:h-11 w-full bg-zinc-800/30 rounded-sm" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-6 w-36 border-b border-zinc-700/80 rounded-b-sm bg-zinc-800/40" />
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <div className="h-10 sm:h-11 w-full bg-zinc-800/50 rounded-sm" />
            <div className="h-10 sm:h-11 w-full bg-zinc-800/40 rounded-sm" />
            <div className="h-10 sm:h-11 w-full bg-zinc-800/30 rounded-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start font-[family-name:var(--font-geist-sans)]">
      {renderColumn("Followers", followers, "No followers yet")}
      {renderColumn("Following", following, "Not following anyone yet")}
    </div>
  );
}
