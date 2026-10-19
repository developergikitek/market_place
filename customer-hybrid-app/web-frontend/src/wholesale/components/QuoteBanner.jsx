'use client';

import React from 'react';
import styles from './wholesale.module.css';

// Section accent from the theme tokens (wholesale.module.css --ws-purple)
const ACCENT = 'var(--ws-purple, #5B4FD9)';

function BannerIllustration() {
  return (
    <svg className={styles.bannerArt} viewBox="0 0 170 120" aria-hidden="true">
      {/* quote sheet */}
      <rect x="14" y="10" width="52" height="74" rx="6" fill="#FFFFFF" stroke="#E4E1F5" />
      {[24, 34, 44, 54, 64].map((y, i) => (
        <rect key={y} x="22" y={y} width={i % 2 ? 26 : 36} height="4" rx="2" fill="#DDD9F3" />
      ))}
      {/* boxes */}
      <rect x="40" y="80" width="30" height="26" rx="2" fill="#C9934F" />
      <rect x="74" y="66" width="38" height="40" rx="2" fill="#D6A35F" />
      <rect x="116" y="84" width="24" height="22" rx="2" fill="#C9934F" />
      <path d="M74 76h38M40 89h30M116 92h24" stroke="#B57E3C" strokeWidth="2" />
      {/* rupee coin */}
      <circle cx="93" cy="26" r="15" fill="#FFFFFF" strokeWidth="2" style={{ stroke: ACCENT }} />
      <text x="93" y="32" textAnchor="middle" fontSize="16" fontWeight="700" style={{ fill: ACCENT }}>₹</text>
      {/* buyer with tablet */}
      <circle cx="148" cy="38" r="9" fill="#F2C29B" />
      <path d="M139 36c0-8 6-12 10-12s10 4 9 11c-3-3-8-4-12-4s-5 2-7 5Z" fill="#3B2A20" />
      <path d="M134 74c0-14 6-24 14-24s14 10 14 24v6h-28Z" style={{ fill: ACCENT }} />
      <rect x="140" y="58" width="16" height="12" rx="2" fill="#2A2F45" />
      <path d="M134 66c-6-2-10-6-12-10" stroke="#F2C29B" strokeWidth="5" strokeLinecap="round" />
      <path d="M141 80v26M155 80v26" stroke="#2A2F45" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

/** Wholesale entry banner: "Get the best quote from sellers". */
export function QuoteBanner({ onCreate }) {
  return (
    <section className={styles.banner}>
      <div className={styles.bannerTop}>
        <span className={styles.bannerIcon} aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
            <path d="M14 3v5h5M9 13h1.5a1.5 1.5 0 0 0 0-3H9v6M9 13l3 3" />
          </svg>
        </span>
        <div className={styles.bannerText}>
          <h2 className={styles.bannerTitle}>Get the best quote from sellers</h2>
          <p className={styles.bannerSub}>
            Add the products and quantities you need. Sellers near you send their best quote, and you pick one.
          </p>
        </div>
      </div>
      <div className={styles.bannerBottom}>
        <button type="button" className={styles.bannerCta} onClick={onCreate}>
        Create requirement
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
      <BannerIllustration />
      </div>
    </section>
  );
}
