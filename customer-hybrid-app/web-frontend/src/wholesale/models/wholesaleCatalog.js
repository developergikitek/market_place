// ============================================================
// WHOLESALE CATALOG: items a customer can put in a bulk requirement.
// marketRate = typical bulk rate per unit; vendors quote around it.
// ============================================================

export const WHOLESALE_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'cement', name: 'Cement & Concrete' },
  { id: 'steel', name: 'Steel & TMT' },
  { id: 'electrical', name: 'Wires & Electrical' },
  { id: 'paint', name: 'Paints' },
  { id: 'plumbing', name: 'Plumbing' },
  { id: 'hardware', name: 'Fasteners & Hardware' },
];

export const WHOLESALE_CATALOG = [
  { id: 'w_cem_ppc', category: 'cement', name: 'UltraTech PPC Cement', spec: '50 kg bag', unit: 'bag', moq: 50, step: 10, marketRate: 385, image: '/images/cat-cement-cutout.jpg' },
  { id: 'w_cem_opc', category: 'cement', name: 'ACC OPC 53 Grade Cement', spec: '50 kg bag', unit: 'bag', moq: 50, step: 10, marketRate: 410, image: '/images/cat-cement-cutout.jpg' },
  { id: 'w_cem_wall', category: 'cement', name: 'Birla White Wall Putty', spec: '40 kg bag', unit: 'bag', moq: 20, step: 5, marketRate: 720, image: '/images/cat-cement-cutout.jpg' },
  { id: 'w_tmt_12', category: 'steel', name: 'TATA Tiscon TMT Fe550D 12mm', spec: '12 m bar bundle', unit: 'ton', moq: 1, step: 1, marketRate: 61500, image: '/images/story-cement.jpg' },
  { id: 'w_tmt_8', category: 'steel', name: 'JSW Neosteel TMT Fe500 8mm', spec: '12 m bar bundle', unit: 'ton', moq: 1, step: 1, marketRate: 59800, image: '/images/store-buildwell.jpg' },
  { id: 'w_binding', category: 'steel', name: 'Binding Wire 18 Gauge', spec: '25 kg coil', unit: 'coil', moq: 10, step: 5, marketRate: 1850, image: '/images/cat-electrical.jpg' },
  { id: 'w_wire_25', category: 'electrical', name: 'Havells 2.5 sq mm Copper Wire', spec: '90 m coil', unit: 'coil', moq: 10, step: 5, marketRate: 1890, image: '/images/cat-electrical.jpg' },
  { id: 'w_wire_15', category: 'electrical', name: 'Polycab 1.5 sq mm Copper Wire', spec: '90 m coil', unit: 'coil', moq: 10, step: 5, marketRate: 1240, image: '/images/cat-electrical.jpg' },
  { id: 'w_switch', category: 'electrical', name: 'Anchor Roma 16A Switch', spec: 'Box of 20', unit: 'box', moq: 5, step: 5, marketRate: 1560, image: '/images/cat-switch-cutout.jpg' },
  { id: 'w_paint_ext', category: 'paint', name: 'Asian Paints Apex Exterior', spec: '20 L bucket', unit: 'bucket', moq: 10, step: 5, marketRate: 6200, image: '/images/cat-paint-cutout.jpg' },
  { id: 'w_primer', category: 'paint', name: 'Asian Paints TruCare Primer', spec: '20 L bucket', unit: 'bucket', moq: 10, step: 5, marketRate: 3400, image: '/images/bulk-paint.jpg' },
  { id: 'w_pvc_pipe', category: 'plumbing', name: 'Supreme PVC Pipe 4 inch', spec: '6 m length', unit: 'pipe', moq: 20, step: 10, marketRate: 940, image: '/images/cat-plumbing.jpg' },
  { id: 'w_cpvc', category: 'plumbing', name: 'Astral CPVC Pipe 1 inch', spec: '3 m length', unit: 'pipe', moq: 25, step: 25, marketRate: 410, image: '/images/cat-plumbing.jpg' },
  { id: 'w_anchor', category: 'hardware', name: 'Fischer Anchor Fasteners 10mm', spec: 'Box of 100', unit: 'box', moq: 5, step: 5, marketRate: 980, image: '/images/cat-screws-cutout.jpg' },
  { id: 'w_screws', category: 'hardware', name: 'Self-Drilling Screws 25mm', spec: 'Box of 500', unit: 'box', moq: 5, step: 5, marketRate: 640, image: '/images/cat-bolts-cutout.jpg' },
  { id: 'w_adhesive', category: 'hardware', name: 'Fevicol SH Wood Adhesive', spec: '5 kg pail', unit: 'pail', moq: 10, step: 5, marketRate: 1180, image: '/images/cat-adhesive-cutout.jpg' },
];

export function getCatalogItem(id) {
  return WHOLESALE_CATALOG.find((i) => i.id === id);
}

export const unitLabel = (unit, qty) => (qty === 1 ? unit : `${unit}s`);
