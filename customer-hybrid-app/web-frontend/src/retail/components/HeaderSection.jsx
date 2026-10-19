'use client';

import React from 'react';
import { MapPinIcon, ChevronDownIcon, SettingsIcon, SlidersIcon } from '@/shared/components/Icons';

export function HeaderSection({ config, onOpenConfigDrawer }) {
  if (config.sections?.header === false) return null;

  return (
    <div className="location-row-header">
      <button 
        className="location-picker-btn" 
      >
        <div className="location-title-flex">
          <MapPinIcon size={16} color="#FFA64C" />
          <span>{config.header?.locationTitle || "Indore Central"}</span>
          <ChevronDownIcon size={14} color="#ffffff" />
        </div>
        <div className="location-subtext">
          {config.header?.address || "B400c, Scheme No 54, Near C21 Mall, Vijay Nagar, Indore"}
        </div>
      </button>

      <div className="top-right-tools">
        <button className="config-admin-pill" onClick={onOpenConfigDrawer}>
          <SettingsIcon size={13} color="#ffffff" />
          <span>Configs</span>
        </button>

        {config.header?.proBadgeEnabled !== false && (
          <div className="pro-membership-pill">
            <div className="pro-badge-circle">{config.header?.proBadgeText || "PRO"}</div>
            <SlidersIcon size={13} color="#ffffff" />
          </div>
        )}
      </div>
    </div>
  );
}
