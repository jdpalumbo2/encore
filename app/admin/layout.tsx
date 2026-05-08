import Link from "next/link";
import type { Metadata } from "next";
import { AdminNav } from "./_nav";

export const metadata: Metadata = {
  title: "Admin · Encore",
  description: "Encore operations.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1200px] px-6 pt-8 pb-16">
        <header className="flex items-baseline justify-between border-b border-hairline pb-5 gap-4">
          <Link
            href="/admin"
            className="font-display font-medium text-2xl text-primary tracking-[0.04em] rounded-sm py-2 -my-2"
            aria-label="Encore admin, overview"
          >
            Encore <span className="text-text-muted">·</span>{" "}
            <span className="text-text-muted text-sm uppercase tracking-[0.18em] align-middle">
              Admin
            </span>
          </Link>
          <Link
            href="/"
            className="font-sans text-[13px] uppercase tracking-[0.18em] text-text-muted hover:text-primary transition-colors rounded-sm px-2 py-2 -mx-2 whitespace-nowrap"
          >
            ← Back to site
          </Link>
        </header>

        <AdminNav />

        <main className="mt-10">{children}</main>
      </div>
    </div>
  );
}
