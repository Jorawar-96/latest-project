const requiredServerVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_SECRET_KEY",
] as const;

export function getMissingConfiguration() {
  return requiredServerVariables.filter((name) => {
    return !isConfiguredValue(name, process.env[name]);
  });
}

export function hasSupabasePublicConfiguration() {
  return isConfiguredValue("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL)
    && isConfiguredValue("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function isConfiguredValue(name: string, rawValue: string | undefined) {
  const value = rawValue?.trim().toLowerCase();
  if (!value) return false;
  if (value.startsWith("your-") || value.startsWith("replace-with-")) return false;
  if (name === "NEXT_PUBLIC_SUPABASE_URL" && value.includes("your-project")) return false;
  if (name === "NEXT_PUBLIC_SUPABASE_ANON_KEY" && value === "your-supabase-anon-key") return false;
  if (name === "SUPABASE_SERVICE_ROLE_KEY" && value === "your-supabase-service-role-key") return false;
  return true;
}