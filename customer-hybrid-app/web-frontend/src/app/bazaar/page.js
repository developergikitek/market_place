import { SectionComingSoon } from '@/shared/components/SectionComingSoon';

const ITEMS = [
  { art: '🔩', label: 'Hardware' },
  { art: '💡', label: 'Electricals' },
  { art: '🚿', label: 'Sanitary' },
  { art: '🎨', label: 'Paints' },
  { art: '🪵', label: 'Plywood' },
  { art: '🧰', label: 'Tools' },
];

export default function BazaarPage() {
  return (
    <SectionComingSoon
      page="bazaar"
      art="🛍️"
      title="Bazaar"
      tagline="Your neighbourhood market shops, all in one place. Compare prices across local dealers."
      accent="#E11D74"
      items={ITEMS}
    />
  );
}
