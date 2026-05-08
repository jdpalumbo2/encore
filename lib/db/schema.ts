import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Note: `briefs.her_description` contains free-form user input that frequently
// includes a real woman's name and personal details. Treat as PII. The only
// read path is gated by Basic Auth on /admin/*. See README "Privacy" section.
export const briefs = pgTable(
  "briefs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid("session_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    herDescription: text("her_description").notNull(),
    whenText: text("when_text").notNull(),
    vibe: text("vibe").notNull(),
    budget: text("budget").notNull(),
    avoid: text("avoid"),
    requestCountry: text("request_country"),
    requestCity: text("request_city"),
  },
  (t) => [
    index("briefs_session_id_idx").on(t.sessionId),
    index("briefs_created_at_idx").on(t.createdAt.desc()),
  ],
);

export const packages = pgTable(
  "packages",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    briefId: uuid("brief_id")
      .notNull()
      .references(() => briefs.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").notNull(),
    archetypeId: text("archetype_id").notNull(),
    archetypeName: text("archetype_name").notNull(),
    shape: text("shape").array().notNull(),
    venueIds: text("venue_ids").array().notNull(),
    priceLow: integer("price_low").notNull(),
    priceHigh: integer("price_high").notNull(),
    payload: jsonb("payload").notNull(),
    position: smallint("position").notNull(),
    selectedAt: timestamp("selected_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("packages_brief_id_idx").on(t.briefId),
    index("packages_session_id_idx").on(t.sessionId),
    index("packages_archetype_id_idx").on(t.archetypeId),
    index("packages_venue_ids_gin").using("gin", t.venueIds),
    index("packages_selected_at_idx")
      .on(t.selectedAt)
      .where(sql`${t.selectedAt} is not null`),
  ],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid("session_id").notNull(),
    briefId: uuid("brief_id").references(() => briefs.id, {
      onDelete: "set null",
    }),
    eventName: text("event_name").notNull(),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("events_session_created_idx").on(t.sessionId, t.createdAt),
    index("events_event_name_idx").on(t.eventName),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid("session_id").notNull(),
    briefId: uuid("brief_id")
      .notNull()
      .references(() => briefs.id, { onDelete: "cascade" }),
    packageId: uuid("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("bookings_status_idx").on(t.status, t.createdAt.desc())],
);

export const modelCalls = pgTable(
  "model_calls",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    briefId: uuid("brief_id").references(() => briefs.id, {
      onDelete: "set null",
    }),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    latencyMs: integer("latency_ms").notNull(),
    isRetry: boolean("is_retry").notNull().default(false),
    success: boolean("success").notNull(),
    errorKind: text("error_kind"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("model_calls_created_at_idx").on(t.createdAt.desc()),
    index("model_calls_retry_idx")
      .on(t.isRetry)
      .where(sql`${t.isRetry} = true`),
  ],
);

export const ALLOWED_EVENT_NAMES = [
  "landing.viewed",
  "plan.started",
  "brief.submitted",
  "package.selected",
  "booking.confirmed",
] as const;

export type AllowedEventName = (typeof ALLOWED_EVENT_NAMES)[number];

export const ALLOWED_BOOKING_STATUSES = ["pending", "contacted", "confirmed"] as const;
export type BookingStatus = (typeof ALLOWED_BOOKING_STATUSES)[number];
