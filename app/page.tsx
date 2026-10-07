"use client";

import { useEffect, useState } from "react";
import { PlanProvider, usePlan } from "@/lib/store";
import { FOOD, VENUES } from "@/lib/categories";
import { headcount, money } from "@/lib/cost";
import Interview from "@/components/Interview";
import OptionPicker from "@/components/OptionPicker";
import Vendors from "@/components/Vendors";
import GuestList from "@/components/GuestList";
import CostEstimate from "@/components/CostEstimate";

const TABS = [
  { id: "interview", label: "1 · Interview" },
  { id: "venues", label: "2 · Venues" },
  { id: "food", label: "3 · Food" },
  { id: "vendors", label: "4 · Vendors" },
  { id: "guests", label: "5 · Guest list" },
  { id: "estimate", label: "6 · Est. cost" },
];

export default function Page() {
  return (
    <PlanProvider>
      <App />
    </PlanProvider>
  );
}

function App() {
  const { state, reset } = usePlan();
  const [tab, setTab] = useState("interview");
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setDemo(Boolean(d.demo)))
      .catch(() => {});
  }, []);

  const { profile } = state;
  const guests = headcount(state.guests, profile);

  return (
    <main>
      <header className="top">
        <div>
          <h1>{profile.coupleNames ? `${profile.coupleNames}’s Wedding` : "Wedding Planner"}</h1>
          <p className="muted">
            {[profile.weddingDate, profile.location, guests ? `${guests} guests` : null, profile.budget ? `${money(profile.budget)} budget` : null]
              .filter(Boolean)
              .join(" · ") || "Tell us about your day and we’ll build the plan."}
          </p>
        </div>
        <button
          className="link"
          onClick={() => {
            if (confirm("Start over? This clears your interview, picks and guest list.")) {
              reset();
              setTab("interview");
            }
          }}
        >
          Start over
        </button>
      </header>

      {demo && (
        <p className="banner">
          Demo mode: the interview is scripted and the recommendations are samples. Set <code>ANTHROPIC_API_KEY</code> to get live AI
          recommendations.
        </p>
      )}

      <nav className="tabs" aria-label="Planning steps">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "interview" && <Interview onDone={() => setTab("venues")} />}
      {tab === "venues" && <OptionPicker category={VENUES} />}
      {tab === "food" && <OptionPicker category={FOOD} />}
      {tab === "vendors" && <Vendors />}
      {tab === "guests" && <GuestList />}
      {tab === "estimate" && <CostEstimate goTo={setTab} />}
    </main>
  );
}
