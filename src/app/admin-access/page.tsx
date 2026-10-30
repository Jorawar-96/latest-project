import { AuthForm } from "@/components/auth-form";
import { SetupRequired } from "@/components/setup-required";
import { getMissingConfiguration } from "@/lib/configuration";

export default function AdminAccessPage() {
  const missing = getMissingConfiguration();
  if (missing.length) return <SetupRequired missing={missing} />;
  return <AuthForm mode="admin" />;
}