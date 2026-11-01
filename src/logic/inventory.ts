export const LOW_STOCK_THRESHOLD = 5;
export const DEFAULT_TAX_RATE = 0.0825;
export const RIG_BUNDLE_DISCOUNT_RATE = 0.05;

export const PROMO_CODES: Record<string, { code: string; rate: number; label: string }> = {
  VOLT10: { code: 'VOLT10', rate: 0.1, label: '10% Off (VOLT10)' },
  BUILDER5: { code: 'BUILDER5', rate: 0.05, label: '5% Off (BUILDER5)' },
};

export type ComponentGroup =
  | 'gpus'
  | 'cpus'
  | 'motherboards'
  | 'storage'
  | 'audio'
  | 'gaming'
  | 'other';

export interface PriceHistoryPoint {
  month: string;
  price: number;
  marketAvg: number;
}

export interface ProductSpecs {
  sku: string;
  group: ComponentGroup;
  groupLabel: string;
  architecture: string;
  interfaceSpec: string;
  powerDraw: string;
  warranty: string;
  lowestPrice: number;
  highestPrice: number;
  avgPrice: number;
  priceDeltaPct: number;
}

export interface ProductStockLike {
  id: number;
  title?: string;
  category?: string;
  price: number;
  quantity?: number;
  stock?: number;
}

const DEFAULT_QUANTITIES_BY_ID: Record<number, number> = {
  1: 3,
  2: 14,
  3: 2,
  4: 20,
  5: 11,
  6: 4,
  7: 9,
  8: 1,
  9: 16,
  10: 3,
  11: 7,
  12: 4,
  13: 10,
  14: 18,
  15: 6,
  16: 25,
  17: 2,
  18: 8,
  19: 2,
  20: 12,
  21: 3,
  22: 8,
  23: 15,
  24: 4,
  25: 1,
  26: 10,
  27: 2,
};

export function getProductQuantity(product: { id?: number; quantity?: number; stock?: number }): number {
  if (typeof product.quantity === 'number' && !Number.isNaN(product.quantity)) {
    return Math.max(0, Math.floor(product.quantity));
  }
  if (typeof product.stock === 'number' && !Number.isNaN(product.stock)) {
    return Math.max(0, Math.floor(product.stock));
  }
  if (typeof product.id === 'number' && product.id in DEFAULT_QUANTITIES_BY_ID) {
    return DEFAULT_QUANTITIES_BY_ID[product.id];
  }
  return 10;
}

export function isLowStock(product: { id?: number; quantity?: number; stock?: number }): boolean {
  const qty = getProductQuantity(product);
  return qty < LOW_STOCK_THRESHOLD;
}

