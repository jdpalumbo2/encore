import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirmed",
  description: "Your table is held.",
};

export default function ConfirmLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
