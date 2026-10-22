"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import BrandMark from "./BrandMark";
import styles from "./layout.module.css";

const NAV_LINKS = [
  { href: "#why", label: "Why Makaano" },
  { href: "#how", label: "How it works" },
  { href: "#fees", label: "Fees" },
  { href: "#categories", label: "Categories" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand} aria-label="Makaano home">
          <BrandMark />
          <span className={styles.brandTag}>Seller</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <Link href="/login" className={styles.loginLink}>
            Log in
          </Link>
          <Link href="/signup/seller" className={styles.headerCta}>
            Start selling
          </Link>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className={styles.mobileNav} aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          <Link href="/login">Log in</Link>
        </nav>
      )}
    </header>
  );
}
