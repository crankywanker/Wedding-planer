import { isDemoMode } from "@/lib/claude";

export function GET() {
  return Response.json({ demo: isDemoMode() });
}
