import { cn } from "@exactclerk/ui/lib/utils";

const WIDTH = 480;
const HEIGHT = 32;

// Interlaced, slowly swelling sine waves: the engraved band on security paper.
const waves = Array.from({ length: 7 }, (_, strand) => {
  const phase = (strand / 7) * Math.PI * 2;
  const points: string[] = [];
  for (let x = 0; x <= WIDTH; x += 4) {
    const swell = 0.55 + 0.45 * Math.sin((x / WIDTH) * Math.PI * 4 + phase / 2);
    const y = HEIGHT / 2 + (HEIGHT / 2 - 2) * swell * Math.sin((x / 24) * Math.PI + phase);
    points.push(`${x},${y.toFixed(2)}`);
  }
  return `M${points.join("L")}`;
});

export default function Guilloche({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={cn("block h-8 w-full", className)}
    >
      {waves.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
