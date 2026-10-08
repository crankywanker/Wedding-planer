import { describe, expect, it } from "vitest";
import { categoryPrice, headcount, listHeadcount, optionPrice, usesGuestList } from "@/lib/cost";
import { emptyProfile, type Guest, type Option } from "@/lib/schemas";

const guest = (over: Partial<Guest> = {}): Guest => ({
  id: Math.random().toString(36),
  name: "Guest",
  side: "",
  email: "",
  rsvp: "pending",
  plusOne: false,
  meal: "",
  notes: "",
  ...over,
});

const venue: Option = {
  id: "barn",
  name: "Barn",
  kind: "Barn",
  description: "",
  location: null,
  highlights: [],
  basePrice: 10000,
  pricePerPerson: 20,
  priceNotes: "",
  capacity: 150,
  website: null,
  addOns: [
    { id: "ceremony", label: "Ceremony", price: 1500, perPerson: false },
    { id: "bar", label: "Bar", price: 30, perPerson: true },
  ],
};

describe("optionPrice", () => {
  it("adds base and per-guest prices", () => {
    expect(optionPrice(venue, [], 100)).toBe(12000);
  });
  it("adds flat and per-guest add-ons only when selected", () => {
    expect(optionPrice(venue, ["ceremony"], 100)).toBe(13500);
    expect(optionPrice(venue, ["ceremony", "bar"], 100)).toBe(16500);
  });
  it("ignores unknown add-on ids", () => {
    expect(optionPrice(venue, ["nope"], 100)).toBe(12000);
  });
});

describe("headcount", () => {
  const profile = { ...emptyProfile, guestCount: 100 };

  it("uses the interview estimate with no guest list", () => {
    expect(headcount([], profile)).toBe(100);
    expect(headcount([], emptyProfile)).toBe(0);
  });
  it("counts plus ones and skips declined guests", () => {
    const guests = [guest({ plusOne: true }), guest({ rsvp: "no", plusOne: true }), guest({ rsvp: "yes" })];
    expect(listHeadcount(guests)).toBe(3);
  });
  it("keeps the estimate while a partial list is still pending", () => {
    const guests = [guest(), guest({ rsvp: "yes" })];
    expect(usesGuestList(guests, profile)).toBe(false);
    expect(headcount(guests, profile)).toBe(100);
  });
  it("switches to the list once everyone has replied", () => {
    const guests = [guest({ rsvp: "yes" }), guest({ rsvp: "no" })];
    expect(headcount(guests, profile)).toBe(1);
  });
  it("switches to the list once it reaches the estimate", () => {
    const guests = Array.from({ length: 101 }, () => guest());
    expect(headcount(guests, profile)).toBe(101);
  });
  it("uses the list when there was no estimate", () => {
    expect(headcount([guest()], emptyProfile)).toBe(1);
  });
});

describe("categoryPrice", () => {
  it("is null without a favorite", () => {
    expect(categoryPrice(undefined, 100)).toBeNull();
    expect(categoryPrice({ options: [venue], shortlist: [], favorite: null, addOns: {} }, 100)).toBeNull();
  });
  it("prices the favorite with its add-ons", () => {
    const state = { options: [venue], shortlist: ["barn"], favorite: "barn", addOns: { barn: ["ceremony"] } };
    expect(categoryPrice(state, 100)).toBe(13500);
  });
});
