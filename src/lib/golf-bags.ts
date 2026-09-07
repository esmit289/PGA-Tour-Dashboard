export interface BagItem {
  category: string;
  brand: string;
  model: string;
  detail?: string;
}

export interface PlayerBag {
  updated: string;
  items: BagItem[];
}

// Curated "What's In The Bag" data for a handful of players, sourced from
// public WITB reporting (GolfWRX / WITBhub). Equipment changes often —
// this reflects each player's most recently reported setup, not a
// season-by-season history (PGA Tour's stats API doesn't track equipment).
export const GOLF_BAGS: Record<string, PlayerBag> = {
  // Scottie Scheffler
  "46046": {
    updated: "August 2026",
    items: [
      { category: "Driver", brand: "TaylorMade", model: "Qi4D", detail: "8° (set to 7.8°)" },
      { category: "Fairway Wood", brand: "TaylorMade", model: "Qi10", detail: "3-wood, 15° (set to 13.5°)" },
      { category: "Utility Iron", brand: "Srixon", model: "ZU85", detail: "3 & 4-iron" },
      { category: "Irons", brand: "TaylorMade", model: "P-7TW", detail: "5-PW" },
      { category: "Wedges", brand: "Titleist Vokey", model: "SM8", detail: "50°, 56°" },
      { category: "Wedges", brand: "Titleist Vokey", model: "WedgeWorks SM9", detail: "60°" },
      { category: "Putter", brand: "TaylorMade", model: "Spider Tour X" },
      { category: "Ball", brand: "Titleist", model: "Pro V1" },
    ],
  },
  // Rory McIlroy
  "28237": {
    updated: "June 2026",
    items: [
      { category: "Driver", brand: "TaylorMade", model: "Qi4D", detail: "9°" },
      { category: "Fairway Wood", brand: "TaylorMade", model: "Qi10", detail: "3-wood, 15°" },
      { category: "Fairway Wood", brand: "TaylorMade", model: "Qi4D", detail: "5-wood, 18°" },
      { category: "Irons", brand: "TaylorMade", model: "P760", detail: "4-iron" },
      { category: "Irons", brand: "TaylorMade", model: "Rors Proto", detail: "5-9 iron" },
      { category: "Wedges", brand: "TaylorMade", model: "MG5", detail: "46°, 50°, 54°, 61°" },
      { category: "Putter", brand: "TaylorMade", model: "Spider Tour X" },
      { category: "Ball", brand: "TaylorMade", model: "TP5" },
    ],
  },
  // Cameron Young
  "57366": {
    updated: "August 2026",
    items: [
      { category: "Driver", brand: "Titleist", model: "GTS3", detail: "10°" },
      { category: "Fairway Wood", brand: "Titleist", model: "GTS3", detail: "3-wood, 16.5°" },
      { category: "Fairway Wood", brand: "Titleist", model: "GTS3", detail: "7-wood, 21°" },
      { category: "Irons", brand: "Titleist", model: "T200", detail: "4-iron" },
      { category: "Irons", brand: "Titleist", model: "T100", detail: "5-iron" },
      { category: "Irons", brand: "Titleist", model: "631.CY Prototype", detail: "6-9 iron" },
      { category: "Wedges", brand: "Titleist Vokey", model: "SM11", detail: "48°, 52°, 56°" },
      { category: "Wedges", brand: "Titleist Vokey", model: "WedgeWorks", detail: "60°" },
      { category: "Putter", brand: "Scotty Cameron", model: "Phantom 9.5R Tour Prototype" },
      { category: "Ball", brand: "Titleist", model: "Pro V1x Double Dot" },
    ],
  },
  // Xander Schauffele
  "48081": {
    updated: "July 2026",
    items: [
      { category: "Driver", brand: "Callaway", model: "Paradym Ai Smoke Triple Diamond", detail: "10.5°" },
      { category: "Fairway Wood", brand: "Callaway", model: "Quantum Triple Diamond", detail: "3HL, 16.5°" },
      { category: "Hybrid", brand: "Callaway", model: "Apex Utility Wood", detail: "21°" },
      { category: "Irons", brand: "Callaway", model: "Apex TCB 24", detail: "4-PW" },
      { category: "Wedges", brand: "Callaway", model: "Opus SP", detail: "52°" },
      { category: "Wedges", brand: "Titleist Vokey", model: "SM10 / WedgeWorks", detail: "56°, 60°" },
      { category: "Putter", brand: "Odyssey", model: "Toulon Design Las Vegas Prototype 7CH" },
      { category: "Ball", brand: "Callaway", model: "Chrome Tour" },
    ],
  },
  // Collin Morikawa
  "50525": {
    updated: "June 2026",
    items: [
      { category: "Driver", brand: "TaylorMade", model: "Qi4D LS", detail: "8°" },
      { category: "Fairway Wood", brand: "TaylorMade", model: "SIM Ti", detail: "3-wood, 14°" },
      { category: "Fairway Wood", brand: "TaylorMade", model: "Qi4D Tour", detail: "5-wood, 18°" },
      { category: "Hybrid", brand: "TaylorMade", model: "PDHY", detail: "4-iron" },
      { category: "Irons", brand: "TaylorMade", model: "P-7CB", detail: "5-6 iron" },
      { category: "Irons", brand: "TaylorMade", model: "P730", detail: "7-PW" },
      { category: "Wedges", brand: "TaylorMade", model: "MG5", detail: "50°, 56°, 60°" },
      { category: "Putter", brand: "TaylorMade", model: "Spider Tour X" },
      { category: "Ball", brand: "TaylorMade", model: "TP5X" },
    ],
  },
};
