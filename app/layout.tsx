import type { Metadata } from "next";
import Link from "next/link";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://encore-mocha-ten.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Encore",
    template: "%s · Encore",
  },
  description: "Plan a night in West Palm Beach. By invitation.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-text">
        <a
          href="#main"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:bg-background focus-visible:text-primary focus-visible:px-4 focus-visible:py-2 focus-visible:rounded-sm focus-visible:shadow-md focus-visible:border focus-visible:border-primary"
        >
          Skip to content
        </a>
        <header className="w-full border-b border-hairline">
          <div className="mx-auto max-w-[1100px] px-6 py-5 flex items-center">
            <Link
              href="/"
              className="font-display font-medium text-2xl text-primary tracking-[0.06em] rounded-sm py-2 -my-2"
              aria-label="Encore, home"
            >
              Encore
            </Link>
          </div>
        </header>
        <main id="main" className="flex-1 flex flex-col">
          {children}
        </main>
        <footer className="w-full border-t border-hairline mt-24">
          <div className="mx-auto max-w-[1100px] px-6 py-6 text-base text-text-muted">
            Encore. West Palm Beach.
          </div>
        </footer>
      </body>
    </html>
  );
}
