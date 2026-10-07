import type { CategoryState, Guest, Option, Profile } from "./schemas";

// People on the guest list who may come: attending + pending, plus their plus ones.
export function listHeadcount(guests: Guest[]): number {
  return guests.filter((g) => g.rsvp !== "no").reduce((n, g) => n + 1 + (g.plusOne ? 1 : 0), 0);
}

// Whether pricing uses the guest list. A half-entered list would make
// estimates far too low, so the interview number is used until every guest
// has replied or the list has at least that many people on it.
export function usesGuestList(guests: Guest[], profile: Profile): boolean {
  if (guests.length === 0) return false;
  if (profile.guestCount == null) return true;
  const allReplied = guests.every((g) => g.rsvp !== "pending");
  return allReplied || listHeadcount(guests) >= profile.guestCount;
}

// Guests the plan should be priced for.
export function headcount(guests: Guest[], profile: Profile): number {
  return usesGuestList(guests, profile) ? listHeadcount(guests) : (profile.guestCount ?? 0);
}

export function optionPrice(option: Option, selectedAddOns: string[], guests: number): number {
  let total = option.basePrice + option.pricePerPerson * guests;
  for (const addOn of option.addOns) {
    if (selectedAddOns.includes(addOn.id)) {
      total += addOn.perPerson ? addOn.price * guests : addOn.price;
    }
  }
  return Math.round(total);
}

export function favoriteOf(state: CategoryState | undefined): Option | null {
  if (!state?.favorite) return null;
  return state.options.find((o) => o.id === state.favorite) ?? null;
}

export function categoryPrice(state: CategoryState | undefined, guests: number): number | null {
  const fav = favoriteOf(state);
  if (!fav || !state) return null;
  return optionPrice(fav, state.addOns[fav.id] ?? [], guests);
}

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
