// Offline stand-ins for the Claude calls, so the app is usable without an
// API key. The interview is scripted and the recommendations are samples.
import type { ChatMessage, InterviewTurn, Option, Profile } from "./schemas";

type Step = {
  question: string;
  apply: (answer: string, p: Profile) => Profile;
};

const firstNumber = (s: string): number | null => {
  const m = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*(k)?/i);
  if (!m) return null;
  return Math.round(parseFloat(m[1]) * (m[2] ? 1000 : 1));
};

const list = (s: string) =>
  s
    .split(/,|\band\b/i)
    .map((x) => x.trim())
    .filter(Boolean);

const STEPS: Step[] = [
  {
    question: "Congratulations! Let's plan your wedding. First, what are your names?",
    apply: (a, p) => ({ ...p, coupleNames: a }),
  },
  { question: "When are you thinking of getting married? A date or a season is fine.", apply: (a, p) => ({ ...p, weddingDate: a }) },
  { question: "Where will the wedding be? City or region.", apply: (a, p) => ({ ...p, location: a }) },
  { question: "Roughly how many guests are you expecting?", apply: (a, p) => ({ ...p, guestCount: firstNumber(a) }) },
  { question: "What's your total budget for the day, in dollars?", apply: (a, p) => ({ ...p, budget: firstNumber(a) }) },
  {
    question: "How would you describe your style? Rustic, modern, classic, beach, boho... and any colors you love?",
    apply: (a, p) => ({ ...p, style: a, colors: a }),
  },
  {
    question: "What kind of food are you dreaming of? Cuisine, and plated, buffet or family style?",
    apply: (a, p) => ({ ...p, foodPreferences: a }),
  },
  { question: "Any dietary restrictions among your guests?", apply: (a, p) => ({ ...p, dietaryRestrictions: a }) },
  {
    question: "Which vendors do you still need? For example photographer, florist, DJ, cake, hair & makeup.",
    apply: (a, p) => ({ ...p, vendorsNeeded: list(a) }),
  },
  {
    question: "Last one: anything that's a must-have for the day?",
    apply: (a, p) => ({ ...p, mustHaves: list(a) }),
  },
];

export function demoInterviewTurn(messages: ChatMessage[], profile: Profile): InterviewTurn {
  const answers = messages.filter((m) => m.role === "user");
  let p = profile;
  const last = answers[answers.length - 1];
  const stepIndex = answers.length - 1;
  if (last && stepIndex < STEPS.length) p = STEPS[stepIndex].apply(last.content, p);

  const next = STEPS[answers.length];
  if (next) return { reply: answers.length ? `Got it. ${next.question}` : next.question, profile: p, complete: false };
  return {
    reply:
      "Thank you, that's everything I need! Your plan is ready: head to Venues, Food and Vendors to see your top picks. (Demo mode: add an API key for live AI interviews.)",
    profile: p,
    complete: true,
  };
}

const opt = (o: Partial<Option> & Pick<Option, "id" | "name" | "kind">): Option => ({
  description: "",
  location: null,
  highlights: [],
  basePrice: 0,
  pricePerPerson: 0,
  priceNotes: "Sample estimate (demo mode)",
  capacity: null,
  website: null,
  addOns: [],
  ...o,
});

const SAMPLE_VENUES: Option[] = [
  opt({
    id: "willow-creek-barn",
    name: "Willow Creek Barn",
    kind: "Rustic barn",
    description: "A restored 1900s barn on 40 acres with string lights and a creekside ceremony lawn.",
    highlights: ["Creekside ceremony site", "Bridal suite", "Tables & chairs included", "Bonfire pit"],
    basePrice: 9500,
    pricePerPerson: 15,
    capacity: 220,
    addOns: [
      { id: "ceremony", label: "On-site ceremony", price: 1500, perPerson: false },
      { id: "extra-hour", label: "Extra hour", price: 900, perPerson: false },
      { id: "rehearsal", label: "Rehearsal dinner space", price: 1200, perPerson: false },
    ],
  }),
  opt({
    id: "harbor-view-loft",
    name: "Harbor View Loft",
    kind: "Modern loft",
    description: "Industrial-chic loft with floor-to-ceiling windows and a rooftop for cocktail hour.",
    highlights: ["Rooftop cocktail hour", "City skyline views", "In-house AV", "Downtown location"],
    basePrice: 12000,
    pricePerPerson: 20,
    capacity: 180,
    addOns: [
      { id: "rooftop", label: "Rooftop ceremony", price: 2000, perPerson: false },
      { id: "valet", label: "Valet parking", price: 12, perPerson: true },
    ],
  }),
  opt({
    id: "rosewood-estate",
    name: "Rosewood Estate",
    kind: "Garden estate",
    description: "Formal gardens, a fountain courtyard and a grand ballroom for the reception.",
    highlights: ["Rose garden ceremony", "Ballroom", "Coordinator included", "Rain backup plan"],
    basePrice: 15000,
    pricePerPerson: 25,
    capacity: 250,
    addOns: [
      { id: "ceremony", label: "Garden ceremony", price: 2500, perPerson: false },
      { id: "lighting", label: "Uplighting package", price: 1100, perPerson: false },
    ],
  }),
  opt({
    id: "lakeside-pavilion",
    name: "Lakeside Pavilion",
    kind: "Waterfront pavilion",
    description: "Open-air pavilion on the lake with a dock for sunset photos.",
    highlights: ["Sunset dock photos", "Open-air dancing", "Budget friendly", "Ample parking"],
    basePrice: 6000,
    pricePerPerson: 10,
    capacity: 160,
    addOns: [
      { id: "tent", label: "Weather tent", price: 2200, perPerson: false },
      { id: "boat", label: "Boat send-off", price: 800, perPerson: false },
    ],
  }),
  opt({
    id: "old-mill-winery",
    name: "Old Mill Winery",
    kind: "Vineyard",
    description: "Stone mill building surrounded by vineyard rows, with wine from the estate.",
    highlights: ["Vineyard ceremony", "Estate wine", "Stone patio", "Golden-hour views"],
    basePrice: 11000,
    pricePerPerson: 18,
    capacity: 200,
    addOns: [
      { id: "wine", label: "Estate wine pairing", price: 28, perPerson: true },
      { id: "ceremony", label: "Vineyard ceremony", price: 1800, perPerson: false },
    ],
  }),
];

