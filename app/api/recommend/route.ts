import { z } from "zod";
import { isDemoMode, recommend } from "@/lib/claude";
import { demoRecommend } from "@/lib/demo";
import { ProfileSchema } from "@/lib/schemas";

export const maxDuration = 300;

const Body = z.object({
  categoryKey: z.string().max(100),
  brief: z.string().max(1000),
  profile: ProfileSchema,
  guests: z.number().int().min(0).max(5000),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { categoryKey, brief, profile, guests } = parsed.data;

  if (isDemoMode()) return Response.json({ options: demoRecommend(categoryKey) });
  try {
    return Response.json({ options: await recommend(brief, profile, guests) });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err instanceof Error ? err.message : "Something went wrong" }, { status: 502 });
  }
}
