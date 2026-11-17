"use client";

import MediaCard from "@/components/ui/MediaCard";

interface AnimeRelationNode {
  id: number;
  format?: string | null;
  title: {
    english?: string | null;
    romaji?: string | null;
  };
  coverImage?: {
    extraLarge?: string | null;
    large?: string | null;
    medium?: string | null;
  } | null;
}

export interface AnimeRelationItem {
  relationType: string;
  node: AnimeRelationNode;
}

interface RelationsTabProps {
  relations: AnimeRelationItem[];
  emptyMessage?: string;
}

function formatRelationLabel(type: string): string {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RelationsTab({
  relations,
  emptyMessage = "No anime relations found.",
}: RelationsTabProps) {
  if (relations.length === 0) {
    return <p className="text-xs text-zinc-500 py-4">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {relations.map((r) => {
        const relNode = r.node;
        const relTitle =
          relNode.title.english || relNode.title.romaji || "Untitled";
        const relCover =
          relNode.coverImage?.extraLarge ||
          relNode.coverImage?.large ||
          relNode.coverImage?.medium ||
          null;
        const relType = formatRelationLabel(r.relationType);

        return (
          <MediaCard
            key={`${relNode.id}-${r.relationType}`}
            id={relNode.id}
            mediaType="anime"
            href={`/anime/${relNode.id}`}
            title={relTitle}
            posterPath={relCover}
            subtitle={`${relType} • ${relNode.format || "Anime"}`}
          />
        );
      })}
    </div>
  );
}
