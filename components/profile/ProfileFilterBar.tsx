"use client";

import Select, { Option } from "@/components/ui/Select";

interface ProfileFilterBarProps {
  statusValue: string;
  onStatusChange: (val: string) => void;
  statusOptions: Option[];
  favoriteValue: string;
  onFavoriteChange: (val: string) => void;
  favoriteOptions: Option[];
  sortValue: string;
  onSortChange: (val: string) => void;
  sortOptions: Option[];
  totalCount: number;
  itemLabel: string;
}

export default function ProfileFilterBar({
  statusValue,
  onStatusChange,
  statusOptions,
  favoriteValue,
  onFavoriteChange,
  favoriteOptions,
  sortValue,
  onSortChange,
  sortOptions,
  totalCount,
  itemLabel,
}: ProfileFilterBarProps) {
  return (
    <div className="pb-4 mb-6 border-b border-zinc-800/80 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2.5 flex-wrap">
        <Select
          value={statusValue}
          onChange={onStatusChange}
          options={statusOptions}
          variant="compact"
          className="w-36 sm:w-40"
        />

        <Select
          value={favoriteValue}
          onChange={onFavoriteChange}
          options={favoriteOptions}
          variant="compact"
          className="w-36 sm:w-40"
        />

        <Select
          value={sortValue}
          onChange={onSortChange}
          options={sortOptions}
          variant="compact"
          className="w-40 sm:w-44"
        />
      </div>

      <span className="text-xs font-semibold text-zinc-500 shrink-0">
        {totalCount} {itemLabel}
        {totalCount === 1 ? "" : "s"}
      </span>
    </div>
  );
}
