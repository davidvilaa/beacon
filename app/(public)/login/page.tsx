"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50">
      <div className="w-full max-w-md p-8 border border-zinc-800 bg-zinc-900 rounded-xl shadow-xl">
        <div className="text-center mb-6">
          <Logo className="text-3xl" />
          <p className="text-zinc-400 mt-1">Iniciar sesión</p>
        </div>
        
        <hr className="border-zinc-700/60 mb-6" />

        <form onSubmit={handleLogin}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-md focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-md focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
          </div>

          <div className="mt-8">
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md font-medium transition-colors"
            >
              Entrar
            </button>
          </div>
        </form>

        <hr className="border-zinc-700/60 my-6" />

        <div className="text-center text-sm text-zinc-400">
          ¿No tienes cuenta? <Link href="/register" className="text-indigo-400 hover:underline">Regístrate</Link>
        </div>
      </div>
    </div>
  );
}
