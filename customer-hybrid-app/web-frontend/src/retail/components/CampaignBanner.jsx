'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRightIcon } from '@/shared/components/Icons';

// The staggered text entrance plays once per session. CSS animations restart whenever a hidden
// screen is shown again (Next.js keeps visited screens with display:none), so after the first run
// the classes come off; otherwise every return to Home faded the banner text in from blank.
const ENTRANCE_MS = 900;
let entrancePlayed = false;

/**
 * Signature Hero Campaign Banner
 * Features ambient background light movement, staggered text entrance,
 * subtle product floating motion, and technical orange micro-accents.
 */
export function CampaignBanner({ config, onExploreOffers }) {
  const [animate, setAnimate] = useState(() => !entrancePlayed);
  useEffect(() => {
    if (!animate) return undefined;
    const timer = setTimeout(() => {
      entrancePlayed = true;
      setAnimate(false);
    }, ENTRANCE_MS);
    return () => clearTimeout(timer);
  }, [animate]);
  const anim = (name) => (animate ? ` hero-${name}-animate` : '');

  if (config.sections?.campaignBanner === false || !config.campaignBanner?.enabled) {
    return null;
  }

  const { tagline, headline, subtitle, ctaText, imageUrl } = config.campaignBanner;

  return (
    <div className="campaign-banner-hero">
      {/* Ambient moving light shimmer */}
      <div className="campaign-light-shimmer" aria-hidden="true" />

      {/* Left content with staggered entrance animation */}
      <div className="campaign-content-left">
        <div className={`campaign-tagline${anim('tagline')}`}>{tagline}</div>
        <h3 className={`campaign-headline${anim('headline')}`}>{headline}</h3>
        <p className={`campaign-subtitle${anim('subtitle')}`}>{subtitle}</p>
        <button
          className={`campaign-cta-btn${anim('cta')}`}
          type="button"
          onClick={onExploreOffers}
        >
          <span>{ctaText}</span>
          <ArrowRightIcon size={13} color="#031B3B" />
        </button>
      </div>

      {/* Product Image Stage with Subtle Floating & Geometric Accent */}
      <div className="hero-product-stage">
        {/* Subtle orange technical graphic accents */}
        <div className="hero-accent-bracket top-right" aria-hidden="true" />
        <div className="hero-accent-bracket bottom-left" aria-hidden="true" />
        <div className="hero-accent-crosshair" aria-hidden="true" />

        <img
          src={imageUrl || "/images/hero-tools.jpg"}
          alt={headline || "Featured Pro Tools"}
          className="campaign-banner-image hero-float-motion"
          referrerPolicy="no-referrer"
          fetchPriority="high"
          onError={(e) => {
            e.currentTarget.src = "/images/hero-tools.jpg";
          }}
        />
      </div>
    </div>
  );
}
