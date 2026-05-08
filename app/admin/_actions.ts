"use server";

// Server actions for admin mutations.
//
// SECURITY NOTE: These actions assume that Basic Auth in `middleware.ts` has
// already gated the caller. The middleware matches both `/admin/:path*` and
// `/api/admin/:path*`. Server actions are POSTed to a Next.js endpoint that is
// scoped under the page route that invoked them, so a server action invoked
// from `/admin/bookings` is gated by the same Basic Auth check. Do NOT lift
// these actions into pages outside `/admin/*` without rewiring auth.

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, ALLOWED_BOOKING_STATUSES, type BookingStatus } from "@/lib/db/schema";

function isStatus(s: string): s is BookingStatus {
  return (ALLOWED_BOOKING_STATUSES as readonly string[]).includes(s);
}

export async function setBookingStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("status") ?? "");
  if (!id || !isStatus(next)) return;

  await db
    .update(bookings)
    .set({ status: next, updatedAt: sql`now()` })
    .where(eq(bookings.id, id));

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}

export async function setBookingNote(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").slice(0, 1000);
  if (!id) return;

  await db
    .update(bookings)
    .set({ notes: note || null, updatedAt: sql`now()` })
    .where(eq(bookings.id, id));

  revalidatePath("/admin/bookings");
}
