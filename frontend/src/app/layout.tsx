import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Makaano — Sell construction materials online",
  description:
    "Futuristic B2B heavy construction materials exchange. Direct-from-mill TMT steel, structural cement, AAC blocks, and aggregates with real-time 3D architectural tracking and NABL Mill Test Certificates.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <meta name="theme-color" content="#040711" />
      </head>
      <body>{children}</body>
    </html>
  );
}
