import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import {
  InterviewTurnSchema,
  RecommendationsSchema,
  type ChatMessage,
  type InterviewTurn,
  type Option,
  type Profile,
} from "./schemas";

const MODEL = "claude-opus-5-5";

export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === "true") return true;
  return !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN;
}

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic();
  return client;
}

// Server-side fallback: if a request is declined, the API retries it on the
// model Anthropic recommends for that case instead of returning a refusal.
const fallback: Pick<Anthropic.Beta.MessageCreateParams, "betas" | "fallbacks"> = {
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
};

const INTERVIEW_SYSTEM = `You are a warm, efficient wedding planner interviewing a couple to plan their wedding.

Ask ONE question at a time, in plain conversational language, and keep each reply to 1-3 sentences.
Cover, roughly in this order: names, date or season, location, guest count, total budget, style and colors,
ceremony plans, food (cuisine, service style), dietary restrictions, which vendors they still need, and must-haves.
Skip anything they've already told you. If an answer is vague (e.g. "not too expensive"), ask a quick follow-up for a number.

Every turn, return the complete profile including everything learned so far. Store budget as a single USD number
(use the midpoint of a range) and guest count as a number. Set complete=true once you know location, guest count,
budget, style and food preferences; when complete, tell them their plan is ready and that they can keep chatting to refine it.`;

const OPENER = "Hi! We're ready to start planning.";

export async function interviewTurn(messages: ChatMessage[], profile: Profile): Promise<InterviewTurn> {
  // The UI shows the planner's question first, but the API needs the
  // conversation to open with a user turn, so a fixed greeting always leads.
  const history: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: OPENER },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    ...fallback,
    system: [
      { type: "text", text: INTERVIEW_SYSTEM, cache_control: { type: "ephemeral" } },
      { type: "text", text: `Profile so far:\n${JSON.stringify(profile, null, 2)}` },
    ],
    output_config: { effort: "low", format: betaZodOutputFormat(InterviewTurnSchema) },
    messages: history,
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("The planner couldn't respond to that. Try rephrasing.");
  }
  return response.parsed_output;
}

function profileSummary(profile: Profile, guests: number): string {
  return JSON.stringify({ ...profile, guestCount: guests || profile.guestCount }, null, 2);
}

const textOf = (content: Anthropic.Beta.BetaContentBlock[]) =>
  content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

// Two steps: first research with web search (free-form notes, since search
// results carry citations, which structured output doesn't accept), then turn
// the notes into structured options.
export async function recommend(brief: string, profile: Profile, guests: number): Promise<Option[]> {
  const research = `Research the top 5 ${brief}

Couple's profile:
${profileSummary(profile, guests)}

Use web search to find real businesses in or near their location that fit their style, capacity and budget.
For each, note: name, what kind of place/business it is, location, capacity, website, 3-5 selling points,
realistic current US-dollar pricing for this guest count (flat and/or per guest, and whether it's published or your estimate),
and 2-4 optional upgrades with prices. Rank best match first.`;

  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: research }];
  let notes = "";
  // Server tools can pause a long turn; continue it until the model finishes.
  for (let i = 0; i < 5 && !notes; i++) {
    const response = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      ...fallback,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
      output_config: { effort: "medium" },
      messages,
    });
    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }
    if (response.stop_reason === "refusal") break;
    notes = textOf(response.content);
  }
  if (!notes) throw new Error("Couldn't research options right now. Please try again.");

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    ...fallback,
    output_config: { effort: "low", format: betaZodOutputFormat(RecommendationsSchema) },
    messages: [
      {
        role: "user",
        content: `Turn these research notes into exactly 5 options for ${guests || "the couple's"} guests.
Use only businesses from the notes. Give each option a short unique kebab-case id and each add-on a unique id.
Put flat costs in basePrice and per-guest costs in pricePerPerson; say in priceNotes what is estimated.

<notes>
${notes}
</notes>`,
      },
    ],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("Couldn't build recommendations right now. Please try again.");
  }
  return response.parsed_output.options.slice(0, 5);
}
