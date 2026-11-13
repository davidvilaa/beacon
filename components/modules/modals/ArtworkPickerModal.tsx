"use client";

import Image from "next/image";
import { X, Check } from "lucide-react";
import Loading from "@/components/ui/Loading";
import { getPosterUrl, getBackdropUrl } from "@/lib/tmdb";

interface ArtworkPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: "poster" | "backdrop";
  images: { file_path: string }[];
  selectedImage: string | null;
  onSelectImage: (filePath: string) => void;
  isLoading?: boolean;
  zIndexClassName?: string;
}

export default function ArtworkPickerModal({
  isOpen,
  onClose,
  title,
  type,
  images,
  selectedImage,
  onSelectImage,
  isLoading = false,
  zIndexClassName,
}: ArtworkPickerModalProps) {
  if (!isOpen) return null;

  const isPoster = type === "poster";

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 ${zIndexClassName || "z-50"} bg-black/85 backdrop-blur-md flex items-center justify-center p-4`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-950 border border-zinc-800 rounded-sm w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
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
          ) : (
            <div
              className={
                isPoster
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
                  : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4"
              }
            >
              {images.map((img) => {
                const url = isPoster
                  ? getPosterUrl(img.file_path, "w342")
                  : getBackdropUrl(img.file_path, "w780");
                const isSelected = selectedImage === img.file_path;

                return (
                  <button
                    key={img.file_path}
                    type="button"
                    onClick={() => {
                      onSelectImage(img.file_path);
                      onClose();
                    }}
                    className={`relative w-full rounded-sm overflow-hidden border-2 transition-all cursor-pointer ${
                      isPoster ? "aspect-[2/3]" : "aspect-[16/9]"
                    } ${
                      isSelected
                        ? "border-[#a8dadc]"
                        : "border-zinc-800 hover:border-zinc-600 hover:opacity-80"
                    }`}
                  >
                    {url && (
                      <Image
                        src={url}
                        alt="Artwork option"
                        fill
                        sizes={
                          isPoster
                            ? "(max-width: 640px) 150px, (max-width: 1024px) 180px, 200px"
                            : "(max-width: 640px) 100vw, 300px"
                        }
                        className="object-cover"
                      />
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#a8dadc] text-zinc-950 flex items-center justify-center shadow-md z-10">
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
