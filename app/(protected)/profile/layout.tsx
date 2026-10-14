"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  UserCircle,
  Link as LinkIcon,
  LayoutGrid,
  Film,
  Tv,
  Sparkles,
  Gamepad2,
  BookOpen,
  BookCopy,
} from "lucide-react";
import { FaGithub, FaXTwitter, FaInstagram } from "react-icons/fa6";
import Loading from "@/components/ui/Loading";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("username, avatar_url, bio, social_links")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [router, supabase]);

  const getSocialUrl = (platform: string, value: string) => {
    if (platform === "github") return `https://github.com/${value}`;
    if (platform === "twitter") return `https://x.com/${value}`;
    if (platform === "instagram") return `https://instagram.com/${value}`;
    if (platform === "custom" && !value.startsWith("http")) return `https://${value}`;
    return value;
  };

  const renderSocialIcon = (platform: string, className: string) => {
    if (platform === "github") return <FaGithub className={className} />;
    if (platform === "twitter") return <FaXTwitter className={className} />;
    if (platform === "instagram") return <FaInstagram className={className} />;
    return <LinkIcon className={className} />;
  };

  if (loading) {
    return (
      <div className="flex-1 w-full max-w-5xl mx-auto p-12 flex items-center justify-center min-h-[50vh]">
        <Loading />
      </div>
    );
  }

  if (!profile) return null;

  const profileTabs = [
    { label: "General", href: "/profile", icon: LayoutGrid, exact: true },
    { label: "Películas", href: "/profile/movies", icon: Film },
    { label: "Series", href: "/profile/series", icon: Tv },
    { label: "Anime", href: "/profile/anime", icon: Sparkles },
    { label: "Videojuegos", href: "/profile/games", icon: Gamepad2 },
  ];

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 font-[family-name:var(--font-geist-sans)]">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start pb-8 border-b border-zinc-800">
        <div className="shrink-0">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-zinc-800 shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-zinc-900 flex items-center justify-center border-2 border-zinc-800 shadow-xl">
              <UserCircle className="w-14 h-14 text-zinc-700" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 flex-1 pt-1">
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
            {profile.username || "Usuario"}
          </h1>

          {profile.social_links && profile.social_links.length > 0 && (
            <div className="flex flex-wrap gap-3.5 items-center mt-0.5">
              {profile.social_links.map((link: any, i: number) => (
                <a
                  key={i}
                  href={getSocialUrl(link.platform, link.value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-[#a8dadc] transition-colors"
                >
                  {renderSocialIcon(link.platform, "w-3.5 h-3.5")}
                  <span>{link.value.replace(/^https?:\/\/(www\.)?/, "")}</span>
                </a>
              ))}
            </div>
          )}

          {profile.bio && (
            <p className="text-zinc-400 mt-2 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap max-w-2xl">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      <nav className="flex items-center gap-2 overflow-x-auto pt-4 pb-2 border-b border-zinc-800/60 scrollbar-none">
        {profileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-zinc-800/90 text-[#a8dadc] border border-zinc-700/80 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-8">{children}</div>
    </div>
  );
}
