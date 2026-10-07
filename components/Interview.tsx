"use client";

import { useEffect, useRef, useState } from "react";
import { usePlan } from "@/lib/store";
import type { ChatMessage, InterviewTurn, Profile } from "@/lib/schemas";
import { money } from "@/lib/cost";

// Minimal typing for the browser Speech Recognition API (not in lib.dom yet).
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};

function getRecognition(): Recognition | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, (new () => Recognition) | undefined>;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export default function Interview({ onDone }: { onDone: () => void }) {
  const { state, update, loaded } = usePlan();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => setCanListen(getRecognition() !== null), []);
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
  }, [state.messages.length, busy]);

  async function send(messages: ChatMessage[]) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, profile: state.profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      const turn = data as InterviewTurn;
      update((s) => ({
        ...s,
        messages: [...messages, { role: "assistant", content: turn.reply }],
        profile: turn.profile,
        interviewComplete: s.interviewComplete || turn.complete,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      update((s) => ({ ...s, messages }));
    } finally {
      setBusy(false);
    }
  }

  // Kick off the interview with the planner's first question.
  useEffect(() => {
    if (loaded && state.messages.length === 0 && !busy) void send([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  function submit() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const messages: ChatMessage[] = [...state.messages, { role: "user", content: text }];
    update((s) => ({ ...s, messages }));
    void send(messages);
  }

  function toggleMic() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = getRecognition();
    if (!rec) return;
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    const before = input ? input + " " : "";
    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      setInput(before + text);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  return (
    <div className="interview">
      <section className="chat card">
        <header className="chat-head">
          <h2>Planning interview</h2>
          <p className="muted">Answer by typing or tap the mic and talk — the planner listens and takes notes.</p>
        </header>
        <div className="chat-log" aria-live="polite" ref={logRef}>
          {state.messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
          {busy && <div className="bubble assistant typing">Planner is thinking…</div>}
          {error && (
            <div className="error">
              {error}{" "}
              <button className="link" onClick={() => send(state.messages)}>
                Retry
              </button>
            </div>
          )}
        </div>
        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {canListen && (
            <button
              type="button"
              className={`mic ${listening ? "on" : ""}`}
              onClick={toggleMic}
              aria-label={listening ? "Stop listening" : "Speak your answer"}
              title={listening ? "Stop listening" : "Speak your answer"}
            >
              {listening ? "■" : "🎤"}
            </button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? "Listening…" : "Type your answer…"}
            disabled={busy && state.messages.length === 0}
          />
          <button type="submit" className="primary" disabled={busy || !input.trim()}>
            Send
          </button>
        </form>
      </section>

      <aside className="card notes">
        <h3>What we’ve recorded</h3>
        <ProfileNotes profile={state.profile} />
        {state.interviewComplete && (
          <button className="primary wide" onClick={onDone}>
            See my venues →
          </button>
        )}
      </aside>
    </div>
  );
}

function ProfileNotes({ profile }: { profile: Profile }) {
  const rows: [string, string | null][] = [
    ["Couple", profile.coupleNames],
    ["Date", profile.weddingDate],
    ["Location", profile.location],
    ["Guests", profile.guestCount?.toString() ?? null],
    ["Budget", profile.budget != null ? money(profile.budget) : null],
    ["Style", profile.style],
    ["Colors", profile.colors],
    ["Ceremony", profile.ceremony],
    ["Food", profile.foodPreferences],
    ["Dietary", profile.dietaryRestrictions],
    ["Vendors needed", profile.vendorsNeeded.join(", ") || null],
    ["Must-haves", profile.mustHaves.join(", ") || null],
  ];
  return (
    <dl className="profile">
      {rows.map(([k, v]) => (
        <div key={k} className={v ? "" : "empty"}>
          <dt>{k}</dt>
          <dd>{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
