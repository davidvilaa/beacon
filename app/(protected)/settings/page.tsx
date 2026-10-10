"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { UserCircle, Upload } from "lucide-react";
import Link from "next/link";

export default function Settings() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      const { data } = await supabase
        .from("users")
        .select("username, avatar_url")
        .eq("id", session.user.id)
        .single();
      
      if (data) {
        setUsername(data.username || "");
        if (data.avatar_url) {
          setAvatarUrl(data.avatar_url);
          setPreviewUrl(data.avatar_url);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [router, supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async () => {
    if (!user) return;
    setSaving(true);
    setMessage({ text: "", type: "" });
    let finalAvatarUrl = avatarUrl;

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile);
      
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        finalAvatarUrl = publicUrl;
      } else {
        setMessage({ text: "Error subiendo la foto", type: "error" });
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("users")
      .update({ username, avatar_url: finalAvatarUrl })
      .eq("id", user.id);
      
    setSaving(false);
    
    if (error) {
      setMessage({ text: "Error al actualizar perfil", type: "error" });
    } else {
      setMessage({ text: "Perfil guardado correctamente", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">Cargando...</div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50">
      <div className="w-full max-w-md p-8 border border-zinc-800 bg-zinc-900 rounded-xl shadow-xl">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block text-3xl font-black tracking-widest text-zinc-100 hover:text-white transition-colors">
            BEACON
          </Link>
          <p className="text-zinc-400 mt-1">Ajustes de perfil</p>
        </div>

        <hr className="border-zinc-800/50 mb-6" />

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-zinc-700" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700">
                  <UserCircle className="w-12 h-12 text-zinc-500" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-6 h-6 text-white" />
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cambiar foto
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Nombre de usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-md focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {message.text && (
            <div className={`text-sm text-center font-medium ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message.text}
            </div>
          )}

          <button
            onClick={handleUpdate}
            disabled={saving}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-md font-medium transition-colors"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        <hr className="border-zinc-800/50 my-6" />

        <button
          onClick={handleLogout}
          className="w-full py-2 bg-transparent border border-red-900/50 text-red-500 hover:bg-red-950/30 rounded-md font-medium transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
