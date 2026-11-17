"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Clock3, Copy, QrCode, RotateCw, Timer } from "lucide-react";
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
      <section className="panel payment-panel" aria-label="Payment details">
        <p className="deposit-label">Minimum Deposit</p>
        <p className="deposit-value">{formatCurrency(minDeposit)}</p>
        <hr className="payment-divider" />
        <div className={`qr-frame ${expired ? "expired" : ""}`}>
          {qrUrl ? <Image className="qr-image" src={qrUrl} alt="Payment QR code" width={320} height={320} unoptimized /> : <div className="qr-placeholder"><QrCode size={34} strokeWidth={1.5} /><span>QR code will appear here</span></div>}
        </div>
        <div className="timer-pill" aria-label={`Session expires in ${formatTime(seconds)}`}><Clock3 size={22} /><strong className="timer">{formatTime(seconds)}</strong></div>
        <div className="payment-id-block">
          <span className="detail-label">Payment ID</span>
          <div className="payment-id">
            <span className="payment-id-value">{paymentId || "Not configured"}</span>
            <button className="primary-button" type="button" onClick={copyPaymentId} disabled={!paymentId}><span>Copy</span><Copy size={16} /></button>
          </div>
        </div>
      </section>
      {copied && <div className="toast" role="status"><Check size={17} />Copied!</div>}
      {expired && <div className="expired-backdrop" role="dialog" aria-modal="true" aria-labelledby="expired-title"><div className="expired-dialog"><Timer size={30} /><h2 id="expired-title">Session expired</h2><p>Session expired. Please reload the page</p><button className="primary-button" onClick={() => window.location.reload()}><RotateCw size={16} />Reload</button></div></div>}
    </>
  );
}
