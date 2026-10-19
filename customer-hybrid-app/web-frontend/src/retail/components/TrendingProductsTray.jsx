'use client';

import React from 'react';
import { ClockIcon } from '@/shared/components/Icons';

export function TrendingProductsTray({
  trendingProducts,
  cart,
  onAddToCart,
  onDecrementCart,
  onViewAll,
}) {
  return (
    <>
      <div className="retail-section-header" style={{ marginTop: '26px' }}>
        <div>
          <h3 className="retail-section-title">Trending Products</h3>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
            Top picks across verified stores in Indore
          </span>
        </div>
        <span className="retail-see-all-btn" onClick={onViewAll}>
          View All →
        </span>
      </div>

      <div className="trending-products-tray-scroll">
        {trendingProducts.map((item) => {
          const qtyInCart =
            cart && cart.storeId === item.storeId && cart.items[item.id]
              ? cart.items[item.id].qty
              : 0;

          return (
            <div key={item.id} className="trending-product-card">
              <div className="trending-product-img-wrap">
                <img
                  src={item.image}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { e.currentTarget.src = "/images/prod-grinder.jpg"; }}
                />
                <span className="product-discount-pill-tag">{item.discount}</span>
                <div className="trending-store-micro-badge">{item.storeCode} Verified</div>
              </div>

              <div className="trending-product-details">
                <div className="trending-product-title">{item.name}</div>
                <div className="trending-product-spec">{item.spec}</div>
                <div className="trending-delivery-note">
                  <ClockIcon size={10} color="#0E8A42" />
                  <span>{item.deliveryNote}</span>
                </div>

                <div className="product-price-action-row" style={{ marginTop: '8px' }}>
                  <div className="price-box-flex">
                    <span className="current-price-val">₹{item.price}</span>
                    <span className="mrp-strikethrough-val">₹{item.originalPrice}</span>
                  </div>

                  {qtyInCart > 0 ? (
                    <div className="retail-qty-stepper">
                      <button
                        className="stepper-btn-action"
                        type="button"
                        onClick={() => onDecrementCart(item.storeId, item.id)}
                      >
                        -
                      </button>
                      <span>{qtyInCart}</span>
                      <button
                        className="stepper-btn-action"
                        type="button"
                        onClick={() =>
                          onAddToCart(
                            { id: item.storeId, name: item.storeName, code: item.storeCode },
                            item
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      className="retail-add-btn"
                      type="button"
                      onClick={() =>
                        onAddToCart(
                          { id: item.storeId, name: item.storeName, code: item.storeCode },
                          item
                        )
                      }
                    >
                      ADD +
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
