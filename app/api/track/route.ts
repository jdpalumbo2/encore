import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  ALLOWED_EVENT_NAMES,
  events,
  packages as packagesTable,
  type AllowedEventName,
} from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 10;

const MAX_BODY_BYTES = 2048;

function isAllowedEvent(s: unknown): s is AllowedEventName {
  return typeof s === "string" && (ALLOWED_EVENT_NAMES as readonly string[]).includes(s);
}

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

async function markPackageSelected(sessionId: string, archetypeId: string) {
  // Update the most recent package row for this (session, archetype) that
  // hasn't been marked selected yet. Uses a subquery for the limit-1.
  const subquery = sql`(
    select id from ${packagesTable}
    where ${packagesTable.sessionId} = ${sessionId}
      and ${packagesTable.archetypeId} = ${archetypeId}
      and ${packagesTable.selectedAt} is null
    order by ${packagesTable.createdAt} desc
    limit 1
  )`;
  await db
    .update(packagesTable)
    .set({ selectedAt: sql`now()` })
    .where(
      and(
        eq(packagesTable.sessionId, sessionId),
        eq(packagesTable.archetypeId, archetypeId),
        isNull(packagesTable.selectedAt),
        sql`${packagesTable.id} = ${subquery}`,
      ),
    );
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return jsonError(400, "Payload too large.");
  }

  let body: { eventName?: unknown; payload?: unknown };
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return jsonError(400, "Invalid JSON.");
  }

  if (!isAllowedEvent(body.eventName)) {
    return jsonError(400, "Unknown event.");
  }

  const cookieHeader = req.headers.get("cookie") ?? "";
  const sidMatch = cookieHeader.match(/(?:^|;\s*)encore_sid=([^;]+)/);
  const sessionId = sidMatch?.[1];
  if (!sessionId) {
    return jsonError(400, "Missing session.");
  }

  const payloadJson =
    body.payload !== undefined ? JSON.stringify(body.payload) : null;
  if (payloadJson && payloadJson.length > MAX_BODY_BYTES) {
    return jsonError(400, "Payload too large.");
  }

  const eventName = body.eventName;
  const payload =
    body.payload === undefined ? null : (body.payload as Record<string, unknown>);

  waitUntil(
    (async () => {
      try {
        await db.insert(events).values({
          sessionId,
          eventName,
          payload,
        });

        // Side-effect: mark the picked package row for the heatmap.
        if (eventName === "package.selected" && payload) {
          const archetypeId = payload.archetypeId;
          if (typeof archetypeId === "string" && archetypeId.length > 0) {
            await markPackageSelected(sessionId, archetypeId);
          }
        }
      } catch (e) {
        console.error("[track] insert failed:", e);
      }
    })(),
  );

  return new NextResponse(null, { status: 204 });
}
