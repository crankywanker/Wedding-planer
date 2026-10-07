export type CategoryDef = {
  key: string;
  label: string;
  // What to search for, phrased for the recommendation prompt.
  brief: string;
};

export const VENUES: CategoryDef = {
  key: "venues",
  label: "Venues",
  brief:
    "wedding venues (reception, plus ceremony if they want it on site). Price the venue rental as basePrice and any per-guest venue fees as pricePerPerson.",
};

export const FOOD: CategoryDef = {
  key: "food",
  label: "Food",
  brief:
    "caterers or catering menus. Price per guest as pricePerPerson (basePrice for fixed fees like staffing or tastings). Add-ons can include bar packages, late-night snacks, dessert tables.",
};

export const DEFAULT_VENDOR_TYPES = [
  "Photographer",
  "Florist",
  "DJ / Band",
  "Cake & Desserts",
  "Hair & Makeup",
  "Officiant",
];

export function vendorCategory(type: string): CategoryDef {
  return {
    key: `vendor:${type}`,
    label: type,
    brief: `${type} vendors for a wedding. Use basePrice for package prices; pricePerPerson only if they genuinely charge per guest.`,
  };
}
