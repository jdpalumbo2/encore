"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/briefs", label: "Briefs" },
  { href: "/admin/funnel", label: "Funnel" },
  { href: "/admin/heatmap", label: "Heatmap" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/costs", label: "Costs" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="mt-6 flex flex-wrap gap-x-2 gap-y-1">
      {NAV.map((n) => {
        const active =
          n.href === "/admin"
            ? pathname === "/admin"
            : pathname === n.href || pathname.startsWith(n.href + "/");
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "font-sans text-[13px] uppercase tracking-[0.18em] transition-colors rounded-sm px-3 py-2",
              active
                ? "text-primary bg-surface font-semibold"
                : "text-text-muted hover:text-primary hover:bg-surface/60",
            )}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
