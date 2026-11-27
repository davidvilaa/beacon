const DISCS = [
  { cy: 46.25, accent: 100, opacity: 1 },
  { cy: 36.75, accent: 66, opacity: 0.78 },
  { cy: 27.25, accent: 33, opacity: 0.57 },
  { cy: 17.75, accent: 0, opacity: 0.35 },
];

interface BeaconMarkProps {
  className?: string;
  animated?: boolean;
}

export default function BeaconMark({ className = "", animated = false }: BeaconMarkProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      {DISCS.map((disc, index) => (
        <ellipse
          key={disc.cy}
          cx="32"
          cy={disc.cy}
          rx="22"
          ry="9"
          transform={`rotate(-18 32 ${disc.cy})`}
          opacity={animated ? 1 : disc.opacity}
          strokeWidth="2"
          className={animated ? "animate-beacon-fill motion-reduce:animate-none" : undefined}
          style={{
            fill: `color-mix(in srgb, var(--accent) ${disc.accent}%, #ffffff)`,
            stroke: "var(--navbar)",
            animationDelay: animated ? `${index * 0.18}s` : undefined,
          }}
        />
      ))}
    </svg>
  );
}
