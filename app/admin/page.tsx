import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { computeCost, formatUsd } from "@/lib/db/cost";

export const dynamic = "force-dynamic";

interface Tile {
  label: string;
  value: string;
  href: string;
  hint?: string;
}

async function fetchOverview(): Promise<Tile[]> {
  // Run all queries in parallel.
  const [briefs7d, pending, funnel7d, spend24h, archetype7d] = await Promise.all([
    db.execute(sql`
      select count(*)::int as n
      from briefs
      where created_at >= now() - interval '7 days'
    `),
    db.execute(sql`
      select count(*)::int as n
      from bookings
      where status = 'pending'
    `),
    db.execute(sql<{ reached: number; confirmed: number }>`
      with steps as (
        select session_id, max(case event_name
          when 'plan.started' then 1
          when 'brief.submitted' then 2
          when 'package.selected' then 3
          when 'booking.confirmed' then 4
          else 0 end) as max_step
        from events
        where created_at >= now() - interval '7 days'
        group by session_id
      )
      select
        count(*) filter (where max_step >= 1)::int as reached,
        count(*) filter (where max_step >= 4)::int as confirmed
      from steps
    `),
    db.execute(sql<{ input: number; output: number }>`
      select
        coalesce(sum(input_tokens), 0)::int as input,
        coalesce(sum(output_tokens), 0)::int as output
      from model_calls
      where created_at >= now() - interval '24 hours' and success = true
    `),
    db.execute(sql<{ archetype_id: string; n: number }>`
      select archetype_id, count(*)::int as n
      from packages
      where selected_at is not null and selected_at >= now() - interval '7 days'
      group by archetype_id
      order by n desc
      limit 1
    `),
  ]);

  const briefsCount = (briefs7d[0] as { n: number }).n;
  const pendingCount = (pending[0] as { n: number }).n;
  const funnelRow = funnel7d[0] as { reached: number; confirmed: number };
  const completion =
    funnelRow.reached > 0
      ? Math.round((funnelRow.confirmed / funnelRow.reached) * 100)
      : 0;
  const spend = spend24h[0] as { input: number; output: number };
  const cost = computeCost(spend.input, spend.output);
  const topArchetype = archetype7d[0] as { archetype_id: string; n: number } | undefined;

  return [
    {
      label: "Briefs last 7 days",
      value: String(briefsCount),
      href: "/admin/briefs",
      hint: "Each row a date attempted.",
    },
    {
      label: "Funnel completion 7d",
      value: `${completion}%`,
      href: "/admin/funnel",
      hint:
        funnelRow.reached > 0
          ? `${funnelRow.confirmed} of ${funnelRow.reached} reached confirm.`
          : "Nothing yet.",
    },
    {
      label: "Top archetype 7d",
      value: topArchetype?.archetype_id ?? "—",
      href: "/admin/heatmap",
      hint: topArchetype ? `${topArchetype.n} picks.` : "No picks yet.",
    },
    {
      label: "Bookings pending",
      value: String(pendingCount),
      href: "/admin/bookings",
      hint: "Awaiting outreach.",
    },
    {
      label: "Spend last 24h",
      value: formatUsd(cost),
      href: "/admin/costs",
      hint: `${spend.input.toLocaleString()} in / ${spend.output.toLocaleString()} out tokens.`,
    },
  ];
}

export default async function AdminOverview() {
  const tiles = await fetchOverview();
  return (
    <section>
      <h1 className="font-display font-medium text-3xl text-primary leading-tight">
        Overview
      </h1>
      <p className="font-sans text-sm text-text-muted mt-2">
        At a glance. All windows are last 7 days unless noted.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-hairline border border-hairline">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="bg-background p-6 hover:bg-surface transition-colors flex flex-col gap-2"
          >
            <p className="font-sans text-xs uppercase tracking-[0.18em] text-text-muted">
              {t.label}
            </p>
            <p className="font-display font-medium text-3xl text-primary leading-tight">
              {t.value}
            </p>
            {t.hint && (
              <p className="font-sans text-xs text-text-muted">{t.hint}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
