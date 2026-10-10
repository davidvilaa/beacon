"use client";

import Logo from "@/components/ui/Logo";

export default function Profile() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50">
      <div className="text-center p-8 border border-zinc-800 bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg">
        <Logo className="text-4xl mb-4" />
        <h1 className="text-2xl font-bold mb-2">Tu Perfil Público</h1>
        <p className="text-zinc-400">
          Esta página está en construcción. Aquí aparecerán tus trackers, listas y todo el contenido público de tu perfil.
        </p>
      </div>
    </div>
  );
}
