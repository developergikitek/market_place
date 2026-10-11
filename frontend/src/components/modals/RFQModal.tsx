"use client";

import React, { useState } from "react";
import { ProductItem, SellerBid } from "@/types";
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  Truck,
  Building2,
  Send,
} from "lucide-react";

interface RFQModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfqItems: Array<{ product: ProductItem; quantity: number }>;
  onClearRFQ: () => void;
  activeCity: string;
}

export default function RFQModal({
  isOpen,
  onClose,
  rfqItems,
  onClearRFQ,
  activeCity,
}: RFQModalProps) {
  const [biddingStage, setBiddingStage] = useState<"review" | "bidding" | "accepted">("review");
  const [targetDiscount, setTargetDiscount] = useState(5);
  const [sitePincode, setSitePincode] = useState("400001");
  const [selectedBid, setSelectedBid] = useState<SellerBid | null>(null);

  if (!isOpen) return null;

  const grossTotal = rfqItems.reduce(
    (sum, item) => sum + item.product.pricePerUnit * item.quantity,
    rfqItems.length === 0 ? 1740000 : 0
  );

  const simulatedBids: SellerBid[] = [
    {
      sellerId: "seller-tata-direct",
      sellerName: "Tata Steel Authorised Master Channel",
      bidPricePerUnit: Math.round(grossTotal * (1 - (targetDiscount + 1.8) / 100)),
      freightIncluded: true,
      deliveryHours: 18,
      mtcIncluded: true,
      discountPercentage: targetDiscount + 1.8,
    },
    {
      sellerId: "seller-jindal-direct",
      sellerName: "Jindal Panther Prime Depot",
      bidPricePerUnit: Math.round(grossTotal * (1 - (targetDiscount + 2.5) / 100)),
      freightIncluded: true,
      deliveryHours: 24,
      mtcIncluded: true,
      discountPercentage: targetDiscount + 2.5,
    },
    {
      sellerId: "seller-deccan-depot",
      sellerName: "Apex Heavy Infra Consortium",
      bidPricePerUnit: Math.round(grossTotal * (1 - (targetDiscount + 0.8) / 100)),
      freightIncluded: true,
      deliveryHours: 12,
      mtcIncluded: true,
      discountPercentage: targetDiscount + 0.8,
    },
  ];

  const handleStartBidding = (e: React.FormEvent) => {
    e.preventDefault();
    setBiddingStage("bidding");
  };

  const handleAcceptBid = (bid: SellerBid) => {
    setSelectedBid(bid);
    setBiddingStage("accepted");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(8, 12, 20, 0.9)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        className="arch-card"
        style={{
          width: "100%",
          maxWidth: "780px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#0d121f",
          border: "1px solid var(--border-amber)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.9)",
          padding: "32px",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(255, 255, 255, 0.08)",
            border: "none",
            color: "#ffffff",
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={18} />
        </button>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "8px",
              background: "rgba(245, 158, 11, 0.2)",
              border: "1px solid var(--accent-amber)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileSpreadsheet size={18} color="var(--accent-amber)" />
          </div>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", fontFamily: "var(--font-heading)" }}>
              REVERSE AUCTION RFQ TERMINAL
            </h2>
            <div style={{ fontSize: "11px", color: "var(--accent-amber)", fontFamily: "var(--font-mono)" }}>
              PROJECT LOCATION: {activeCity} // DIRECT MILL MATCHING
            </div>
          </div>
        </div>

        {/* STAGE 1 */}
        {biddingStage === "review" && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "8px" }}>
                LINE ITEMS SUBMITTED FOR BIDDING:
              </div>

              {rfqItems.length === 0 ? (
                <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "14px", borderRadius: "8px", border: "1px solid var(--border-card)", fontSize: "13px", color: "var(--text-secondary)" }}>
                  Sample High-Tonnage Order: <strong>30 MT Tata Tiscon Fe-550D Rebar</strong> (Standard Ex-Works Lot)
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
                  {rfqItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        border: "1px solid var(--border-card)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "13px",
                      }}
                    >
                      <div>
                        <strong style={{ color: "#ffffff" }}>{item.product.name}</strong>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                          Qty: {item.quantity} {item.product.unit} • Rate: ₹{item.product.pricePerUnit.toLocaleString()} / {item.product.unit}
                        </div>
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-amber)" }}>
                        ₹{(item.product.pricePerUnit * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "8px", padding: "14px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Catalog Value (Ex-Works):</span>
              <span style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#ffffff" }}>
                ₹{grossTotal.toLocaleString()}
              </span>
            </div>

            <form onSubmit={handleStartBidding}>
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <label style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                    SET YOUR TARGET DISCOUNT GOAL (%)
                  </label>
                  <span style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-amber)" }}>
                    {targetDiscount}% Below Standard Spot
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={12}
                  step={0.5}
                  value={targetDiscount}
                  onChange={(e) => setTargetDiscount(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent-amber)", cursor: "pointer" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
                  <span>2% (High Acceptance)</span>
                  <span>Target: ₹{Math.round(grossTotal * (1 - targetDiscount / 100)).toLocaleString()}</span>
                  <span>12% (Aggressive Bidding)</span>
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  SITE DELIVERY PINCODE
                </label>
                <input
                  type="text"
                  value={sitePincode}
                  onChange={(e) => setSitePincode(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-card)",
                    borderRadius: "6px",
                    padding: "10px 14px",
                    color: "#f8fafc",
                    fontSize: "13px",
                    fontFamily: "var(--font-mono)",
                  }}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: "100%", padding: "14px" }}>
                <Send size={15} />
                <span>BROADCAST RFQ TO CERTIFIED MILLS</span>
              </button>
            </form>
          </div>
        )}

        {/* STAGE 2 */}
        {biddingStage === "bidding" && (
          <div>
            <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="live-indicator" />
              <span style={{ fontSize: "12px", color: "#10b981", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                3 AUDITED MILLS RESPONDED WITH COUNTER-BIDS!
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
              {simulatedBids.map((bid) => (
                <div
                  key={bid.sellerId}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border-card)",
                    borderRadius: "8px",
                    padding: "18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "14px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Building2 size={16} color="var(--accent-amber)" />
                      <strong style={{ color: "#ffffff", fontSize: "14px" }}>{bid.sellerName}</strong>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginTop: "8px", fontSize: "11px", color: "var(--text-secondary)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Truck size={12} color="var(--accent-amber)" />
                        Delivery SLA: {bid.deliveryHours} hrs
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
                      <span style={{ color: "#10b981" }}>✓ MTC Test Included</span>
                      <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
                      <span>Freight Paid</span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "#10b981", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                      🔥 {bid.discountPercentage.toFixed(1)}% Counter-Discount
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent-amber)" }}>
                      ₹{bid.bidPricePerUnit.toLocaleString()}
                    </div>

                    <button
                      onClick={() => handleAcceptBid(bid)}
                      className="btn-primary"
                      style={{
                        marginTop: "8px",
                        padding: "6px 14px",
                        fontSize: "11px",
                      }}
                    >
                      ACCEPT THIS BID
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setBiddingStage("review")}
              className="btn-secondary"
              style={{ fontSize: "12px", padding: "8px 16px" }}
            >
              ← Revise Target Parameters
            </button>
          </div>
        )}

        {/* STAGE 3 */}
        {biddingStage === "accepted" && selectedBid && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.15)",
                border: "2px solid #10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <CheckCircle2 size={32} color="#10b981" />
            </div>

            <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", marginBottom: "8px", fontFamily: "var(--font-heading)" }}>
              BID ALLOCATED & ESCROW INITIALIZED!
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "540px", margin: "0 auto 24px auto", lineHeight: 1.5 }}>
              Your order with <strong>{selectedBid.sellerName}</strong> has been locked at <strong>₹{selectedBid.bidPricePerUnit.toLocaleString()}</strong>. Digital gate-pass and vehicle weighbridge tracking will activate upon site dispatch.
            </p>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-card)", borderRadius: "8px", padding: "16px", maxWidth: "450px", margin: "0 auto 24px auto", textAlign: "left", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-muted)" }}>Locked Price:</span>
                <strong style={{ color: "var(--accent-amber)" }}>₹{selectedBid.bidPricePerUnit.toLocaleString()}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-muted)" }}>Delivery Pincode:</span>
                <span style={{ color: "#ffffff" }}>{sitePincode}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>SLA Window:</span>
                <span style={{ color: "#10b981" }}>Within {selectedBid.deliveryHours} Hours Guaranteed</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClearRFQ();
                onClose();
                setBiddingStage("review");
              }}
              className="btn-primary"
              style={{ padding: "12px 28px" }}
            >
              CLOSE & RETURN TO MARKETPLACE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
