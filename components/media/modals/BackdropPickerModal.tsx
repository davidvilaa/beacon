"use client";

import Image from "next/image";
import { X, Check } from "lucide-react";
import Loading from "@/components/ui/Loading";
import { getBackdropUrl } from "@/lib/providers/tmdb/client";

interface BackdropPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  images: { file_path: string }[];
  selectedImage: string | null;
  onSelectImage: (filePath: string) => void;
  isLoading?: boolean;
  zIndexClassName?: string;
}

export default function BackdropPickerModal({
  isOpen,
  onClose,
  title = "CHANGE BACKDROP",
  images,
  selectedImage,
  onSelectImage,
  isLoading = false,
  zIndexClassName,
}: BackdropPickerModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 ${zIndexClassName || "z-50"} bg-black/85 backdrop-blur-md flex items-center justify-center p-4`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-950 border border-zinc-800 rounded-sm w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="p-3.5 sm:px-5 border-b border-zinc-800/80 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-zinc-400 hover:text-white p-1.5 rounded-sm hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loading />
            </div>
          ) : images.length === 0 ? (
            <div className="flex items-center justify-center py-24 text-zinc-500 text-sm">
              No backdrops available
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {images.map((img) => {
                const url = getBackdropUrl(img.file_path, "w780");
                const isSelected = selectedImage === img.file_path;

                return (
                  <button
                    key={img.file_path}
                    type="button"
                    onClick={() => {
                      onSelectImage(img.file_path);
                      onClose();
                    }}
                    className={`relative w-full aspect-video rounded-sm overflow-hidden border-2 transition-all cursor-pointer ${
                      isSelected
                        ? "border-accent"
                        : "border-zinc-800 hover:border-zinc-600 hover:opacity-90"
                    }`}
                  >
                    {url && (
                      <Image
                        src={url}
                        alt="Backdrop option"
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    )}
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-accent text-zinc-950 flex items-center justify-center shadow-md z-10">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
