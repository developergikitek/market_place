'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSearchResultsViewModel } from '@/retail/viewmodels/useSearchResultsViewModel';
import { SearchResultsHeader } from '@/retail/components/search/SearchResultsHeader';
import { SearchFilters } from '@/retail/components/search/SearchFilters';
import { StoreItemsGroup, StoreResultCard } from '@/retail/components/search/StoreItemsGroup';
import { CartConflictModal } from '@/retail/components/CartConflictModal';

function SearchResultsContent() {
  const vm = useSearchResultsViewModel();
  const showItems = vm.tab === 'items';
  const isEmpty = showItems ? vm.itemGroups.length === 0 : vm.stores.length === 0;

  return (
    <div className="app-viewport sr-page">
      <SearchResultsHeader
        query={vm.query}
        tab={vm.tab}
        onTabChange={vm.setTab}
        onGoBack={vm.goBack}
        onEditSearch={vm.editSearch}
        onClearSearch={vm.clearSearch}
      />

      <SearchFilters
        sortBy={vm.sortBy}
        onSortChange={vm.setSortBy}
        sameDayOnly={vm.sameDayOnly}
        onToggleSameDay={vm.toggleSameDay}
        topRatedOnly={vm.topRatedOnly}
        onToggleTopRated={vm.toggleTopRated}
        offersOnly={vm.offersOnly}
        onToggleOffers={vm.toggleOffers}
        keywords={showItems ? vm.keywords : []}
        keyword={vm.keyword}
        onToggleKeyword={vm.toggleKeyword}
      />

      <main className="sr-content">
        {isEmpty ? (
          <div className="search-empty sr-empty">
            <strong>{vm.hasAnyResults ? 'Nothing matches these filters' : `No results for “${vm.query}”`}</strong>
            <span>
              {vm.hasAnyResults
                ? 'Turn off a filter to see more.'
                : 'Try a brand, a tool name or a category like “paint”.'}
            </span>
          </div>
        ) : showItems ? (
          <>
            <div className="search-section-label sr-section-label">
              <span>Stores with matching items</span>
              <span className="search-section-rule" />
            </div>
            {vm.itemGroups.map((group) => (
              <StoreItemsGroup
                key={group.store.id}
                store={group.store}
                products={group.products}
                qtyFor={vm.qtyFor}
                onAdd={vm.addItem}
                onRemove={vm.removeItem}
                onOpenStore={vm.openStore}
              />
            ))}
          </>
        ) : (
          <>
            <div className="search-section-label sr-section-label">
              <span>Stores for “{vm.query}”</span>
              <span className="search-section-rule" />
            </div>
            <div className="sr-store-list">
              {vm.stores.map((store) => (
                <StoreResultCard key={store.id} store={store} onOpenStore={vm.openStore} />
              ))}
            </div>
          </>
        )}
      </main>

      <CartConflictModal
        conflictModal={vm.conflictModal}
        onDismiss={vm.dismissConflictModal}
        onConfirmReplace={vm.confirmReplaceCart}
      />
    </div>
  );
}

// Keyed by the query so tabs, filters and chips reset for every new search
function SearchResultsPage() {
  const searchParams = useSearchParams();
  return <SearchResultsContent key={searchParams?.get('q') || ''} />;
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="sr-page" />}>
      <SearchResultsPage />
    </Suspense>
  );
}
