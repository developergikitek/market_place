'use client';

import React from 'react';

export function CategoriesHeader({ onGoBack, notificationCount = 2 }) {
  return (
    <header className="categories-header-bar">
      <div className="categories-header-left">
        <button
          type="button"
          className="categories-back-btn"
          onClick={onGoBack}
          aria-label="Go Back to Home"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="categories-screen-title">Categories</h1>
      </div>

      <button
        type="button"
        className="categories-notif-btn"
        aria-label="Notifications"
        onClick={() => {}}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {notificationCount > 0 && <span className="categories-notif-dot" />}
      </button>
    </header>
  );
}
