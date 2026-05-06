import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Three options",
  description: "Three reads on the night, side by side.",
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
