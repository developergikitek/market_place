'use client';

import React from 'react';

/**
 * Promotional Offer Story Cards
 * Matches exact typography, badge styling, and card aesthetics from reference image.
 */
export function StoryCardsTray({ config, onSelectStory }) {
  if (config.sections?.storyCards === false) return null;

  const cards = (config.storyCards || []).filter((c) => c.enabled);

  return (
    <div className="story-cards-scroll-tray" role="region" aria-label="Featured Offers Tray">
      {cards.map((card) => (
        <button
          key={card.id}
          type="button"
          className="rich-story-card"
          onClick={() => onSelectStory(card)}
        >
          <img
            src={card.image}
            alt={card.title}
            className="story-card-bg-img"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = '/images/story-tools.jpg';
            }}
          />

          <div className="story-card-overlay">
            <div className="story-title-top" style={{ whiteSpace: 'pre-line' }}>
              {card.title}
            </div>
            <div className="story-badge-highlight">{card.badge}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
