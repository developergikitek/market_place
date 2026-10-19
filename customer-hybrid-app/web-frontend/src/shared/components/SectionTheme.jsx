'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { applySection, sectionForPath } from '@/shared/lib/sectionTheme';

/** Keeps <html data-section> in step with client-side navigation. */
export function SectionTheme() {
  const pathname = usePathname();
  useEffect(() => {
    applySection(sectionForPath(pathname || '/'));
  }, [pathname]);
  return null;
}
