'use client';

import React from 'react';
import { StarIcon, ShieldCheckIcon } from '@/shared/components/Icons';

/**
 * Pro Picks: Curated Professional Hardware Catalogue
 * A distinctive, horizontally swipeable section featuring pro-grade tools,
 * restrained orange accents, technical spec badges, and direct cart actions.
 */
export function ProPicksSection({
  proPicks,
  cart,
  onAddToCart,
  onDecrementCart,
  onViewAll,
}) {
  return (
    <section className="pro-picks-catalogue-container" aria-label="Pro Picks Catalogue">
      <div className="pro-picks-header-row">
        <div>
          <div className="pro-picks-eyebrow">
            <span className="pro-picks-accent-line" />
            <span>CONTRACTOR SPEC • GRADE A</span>
          </div>
          <h3 className="pro-picks-section-title">PRO PICKS</h3>
          <p className="pro-picks-section-sub">
            Curated precision machinery &amp; heavy-duty essentials
          </p>
        </div>
        <button
          type="button"
          className="pro-picks-view-all-btn"
          onClick={onViewAll}
        >
          View All →
        </button>
      </div>

      <div className="pro-picks-scroll-strip">
        {proPicks.map((tool) => {
          const qtyInCart =
            cart && cart.storeId === tool.storeId && cart.items[tool.id]
              ? cart.items[tool.id].qty
              : 0;

          return (
            <div key={tool.id} className="pro-pick-card">
              {/* Technical Graphic Corner Accents */}
              <div className="technical-corner-accent tl" />
              <div className="technical-corner-accent tr" />

              {/* Tag Badge */}
              <div className="pro-pick-tag-row">
                <span
                  className="pro-pick-badge"
                  style={{
                    color: tool.tagColor,
                    borderColor: `${tool.tagColor}55`,
                    backgroundColor: `${tool.tagColor}15`,
                  }}
                >
                  {tool.tag}
                </span>
                <span className="pro-pick-discount-tag">{tool.discount}</span>
              </div>

              {/* Image Frame with Subtle Depth */}
              <div className="pro-pick-image-stage">
                <img
                  src={tool.image}
                  alt={tool.name}
                  className="pro-pick-tool-img"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = '/images/prod-grinder.jpg';
                  }}
                />
                <div className="pro-pick-image-glow" />
              </div>

              {/* Tool Specs & Identification */}
              <div className="pro-pick-meta">
                <h4 className="pro-pick-tool-title">{tool.name}</h4>
                <div className="pro-pick-spec-line">{tool.spec}</div>

                <div className="pro-pick-rating-warranty">
                  <span className="pro-pick-rating">
                    <StarIcon size={11} color="#FFA64C" />
                    <span>{tool.rating}</span>
                  </span>
                  <span className="pro-pick-warranty">
                    <ShieldCheckIcon size={11} color="#38BDF8" />
                    <span>{tool.warranty}</span>
                  </span>
                </div>

                {/* Pricing & Cart Action */}
                <div className="pro-pick-action-row">
                  <div className="pro-pick-pricing-box">
                    <div className="pro-pick-price-val">₹{tool.price}</div>
                    <div className="pro-pick-mrp-val">₹{tool.originalPrice}</div>
                  </div>

                  {qtyInCart > 0 ? (
                    <div className="retail-qty-stepper pro-stepper">
                      <button
                        className="stepper-btn-action"
                        type="button"
                        onClick={() => onDecrementCart(tool.storeId, tool.id)}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span>{qtyInCart}</span>
                      <button
                        className="stepper-btn-action"
                        type="button"
                        onClick={() =>
                          onAddToCart(
                            {
                              id: tool.storeId,
                              name: tool.storeName,
                              code: tool.storeCode,
                            },
                            tool
                          )
                        }
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      className="pro-pick-add-btn"
                      type="button"
                      onClick={() =>
                        onAddToCart(
                          {
                            id: tool.storeId,
                            name: tool.storeName,
                            code: tool.storeCode,
                          },
                          tool
                        )
                      }
                      aria-label={`Add ${tool.name} to cart`}
                    >
                      <span>ADD</span>
                      <span className="pro-add-plus">+</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
