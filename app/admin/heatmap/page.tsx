import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { archetypes, venues } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

interface CountRow {
  key: string;
  shown: number;
  picked: number;
}

async function archetypeCounts(): Promise<CountRow[]> {
  const rows = await db.execute(sql<{ archetype_id: string; shown: number; picked: number }>`
    select archetype_id,
      count(*)::int as shown,
      count(*) filter (where selected_at is not null)::int as picked
    from packages
    where created_at >= now() - interval '30 days'
    group by archetype_id
  `);
  // Backfill any archetype that hasn't appeared yet, so the table shows all eight.
  const byId = new Map(
    rows.map((r) => {
      const x = r as { archetype_id: string; shown: number; picked: number };
      return [x.archetype_id, x] as const;
    }),
  );
  return archetypes.map((a) => {
    const r = byId.get(a.id);
    return {
      key: a.name,
      shown: r?.shown ?? 0,
      picked: r?.picked ?? 0,
    };
  });
}

async function venueCounts(): Promise<CountRow[]> {
  // Unnest venue_ids so each stage venue counts. A "picked" venue is one that
  // appeared in a package the user selected.
  const rows = await db.execute(sql<{ venue_id: string; shown: number; picked: number }>`
    select venue_id,
      count(*)::int as shown,
      count(*) filter (where selected_at is not null)::int as picked
    from (
      select unnest(venue_ids) as venue_id, selected_at
      from packages
      where created_at >= now() - interval '30 days'
    ) v
    group by venue_id
    order by shown desc
    limit 20
  `);
  const byId = new Map(venues.map((v) => [v.id, v.name]));
  return rows.map((r) => {
    const x = r as { venue_id: string; shown: number; picked: number };
    return {
      key: byId.get(x.venue_id) ?? x.venue_id,
      shown: x.shown,
      picked: x.picked,
    };
  });
}

function Bar({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: "brass" | "navy";
  label: string;
}) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div
      className="h-2 bg-hairline rounded-sm overflow-hidden"
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div
        className={color === "brass" ? "h-full bg-brass" : "h-full bg-primary"}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function HeatmapTable({
  title,
  rows,
}: {
  title: string;
  rows: CountRow[];
}) {
  const maxShown = Math.max(1, ...rows.map((r) => r.shown));
  return (
    <div>
      <h2 className="font-sans text-[13px] uppercase tracking-[0.18em] text-text-muted font-normal">
        {title}
      </h2>
      <div className="mt-3 border border-hairline rounded-sm divide-y divide-hairline">
        {rows.length === 0 && (
          <p className="px-4 py-6 font-display italic text-text-muted text-lg">
            No data yet.
          </p>
        )}
        {rows.map((r) => (
          <div key={r.key} className="px-4 py-3 flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-4 font-sans text-[15px]">
              <span className="text-text truncate">{r.key}</span>
              <span className="text-text-muted whitespace-nowrap">
                shown {r.shown} · picked {r.picked}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <Bar
                value={r.shown}
                max={maxShown}
                color="navy"
                label={`${r.key}: shown ${r.shown} of max ${maxShown}`}
              />
              <Bar
                value={r.picked}
                max={maxShown}
                color="brass"
                label={`${r.key}: picked ${r.picked} of max ${maxShown}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function HeatmapPage() {
  const [archetypeRows, venueRows] = await Promise.all([
    archetypeCounts(),
    venueCounts(),
  ]);

  return (
    <section>
      <h1 className="font-display font-medium text-3xl text-primary leading-tight">
        Heatmap
      </h1>
      <p className="font-sans text-base text-text-muted mt-2 leading-relaxed">
        Last 30 days. Navy bar is shown frequency, brass bar is picked frequency
        (where the user clicked into the package).
      </p>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <HeatmapTable
          title="Archetypes (all eight)"
          rows={archetypeRows.sort((a, b) => b.shown - a.shown)}
        />
        <HeatmapTable title="Top 20 venues" rows={venueRows} />
      </div>
    </section>
  );
}
