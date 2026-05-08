import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Encore",
  description: "Encore operations.",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/briefs", label: "Briefs" },
  { href: "/admin/funnel", label: "Funnel" },
  { href: "/admin/heatmap", label: "Heatmap" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/costs", label: "Costs" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1200px] px-6 pt-8 pb-16">
        <header className="flex items-baseline justify-between border-b border-hairline pb-5">
          <Link
            href="/admin"
            className="font-display font-medium text-2xl text-primary tracking-[0.04em]"
          >
            Encore <span className="text-text-muted">·</span>{" "}
            <span className="text-text-muted text-sm uppercase tracking-[0.18em] align-middle">
              Admin
            </span>
          </Link>
          <Link
            href="/"
            className="font-sans text-xs uppercase tracking-[0.18em] text-text-muted hover:text-primary transition-colors"
          >
            ← Back to site
          </Link>
        </header>

        <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="font-sans text-xs uppercase tracking-[0.18em] text-text-muted hover:text-primary transition-colors py-1"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <main className="mt-10">{children}</main>
      </div>
    </div>
  );
}
