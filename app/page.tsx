"use client";

import { UserCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '../lib/supabase/client';

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
        <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur-md">
          <Link href="/" className="text-xl font-black tracking-widest text-zinc-100 hover:text-white transition-colors">
            BEACON
          </Link>
          
          <div className="flex items-center">
            {user ? (
              <Link href="/settings">
                <button className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors overflow-hidden border border-zinc-700">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="h-5 w-5 text-zinc-400" />
                  )}
                </button>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-sm font-medium border border-zinc-700 hover:bg-zinc-800 text-zinc-300 px-4 py-1.5 rounded-md transition-colors">
                  Entrar
                </Link>
                <Link href="/register" className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-md transition-colors">
                  Registro
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
