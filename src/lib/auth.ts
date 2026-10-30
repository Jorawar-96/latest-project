import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "client";

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("id, email, role").eq("id", user.id).maybeSingle();
  return profile;
}

export async function requireRole(role: Role) {
  const profile = await getProfile();
  if (!profile) redirect(role === "admin" ? "/admin-access" : "/login");
  if (profile.role !== role) redirect(profile.role === "admin" ? "/admin" : "/dashboard");
  return profile;
}