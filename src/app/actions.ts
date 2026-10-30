"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { adminAccessSchema, credentialsSchema, qrImageSchema, settingsSchema } from "@/lib/schemas";
import { checkAdminRateLimit } from "@/lib/rate-limit";
import { getMissingConfiguration, hasSupabasePublicConfiguration } from "@/lib/configuration";

export type ActionState = { error?: string; success?: string };

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

export async function signUpAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!hasSupabasePublicConfiguration()) return { error: "Supabase is not configured. Add your project URL and anon key to .env.local, then restart the app." };
  const parsed = credentialsSchema.safeParse({ email: value(formData, "email"), password: value(formData, "password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  let result;
  try {
    result = await supabase.auth.signUp(parsed.data);
  } catch (error) {
    console.error("Supabase signup request failed:", error);
    return { error: "We couldn't create your account. Check your details and try again." };
  }
  if (result.error) {
    console.error("Supabase signup failed:", result.error);
    return { error: "We couldn't create your account. Check your details and try again." };
  }
    if (result.data.session) {
    const userId = result.data.user?.id;
    if (!userId) {
      console.error("Supabase signup returned a session without a user.");
      await supabase.auth.signOut();
      return { error: "Your account was created, but setup could not be completed. Please contact support." };
    }
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
      if (profileError || profile?.role !== "client") {
        if (profileError) console.error("Supabase signup profile lookup failed:", profileError);
        else console.error("Supabase signup did not create a client profile.");
        await supabase.auth.signOut();
        return { error: "Your account was created, but setup could not be completed. Please contact support." };
      }
      redirect("/dashboard");
    }
  redirect("/signup?checkEmail=1");
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!hasSupabasePublicConfiguration()) return { error: "Supabase is not configured. Add your project URL and anon key to .env.local, then restart the app." };
  const parsed = credentialsSchema.safeParse({ email: value(formData, "email"), password: value(formData, "password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  let result;
  try {
    result = await supabase.auth.signInWithPassword(parsed.data);
  } catch (error) {
    console.error("Supabase login request failed:", error);
    return { error: "We couldn't sign you in. Please try again." };
  }
  if (result.error || !result.data.user) {
    if (result.error) console.error("Supabase login failed:", result.error);
    return { error: "Email or password is incorrect." };
  }
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", result.data.user.id).maybeSingle();
  if (profileError) console.error("Supabase login profile lookup failed:", profileError);
  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "client") redirect("/dashboard");
  await supabase.auth.signOut();
  return { error: profileError ? "We couldn't load your account. Please try again later." : "This account does not have an active profile." };
}

export async function adminAccessAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const missingConfiguration = getMissingConfiguration();
  if (missingConfiguration.length) return { error: "Admin access is unavailable until all required values are configured in .env.local." };
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkAdminRateLimit(ip)) return { error: "Too many attempts. Try again in 15 minutes." };
  const parsed = adminAccessSchema.safeParse({ email: value(formData, "email"), password: value(formData, "password"), secretKey: value(formData, "secretKey") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (!process.env.ADMIN_SECRET_KEY || parsed.data.secretKey !== process.env.ADMIN_SECRET_KEY) return { error: "Email, password, or secret key is incorrect." };

  const service = createServiceClient();
  const { data: admins, error: listError } = await service.from("profiles").select("id, email").eq("role", "admin").limit(1);
  if (listError) {
    console.error("Supabase admin lookup failed:", listError);
    return { error: "Could not verify admin access. Check server configuration." };
  }
  const { email, password } = parsed.data;
  if (admins?.length) {
    if (admins[0].email?.toLowerCase() !== email) return { error: "Email, password, or secret key is incorrect." };
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) console.error("Supabase admin login failed:", error);
    if (error || data.user?.id !== admins[0].id) return { error: "Email, password, or secret key is incorrect." };
    redirect("/admin");
  }

  const { data: created, error: createError } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (createError || !created.user) {
    if (createError) console.error("Supabase admin creation failed:", createError);
    return { error: "Could not create the administrator account." };
  }
  const { data: promotedProfile, error: promoteError } = await service.from("profiles").update({ role: "admin" }).eq("id", created.user.id).select("id").maybeSingle();
  if (promoteError || !promotedProfile) {
    if (promoteError) console.error("Supabase admin promotion failed:", promoteError);
    await service.auth.admin.deleteUser(created.user.id);
    return { error: "Could not initialize administrator access. An administrator may already exist." };
  }
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error("Supabase initial admin sign-in failed:", signInError);
    return { error: "Administrator account created. Please sign in to continue." };
  }
  redirect("/admin");
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") throw new Error("Not authorized.");
  return supabase;
}

export async function updateSettingsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = settingsSchema.safeParse({ paymentId: value(formData, "paymentId"), minDeposit: value(formData, "minDeposit") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("settings").update({ payment_id: parsed.data.paymentId, min_deposit: parsed.data.minDeposit, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return { error: error.message };
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: "Settings saved." };
  } catch {
    return { error: "Not authorized." };
  }
}

export async function uploadQrAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await requireAdmin();
    const file = formData.get("qrImage");
    const parsedFile = qrImageSchema.safeParse(file);
    if (!parsedFile.success) return { error: parsedFile.error.issues[0]?.message };
    const image = parsedFile.data;
    const extension = image.name.split(".").pop()?.toLowerCase() || "png";
    const path = `payment-qr.${extension}`;
    const { error: uploadError } = await supabase.storage.from("qr-codes").upload(path, image, { upsert: true, contentType: image.type });
    if (uploadError) return { error: uploadError.message };
    const { data } = supabase.storage.from("qr-codes").getPublicUrl(path);
    const { error } = await supabase.from("settings").update({ qr_image_url: `${data.publicUrl}?v=${Date.now()}`, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return { error: error.message };
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: "QR code updated." };
  } catch {
    return { error: "Not authorized." };
  }
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}