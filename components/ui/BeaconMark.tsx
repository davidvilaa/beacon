const DISCS = [
  { cy: 20.4, accent: 100, opacity: 1 },
  { cy: 14.8, accent: 66, opacity: 0.8 },
  { cy: 9.2, accent: 33, opacity: 0.6 },
  { cy: 3.6, accent: 0, opacity: 0.4 },
];

export default function BeaconMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      {DISCS.map((disc) => (
        <ellipse
          key={disc.cy}
          cx="12"
          cy={disc.cy}
          rx="10"
          ry="2.3"
          opacity={disc.opacity}
          style={{ fill: `color-mix(in srgb, var(--accent) ${disc.accent}%, #ffffff)` }}
        />
      ))}
    </svg>
  );
}
