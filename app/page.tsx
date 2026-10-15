"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";

const backgrounds = [
  "/backgrounds/01.jpg",
  "/backgrounds/02.jpg",
  "/backgrounds/03.jpg",
];

export default function Home() {
  const [bgImage, setBgImage] = useState("");
  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    const randomImage = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setBgImage(randomImage);
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div className="flex flex-col text-zinc-50 min-h-[200vh]">
      {bgImage && (
        <div className="fixed inset-0 -z-10">
          <Image 
            src={bgImage} 
            alt="Beacon background"
            fill
            priority
            quality={100}
            className="object-cover object-center"
          />
        </div>
      )}

      <Navbar />

      <main className="flex-1 relative flex flex-col pt-14"> 
      </main>

      <footer className="border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md py-8 text-center text-xs text-zinc-500 mt-auto">
        <p>© {currentYear} Beacon. For personal use.</p>
        <div className="mt-3 flex justify-center gap-6">
          <a href="#" className="hover:text-zinc-300 transition-colors">Terms of service</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Privacy policy</a>
        </div>
      </footer>
    </div>
  );
}