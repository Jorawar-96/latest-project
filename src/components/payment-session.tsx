"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Clipboard, QrCode, RotateCw, Timer } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function PaymentSession({ qrUrl, paymentId, minDeposit }: { qrUrl: string | null; paymentId: string; minDeposit: number }) {
  const [seconds, setSeconds] = useState(18 * 60);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timerId = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  async function copyPaymentId() {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(paymentId);
      else throw new Error("Clipboard unavailable");
    } catch {
      const input = document.createElement("textarea");
      input.value = paymentId;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  const expired = seconds === 0;

  return (
    <>
      <div className="dashboard-grid">
        <section className="panel payment-panel">
          <p className="eyebrow">Scan to pay</p>
          <div className="qr-frame" style={expired ? { filter: "blur(12px)", opacity: 0.35 } : undefined}>
            {qrUrl ? <Image className="qr-image" src={qrUrl} alt="Payment QR code" width={320} height={320} unoptimized /> : <div className="qr-placeholder"><QrCode size={34} strokeWidth={1.5} /><span>QR code will appear here</span></div>}
          </div>
          <div className="session-row"><span className="session-label"><Timer size={15} style={{ verticalAlign: "-3px", marginRight: 6 }} />Payment session expires in</span><strong className={`timer ${seconds < 120 ? "warning" : ""}`}>{formatTime(seconds)}</strong></div>
        </section>
        <section className="panel details-panel" aria-label="Payment details">
          <div className="detail-row"><span className="detail-label">Payment ID</span><div className="payment-id"><span>{paymentId || "Not configured"}</span><button className="secondary-button" type="button" onClick={copyPaymentId} disabled={!paymentId}><Clipboard size={15} />Copy</button></div></div>
          <div className="detail-row"><span className="detail-label">Minimum deposit</span><div className="deposit-value">Minimum Deposit: {formatCurrency(minDeposit)}</div></div>
        </section>
      </div>
      {copied && <div className="toast" role="status"><Check size={17} />Copied!</div>}
      {expired && <div className="expired-backdrop" role="dialog" aria-modal="true" aria-labelledby="expired-title"><div className="expired-dialog"><Timer size={30} color="#a74942" /><h2 id="expired-title">Session expired</h2><p>Session expired. Please reload the page.</p><button className="primary-button" onClick={() => window.location.reload()}><RotateCw size={16} />Reload</button></div></div>}
    </>
  );
}