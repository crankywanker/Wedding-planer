import { describe, expect, it } from "vitest";
import { demoInterviewTurn, demoRecommend } from "@/lib/demo";
import { emptyProfile, OptionSchema, type ChatMessage } from "@/lib/schemas";

describe("demo interview", () => {
  it("records answers into the profile and finishes", () => {
    const answers = ["Sam & Alex", "June 2027", "Asheville", "120 guests", "$40k", "rustic", "BBQ", "vegetarians", "Photographer, Florist and DJ", "string lights"];
    let profile = emptyProfile;
    const messages: ChatMessage[] = [];
    let turn = demoInterviewTurn(messages, profile);
    for (const a of answers) {
      messages.push({ role: "assistant", content: turn.reply }, { role: "user", content: a });
      turn = demoInterviewTurn(messages, profile);
      profile = turn.profile;
    }
    expect(turn.complete).toBe(true);
    expect(profile.guestCount).toBe(120);
    expect(profile.budget).toBe(40000);
    expect(profile.vendorsNeeded).toEqual(["Photographer", "Florist", "DJ"]);
  });
});

describe("demo recommendations", () => {
  it.each(["venues", "food", "vendor:Photographer", "vendor:Balloon artist"])("returns 5 valid options for %s", (key) => {
    const options = demoRecommend(key);
    expect(options).toHaveLength(5);
    for (const o of options) expect(OptionSchema.safeParse(o).success).toBe(true);
    expect(new Set(options.map((o) => o.id)).size).toBe(5);
  });
});
