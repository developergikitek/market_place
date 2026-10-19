'use client';

import React, { useState } from 'react';
import { useProfileViewModel } from '@/shared/viewmodels/useProfileViewModel';

export default function ProfilePage() {
  const {
    profile,
    isNativeShell,
    activeModal,
    setActiveModal,
    handleUpdateProfile,
    handleSelectDefaultAddress,
    navigateToOrders,
    handleLogout,
    goBack,
  } = useProfileViewModel();

  // Local state for edit profile modal form
  const [editForm, setEditForm] = useState({
    name: profile?.name || 'Harshdeep Singh',
    phone: profile?.phone || '+91 98930 77412',
    email: profile?.email || 'harshdeep.singh@builderpro.in',
  });

  if (!profile) return <div className="app-viewport profile-loading-viewport" />;

  return (
    <div className="app-viewport swiggy-account-viewport">
      {/* Toast Feedback */}

      {/* Top Bar for Web Browser (Hidden if inside React Native Shell) */}
      {!isNativeShell && (
        <header className="swiggy-account-top-header">
          <button
            type="button"
            className="swiggy-back-btn"
            onClick={goBack}
            aria-label="Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="swiggy-top-screen-title">Account</span>
          <div style={{ width: 28 }} />
        </header>
      )}

      {/* 1. SWIGGY SIGNATURE USER HEADER */}
      <section className="swiggy-user-header-card">
        <div className="swiggy-user-info-row">
          <div className="swiggy-user-text-left">
            <h1 className="swiggy-user-fullname">{profile.name.toUpperCase()}</h1>
            <p className="swiggy-user-contact">
              {profile.phone} &nbsp;•&nbsp; {profile.email}
            </p>
          </div>

          <button
            type="button"
            className="swiggy-edit-profile-btn"
            onClick={() => {
              setEditForm({
                name: profile.name,
                phone: profile.phone,
                email: profile.email,
              });
              setActiveModal('EDIT_PROFILE');
            }}
          >
            EDIT
          </button>
        </div>

        {/* 2. SWIGGY ONE / PRO MEMBERSHIP METALLIC BANNER */}
        <div
          className="swiggy-one-banner"
          onClick={() => setActiveModal('MEMBERSHIP')}
          role="button"
          tabIndex={0}
        >
          <div className="swiggy-one-left">
            <div className="swiggy-one-crown-badge">
              <span>ONE</span>
            </div>
            <div className="swiggy-one-details">
              <div className="swiggy-one-title-row">
                <span className="swiggy-one-title">BuildWell One</span>
                <span className="swiggy-one-active-pill">ACTIVE</span>
              </div>
              <p className="swiggy-one-subtitle">
                Free Delivery above ₹199 &nbsp;•&nbsp; Extra 5% off wholesale
              </p>
            </div>
          </div>

          <div className="swiggy-one-right">
            <span className="swiggy-one-savings">Saved ₹1,420</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
        </div>
      </section>

      {/* 3. SWIGGY MENU LIST GROUPS */}
      <main className="swiggy-menu-groups-container">
        {/* GROUP 1: ORDERS & ACTIVITY */}
        <div className="swiggy-menu-group-card">
          <div
            className="swiggy-menu-row"
            onClick={navigateToOrders}
            role="button"
            tabIndex={0}
          >
            <div className="swiggy-menu-icon-bubble icon-purple">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div className="swiggy-menu-text-wrap">
              <div className="swiggy-menu-title">My Orders</div>
              <div className="swiggy-menu-subtitle">View past orders, track deliveries & invoices</div>
            </div>
            <div className="swiggy-menu-tail">
              <span className="swiggy-chevron">›</span>
            </div>
          </div>

          <div
            className="swiggy-menu-row"
            role="button"
            tabIndex={0}
          >
            <div className="swiggy-menu-icon-bubble icon-rose">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <div className="swiggy-menu-text-wrap">
              <div className="swiggy-menu-title">Favourites & Saved Stores</div>
              <div className="swiggy-menu-subtitle">Sharma Hardware, BuildWell Traders</div>
            </div>
            <div className="swiggy-menu-tail">
              <span className="swiggy-chevron">›</span>
            </div>
          </div>
        </div>

        {/* GROUP 2: WALLET, PAYMENTS & TAX */}
        <div className="swiggy-menu-group-card">
          <div
            className="swiggy-menu-row"
            onClick={() => setActiveModal('WALLET')}
            role="button"
            tabIndex={0}
          >
            <div className="swiggy-menu-icon-bubble icon-green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
              </svg>
            </div>
            <div className="swiggy-menu-text-wrap">
              <div className="swiggy-menu-title">BuildWell Wallet</div>
              <div className="swiggy-menu-subtitle">Available balance: ₹{profile.cashbackBalance}</div>
            </div>
            <div className="swiggy-menu-tail">
              <span className="swiggy-balance-pill">₹{profile.cashbackBalance}</span>
              <span className="swiggy-chevron">›</span>
            </div>
          </div>


          <div
            className="swiggy-menu-row"
            role="button"
            tabIndex={0}
          >
            <div className="swiggy-menu-icon-bubble icon-amber">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
            </div>
            <div className="swiggy-menu-text-wrap">
              <div className="swiggy-menu-title">Payment Modes</div>
              <div className="swiggy-menu-subtitle">Saved cards, Google Pay, Net-30 Credit Line</div>
            </div>
            <div className="swiggy-menu-tail">
              <span className="swiggy-chevron">›</span>
            </div>
          </div>
        </div>

        {/* GROUP 3: ADDRESSES */}
        <div className="swiggy-menu-group-card">
          <div
            className="swiggy-menu-row"
            onClick={() => setActiveModal('ADDRESSES')}
            role="button"
            tabIndex={0}
          >
            <div className="swiggy-menu-icon-bubble icon-indigo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="swiggy-menu-text-wrap">
              <div className="swiggy-menu-title">Manage Addresses</div>
              <div className="swiggy-menu-subtitle">
                {profile.savedAddresses?.length} saved delivery worksites & offices
              </div>
            </div>
            <div className="swiggy-menu-tail">
              <span className="swiggy-chevron">›</span>
            </div>
          </div>
        </div>

        {/* GROUP 4: HELP, NOTIFICATIONS & POLICIES */}
        <div className="swiggy-menu-group-card">
          <div
            className="swiggy-menu-row"
            onClick={() => setActiveModal('HELP')}
            role="button"
            tabIndex={0}
          >
            <div className="swiggy-menu-icon-bubble icon-teal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            </div>
            <div className="swiggy-menu-text-wrap">
              <div className="swiggy-menu-title">Help & Support</div>
              <div className="swiggy-menu-subtitle">24x7 Chat for orders, returns & invoice queries</div>
            </div>
            <div className="swiggy-menu-tail">
              <span className="swiggy-chevron">›</span>
            </div>
          </div>

          <div
            className="swiggy-menu-row"
            role="button"
            tabIndex={0}
          >
            <div className="swiggy-menu-icon-bubble icon-emerald">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </div>
            <div className="swiggy-menu-text-wrap">
              <div className="swiggy-menu-title">WhatsApp & SMS Alerts</div>
              <div className="swiggy-menu-subtitle">Live delivery tracking & OTP sharing enabled</div>
            </div>
            <div className="swiggy-menu-tail">
              <span className="swiggy-toggle-dot" />
            </div>
          </div>
        </div>

        {/* LOGOUT BUTTON */}
        <div className="swiggy-logout-container">
          <button
            type="button"
            className="swiggy-logout-button"
            onClick={handleLogout}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            <span>LOG OUT</span>
          </button>
          <div className="swiggy-app-version-txt">
            App Version 2.4.0 &nbsp;•&nbsp; Zero-Store-Update Hybrid Architecture
          </div>
        </div>
      </main>

      {/* ============================================================
          INTERACTIVE SWIGGY-STYLE BOTTOM SHEET MODALS
      ============================================================ */}

      {/* 1. EDIT PROFILE BOTTOM SHEET */}
      {activeModal === 'EDIT_PROFILE' && (
        <div className="swiggy-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="swiggy-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="swiggy-sheet-handle" />
            <div className="swiggy-sheet-header">
              <h3>Edit Profile</h3>
              <button className="swiggy-sheet-close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>

            <form
              className="swiggy-sheet-body"
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateProfile(editForm);
              }}
            >
              <div className="swiggy-input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="swiggy-input-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  required
                />
              </div>

              <div className="swiggy-input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="swiggy-sheet-primary-btn">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. MANAGE ADDRESSES BOTTOM SHEET */}
      {activeModal === 'ADDRESSES' && (
        <div className="swiggy-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="swiggy-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="swiggy-sheet-handle" />
            <div className="swiggy-sheet-header">
              <h3>Saved Worksites & Addresses</h3>
              <button className="swiggy-sheet-close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>

            <div className="swiggy-sheet-body">
              <div className="swiggy-addresses-sheet-list">
                {profile.savedAddresses?.map((addr) => (
                  <div
                    key={addr.id}
                    className={`swiggy-address-item-card ${addr.isDefault ? 'is-selected' : ''}`}
                    onClick={() => handleSelectDefaultAddress(addr.id)}
                  >
                    <div className="swiggy-addr-tag-row">
                      <span className="swiggy-addr-tag">{addr.tag}</span>
                      {addr.isDefault ? (
                        <span className="swiggy-default-tag">✓ DELIVER HERE</span>
                      ) : (
                        <span className="swiggy-set-default-tag">Tap to select</span>
                      )}
                    </div>
                    <div className="swiggy-addr-line1">{addr.addressLine1}</div>
                    <div className="swiggy-addr-line2">{addr.landmark}, {addr.city}</div>
                    <div className="swiggy-addr-contact">Contact: {addr.contactPerson}</div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="swiggy-sheet-secondary-btn"
                onClick={() => {
                  setActiveModal(null);
                }}
              >
                + Add New Delivery Worksite
              </button>
            </div>
          </div>
        </div>
      )}


      {/* 4. WALLET & CREDITS BOTTOM SHEET */}
      {activeModal === 'WALLET' && (
        <div className="swiggy-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="swiggy-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="swiggy-sheet-handle" />
            <div className="swiggy-sheet-header">
              <h3>BuildWell Wallet & Credits</h3>
              <button className="swiggy-sheet-close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>

            <div className="swiggy-sheet-body">
              <div className="swiggy-wallet-balance-box">
                <div className="swiggy-wallet-label">TOTAL AVAILABLE BALANCE</div>
                <div className="swiggy-wallet-sum">₹{profile.cashbackBalance}</div>
                <div className="swiggy-wallet-subtext">Includes ₹500 Wholesale Cashback + ₹340 Store Refund</div>
              </div>

              <div className="swiggy-wallet-perks-list">
                <div className="swiggy-wallet-perk-item">
                  <span>⚡ Instant 1-click checkout on all hardware orders</span>
                </div>
                <div className="swiggy-wallet-perk-item">
                  <span>💰 Instant zero-delay refunds directly into wallet</span>
                </div>
              </div>

              <button
                type="button"
                className="swiggy-sheet-primary-btn"
                onClick={() => {
                  setActiveModal(null);
                }}
              >
                + Add Money to Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MEMBERSHIP BOTTOM SHEET */}
      {activeModal === 'MEMBERSHIP' && (
        <div className="swiggy-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="swiggy-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="swiggy-sheet-handle" />
            <div className="swiggy-sheet-header">
              <h3>BuildWell One Membership</h3>
              <button className="swiggy-sheet-close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>

            <div className="swiggy-sheet-body">
              <div className="swiggy-one-modal-banner">
                <div className="swiggy-one-crown-badge">
                  <span>ONE</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, color: '#FFFFFF', fontWeight: 800 }}>BuildWell One Contractor Plus</h4>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#FDE68A' }}>Valid till 31 Dec 2026 &nbsp;•&nbsp; Active</p>
                </div>
              </div>

              <div className="swiggy-one-benefits-grid">
                <div className="swiggy-benefit-card">
                  <span className="benefit-emoji">🚚</span>
                  <div className="benefit-title">Unlimited Free Delivery</div>
                  <div className="benefit-desc">Free delivery on orders above ₹199 across all verified stores</div>
                </div>
                <div className="swiggy-benefit-card">
                  <span className="benefit-emoji">🏷️</span>
                  <div className="benefit-title">Extra 5% Off Wholesale</div>
                  <div className="benefit-desc">Applicable above retail discounts on power tools & fasteners</div>
                </div>
                <div className="swiggy-benefit-card">
                  <span className="benefit-emoji">🛡️</span>
                  <div className="benefit-title">Priority Support</div>
                  <div className="benefit-desc">Dedicated account manager for material dispatch disputes</div>
                </div>
              </div>

              <button
                type="button"
                className="swiggy-sheet-primary-btn"
                onClick={() => setActiveModal(null)}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. HELP & SUPPORT BOTTOM SHEET */}
      {activeModal === 'HELP' && (
        <div className="swiggy-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="swiggy-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="swiggy-sheet-handle" />
            <div className="swiggy-sheet-header">
              <h3>Help & Customer Support</h3>
              <button className="swiggy-sheet-close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>

            <div className="swiggy-sheet-body">
              <div className="swiggy-support-options-list">
                <button
                  type="button"
                  className="swiggy-support-row-btn"
                  onClick={() => {
                    setActiveModal(null);
                  }}
                >
                  <div>
                    <div className="support-btn-title">Chat with Customer Care</div>
                    <div className="support-btn-sub">Wait time &lt; 1 minute &bull; Instant chat</div>
                  </div>
                  <span>→</span>
                </button>

                <button
                  type="button"
                  className="swiggy-support-row-btn"
                  onClick={() => {
                    if (typeof window !== 'undefined') window.location.href = 'tel:18004198989';
                  }}
                >
                  <div>
                    <div className="support-btn-title">Call Priority Toll-Free Helpline</div>
                    <div className="support-btn-sub">1800-419-8989 (9 AM - 10 PM)</div>
                  </div>
                  <span>→</span>
                </button>

                <button
                  type="button"
                  className="swiggy-support-row-btn"
                  onClick={() => {
                    navigateToOrders();
                    setActiveModal(null);
                  }}
                >
                  <div>
                    <div className="support-btn-title">I have an issue with an existing order</div>
                    <div className="support-btn-sub">Track order or request item replacement</div>
                  </div>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
