import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  ALLOWED_BOOKING_STATUSES,
  bookings,
  briefs,
  packages,
  type BookingStatus,
} from "@/lib/db/schema";
import { setBookingStatus, setBookingNote } from "../_actions";

export const dynamic = "force-dynamic";

interface CardRow {
  id: string;
  status: string;
  notes: string | null;
  archetypeName: string;
  whenText: string;
  herDescription: string;
  vibe: string;
  budget: string;
  firstVenueName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const COLUMNS: { status: BookingStatus; label: string; nextStatus: BookingStatus | null; nextLabel: string | null }[] = [
  { status: "pending", label: "Pending", nextStatus: "contacted", nextLabel: "Mark contacted" },
  { status: "contacted", label: "Contacted", nextStatus: "confirmed", nextLabel: "Mark confirmed" },
  { status: "confirmed", label: "Confirmed", nextStatus: null, nextLabel: null },
];

async function fetchBookings(): Promise<CardRow[]> {
  const rows = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      notes: bookings.notes,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      archetypeName: packages.archetypeName,
      payload: packages.payload,
      whenText: briefs.whenText,
      herDescription: briefs.herDescription,
      vibe: briefs.vibe,
      budget: briefs.budget,
    })
    .from(bookings)
    .innerJoin(packages, eq(packages.id, bookings.packageId))
    .innerJoin(briefs, eq(briefs.id, bookings.briefId))
    .orderBy(desc(bookings.updatedAt));

  return rows.map((r) => {
    const payload = r.payload as
      | { stages?: Array<{ venue?: { name?: string } }> }
      | null;
    const firstVenue = payload?.stages?.[0]?.venue?.name ?? null;
    return {
      id: r.id,
      status: r.status,
      notes: r.notes,
      archetypeName: r.archetypeName,
      whenText: r.whenText,
      herDescription: r.herDescription,
      vibe: r.vibe,
      budget: r.budget,
      firstVenueName: firstVenue,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  });
}

function formatRelativeShort(d: Date): string {
  const ms = Date.now() - d.getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n).trimEnd() + "…";
}

function Card({ b }: { b: CardRow }) {
  const col = COLUMNS.find((c) => c.status === b.status);
  return (
    <article className="bg-background border border-hairline rounded-sm p-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between font-sans text-xs uppercase tracking-[0.14em] text-text-muted">
        <span>{b.archetypeName}</span>
        <span>{formatRelativeShort(b.updatedAt)}</span>
      </div>
      {b.firstVenueName && (
        <p className="font-display font-medium text-base text-primary leading-tight">
          {b.firstVenueName}
        </p>
      )}
      <p className="font-sans text-xs text-text-muted">
        {b.whenText} · {b.vibe} · {b.budget}
      </p>
      <p className="font-sans text-sm text-text leading-snug">
        {truncate(b.herDescription, 120)}
      </p>

      {b.notes && (
        <p className="font-sans text-xs text-text-muted italic border-l border-brass pl-3">
          {b.notes}
        </p>
      )}

      <form
        action={setBookingNote}
        className="flex items-center gap-2 mt-1"
      >
        <input type="hidden" name="id" value={b.id} />
        <input
          name="note"
          defaultValue={b.notes ?? ""}
          placeholder="Add note"
          className="flex-1 bg-surface border border-hairline px-2 py-1 font-sans text-xs text-text rounded-sm focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="font-sans text-xs uppercase tracking-[0.14em] text-text-muted hover:text-primary py-1"
        >
          Save
        </button>
      </form>

      <div className="flex items-center justify-between mt-1">
        {col?.nextStatus && col.nextLabel && (
          <form action={setBookingStatus}>
            <input type="hidden" name="id" value={b.id} />
            <input type="hidden" name="status" value={col.nextStatus} />
            <button
              type="submit"
              className="font-sans text-xs font-semibold tracking-[0.02em] bg-brass text-primary px-3 py-1.5 rounded-sm hover:bg-brass-hover transition-colors"
            >
              {col.nextLabel}
            </button>
          </form>
        )}
        {b.status !== "pending" && (
          <form action={setBookingStatus}>
            <input type="hidden" name="id" value={b.id} />
            <input
              type="hidden"
              name="status"
              value={b.status === "confirmed" ? "contacted" : "pending"}
            />
            <button
              type="submit"
              className="font-sans text-xs uppercase tracking-[0.14em] text-text-muted hover:text-primary"
            >
              ← back
            </button>
          </form>
        )}
      </div>
    </article>
  );
}

export default async function BookingsPage() {
  const all = await fetchBookings();
  const byStatus = new Map<string, CardRow[]>();
  for (const s of ALLOWED_BOOKING_STATUSES) byStatus.set(s, []);
  for (const b of all) byStatus.get(b.status)?.push(b);

  return (
    <section>
      <h1 className="font-display font-medium text-3xl text-primary leading-tight">
        Bookings
      </h1>
      <p className="font-sans text-sm text-text-muted mt-2">
        {all.length.toLocaleString()} total. Advance status with the buttons. No
        drag-and-drop in round one.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map((c) => {
          const items = byStatus.get(c.status) ?? [];
          return (
            <div key={c.status} className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between border-b border-hairline pb-2">
                <p className="font-sans text-xs uppercase tracking-[0.18em] text-text-muted">
                  {c.label}
                </p>
                <p className="font-sans text-xs text-text-muted">{items.length}</p>
              </div>
              {items.length === 0 ? (
                <p className="font-display italic text-text-muted text-sm">
                  Nothing here.
                </p>
              ) : (
                items.map((b) => <Card key={b.id} b={b} />)
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