const SAMPLE_FOOD: Option[] = [
  opt({
    id: "harvest-table",
    name: "Harvest Table Catering",
    kind: "Farm-to-table, family style",
    description: "Seasonal family-style platters sourced from local farms.",
    highlights: ["Family-style service", "Seasonal menu", "Vegetarian & GF options", "Free tasting"],
    basePrice: 800,
    pricePerPerson: 68,
    addOns: [
      { id: "bar", label: "Open bar (4 hrs)", price: 35, perPerson: true },
      { id: "late", label: "Late-night tacos", price: 9, perPerson: true },
    ],
  }),
  opt({
    id: "bella-cucina",
    name: "Bella Cucina",
    kind: "Italian, plated",
    description: "Three-course plated Italian dinner with handmade pasta.",
    highlights: ["Handmade pasta", "Plated service", "Antipasto cocktail hour"],
    basePrice: 500,
    pricePerPerson: 82,
    addOns: [
      { id: "bar", label: "Wine & beer bar", price: 26, perPerson: true },
      { id: "dessert", label: "Cannoli dessert table", price: 7, perPerson: true },
    ],
  }),
  opt({
    id: "smoke-and-oak",
    name: "Smoke & Oak BBQ",
    kind: "BBQ buffet",
    description: "Slow-smoked brisket, pulled pork and classic sides, served buffet style.",
    highlights: ["Crowd pleaser", "Buffet", "Budget friendly"],
    pricePerPerson: 42,
    addOns: [
      { id: "bar", label: "Beer & cocktails bar", price: 24, perPerson: true },
      { id: "smores", label: "S'mores station", price: 6, perPerson: true },
    ],
  }),
  opt({
    id: "coastal-kitchen",
    name: "Coastal Kitchen",
    kind: "Seafood stations",
    description: "Raw bar, paella station and grilled fish with a coastal twist.",
    highlights: ["Raw bar", "Live paella station", "Interactive stations"],
    basePrice: 1200,
    pricePerPerson: 95,
    addOns: [{ id: "bar", label: "Premium open bar", price: 45, perPerson: true }],
  }),
  opt({
    id: "street-eats",
    name: "Street Eats Truck Co.",
    kind: "Food trucks",
    description: "Two food trucks of your choice: tacos, wood-fired pizza or bao.",
    highlights: ["Two trucks", "Casual & fun", "Great for late night"],
    basePrice: 1500,
    pricePerPerson: 32,
    addOns: [{ id: "third", label: "Third truck (dessert)", price: 1200, perPerson: false }],
  }),
];

const VENDOR_NAMES = ["Golden Hour", "Bloom & Co.", "Northstar", "Petal Lane", "Evergreen"];

function sampleVendors(type: string): Option[] {
  const base: Record<string, number> = {
    Photographer: 3200,
    Florist: 2800,
    "DJ / Band": 1800,
    "Cake & Desserts": 700,
    "Hair & Makeup": 1100,
    Officiant: 450,
  };
  const price = base[type] ?? 1500;
  return VENDOR_NAMES.map((n, i) =>
    opt({
      id: `${type.toLowerCase().replace(/[^a-z]+/g, "-")}-${i}`,
      name: `${n} ${type.split(" ")[0]}`,
      kind: type,
      description: `A well-reviewed ${type.toLowerCase()} matched to your style.`,
      highlights: ["Highly rated", i % 2 ? "Flexible packages" : "Books early, reserve soon", "Local"],
      basePrice: Math.round(price * (0.75 + i * 0.15)),
      addOns: [
        { id: "extra", label: "Extended coverage", price: Math.round(price * 0.2), perPerson: false },
        { id: "travel", label: "Travel fee", price: 150, perPerson: false },
      ],
    }),
  );
}

export function demoRecommend(categoryKey: string): Option[] {
  if (categoryKey === "venues") return SAMPLE_VENUES;
  if (categoryKey === "food") return SAMPLE_FOOD;
  return sampleVendors(categoryKey.replace(/^vendor:/, ""));
}
