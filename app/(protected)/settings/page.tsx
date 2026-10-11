"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { UserCircle, Upload, Trash2, Plus, Link as LinkIcon } from "lucide-react";
import { FaGithub, FaXTwitter, FaInstagram } from "react-icons/fa6";
import Logo from "@/components/ui/Logo";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";

const PLATFORMS = [
  { id: 'github', label: 'GitHub', placeholder: 'Nombre de usuario', icon: <FaGithub className="w-4 h-4" /> },
  { id: 'twitter', label: 'X (Twitter)', placeholder: 'Nombre de usuario', icon: <FaXTwitter className="w-4 h-4" /> },
  { id: 'instagram', label: 'Instagram', placeholder: 'Nombre de usuario', icon: <FaInstagram className="w-4 h-4" /> },
  { id: 'custom', label: 'Otros', placeholder: 'https://tu-web.com', icon: <LinkIcon className="w-4 h-4" /> },
];

export default function Settings() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [socialLinks, setSocialLinks] = useState<{ platform: string, value: string }[]>([]);
  
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { addToast } = useToast();
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
        .select("username, avatar_url, bio, social_links")
        .eq("id", session.user.id)
        .single();
      
      if (data) {
        setUsername(data.username || "");
        setBio(data.bio || "");
        setSocialLinks(data.social_links || []);
        
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

    if (username.length < 3 || username.length > 20) {
      addToast("El usuario debe tener entre 3 y 20 caracteres", "error");
      setSaving(false);
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      addToast("El usuario solo permite letras, números y barra baja", "error");
      setSaving(false);
      return;
    }

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
        addToast("Error subiendo la foto", "error");
        setSaving(false);
        return;
      }
    }

    const cleanLinks = socialLinks.filter(link => link.platform !== "" && link.value.trim() !== "");

    const { error } = await supabase
      .from("users")
      .update({ 
        username, 
        bio,
        social_links: cleanLinks,
        avatar_url: finalAvatarUrl 
      })
      .eq("id", user.id);
      
    setSaving(false);
    
    if (error) {
      addToast("Error al actualizar perfil", "error");
    } else {
      setSocialLinks(cleanLinks);
      addToast("Perfil guardado correctamente", "success");
    }
  };

  const handleLinkChange = (index: number, field: 'platform' | 'value', val: string) => {
    const newLinks = [...socialLinks];
    newLinks[index][field] = val;
    setSocialLinks(newLinks);
  };

  const removeLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const addLink = () => {
    if (socialLinks.length < 10) {
      setSocialLinks([...socialLinks, { platform: '', value: '' }]);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">Cargando...</div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50 py-12">
      <div className="w-full max-w-2xl p-8 border border-zinc-800 bg-zinc-900 rounded-xl shadow-xl">
        <div className="text-center mb-6">
          <Logo className="text-3xl" />
          <p className="text-zinc-400 mt-1">Ajustes de perfil</p>
        </div>

        <hr className="border-zinc-700/60 mb-8" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-zinc-800" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-zinc-800 flex items-center justify-center border-4 border-zinc-700">
                  <UserCircle className="w-16 h-16 text-zinc-500" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-8 h-8 text-white" />
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
              className="mt-3 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cambiar foto
            </button>
          </div>
          <div className="col-span-1 md:col-span-2 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Nombre de usuario</label>
                <input
                  type="text"
                  maxLength={20}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-md focus:border-[#a8dadc] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Biografía</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Cuéntanos un poco sobre ti..."
                  className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-md focus:border-[#a8dadc] focus:outline-none resize-none h-24"
                  maxLength={300}
                />
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-zinc-400">Redes sociales</label>
                  <span className="text-xs text-zinc-600">
                    {socialLinks.length}/10
                  </span>
                </div>
                
                <div className="space-y-3">
                  {socialLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <Select
                        value={link.platform}
                        onChange={(val) => handleLinkChange(index, 'platform', val)}
                        options={PLATFORMS}
                        className="w-[140px] shrink-0"
                      />
                      <input
                        type="text"
                        value={link.value}
                        disabled={!link.platform}
                        placeholder={!link.platform ? "Elige plataforma..." : PLATFORMS.find(p => p.id === link.platform)?.placeholder}
                        onChange={(e) => handleLinkChange(index, 'value', e.target.value)}
                        className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-md focus:border-[#a8dadc] focus:outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button 
                        type="button"
                        onClick={() => removeLink(index)}
                        className="p-2 text-zinc-500 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {socialLinks.length < 10 && (
                    <button
                      type="button"
                      onClick={addLink}
                      className="mt-2 flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#a8dadc] rounded-md hover:bg-[#a8dadc]/10 transition-colors w-max"
                    >
                      <Plus className="w-4 h-4" />
                      Añadir enlace
                    </button>
                  )}
                </div>
              </div>

            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={handleUpdate}
                disabled={saving}
                className="w-full py-2 bg-[#a8dadc] hover:bg-[#8ec5c8] text-zinc-950 disabled:opacity-50 rounded-md font-medium transition-colors"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}