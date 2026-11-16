"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ProfileUser } from "@/components/profile/ProfileContext";
import FollowButton from "@/components/profile/FollowButton";

interface NetworkUser {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

interface ProfileNetworkTabProps {
  profileUser: ProfileUser;
}

export default function ProfileNetworkTab({
  profileUser,
}: ProfileNetworkTabProps) {
  const [followers, setFollowers] = useState<NetworkUser[]>([]);
  const [following, setFollowing] = useState<NetworkUser[]>([]);
  const [myFollowingSet, setMyFollowingSet] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;

    async function loadNetwork() {
      setLoading(true);

      const [
        {
          data: { session },
        },
        followersRes,
        followingRes,
      ] = await Promise.all([
        supabase.auth.getSession(),
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

      const uid = session?.user?.id || null;
      setCurrentUserId(uid);

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
          .select("id, username, avatar_url, bio")
          .in("id", allUserIds);

        if (ignore) return;

        for (const u of usersData || []) {
          usersMap.set(u.id, {
            id: u.id,
            username: u.username,
            avatar_url: u.avatar_url,
            bio: u.bio,
          });
        }
      }

      if (uid) {
        const { data: myFollows } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", uid);

        if (!ignore && myFollows) {
          setMyFollowingSet(new Set(myFollows.map((r: any) => r.following_id)));
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
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-zinc-800/80">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-400">
            {title}
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            ({users.length})
          </span>
        </div>

        {users.length === 0 ? (
          <div className="py-12 rounded-sm border border-dashed border-zinc-800 bg-zinc-900/20 text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {users.map((u) => {
              const isMe = currentUserId === u.id;
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-sm border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 transition-all"
                >
                  <Link
                    href={`/profile/${encodeURIComponent(u.username)}`}
                    className="flex items-center gap-3 min-w-0 flex-1 group cursor-pointer"
                  >
                    <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 shrink-0">
                      {u.avatar_url ? (
                        <Image
                          src={u.avatar_url}
                          alt={u.username}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <UserCircle className="w-7 h-7" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-200 group-hover:text-[#a8dadc] transition-colors truncate">
                        {u.username}
                      </h3>
                      {u.bio && (
                        <p className="text-xs text-zinc-400 truncate mt-0.5 max-w-full">
                          {u.bio}
                        </p>
                      )}
                    </div>
                  </Link>

                  {!isMe && currentUserId && (
                    <FollowButton
                      targetUserId={u.id}
                      size="sm"
                      initialIsFollowing={myFollowingSet.has(u.id)}
                      onToggle={(nextState) => {
                        setMyFollowingSet((prev) => {
                          const next = new Set(prev);
                          if (nextState) {
                            next.add(u.id);
                          } else {
                            next.delete(u.id);
                          }
                          return next;
                        });
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 animate-pulse">
        <div className="space-y-4">
          <div className="h-5 w-32 bg-zinc-800 rounded-sm" />
          <div className="h-16 bg-zinc-800/40 rounded-sm" />
          <div className="h-16 bg-zinc-800/30 rounded-sm" />
        </div>
        <div className="space-y-4">
          <div className="h-5 w-32 bg-zinc-800 rounded-sm" />
          <div className="h-16 bg-zinc-800/40 rounded-sm" />
          <div className="h-16 bg-zinc-800/30 rounded-sm" />
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
