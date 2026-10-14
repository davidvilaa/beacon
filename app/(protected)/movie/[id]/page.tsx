"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  Calendar,
  Film,
  ArrowLeft,
  Bookmark,
  Eye,
  Heart,
  Check,
  X,
  Star,
} from "lucide-react";
import { MovieDetails, getPosterUrl, getBackdropUrl } from "@/lib/tmdb";

function formatRuntime(minutes: number | null): string {
  if (!minutes) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function MovieDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPoster, setSelectedPoster] = useState<string | null>(null);
  const [isPosterPickerOpen, setIsPosterPickerOpen] = useState(false);

  const [isWatched, setIsWatched] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  const [activeTab, setActiveTab] = useState<"cast" | "staff" | "details">(
    "cast"
  );

  useEffect(() => {
    async function fetchMovie() {
      try {
        const res = await fetch(`/api/movies/${id}`);
        if (res.ok) {
          const data: MovieDetails = await res.json();
          setMovie(data);
          setSelectedPoster(data.poster_path);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchMovie();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#a8dadc] border-t-transparent animate-spin mb-4" />
        <p className="text-xs text-zinc-500">Cargando película...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-16 text-center">
        <p className="text-zinc-400 mb-4">No se pudo encontrar la película.</p>
        <button
          onClick={() => router.back()}
          className="text-xs text-[#a8dadc] hover:underline cursor-pointer"
        >
          ← Volver atrás
        </button>
      </div>
    );
  }

  const backdropUrl = getBackdropUrl(movie.backdrop_path, "original");
  const posterUrl = getPosterUrl(selectedPoster, "w500");
  const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : "—";
  const postersList = movie.images?.posters || [];

  const topCast = (movie.credits?.cast || []).slice(0, 15);
  const priorityJobs = [
    "Director",
    "Screenplay",
    "Writer",
    "Story",
    "Director of Photography",
    "Original Music Composer",
    "Editor",
    "Producer",
  ];
  const staffList = (movie.credits?.crew || [])
    .filter((c) => priorityJobs.includes(c.job))
    .slice(0, 15);

  return (
    <div className="relative flex-1 w-full font-[family-name:var(--font-geist-sans)] pb-20">
      {backdropUrl && (
        <div className="absolute top-0 left-0 right-0 h-96 sm:h-[480px] -z-10 overflow-hidden pointer-events-none">
          <Image
            src={backdropUrl}
            alt={movie.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-top opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-900/80 to-zinc-900" />
        </div>
      )}

      <main className="w-full max-w-5xl mx-auto px-6 pt-6 sm:pt-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400 hover:text-[#a8dadc] transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full sm:w-64 md:w-72 shrink-0 flex flex-col items-center">
            <div
              onClick={() => setIsPosterPickerOpen(true)}
              title="Haz clic para cambiar de carátula"
              className="relative aspect-[2/3] w-56 sm:w-full rounded-t-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl cursor-pointer group"
            >
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={movie.title}
                  fill
                  priority
                  sizes="(max-width: 640px) 224px, 288px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
                  <Film className="w-12 h-12 mb-2" />
                  <span className="text-xs text-zinc-500">Sin carátula</span>
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>

            <div className="w-56 sm:w-full flex items-center justify-around py-2.5 px-3 bg-zinc-900 border border-t-0 border-zinc-800 rounded-b-2xl shadow-xl">
              <button
                type="button"
                onClick={() => setIsWatched(!isWatched)}
                title={isWatched ? "Registrada" : "Registrar visionado"}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  isWatched
                    ? "text-[#a8dadc] bg-[#a8dadc]/15"
                    : "text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/60"
                }`}
              >
                <Eye className={`w-5 h-5 ${isWatched ? "stroke-[2.5]" : ""}`} />
              </button>

              <button
                type="button"
                onClick={() => setIsLiked(!isLiked)}
                title={isLiked ? "Te gusta" : "Dar like"}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  isLiked
                    ? "text-rose-400 bg-rose-500/15"
                    : "text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/60"
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-rose-400 text-rose-400" : ""}`} />
              </button>

              <button
                type="button"
                onClick={() => setIsWatchlisted(!isWatchlisted)}
                title={isWatchlisted ? "En tu watchlist" : "Añadir a watchlist"}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  isWatchlisted
                    ? "text-[#a8dadc] bg-[#a8dadc]/15"
                    : "text-zinc-400 hover:text-[#a8dadc] hover:bg-zinc-800/60"
                }`}
              >
                <Bookmark
                  className={`w-5 h-5 ${
                    isWatchlisted ? "fill-[#a8dadc] text-[#a8dadc]" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-100 tracking-tight leading-tight">
              {movie.title}
            </h1>

            {movie.original_title && movie.original_title !== movie.title && (
              <p className="text-sm text-zinc-500 italic mt-1">
                {movie.original_title}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-zinc-400 mt-3 pb-3 border-b border-zinc-800/80">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>{releaseYear}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>{formatRuntime(movie.runtime)}</span>
              </span>
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="text-[10px] sm:text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 space-y-2 max-w-2xl">
              {movie.tagline && (
                <p className="text-sm italic font-medium text-[#a8dadc]">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}
              <p className="text-sm text-zinc-300 leading-relaxed">
                {movie.overview || "Sin sinopsis disponible en español."}
              </p>
            </div>

            <div className="mt-10 pt-6 border-t border-zinc-800/80">
              <div className="flex items-center gap-6 border-b border-zinc-800/60 mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab("cast")}
                  className={`text-sm font-bold uppercase tracking-wider pb-3 transition-colors cursor-pointer border-b-2 ${
                    activeTab === "cast"
                      ? "border-[#a8dadc] text-zinc-100"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Reparto
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("staff")}
                  className={`text-sm font-bold uppercase tracking-wider pb-3 transition-colors cursor-pointer border-b-2 ${
                    activeTab === "staff"
                      ? "border-[#a8dadc] text-zinc-100"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Staff
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  className={`text-sm font-bold uppercase tracking-wider pb-3 transition-colors cursor-pointer border-b-2 ${
                    activeTab === "details"
                      ? "border-[#a8dadc] text-zinc-100"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Detalles
                </button>
              </div>

              {activeTab === "cast" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {topCast.length > 0 ? (
                    topCast.map((actor) => {
                      const actorPhoto = actor.profile_path
                        ? getPosterUrl(actor.profile_path, "w185")
                        : null;
                      return (
                        <div
                          key={actor.id}
                          className="flex items-center h-14 rounded-full bg-zinc-900/60 border border-zinc-800 hover:border-[#a8dadc]/50 hover:bg-zinc-900 transition-all pr-4 pl-0 group overflow-hidden"
                        >
                          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-zinc-800 shrink-0 border-r border-zinc-800">
                            {actorPhoto ? (
                              <Image
                                src={actorPhoto}
                                alt={actor.name}
                                fill
                                sizes="56px"
                                className="object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500 font-bold">
                                {actor.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="pl-3 min-w-0 flex-1">
                            <p className="text-xs font-semibold text-zinc-200 group-hover:text-zinc-100 truncate">
                              {actor.name}
                            </p>
                            <p className="text-[11px] text-zinc-500 truncate">
                              {actor.character}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-zinc-500 py-4">
                      No hay información de reparto disponible.
                    </p>
                  )}
                </div>
              )}

              {activeTab === "staff" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {staffList.length > 0 ? (
                    staffList.map((person, index) => {
                      const photo = person.profile_path
                        ? getPosterUrl(person.profile_path, "w185")
                        : null;
                      return (
                        <div
                          key={`${person.id}-${person.job}-${index}`}
                          className="flex items-center h-14 rounded-full bg-zinc-900/60 border border-zinc-800 hover:border-[#a8dadc]/50 hover:bg-zinc-900 transition-all pr-4 pl-0 group overflow-hidden"
                        >
                          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-zinc-800 shrink-0 border-r border-zinc-800">
                            {photo ? (
                              <Image
                                src={photo}
                                alt={person.name}
                                fill
                                sizes="56px"
                                className="object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500 font-bold">
                                {person.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="pl-3 min-w-0 flex-1">
                            <p className="text-xs font-semibold text-zinc-200 group-hover:text-zinc-100 truncate">
                              {person.name}
                            </p>
                            <p className="text-[11px] text-zinc-500 truncate">
                              {person.job}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-zinc-500 py-4">
                      No hay información de staff disponible.
                    </p>
                  )}
                </div>
              )}

              {activeTab === "details" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Título original
                    </p>
                    <p className="text-sm font-semibold text-zinc-200">
                      {movie.original_title || "—"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Estado
                    </p>
                    <p className="text-sm font-semibold text-zinc-200">
                      {movie.status || "—"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Idioma original
                    </p>
                    <p className="text-sm font-semibold text-zinc-200">
                      {movie.original_language?.toUpperCase() || "—"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Presupuesto
                    </p>
                    <p className="text-sm font-semibold text-zinc-200">
                      {movie.budget && movie.budget > 0
                        ? `$${movie.budget.toLocaleString("es-ES")}`
                        : "No disponible"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Recaudación
                    </p>
                    <p className="text-sm font-semibold text-zinc-200">
                      {movie.revenue && movie.revenue > 0
                        ? `$${movie.revenue.toLocaleString("es-ES")}`
                        : "No disponible"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Puntuación TMDB
                    </p>
                    <p className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-[#a8dadc] fill-[#a8dadc]" />
                      <span>{movie.vote_average.toFixed(1)} / 10</span>
                      <span className="text-xs text-zinc-500 font-normal">
                        ({movie.vote_count.toLocaleString("es-ES")} votos)
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {isPosterPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800/80 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsPosterPickerOpen(false)}
                aria-label="Cerrar"
                className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {postersList.map((poster, idx) => {
                const url = getPosterUrl(poster.file_path, "w342");
                const isSelected = selectedPoster === poster.file_path;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedPoster(poster.file_path);
                      setIsPosterPickerOpen(false);
                    }}
                    className={`relative aspect-[2/3] rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                      isSelected
                        ? "border-[#a8dadc] shadow-[0_0_15px_rgba(168,218,220,0.3)]"
                        : "border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    {url && (
                      <Image
                        src={url}
                        alt="Poster option"
                        fill
                        sizes="200px"
                        className="object-cover"
                      />
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#a8dadc] text-zinc-950 flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MovieDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#a8dadc] border-t-transparent animate-spin mb-4" />
          <p className="text-xs text-zinc-500">Cargando película...</p>
        </div>
      }
    >
      <MovieDetailContent />
    </Suspense>
  );
}
