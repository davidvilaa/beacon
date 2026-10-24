"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UserCircle, Link as LinkIcon } from "lucide-react";
import { FaGithub, FaXTwitter, FaInstagram } from "react-icons/fa6";

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

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Record<string, HTMLElement | null>>({});

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

  const getActiveTab = (path: string) => {
    if (path.startsWith("/profile/movies")) return "movies";
    if (path.startsWith("/profile/series")) return "series";
    if (path.startsWith("/profile/anime")) return "anime";
    if (path.startsWith("/profile/games")) return "games";
    return "overview";
  };

  const activeTab = getActiveTab(pathname);

  useEffect(() => {
    const updateIndicator = () => {
      const currentTabEl = tabRefs.current[activeTab];
      if (currentTabEl) {
        setIndicatorStyle({
          left: currentTabEl.offsetLeft,
          width: currentTabEl.offsetWidth,
        });
      }
    };

    updateIndicator();
    const rafId = requestAnimationFrame(updateIndicator);
    window.addEventListener("resize", updateIndicator);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeTab]);

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

  const mainTabs = [
    { id: "overview", label: "Overview", href: "/profile" },
    { id: "movies", label: "Movies", href: "/profile/movies" },
    { id: "series", label: "Series", href: "/profile/series" },
    { id: "anime", label: "Anime", href: "/profile/anime" },
    { id: "games", label: "Games", href: "/profile/games" },
  ];

  const getSubTabs = (tab: string) => {
    switch (tab) {
      case "movies":
        return [
          { id: "overview", label: "Overview", disabled: false },
          { id: "movies", label: "Movies", disabled: true },
          { id: "lists", label: "Lists", disabled: true },
        ];
      case "series":
        return [
          { id: "overview", label: "Overview", disabled: false },
          { id: "series", label: "Series", disabled: true },
          { id: "lists", label: "Lists", disabled: true },
        ];
      case "anime":
        return [
          { id: "overview", label: "Overview", disabled: false },
          { id: "anime", label: "Anime", disabled: true },
          { id: "lists", label: "Lists", disabled: true },
        ];
      case "games":
        return [
          { id: "overview", label: "Overview", disabled: false },
          { id: "games", label: "Games", disabled: true },
          { id: "lists", label: "Lists", disabled: true },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 font-[family-name:var(--font-geist-sans)]">
      {loading ? (
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start pb-6 md:pb-8 animate-pulse">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-zinc-800/80 shrink-0" />
          <div className="space-y-3 flex-1 pt-2">
            <div className="h-7 w-48 bg-zinc-800 rounded" />
            <div className="h-4 w-72 bg-zinc-800/60 rounded" />
          </div>
        </div>
      ) : profile ? (
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start pb-6 md:pb-8">
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
              {profile.username || "User"}
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
      ) : null}

      <div className="relative border-b border-zinc-800/60">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
          {mainTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                href={tab.href}
                className={`text-sm font-bold uppercase tracking-wider pb-3 transition-colors shrink-0 cursor-pointer ${
                  isActive
                    ? "text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <span
          className="absolute bottom-0 h-0.5 bg-[#a8dadc] transition-all duration-300 ease-out"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
            opacity: indicatorStyle.width > 0 ? 1 : 0,
          }}
        />
      </div>

      {activeTab !== "overview" && (
        <div className="border-b border-zinc-800/60 py-3 flex items-center gap-6 overflow-x-auto scrollbar-none">
          {getSubTabs(activeTab).map((subTab) => {
            if (subTab.disabled) {
              return (
                <span
                  key={subTab.id}
                  className="text-xs font-bold uppercase tracking-wider text-zinc-600 opacity-40 select-none cursor-not-allowed shrink-0"
                >
                  {subTab.label}
                </span>
              );
            }
            return (
              <span
                key={subTab.id}
                className="text-xs font-bold uppercase tracking-wider text-[#a8dadc] cursor-default shrink-0"
              >
                {subTab.label}
              </span>
            );
          })}
        </div>
      )}

      <div className="pt-8">{children}</div>
    </div>
  );
}
