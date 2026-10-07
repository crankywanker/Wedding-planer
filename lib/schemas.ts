import { z } from "zod";

// What the interview learns about the couple. Every field starts empty and is
// filled in as the conversation goes.
export const ProfileSchema = z.object({
  coupleNames: z.string().nullable().describe("Names of the couple"),
  weddingDate: z.string().nullable().describe("Date or season, as the customer said it"),
  location: z.string().nullable().describe("City / region where the wedding will be"),
  guestCount: z.number().nullable().describe("Expected number of guests"),
  budget: z.number().nullable().describe("Total budget in US dollars"),
  style: z.string().nullable().describe("Overall style, e.g. rustic, modern, beach, classic"),
  colors: z.string().nullable().describe("Color palette or theme"),
  ceremony: z.string().nullable().describe("Ceremony type: religious, civil, outdoor, same venue as reception, etc."),
  foodPreferences: z.string().nullable().describe("Cuisine and service style (plated, buffet, family style, food trucks...)"),
  dietaryRestrictions: z.string().nullable().describe("Dietary needs among guests"),
  vendorsNeeded: z.array(z.string()).describe("Vendor types they still need, e.g. Photographer, Florist, DJ"),
  mustHaves: z.array(z.string()).describe("Non-negotiables mentioned by the customer"),
  notes: z.string().nullable().describe("Anything else worth remembering"),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const emptyProfile: Profile = {
  coupleNames: null,
  weddingDate: null,
  location: null,
  guestCount: null,
  budget: null,
  style: null,
  colors: null,
  ceremony: null,
  foodPreferences: null,
  dietaryRestrictions: null,
  vendorsNeeded: [],
  mustHaves: [],
  notes: null,
};

export const InterviewTurnSchema = z.object({
  reply: z.string().describe("What the planner says next: a short acknowledgement plus the next question"),
  profile: ProfileSchema.describe("The full profile so far, including everything learned in earlier turns"),
  complete: z.boolean().describe("True once budget, guest count, location, style and food preferences are known"),
});
export type InterviewTurn = z.infer<typeof InterviewTurnSchema>;

// A configurable add-on, e.g. "Ceremony on site" or "Open bar".
export const AddOnSchema = z.object({
  id: z.string(),
  label: z.string(),
  price: z.number().describe("Price in USD"),
  perPerson: z.boolean().describe("True if the price is charged per guest"),
});
export type AddOn = z.infer<typeof AddOnSchema>;

export const OptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.string().describe("What this is, e.g. 'Barn venue', 'Italian caterer', 'Photographer'"),
  description: z.string(),
  location: z.string().nullable(),
  highlights: z.array(z.string()).describe("3-5 short selling points"),
  basePrice: z.number().describe("Flat cost in USD (0 if priced only per person)"),
  pricePerPerson: z.number().describe("Per-guest cost in USD (0 if flat priced)"),
  priceNotes: z.string().describe("How the price was estimated and what it includes"),
  capacity: z.number().nullable().describe("Max guests, if relevant"),
  website: z.string().nullable(),
  addOns: z.array(AddOnSchema).describe("2-4 optional upgrades the customer can configure"),
});
export type Option = z.infer<typeof OptionSchema>;

export const RecommendationsSchema = z.object({
  options: z.array(OptionSchema).describe("Exactly 5 options, best match first"),
});

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type Rsvp = "pending" | "yes" | "no";

export type Guest = {
  id: string;
  name: string;
  side: string;
  email: string;
  rsvp: Rsvp;
  plusOne: boolean;
  meal: string;
  notes: string;
};

// Per-category planning state: the top 5, the customer's shortlist, their
// favorite and which add-ons they turned on for each option.
export type CategoryState = {
  options: Option[];
  shortlist: string[];
  favorite: string | null;
  addOns: Record<string, string[]>;
};
