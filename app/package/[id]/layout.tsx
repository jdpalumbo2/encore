import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The evening",
  description: "Where, when, what to wear, what to ask.",
};

export default function PackageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
