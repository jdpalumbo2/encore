import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface FunnelRow {
  reached_plan: number;
  submitted_brief: number;
  picked_package: number;
  confirmed: number;
}

async function funnelFor(intervalLiteral: string): Promise<FunnelRow> {
  const rows = await db.execute(sql<FunnelRow>`
    with steps as (
      select session_id, max(case event_name
        when 'plan.started'      then 1
        when 'brief.submitted'   then 2
        when 'package.selected'  then 3
        when 'booking.confirmed' then 4
        else 0 end) as max_step
      from events
      where created_at >= now() - ${sql.raw(`interval '${intervalLiteral}'`)}
      group by session_id
    )
    select
      count(*) filter (where max_step >= 1)::int as reached_plan,
      count(*) filter (where max_step >= 2)::int as submitted_brief,
      count(*) filter (where max_step >= 3)::int as picked_package,
      count(*) filter (where max_step >= 4)::int as confirmed
    from steps
  `);
  const r = rows[0] as unknown as FunnelRow | undefined;
  return r ?? { reached_plan: 0, submitted_brief: 0, picked_package: 0, confirmed: 0 };
}

const STEPS: Array<{ key: keyof FunnelRow; label: string }> = [
  { key: "reached_plan", label: "Reached /plan" },
  { key: "submitted_brief", label: "Submitted brief" },
  { key: "picked_package", label: "Picked a package" },
  { key: "confirmed", label: "Confirmed booking" },
];

function pct(part: number, whole: number): string {
  if (whole === 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

function FunnelTable({ row, label }: { row: FunnelRow; label: string }) {
  const top = row.reached_plan;
  return (
    <div>
      <p className="font-sans text-xs uppercase tracking-[0.18em] text-text-muted">
        {label}
      </p>
      <table className="mt-3 w-full font-sans text-sm border border-hairline rounded-sm">
        <thead className="bg-surface">
          <tr className="text-left">
            <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-text-muted font-normal">
              Step
            </th>
            <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-text-muted font-normal text-right">
              Sessions
            </th>
            <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-text-muted font-normal text-right">
              Of top
            </th>
            <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-text-muted font-normal text-right">
              Drop from prev.
            </th>
          </tr>
        </thead>
        <tbody>
          {STEPS.map((s, i) => {
            const value = row[s.key];
            const prev = i > 0 ? row[STEPS[i - 1].key] : value;
            const drop = prev > 0 ? Math.round(((prev - value) / prev) * 100) : 0;
            return (
              <tr key={s.key} className="border-t border-hairline">
                <td className="px-4 py-3 text-text">{s.label}</td>
                <td className="px-4 py-3 text-text text-right">{value}</td>
                <td className="px-4 py-3 text-text-muted text-right">
                  {pct(value, top)}
                </td>
                <td className="px-4 py-3 text-text-muted text-right">
                  {i === 0 ? "—" : `${drop}%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function FunnelPage() {
  const [last24, last7d] = await Promise.all([
    funnelFor("24 hours"),
    funnelFor("7 days"),
  ]);

  return (
    <section>
      <h1 className="font-display font-medium text-3xl text-primary leading-tight">
        Funnel
      </h1>
      <p className="font-sans text-sm text-text-muted mt-2">
        Sessions per step. A session is one cookie; one user can churn through
        the flow multiple times in different tabs.
      </p>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FunnelTable row={last24} label="Last 24 hours" />
        <FunnelTable row={last7d} label="Last 7 days" />
      </div>
    </section>
  );
}
