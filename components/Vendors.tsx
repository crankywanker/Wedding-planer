"use client";

import { useState } from "react";
import { usePlan } from "@/lib/store";
import { DEFAULT_VENDOR_TYPES, vendorCategory } from "@/lib/categories";
import { favoriteOf } from "@/lib/cost";
import OptionPicker from "./OptionPicker";

export function vendorTypes(needed: string[], categoryKeys: string[]): string[] {
  const fromPlan = categoryKeys.filter((k) => k.startsWith("vendor:")).map((k) => k.slice(7));
  const base = needed.length > 0 ? needed : DEFAULT_VENDOR_TYPES;
  return Array.from(new Set([...base, ...fromPlan]));
}

export default function Vendors() {
  const { state, updateCategory } = usePlan();
  const types = vendorTypes(state.profile.vendorsNeeded, Object.keys(state.categories));
  const [active, setActive] = useState(types[0]);
  const [custom, setCustom] = useState("");

  function addType() {
    const t = custom.trim();
    if (!t) return;
    updateCategory(vendorCategory(t).key, (c) => c);
    setActive(t);
    setCustom("");
  }

  return (
    <div>
      <nav className="subtabs" aria-label="Vendor types">
        {types.map((t) => {
          const chosen = favoriteOf(state.categories[vendorCategory(t).key]);
          return (
            <button key={t} className={t === active ? "active" : ""} onClick={() => setActive(t)}>
              {t}
              {chosen ? " ★" : ""}
            </button>
          );
        })}
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            addType();
          }}
        >
          <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add vendor type…" />
          <button type="submit">Add</button>
        </form>
      </nav>
      {active && <OptionPicker key={active} category={vendorCategory(active)} />}
    </div>
  );
}
