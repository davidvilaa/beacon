"use client";

import { UserCircle, Settings2, LogOut, CircleUserRound, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/ui/Logo";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";

export default function Navbar() {
  const [showNav, setShowNav] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUserMeta = async (userId: string) => {
      const { data } = await supabase
        .from("users")
        .select("username, avatar_url")
        .eq("id", userId)
        .maybeSingle();
      setUsername(data?.username ?? null);
      setAvatarUrl(data?.avatar_url ?? null);
    };

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchUserMeta(session.user.id);
      } else {
        setUsername(null);
        setAvatarUrl(null);
      }
    };
    checkUser();

    const handleProfileUpdated = () => {
      checkUser();
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserMeta(session.user.id);
      } else {
        setUsername(null);
        setAvatarUrl(null);
      }
    });

    let lastScroll = window.scrollY;
    
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > lastScroll && currentScroll > 60) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      lastScroll = currentScroll;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("profile-updated", handleProfileUpdated);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("profile-updated", handleProfileUpdated);
      subscription.unsubscribe();
    };
  }, [supabase]);

  const profileHref = username ? `/profile/${encodeURIComponent(username)}` : "/profile";

  const handleSearchSubmit = () => {
    const trimmed = searchQuery.trim().slice(0, 50);
    if (trimmed) {
      window.dispatchEvent(new CustomEvent("beacon-search-executed"));
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      setSearchQuery("");
      searchInputRef.current?.blur();
    }
  };

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        showNav ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <header className="flex h-14 items-center justify-between gap-3 border-b border-zinc-800 bg-navbar px-4 sm:px-6">
        <Logo className="text-xl" />

        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-32 min-w-0 items-center gap-2 border border-zinc-800 bg-zinc-900 px-2.5 transition-colors focus-within:border-accent/60 sm:w-64">
            <Search className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <input
              ref={searchInputRef}
              type="text"
              maxLength={50}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.slice(0, 50))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit();
                }
                if (e.key === "Escape") {
                  setSearchQuery("");
                  e.currentTarget.blur();
                }
              }}
              placeholder="search.."
              aria-label="Search"
              className="w-full min-w-0 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
          </div>

            {user ? (
              <div className="relative group">
                <Link href={profileHref}>
                  <button className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors overflow-hidden border border-zinc-700 cursor-pointer">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="h-5 w-5 text-zinc-400" />
                    )}
                  </button>
                </Link>

                <div className="absolute right-0 top-full pt-3 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-zinc-900 border border-zinc-700 rounded-sm shadow-xl overflow-hidden flex flex-col">
                    <Link href={profileHref} className="px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2">
                      <CircleUserRound className="w-4 h-4" />
                      Profile
                    </Link>
                    <hr className="border-zinc-700/60 mx-6" />
                    <Link href="/settings" className="px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      Settings
                    </Link>
                    <button 
                      onClick={async () => await supabase.auth.signOut()} 
                      className="px-4 py-3 text-sm font-medium text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors text-left flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                <Link href="/login">
                  <SecondaryButton className="py-1.5 px-3.5">
                    Sign in
                  </SecondaryButton>
                </Link>
                <Link href="/register" className="hidden sm:block">
                  <PrimaryButton className="py-1.5 px-3.5">
                    Sign up
                  </PrimaryButton>
                </Link>
              </div>
            )}
        </div>
      </header>
    </div>
  );
}
