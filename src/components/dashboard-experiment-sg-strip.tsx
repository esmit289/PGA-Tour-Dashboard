"use client";

const DOMAIN_MIN = -3;
const DOMAIN_MAX = 3;

function quantile(sorted: number[], q: number) {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

// Deterministic pseudo-random jitter (seeded by index) so dots don't
// overlap in a straight line but stay stable across re-renders.
function jitterFor(i: number) {
  const seed = Math.sin(i * 12.9898) * 43758.5453;
  return (seed - Math.floor(seed)) * 64 + 18;
}

function toPct(v: number) {
  const clamped = Math.max(DOMAIN_MIN, Math.min(DOMAIN_MAX, v));
  return ((clamped - DOMAIN_MIN) / (DOMAIN_MAX - DOMAIN_MIN)) * 100;
}

export function SgStripPlot({ label, values }: { label: string; values: number[] }) {
  if (values.length === 0) {
    return (
      <div className="border-b border-white/10 py-4 last:border-0">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="mt-2 text-xs text-slate-500">No tracked rounds</p>
      </div>
    );
  }

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const med = quantile(sorted, 0.5);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  return (
    <div className="border-b border-white/10 py-4 last:border-0">
      <p className="mb-3 text-sm font-medium text-slate-200">{label}</p>
      <div className="relative h-20 w-full">
        <div
          className="absolute top-1/2 h-px bg-slate-500"
          style={{ left: `${toPct(min)}%`, width: `${toPct(max) - toPct(min)}%` }}
        />
        <div
          className="absolute h-3 w-px bg-slate-500"
          style={{ left: `${toPct(min)}%`, top: "calc(50% - 6px)" }}
        />
        <div
          className="absolute h-3 w-px bg-slate-500"
          style={{ left: `${toPct(max)}%`, top: "calc(50% - 6px)" }}
        />
        <div
          className="absolute top-1/2 h-6 -translate-y-1/2 rounded-sm bg-sky-300/25"
          style={{ left: `${toPct(q1)}%`, width: `${Math.max(toPct(q3) - toPct(q1), 1)}%` }}
        />
        <div
          className="absolute top-1/2 h-6 w-0.5 -translate-y-1/2 bg-slate-100"
          style={{ left: `${toPct(med)}%` }}
        />
        {values.map((v, i) => (
          <div
            key={i}
            className="absolute size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/80"
            style={{ left: `${toPct(v)}%`, top: `${jitterFor(i)}%` }}
            title={v.toFixed(2)}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>-3.0</span>
        <span>0.0</span>
        <span>3.0</span>
      </div>
    </div>
  );
}
