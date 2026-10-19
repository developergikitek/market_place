'use client';

import { useEffect, useState } from 'react';
import { useAppRouter } from '@/shared/lib/useAppRouter';
import { sendToNative } from '@/shared/lib/nativeBridge';
import { useIsNativeShell } from '@/shared/lib/useIsNativeShell';
import styles from './sectionComingSoon.module.css';

/**
 * Placeholder home for a header service card (Bazaar, Construction) until its section ships.
 * Reports PAGE_VIEWED with the section name so the native header highlights the right card.
 */
export function SectionComingSoon({ page, art, title, tagline, accent, items }) {
  const router = useAppRouter();
  const isNativeShell = useIsNativeShell();
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    window.nextRouter = router;
    sendToNative('PAGE_VIEWED', { page });
    sendToNative('WEB_READY', { status: 'ready', page });
  }, [router, page]);

  const notify = () => {
    sendToNative('TRIGGER_HAPTIC', { style: 'light' });
    setNotified(true);
  };

  return (
    <div className={`${styles.screen} ${isNativeShell ? styles.native : ''}`} style={{ '--accent': accent }}>
      <section className={styles.hero}>
        <span className={styles.art} aria-hidden="true">{art}</span>
        <span className={styles.soon}>Coming soon</span>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.tagline}>{tagline}</p>
      </section>

      <h2 className={styles.heading}>What you&apos;ll find here</h2>
      <ul className={styles.grid}>
        {items.map((item) => (
          <li key={item.label} className={styles.tile}>
            <span className={styles.tileArt} aria-hidden="true">{item.art}</span>
            <span className={styles.tileLabel}>{item.label}</span>
          </li>
        ))}
      </ul>

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={notify} disabled={notified}>
          {notified ? "You're on the list ✓" : 'Notify me when it launches'}
        </button>
        <button type="button" className={styles.secondary} onClick={() => router.push('/?native=1')}>
          Shop on Quick meanwhile
        </button>
      </div>
    </div>
  );
}
