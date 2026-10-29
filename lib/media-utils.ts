export function formatRuntime(minutes: number | null): string {
  if (!minutes) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

export function formatFullDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const [year, month, day] = parts;
  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const mIndex = parseInt(month, 10) - 1;
  const monthName = MONTHS[mIndex] || month;
  return `${monthName} ${parseInt(day, 10)}, ${year}`;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (!amount || amount <= 0) return "Not available";
  return `$${amount.toLocaleString("en-US")}`;
}

interface CrewSectionConfig {
  key: string;
  singular: string;
  plural: string;
  jobs: string[];
}

const MOVIE_CREW_SECTIONS: CrewSectionConfig[] = [
  {
    key: "directors",
    singular: "Director",
    plural: "Directors",
    jobs: ["Director"],
  },
  {
    key: "producers",
    singular: "Producer",
    plural: "Producers",
    jobs: ["Producer", "Co-Producer"],
  },
  {
    key: "exec_producers",
    singular: "Executive Producer",
    plural: "Executive Producers",
    jobs: ["Executive Producer", "Associate Producer"],
  },
  {
    key: "writers",
    singular: "Writer",
    plural: "Writers",
    jobs: [
      "Screenplay",
      "Writer",
      "Story",
      "Original Story",
      "Author",
      "Characters",
      "Novel",
      "Adaptation",
    ],
  },
  {
    key: "casting",
    singular: "Casting",
    plural: "Casting",
    jobs: ["Casting", "Casting Director"],
  },
  {
    key: "editors",
    singular: "Editor",
    plural: "Editors",
    jobs: ["Editor", "Film Editor", "Supervising Film Editor"],
  },
  {
    key: "cinematography",
    singular: "Cinematography",
    plural: "Cinematography",
    jobs: ["Director of Photography", "Cinematography"],
  },
  {
    key: "production_design",
    singular: "Production Design",
    plural: "Production Design",
    jobs: ["Production Design", "Art Direction", "Set Decoration"],
  },
  {
    key: "costume_design",
    singular: "Costume Design",
    plural: "Costume Design",
    jobs: ["Costume Design", "Costume Supervisor"],
  },
  {
    key: "makeup",
    singular: "Hair & Makeup",
    plural: "Hair & Makeup",
    jobs: [
      "Makeup Artist",
      "Hair Department Head",
      "Makeup Department Head",
      "Key Makeup Artist",
      "Hairstylist",
    ],
  },
  {
    key: "music",
    singular: "Music",
    plural: "Music",
    jobs: ["Original Music Composer", "Music", "Music Supervisor"],
  },
  {
    key: "sound",
    singular: "Sound",
    plural: "Sound",
    jobs: [
      "Sound Designer",
      "Sound Re-Recording Mixer",
      "Supervising Sound Editor",
      "Sound Mixer",
      "Sound Effects Editor",
    ],
  },
  {
    key: "vfx",
    singular: "Visual Effects",
    plural: "Visual Effects",
    jobs: [
      "Visual Effects Supervisor",
      "Animation Supervisor",
      "Visual Effects Producer",
    ],
  },
];

export function getMovieCrewSections(crew?: { id: number; name: string; job?: string }[]) {
  const raw = crew || [];
  return MOVIE_CREW_SECTIONS.map((section) => {
    const peopleMap = new Map<number, { id: number; name: string }>();
    raw.forEach((member) => {
      if (member && member.job && section.jobs.includes(member.job)) {
        if (!peopleMap.has(member.id)) {
          peopleMap.set(member.id, { id: member.id, name: member.name });
        }
      }
    });
    const people = Array.from(peopleMap.values());
    return {
      key: section.key,
      label: people.length > 1 ? section.plural : section.singular,
      people,
    };
  }).filter((section) => section.people.length > 0);
}

