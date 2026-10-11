"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { UserCircle, Link as LinkIcon } from "lucide-react";
import { FaGithub, FaXTwitter, FaInstagram } from "react-icons/fa6";
import Logo from "@/components/ui/Logo";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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
    if (platform === 'github') return `https://github.com/${value}`;
    if (platform === 'twitter') return `https://x.com/${value}`;
    if (platform === 'instagram') return `https://instagram.com/${value}`;
    if (platform === 'custom' && !value.startsWith('http')) return `https://${value}`;
    return value;
  };

  const renderSocialIcon = (platform: string, className: string) => {
    if (platform === 'github') return <FaGithub className={className} />;
    if (platform === 'twitter') return <FaXTwitter className={className} />;
    if (platform === 'instagram') return <FaInstagram className={className} />;
    return <LinkIcon className={className} />;
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">Cargando...</div>;
  if (!profile) return null;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-50">
      <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur-md">
        <Logo className="text-xl" />
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto p-8 pt-16">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="shrink-0">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Avatar" 
                className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-4 border-zinc-800 shadow-xl" 
              />
            ) : (
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-zinc-900 flex items-center justify-center border-4 border-zinc-800 shadow-xl">
                <UserCircle className="w-16 h-16 md:w-24 md:h-24 text-zinc-700" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 flex-1 pt-2 md:pt-4">
            <h1 className="text-3xl md:text-5xl font-black text-zinc-100 tracking-tight">
              {profile.username || "Usuario"}
            </h1>
            
            {profile.social_links && profile.social_links.length > 0 && (
              <div className="flex flex-wrap gap-4 items-center mt-1">
                {profile.social_links.map((link: any, i: number) => (
                  <a 
                    key={i} 
                    href={getSocialUrl(link.platform, link.value)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-[#a8dadc] transition-colors"
                  >
                    {renderSocialIcon(link.platform, "w-4 h-4")}
                    <span>{link.value.replace(/^https?:\/\/(www\.)?/, '')}</span>
                  </a>
                ))}
              </div>
            )}

            {profile.bio && (
              <p className="text-zinc-300 mt-3 text-sm md:text-base leading-relaxed whitespace-pre-wrap max-w-2xl">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
