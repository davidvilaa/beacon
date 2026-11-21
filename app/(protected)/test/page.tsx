"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
  ImageIcon,
  Film,
  Tv,
  Gamepad2,
  Layers,
  Sparkles,
  Maximize2,
} from "lucide-react";

interface SearchResultItem {
  id: number | string;
  title?: string;
  name?: string;
  original_title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  media_type?: string;
  moduleType?: string;
  vote_average?: number;
  popularity?: number;
}

interface RawPosterItem {
  id: string;
  url: string;
  thumbnail_url: string;
  file_path?: string;
  width?: number;
  height?: number;
  aspect_ratio?: number;
  iso_639_1?: string | null;
  vote_average?: number;
  vote_count?: number;
  media_category: "poster" | "backdrop" | "logo" | "artwork" | "screenshot" | "cover";
  source: "tmdb" | "anilist" | "igdb";
  season_number?: number;
  season_name?: string;
}

interface ItemPostersState {
  loading: boolean;
  error: string | null;
  images: RawPosterItem[];
  total_count: number;
  posters_count: number;
  backdrops_count: number;
}

export default function TestPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [postersMap, setPostersMap] = useState<Record<string, ItemPostersState>>({});
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<"all" | "poster" | "backdrop">("poster");
  const [selectedLang, setSelectedLang] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"default" | "resolution" | "votes">("default");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<RawPosterItem | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setSearching(false);
      return;
    }

    let isCancelled = false;
    setSearching(true);

    fetch(`/api/movies/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled) {
          const raw = data.results || [];
          const filtered = raw.filter((item: any) =>
            ["movie", "tv", "anime", "game"].includes(item.media_type)
          );
          setResults(filtered);
          setSearching(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setResults([]);
          setSearching(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery]);

  const toggleItem = (item: SearchResultItem) => {
    const itemKey = `${item.media_type || "movie"}-${item.id}`;

    if (expandedId === itemKey) {
      setExpandedId(null);
      return;
    }

    setExpandedId(itemKey);
    setSelectedLang("all");

    if (postersMap[itemKey]?.images?.length) {
      return;
    }

    setPostersMap((prev) => ({
      ...prev,
      [itemKey]: {
        loading: true,
        error: null,
        images: [],
        total_count: 0,
        posters_count: 0,
        backdrops_count: 0,
      },
    }));

    const mediaType = item.media_type || (item.moduleType === "series" ? "tv" : item.moduleType) || "movie";

    fetch(`/api/test/posters?id=${item.id}&media_type=${mediaType}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setPostersMap((prev) => ({
            ...prev,
            [itemKey]: {
              loading: false,
              error: data.error,
              images: [],
              total_count: 0,
              posters_count: 0,
              backdrops_count: 0,
            },
          }));
        } else {
          setPostersMap((prev) => ({
            ...prev,
            [itemKey]: {
              loading: false,
              error: null,
              images: data.images || [],
              total_count: data.total_count || 0,
              posters_count: data.posters_count || 0,
              backdrops_count: data.backdrops_count || 0,
            },
          }));
        }
      })
      .catch((err) => {
        setPostersMap((prev) => ({
          ...prev,
          [itemKey]: {
            loading: false,
            error: err?.message || "Error al cargar portadas",
            images: [],
            total_count: 0,
            posters_count: 0,
            backdrops_count: 0,
          },
        }));
      });
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const getMediaBadge = (mediaType?: string) => {
    switch (mediaType) {
      case "movie":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <Film className="w-3 h-3" /> Película
          </span>
        );
      case "tv":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-950/80 text-sky-400 border border-sky-800/60">
            <Tv className="w-3 h-3" /> Serie TV
          </span>
        );
      case "anime":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-950/80 text-purple-400 border border-purple-800/60">
            <Sparkles className="w-3 h-3" /> Anime
          </span>
        );
      case "game":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/80 text-amber-400 border border-amber-800/60">
            <Gamepad2 className="w-3 h-3" /> Videojuego
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            {mediaType || "Media"}
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-red-950/50 border border-red-800/50 text-red-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Laboratorio de Portadas &amp; Arte Raw
            </h1>
            <p className="text-sm text-zinc-400">
              Buscador sin filtros conectado a las 4 APIs (TMDB, AniList, IGDB). Haz clic en cualquier resultado para abrir todas sus portadas directas sin descartar ningún idioma ni variantes.
            </p>
          </div>
        </div>

        <div className="relative mt-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar película (ej: Avengers, Spider-Man, Batman), serie, anime o videojuego..."
            className="w-full pl-12 pr-12 py-3.5 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors text-base"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                searchInputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {searching && (
        <div className="flex items-center justify-center py-12 text-zinc-400 gap-3">
          <div className="w-5 h-5 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" />
          <span>Buscando en todas las bases de datos...</span>
        </div>
      )}

      {!searching && query.trim() && results.length === 0 && (
        <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <p className="text-zinc-400">No se encontraron resultados para &ldquo;{query}&rdquo;.</p>
        </div>
      )}

      <div className="space-y-4">
        {results.map((item) => {
          const itemKey = `${item.media_type || "movie"}-${item.id}`;
          const isExpanded = expandedId === itemKey;
          const postersState = postersMap[itemKey];
          const title = item.title || item.name || item.original_title || "Sin título";
          const year = item.release_date ? item.release_date.slice(0, 4) : "";
          const posterThumb = item.poster_path
            ? item.poster_path.startsWith("http")
              ? item.poster_path
              : `https://image.tmdb.org/t/p/w185${item.poster_path}`
            : null;

          return (
            <div
              key={itemKey}
              className={`rounded-xl border transition-all ${
                isExpanded
                  ? "bg-zinc-900 border-zinc-600"
                  : "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
              }`}
            >
              <button
                onClick={() => toggleItem(item)}
                className="w-full text-left p-4 flex items-center gap-4 focus:outline-none cursor-pointer"
              >
                <div className="relative w-12 h-16 sm:w-14 sm:h-20 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0 border border-zinc-700/50">
                  {posterThumb ? (
                    <Image
                      src={posterThumb}
                      alt={title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base sm:text-lg font-semibold text-zinc-100 truncate">
                      {title}
                    </h3>
                    {year && <span className="text-xs text-zinc-400">({year})</span>}
                    {getMediaBadge(item.media_type)}
                    <span className="text-xs text-zinc-500 font-mono">ID: {item.id}</span>
                  </div>
                  {item.overview && (
                    <p className="text-xs sm:text-sm text-zinc-400 line-clamp-1 max-w-4xl">
                      {item.overview}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 pl-2 text-zinc-400 flex-shrink-0">
                  <span className="text-xs hidden sm:inline-block font-medium">
                    {isExpanded ? "Ocultar portadas" : "Ver portadas raw"}
                  </span>
                  <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-zinc-800 p-4 sm:p-6 bg-zinc-950/60 rounded-b-xl">
                  {postersState?.loading && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400">
                      <div className="w-8 h-8 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" />
                      <p className="text-sm font-medium">
                        Cargando todas las portadas mundiales sin filtros de {title}...
                      </p>
                    </div>
                  )}

                  {postersState?.error && (
                    <div className="p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-sm">
                      Error: {postersState.error}
                    </div>
                  )}

                  {postersState && !postersState.loading && !postersState.error && (
                    <ExpandedPostersView
                      state={postersState}
                      activeCategory={activeCategoryFilter}
                      setActiveCategory={setActiveCategoryFilter}
                      selectedLang={selectedLang}
                      setSelectedLang={setSelectedLang}
                      sortBy={sortBy}
                      setSortBy={setSortBy}
                      onCopy={handleCopy}
                      copiedUrl={copiedUrl}
                      onPreview={(img) => setPreviewImage(img)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-auto max-h-[75vh] overflow-hidden rounded-lg border border-zinc-700">
              <img
                src={previewImage.url}
                alt="Enlarged poster"
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>

            <div className="mt-4 flex items-center gap-4 flex-wrap justify-center text-xs text-zinc-300 bg-zinc-900/90 px-4 py-2.5 rounded-lg border border-zinc-700">
              {previewImage.width && previewImage.height && (
                <span>
                  <strong>Resolución:</strong> {previewImage.width} &times; {previewImage.height}
                </span>
              )}
              <span>
                <strong>Idioma:</strong>{" "}
                {previewImage.iso_639_1 ? previewImage.iso_639_1.toUpperCase() : "Textless / Null"}
              </span>
              {previewImage.vote_average !== undefined && (
                <span>
                  <strong>Votos:</strong> &starf; {previewImage.vote_average} ({previewImage.vote_count ?? 0})
                </span>
              )}
              {previewImage.season_number !== undefined && (
                <span>
                  <strong>Temporada:</strong> {previewImage.season_name || `Temporada ${previewImage.season_number}`}
                </span>
              )}
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-medium underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Abrir imagen original
              </a>
              <button
                onClick={() => handleCopy(previewImage.url)}
                className="flex items-center gap-1 text-zinc-300 hover:text-zinc-100 font-medium ml-2"
              >
                {copiedUrl === previewImage.url ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copiar enlace
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-full border border-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpandedPostersView({
  state,
  activeCategory,
  setActiveCategory,
  selectedLang,
  setSelectedLang,
  sortBy,
  setSortBy,
  onCopy,
  copiedUrl,
  onPreview,
}: {
  state: ItemPostersState;
  activeCategory: "all" | "poster" | "backdrop";
  setActiveCategory: (cat: "all" | "poster" | "backdrop") => void;
  selectedLang: string;
  setSelectedLang: (lang: string) => void;
  sortBy: "default" | "resolution" | "votes";
  setSortBy: (sb: "default" | "resolution" | "votes") => void;
  onCopy: (url: string) => void;
  copiedUrl: string | null;
  onPreview: (img: RawPosterItem) => void;
}) {
  const allImages = state.images || [];

  const languages = Array.from(
    new Set(allImages.map((i) => (i.iso_639_1 ? i.iso_639_1.toLowerCase() : "null")))
  ).sort((a, b) => {
    if (a === "null") return -1;
    if (b === "null") return 1;
    if (a === "en") return -1;
    if (b === "en") return 1;
    return a.localeCompare(b);
  });

  const categoryFiltered = allImages.filter((img) => {
    if (activeCategory === "all") return true;
    return img.media_category === activeCategory;
  });

  const langFiltered = categoryFiltered.filter((img) => {
    if (selectedLang === "all") return true;
    const l = img.iso_639_1 ? img.iso_639_1.toLowerCase() : "null";
    return l === selectedLang;
  });

  const sortedImages = [...langFiltered].sort((a, b) => {
    if (sortBy === "resolution") {
      const resA = (a.width || 0) * (a.height || 0);
      const resB = (b.width || 0) * (b.height || 0);
      return resB - resA;
    }
    if (sortBy === "votes") {
      const vA = (a.vote_count || 0) * (a.vote_average || 0);
      const vB = (b.vote_count || 0) * (b.vote_average || 0);
      return vB - vA;
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-zinc-100">
              {allImages.length} imágenes raw encontradas
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-medium">
              {state.posters_count} Portadas
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/60 font-medium">
              {state.backdrops_count} Fondos/Artworks
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Sin descarte por idioma, sin recorte de relación de aspecto, y sin deduplicación hash.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <div className="inline-flex rounded-lg p-0.5 bg-zinc-900 border border-zinc-700 text-xs font-medium">
            <button
              onClick={() => setActiveCategory("poster")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeCategory === "poster"
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Portadas ({state.posters_count})
            </button>
            <button
              onClick={() => setActiveCategory("backdrop")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeCategory === "backdrop"
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Fondos ({state.backdrops_count})
            </button>
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeCategory === "all"
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Todas ({allImages.length})
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none"
          >
            <option value="default">Orden TMDB/API</option>
            <option value="resolution">Mayor resolución</option>
            <option value="votes">Mayor puntuación</option>
          </select>
        </div>
      </div>

      {languages.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs text-zinc-400 font-medium mr-1 flex-shrink-0">
            Filtrar idioma:
          </span>
          <button
            onClick={() => setSelectedLang("all")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex-shrink-0 ${
              selectedLang === "all"
                ? "bg-zinc-100 text-zinc-900"
                : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-700"
            }`}
          >
            Todos ({categoryFiltered.length})
          </button>
          {languages.map((lang) => {
            const count = categoryFiltered.filter(
              (i) => (i.iso_639_1 ? i.iso_639_1.toLowerCase() : "null") === lang
            ).length;
            if (count === 0) return null;
            const label = lang === "null" ? "Textless" : lang.toUpperCase();

            return (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex-shrink-0 ${
                  selectedLang === lang
                    ? "bg-zinc-100 text-zinc-900"
                    : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-700"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {sortedImages.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          No hay imágenes que coincidan con los filtros seleccionados.
        </div>
      ) : (
        <div
          className={`grid gap-4 ${
            activeCategory === "backdrop"
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          }`}
        >
          {sortedImages.map((img) => (
            <PosterCard
              key={img.id}
              img={img}
              onCopy={onCopy}
              isCopied={copiedUrl === img.url}
              onPreview={onPreview}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PosterCard({
  img,
  onCopy,
  isCopied,
  onPreview,
}: {
  img: RawPosterItem;
  onCopy: (url: string) => void;
  isCopied: boolean;
  onPreview: (img: RawPosterItem) => void;
}) {
  const isBackdrop = img.media_category === "backdrop";
  const langLabel = img.iso_639_1 ? img.iso_639_1.toUpperCase() : "TEXTLESS";

  return (
    <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden hover:border-zinc-600 transition-all flex flex-col">
      <div
        className={`relative w-full cursor-pointer bg-zinc-950 overflow-hidden ${
          isBackdrop ? "aspect-video" : "aspect-[2/3]"
        }`}
        onClick={() => onPreview(img)}
      >
        <img
          src={img.thumbnail_url}
          alt="Poster"
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        />

        <div className="absolute top-2 left-2 z-10">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${
              img.iso_639_1
                ? "bg-zinc-900/90 text-zinc-100 border border-zinc-700"
                : "bg-purple-950/90 text-purple-300 border border-purple-800"
            }`}
          >
            {langLabel}
          </span>
        </div>

        {img.width && img.height && (
          <div className="absolute top-2 right-2 z-10">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/80 text-zinc-300 border border-zinc-800">
              {img.width}&times;{img.height}
            </span>
          </div>
        )}

        {img.season_number !== undefined && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-950/90 text-sky-300 border border-sky-800">
              T{img.season_number}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(img);
            }}
            className="p-2 rounded-full bg-zinc-900/90 text-zinc-100 hover:bg-zinc-800 border border-zinc-700 transition-transform hover:scale-110"
            title="Vista previa ampliada"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <a
            href={img.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-full bg-zinc-900/90 text-zinc-100 hover:bg-zinc-800 border border-zinc-700 transition-transform hover:scale-110"
            title="Abrir imagen original"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="p-2.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
        <div className="truncate">
          {img.vote_average !== undefined && img.vote_average > 0 ? (
            <span className="text-amber-400 font-medium">
              &starf; {img.vote_average.toFixed(1)}{" "}
              <span className="text-zinc-500">({img.vote_count ?? 0})</span>
            </span>
          ) : (
            <span className="text-zinc-500 font-mono">
              {img.aspect_ratio ? `AR: ${img.aspect_ratio}` : img.source.toUpperCase()}
            </span>
          )}
        </div>

        <button
          onClick={() => onCopy(img.url)}
          className="hover:text-zinc-100 transition-colors flex items-center gap-1 font-medium ml-2"
          title="Copiar URL directa"
        >
          {isCopied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
