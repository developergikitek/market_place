import { NextResponse } from 'next/server';

// Server-Driven UI (SDUI) Remote Configuration for Home Page
// In production, this is sourced from Redis / Firebase Remote Config / Microservices
let currentConfig = {
  version: "3.0.0",
  lastUpdated: new Date().toISOString(),

  // Section Visibility Toggles (Zero App-Update UI Composition)
  sections: {
    header: true,
    serviceTabs: true,
    searchBar: true,
    filterChips: true,
    campaignBanner: true,
    storyCards: true,
    categoryTiles: true,
    storesFeed: true,
  },

  // 1. Header & Location Config
  header: {
    locationTitle: "Indore Central",
    address: "B400c, Scheme No 54, Near C21 Mall, Vijay Nagar, Indore",
    proBadgeText: "PRO",
    proBadgeEnabled: true,
    searchPlaceholder: "Search for 'Bosch Drill', 'UltraTech', 'Havells Wire'...",
    expressToggleLabel: "SAME DAY",
    expressToggleEnabled: true,
  },

  // 2. Shopping Mode Selector (Retail vs Wholesale)
  services: [
    { id: 'retail', name: 'Retail', subtitle: 'Everyday Purchases', icon: 'store', enabled: true },
    { id: 'wholesale', name: 'Wholesale', subtitle: 'Bulk Pricing', icon: 'box', enabled: true },
  ],

  // 3. Quick Filter Chips
  filterChips: [
    { id: 'ALL', label: 'All Stores', enabled: true },
    { id: 'SAME_DAY', label: 'Same-Day Delivery', icon: 'clock', enabled: true },
    { id: 'TOP_RATED', label: 'Top Rated 4.8+ ★', enabled: true },
    { id: 'OFFERS', label: 'Verified Offers', enabled: true },
    { id: 'STORE99', label: 'Budget Deals', enabled: true },
  ],

  // 4. Hero Campaign / Promotional Banner (Swiggy FlavourFest Style)
  campaignBanner: {
    enabled: true,
    tagline: "Festive Mega Savings",
    headline: "BUILD-FEST '26",
    subtitle: "Flat 40% to 60% OFF on Top Brand Power Tools & Building Supplies",
    ctaText: "EXPLORE OFFERS",
    imageUrl: "/images/hero-tools.jpg",
    badge: "LIVE NOW",
  },

  // 5. Curated Offer Story Cards (Scrollable Tray)
  storyCards: [
    {
      id: 'story_tools',
      title: 'Tool Kit\nSpecials',
      badge: 'UNDER ₹499',
      image: '/images/cat-powertools.jpg',
      query: 'Drill',
      enabled: true,
    },
    {
      id: 'story_paints',
      title: 'Paints &\nPrimers',
      badge: 'FLAT 45% OFF',
      image: '/images/story-paints.jpg',
      query: 'Paints',
      enabled: true,
    },
    {
      id: 'story_combos',
      title: 'Free Tool\nCombos',
      badge: 'BONUS GIFT',
      image: '/images/story-combos.jpg',
      query: 'Hammer',
      enabled: true,
    },
    {
      id: 'story_cement',
      title: 'Direct Factory\nCement',
      badge: '₹385 / BAG',
      image: '/images/story-cement.jpg',
      query: 'Cement',
      enabled: false,
    },
  ],

  // 6. Shop by Category Visual Tiles
  categoryTiles: [
    { id: 'cat_tools', name: 'Power Tools', image: '/images/cat-powertools.jpg', query: 'Drill', enabled: true },
    { id: 'cat_electrical', name: 'Electricals', image: '/images/cat-electrical.jpg', query: 'Switch', enabled: true },
    { id: 'cat_hardware', name: 'Fasteners', image: '/images/cat-fasteners.jpg', query: 'Screw', enabled: true },
    { id: 'cat_paints', name: 'Paints', image: '/images/cat-paints.jpg', query: 'Paints', enabled: true },
    { id: 'cat_building', name: 'Building', image: '/images/cat-building.jpg', query: 'Cement', enabled: true },
  ],

  // 7. Store Feed Headers
  storesFeed: {
    title: "Hardware Stores Near You",
    hubLabel: "Indore Hub",
    showProVerifiedOnlyToggle: false,
  },

  // 8. Dynamic Cart & Pricing Rules (Server Enforced)
  cartRules: {
    freeDeliveryThreshold: 199,
    deliveryFee: 25,
    platformFee: 5,
    surgeFee: 0,
    surgeActive: false,
    savingsBadgeText: "35% Average Margin Savings",
  },

  // 9. Legacy Feature Flags (Backward Compatible)
  features: {
    festiveSaleBanner: true,
    instantUpiButton: true,
    instaBuildTab: true,
    store99Filter: true,
    storyCardsSection: true,
    categoryTilesSection: true,
    express15mToggle: true,
    directSupportChat: true,
  },

  // 10. Design & Accent Tokens
  theme: {
    primaryNavy: "#031B3B",
    accentOrange: "#FFA64C",
    accentEmerald: "#0E8A42",
    surfaceBg: "#F7F9FC",
  }
};

export async function GET() {
  return NextResponse.json(currentConfig, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Toggle specific section
    if (body.toggleSection) {
      const sectionKey = body.toggleSection;
      if (typeof currentConfig.sections[sectionKey] !== 'undefined') {
        currentConfig.sections[sectionKey] = !currentConfig.sections[sectionKey];
      }
    } 
    // Toggle feature flag
    else if (body.toggleFeature) {
      const featureKey = body.toggleFeature;
      if (typeof currentConfig.features[featureKey] !== 'undefined') {
        currentConfig.features[featureKey] = !currentConfig.features[featureKey];
      }
      if (featureKey === 'festiveSaleBanner') {
        currentConfig.sections.campaignBanner = currentConfig.features.festiveSaleBanner;
      }
    } 
    // Quick Preset Switches (e.g. Festival change or City change)
    else if (body.preset === 'DIWALI_FEST') {
      currentConfig.campaignBanner.headline = "MEGA DIWALI SALE '26";
      currentConfig.campaignBanner.tagline = "Shubh Deepawali Dhamaka";
      currentConfig.campaignBanner.subtitle = "Flat 50% OFF on all Power Tools & Home Paint Kits";
      currentConfig.header.locationTitle = "Mumbai Central Hub";
      currentConfig.header.address = "Shop 12, Lower Parel West, Mumbai";
    }
    else if (body.preset === 'BUILDFEST_DEFAULT') {
      currentConfig.campaignBanner.headline = "BUILD-FEST '26";
      currentConfig.campaignBanner.tagline = "Festive Mega Savings";
      currentConfig.campaignBanner.subtitle = "Flat 40% to 60% OFF on Top Brand Power Tools & Building Supplies";
      currentConfig.header.locationTitle = "Indore Central";
      currentConfig.header.address = "B400c, Scheme No 54, Near C21 Mall, Vijay Nagar, Indore";
    }
    // Partial or complete overrides
    else if (body.updates) {
      currentConfig = { ...currentConfig, ...body.updates };
    }

    currentConfig.lastUpdated = new Date().toISOString();
    return NextResponse.json({ success: true, updatedConfig: currentConfig });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
