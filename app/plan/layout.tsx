import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan the night",
  description: "Tell Encore who's coming and when. We'll handle the rest.",
};

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
