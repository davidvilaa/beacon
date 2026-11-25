import type { Metadata } from "next";

const SITE_NAME = "BEACON";

export function buildMediaMetadata({
  title,
  year,
  description,
  image,
}: {
  title: string;
  year?: string | number | null;
  description?: string | null;
  image?: string | null;
}): Metadata {
  const fullTitle = `${title}${year ? ` (${year})` : ""} · ${SITE_NAME}`;
  const summary = description ? description.slice(0, 200) : undefined;
  return {
    title: fullTitle,
    description: summary,
    openGraph: {
      title: fullTitle,
      description: summary,
      siteName: SITE_NAME,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: fullTitle,
      description: summary,
      images: image ? [image] : undefined,
    },
  };
}

export const notFoundMetadata: Metadata = { title: `Not found · ${SITE_NAME}` };