export function getStockBadgeLabel(product: { id?: number; quantity?: number; stock?: number }): string | null {
  return isLowStock(product) ? 'Low Stock' : null;
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function classifyComponentGroup(product: { title?: string; category?: string }): ComponentGroup {
  const hay = `${product.title || ''} ${product.category || ''}`.toLowerCase();
  if (hay.includes('rtx') || hay.includes('gtx') || hay.includes('radeon') || hay.includes('gpu') || hay.includes('graphics')) {
    return 'gpus';
  }
  if (hay.includes('ryzen') || hay.includes('intel') || hay.includes('core i') || hay.includes('cpu') || hay.includes('processor') || hay.includes('noctua') || hay.includes('cooler')) {
    return 'cpus';
  }
  if (hay.includes('motherboard') || hay.includes('b550') || hay.includes('b570') || hay.includes('x670') || hay.includes('z790') || hay.includes('tomahawk') || hay.includes('ddr5') || hay.includes('vengeance') || hay.includes('raspberry')) {
    return 'motherboards';
  }
  if (hay.includes('ssd') || hay.includes('nvme') || hay.includes('harddisk') || hay.includes('hard disk') || hay.includes('hdd') || hay.includes('storage')) {
    return 'storage';
  }
  if (hay.includes('airpods') || hay.includes('headphone') || hay.includes('xm5') || hay.includes('earbud') || hay.includes('audio') || hay.includes('speaker') || hay.includes('mic') || hay.includes('webcam') || hay.includes('facecam')) {
    return 'audio';
  }
  if (hay.includes('playstation') || hay.includes('ps5') || hay.includes('xbox') || hay.includes('controller') || hay.includes('console') || hay.includes('gaming') || hay.includes('alienware') || hay.includes('oled') || hay.includes('monitor') || hay.includes('keychron') || hay.includes('keyboard')) {
    return 'gaming';
  }
  return 'other';
}

const SKU_PREFIX_BY_GROUP: Record<ComponentGroup, string> = {
  gpus: 'GPU',
  cpus: 'CPU',
  motherboards: 'MBD',
  storage: 'STR',
  audio: 'AUD',
  gaming: 'GMG',
  other: 'PRT',
};

const GROUP_LABEL: Record<ComponentGroup, string> = {
  gpus: 'Graphics Card (GPU)',
  cpus: 'Processor (CPU)',
  motherboards: 'Motherboard',
  storage: 'Solid State / Drive Storage',
  audio: 'Studio & Personal Audio',
  gaming: 'Console & Gaming Gear',
  other: 'Electronics Component',
};

export function getProductSku(product: { id: number; title?: string; category?: string }): string {
  const group = classifyComponentGroup(product);
  const prefix = SKU_PREFIX_BY_GROUP[group] || 'PRT';
  const padded = String(product.id).padStart(3, '0');
  return `VB-${prefix}-${padded}`;
}

export function generatePriceHistory(product: { id: number; price: number }): PriceHistoryPoint[] {
  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const basePrice = Math.max(1, Number(product.price) || 100);
  const seed = (Number(product.id) || 1) * 17;

  // Deterministic realistic historical curve ending at current price in Oct
  const multipliers = [
    1.14 - ((seed % 7) * 0.01),
    1.10 + ((seed % 5) * 0.008),
    1.06 - ((seed % 4) * 0.01),
    1.08 + ((seed % 6) * 0.005),
    1.03 - ((seed % 3) * 0.007),
    1.0,
  ];

  return months.map((month, idx) => {
    const price = idx === months.length - 1 ? roundMoney(basePrice) : roundMoney(basePrice * multipliers[idx]);
    const marketAvg = roundMoney(price * (1.06 + ((idx + seed) % 4) * 0.012));
    return { month, price, marketAvg };
  });
}

export function getProductSpecs(product: { id: number; title?: string; category?: string; price: number }): ProductSpecs {
  const group = classifyComponentGroup(product);
  const sku = getProductSku(product);
  const history = generatePriceHistory(product);
  const prices = history.map((h) => h.price);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);
  const avgPrice = roundMoney(prices.reduce((acc, v) => acc + v, 0) / prices.length);
  const firstPrice = prices[0] || product.price;
  const priceDeltaPct = firstPrice > 0 ? roundMoney(((product.price - firstPrice) / firstPrice) * 100) : 0;

  let architecture = 'Precision Solid-State';
  let interfaceSpec = 'PCIe 4.0 / USB-C';
  let powerDraw = '65W Nominal';
  let warranty = '3-Year Limited Hardware';

  if (group === 'gpus') {
    architecture = 'Blackwell / Ada 32GB GDDR7';
    interfaceSpec = 'PCIe 5.0 x16 · HDMI 2.1b + 3× DP 2.1';
    powerDraw = '450W TDP (16-Pin 12V-2x6)';
    warranty = '3-Year Manufacturer + Voltbox Bench Verified';
  } else if (group === 'cpus') {
    architecture = 'Zen 5 · 16-Core / 32-Thread · 5.7 GHz Boost';
    interfaceSpec = 'Socket AM5 · Dual-Channel DDR5-6400';
    powerDraw = '170W TDP · 80MB L2+L3 Cache';
    warranty = '3-Year Boxed Processor Warranty';
  } else if (group === 'motherboards') {
    architecture = '14+2+1 Duet Rail VRM · 6-Layer Server PCB';
    interfaceSpec = 'Socket AM5 / ATX · 3× M.2 Gen5 · Wi-Fi 7';
    powerDraw = '24-Pin ATX + Dual 8-Pin EPS';
    warranty = '3-Year Board & BIOS Protection';
  } else if (group === 'storage') {
    const isHdd = (product.title || '').toLowerCase().includes('harddisk');
    architecture = isHdd ? 'CMR 7200 RPM Multi-Platter Cache' : '3D TLC NAND · DRAM Cache Controller';
    interfaceSpec = isHdd ? 'SATA III 6.0 Gb/s · 3.5" Form Factor' : 'PCIe Gen4 x4 NVMe 2.0 (7,450 MB/s)';
    powerDraw = isHdd ? '6.8W Active / 3.4W Idle' : '5.4W Active / 40mW DevSleep';
    warranty = '5-Year / 600 TBW Endurance';
  } else if (group === 'audio') {
    architecture = 'Custom 40mm Neodymium Dynamic Driver · H1/H2 DSP';
    interfaceSpec = 'Bluetooth 5.3 Multipoint + Lossless USB-C';
    powerDraw = '20-Hour Active ANC + Spatial Audio';
    warranty = '1-Year Apple / Voltbox Coverage';
  } else if (group === 'gaming') {
    const isController = (product.title || '').toLowerCase().includes('controller');
    architecture = isController ? 'Dual-Actuator Haptic + Adaptive Triggers' : 'Custom RDNA 3.5 Ray-Tracing GPU · 2TB SSD';
    interfaceSpec = isController ? 'Bluetooth 5.1 / USB-C Low-Latency' : 'HDMI 2.1 (4K 120Hz / 8K) · Wi-Fi 7';
    powerDraw = isController ? '1,560mAh Li-Ion Rechargeable' : '390W Peak System PSU';
    warranty = '1-Year Hardware Replacement';
  }

  return {
    sku,
    group,
    groupLabel: GROUP_LABEL[group],
    architecture,
    interfaceSpec,
    powerDraw,
    warranty,
    lowestPrice,
    highestPrice,
    avgPrice,
    priceDeltaPct,
  };
}