export function getTvCrewSections(
  crew?: { id: number; name: string; job?: string }[],
  createdBy?: { id: number; name: string }[]
) {
  const sections: { key: string; label: string; people: { id: number; name: string }[] }[] = [];

  if (createdBy && createdBy.length > 0) {
    sections.push({
      key: "creators",
      label: createdBy.length === 1 ? "Creator" : "Creators",
      people: createdBy.map((c) => ({ id: c.id, name: c.name })),
    });
  }

  const directors: { id: number; name: string }[] = [];
  const writers: { id: number; name: string }[] = [];
  const producers: { id: number; name: string }[] = [];
  const dop: { id: number; name: string }[] = [];

  const seenDir = new Set<number>();
  const seenWrit = new Set<number>();
  const seenProd = new Set<number>();
  const seenDop = new Set<number>();

  (crew || []).forEach((m) => {
    const job = m.job?.toLowerCase() || "";
    if (job.includes("director") && !job.includes("photography") && !job.includes("casting")) {
      if (!seenDir.has(m.id)) {
        seenDir.add(m.id);
        directors.push({ id: m.id, name: m.name });
      }
    } else if (job.includes("writer") || job.includes("screenplay") || job.includes("story")) {
      if (!seenWrit.has(m.id)) {
        seenWrit.add(m.id);
        writers.push({ id: m.id, name: m.name });
      }
    } else if (job.includes("producer")) {
      if (!seenProd.has(m.id)) {
        seenProd.add(m.id);
        producers.push({ id: m.id, name: m.name });
      }
    } else if (job.includes("photography") || job.includes("cinematograph")) {
      if (!seenDop.has(m.id)) {
        seenDop.add(m.id);
        dop.push({ id: m.id, name: m.name });
      }
    }
  });

  if (directors.length > 0) {
    sections.push({
      key: "directors",
      label: directors.length === 1 ? "Director" : "Directors",
      people: directors,
    });
  }
  if (writers.length > 0) {
    sections.push({
      key: "writers",
      label: writers.length === 1 ? "Writer" : "Writers",
      people: writers,
    });
  }
  if (producers.length > 0) {
    sections.push({
      key: "producers",
      label: producers.length === 1 ? "Producer" : "Producers",
      people: producers,
    });
  }
  if (dop.length > 0) {
    sections.push({
      key: "cinematography",
      label: "Cinematography",
      people: dop,
    });
  }
  return sections;
}

export function getReleaseDateGroups(results?: any[]) {
  const raw = results || [];
  let regionNames: Intl.DisplayNames | null = null;
  try {
    regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    regionNames = null;
  }

  const map = new Map<string, { code: string; country: string; certification: string }[]>();

  raw.forEach((item) => {
    let countryName = item.iso_3166_1;
    try {
      if (regionNames) {
        countryName = regionNames.of(item.iso_3166_1) || item.iso_3166_1;
      }
    } catch {
      countryName = item.iso_3166_1;
    }

    const validDates = (item.release_dates || []).filter((r: any) => Boolean(r.release_date));
    if (validDates.length === 0) return;

    const theatrical =
      validDates.find((r: any) => r.type === 3) ||
      validDates.find((r: any) => r.type === 2) ||
      validDates[0];

    const cert =
      validDates.find((r: any) => Boolean(r.certification?.trim()))?.certification?.trim() || "";

    const dateStr = theatrical?.release_date ? theatrical.release_date.slice(0, 10) : "";
    if (!dateStr) return;

    if (!map.has(dateStr)) {
      map.set(dateStr, []);
    }
    map.get(dateStr)!.push({
      code: item.iso_3166_1,
      country: countryName,
      certification: cert,
    });
  });

  const groups = Array.from(map.entries()).map(([date, countries]) => ({
    date,
    formattedDate: formatFullDate(date),
    countries: countries.sort((a, b) => a.country.localeCompare(b.country)),
  }));

  return groups.sort((a, b) => a.date.localeCompare(b.date));
}
