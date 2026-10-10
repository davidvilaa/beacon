"use client";

import { UserCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

const backgrounds = [
  "backgrounds/01.jpg",
  "backgrounds/02.jpg",
  "backgrounds/03.jpg",
];

export default function Home() {
  const [bgImage, setBgImage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showNav, setShowNav] = useState(true);

  useEffect(() => {
    const randomImage = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setBgImage(randomImage);
    setMounted(true);

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
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col text-zinc-50 min-h-[200vh]">
      
      {mounted && (
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out -z-10"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}

      <div 
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
          showNav ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur-md">
          <div className="text-xl font-black tracking-widest text-zinc-100">BEACON</div>
          
          <div className="flex items-center">
            <button className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
              <UserCircle className="h-5 w-5 text-zinc-400 hover:text-zinc-200 transition-colors" />
            </button>
          </div>
        </header>

        <nav className="flex items-center justify-center h-12 border-b border-zinc-800/50 bg-zinc-900/40 px-6 backdrop-blur-sm">
          {}
        </nav>
      </div>

      <main className="flex-1 relative flex flex-col pt-[104px]"> 
      </main>

      <footer className="border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md py-8 text-center text-xs text-zinc-500 mt-auto">
        <p>© {new Date().getFullYear()} Beacon. Para uso personal.</p>
        <div className="mt-3 flex justify-center gap-6">
          <a href="#" className="hover:text-zinc-300 transition-colors">Términos legales</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Privacidad y movidas</a>
        </div>
      </footer>
    </div>
  );
}
