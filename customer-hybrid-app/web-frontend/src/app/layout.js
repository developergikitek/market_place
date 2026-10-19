import './globals.css';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { TabPrefetcher } from '@/shared/components/TabPrefetcher';
import { SectionTheme } from '@/shared/components/SectionTheme';
import { SECTION_THEME_BOOT } from '@/shared/lib/sectionTheme';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: "Hardware Marketplace | Pro SuperApp",
  description: "Next.js Webview powered by React Native Expo Shell with Zero Store Updates",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    // data-section is set before hydration by the boot script, hence suppressHydrationWarning
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SECTION_THEME_BOOT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={plusJakarta.className}>
        {children}
        <TabPrefetcher />
        <SectionTheme />
      </body>
    </html>
  );
}
