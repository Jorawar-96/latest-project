import { redirect } from "next/navigation";
import { SetupRequired } from "@/components/setup-required";
import { getMissingConfiguration } from "@/lib/configuration";
import { getProfile } from "@/lib/auth";

export default async function HomePage() {
  const missing = getMissingConfiguration();
  if (missing.length) return <SetupRequired missing={missing} />;

  const profile = await getProfile();
  redirect(profile?.role === "admin" ? "/admin" : profile ? "/dashboard" : "/login");
}