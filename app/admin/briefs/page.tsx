import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { briefs } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

function formatDate(d: Date): string {
  // All admin timestamps render in US Eastern. Vercel Functions and Postgres
  // operate in UTC; converting at the display layer keeps storage timezone-
  // agnostic while the operator sees Eastern.
  return d.toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n).trimEnd() + "…";
}

export default async function BriefsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, totalRow] = await Promise.all([
    db
      .select()
      .from(briefs)
      .orderBy(desc(briefs.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db.execute(sql<{ n: number }>`select count(*)::int as n from briefs`),
  ]);
  const total = (totalRow[0] as { n: number }).n;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section>
      <h1 className="font-display font-medium text-3xl text-primary leading-tight">
        Briefs
      </h1>
      <p className="font-sans text-base text-text-muted mt-2">
        {total.toLocaleString()} total. Page {page} of {totalPages}.
      </p>

      {rows.length === 0 ? (
        <p className="font-display italic text-text-muted text-lg mt-12">
          No briefs yet.
        </p>
      ) : (
        <div className="mt-8 border border-hairline rounded-sm overflow-x-auto">
          <table className="w-full font-sans text-[15px]">
            <caption className="sr-only">Submitted briefs, most recent first.</caption>
            <thead className="bg-surface">
              <tr className="text-left">
                <th className="px-4 py-3 text-[12px] uppercase tracking-[0.14em] text-text-muted font-semibold">
                  When submitted
                </th>
                <th className="px-4 py-3 text-[12px] uppercase tracking-[0.14em] text-text-muted font-semibold">
                  Vibe
                </th>
                <th className="px-4 py-3 text-[12px] uppercase tracking-[0.14em] text-text-muted font-semibold">
                  Budget
                </th>
                <th className="px-4 py-3 text-[12px] uppercase tracking-[0.14em] text-text-muted font-semibold">
                  When
                </th>
                <th className="px-4 py-3 text-[12px] uppercase tracking-[0.14em] text-text-muted font-semibold">
                  About her
                </th>
                <th className="px-4 py-3 text-[12px] uppercase tracking-[0.14em] text-text-muted font-semibold">
                  Avoid
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-hairline align-top">
                  <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-text">{r.vibe}</td>
                  <td className="px-4 py-3 text-text">{r.budget}</td>
                  <td className="px-4 py-3 text-text">{r.whenText}</td>
                  <td className="px-4 py-3 text-text max-w-[420px]">
                    <details>
                      <summary className="cursor-pointer">
                        {truncate(r.herDescription, 100)}
                      </summary>
                      <p className="mt-2 text-text-muted whitespace-pre-wrap">
                        {r.herDescription}
                      </p>
                    </details>
                  </td>
                  <td className="px-4 py-3 text-text-muted max-w-[260px]">
                    {r.avoid ? truncate(r.avoid, 80) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Brief pagination"
          className="mt-6 flex items-center justify-between font-sans text-base"
        >
          {page > 1 ? (
            <Link
              href={`/admin/briefs?page=${page - 1}`}
              className="text-text-muted hover:text-primary rounded-sm px-2 py-2 -mx-2"
            >
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          {page < totalPages ? (
            <Link
              href={`/admin/briefs?page=${page + 1}`}
              className="text-text-muted hover:text-primary rounded-sm px-2 py-2 -mx-2"
            >
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </section>
  );
}