export interface RigBundleStatus {
  hasCpu: boolean;
  hasGpu: boolean;
  hasMotherboard: boolean;
  hasStorage: boolean;
  completedCoreCount: number;
  qualifiesForBundle: boolean;
  discountRate: number;
}

export function computeRigBundleStatus(
  products: ProductStockLike[],
  cart: Record<string, number>
): RigBundleStatus {
  let hasCpu = false;
  let hasGpu = false;
  let hasMotherboard = false;
  let hasStorage = false;

  for (const p of products) {
    const qty = cart[String(p.id)] || 0;
    if (qty <= 0) continue;
    const group = classifyComponentGroup(p);
    if (group === 'cpus') hasCpu = true;
    else if (group === 'gpus') hasGpu = true;
    else if (group === 'motherboards') hasMotherboard = true;
    else if (group === 'storage') hasStorage = true;
  }

  const completedCoreCount =
    (hasCpu ? 1 : 0) + (hasGpu ? 1 : 0) + (hasMotherboard ? 1 : 0) + (hasStorage ? 1 : 0);
  const qualifiesForBundle = completedCoreCount >= 3;

  return {
    hasCpu,
    hasGpu,
    hasMotherboard,
    hasStorage,
    completedCoreCount,
    qualifiesForBundle,
    discountRate: qualifiesForBundle ? RIG_BUNDLE_DISCOUNT_RATE : 0,
  };
}

export function computeCartTotals(
  products: ProductStockLike[],
  cart: Record<string, number>,
  taxRate: number = DEFAULT_TAX_RATE,
  promoCode?: string | null
): {
  count: number;
  sub: number;
  rigDiscount: number;
  promoDiscount: number;
  discountTotal: number;
  discountedSub: number;
  tax: number;
  total: number;
  rigBundle: RigBundleStatus;
  appliedPromo: string | null;
} {
  let count = 0;
  let sub = 0;
  for (const p of products) {
    const qty = cart[String(p.id)] || 0;
    if (qty > 0) {
      count += qty;
      sub += p.price * qty;
    }
  }
  const roundedSub = roundMoney(sub);
  const rigBundle = computeRigBundleStatus(products, cart);
  const rigDiscount = rigBundle.qualifiesForBundle ? roundMoney(roundedSub * rigBundle.discountRate) : 0;

  const cleanCode = (promoCode || '').trim().toUpperCase();
  const promoObj = cleanCode && cleanCode in PROMO_CODES ? PROMO_CODES[cleanCode] : null;
  const promoDiscount = promoObj ? roundMoney(roundedSub * promoObj.rate) : 0;

  const discountTotal = roundMoney(Math.min(roundedSub, rigDiscount + promoDiscount));
  const discountedSub = roundMoney(Math.max(0, roundedSub - discountTotal));
  const tax = roundMoney(discountedSub * taxRate);
  const total = roundMoney(discountedSub + tax);

  return {
    count,
    sub: roundedSub,
    rigDiscount,
    promoDiscount,
    discountTotal,
    discountedSub,
    tax,
    total,
    rigBundle,
    appliedPromo: promoObj ? promoObj.code : null,
  };
}

export function makeOrderId(millis: number): string {
  let seed = (millis % 65536).toString(16).toUpperCase();
  while (seed.length < 4) {
    seed = '0' + seed;
  }
  return 'VB-' + seed;
}
