"use client";

import { useEffect, useState } from "react";
import { usePlan } from "@/lib/store";
import { headcount, money, optionPrice } from "@/lib/cost";
import type { CategoryDef } from "@/lib/categories";
import type { Option } from "@/lib/schemas";

// The flow from the sketch, for any category: get the top 5, pick a shortlist,
// flip through them in a slideshow, configure add-ons, choose (or change) a
// favorite, and see the price.
export default function OptionPicker({ category, compact = false }: { category: CategoryDef; compact?: boolean }) {
  const { state, updateCategory } = usePlan();
  const cat = state.categories[category.key];
  const guests = headcount(state.guests, state.profile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slideshow, setSlideshow] = useState(false);
  const [configuring, setConfiguring] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryKey: category.key, brief: category.brief, profile: state.profile, guests }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      const options = data.options as Option[];
      updateCategory(category.key, () => ({ options, shortlist: [], favorite: null, addOns: {} }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const options = cat?.options ?? [];
  const shortlist = cat?.shortlist ?? [];
  const favorite = cat?.favorite ?? null;
  const priceOf = (o: Option) => optionPrice(o, cat?.addOns[o.id] ?? [], guests);

  const toggleShortlist = (id: string) =>
    updateCategory(category.key, (c) => ({
      ...c,
      shortlist: c.shortlist.includes(id) ? c.shortlist.filter((x) => x !== id) : [...c.shortlist, id],
    }));
  const setFavorite = (id: string) =>
    updateCategory(category.key, (c) => ({
      ...c,
      favorite: c.favorite === id ? null : id,
      shortlist: c.shortlist.includes(id) ? c.shortlist : [...c.shortlist, id],
    }));
  const toggleAddOn = (optionId: string, addOnId: string) =>
    updateCategory(category.key, (c) => {
      const current = c.addOns[optionId] ?? [];
      const next = current.includes(addOnId) ? current.filter((x) => x !== addOnId) : [...current, addOnId];
      return { ...c, addOns: { ...c.addOns, [optionId]: next } };
    });

  const slides = shortlist.length > 0 ? options.filter((o) => shortlist.includes(o.id)) : options;
  const fav = options.find((o) => o.id === favorite);

  return (
    <section className={`picker ${compact ? "compact" : ""}`}>
      <header className="picker-head">
        <div>
          <h2>{category.label}</h2>
          {options.length > 0 && (
            <p className="muted">
              Priced for {guests || "?"} guests · {shortlist.length} shortlisted
              {fav ? ` · Favorite: ${fav.name} (${money(priceOf(fav))})` : ""}
            </p>
          )}
        </div>
        <div className="row">
          {options.length > 0 && (
            <button onClick={() => setSlideshow(true)}>
              ▶ Slideshow{shortlist.length ? ` (${shortlist.length})` : ""}
            </button>
          )}
          <button className={options.length ? "" : "primary"} onClick={load} disabled={loading}>
            {loading ? "Searching…" : options.length ? "↻ New top 5" : "Find my top 5"}
          </button>
        </div>
      </header>

      {loading && (
        <p className="muted loading">
          Searching for {category.label.toLowerCase()} that match your style and budget. This can take a minute.
        </p>
      )}
      {error && <p className="error">{error}</p>}

      <div className="options">
        {options.map((o, i) => {
          const picked = shortlist.includes(o.id);
          const isFav = favorite === o.id;
          return (
            <article key={o.id} className={`option card ${picked ? "picked" : ""} ${isFav ? "fav" : ""}`}>
              <div className="rank">#{i + 1}</div>
              <h3>{o.name}</h3>
              <p className="kind">
                {o.kind}
                {o.location ? ` · ${o.location}` : ""}
                {o.capacity ? ` · up to ${o.capacity}` : ""}
              </p>
              <p>{o.description}</p>
              <ul className="highlights">
                {o.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <div className="price">
                <strong>{money(priceOf(o))}</strong>
                <span className="muted small">
                  {o.basePrice ? money(o.basePrice) : ""}
                  {o.basePrice && o.pricePerPerson ? " + " : ""}
                  {o.pricePerPerson ? `${money(o.pricePerPerson)}/guest` : ""}
                </span>
              </div>
              <p className="muted small">{o.priceNotes}</p>
              {configuring === o.id && o.addOns.length > 0 && (
                <div className="addons">
                  {o.addOns.map((a) => (
                    <label key={a.id}>
                      <input
                        type="checkbox"
                        checked={(cat?.addOns[o.id] ?? []).includes(a.id)}
                        onChange={() => toggleAddOn(o.id, a.id)}
                      />
                      {a.label}
                      <span className="muted">
                        +{money(a.price)}
                        {a.perPerson ? "/guest" : ""}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <div className="actions">
                <button className={picked ? "on" : ""} onClick={() => toggleShortlist(o.id)}>
                  {picked ? "✓ Picked" : "Pick"}
                </button>
                {o.addOns.length > 0 && (
                  <button onClick={() => setConfiguring(configuring === o.id ? null : o.id)}>
                    {configuring === o.id ? "Done" : "Configure"}
                  </button>
                )}
                <button className={`star ${isFav ? "on" : ""}`} onClick={() => setFavorite(o.id)}>
                  {isFav ? "★ Favorite" : "☆ Favorite"}
                </button>
                {o.website && (
                  <a href={o.website} target="_blank" rel="noreferrer" className="link small">
                    Website ↗
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {slideshow && slides.length > 0 && (
        <Slideshow
          slides={slides}
          favorite={favorite}
          priceOf={priceOf}
          onFavorite={setFavorite}
          onClose={() => setSlideshow(false)}
        />
      )}
    </section>
  );
}

function Slideshow({
  slides,
  favorite,
  priceOf,
  onFavorite,
  onClose,
}: {
  slides: Option[];
  favorite: string | null;
  priceOf: (o: Option) => number;
  onFavorite: (id: string) => void;
  onClose: () => void;
}) {
  const [i, setI] = useState(0);
  const o = slides[Math.min(i, slides.length - 1)];
  const go = (d: number) => setI((x) => (x + d + slides.length) % slides.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Slideshow" onClick={onClose}>
      <div className="slide" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="slide-hero" style={{ background: heroGradient(o.name) }}>
          <span>{o.kind}</span>
          <h2>{o.name}</h2>
        </div>
        <div className="slide-body">
          <p>{o.description}</p>
          <ul className="highlights">
            {o.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <p className="price">
            <strong>{money(priceOf(o))}</strong> <span className="muted small">estimated, with your add-ons</span>
          </p>
        </div>
        <footer className="slide-nav">
          <button onClick={() => go(-1)} aria-label="Previous">
            ←
          </button>
          <span className="muted">
            {i + 1} / {slides.length}
          </span>
          <button className={`star ${favorite === o.id ? "on" : ""}`} onClick={() => onFavorite(o.id)}>
            {favorite === o.id ? "★ Favorite" : "☆ Make favorite"}
          </button>
          <button onClick={() => go(1)} aria-label="Next">
            →
          </button>
        </footer>
      </div>
    </div>
  );
}

// A stable, pleasant gradient per option so each slide looks distinct.
function heroGradient(seed: string): string {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `linear-gradient(135deg, hsl(${h} 45% 72%), hsl(${(h + 40) % 360} 50% 55%))`;
}
