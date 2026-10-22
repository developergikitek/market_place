import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeIndianRupee,
  Check,
  ChevronDown,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  MapPin,
  Smartphone,
  Store,
  Truck,
  Users,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "Sell on Makaano — Become a building materials seller",
  description:
    "Register as a seller on Makaano and sell cement, TMT steel, tiles, sanitaryware and more to contractors, builders and homeowners across India.",
};

// NOTE: figures below are placeholders — replace with real numbers before launch.
const STATS = [
  { value: "12,000+", label: "Active sellers" },
  { value: "180+", label: "Cities served" },
  { value: "48 hrs", label: "Average go-live time" },
  { value: "7 days", label: "Payment cycle" },
];

const BENEFITS = [
  {
    icon: Users,
    title: "Reach verified buyers",
    body: "Contractors, builders and homeowners in your city find your products the moment they search.",
  },
  {
    icon: ClipboardList,
    title: "Win bulk orders",
    body: "Quote on project RFQs for cement, steel and aggregates. One accepted quote can fill a month of capacity.",
  },
  {
    icon: BadgeIndianRupee,
    title: "Get paid on time",
    body: "Buyer payments are held securely and settled to your bank account every 7 days.",
  },
  {
    icon: Truck,
    title: "Delivery, your way",
    body: "Ship with your own vehicles or let Makaano logistics pick up from your yard.",
  },
];

const STEPS = [
  {
    icon: Smartphone,
    title: "Verify your mobile",
    body: "Sign up with your mobile number and a one-time password.",
  },
  {
    icon: Store,
    title: "Add business details",
    body: "Enter your GSTIN, business name, pickup address and contact person.",
  },
  {
    icon: FileCheck2,
    title: "Upload documents",
    body: "PAN, cancelled cheque and address proof. We verify within 48 hours.",
  },
  {
    icon: LayoutDashboard,
    title: "List and start selling",
    body: "Add your catalog, set prices and stock, and receive your first orders.",
  },
];

const REQUIREMENTS = [
  "GSTIN (or enrolment ID for GST-exempt categories)",
  "PAN card of the business",
  "Active bank account with cancelled cheque",
  "Pickup / warehouse address",
];

// NOTE: commission rates are placeholders — confirm with finance before launch.
const FEES = [
  { category: "Cement", rate: "2%" },
  { category: "TMT steel & structural", rate: "1.5%" },
  { category: "Sand, aggregates & bricks", rate: "3%" },
  { category: "Tiles & flooring", rate: "6%" },
  { category: "Sanitaryware & bath fittings", rate: "8%" },
  { category: "Paints & waterproofing", rate: "5%" },
];

const CATEGORIES = [
  "Cement",
  "TMT steel",
  "AAC blocks & bricks",
  "Sand & aggregates",
  "Tiles & flooring",
  "Sanitaryware",
  "Plumbing & pipes",
  "Electricals & wires",
  "Paints & waterproofing",
  "Plywood & laminates",
  "Hardware & tools",
  "Doors & windows",
];

const FAQS = [
  {
    q: "Who can sell on Makaano?",
    a: "Any registered business that sells building materials — manufacturers, distributors, dealers and retailers. You need a GSTIN, a PAN and a bank account in the business name.",
  },
  {
    q: "How much does it cost to register?",
    a: "Registration and listing are free. You pay a category-based commission only when an order is delivered.",
  },
  {
    q: "When do I receive payment?",
    a: "Payments for delivered orders are settled to your registered bank account every 7 days, with a downloadable statement for each cycle.",
  },
  {
    q: "Do I have to deliver the orders myself?",
    a: "You can choose. Deliver with your own vehicles, or opt in to Makaano logistics and we pick up from your warehouse.",
  },
  {
    q: "How long does verification take?",
    a: "Most sellers are verified within 48 hours of uploading complete documents. You can add your catalog while verification is in progress.",
  },
];

