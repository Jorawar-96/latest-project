import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { AdminEditor } from "@/components/admin-editor";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMissingConfiguration } from "@/lib/configuration";
import { SetupRequired } from "@/components/setup-required";

export default async function AdminPage() {
  const missing = getMissingConfiguration();
  if (missing.length) return <SetupRequired missing={missing} />;

  const profile = await requireRole("admin");
  const supabase = await createClient();
  const [{ data: settings }, { data: clients }] = await Promise.all([
    supabase.from("settings").select("qr_image_url, payment_id, min_deposit").eq("id", 1).maybeSingle(),
    supabase.from("profiles").select("id, email, created_at").eq("role", "client").order("created_at", { ascending: false }),
  ]);

  return (
    <main className="app-shell">
      <header className="topbar"><Brand /><div style={{ display: "flex", alignItems: "center", gap: 18 }}><span className="topbar-note">{profile.email} · Administrator</span><LogoutButton /></div></header>
      <div className="page-wrap">
        <div className="page-heading"><div><p className="eyebrow">Workspace controls</p><h1>Payment settings</h1><p>Changes apply to every client account.</p></div></div>
        <AdminEditor paymentId={settings?.payment_id ?? ""} minDeposit={Number(settings?.min_deposit ?? 500)} qrUrl={settings?.qr_image_url ?? null} />
        <section className="panel client-list" style={{ marginTop: 18 }}>
          <h2>Registered clients <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 600 }}>({clients?.length ?? 0})</span></h2>
          <div className="table-wrap"><table><thead><tr><th>Email</th><th>Joined</th></tr></thead><tbody>
            {clients?.length ? clients.map((client) => <tr key={client.id}><td>{client.email ?? "Email unavailable"}</td><td>{new Date(client.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td></tr>) : <tr><td className="empty-row" colSpan={2}>No client accounts yet.</td></tr>}
          </tbody></table></div>
        </section>
      </div>
    </main>
  );
}