"use client";

import { UserCircle, Settings2, LogOut, CircleUserRound } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '../lib/supabase/client';
import Logo from '@/components/ui/Logo';

const backgrounds = [
  "/backgrounds/01.jpg",
  "/backgrounds/02.jpg",
  "/backgrounds/03.jpg",
];

export default function Home() {
  const [bgImage, setBgImage] = useState("");
  const [showNav, setShowNav] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(2026);
  
  const supabase = createClient();

  useEffect(() => {
    const randomImage = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setBgImage(randomImage);
    setCurrentYear(new Date().getFullYear());

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

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return (
    <div className="flex flex-col text-zinc-50 min-h-[200vh]">
      {bgImage && (
        <div className="fixed inset-0 -z-10">
          <Image 
            src={bgImage} 
            alt="Fondo de Beacon"
            fill
            priority
            quality={100}
            className="object-cover object-center"
          />
        </div>
      )}

      <div 
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
          showNav ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <header className="relative z-10 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur-md">
          <Logo className="text-xl" />
          
          <div className="flex items-center">
            {user ? (
              <div className="relative group">
                <Link href="/profile">
                  <button className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors overflow-hidden border border-zinc-700">
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
                      className="px-4 py-3 text-sm font-medium text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors text-left flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm font-medium border border-zinc-700 hover:bg-zinc-800 text-zinc-300 px-4 py-1.5 rounded-md transition-colors">
                  Entrar
                </Link>
                <Link href="/register" className="text-sm font-medium bg-[#a8dadc] hover:bg-[#8ec5c8] text-zinc-950 px-4 py-1.5 rounded-md transition-colors">
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </header>

        <nav className="flex items-center justify-center h-12 border-b border-zinc-800/50 bg-zinc-900/40 px-6 backdrop-blur-sm">
        </nav>
      </div>

      <main className="flex-1 relative flex flex-col pt-[104px]"> 
      </main>

      <footer className="border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md py-8 text-center text-xs text-zinc-500 mt-auto">
        <p>© {currentYear} Beacon. Para uso personal.</p>
        <div className="mt-3 flex justify-center gap-6">
          <a href="#" className="hover:text-zinc-300 transition-colors">Términos legales</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Privacidad y movidas</a>
        </div>
      </footer>
    </div>
  );
}

