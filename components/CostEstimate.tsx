"use client";

import { usePlan } from "@/lib/store";
import { FOOD, VENUES, vendorCategory } from "@/lib/categories";
import { categoryPrice, favoriteOf, headcount, money } from "@/lib/cost";
import { vendorTypes } from "./Vendors";

export default function CostEstimate({ goTo }: { goTo: (tab: string) => void }) {
  const { state, update } = usePlan();
  const guests = headcount(state.guests, state.profile);

  const lines = [
    { tab: "venues", category: VENUES },
    { tab: "food", category: FOOD },
    ...vendorTypes(state.profile.vendorsNeeded, Object.keys(state.categories)).map((t) => ({
      tab: "vendors",
      category: vendorCategory(t),
    })),
  ].map(({ tab, category }) => {
    const cat = state.categories[category.key];
    return { tab, label: category.label, choice: favoriteOf(cat), price: categoryPrice(cat, guests) };
  });

  const subtotal = lines.reduce((sum, l) => sum + (l.price ?? 0), 0);
  const contingency = Math.round((subtotal * state.contingencyPct) / 100);
  const total = subtotal + contingency;
  const budget = state.profile.budget;
  const pct = budget ? Math.min(100, (total / budget) * 100) : 0;
  const over = budget != null && total > budget;
  const missing = lines.filter((l) => !l.choice);

  return (
    <div className="estimate">
      <section className="card total">
        <p className="muted">Estimated cost for your event</p>
        <h2>{money(total)}</h2>
        <p className="muted">
          {guests ? `${guests} guests · ${money(guests ? total / guests : 0)} per guest` : "Add a guest count to price per-guest items"}
        </p>
        {budget != null && (
          <>
            <div className="meter" aria-label="Budget used">
              <div className={over ? "over" : ""} style={{ width: `${pct}%` }} />
            </div>
            <p className={over ? "error" : "ok"}>
              {over ? `${money(total - budget)} over` : `${money(budget - total)} under`} your {money(budget)} budget
            </p>
          </>
        )}
      </section>

      <section className="card">
        <table className="breakdown">
          <tbody>
            {lines.map((l) => (
              <tr key={l.label} className={l.choice ? "" : "empty"}>
                <th>{l.label}</th>
                <td>
                  {l.choice ? (
                    l.choice.name
                  ) : (
                    <button className="link" onClick={() => goTo(l.tab)}>
                      Choose a favorite
                    </button>
                  )}
                </td>
                <td className="num">{l.price != null ? money(l.price) : "—"}</td>
              </tr>
            ))}
            <tr className="sub">
              <th>Subtotal</th>
              <td />
              <td className="num">{money(subtotal)}</td>
            </tr>
            <tr>
              <th>
                Contingency, tax &amp; tips{" "}
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={state.contingencyPct}
                  onChange={(e) => update((s) => ({ ...s, contingencyPct: Math.max(0, Math.min(50, Number(e.target.value) || 0)) }))}
                  aria-label="Contingency percent"
                  className="pct"
                />
                %
              </th>
              <td />
              <td className="num">{money(contingency)}</td>
            </tr>
            <tr className="grand">
              <th>Total</th>
              <td />
              <td className="num">{money(total)}</td>
            </tr>
          </tbody>
        </table>
        {missing.length > 0 && (
          <p className="muted small">
            {missing.length} item{missing.length > 1 ? "s" : ""} not chosen yet, so the total will go up as you pick favorites.
          </p>
        )}
      </section>
    </div>
  );
}
