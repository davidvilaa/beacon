"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Film,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PersonDetails, PersonCredit, getPosterUrl } from "@/lib/tmdb";
import Loading from "@/components/ui/Loading";
import Select from "@/components/ui/Select";

const MEDIA_OPTIONS = [
  { id: "movie", label: "Movies" },
  { id: "tv", label: "Series" },
  { id: "all", label: "All Formats" },
];

const SORT_OPTIONS = [
  { id: "popularity", label: "Most Popular" },
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
];

interface DisplayedCredit extends PersonCredit {
  asRole: string;
}

function PersonDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [mediaFilter, setMediaFilter] = useState<"all" | "movie" | "tv">("movie");
  const [sortBy, setSortBy] = useState<"popularity" | "newest" | "oldest">("popularity");
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    async function fetchPerson() {
      try {
        const res = await fetch(`/api/person/${id}`);
        if (res.ok) {
          const data: PersonDetails = await res.json();
          if (!ignore) {
            setPerson(data);
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (id) {
      fetchPerson();
    }

    return () => {
      ignore = true;
    };
  }, [id]);

  const rawCast = useMemo(() => person?.combined_credits?.cast || [], [person]);
  const rawCrew = useMemo(() => person?.combined_credits?.crew || [], [person]);

  const categorizedCredits = useMemo(() => {
    const actingMap = new Map<string, DisplayedCredit>();
    const voiceMap = new Map<string, DisplayedCredit>();
    const crewMap = new Map<string, DisplayedCredit>();
    const allMap = new Map<string, DisplayedCredit>();

    rawCast.forEach((item) => {
      const isVoice = /\(voice/i.test(item.character || "");
      const role = item.character?.trim() || "Actor";
      const key = `${item.media_type}-${item.id}`;

      if (isVoice) {
        if (!voiceMap.has(key)) {
          voiceMap.set(key, { ...item, asRole: role });
        } else {
          const existing = voiceMap.get(key)!;
          if (role && !existing.asRole.split(", ").includes(role)) {
            existing.asRole += `, ${role}`;
          }
        }
      } else {
        if (!actingMap.has(key)) {
          actingMap.set(key, { ...item, asRole: role });
        } else {
          const existing = actingMap.get(key)!;
          if (role && !existing.asRole.split(", ").includes(role)) {
            existing.asRole += `, ${role}`;
          }
        }
      }

      if (!allMap.has(key)) {
        allMap.set(key, { ...item, asRole: role });
      } else {
        const existing = allMap.get(key)!;
        if (role && !existing.asRole.split(", ").includes(role)) {
          existing.asRole += `, ${role}`;
        }
      }
    });

    rawCrew.forEach((item) => {
      const key = `${item.media_type}-${item.id}`;
      const role = item.job?.trim() || item.department?.trim() || "Crew";

      if (!crewMap.has(key)) {
        crewMap.set(key, { ...item, asRole: role });
      } else {
        const existing = crewMap.get(key)!;
        if (role && !existing.asRole.split(", ").includes(role)) {
          existing.asRole += `, ${role}`;
        }
      }

      if (!allMap.has(key)) {
        allMap.set(key, { ...item, asRole: role });
      } else {
        const existing = allMap.get(key)!;
        if (role && !existing.asRole.split(", ").includes(role)) {
          existing.asRole += `, ${role}`;
        }
      }
    });

    return {
      all: Array.from(allMap.values()),
      acting: Array.from(actingMap.values()),
      voice: Array.from(voiceMap.values()),
      crew: Array.from(crewMap.values()),
    };
  }, [rawCast, rawCrew]);

  const availableTabs = useMemo(() => {
    const list: { id: string; label: string }[] = [
      { id: "all", label: "All Roles" },
    ];

    if (categorizedCredits.acting.length > 0) {
      list.push({
        id: "acting",
        label: "Acting",
      });
    }

    if (categorizedCredits.voice.length > 0) {
      list.push({
        id: "voice",
        label: "Voice Acting",
      });
    }

    if (categorizedCredits.crew.length > 0) {
      list.push({
        id: "crew",
        label: "Crew",
      });
    }

    return list;
  }, [categorizedCredits]);

  const displayedCredits = useMemo(() => {
    let list: DisplayedCredit[] = [];

    switch (selectedRole) {
      case "acting":
        list = categorizedCredits.acting;
        break;
      case "voice":
        list = categorizedCredits.voice;
        break;
      case "crew":
        list = categorizedCredits.crew;
        break;
      default:
        list = categorizedCredits.all;
        break;
    }

    if (mediaFilter !== "all") {
      list = list.filter((item) => item.media_type === mediaFilter);
    }

    return [...list].sort((a, b) => {
      if (sortBy === "popularity") {
        const votesA = a.vote_count ?? 0;
        const votesB = b.vote_count ?? 0;
        if (votesB !== votesA) return votesB - votesA;
        return (b.popularity ?? 0) - (a.popularity ?? 0);
      }

      const dateA = a.release_date || a.first_air_date || "";
      const dateB = b.release_date || b.first_air_date || "";

      if (sortBy === "newest") {
        if (!dateA && !dateB) return (b.vote_count ?? 0) - (a.vote_count ?? 0);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.localeCompare(dateA);
      }

      if (sortBy === "oldest") {
        if (!dateA && !dateB) return (b.vote_count ?? 0) - (a.vote_count ?? 0);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.localeCompare(dateB);
      }

      return 0;
    });
  }, [selectedRole, mediaFilter, sortBy, categorizedCredits]);

  if (loading) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
        <Loading />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 text-center">
        <p className="text-zinc-400 mb-4">Person could not be found.</p>
        <button
          onClick={() => router.back()}
          className="text-xs text-[#a8dadc] hover:underline cursor-pointer"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const profileUrl = getPosterUrl(person.profile_path, "w500");
  const bio = person.biography || "";
  const isBioLong = bio.length > 400;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 font-[family-name:var(--font-geist-sans)]">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        <aside className="w-full lg:w-80 shrink-0">
          <div className="w-56 sm:w-64 lg:w-full mx-auto rounded-2xl overflow-hidden bg-zinc-900/40 border border-zinc-800 shadow-xl">
            <div className="relative aspect-[2/3] w-full bg-zinc-900 border-b border-zinc-800">
              {profileUrl ? (
                <Image
                  src={profileUrl}
                  alt={person.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 256px, 320px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 bg-zinc-900">
                  <User className="w-20 h-20 mb-2 stroke-[1.5]" />
                  <span className="text-xs uppercase tracking-wider font-bold text-zinc-600">
                    No Photo
                  </span>
                </div>
              )}
            </div>

            <div className="p-5 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800">
                Biography
              </h3>
              {bio ? (
                <div>
                  <p
                    className={`text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap ${
                      !isBioExpanded && isBioLong ? "line-clamp-6" : ""
                    }`}
                  >
                    {bio}
                  </p>
                  {isBioLong && (
                    <button
                      type="button"
                      onClick={() => setIsBioExpanded(!isBioExpanded)}
                      className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-[#a8dadc] hover:underline cursor-pointer"
                    >
                      <span>{isBioExpanded ? "Show less" : "Read more"}</span>
                      {isBioExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">
                  We don&apos;t have a biography for {person.name} yet.
                </p>
              )}
            </div>
          </div>
        </aside>

        <section className="flex-1 min-w-0 w-full">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Starring
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-100 tracking-tight leading-tight">
              {person.name}
            </h1>
          </div>

          <div className="mt-4 sm:mt-5 pb-3.5 border-b border-zinc-800/80 flex items-center gap-2.5 flex-wrap">
            <Select
              value={selectedRole}
              onChange={(val) => setSelectedRole(val)}
              options={availableTabs}
              variant="compact"
              className="w-36 sm:w-40"
            />

            <Select
              value={mediaFilter}
              onChange={(val) => setMediaFilter(val as "all" | "movie" | "tv")}
              options={MEDIA_OPTIONS}
              variant="compact"
              className="w-36 sm:w-40"
            />

            <Select
              value={sortBy}
              onChange={(val) => setSortBy(val as "popularity" | "newest" | "oldest")}
              options={SORT_OPTIONS}
              variant="compact"
              className="w-36 sm:w-40"
            />
          </div>

          <div className="mt-6">
            {displayedCredits.length === 0 ? (
              <div className="py-20 rounded-xl border border-zinc-800/40 bg-zinc-900/10 min-h-[180px]" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {displayedCredits.map((credit, idx) => {
                  const posterUrl = getPosterUrl(credit.poster_path, "w500");
                  const title = credit.title || credit.name || "Untitled";

                  const isMovie = credit.media_type === "movie";
                  const cardClass =
                    "group flex flex-col rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:border-[#a8dadc]/60 transition-all cursor-pointer";

                  const cardContent = (
                    <>
                      <div className="relative aspect-[2/3] w-full bg-zinc-900 border-b border-zinc-800/80 overflow-hidden">
                        {posterUrl ? (
                          <Image
                            src={posterUrl}
                            alt={title}
                            fill
                            sizes="(max-width: 640px) 180px, (max-width: 1024px) 240px, 280px"
                            className="object-cover group-hover:opacity-90 transition-opacity"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-zinc-900">
                            <Film className="w-8 h-8 text-zinc-700 mb-1" />
                            <span className="text-[10px] text-zinc-500 font-semibold line-clamp-2">
                              {title}
                            </span>
                          </div>
                        )}

                        {credit.media_type === "tv" && (
                          <div className="absolute top-2 left-2">
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-950/80 backdrop-blur-md text-zinc-300 border border-zinc-800">
                              TV
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="py-2.5 px-3 bg-zinc-900/50 group-hover:bg-zinc-900/80 transition-colors text-center">
                        <p
                          className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors truncate"
                          title={`${title}${credit.asRole ? ` (as ${credit.asRole})` : ""}`}
                        >
                          as <span className="text-zinc-200 font-medium">{credit.asRole || "Actor"}</span>
                        </p>
                      </div>
                    </>
                  );

                  if (isMovie) {
                    return (
                      <Link
                        key={`${credit.media_type}-${credit.id}-${idx}`}
                        href={`/movie/${credit.id}`}
                        className={cardClass}
                      >
                        {cardContent}
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={`${credit.media_type}-${credit.id}-${idx}`}
                      className={cardClass}
                    >
                      {cardContent}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function PersonPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      }
    >
      <PersonDetailContent />
    </Suspense>
  );
}
