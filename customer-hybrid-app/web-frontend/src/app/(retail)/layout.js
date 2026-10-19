import { SearchSheet } from '@/retail/components/search/SearchSheet';

// Retail section: Home, Categories, Store, Search and the retail Cart.
// Route group "(retail)" keeps these URLs unchanged (/, /store, /cart, ...).
export default function RetailLayout({ children }) {
  return (
    <>
      {children}
      {/* Retail search sheet, opened from the native header or the web search bar */}
      <SearchSheet />
    </>
  );
}
