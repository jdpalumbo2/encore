import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { computeCost, formatUsd } from "@/lib/db/cost";

export const dynamic = "force-dynamic";

interface DailyRow {
  day: string; // YYYY-MM-DD
  requests: number;
  retries: number;
  errors: number;
  input_tokens: number;
  output_tokens: number;
}

async function dailyBreakdown(): Promise<DailyRow[]> {
  const rows = await db.execute(sql<DailyRow>`
    select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
      count(*)::int as requests,
      count(*) filter (where is_retry = true)::int as retries,
      count(*) filter (where success = false)::int as errors,
      coalesce(sum(input_tokens), 0)::int as input_tokens,
      coalesce(sum(output_tokens), 0)::int as output_tokens
    from model_calls
    where created_at >= now() - interval '7 days'
    group by 1
    order by 1 desc
  `);
  return rows.map((r) => r as unknown as DailyRow);
}

async function todayHeadline() {
  const rows = await db.execute(sql<{
    requests: number;
    retries: number;
    errors: number;
    input_tokens: number;
    output_tokens: number;
  }>`
    select
      count(*)::int as requests,
      count(*) filter (where is_retry = true)::int as retries,
      count(*) filter (where success = false)::int as errors,
      coalesce(sum(input_tokens), 0)::int as input_tokens,
      coalesce(sum(output_tokens), 0)::int as output_tokens
    from model_calls
    where created_at >= date_trunc('day', now())
  `);
  return rows[0] as {
    requests: number;
    retries: number;
    errors: number;
    input_tokens: number;
    output_tokens: number;
  };
}

function pct(part: number, whole: number): string {
  if (whole === 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

export default async function CostsPage() {
  const [today, daily] = await Promise.all([todayHeadline(), dailyBreakdown()]);
  const todayCost = computeCost(today.input_tokens, today.output_tokens);

  return (
    <section>
      <h1 className="font-display font-medium text-3xl text-primary leading-tight">
        Costs
      </h1>
      <p className="font-sans text-base text-text-muted mt-2 leading-relaxed">
        Anthropic API usage. Pricing is hardcoded at $3 / $15 per 1M input /
        output tokens; update <code className="text-text font-mono text-[15px]">lib/db/cost.ts</code> if Anthropic changes it.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-px bg-hairline border border-hairline">
        <div className="bg-background p-6 flex flex-col gap-2">
          <p className="font-sans text-[13px] uppercase tracking-[0.18em] text-text-muted">
            Spend today
          </p>
          <p className="font-display font-medium text-3xl text-primary">
            {formatUsd(todayCost)}
          </p>
          <p className="font-sans text-sm text-text-muted leading-relaxed">
            {today.input_tokens.toLocaleString()} in /{" "}
            {today.output_tokens.toLocaleString()} out tokens.
          </p>
        </div>
        <div className="bg-background p-6 flex flex-col gap-2">
          <p className="font-sans text-[13px] uppercase tracking-[0.18em] text-text-muted">
            Requests today
          </p>
          <p className="font-display font-medium text-3xl text-primary">
            {today.requests}
          </p>
          <p className="font-sans text-sm text-text-muted leading-relaxed">
            {pct(today.retries, today.requests)} retried · {pct(today.errors, today.requests)} errored.
          </p>
        </div>
        <div className="bg-background p-6 flex flex-col gap-2">
          <p className="font-sans text-[13px] uppercase tracking-[0.18em] text-text-muted">
            Spend last 7 days
          </p>
          <p className="font-display font-medium text-3xl text-primary">
            {formatUsd(
              daily.reduce(
                (acc, d) => acc + computeCost(d.input_tokens, d.output_tokens),
                0,
              ),
            )}
          </p>
          <p className="font-sans text-sm text-text-muted leading-relaxed">
            Across{" "}
            {daily.reduce((acc, d) => acc + d.requests, 0).toLocaleString()}{" "}
            requests.
          </p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-sans text-[13px] uppercase tracking-[0.18em] text-text-muted font-normal">
          Daily breakdown (last 7 days)
        </h2>
        <table className="mt-3 w-full font-sans text-[15px] border border-hairline rounded-sm">
          <caption className="sr-only">Daily Anthropic usage breakdown</caption>
          <thead className="bg-surface">
            <tr className="text-left">
              <th className="px-4 py-3 text-[12px] uppercase tracking-[0.14em] text-text-muted font-semibold">Day</th>
              <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-text-muted font-normal text-right">Requests</th>
              <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-text-muted font-normal text-right">Retries</th>
              <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-text-muted font-normal text-right">Errors</th>
              <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-text-muted font-normal text-right">In tokens</th>
              <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-text-muted font-normal text-right">Out tokens</th>
              <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-text-muted font-normal text-right">Spend</th>
            </tr>
          </thead>
          <tbody>
            {daily.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 font-display italic text-text-muted text-center text-base">
                  No requests yet.
                </td>
              </tr>
            )}
            {daily.map((d) => (
              <tr key={d.day} className="border-t border-hairline">
                <td className="px-4 py-3 text-text">{d.day}</td>
                <td className="px-4 py-3 text-text text-right">{d.requests}</td>
                <td className="px-4 py-3 text-text-muted text-right">{d.retries}</td>
                <td className="px-4 py-3 text-text-muted text-right">{d.errors}</td>
                <td className="px-4 py-3 text-text-muted text-right">
                  {d.input_tokens.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-text-muted text-right">
                  {d.output_tokens.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-text text-right">
                  {formatUsd(computeCost(d.input_tokens, d.output_tokens))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
