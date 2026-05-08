import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, packages as packagesTable } from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 10;

const MAX_BODY_BYTES = 512;

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return jsonError(400, "Payload too large.");
  }

  let body: { archetypeId?: unknown };
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return jsonError(400, "Invalid JSON.");
  }

  const archetypeId = body.archetypeId;
  if (typeof archetypeId !== "string" || archetypeId.length === 0) {
    return jsonError(400, "Missing archetypeId.");
  }

  const cookieHeader = req.headers.get("cookie") ?? "";
  const sidMatch = cookieHeader.match(/(?:^|;\s*)encore_sid=([^;]+)/);
  const sessionId = sidMatch?.[1];
  if (!sessionId) {
    return jsonError(400, "Missing session.");
  }

  // Find the most recent package this session was shown for that archetype.
  const rows = await db
    .select({
      id: packagesTable.id,
      briefId: packagesTable.briefId,
    })
    .from(packagesTable)
    .where(
      and(
        eq(packagesTable.sessionId, sessionId),
        eq(packagesTable.archetypeId, archetypeId),
      ),
    )
    .orderBy(desc(packagesTable.createdAt))
    .limit(1);

  if (rows.length === 0) {
    // No package row yet — telemetry from /api/curate may not have flushed.
    // Drop silently rather than synthesizing a booking with no package context.
    return new NextResponse(null, { status: 204 });
  }

  const { id: packageId, briefId } = rows[0];

  // Idempotency: don't insert a duplicate booking if the user double-mounts
  // /confirm. Check for an existing pending booking against this package.
  const existing = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.packageId, packageId),
        eq(bookings.sessionId, sessionId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return new NextResponse(null, { status: 204 });
  }

  waitUntil(
    db
      .insert(bookings)
      .values({
        sessionId,
        briefId,
        packageId,
        status: "pending",
      })
      .then(() => undefined)
      .catch((e) => {
        console.error("[bookings] insert failed:", e);
      }),
  );

  return new NextResponse(null, { status: 204 });
}

// Suppress unused-imports complaint from referenced helpers we keep handy
// for future read paths.
void isNull;
void sql;
