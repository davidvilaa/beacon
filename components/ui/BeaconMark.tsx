const DISCS = [
  { cy: 46.25, accent: 100, opacity: 1 },
  { cy: 36.75, accent: 66, opacity: 0.78 },
  { cy: 27.25, accent: 33, opacity: 0.57 },
  { cy: 17.75, accent: 0, opacity: 0.35 },
];

export default function BeaconMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      {DISCS.map((disc) => (
        <ellipse
          key={disc.cy}
          cx="32"
          cy={disc.cy}
          rx="22"
          ry="9"
          transform={`rotate(-18 32 ${disc.cy})`}
          opacity={disc.opacity}
          strokeWidth="2"
          style={{
            fill: `color-mix(in srgb, var(--accent) ${disc.accent}%, #ffffff)`,
            stroke: "var(--navbar)",
          }}
        />
      ))}
    </svg>
  );
}
