const RINGS = [
  { cy: 19.5, accent: 100, opacity: 1 },
  { cy: 16.5, accent: 80, opacity: 0.9 },
  { cy: 13.5, accent: 60, opacity: 0.76 },
  { cy: 10.5, accent: 40, opacity: 0.6 },
  { cy: 7.5, accent: 20, opacity: 0.44 },
  { cy: 4.5, accent: 0, opacity: 0.3 },
];

export default function BeaconMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      {RINGS.map((ring) => (
        <ellipse
          key={ring.cy}
          cx="12"
          cy={ring.cy}
          rx="9.5"
          ry="3.2"
          strokeWidth="1.3"
          opacity={ring.opacity}
          style={{ stroke: `color-mix(in srgb, var(--accent) ${ring.accent}%, #ffffff)` }}
        />
      ))}
    </svg>
  );
}
