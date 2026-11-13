"use client";

import React from "react";
import Image from "next/image";

interface MediaLayoutProps {
  backdropUrl: string | null;
  backdropAlt?: string;
  isBackdropLoaded: boolean;
  onBackdropLoaded?: () => void;
  hasMultipleBackdrops?: boolean;
  onOpenBackdropPicker?: () => void;
  posterColumn?: React.ReactNode;
  children: React.ReactNode;
  socialColumn?: React.ReactNode;
  bottomPaddingClassName?: string;
}

export default function MediaLayout({
  backdropUrl,
  backdropAlt = "Backdrop",
  isBackdropLoaded,
  onBackdropLoaded,
  hasMultipleBackdrops = false,
  onOpenBackdropPicker,
  posterColumn,
  children,
  socialColumn,
  bottomPaddingClassName = "pb-72 sm:pb-80",
}: MediaLayoutProps) {
  const isBackdropClickable = hasMultipleBackdrops && Boolean(onOpenBackdropPicker);

  return (
    <div
      className={`relative flex-1 w-full font-[family-name:var(--font-geist-sans)] ${bottomPaddingClassName}`}
    >
      {backdropUrl && (
        <div
          onClick={isBackdropClickable ? onOpenBackdropPicker : undefined}
          className={`absolute top-0 left-0 right-0 h-[380px] sm:h-[460px] md:h-[520px] lg:h-[560px] overflow-hidden select-none z-0 ${
            isBackdropClickable
              ? "cursor-pointer group pointer-events-auto"
              : "pointer-events-none"
          }`}
          title={isBackdropClickable ? "Change backdrop" : undefined}
        >
          <div
            className="relative mx-auto w-full max-w-[1550px] h-full"
            style={{
              maskImage:
                "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.03) 2%, rgba(0,0,0,0.12) 5%, rgba(0,0,0,0.30) 9%, rgba(0,0,0,0.60) 13%, rgba(0,0,0,0.88) 17%, rgba(0,0,0,1) 21%, rgba(0,0,0,1) 79%, rgba(0,0,0,0.88) 83%, rgba(0,0,0,0.60) 87%, rgba(0,0,0,0.30) 91%, rgba(0,0,0,0.12) 95%, rgba(0,0,0,0.03) 98%, rgba(0,0,0,0) 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.03) 2%, rgba(0,0,0,0.12) 5%, rgba(0,0,0,0.30) 9%, rgba(0,0,0,0.60) 13%, rgba(0,0,0,0.88) 17%, rgba(0,0,0,1) 21%, rgba(0,0,0,1) 79%, rgba(0,0,0,0.88) 83%, rgba(0,0,0,0.60) 87%, rgba(0,0,0,0.30) 91%, rgba(0,0,0,0.12) 95%, rgba(0,0,0,0.03) 98%, rgba(0,0,0,0) 100%)",
            }}
          >
            <div
              className="relative w-full h-full"
              style={{
                maskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 35%, rgba(0,0,0,0.65) 65%, rgba(0,0,0,0.2) 85%, rgba(0,0,0,0) 98%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 35%, rgba(0,0,0,0.65) 65%, rgba(0,0,0,0.2) 85%, rgba(0,0,0,0) 98%)",
              }}
            >
              <Image
                src={backdropUrl}
                alt={backdropAlt}
                fill
                priority
                sizes="(max-width: 1550px) 100vw, 1550px"
                onLoad={onBackdropLoaded}
                className={`object-cover object-top transition-opacity duration-500 ease-out ${
                  isBackdropLoaded ? "opacity-95 sm:opacity-100" : "opacity-0"
                }`}
              />

              {isBackdropClickable && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              )}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-zinc-950/60 to-transparent pointer-events-none" />
        </div>
      )}

      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-6 sm:pt-8 pointer-events-none">
        <div
          className={`flex flex-col ${
            posterColumn ? "md:flex-row gap-8 items-start" : "w-full"
          } pointer-events-auto ${
            backdropUrl ? "mt-64 sm:mt-80 md:mt-96 lg:mt-[460px]" : ""
          }`}
        >
          {posterColumn && (
            <div className="w-full sm:w-64 md:w-72 shrink-0 flex flex-col items-center">
              {posterColumn}
            </div>
          )}

          <div className="flex-1 min-w-0 w-full">{children}</div>

          {socialColumn && (
            <div className="w-full lg:w-72 shrink-0">{socialColumn}</div>
          )}
        </div>
      </main>
    </div>
  );
}
