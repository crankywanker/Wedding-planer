"use client";

import { useState } from "react";
import { usePlan } from "@/lib/store";
import { favoriteOf, listHeadcount, usesGuestList } from "@/lib/cost";
import type { Guest, Rsvp } from "@/lib/schemas";

const blank = { name: "", side: "", email: "", plusOne: false };

export default function GuestList() {
  const { state, update } = usePlan();
  const [form, setForm] = useState(blank);
  const [bulk, setBulk] = useState("");
  const [filter, setFilter] = useState<Rsvp | "all">("all");

  const caterer = favoriteOf(state.categories["food"]);
  const mealChoices = ["", "Standard", "Vegetarian", "Vegan", "Gluten-free", "Kids"];

  const setGuests = (fn: (g: Guest[]) => Guest[]) => update((s) => ({ ...s, guests: fn(s.guests) }));
  const newGuest = (name: string, extra: Partial<Guest> = {}): Guest => ({
    id: crypto.randomUUID(),
    name,
    side: "",
    email: "",
    rsvp: "pending",
    plusOne: false,
    meal: "",
    notes: "",
    ...extra,
  });

  function add() {
    if (!form.name.trim()) return;
    setGuests((g) => [...g, newGuest(form.name.trim(), { side: form.side, email: form.email, plusOne: form.plusOne })]);
    setForm(blank);
  }

  function addBulk() {
    const names = bulk
      .split(/\n|,/)
      .map((n) => n.trim())
      .filter(Boolean);
    setGuests((g) => [...g, ...names.map((n) => newGuest(n))]);
    setBulk("");
  }

  const patch = (id: string, p: Partial<Guest>) => setGuests((g) => g.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const counts = {
    yes: state.guests.filter((g) => g.rsvp === "yes").length,
    pending: state.guests.filter((g) => g.rsvp === "pending").length,
    no: state.guests.filter((g) => g.rsvp === "no").length,
  };
  const shown = filter === "all" ? state.guests : state.guests.filter((g) => g.rsvp === filter);
  const target = state.profile.guestCount;
  const venueCap = favoriteOf(state.categories["venues"])?.capacity;
  const total = listHeadcount(state.guests);
  const pricedFromList = usesGuestList(state.guests, state.profile);

  return (
    <div className="guests">
      <section className="stats">
        <Stat label="On the list (incl. +1s)" value={state.guests.length ? total : "—"} />
        <Stat label="Attending" value={counts.yes} />
        <Stat label="Pending" value={counts.pending} />
        <Stat label="Declined" value={counts.no} />
        <Stat label="Interview estimate" value={target ?? "—"} />
      </section>
      {venueCap && total > venueCap && (
        <p className="error">Your headcount ({total}) is over your favorite venue’s capacity ({venueCap}).</p>
      )}
      {state.guests.length > 0 && (
        <p className="muted">
          {pricedFromList
            ? "Prices now use your guest list headcount."
            : `Prices use your interview estimate of ${target} guests until the list reaches that size or everyone has replied.`}
        </p>
      )}
      {caterer && <p className="muted">Meal choices are for {caterer.name}.</p>}

      <div className="guest-forms">
        <form
          className="card row wrap"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <input placeholder="Guest name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Side / group" value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value })} />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <label className="row">
            <input type="checkbox" checked={form.plusOne} onChange={(e) => setForm({ ...form, plusOne: e.target.checked })} />
            Plus one
          </label>
          <button type="submit" className="primary">
            Add guest
          </button>
        </form>
        <form
          className="card bulk"
          onSubmit={(e) => {
            e.preventDefault();
            addBulk();
          }}
        >
          <textarea
            placeholder="Paste many names, one per line or comma separated"
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            rows={3}
          />
          <button type="submit" disabled={!bulk.trim()}>
            Add all
          </button>
        </form>
      </div>

      <div className="row filters">
        {(["all", "yes", "pending", "no"] as const).map((f) => (
          <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
            {f === "all" ? `All (${state.guests.length})` : f === "yes" ? "Attending" : f === "no" ? "Declined" : "Pending"}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="muted">No guests here yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Side</th>
                <th>RSVP</th>
                <th>+1</th>
                <th>Meal</th>
                <th>Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((g) => (
                <tr key={g.id}>
                  <td>
                    <input value={g.name} onChange={(e) => patch(g.id, { name: e.target.value })} aria-label="Name" />
                  </td>
                  <td>
                    <input value={g.side} onChange={(e) => patch(g.id, { side: e.target.value })} aria-label="Side" />
                  </td>
                  <td>
                    <select value={g.rsvp} onChange={(e) => patch(g.id, { rsvp: e.target.value as Rsvp })} aria-label="RSVP">
                      <option value="pending">Pending</option>
                      <option value="yes">Attending</option>
                      <option value="no">Declined</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={g.plusOne}
                      onChange={(e) => patch(g.id, { plusOne: e.target.checked })}
                      aria-label="Plus one"
                    />
                  </td>
                  <td>
                    <select value={g.meal} onChange={(e) => patch(g.id, { meal: e.target.value })} aria-label="Meal">
                      {mealChoices.map((m) => (
                        <option key={m} value={m}>
                          {m || "—"}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input value={g.notes} onChange={(e) => patch(g.id, { notes: e.target.value })} aria-label="Notes" />
                  </td>
                  <td>
                    <button className="link" onClick={() => setGuests((all) => all.filter((x) => x.id !== g.id))}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="stat card">
      <strong>{value}</strong>
      <span className="muted small">{label}</span>
    </div>
  );
}
