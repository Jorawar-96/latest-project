import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { PaymentSession } from "@/components/payment-session";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMissingConfiguration } from "@/lib/configuration";
import { SetupRequired } from "@/components/setup-required";

export default async function DashboardPage() {
  const missing = getMissingConfiguration();
  if (missing.length) return <SetupRequired missing={missing} />;

  const profile = await requireRole("client");
  const supabase = await createClient();
  const { data: settings } = await supabase.from("settings").select("qr_image_url, payment_id, min_deposit").eq("id", 1).maybeSingle();

  return (
    <main className="app-shell">
      <header className="topbar"><Brand /><span className="topbar-note">{profile.email}</span></header>
      <div className="page-wrap">
        <div className="page-heading"><div><p className="eyebrow">Secure payment</p><h1>Your payment details</h1><p>Use the QR code or payment ID below to complete your deposit.</p></div></div>
        <PaymentSession qrUrl={settings?.qr_image_url ?? null} paymentId={settings?.payment_id ?? ""} minDeposit={Number(settings?.min_deposit ?? 500)} />
        <div className="logout-form"><LogoutButton /></div>
      </div>
    </main>
  );
}