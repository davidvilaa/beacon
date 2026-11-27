import type { SupabaseClient } from "@supabase/supabase-js";

export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
export const BIO_MAX_LENGTH = 300;
export const MAX_SOCIAL_LINKS = 10;
export const SOCIAL_VALUE_MAX_LENGTH = 200;
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

const SOCIAL_PATTERNS: Record<string, RegExp> = {
  github: /^[A-Za-z0-9-]{1,39}$/,
  twitter: /^[A-Za-z0-9_]{1,15}$/,
  instagram: /^[A-Za-z0-9._]{1,30}$/,
  custom: /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:[0-9]+)?([/?#]\S*)?$/i,
};

export interface SocialLink {
  platform: string;
  value: string;
}

export function normalizeSocialLinks(links: SocialLink[]): SocialLink[] {
  return links
    .map(({ platform, value }) => ({
      platform,
      value: platform === "custom" ? value.trim() : value.trim().replace(/^@/, ""),
    }))
    .filter((link) => link.platform !== "" && link.value !== "");
}

export function isValidSocialLink({ platform, value }: SocialLink): boolean {
  return value.length <= SOCIAL_VALUE_MAX_LENGTH && Boolean(SOCIAL_PATTERNS[platform]?.test(value));
}

export async function isUsernameTaken(
  supabase: SupabaseClient,
  username: string,
  ownId?: string
): Promise<boolean> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .ilike("username", username.replace(/[\\%_]/g, "\\$&"))
    .limit(1);
  return Boolean(data?.some((row) => row.id !== ownId));
}
