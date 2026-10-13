"use client";

import { UserCircle, Settings2, LogOut, CircleUserRound, Search, X, Film } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/ui/Logo";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";

export default function Navbar() {
  const [showNav, setShowNav] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data } = await supabase
          .from("users")
          .select("avatar_url")
          .eq("id", session.user.id)
          .single();
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setAvatarUrl(null);
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
    return () => {
      window.removeEventListener("scroll", handleScroll);
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        showNav ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <header className="relative z-10 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur-md">
        <div 
          className={`flex h-full items-center justify-between w-full transition-opacity duration-300 ease-in-out ${
            isSearchOpen ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
          }`}
        >
          <Logo className="text-xl" />
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Buscar"
              className="p-1.5 text-zinc-400 hover:text-[#a8dadc] transition-colors rounded-full hover:bg-zinc-800 cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>

            {user ? (
              <div className="relative group">
                <Link href="/profile">
                  <button className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors overflow-hidden border border-zinc-700 cursor-pointer">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="h-5 w-5 text-zinc-400" />
                    )}
                  </button>
                </Link>

                <div className="absolute right-0 top-full pt-3 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-zinc-900 border border-zinc-700 rounded-md shadow-xl overflow-hidden flex flex-col">
                    <Link href="/profile" className="px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2">
                      <CircleUserRound className="w-4 h-4" />
                      Perfil
                    </Link>
                    <hr className="border-zinc-700/60 mx-6" />
                    <Link href="/settings" className="px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      Ajustes
                    </Link>
                    <button 
                      onClick={async () => await supabase.auth.signOut()} 
                      className="px-4 py-3 text-sm font-medium text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors text-left flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <SecondaryButton className="py-1.5 px-3.5">
                    Entrar
                  </SecondaryButton>
                </Link>
                <Link href="/register">
                  <PrimaryButton className="py-1.5 px-3.5">
                    Registrarse
                  </PrimaryButton>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div 
          className="absolute top-0 bottom-0 w-[2px] bg-[#a8dadc] shadow-[0_0_12px_#a8dadc] transition-all duration-300 ease-in-out pointer-events-none z-30"
          style={{
            left: isSearchOpen ? "0%" : "calc(100% - 2px)",
            opacity: isSearchOpen ? 1 : 0,
          }} 
        />

        <div
          className={`absolute inset-0 px-6 flex items-center transition-all duration-300 ease-in-out z-20 ${
            isSearchOpen 
              ? "pointer-events-auto opacity-100" 
              : "pointer-events-none opacity-0"
          }`}
          style={{
            clipPath: isSearchOpen ? "inset(0 0% 0 0)" : "inset(0 0 0 100%)",
          }}
        >
          <div className="flex items-center gap-3 w-full">
            <Search className="w-5 h-5 text-[#a8dadc] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
              placeholder="..."
              className="w-full bg-transparent text-zinc-100/80 text-lg sm:text-xl italic tracking-wider uppercase focus:outline-none placeholder:text-zinc-600 font-[family-name:var(--font-geist-sans)]"
            />
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery("");
              }}
              className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800/60 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <nav className="flex items-center justify-start h-12 border-b border-zinc-800/50 bg-zinc-900/40 px-6 backdrop-blur-sm overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-3">
          <Link 
            href="/movies" 
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-[#a8dadc] transition-colors py-1.5 px-3 rounded-md hover:bg-zinc-800/50"
          >
            <Film className="w-3.5 h-3.5 text-[#a8dadc]" />
            <span>Movies</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
