'use client';

import React from 'react';
import { useNativeOverlay } from '@/shared/lib/nativeBridge';

export function ConfigDrawerModal({
  isOpen,
  config,
  onClose,
  onApplyPreset,
  onToggleSection,
}) {
  useNativeOverlay(isOpen);
  if (!isOpen) return null;

  return (
    <div className="modal-overlay-backdrop" onClick={onClose}>
      <div
        className="sheet-bottom-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '82vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 className="sheet-heading-title" style={{ marginBottom: 0 }}>
              ⚡ Server-Driven UI (SDUI) Console
            </h3>
            <span style={{ fontSize: '11px', color: '#64748B' }}>
              Zero Store Update • Live Dynamic Configuration
            </span>
          </div>
          <button
            style={{ background: 'transparent', border: 'none', color: '#0A192F', fontSize: '20px', cursor: 'pointer' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Live 1-Click SDUI Presets */}
        <div style={{ marginBottom: '18px', padding: '12px', background: '#F1F5F9', borderRadius: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
            🚀 1-Click Dynamic Presets (Live City &amp; Campaign Switch)
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{
                flex: 1,
                padding: '9px 10px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                background: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                color: '#0A192F',
                cursor: 'pointer'
              }}
              onClick={() => onApplyPreset('DIWALI_FEST', 'Mumbai Hub + Diwali Mega Sale')}
            >
              🎉 Mumbai + Diwali
            </button>
            <button
              style={{
                flex: 1,
                padding: '9px 10px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                background: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                color: '#0A192F',
                cursor: 'pointer'
              }}
              onClick={() => onApplyPreset('BUILDFEST_DEFAULT', 'Indore Hub + BuildFest 26')}
            >
              🛠️ Indore + BuildFest
            </button>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '14px' }}>
          Home Page Sections Visibility (Toggle off to hide entirely from screen):
        </p>

        {/* Section: Campaign Banner */}
        <div className="config-drawer-setting-row">
          <div>
            <div className="setting-title-txt">Promotional Campaign Banner</div>
            <div className="setting-subtitle-txt">Hero discount banner</div>
          </div>
          <label className="switch-control-widget">
            <input
              type="checkbox"
              checked={config.sections?.campaignBanner !== false && Boolean(config.campaignBanner?.enabled)}
              onChange={() => onToggleSection('campaignBanner')}
            />
            <span className="switch-slider-round"></span>
          </label>
        </div>

        {/* Section: Story Cards Tray */}
        <div className="config-drawer-setting-row">
          <div>
            <div className="setting-title-txt">Story Offer Cards Tray</div>
            <div className="setting-subtitle-txt">Horizontal photography offer stories</div>
          </div>
          <label className="switch-control-widget">
            <input
              type="checkbox"
              checked={config.sections?.storyCards !== false}
              onChange={() => onToggleSection('storyCards')}
            />
            <span className="switch-slider-round"></span>
          </label>
        </div>

        {/* Section: Category Tiles Grid */}
        <div className="config-drawer-setting-row">
          <div>
            <div className="setting-title-txt">Category Visual Grid</div>
            <div className="setting-subtitle-txt">Shop by Category photographic circles</div>
          </div>
          <label className="switch-control-widget">
            <input
              type="checkbox"
              checked={config.sections?.categoryTiles !== false}
              onChange={() => onToggleSection('categoryTiles')}
            />
            <span className="switch-slider-round"></span>
          </label>
        </div>

        {/* Section: Top Service Tabs */}
        <div className="config-drawer-setting-row">
          <div>
            <div className="setting-title-txt">Service Switcher Bar</div>
            <div className="setting-subtitle-txt">Retail / Wholesale selector</div>
          </div>
          <label className="switch-control-widget">
            <input
              type="checkbox"
              checked={config.sections?.serviceTabs !== false}
              onChange={() => onToggleSection('serviceTabs')}
            />
            <span className="switch-slider-round"></span>
          </label>
        </div>

        {/* Section: Filter Chips */}
        <div className="config-drawer-setting-row">
          <div>
            <div className="setting-title-txt">Quick Filter Chips Row</div>
            <div className="setting-subtitle-txt">All Stores / Same-Day / Top Rated / Offers</div>
          </div>
          <label className="switch-control-widget">
            <input
              type="checkbox"
              checked={config.sections?.filterChips !== false}
              onChange={() => onToggleSection('filterChips')}
            />
            <span className="switch-slider-round"></span>
          </label>
        </div>

        {/* Dynamic Pricing Engine Info */}
        <div style={{ marginTop: '14px', padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
            📦 Dynamic Cart Pricing Engine
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>• Free Delivery Threshold: <strong>₹{config.cartRules?.freeDeliveryThreshold || 199}</strong></div>
            <div>• Base Delivery Fee: <strong>₹{config.cartRules?.deliveryFee || 25}</strong></div>
            <div>• Platform Fee: <strong>₹{config.cartRules?.platformFee || 5}</strong></div>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            className="sheet-btn-confirm-replace"
            style={{ width: '100%' }}
            onClick={onClose}
          >
            Close &amp; View Screen
          </button>
        </div>
      </div>
    </div>
  );
}
