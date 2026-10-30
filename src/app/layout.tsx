import type { Metadata } from "next";
import { BRAND_NAME } from "@/config/brand";
import { getMissingConfiguration } from "@/lib/configuration";
import { SetupRequired } from "@/components/setup-required";
import "./globals.css";

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: "Secure payment instructions and account management.",
  openGraph: {
    title: BRAND_NAME,
    description: "Secure payment instructions and account management.",
    siteName: BRAND_NAME,
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const missing = getMissingConfiguration();
  return <html lang="en"><body>{missing.length ? <SetupRequired missing={missing} /> : children}</body></html>;
}