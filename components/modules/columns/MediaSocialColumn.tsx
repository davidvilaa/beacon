"use client";

interface MediaSocialColumnProps {
  mediaId?: string | number;
  mediaType?: "movie" | "tv" | "anime";
  className?: string;
}

export default function MediaSocialColumn({
  mediaId,
  mediaType,
  className = "",
}: MediaSocialColumnProps) {
  return (
    <aside className={`w-full flex flex-col gap-4 ${className}`}>
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-sm p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
          Friends Activity
        </h3>
        <p className="text-xs text-zinc-500">
          Social reviews and activity will appear here.
        </p>
      </div>
    </aside>
  );
}