export default function SellerLandingPage() {
  return (
    <div className={styles.page}>
      <Navbar />

      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Makaano Seller Central</span>
            <h1>Sell building materials to buyers across India</h1>
            <p className={styles.lead}>
              List cement, steel, tiles, sanitaryware and more. Reach contractors, builders and
              homeowners in your city — and pay only when you sell.
            </p>
            <div className={styles.heroActions}>
              <Link href="/signup/seller" className={styles.primaryBtn}>
                Start selling <ArrowRight size={18} />
              </Link>
              <a href="#how" className={styles.secondaryBtn}>
                See how it works
              </a>
            </div>
            <ul className={styles.heroChecks}>
              <li><Check size={16} /> Free registration</li>
              <li><Check size={16} /> Go live in 48 hours</li>
              <li><Check size={16} /> Payouts every 7 days</li>
            </ul>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroImage}>
              <Image
                src="/images/hero-site.jpg"
                alt="Construction site with building materials"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 560px"
              />
            </div>

            <div className={styles.orderCard} aria-hidden="true">
              <div className={styles.orderCardHead}>
                <span>Today&apos;s orders</span>
                <span className={styles.liveDot}>Live</span>
              </div>
              <div className={styles.orderRow}>
                <div>
                  <strong>OPC 53 Cement</strong>
                  <span>200 bags · Pune</span>
                </div>
                <span className={styles.orderAmount}>₹78,400</span>
              </div>
              <div className={styles.orderRow}>
                <div>
                  <strong>TMT Fe-550D, 12mm</strong>
                  <span>4.5 tonnes · Thane</span>
                </div>
                <span className={styles.orderAmount}>₹2,61,000</span>
              </div>
              <div className={styles.orderRow}>
                <div>
                  <strong>Vitrified tiles 2x2</strong>
                  <span>320 boxes · Nashik</span>
                </div>
                <span className={styles.orderAmount}>₹1,12,000</span>
              </div>
            </div>

            <div className={styles.payoutCard} aria-hidden="true">
              <span>Next payout</span>
              <strong>₹4,51,400</strong>
              <div className={styles.bars}>
                {[38, 52, 44, 66, 58, 74, 88].map((h, i) => (
                  <span key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className={styles.stats}>
          {STATS.map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </section>

        {/* Why */}
        <section id="why" className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Why Makaano</span>
            <h2>Everything you need to grow your materials business</h2>
          </div>
          <div className={styles.benefitGrid}>
            {BENEFITS.map(({ icon: Icon, title, body }) => (
              <article key={title} className={styles.benefit}>
                <span className={styles.iconBox}>
                  <Icon size={20} />
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className={`${styles.section} ${styles.sectionMuted}`}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHead}>
              <span className={styles.eyebrow}>How it works</span>
              <h2>Start selling in four steps</h2>
            </div>
            <ol className={styles.steps}>
              {STEPS.map(({ icon: Icon, title, body }, index) => (
                <li key={title} className={styles.step}>
                  <div className={styles.stepTop}>
                    <span className={styles.stepNum}>{index + 1}</span>
                    <Icon size={20} />
                  </div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </li>
              ))}
            </ol>

            <div className={styles.requirements}>
              <div>
                <h3>Keep these ready</h3>
                <p>Registration takes about 15 minutes if you have these documents handy.</p>
              </div>
              <ul>
                {REQUIREMENTS.map((item) => (
                  <li key={item}>
                    <Check size={16} /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Bulk orders feature */}
        <section className={styles.section}>
          <div className={styles.split}>
            <div className={styles.splitImage}>
              <Image
                src="/images/rebar-yard.jpg"
                alt="TMT steel stacked in a yard"
                fill
                sizes="(max-width: 900px) 100vw, 540px"
              />
            </div>
            <div className={styles.splitCopy}>
              <span className={styles.eyebrow}>Bulk orders</span>
              <h2>Quote on project orders from builders</h2>
              <p>
                Builders post requirements for their sites — quantity, grade, delivery location and
                timeline. You quote, they compare, and the order comes straight to your dashboard.
              </p>
              <ul className={styles.checkList}>
                <li><Check size={16} /> RFQs matched to your categories and service area</li>
                <li><Check size={16} /> Staggered deliveries with milestone payments</li>
                <li><Check size={16} /> Quote, track and invoice from one dashboard</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Fees */}
        <section id="fees" className={`${styles.section} ${styles.sectionMuted}`}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHead}>
              <span className={styles.eyebrow}>Fees</span>
              <h2>Simple pricing. Pay only when you sell.</h2>
            </div>
            <div className={styles.feeLayout}>
              <div className={styles.feeCards}>
                <div className={styles.feeCard}>
                  <span>Registration</span>
                  <strong>₹0</strong>
                  <p>No setup or listing charges.</p>
                </div>
                <div className={styles.feeCard}>
                  <span>Commission</span>
                  <strong>From 1.5%</strong>
                  <p>Per delivered order, by category.</p>
                </div>
                <div className={styles.feeCard}>
                  <span>Logistics</span>
                  <strong>Optional</strong>
                  <p>Use your fleet or ours, priced per km.</p>
                </div>
              </div>
              <div className={styles.feeTableWrap}>
                <table className={styles.feeTable}>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FEES.map((fee) => (
                      <tr key={fee.category}>
                        <td>{fee.category}</td>
                        <td>{fee.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section id="categories" className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Categories</span>
            <h2>What you can sell</h2>
          </div>
          <ul className={styles.categoryGrid}>
            {CATEGORIES.map((category) => (
              <li key={category}>{category}</li>
            ))}
          </ul>
          <p className={styles.categoryNote}>
            <MapPin size={16} /> Selling is available across 180+ cities. Your listings are shown to
            buyers within your delivery area.
          </p>
        </section>

        {/* FAQ */}
        <section id="faq" className={`${styles.section} ${styles.sectionMuted}`}>
          <div className={`${styles.sectionInner} ${styles.faqLayout}`}>
            <div className={styles.sectionHead}>
              <span className={styles.eyebrow}>FAQ</span>
              <h2>Questions sellers ask</h2>
              <p>
                Can&apos;t find an answer? Call seller support at <strong style={{ whiteSpace: "nowrap" }}>1800-419-5566</strong>.
              </p>
            </div>
            <div className={styles.faqList}>
              {FAQS.map((faq) => (
                <details key={faq.q} className={styles.faq}>
                  <summary>
                    {faq.q}
                    <ChevronDown size={18} />
                  </summary>
                  <p>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={styles.ctaBand}>
          <div>
            <h2>Ready to sell on Makaano?</h2>
            <p>Register in 15 minutes. No fees until your first order is delivered.</p>
          </div>
          <Link href="/signup/seller" className={styles.primaryBtn}>
            Start selling <ArrowRight size={18} />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
