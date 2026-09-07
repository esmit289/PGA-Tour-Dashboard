import type { BagItem } from "@/lib/golf-bags";

const CLUB_STYLE: Record<string, { height: number; color: string; capWidth: number }> = {
  Driver: { height: 108, color: "var(--chart-4)", capWidth: 10 },
  "Fairway Wood": { height: 92, color: "var(--chart-3)", capWidth: 9 },
  Hybrid: { height: 80, color: "var(--chart-2)", capWidth: 8 },
  "Utility Iron": { height: 74, color: "var(--chart-2)", capWidth: 8 },
  Irons: { height: 62, color: "var(--muted-foreground)", capWidth: 7 },
  Wedges: { height: 50, color: "var(--chart-5)", capWidth: 7 },
  Putter: { height: 42, color: "var(--foreground)", capWidth: 14 },
};

const CLUB_ORDER = [
  "Driver",
  "Fairway Wood",
  "Hybrid",
  "Utility Iron",
  "Irons",
  "Wedges",
  "Putter",
];

export function GolfBagIllustration({ items }: { items: BagItem[] }) {
  const clubs = items
    .filter((i) => i.category !== "Ball")
    .sort((a, b) => CLUB_ORDER.indexOf(a.category) - CLUB_ORDER.indexOf(b.category));
  const hasBall = items.some((i) => i.category === "Ball");

  const bagTop = 150;
  const collarLeft = 70;
  const collarRight = 230;
  const spacing = clubs.length > 1 ? (collarRight - collarLeft) / (clubs.length - 1) : 0;

  return (
    <svg
      viewBox="0 0 300 260"
      className="mx-auto h-56 w-full max-w-[240px]"
      role="img"
      aria-label="Illustration of a golf bag with clubs"
    >
      {/* clubs, drawn first so the bag body overlaps their base */}
      {clubs.map((item, i) => {
        const style = CLUB_STYLE[item.category] ?? CLUB_STYLE.Irons;
        const x = clubs.length === 1 ? (collarLeft + collarRight) / 2 : collarLeft + spacing * i;
        const y1 = bagTop + 20;
        const y2 = bagTop - style.height;
        const isPutter = item.category === "Putter";
        return (
          <g key={i}>
            <line
              x1={x}
              y1={y1}
              x2={x}
              y2={y2}
              stroke={style.color}
              strokeWidth={4}
              strokeLinecap="round"
            />
            {isPutter ? (
              <rect
                x={x - style.capWidth / 2}
                y={y2 - 10}
                width={style.capWidth}
                height={10}
                rx={2}
                fill={style.color}
              />
            ) : (
              <circle cx={x} cy={y2 - 4} r={style.capWidth / 2} fill={style.color} />
            )}
          </g>
        );
      })}

      {/* bag body */}
      <path
        d="M 55 150
           C 55 140, 60 130, 75 128
           L 225 128
           C 240 130, 245 140, 245 150
           L 232 235
           C 231 245, 223 252, 213 252
           L 87 252
           C 77 252, 69 245, 68 235
           Z"
        fill="var(--primary)"
        stroke="var(--border)"
        strokeWidth={1.5}
      />

      {/* front pocket */}
      <path
        d="M 95 175
           C 95 168, 100 163, 108 163
           L 192 163
           C 200 163, 205 168, 205 175
           L 200 220
           C 199 227, 193 232, 186 232
           L 114 232
           C 107 232, 101 227, 100 220
           Z"
        fill="var(--secondary)"
        opacity={0.9}
      />

      {/* collar / top cuff */}
      <rect
        x={60}
        y={122}
        width={180}
        height={16}
        rx={8}
        fill="var(--accent)"
      />

      {/* strap */}
      <path
        d="M 75 140 L 45 230"
        stroke="var(--accent)"
        strokeWidth={10}
        strokeLinecap="round"
        opacity={0.85}
      />

      {/* ball tucked in a side pocket */}
      {hasBall && (
        <g>
          <circle cx={220} cy={200} r={11} fill="var(--card)" stroke="var(--border)" />
          <circle cx={216} cy={196} r={1.2} fill="var(--muted-foreground)" />
          <circle cx={222} cy={195} r={1.2} fill="var(--muted-foreground)" />
          <circle cx={225} cy={200} r={1.2} fill="var(--muted-foreground)" />
          <circle cx={218} cy={203} r={1.2} fill="var(--muted-foreground)" />
          <circle cx={224} cy={205} r={1.2} fill="var(--muted-foreground)" />
        </g>
      )}
    </svg>
  );
}
