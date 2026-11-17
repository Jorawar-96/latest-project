import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { PaymentSession } from "@/components/payment-session";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMissingConfiguration } from "@/lib/configuration";
import { SetupRequired } from "@/components/setup-required";
import { LockKeyhole } from "lucide-react";

export default async function DashboardPage() {
  const missing = getMissingConfiguration();
  if (missing.length) return <SetupRequired missing={missing} />;

  await requireRole("client");
  const supabase = await createClient();
  const { data: settings } = await supabase.from("settings").select("qr_image_url, payment_id, min_deposit").eq("id", 1).maybeSingle();

  return (
    <main className="app-shell">
      <header className="topbar">
        <Brand />
        <div className="topbar-actions">
          <span className="security-badge"><LockKeyhole size={15} />Secure &amp; Encrypted</span>
          <LogoutButton />
        </div>
      </header>
      <div className="dashboard-wrap">
        <PaymentSession qrUrl={settings?.qr_image_url ?? null} paymentId={settings?.payment_id ?? ""} minDeposit={Number(settings?.min_deposit ?? 500)} />
      </div>
    </main>
  );
}