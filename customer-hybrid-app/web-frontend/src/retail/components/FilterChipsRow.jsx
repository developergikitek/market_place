'use client';

import React from 'react';
import { ClockIcon, ZapIcon } from '@/shared/components/Icons';

export function FilterChipsRow({ config, activeFilterPill, onSelectFilterPill }) {
  if (config.sections?.filterChips === false) return null;

  const chips = (config.filterChips || []).filter((c) => c.enabled);

  return (
    <div className="filter-chips-row">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className={`filter-chip-btn ${activeFilterPill === chip.id ? 'active' : ''}`}
          onClick={() => onSelectFilterPill(chip.id, chip.label)}
        >
          {chip.icon === 'clock' && <ClockIcon size={12} />}
          {chip.icon === 'zap' && <ZapIcon size={12} />}
          <span>{chip.label}</span>
        </button>
      ))}
    </div>
  );
}
