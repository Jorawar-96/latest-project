import type { Metadata } from "next";
import { getMissingConfiguration } from "@/lib/configuration";
import { SetupRequired } from "@/components/setup-required";
import "./globals.css";

export const metadata: Metadata = {
  title: "Greenline Payments",
  description: "Secure payment instructions and account management.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const missing = getMissingConfiguration();
  return <html lang="en"><body>{missing.length ? <SetupRequired missing={missing} /> : children}</body></html>;
}