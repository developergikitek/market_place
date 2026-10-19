"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { ApiError } from "@/services/addProductService";
import { AtoZClaim, respondToClaim } from "@/services/returnsService";
import { CLAIM_TONE, formatDate, formatINR } from "./returnMeta";
import styles from "./returns.module.css";

interface ClaimsPanelProps {
  claims: AtoZClaim[] | null;
  error: string | null;
  onResponded: (claim: AtoZClaim) => void;
}

const MIN_RESPONSE = 20;

function ClaimCard({ claim, onResponded }: { claim: AtoZClaim; onResponded: (c: AtoZClaim) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tone = CLAIM_TONE[claim.status];

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      onResponded(await respondToClaim(claim.id, text.trim()));
    } catch (err) {
      setError(err instanceof ApiError ? err.messages.join(" ") : "Couldn't send your response.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={`${styles.claim} ${claim.can_respond ? styles.claimUrgent : ""}`}>
      <div className={styles.claimHead}>
        <div>
          <span className={styles.rma}>{claim.claim_number}</span>
          <div className={styles.sub}>
            Order {claim.order_number} · {claim.customer_name} · {formatINR(claim.order_total)}
          </div>
        </div>
        <span className={styles.pill} style={{ background: tone.bg, color: tone.fg }}>
          {claim.status_display}
        </span>
      </div>

      <div>
        <strong style={{ fontSize: 14 }}>{claim.claim_reason}</strong>
        <p className={styles.quote}>“{claim.buyer_explanation}”</p>
      </div>

      {claim.seller_response_text && (
        <div className={styles.response}>
          <strong>Your response · {formatDate(claim.seller_responded_at)}</strong>
          <div style={{ marginTop: 4 }}>{claim.seller_response_text}</div>
        </div>
      )}

      {claim.can_respond && (
        <div className={styles.field}>
          <label className={styles.label}>Your side of the story</label>
          <textarea
            className={styles.textarea}
            placeholder="Share proof of delivery, tracking details or what you've already offered the buyer."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span className={error ? styles.fieldError : styles.hint}>
              {error ?? `${text.trim().length}/${MIN_RESPONSE} characters minimum`}
            </span>
            <button
              type="button"
              className={styles.btnPrimary}
              disabled={busy || text.trim().length < MIN_RESPONSE}
              onClick={submit}
            >
              {busy && <Loader2 size={15} className={styles.spin} />} Send response
            </button>
          </div>
        </div>
      )}

      <div className={styles.claimMeta}>
        <span>Filed {formatDate(claim.created_at)}</span>
        {claim.resolved_at && <span>Resolved {formatDate(claim.resolved_at)}</span>}
        {claim.refund_amount && <span>Refund {formatINR(claim.refund_amount)}</span>}
      </div>
    </article>
  );
}

export default function ClaimsPanel({ claims, error, onResponded }: ClaimsPanelProps) {
  if (error) {
    return (
      <div className={styles.claims}>
        <div className={styles.alert}>
          <AlertCircle size={16} /> {error}
        </div>
      </div>
    );
  }
  if (!claims) {
    return (
      <div className={styles.claims}>
        {[0, 1].map((i) => (
          <div key={i} className={styles.claim}>
            <div className={styles.skeleton} style={{ width: "30%" }} />
            <div className={styles.skeleton} style={{ width: "70%" }} />
          </div>
        ))}
      </div>
    );
  }
  if (claims.length === 0) {
    return (
      <div className={styles.empty}>
        <CheckCircle2 size={36} />
        <strong>No A-to-z claims</strong>
        Buyers haven&apos;t raised any guarantee claims against your orders.
      </div>
    );
  }
  return (
    <div className={styles.claims}>
      <div className={styles.hint} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <ShieldAlert size={15} /> Respond to open claims quickly — Makaano decides the claim after reviewing both sides.
      </div>
      {claims.map((claim) => (
        <ClaimCard key={claim.id} claim={claim} onResponded={onResponded} />
      ))}
    </div>
  );
}
