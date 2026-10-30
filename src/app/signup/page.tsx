import { AuthForm } from "@/components/auth-form";
import { SetupRequired } from "@/components/setup-required";
import { getMissingConfiguration } from "@/lib/configuration";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ checkEmail?: string }> }) {
  const missing = getMissingConfiguration();
  if (missing.length) return <SetupRequired missing={missing} />;
  const params = await searchParams;
  return <AuthForm mode="signup" checkEmail={params.checkEmail === "1"} />;
}