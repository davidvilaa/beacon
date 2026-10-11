"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { PrimaryButton } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase().includes("invalid login credentials")
        ? "Credenciales incorrectas. Comprueba tu e-mail y contraseña."
        : error.message;
      addToast(msg, "error");
      setLoading(false);
    } else {
      addToast("Has iniciado sesión con éxito", "success");
      router.push("/");
    }
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
              <label className="block text-sm font-medium text-zinc-400 mb-1">e-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-md focus:border-[#a8dadc] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-md focus:border-[#a8dadc] focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="mt-8">
            <PrimaryButton
              type="submit"
              disabled={loading}
              className="w-full py-3"
            >
              {loading ? "Entrando..." : "Entrar"}
            </PrimaryButton>
          </div>
        </form>

        <hr className="border-zinc-700/60 my-6" />

        <div className="text-center text-sm text-zinc-400">
          ¿no tienes cuenta? <Link href="/register" className="text-[#a8dadc] hover:underline">Regístrate</Link>
        </div>
      </div>
    </div>
  );
}
