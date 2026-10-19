import { SectionComingSoon } from '@/shared/components/SectionComingSoon';

const ITEMS = [
  { art: '👷', label: 'Contractors' },
  { art: '🧱', label: 'Masons' },
  { art: '🚜', label: 'Machinery rental' },
  { art: '📐', label: 'Architects' },
  { art: '🔌', label: 'Electricians' },
  { art: '🚚', label: 'Site delivery' },
];

export default function ConstructionPage() {
  return (
    <SectionComingSoon
      page="construction"
      art="🏗️"
      title="Construction"
      tagline="Book verified contractors, labour and machinery for your site, with tracked progress."
      accent="#F59E0B"
      items={ITEMS}
    />
  );
}
