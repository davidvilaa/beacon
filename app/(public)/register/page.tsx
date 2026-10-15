"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { useToast } from "@/components/ui/Toast";
import { PrimaryButton } from "@/components/ui/Button";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToast();

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (/[a-zA-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) score += 1;
    if (pass.length >= 12 && score >= 4) score += 1;
    return score;
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ["", "Very weak", "Weak", "Fair", "Strong", "Very strong"];
  const strengthColors = ["bg-zinc-800", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];

    if (username.length < 3 || username.length > 20) {
      errs.push("Username must be between 3 and 20 characters.");
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errs.push("Username can only contain letters, numbers, and underscores.");
    }

    if (email.length > 254) {
      errs.push("Email is too long.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.push("Invalid email format.");
    }

    if (password.length < 6 || password.length > 30) {
      errs.push("Password must be between 6 and 30 characters.");
    }
    if (!/[a-zA-Z]/.test(password)) {
      errs.push("Password must contain at least one letter.");
    }
    if (!/[0-9]/.test(password)) {
      errs.push("Password must contain at least one number.");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errs.push("Password must contain at least one special character.");
    }
    
    if (strength < 4) {
      errs.push("Password strength must be at least 'Strong'.");
    }

    if (errs.length > 0) {
      errs.forEach(err => addToast(err, "error"));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      addToast(error.message, "error");
      setLoading(false);
    } else {
      addToast("Account created successfully", "success");
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50 py-12">
      <div className="w-full max-w-md p-8 border border-zinc-800 bg-zinc-900 rounded-xl shadow-xl">
        <div className="text-center mb-6">
          <Logo className="text-3xl" />
          <p className="text-zinc-400 mt-1">Create account</p>
        </div>
        
        <hr className="border-zinc-700/60 mb-6" />

        <form onSubmit={handleRegister} autoComplete="off">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Username</label>
              <input
                type="text"
                name="username"
                autoComplete="off"
                maxLength={20}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-md focus:border-[#a8dadc] focus:outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
              <input
                type="email"
                name="email"
                autoComplete="off"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-md focus:border-[#a8dadc] focus:outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Password</label>
              <input
                type="password"
                name="new-password"
                autoComplete="new-password"
                maxLength={30}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-md focus:border-[#a8dadc] focus:outline-none"
                required
              />
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ease-out ${strengthColors[strength] || 'bg-transparent'}`} 
                      style={{ width: `${(strength / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 text-right font-medium">
                    {strengthLabels[strength]}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <PrimaryButton
              type="submit"
              disabled={loading}
              className="w-full py-2.5"
            >
              {loading ? "Signing up..." : "Sign up"}
            </PrimaryButton>
          </div>
        </form>

        <hr className="border-zinc-700/60 my-6" />

        <div className="text-center text-sm text-zinc-400">
          Already have an account? <Link href="/login" className="text-[#a8dadc] hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
