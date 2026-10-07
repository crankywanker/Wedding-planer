import { z } from "zod";
import { interviewTurn, isDemoMode } from "@/lib/claude";
import { demoInterviewTurn } from "@/lib/demo";
import { ProfileSchema } from "@/lib/schemas";

const Body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(200),
  profile: ProfileSchema,
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { messages, profile } = parsed.data;

  if (isDemoMode()) return Response.json(demoInterviewTurn(messages, profile));
  try {
    return Response.json(await interviewTurn(messages, profile));
  } catch (err) {
    console.error(err);
    return Response.json({ error: err instanceof Error ? err.message : "Something went wrong" }, { status: 502 });
  }
}
