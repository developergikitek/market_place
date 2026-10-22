import Link from "next/link";
import BrandMark from "./BrandMark";
import styles from "./layout.module.css";

const COLUMNS = [
  {
    title: "Sell on Makaano",
    links: [
      { href: "/signup/seller", label: "Register as seller" },
      { href: "#fees", label: "Fees & commission" },
      { href: "#how", label: "How it works" },
      { href: "/login", label: "Seller login" },
    ],
  },
  {
    title: "Grow",
    links: [
      { href: "/portal/bulk-orders", label: "Bulk orders & RFQs" },
      { href: "/portal/catalog", label: "Catalog tools" },
      { href: "/portal/inventory", label: "Inventory" },
      { href: "/portal/payments", label: "Payments" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "#faq", label: "FAQs" },
      { href: "#categories", label: "Categories" },
      { href: "/signup/seller/terms", label: "Seller terms" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <BrandMark tone="light" />
          <p>
            The marketplace for building materials. Sell cement, steel, tiles and more to
            contractors, builders and homeowners across India.
          </p>
          <div className={styles.footerContact}>
            <span>Seller support</span>
            <strong>1800-419-5566</strong>
            <span>Mon–Sat, 9am–7pm</span>
          </div>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title} className={styles.footerColumn}>
            <h4>{column.title}</h4>
            <ul>
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={styles.footerBottom}>
        <span>© {new Date().getFullYear()} Makaano Technologies Pvt. Ltd.</span>
        <span>Made in India</span>
      </div>
    </footer>
  );
}
