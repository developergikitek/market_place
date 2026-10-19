'use client';

import React from 'react';
import { useAppRouter } from '@/shared/lib/useAppRouter';
import {
  StarIcon,
  ShieldCheckIcon,
  HeartIcon,
  ClockIcon,
} from '@/shared/components/Icons';

import { sendToNative } from '@/shared/lib/nativeBridge';

export function StoreCardsFeed({
  config,
  stores,
  cart,
  favorites,
  onToggleFavorite,
  onAddToCart,
  onDecrementCart,
}) {
  const router = useAppRouter();

  const handleOpenStore = (storeId) => {
    const targetUrl = `/store?id=${storeId}&native=1`;
    // 1. Notify native shell via typed bridge
    sendToNative('TRIGGER_HAPTIC', { style: 'light' });
    sendToNative('STORE_SELECTED', { storeId, url: targetUrl });

    // 2. Perform navigation
    if (typeof window !== 'undefined' && window.nextRouter) {
      window.nextRouter.push(targetUrl);
    } else {
      router.push(targetUrl);
    }
  };

  return (
    <>
      <div className="retail-section-header">
        <h3 className="retail-section-title">
          {config.storesFeed?.title || "Hardware Stores Near You"} ({stores.length})
        </h3>
        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
          {config.storesFeed?.hubLabel || "Indore Hub"}
        </span>
      </div>

      <div className="stores-retail-feed">
        {stores.map((store) => (
          <div
            key={store.id}
            className="store-retail-card"
            onClick={() => handleOpenStore(store.id)}
            style={{ cursor: 'pointer' }}
          >
            {/* Store Cover Image Banner */}
            <div className="store-cover-media">
              <img
                src={store.coverImage}
                alt={store.name}
                className="store-cover-img"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                onError={(e) => { e.currentTarget.src = "/images/store-sharma.jpg"; }}
              />
              <div className="store-cover-scrim" />

              <div className="store-top-tags-row">
                {store.hasOne ? (
                  <div className="store-pro-verified-tag">
                    <ShieldCheckIcon size={12} color="#0E8A42" />
                    <span>PRO VERIFIED</span>
                  </div>
                ) : <div />}

                <button
                  className="store-favourite-toggle"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(store.id);
                  }}
                  aria-label="Save to favorites"
                >
                  <HeartIcon size={15} filled={Boolean(favorites[store.id])} />
                </button>
              </div>

              <div className="store-discount-strip-banner">
                🏷️ {store.offerText}
              </div>
            </div>

            {/* Store Details Body */}
            <div className="store-retail-body">
              <div
                className="store-title-badge-flex"
                onClick={() => handleOpenStore(store.id)}
                style={{ cursor: 'pointer' }}
              >
                <h4 className="store-primary-name">{store.name}</h4>
                <div className="store-green-rating-chip">
                  <StarIcon size={11} color="#ffffff" fill="#ffffff" />
                  <span>{store.rating} ({store.ratingCount})</span>
                </div>
              </div>

              {/* Delivery Information Banner */}
              <div className="store-delivery-info-banner">
                <div className="delivery-info-left">
                  <ClockIcon size={13} color="#D97706" />
                  <span className="delivery-timing-txt">{store.deliverySpeed}</span>
                  {store.deliveryInfo && (
                    <>
                      <span className="delivery-dot">•</span>
                      <span className="delivery-terms-txt">{store.deliveryInfo}</span>
                    </>
                  )}
                </div>
              </div>


              {/* In-Store Product Tray */}
              <div className="store-products-tray-scroll" onClick={(e) => e.stopPropagation()}>
                {store.products.map((product) => {
                  const qtyInCart =
                    cart && cart.storeId === store.id && cart.items[product.id]
                      ? cart.items[product.id].qty
                      : 0;

                  return (
                    <div key={product.id} className="retail-product-mini-card">
                      <div className="product-real-photo-wrap">
                        <img
                          src={product.image}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => { e.currentTarget.src = "/images/cat-powertools.jpg"; }}
                        />
                        <span className="product-discount-pill-tag">{product.discount}</span>
                      </div>
                      <div className="product-name-retail">{product.name}</div>
                      <div className="product-pack-size-tag">{product.pack}</div>

                      <div className="product-price-action-row">
                        <div className="price-box-flex">
                          <span className="current-price-val">₹{product.price}</span>
                          <span className="mrp-strikethrough-val">₹{product.originalPrice}</span>
                        </div>

                        {qtyInCart > 0 ? (
                          <div className="retail-qty-stepper">
                            <button
                              className="stepper-btn-action"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDecrementCart(store.id, product.id);
                              }}
                            >
                              -
                            </button>
                            <span>{qtyInCart}</span>
                            <button
                              className="stepper-btn-action"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToCart(store, product);
                              }}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            className="retail-add-btn"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(store, product);
                            }}
                          >
                            ADD +
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
