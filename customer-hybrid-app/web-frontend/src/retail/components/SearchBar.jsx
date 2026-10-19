'use client';

import React from 'react';
import { SearchIcon, MicIcon } from '@/shared/components/Icons';

export function SearchBar({
  config,
  searchQuery,
  onSearchChange,
  onVoiceSearch,
  fastOnly,
  onToggleFastOnly,
}) {
  if (config.sections?.searchBar === false) return null;

  return (
    <div className="search-input-wrapper">
      <div className="search-box-white">
        <SearchIcon size={16} color="#64748B" />
        <input
          type="text"
          placeholder={config.header?.searchPlaceholder || "Search for 'Bosch Drill', 'UltraTech', 'Havells Wire'..."}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          readOnly
          onClick={() => window.dispatchEvent(new Event('superapp:open-search'))}
        />
        <button
          className="voice-mic-trigger"
          type="button"
          onClick={onVoiceSearch}
          aria-label="Voice Search"
        >
          <MicIcon size={16} />
        </button>
      </div>

      {config.header?.expressToggleEnabled !== false && (
        <button
          type="button"
          className={`fast-express-toggle ${fastOnly ? 'active' : ''}`}
          onClick={onToggleFastOnly}
          aria-pressed={fastOnly}
          aria-label="Toggle Same-Day Express"
        >
          <span className="fast-toggle-title">
            {config.header?.expressToggleLabel || "SAME DAY"}
          </span>
          <div className="toggle-capsule-track">
            <div className="toggle-capsule-thumb" />
          </div>
        </button>
      )}
    </div>
  );
}
