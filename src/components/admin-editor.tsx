"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { ImageUp, Save } from "lucide-react";
import { updateSettingsAction, uploadQrAction } from "@/app/actions";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button className="primary-button" type="submit" disabled={pending}>{children}</button>;
}

export function AdminEditor({ paymentId, minDeposit, qrUrl }: { paymentId: string; minDeposit: number; qrUrl: string | null }) {
  const [settingsState, settingsAction, settingsPending] = useActionState(updateSettingsAction, {});
  const [qrState, qrAction, qrPending] = useActionState(uploadQrAction, {});

  return (
    <div className="admin-grid">
      <section className="panel admin-form">
        <h2>Payment details</h2>
        <form action={settingsAction}>
          <div className="field"><label htmlFor="paymentId">Payment ID</label><input id="paymentId" name="paymentId" defaultValue={paymentId} maxLength={120} required /></div>
          <div className="field"><label htmlFor="minDeposit">Minimum deposit (USD)</label><input id="minDeposit" name="minDeposit" type="number" min="0.01" step="0.01" defaultValue={minDeposit} required /></div>
          <SubmitButton><Save size={16} />{settingsPending ? "Saving…" : "Save changes"}</SubmitButton>
          {settingsState.error && <p className="form-message error" role="alert">{settingsState.error}</p>}
          {settingsState.success && <p className="form-message success" role="status">{settingsState.success}</p>}
        </form>
      </section>
      <section className="panel admin-form">
        <h2>Payment QR code</h2>
        <div className="current-qr">{qrUrl ? <Image src={qrUrl} alt="Current payment QR code" width={200} height={200} unoptimized /> : <span className="session-label">No QR image uploaded</span>}</div>
        <form action={qrAction}>
          <label className="file-field">Choose image <input type="file" name="qrImage" accept="image/*" required /></label>
          <SubmitButton><ImageUp size={16} />{qrPending ? "Uploading…" : "Upload QR code"}</SubmitButton>
          {qrState.error && <p className="form-message error" role="alert">{qrState.error}</p>}
          {qrState.success && <p className="form-message success" role="status">{qrState.success}</p>}
        </form>
      </section>
    </div>
  );
}