"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Loading from "@/components/ui/Loading";

export default function ProfileRedirectPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;

    const redirectToUserProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (ignore) return;

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("username")
        .eq("id", session.user.id)
        .maybeSingle();

      if (ignore) return;

      if (data?.username) {
        router.replace(`/profile/${encodeURIComponent(data.username)}`);
      } else {
        router.replace("/settings");
      }
    };

    redirectToUserProfile();

    return () => {
      ignore = true;
    };
  }, [router, supabase]);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-24 flex items-center justify-center">
      <Loading text="Loading profile..." />
    </div>
  );
}
