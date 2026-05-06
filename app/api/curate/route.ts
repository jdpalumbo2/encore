import { NextResponse } from "next/server";
import type { IntakeAnswers, Package } from "@/lib/types";

// Stubbed in Phase 3; real implementation lands in Phase 4.
export async function POST(req: Request) {
  const _answers = (await req.json()) as IntakeAnswers;
  void _answers;
  const packages: Package[] = [];
  return NextResponse.json({ packages });
}
