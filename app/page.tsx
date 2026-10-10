import { UserCircle, Compass, Gamepad2, Film, Clapperboard, MonitorPlay } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      {/* 1. Top Toolbar */}
      <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
            <UserCircle className="h-5 w-5 text-zinc-400" />
          </div>
          <span className="font-medium text-sm">Tu Perfil</span>
        </div>
        <div className="text-xl font-black tracking-widest text-zinc-100">BEACON</div>
        <div className="w-[88px]" /> {/* Placeholder to balance flex-between logo centering */}
      </header>

      {/* 2. Sub Toolbar (Pinned Sections) */}
      <nav className="flex items-center justify-center gap-8 border-b border-zinc-800/50 bg-zinc-900/40 px-6 py-4 backdrop-blur-sm">
        <button className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white hover:scale-105 transition-all">
          <Gamepad2 className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Juegos</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white hover:scale-105 transition-all">
          <Film className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Pelis</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white hover:scale-105 transition-all">
          <Clapperboard className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Series</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white hover:scale-105 transition-all">
          <MonitorPlay className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Anime</span>
        </button>
      </nav>

      {/* 3. Main Content (Background and Welcome text) */}
      <main className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
        {/* Decorative background - simulando un "fondo de pantalla" chulo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-zinc-950"></div>
        
        <div className="relative z-10 text-center space-y-6 px-4">
          <Compass className="h-20 w-20 mx-auto text-zinc-800" />
          <div className="space-y-2">
            <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
              Bienvenido a <span className="text-indigo-500">Beacon</span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto">
              El centro de mando para todos tus hobbies.
              <br/> (Aquí en el futuro pondremos un fondo guapo o widgets).
            </p>
          </div>
        </div>
      </main>

      {/* 4. Footer (Legal stuff) */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-8 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} Beacon. Para uso personal y friki.</p>
        <div className="mt-3 flex justify-center gap-6">
          <a href="#" className="hover:text-zinc-300 transition-colors">Términos legales</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Privacidad y movidas</a>
        </div>
      </footer>
    </div>
  );
}
