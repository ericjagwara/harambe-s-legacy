export const EVENT = {
  name: "Startups Harambe Run",
  hashtag: "#StartupsHarambeRun",
  date: "Sunday, 6 December 2026",
  dateISO: "2026-12-06T07:00:00+03:00",
  finish: "Makerere University Main Campus",
  email: "run@techbuzzhub.africa",
  phone: "+256 700 000 000",
  address: "TechBuzz Hub, Kampala, Uganda (address to be confirmed)",
  target: 250_000_000,
  raised: 84_650_000,
  kitsSold: 1_240,
  socials: [
    { label: "TikTok", href: "https://www.tiktok.com" },
    { label: "X", href: "https://x.com" },
    { label: "LinkedIn", href: "https://www.linkedin.com" },
  ],
};

export const CAMPUSES = [
  { name: "Makerere University", distance: "Finish line host — 3 km loop" },
  { name: "Kyambogo University", distance: "9.4 km to finish" },
  { name: "Uganda Christian University, Mukono", distance: "21 km relay leg" },
  { name: "Kampala International University", distance: "7.8 km to finish" },
  { name: "Ndejje University, Kampala Campus", distance: "8.5 km to finish" },
  { name: "Nkumba University, Entebbe", distance: "18 km relay leg" },
  { name: "Victoria University", distance: "5.2 km to finish" },
  { name: "Makerere University Business School", distance: "10.1 km to finish" },
];

export const STATIONS = [
  { name: "Wandegeya", distance: "1.6 km to finish" },
  { name: "Bwaise", distance: "5.0 km to finish" },
  { name: "Ntinda", distance: "7.4 km to finish" },
  { name: "Kamwokya", distance: "3.9 km to finish" },
  { name: "Nakawa", distance: "9.0 km to finish" },
  { name: "Kabalagala", distance: "8.2 km to finish" },
  { name: "Kireka", distance: "12.5 km to finish" },
];

export const TICKETS = [
  {
    id: "student",
    title: "Student runner",
    price: 30000,
    verification: "Valid student ID required",
    start: "Chosen university campus",
  },
  {
    id: "public",
    title: "General public runner",
    price: 50000,
    verification: "No verification needed",
    start: "Chosen campus or neighborhood station",
  },
  {
    id: "virtual",
    title: "Virtual donor (non-running)",
    price: 0,
    verification: "None — give any amount",
    start: "Remote participation",
  },
] as const;

export const KIT_CONTENTS = [
  "Branded running vest",
  "Drawstring bag",
  "Branded water bottle",
  "Glucose pack",
  "Corporate sticker",
  "Safety whistle",
  "Branded bottle opener",
  "Numbered registration tag",
];

export const BOOTHS = [
  { name: "Gold", size: "6 m x 6 m", price: 8_500_000 },
  { name: "Silver", size: "6 m x 3 m", price: 4_500_000 },
  { name: "Bronze", size: "3 m x 3 m", price: 1_500_000 },
];

export const DONORS = [
  { name: "Stanbic Business Incubator", amount: 15_000_000, type: "Corporate pledge" },
  { name: "Anonymous", amount: 8_000_000, type: "Exhibition booth — Gold" },
  { name: "Innovation Village", amount: 6_500_000, type: "Corporate pledge" },
  { name: "Rita N.", amount: 1_200_000, type: "Individual donation" },
  { name: "Anonymous", amount: 900_000, type: "Individual donation" },
  { name: "Kampala Angel Network", amount: 4_500_000, type: "Exhibition booth — Silver" },
  { name: "Joel K.", amount: 300_000, type: "Individual donation" },
];

export const ugx = (value: number) =>
  `UGX ${value.toLocaleString("en-UG", { maximumFractionDigits: 0 })}`;
