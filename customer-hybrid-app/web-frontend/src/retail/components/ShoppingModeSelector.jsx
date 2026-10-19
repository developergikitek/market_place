'use client';

import React from 'react';
import { StoreIcon, BoxIcon } from '@/shared/components/Icons';

/**
 * Premium Shopping-Mode Selector (Retail vs Wholesale)
 * Clean horizontal segmented navigation with a smoothly animated orange active indicator.
 */
export function ShoppingModeSelector({ config, activeService, onSelectService }) {
  if (config.sections?.serviceTabs === false) return null;

  const services = (config.services || []).filter((s) => s.enabled);

  return (
    <div className="shopping-mode-selector" role="tablist" aria-label="Shopping Mode">
      {/* Sliding Active Background Indicator */}
      <div
        className={`mode-sliding-indicator ${activeService === 'wholesale' ? 'pos-wholesale' : 'pos-retail'}`}
        aria-hidden="true"
      />

      {services.map((service) => {
        const isRetail = service.id === 'retail';
        const isSelected = activeService === service.id;

        return (
          <button
            key={service.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            className={`shopping-mode-segment ${isSelected ? 'is-selected' : 'is-unselected'}`}
            onClick={() => onSelectService(service.id)}
          >
            <div className="mode-segment-inner">
              <span className="mode-icon-wrap">
                {isRetail ? (
                  <StoreIcon size={17} color={isSelected ? "#FFA64C" : "#94A3B8"} />
                ) : (
                  <BoxIcon size={17} color={isSelected ? "#FFA64C" : "#94A3B8"} />
                )}
              </span>
              <span className="mode-title-text">{service.name}</span>
            </div>
            {isSelected && <div className="mode-active-underline" />}
          </button>
        );
      })}
    </div>
  );
}
