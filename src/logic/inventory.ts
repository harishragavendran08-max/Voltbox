import QRCode from 'qrcode';

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
  28: 3,
  29: 2,
  30: 7,
  31: 4,
  32: 6,
  33: 3,
  34: 8,
  35: 9,
  36: 4,
  37: 2,
  38: 5,
  39: 7,
  40: 3,
  41: 2,
  42: 4,
  43: 6,
  44: 5,
  45: 4,
  46: 8,
  47: 5,
  48: 7,
  49: 3,
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

export type StockAvailabilityStatus = 'available-now' | 'backorder';
export type QuickStockFilterMode = 'all' | 'available-now' | 'backorder';

export function getStockAvailabilityStatus(product: {
  id?: number;
  quantity?: number;
  stock?: number;
  stockQuantity?: number;
  backorder?: boolean;
  stockStatus?: string;
}): StockAvailabilityStatus {
  if (product.backorder === true || String(product.stockStatus || '').trim().toLowerCase() === 'backorder') {
    return 'backorder';
  }
  const qty =
    typeof product.stockQuantity === 'number' && !Number.isNaN(product.stockQuantity)
      ? Math.max(0, Math.floor(product.stockQuantity))
      : getProductQuantity(product);
  return qty > 0 ? 'available-now' : 'backorder';
}

export function isBackorderProduct(product: {
  id?: number;
  quantity?: number;
  stock?: number;
  stockQuantity?: number;
  backorder?: boolean;
  stockStatus?: string;
}): boolean {
  return getStockAvailabilityStatus(product) === 'backorder';
}

export function isLowStock(product: { id?: number; quantity?: number; stock?: number }): boolean {
  const qty = getProductQuantity(product);
  return qty < LOW_STOCK_THRESHOLD;
}

export function getStockBadgeLabel(product: {
  id?: number;
  quantity?: number;
  stock?: number;
  stockQuantity?: number;
  backorder?: boolean;
  stockStatus?: string;
}): string | null {
  if (isBackorderProduct(product)) return 'Backorder';
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
  if (hay.includes('ryzen') || hay.includes('intel') || hay.includes('core ultra') || hay.includes('core i') || hay.includes('cpu') || hay.includes('processor') || hay.includes('noctua') || hay.includes('cooler') || hay.includes('kraken') || hay.includes('aio')) {
    return 'cpus';
  }
  if (hay.includes('motherboard') || hay.includes('b550') || hay.includes('b570') || hay.includes('x670') || hay.includes('x870') || hay.includes('crosshair') || hay.includes('z790') || hay.includes('tomahawk') || hay.includes('ddr5') || hay.includes('vengeance') || hay.includes('raspberry') || hay.includes('power supply') || hay.includes('rm1000x') || hay.includes('chassis') || hay.includes('o11 dynamic') || hay.includes('case')) {
    return 'motherboards';
  }
  if (hay.includes('ssd') || hay.includes('nvme') || hay.includes('mp700') || hay.includes('sn850') || hay.includes('harddisk') || hay.includes('hard disk') || hay.includes('hdd') || hay.includes('storage')) {
    return 'storage';
  }
  if (hay.includes('airpods') || hay.includes('headphone') || hay.includes('headset') || hay.includes('arctis') || hay.includes('xm5') || hay.includes('earbud') || hay.includes('audio') || hay.includes('speaker') || hay.includes('mic') || hay.includes('shure') || hay.includes('sm7') || hay.includes('broadcast') || hay.includes('webcam') || hay.includes('facecam')) {
    return 'audio';
  }
  if (hay.includes('playstation') || hay.includes('ps5') || hay.includes('xbox') || hay.includes('controller') || hay.includes('console') || hay.includes('handheld') || hay.includes('aethel') || hay.includes('steam deck') || hay.includes('mouse') || hay.includes('viper') || hay.includes('apex pro') || hay.includes('gaming') || hay.includes('alienware') || hay.includes('oled') || hay.includes('monitor') || hay.includes('keychron') || hay.includes('huntsman') || hay.includes('keyboard')) {
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

export function getProductSku(product: { id: number; sku?: string | null; title?: string; category?: string }): string {
  if (typeof product.sku === 'string' && product.sku.trim()) {
    return product.sku.trim();
  }
  const group = classifyComponentGroup(product);
  const prefix = SKU_PREFIX_BY_GROUP[group] || 'PRT';
  const padded = String(product.id).padStart(3, '0');
  return `VB-${prefix}-${padded}`;
}

export interface BarcodeBar {
  x: number;
  width: number;
  height: number;
  isGuard: boolean;
}

export function generateSkuBarcodeBars(sku: string): BarcodeBar[] {
  const clean = (sku || 'VB-PRT-000').trim().toUpperCase();
  const bars: BarcodeBar[] = [
    { x: 0, width: 1.5, height: 18, isGuard: true },
    { x: 2.8, width: 1.0, height: 18, isGuard: true },
  ];

  let cursor = 5.8;
  const maxRight = 113.5;
  let idx = 0;

  while (cursor < maxRight) {
    const ch = clean.charCodeAt(idx % clean.length) || 65;
    const mix = (ch * 13 + idx * 7) % 16;

    // Insert a center guard pair near the midpoint
    if (cursor >= 56 && cursor <= 60 && !bars.some((b) => b.isGuard && b.x > 10)) {
      bars.push({ x: roundMoney(cursor), width: 1.1, height: 17.5, isGuard: true });
      bars.push({ x: roundMoney(cursor + 2.3), width: 1.1, height: 17.5, isGuard: true });
      cursor += 5.2;
      idx++;
      continue;
    }

    const widths = [1.0, 1.5, 2.2, 3.0];
    const gaps = [1.3, 1.7, 2.1, 2.5];
    const w = widths[mix % widths.length];
    const gap = gaps[Math.floor(mix / 4) % gaps.length];

    if (cursor + w > maxRight) break;
    bars.push({
      x: roundMoney(cursor),
      width: w,
      height: 14,
      isGuard: false,
    });
    cursor += w + gap;
    idx++;
  }

  bars.push({ x: 115.8, width: 1.0, height: 18, isGuard: true });
  bars.push({ x: 118.2, width: 1.5, height: 18, isGuard: true });
  return bars;
}

const CODE39_PATTERNS: Record<string, string> = {
  '*': 'nwnnwnwnn',
  '-': 'nwnnnnwnw',
  '0': 'nnnwwnwnn',
  '1': 'wnnwnnnnw',
  '2': 'nnwwnnnnw',
  '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn',
  '6': 'nnwwwnnnn',
  '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn',
  '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw',
  B: 'nnwnnwnnw',
  C: 'wnwnnwnnn',
  D: 'nnnnwwnnw',
  E: 'wnnnwwnnn',
  F: 'nnwnwwnnn',
  G: 'nnnnnwwnw',
  H: 'wnnnnwwnn',
  I: 'nnwnnwwnn',
  J: 'nnnnwwwnn',
  K: 'wnnnnnnww',
  L: 'nnwnnnnww',
  M: 'wnwnnnnwn',
  N: 'nnnnwnnww',
  O: 'wnnnwnnwn',
  P: 'nnwnwnnwn',
  Q: 'nnnnnnwww',
  R: 'wnnnnnwwn',
  S: 'nnwnnnwwn',
  T: 'nnnnwnwwn',
  U: 'wwnnnnnnw',
  V: 'nwwnnnnnw',
  W: 'wwwnnnnnn',
  X: 'nwnnwnnnw',
  Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn',
};

export interface ReceiptBarcodeResult {
  encodedValue: string;
  totalWidth: number;
  bars: Array<{ x: number; width: number; height: number }>;
}

export function encodeReceiptCode39Bars(receiptId: string): ReceiptBarcodeResult {
  const sanitized =
    String(receiptId || 'VB-0000')
      .toUpperCase()
      .replace(/[^0-9A-Z-]/g, '') || 'VB-0000';
  const payload = `*${sanitized}*`;
  const narrow = 2;
  const wide = 5;
  const quietZone = 10;

  let cursor = quietZone;
  const bars: Array<{ x: number; width: number; height: number }> = [];

  for (let c = 0; c < payload.length; c++) {
    const ch = payload[c];
    const pattern = CODE39_PATTERNS[ch] || CODE39_PATTERNS['-'];
    const isStartOrStop = c === 0 || c === payload.length - 1;
    for (let i = 0; i < pattern.length; i++) {
      const w = pattern[i] === 'w' ? wide : narrow;
      if (i % 2 === 0) {
        bars.push({
          x: cursor,
          width: w,
          height: isStartOrStop ? 42 : 38,
        });
      }
      cursor += w;
    }
    if (c < payload.length - 1) {
      cursor += narrow; // inter-character narrow space
    }
  }

  return {
    encodedValue: payload,
    totalWidth: cursor + quietZone,
    bars,
  };
}

export function generateReceiptQrMatrix(receiptId: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const placeFinder = (rowOffset: number, colOffset: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rowOffset + r;
        const cc = colOffset + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        reserved[rr][cc] = true;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const onBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          matrix[rr][cc] = onBorder || inCore;
        } else {
          matrix[rr][cc] = false;
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    matrix[6][i] = i % 2 === 0;
    reserved[i][6] = true;
    matrix[i][6] = i % 2 === 0;
  }

  // Dark module
  reserved[size - 8][8] = true;
  matrix[size - 8][8] = true;

  // Build deterministic bit stream from receiptId
  const clean = String(receiptId || 'VB-0000').trim().toUpperCase();
  const payload = `VOLTBOX:${clean}`;
  const bits: boolean[] = [];
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    const code = payload.charCodeAt(i);
    hash ^= code;
    hash = Math.imul(hash, 16777619) >>> 0;
    for (let b = 7; b >= 0; b--) {
      bits.push(((code >> b) & 1) === 1);
    }
  }
  for (let b = 31; b >= 0; b--) {
    bits.push(((hash >> b) & 1) === 1);
  }

  let bitIdx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      const bit = bits[bitIdx % bits.length];
      const mask = (r * 3 + c * 5 + bitIdx) % 3 === 0;
      matrix[r][c] = bit !== mask;
      bitIdx++;
    }
  }

  return matrix;
}

export function generatePriceHistory(product: { id: number; price: number }): PriceHistoryPoint[] {
  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const basePrice = Math.max(1, Number(product.price) || 100);
  const seed = (Number(product.id) || 1) * 17;

  // Deterministic realistic historical curve with seasonal peaks and promotional dips ending at current price in Oct
  const multipliers = [
    1.12 - ((seed % 5) * 0.01),
    1.07 + ((seed % 4) * 0.008),
    0.94 - ((seed % 3) * 0.005),
    1.04 + ((seed % 5) * 0.006),
    0.90 - ((seed % 4) * 0.005),
    1.0,
  ];

  return months.map((month, idx) => {
    const price = idx === months.length - 1 ? roundMoney(basePrice) : roundMoney(basePrice * multipliers[idx]);
    const marketAvg = roundMoney(price * (1.06 + ((idx + seed) % 4) * 0.012));
    return { month, price, marketAvg };
  });
}

export interface SixMonthPriceDropMetrics {
  sixMonthAvg: number;
  currentPrice: number;
  percentageDrop: number;
  savingsAmount: number;
  isDeal: boolean;
}

export function computePriceDropFromSixMonthAvg(product: { id: number; price: number }): SixMonthPriceDropMetrics {
  const history = generatePriceHistory(product);
  const prices = history.map((h) => h.price);
  const sixMonthAvg = roundMoney(prices.reduce((acc, v) => acc + v, 0) / prices.length);
  const currentPrice = roundMoney(product.price);
  const savingsAmount = roundMoney(Math.max(0, sixMonthAvg - currentPrice));
  const percentageDrop =
    sixMonthAvg > 0 ? roundMoney(((sixMonthAvg - currentPrice) / sixMonthAvg) * 100) : 0;
  return {
    sixMonthAvg,
    currentPrice,
    percentageDrop,
    savingsAmount,
    isDeal: percentageDrop > 0,
  };
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

export interface OdometerColumnSpec {
  posFromRight: number;
  type: 'digit' | 'sep';
  char: string;
  digit: number;
  prevDigit: number;
  changed: boolean;
  translateYPercent: number;
  delayMs: number;
}

export interface OdometerRollPlan {
  prevText: string;
  nextText: string;
  direction: 'up' | 'down' | 'none';
  columns: OdometerColumnSpec[];
}

export function computeOdometerColumns(prevText: string, nextText: string): OdometerRollPlan {
  const cleanPrev = (prevText || '0.00').trim();
  const cleanNext = (nextText || '0.00').trim();
  const prevNum = parseFloat(cleanPrev.replace(/[^0-9.-]/g, '')) || 0;
  const nextNum = parseFloat(cleanNext.replace(/[^0-9.-]/g, '')) || 0;
  const direction: 'up' | 'down' | 'none' =
    nextNum > prevNum ? 'up' : nextNum < prevNum ? 'down' : 'none';

  const columns: OdometerColumnSpec[] = [];
  const nextLen = cleanNext.length;
  const prevLen = cleanPrev.length;

  let rollingIndex = 0;
  for (let i = 0; i < nextLen; i++) {
    const posFromRight = nextLen - 1 - i;
    const ch = cleanNext.charAt(i);
    const prevIdx = prevLen - 1 - posFromRight;
    const prevCh = prevIdx >= 0 && prevIdx < prevLen ? cleanPrev.charAt(prevIdx) : '0';

    if (ch >= '0' && ch <= '9') {
      const digit = ch.charCodeAt(0) - 48;
      const prevDigit = prevCh >= '0' && prevCh <= '9' ? prevCh.charCodeAt(0) - 48 : 0;
      const changed = digit !== prevDigit || prevIdx < 0;
      const delayMs = changed ? rollingIndex * 22 : 0;
      if (changed) rollingIndex++;
      columns.push({
        posFromRight,
        type: 'digit',
        char: ch,
        digit,
        prevDigit,
        changed,
        translateYPercent: -(digit * 10),
        delayMs,
      });
    } else {
      columns.push({
        posFromRight,
        type: 'sep',
        char: ch,
        digit: -1,
        prevDigit: -1,
        changed: false,
        translateYPercent: 0,
        delayMs: 0,
      });
    }
  }

  return {
    prevText: cleanPrev,
    nextText: cleanNext,
    direction,
    columns,
  };
}

export interface AuthKeyTelemetry {
  keyLengthFormatted: string;
  strengthScore: number; // 0..4
  strengthLabel: 'IDLE' | 'WEAK' | 'FAIR' | 'GOOD' | 'STRONG';
  emailStatus: 'IDLE' | 'TYPING' | 'VALID';
}

export function computeAuthKeyTelemetry(password: string, email: string): AuthKeyTelemetry {
  const pw = password || '';
  const em = (email || '').trim();
  const len = pw.length;
  const keyLengthFormatted = 'KEY_LEN: ' + (len < 10 ? '0' + len : String(len));

  let score = 0;
  if (len >= 4) score++;
  if (len >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]|[^A-Za-z0-9]/.test(pw)) score++;

  const labels: Array<'IDLE' | 'WEAK' | 'FAIR' | 'GOOD' | 'STRONG'> = [
    'IDLE',
    'WEAK',
    'FAIR',
    'GOOD',
    'STRONG',
  ];
  const strengthLabel = len === 0 ? 'IDLE' : labels[Math.max(1, Math.min(4, score))];

  let emailStatus: 'IDLE' | 'TYPING' | 'VALID' = 'IDLE';
  if (em.length > 0) {
    emailStatus = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em) ? 'VALID' : 'TYPING';
  }

  return {
    keyLengthFormatted,
    strengthScore: len === 0 ? 0 : Math.max(1, Math.min(4, score)),
    strengthLabel,
    emailStatus,
  };
}

export interface CardParallaxTilt {
  rotateXDeg: number;
  rotateYDeg: number;
  shiftXPx: number;
  shiftYPx: number;
  glareXPercent: number;
  glareYPercent: number;
}

/**
 * Computes subtle 3D CSS parallax tilt angles and content translation offsets
 * so a product card and its inner layers tilt slightly towards the cursor.
 */
export function computeCardParallaxTilt(
  offsetX: number,
  offsetY: number,
  width: number,
  height: number,
  maxTiltDeg = 6,
  maxShiftPx = 4.5
): CardParallaxTilt {
  if (!(width > 0) || !(height > 0)) {
    return {
      rotateXDeg: 0,
      rotateYDeg: 0,
      shiftXPx: 0,
      shiftYPx: 0,
      glareXPercent: 50,
      glareYPercent: 50,
    };
  }

  const halfW = width / 2;
  const halfH = height / 2;
  const nx = Math.max(-1, Math.min(1, (offsetX - halfW) / halfW));
  const ny = Math.max(-1, Math.min(1, (offsetY - halfH) / halfH));

  // Normal tilts towards the cursor: top-half (ny < 0) tilts +X, right-half (nx > 0) tilts +Y
  const rx = roundMoney(-ny * maxTiltDeg);
  const ry = roundMoney(nx * maxTiltDeg);
  const sx = roundMoney(nx * maxShiftPx);
  const sy = roundMoney(ny * maxShiftPx);
  const gx = roundMoney(Math.max(0, Math.min(100, (offsetX / width) * 100)));
  const gy = roundMoney(Math.max(0, Math.min(100, (offsetY / height) * 100)));

  return {
    rotateXDeg: rx === 0 ? 0 : rx,
    rotateYDeg: ry === 0 ? 0 : ry,
    shiftXPx: sx === 0 ? 0 : sx,
    shiftYPx: sy === 0 ? 0 : sy,
    glareXPercent: gx === 0 ? 0 : gx,
    glareYPercent: gy === 0 ? 0 : gy,
  };
}

export type MessengerChannel = 'general' | 'rig-builds' | 'price-drops';

export interface SanitizedChatPayload {
  valid: boolean;
  channel: MessengerChannel;
  text: string;
  productId: number | null;
  error?: string;
}

export function sanitizeChatMessage(input: {
  text?: unknown;
  channel?: unknown;
  productId?: unknown;
}): SanitizedChatPayload {
  const rawChannel = typeof input.channel === 'string' ? input.channel.trim().toLowerCase() : 'general';
  const channel: MessengerChannel =
    rawChannel === 'rig-builds' || rawChannel === 'price-drops' ? rawChannel : 'general';

  const rawText = typeof input.text === 'string' ? input.text.replace(/\s+/g, ' ').trim() : '';
  const pid =
    typeof input.productId === 'number' && Number.isFinite(input.productId) && input.productId > 0
      ? Math.floor(input.productId)
      : typeof input.productId === 'string' && Number.parseInt(input.productId, 10) > 0
      ? Number.parseInt(input.productId, 10)
      : null;

  if (!rawText && !pid) {
    return {
      valid: false,
      channel,
      text: '',
      productId: null,
      error: 'Please enter a message or attach a hardware component.',
    };
  }

  return {
    valid: true,
    channel,
    text: rawText.slice(0, 420),
    productId: pid,
  };
}

export const MIN_TOUCH_TARGET_PX = 44;

export interface TouchTargetValidationResult {
  valid: boolean;
  width: number;
  height: number;
  minRequiredPx: number;
  deficitWidthPx: number;
  deficitHeightPx: number;
}

export function validateTouchTargetDimensions(
  width: number,
  height: number,
  minRequiredPx: number = MIN_TOUCH_TARGET_PX
): TouchTargetValidationResult {
  const w = Number.isFinite(width) && width > 0 ? Math.round(width * 100) / 100 : 0;
  const h = Number.isFinite(height) && height > 0 ? Math.round(height * 100) / 100 : 0;
  const minReq = Number.isFinite(minRequiredPx) && minRequiredPx > 0 ? minRequiredPx : MIN_TOUCH_TARGET_PX;
  const deficitWidthPx = Math.max(0, Math.round((minReq - w) * 100) / 100);
  const deficitHeightPx = Math.max(0, Math.round((minReq - h) * 100) / 100);
  return {
    valid: w >= minReq && h >= minReq,
    width: w,
    height: h,
    minRequiredPx: minReq,
    deficitWidthPx,
    deficitHeightPx,
  };
}

export interface DeviceViewportProfile {
  deviceTier: 'mobile' | 'ipad-tablet' | 'desktop';
  columnsSuggested: number;
  showBottomAppDock: boolean;
  compactOrderBarByDefault: boolean;
  minTouchTargetPx: number;
}

export function classifyDeviceViewport(width: number, _height = 800): DeviceViewportProfile {
  const w = Number.isFinite(width) && width > 0 ? width : 1280;
  if (w <= 680) {
    return {
      deviceTier: 'mobile',
      columnsSuggested: 2,
      showBottomAppDock: true,
      compactOrderBarByDefault: true,
      minTouchTargetPx: MIN_TOUCH_TARGET_PX,
    };
  }
  if (w <= 1040) {
    return {
      deviceTier: 'ipad-tablet',
      columnsSuggested: 3,
      showBottomAppDock: true,
      compactOrderBarByDefault: false,
      minTouchTargetPx: MIN_TOUCH_TARGET_PX,
    };
  }
  return {
    deviceTier: 'desktop',
    columnsSuggested: 4,
    showBottomAppDock: false,
    compactOrderBarByDefault: false,
    minTouchTargetPx: MIN_TOUCH_TARGET_PX,
  };
}

export interface InventoryItemEntity {
  productId: number;
  sku: string;
  title: string;
  category: string;
  componentGroup: ComponentGroup;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderThreshold: number;
  lowStock: boolean;
  criticalStock: boolean;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'CRITICAL' | 'OUT_OF_STOCK';
  unitPrice: number;
  inventoryValue: number;
  lastRestockedAt: number;
  lastUpdatedBy: string;
}

export interface InventoryTransactionEntity {
  id: string;
  productId: number;
  sku: string;
  productTitle: string;
  type: 'RESTOCK' | 'CHECKOUT_DEDUCTION' | 'MANUAL_ADJUSTMENT';
  delta: number;
  previousStock: number;
  newStock: number;
  actorName: string;
  reason: string;
  timestamp: number;
}

export interface CartItemEntity {
  productId: number;
  sku: string;
  title: string;
  category: string;
  componentGroup: ComponentGroup;
  image: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  lowStock: boolean;
  lineSubtotal: number;
}

export interface CartEntity {
  userEmail: string;
  rawCart: Record<string, number>;
  items: CartItemEntity[];
  count: number;
  subtotal: number;
  rigDiscount: number;
  promoDiscount: number;
  discountTotal: number;
  discountedSubtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  appliedPromo: string | null;
  rigBundle: RigBundleStatus;
  updatedAt: number;
}

export function buildInventoryItem(
  product: {
    id: number;
    title?: string;
    category?: string;
    price: number;
    quantity?: number;
    stock?: number;
    createdAt?: number;
    addedByName?: string;
    lastRestockedAt?: number;
    lastUpdatedBy?: string;
  },
  reservedQuantity = 0
): InventoryItemEntity {
  const qty = getProductQuantity(product);
  const reserved = Math.max(0, Math.floor(reservedQuantity));
  const available = qty >= LOW_STOCK_THRESHOLD ? Math.max(0, qty - reserved) : qty;
  const lowStock = available < LOW_STOCK_THRESHOLD;
  const criticalStock = available <= 2;
  const stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'CRITICAL' | 'OUT_OF_STOCK' =
    available === 0
      ? 'OUT_OF_STOCK'
      : criticalStock
      ? 'CRITICAL'
      : lowStock
      ? 'LOW_STOCK'
      : 'IN_STOCK';

  return {
    productId: product.id,
    sku: getProductSku(product),
    title: product.title || 'Component',
    category: product.category || 'components',
    componentGroup: classifyComponentGroup(product),
    quantity: qty,
    reservedQuantity: reserved,
    availableQuantity: available,
    reorderThreshold: LOW_STOCK_THRESHOLD,
    lowStock,
    criticalStock,
    stockStatus,
    unitPrice: product.price,
    inventoryValue: roundMoney(qty * product.price),
    lastRestockedAt: product.lastRestockedAt || product.createdAt || 0,
    lastUpdatedBy: product.lastUpdatedBy || product.addedByName || 'Voltbox',
  };
}

export function buildInventorySummary(
  products: Array<{
    id: number;
    title?: string;
    category?: string;
    price: number;
    quantity?: number;
    stock?: number;
    takenDown?: boolean;
    createdAt?: number;
    addedByName?: string;
    lastRestockedAt?: number;
    lastUpdatedBy?: string;
  }>,
  carts: Array<Record<string, number>> = [],
  recentTransactions: InventoryTransactionEntity[] = []
) {
  const reservedByProduct: Record<number, number> = {};
  for (const c of carts) {
    if (!c) continue;
    for (const [pidStr, qtyVal] of Object.entries(c)) {
      const pid = Number.parseInt(pidStr, 10);
      const q = Number(qtyVal) || 0;
      if (!Number.isNaN(pid) && q > 0) {
        reservedByProduct[pid] = (reservedByProduct[pid] || 0) + q;
      }
    }
  }

  const active = products.filter((p) => !p.takenDown);
  const items = active.map((p) => buildInventoryItem(p, reservedByProduct[p.id] || 0));

  const totalSkus = items.length;
  const totalUnitsInStock = items.reduce((acc, i) => acc + i.quantity, 0);
  const reservedUnitsInCarts = items.reduce((acc, i) => acc + i.reservedQuantity, 0);
  const lowStockCount = items.filter((i) => i.lowStock).length;
  const criticalStockCount = items.filter((i) => i.criticalStock).length;
  const outOfStockCount = items.filter((i) => i.availableQuantity === 0).length;
  const totalInventoryValue = roundMoney(items.reduce((acc, i) => acc + i.inventoryValue, 0));

  return {
    ok: true,
    totalSkus,
    totalUnitsInStock,
    reservedUnitsInCarts,
    lowStockCount,
    criticalStockCount,
    outOfStockCount,
    totalInventoryValue,
    items,
    recentTransactions: recentTransactions.slice(0, 20),
  };
}

export function buildCartEntity(
  products: Array<{
    id: number;
    title?: string;
    category?: string;
    image?: string;
    price: number;
    quantity?: number;
    stock?: number;
    takenDown?: boolean;
  }>,
  rawCart: Record<string, number>,
  userEmail = 'guest@voltbox.test',
  promoCode?: string | null,
  taxRate: number = DEFAULT_TAX_RATE
): CartEntity {
  const activeProducts = products.filter((p) => !p.takenDown);
  const byId = new Map(activeProducts.map((p) => [p.id, p]));
  const cleanRaw: Record<string, number> = {};
  const items: CartItemEntity[] = [];

  for (const [idStr, qtyVal] of Object.entries(rawCart || {})) {
    const pid = Number.parseInt(idStr, 10);
    const qty = Math.floor(Number(qtyVal) || 0);
    if (Number.isNaN(pid) || qty <= 0) continue;
    const p = byId.get(pid);
    if (!p) continue;

    cleanRaw[String(p.id)] = qty;
    const stock = getProductQuantity(p);
    items.push({
      productId: p.id,
      sku: getProductSku(p),
      title: p.title || 'Component',
      category: p.category || 'components',
      componentGroup: classifyComponentGroup(p),
      image: p.image || '',
      unitPrice: p.price,
      quantity: qty,
      availableStock: stock,
      lowStock: isLowStock({ quantity: stock }),
      lineSubtotal: roundMoney(p.price * qty),
    });
  }

  const totals = computeCartTotals(activeProducts, cleanRaw, taxRate, promoCode);

  return {
    userEmail,
    rawCart: cleanRaw,
    items,
    count: totals.count,
    subtotal: totals.sub,
    rigDiscount: totals.rigDiscount,
    promoDiscount: totals.promoDiscount,
    discountTotal: totals.discountTotal,
    discountedSubtotal: totals.discountedSub,
    taxRate,
    tax: totals.tax,
    total: totals.total,
    appliedPromo: totals.appliedPromo,
    rigBundle: totals.rigBundle,
    updatedAt: Date.now(),
  };
}

export interface ProductJpaEntity {
  id: number;
  sku: string;
  name: string;
  title: string;
  price: number;
  stockQuantity: number;
  quantity: number;
  stock: number;
  lowStock: boolean;
  backorder: boolean;
  stockStatus: StockAvailabilityStatus;
  category: string;
  componentGroup: ComponentGroup;
  description: string;
  image: string;
  ratingRate: number;
  ratingCount: number;
  addedByName: string;
  addedByColor: string;
  addedByEmail?: string;
  official: boolean;
  createdAt: number;
  takenDown: boolean;
  lastRestockedAt: number;
  lastUpdatedBy: string;
  priceHistory: PriceHistoryPoint[];
  specs: ProductSpecs;
}

/**
 * Maps a raw product record to the full ProductJpaEntity structure matching
 * com.voltbox.entity.ProductEntity and com.voltbox.model.Product JPA @Entity.
 */
export function toProductJpaEntity(product: {
  id: number;
  sku?: string | null;
  name?: string | null;
  title?: string | null;
  price: number;
  stockQuantity?: number | null;
  quantity?: number | null;
  stock?: number | null;
  category?: string | null;
  description?: string | null;
  image?: string | null;
  ratingRate?: number | null;
  ratingCount?: number | null;
  addedByName?: string | null;
  addedByColor?: string | null;
  addedByEmail?: string | null;
  official?: boolean | null;
  createdAt?: number | null;
  takenDown?: boolean | null;
  lastRestockedAt?: number | null;
  lastUpdatedBy?: string | null;
}): ProductJpaEntity {
  const resolvedName = (product.name || product.title || 'Component').trim();
  const resolvedCategory = (product.category || 'components').trim();
  const qty =
    typeof product.stockQuantity === 'number' && !Number.isNaN(product.stockQuantity)
      ? Math.max(0, Math.floor(product.stockQuantity))
      : getProductQuantity({
          id: product.id,
          quantity: product.quantity ?? undefined,
          stock: product.stock ?? undefined,
        });
  const sku = (product.sku || '').trim() || getProductSku({
    id: product.id,
    title: resolvedName,
    category: resolvedCategory,
  });
  const componentGroup = classifyComponentGroup({
    title: resolvedName,
    category: resolvedCategory,
  });
  const priceHistory = generatePriceHistory({ id: product.id, price: product.price });
  const specs = getProductSpecs({
    id: product.id,
    title: resolvedName,
    category: resolvedCategory,
    price: product.price,
  });

  return {
    id: product.id,
    sku,
    name: resolvedName,
    title: resolvedName,
    price: roundMoney(product.price),
    stockQuantity: qty,
    quantity: qty,
    stock: qty,
    lowStock: qty < LOW_STOCK_THRESHOLD,
    backorder: qty <= 0,
    stockStatus: qty > 0 ? 'available-now' : 'backorder',
    category: resolvedCategory,
    componentGroup,
    description: product.description || '',
    image: product.image || '',
    ratingRate: typeof product.ratingRate === 'number' ? product.ratingRate : 4.5,
    ratingCount: typeof product.ratingCount === 'number' ? product.ratingCount : 0,
    addedByName: product.addedByName || 'Voltbox',
    addedByColor: product.addedByColor || '#ffd23f',
    ...(product.addedByEmail ? { addedByEmail: product.addedByEmail } : {}),
    official: Boolean(product.official),
    createdAt: product.createdAt || 0,
    takenDown: Boolean(product.takenDown),
    lastRestockedAt: product.lastRestockedAt || product.createdAt || 0,
    lastUpdatedBy: product.lastUpdatedBy || product.addedByName || 'Voltbox',
    priceHistory,
    specs,
  };
}

export interface GroupStockBreakdown {
  group: ComponentGroup;
  label: string;
  skuCount: number;
  unitCount: number;
  lowStockCount: number;
  valuation: number;
}

export interface SystemHealthMetrics {
  ok: boolean;
  status: 'UP' | 'DEGRADED';
  timestamp: number;
  uptimeSeconds: number;
  database: {
    engine: string;
    dialect: string;
    connectionPool: string;
    ddlAuto: string;
    status: 'CONNECTED';
    activeConnections: number;
    maxConnections: number;
  };
  jvm: {
    javaVersion: string;
    springBootVersion: string;
    heapUsedMb: number;
    heapMaxMb: number;
    heapUtilizationPct: number;
  };
  catalog: {
    totalProducts: number;
    activeProducts: number;
    takenDownProducts: number;
    officialProducts: number;
    communityProducts: number;
    totalUnitsInStock: number;
    reservedUnitsInCarts: number;
    lowStockCount: number;
    criticalStockCount: number;
    outOfStockCount: number;
    totalInventoryValuation: number;
    groupBreakdown: GroupStockBreakdown[];
  };
  commerce: {
    totalUsers: number;
    moderatorsCount: number;
    contributorsCount: number;
    membersCount: number;
    totalOrders: number;
    totalRevenue: number;
    openReportsCount: number;
    pendingApplicationsCount: number;
    activeWebSocketClients: number;
  };
  endpoints: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    controller: string;
    status: 'ACTIVE';
  }>;
}

export function computeSystemHealthMetrics(input: {
  products: Array<{
    id: number;
    title?: string;
    name?: string;
    category?: string;
    price: number;
    stockQuantity?: number;
    quantity?: number;
    stock?: number;
    official?: boolean;
    takenDown?: boolean;
  }>;
  users?: Array<{
    role?: string;
    cart?: Record<string, number>;
    orders?: Array<{ total?: number }>;
  }>;
  openReportsCount?: number;
  pendingApplicationsCount?: number;
  activeWebSocketClients?: number;
  uptimeSeconds?: number;
  heapUsedMb?: number;
  heapMaxMb?: number;
}): SystemHealthMetrics {
  const allProducts = input.products || [];
  const activeProducts = allProducts.filter((p) => !p.takenDown);
  const takenDownProducts = allProducts.filter((p) => Boolean(p.takenDown));
  const users = input.users || [];

  const reservedByProduct: Record<number, number> = {};
  let reservedUnitsInCarts = 0;
  let totalOrders = 0;
  let totalRevenue = 0;
  let moderatorsCount = 0;
  let contributorsCount = 0;
  let membersCount = 0;

  for (const u of users) {
    const role = (u.role || 'member').toLowerCase();
    if (role === 'moderator') moderatorsCount++;
    else if (role === 'contributor') contributorsCount++;
    else membersCount++;

    const cart = u.cart || {};
    for (const [pidStr, qtyVal] of Object.entries(cart)) {
      const pid = Number.parseInt(pidStr, 10);
      const q = Math.max(0, Math.floor(Number(qtyVal) || 0));
      if (!Number.isNaN(pid) && q > 0) {
        reservedByProduct[pid] = (reservedByProduct[pid] || 0) + q;
        reservedUnitsInCarts += q;
      }
    }

    for (const o of u.orders || []) {
      totalOrders++;
      totalRevenue = roundMoney(totalRevenue + (Number(o.total) || 0));
    }
  }

  const groupMap: Record<ComponentGroup, GroupStockBreakdown> = {
    gpus: { group: 'gpus', label: GROUP_LABEL.gpus, skuCount: 0, unitCount: 0, lowStockCount: 0, valuation: 0 },
    cpus: { group: 'cpus', label: GROUP_LABEL.cpus, skuCount: 0, unitCount: 0, lowStockCount: 0, valuation: 0 },
    motherboards: { group: 'motherboards', label: GROUP_LABEL.motherboards, skuCount: 0, unitCount: 0, lowStockCount: 0, valuation: 0 },
    storage: { group: 'storage', label: GROUP_LABEL.storage, skuCount: 0, unitCount: 0, lowStockCount: 0, valuation: 0 },
    audio: { group: 'audio', label: GROUP_LABEL.audio, skuCount: 0, unitCount: 0, lowStockCount: 0, valuation: 0 },
    gaming: { group: 'gaming', label: GROUP_LABEL.gaming, skuCount: 0, unitCount: 0, lowStockCount: 0, valuation: 0 },
    other: { group: 'other', label: GROUP_LABEL.other, skuCount: 0, unitCount: 0, lowStockCount: 0, valuation: 0 },
  };

  let officialProducts = 0;
  let communityProducts = 0;
  let totalUnitsInStock = 0;
  let lowStockCount = 0;
  let criticalStockCount = 0;
  let outOfStockCount = 0;
  let totalInventoryValuation = 0;

  for (const p of activeProducts) {
    if (p.official) officialProducts++;
    else communityProducts++;

    const qty =
      typeof p.stockQuantity === 'number' && !Number.isNaN(p.stockQuantity)
        ? Math.max(0, Math.floor(p.stockQuantity))
        : getProductQuantity(p);
    const val = roundMoney(qty * (Number(p.price) || 0));
    totalUnitsInStock += qty;
    totalInventoryValuation = roundMoney(totalInventoryValuation + val);

    if (qty === 0) outOfStockCount++;
    if (qty <= 2) criticalStockCount++;
    if (qty < LOW_STOCK_THRESHOLD) lowStockCount++;

    const g = classifyComponentGroup({ title: p.title || p.name, category: p.category });
    const entry = groupMap[g] || groupMap.other;
    entry.skuCount++;
    entry.unitCount += qty;
    if (qty < LOW_STOCK_THRESHOLD) entry.lowStockCount++;
    entry.valuation = roundMoney(entry.valuation + val);
  }

  const heapUsedMb = typeof input.heapUsedMb === 'number' && input.heapUsedMb > 0 ? roundMoney(input.heapUsedMb) : 118.4;
  const heapMaxMb = typeof input.heapMaxMb === 'number' && input.heapMaxMb > 0 ? roundMoney(input.heapMaxMb) : 512.0;
  const heapUtilizationPct = roundMoney(Math.min(100, (heapUsedMb / Math.max(1, heapMaxMb)) * 100));

  return {
    ok: true,
    status: 'UP',
    timestamp: Date.now(),
    uptimeSeconds: Math.max(1, Math.floor(Number(input.uptimeSeconds) || 3600)),
    database: {
      engine: 'H2 / MySQL (Spring Data JPA)',
      dialect: 'org.hibernate.dialect.H2Dialect (MODE=MySQL)',
      connectionPool: 'VoltboxHikariPool',
      ddlAuto: 'update',
      status: 'CONNECTED',
      activeConnections: 2,
      maxConnections: 10,
    },
    jvm: {
      javaVersion: '17.0.12',
      springBootVersion: '3.3.4',
      heapUsedMb,
      heapMaxMb,
      heapUtilizationPct,
    },
    catalog: {
      totalProducts: allProducts.length,
      activeProducts: activeProducts.length,
      takenDownProducts: takenDownProducts.length,
      officialProducts,
      communityProducts,
      totalUnitsInStock,
      reservedUnitsInCarts,
      lowStockCount,
      criticalStockCount,
      outOfStockCount,
      totalInventoryValuation,
      groupBreakdown: Object.values(groupMap),
    },
    commerce: {
      totalUsers: users.length,
      moderatorsCount,
      contributorsCount,
      membersCount,
      totalOrders,
      totalRevenue,
      openReportsCount: Math.max(0, Number(input.openReportsCount) || 0),
      pendingApplicationsCount: Math.max(0, Number(input.pendingApplicationsCount) || 0),
      activeWebSocketClients: Math.max(1, Number(input.activeWebSocketClients) || 1),
    },
    endpoints: [
      { method: 'GET', path: '/api/products', controller: 'ProductController#getProducts', status: 'ACTIVE' },
      { method: 'POST', path: '/api/products', controller: 'ProductController#createProduct', status: 'ACTIVE' },
      { method: 'PUT', path: '/api/products/{id}', controller: 'ProductController#updateProduct', status: 'ACTIVE' },
      { method: 'POST', path: '/api/products/{id}/inventory', controller: 'ProductController#updateProductInventoryPost', status: 'ACTIVE' },
      { method: 'DELETE', path: '/api/products/{id}', controller: 'ProductController#deleteProduct', status: 'ACTIVE' },
      { method: 'GET', path: '/api/inventory', controller: 'InventoryController#getInventorySummary', status: 'ACTIVE' },
      { method: 'GET', path: '/api/cart', controller: 'CartController#getCart', status: 'ACTIVE' },
      { method: 'GET', path: '/api/admin/metrics', controller: 'AdminController#getSystemMetrics', status: 'ACTIVE' },
      { method: 'POST', path: '/api/admin/inventory/restock-low-stock', controller: 'AdminController#restockAllLowStock', status: 'ACTIVE' },
    ],
  };
}

export interface AccountPermissions {
  role: 'member' | 'contributor' | 'moderator';
  isAdmin: boolean;
  canBrowseAndBuy: boolean;
  canAccessAdminDashboard: boolean;
  canManageInventory: boolean;
  roleBadge: string;
  allowedLoginModes: Array<'user' | 'admin'>;
}

export function evaluateAccountPermissions(rawRole?: string | null): AccountPermissions {
  const normalized = String(rawRole || 'member').trim().toLowerCase();
  if (normalized === 'moderator' || normalized === 'admin') {
    return {
      role: 'moderator',
      isAdmin: true,
      canBrowseAndBuy: true,
      canAccessAdminDashboard: true,
      canManageInventory: true,
      roleBadge: 'ADMIN · FULL ACCESS',
      allowedLoginModes: ['user', 'admin'],
    };
  }
  if (normalized === 'contributor') {
    return {
      role: 'contributor',
      isAdmin: false,
      canBrowseAndBuy: true,
      canAccessAdminDashboard: false,
      canManageInventory: true,
      roleBadge: 'CONTRIBUTOR · CATALOG',
      allowedLoginModes: ['user'],
    };
  }
  return {
    role: 'member',
    isAdmin: false,
    canBrowseAndBuy: true,
    canAccessAdminDashboard: false,
    canManageInventory: false,
    roleBadge: 'USER · SHOPPER',
    allowedLoginModes: ['user'],
  };
}

export interface SocialLoginIdentity {
  provider: 'google' | 'apple';
  email: string;
  name: string;
  role: 'member';
  isPrivateRelay: boolean;
}

export function resolveSocialLoginIdentity(input: {
  provider: 'google' | 'apple';
  email?: string | null;
  name?: string | null;
  hideMyEmail?: boolean;
}): SocialLoginIdentity {
  const provider = input.provider === 'apple' ? 'apple' : 'google';
  let rawEmail = String(input.email || '').trim().toLowerCase();
  let rawName = String(input.name || '').trim();

  if (!rawEmail) {
    rawEmail = provider === 'apple' ? 'maya.lin@icloud.com' : 'alex.chen@gmail.com';
  }
  if (!rawEmail.includes('@')) {
    rawEmail = `${rawEmail}@${provider === 'apple' ? 'icloud.com' : 'gmail.com'}`;
  }

  let isPrivateRelay = false;
  if (provider === 'apple' && input.hideMyEmail) {
    const localPart = rawEmail.split('@')[0].replace(/[^a-z0-9._-]/g, '') || 'apple.user';
    rawEmail = `${localPart}.relay@privaterelay.appleid.com`;
    isPrivateRelay = true;
  } else if (rawEmail.endsWith('@privaterelay.appleid.com')) {
    isPrivateRelay = true;
  }

  if (!rawName) {
    const handle = rawEmail.split('@')[0].replace(/\.relay$/, '');
    rawName = handle
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || (provider === 'apple' ? 'Apple Shopper' : 'Google Shopper');
  }

  return {
    provider,
    email: rawEmail,
    name: rawName,
    role: 'member',
    isPrivateRelay,
  };
}

export interface WishlistItem {
  productId: number;
  id: number;
  title: string;
  price: number;
  image: string;
  category: string;
  componentGroup: string;
  sku: string;
  inStock: boolean;
  quantity: number;
}

export interface WishlistSummary {
  count: number;
  productIds: number[];
  items: WishlistItem[];
  totalValue: number;
}

export function toggleWishlistItem(currentWishlist: number[] | undefined, productId: number): {
  wishlist: number[];
  added: boolean;
  productId: number;
} {
  const cleanId = Math.floor(Number(productId));
  const list = Array.isArray(currentWishlist) ? currentWishlist.map(Number).filter((n) => !Number.isNaN(n) && n > 0) : [];
  const idx = list.indexOf(cleanId);
  if (idx >= 0) {
    list.splice(idx, 1);
    return { wishlist: list, added: false, productId: cleanId };
  } else {
    list.push(cleanId);
    return { wishlist: list, added: true, productId: cleanId };
  }
}

export function buildWishlistSummary(
  productIds: number[] | undefined,
  products: Array<{
    id: number;
    title?: string;
    price: number;
    image?: string;
    category?: string;
    quantity?: number;
    stock?: number;
    takenDown?: boolean;
    sku?: string;
  }>
): WishlistSummary {
  const idSet = new Set(Array.isArray(productIds) ? productIds.map(Number) : []);
  const validProducts = products.filter((p) => !p.takenDown && idSet.has(p.id));

  const items: WishlistItem[] = validProducts.map((p) => {
    const qty = getProductQuantity(p);
    return {
      productId: p.id,
      id: p.id,
      title: p.title || 'Component',
      price: roundMoney(Number(p.price) || 0),
      image: p.image || '',
      category: p.category || 'components',
      componentGroup: classifyComponentGroup(p),
      sku: getProductSku(p),
      inStock: qty > 0,
      quantity: qty,
    };
  });

  const totalValue = roundMoney(items.reduce((acc, item) => acc + item.price, 0));

  return {
    count: items.length,
    productIds: items.map((i) => i.productId),
    items,
    totalValue,
  };
}

export function generateProductShareUrl(baseUrl: string, productId: number | string): string {
  const cleanBase = (baseUrl || 'http://localhost:3000').trim().replace(/\/+$/, '');
  const id = encodeURIComponent(String(productId));
  return `${cleanBase}/?product=${id}`;
}

export type SocialSharePlatform = 'twitter' | 'whatsapp' | 'facebook';
export type ShareDescriptionTone = 'spec' | 'deal' | 'concise';

export interface SocialShareUrls {
  twitter: string;
  whatsapp: string;
  facebook: string;
}

export interface ProductSharePayload {
  url: string;
  title: string;
  text: string;
  generatedDescription: string;
  descriptionsByTone: Record<ShareDescriptionTone, string>;
  socialUrls: SocialShareUrls;
  sku: string;
  price: number;
  qrPayload: string;
}

export function generateProductShareDescription(
  product: {
    id: number;
    title?: string;
    price?: number;
    sku?: string;
    category?: string;
    description?: string;
    quantity?: number;
    stock?: number;
  },
  shareUrl?: string,
  tone: ShareDescriptionTone = 'spec'
): string {
  const title = (product.title || `Component #${product.id}`).trim();
  const price = roundMoney(Number(product.price) || 0);
  const sku = (product.sku || getProductSku({ id: product.id, title, category: product.category })).trim();
  const specs = getProductSpecs({
    id: product.id,
    title,
    category: product.category,
    price,
  });
  const urlSuffix = shareUrl ? ` ${shareUrl}` : '';

  if (tone === 'deal') {
    return `⚡ Hardware Drop on Voltbox: ${title} (${sku}) is live at $${price.toFixed(2)}! Features ${specs.architecture} & ${specs.interfaceSpec} — qualifies for the 5% Rig Builder Bundle.${urlSuffix}`;
  }
  if (tone === 'concise') {
    return `Check out ${title} ($${price.toFixed(2)} · SKU ${sku}) on Voltbox Electronics!${urlSuffix}`;
  }
  return `🔧 ${title} [$${price.toFixed(2)} · ${sku}] on Voltbox Electronics — ${specs.architecture}, ${specs.interfaceSpec}, ${specs.powerDraw}. Bench-verified & ready to ship!${urlSuffix}`;
}

export function buildSocialShareUrls(
  url: string,
  description: string,
  hashtags: string[] = ['Voltbox', 'PCHardware', 'BuildARig']
): SocialShareUrls {
  const cleanUrl = (url || 'http://localhost:3000').trim();
  const cleanDesc = (description || 'Check out this component on Voltbox Electronics!').trim();
  // Strip trailing URL from tweet text since Twitter's `url` query param appends it cleanly
  const descWithoutTrailingUrl = cleanDesc.replace(new RegExp(`\\s*${cleanUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`), '').trim();
  const tagString = hashtags.filter(Boolean).join(',');

  const twitter =
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(descWithoutTrailingUrl)}` +
    `&url=${encodeURIComponent(cleanUrl)}` +
    (tagString ? `&hashtags=${encodeURIComponent(tagString)}` : '');

  const whatsappMessage = cleanDesc.includes(cleanUrl) ? cleanDesc : `${cleanDesc} ${cleanUrl}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  const facebook =
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(cleanUrl)}` +
    `&quote=${encodeURIComponent(descWithoutTrailingUrl)}`;

  return {
    twitter,
    whatsapp,
    facebook,
  };
}

export function generateProductSharePayload(
  origin: string,
  product: {
    id: number;
    title?: string;
    price?: number;
    sku?: string;
    category?: string;
    description?: string;
    quantity?: number;
    stock?: number;
  },
  tone: ShareDescriptionTone = 'spec'
): ProductSharePayload {
  const url = generateProductShareUrl(origin, product.id);
  const title = product.title || `Component #${product.id}`;
  const price = roundMoney(Number(product.price) || 0);
  const sku = product.sku || `VB-PRT-${String(product.id).padStart(3, '0')}`;
  const text = `Check out ${title} ($${price.toFixed(2)}) on Voltbox Electronics!`;
  const descriptionsByTone: Record<ShareDescriptionTone, string> = {
    spec: generateProductShareDescription({ ...product, title, price, sku }, undefined, 'spec'),
    deal: generateProductShareDescription({ ...product, title, price, sku }, undefined, 'deal'),
    concise: generateProductShareDescription({ ...product, title, price, sku }, undefined, 'concise'),
  };
  const generatedDescription = descriptionsByTone[tone] || descriptionsByTone.spec;
  const socialUrls = buildSocialShareUrls(url, generatedDescription);

  return {
    url,
    title,
    text,
    generatedDescription,
    descriptionsByTone,
    socialUrls,
    sku,
    price,
    qrPayload: url,
  };
}

export const VOLTBOX_QR_THEMES = {
  gold: {
    dark: '#ffd23f', // Voltbox Electric Gold
    light: '#0a0e17', // Voltbox Cyber Chassis
    name: 'Voltbox Gold',
    accent: '#ffd23f',
  },
  amber: {
    dark: '#f59e0b', // Electric Amber
    light: '#0a0e17', // Deep Charcoal
    name: 'Electric Amber',
    accent: '#f59e0b',
  },
  cyber: {
    dark: '#2dd4bf', // Quantum Cyan
    light: '#080c14',
    name: 'Quantum Cyan',
    accent: '#2dd4bf',
  },
  classic: {
    dark: '#0f172a',
    light: '#ffffff',
    name: 'Monochrome Paper',
    accent: '#64748b',
  },
  invertedGold: {
    dark: '#0a0e17',
    light: '#ffd23f',
    name: 'Gold Inverted',
    accent: '#ffd23f',
  },
} as const;

export type VoltboxQrThemeKey = keyof typeof VOLTBOX_QR_THEMES;

export function resolveQrColors(options?: {
  theme?: VoltboxQrThemeKey | string;
  colorDark?: string;
  colorLight?: string;
}): { dark: string; light: string; themeName: string } {
  const selectedTheme =
    (options?.theme && (VOLTBOX_QR_THEMES as Record<string, { dark: string; light: string; name: string }>)[options.theme]) ||
    VOLTBOX_QR_THEMES.gold;
  return {
    dark: options?.colorDark || selectedTheme.dark,
    light: options?.colorLight || selectedTheme.light,
    themeName: selectedTheme.name,
  };
}

export function parseScannedProductPayload(
  rawText: string,
  catalog?: Array<{ id: number; sku?: string; title?: string }>
): { productId: number | null; rawText: string; matchedBy: string | null } {
  if (!rawText || typeof rawText !== 'string') {
    return { productId: null, rawText: '', matchedBy: null };
  }
  const clean = rawText.trim();

  // 1. URL Query parameter ?product=19 or &product=19
  const queryMatch = clean.match(/[?&]product=(\d+)/i);
  if (queryMatch) {
    return { productId: Number(queryMatch[1]), rawText: clean, matchedBy: 'query_param' };
  }

  // 2. URL Path /product/19
  const pathMatch = clean.match(/\/product\/(\d+)/i);
  if (pathMatch) {
    return { productId: Number(pathMatch[1]), rawText: clean, matchedBy: 'path' };
  }

  // 3. Hash #product=19 or #product-19
  const hashMatch = clean.match(/#product[=-](\d+)/i);
  if (hashMatch) {
    return { productId: Number(hashMatch[1]), rawText: clean, matchedBy: 'hash' };
  }

  // 4. Match by exact SKU in catalog
  if (Array.isArray(catalog) && catalog.length > 0) {
    const skuClean = clean.toUpperCase();
    const foundBySku = catalog.find((p) => p.sku && p.sku.toUpperCase() === skuClean);
    if (foundBySku) {
      return { productId: foundBySku.id, rawText: clean, matchedBy: 'catalog_sku' };
    }
  }

  // 5. Voltbox SKU pattern VB-XXX-019
  const skuPatternMatch = clean.match(/VB-[A-Z]{3}-(\d+)/i);
  if (skuPatternMatch) {
    return { productId: Number(skuPatternMatch[1]), rawText: clean, matchedBy: 'sku_pattern' };
  }

  // 6. VOLTBOX:19 or VB:19 prefix
  const voltboxPrefixMatch = clean.match(/^(?:VOLTBOX|VB):(\d+)$/i);
  if (voltboxPrefixMatch) {
    return { productId: Number(voltboxPrefixMatch[1]), rawText: clean, matchedBy: 'voltbox_prefix' };
  }

  // 7. Plain numeric ID (e.g. 19)
  if (/^\d+$/.test(clean)) {
    return { productId: Number(clean), rawText: clean, matchedBy: 'numeric_id' };
  }

  return { productId: null, rawText: clean, matchedBy: null };
}

export async function generateProductQrSvgAsync(
  url: string,
  options?: { margin?: number; colorDark?: string; colorLight?: string; theme?: VoltboxQrThemeKey | string }
): Promise<string> {
  const colors = resolveQrColors(options);
  return QRCode.toString(url, {
    type: 'svg',
    margin: options && typeof options.margin === 'number' ? options.margin : 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: colors.dark,
      light: colors.light,
    },
  });
}

export async function generateProductQrDataUrl(
  url: string,
  options?: { margin?: number; width?: number; colorDark?: string; colorLight?: string; theme?: VoltboxQrThemeKey | string }
): Promise<string> {
  const colors = resolveQrColors(options);
  return QRCode.toDataURL(url, {
    margin: options && typeof options.margin === 'number' ? options.margin : 1,
    width: options && typeof options.width === 'number' ? options.width : 280,
    errorCorrectionLevel: 'M',
    color: {
      dark: colors.dark,
      light: colors.light,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════
// MOMENTUM-BASED DRAWER SCROLLING KINEMATICS & RUBBER-BAND PHYSICS
// ═══════════════════════════════════════════════════════════════════

export interface TouchVelocitySample {
  y: number;
  t: number;
}

export interface MomentumScrollState {
  scrollTop: number;
  velocity: number;
  overscroll: number;
  maxScroll: number;
  friction?: number;
  springTension?: number;
  springDamping?: number;
}

export interface MomentumStepResult {
  scrollTop: number;
  velocity: number;
  overscroll: number;
  active: boolean;
  phase: 'coasting' | 'overscroll' | 'springback' | 'idle';
}

export interface ScrollThumbMetrics {
  scrollable: boolean;
  progress: number;
  thumbHeightPct: number;
  thumbTopPct: number;
  overscrollPx: number;
}

/**
 * Computes initial momentum scroll velocity (in px per 16.67ms frame)
 * from recent touch/pointer movement samples.
 * Positive returned velocity means scrolling DOWN (finger dragged UP, i.e. y decreased).
 */
export function computeTouchVelocity(
  samples: TouchVelocitySample[],
  maxVelocity: number = 72
): number {
  if (!Array.isArray(samples) || samples.length < 2) {
    return 0;
  }

  const last = samples[samples.length - 1];
  // Consider samples within the last 130ms window for responsive flick detection
  let anchor = samples[0];
  for (let i = samples.length - 2; i >= 0; i--) {
    const dt = last.t - samples[i].t;
    if (dt >= 16 && dt <= 130) {
      anchor = samples[i];
      if (dt >= 45) break;
    }
  }

  const totalDt = last.t - anchor.t;
  if (totalDt < 0 || totalDt > 200) {
    return 0;
  }

  // Finger moving UP (last.y < anchor.y) scrolls content DOWN (positive scrollTop velocity)
  const deltaY = anchor.y - last.y;
  if (totalDt < 12 && Math.abs(deltaY) < 8) {
    return 0;
  }

  const effectiveDt = Math.max(24, totalDt);
  const pxPerMs = deltaY / effectiveDt;
  const pxPerFrame = pxPerMs * 16.667;

  if (Math.abs(pxPerFrame) < 0.45) {
    return 0;
  }

  const cap = Math.max(8, Math.abs(maxVelocity));
  return Math.round(Math.max(-cap, Math.min(cap, pxPerFrame)) * 100) / 100;
}

/**
 * Computes direct touch/pointer drag position with hyperbolic rubber-band
 * resistance when pulling past the top (0) or bottom (maxScroll) bounds.
 * @param deltaY Finger movement delta (positive = finger moved down, scrolling up)
 */
export function computeRubberBandDrag(
  deltaY: number,
  currentScrollTop: number,
  currentOverscroll: number,
  maxScroll: number,
  maxOverscroll: number = 84
): { scrollTop: number; overscroll: number } {
  const safeMaxScroll = Math.max(0, Number(maxScroll) || 0);
  const scrollDelta = -deltaY; // Finger down (+deltaY) reduces scrollTop

  // Reconstruct virtual unconstrained offset from current scrollTop + overscroll
  let virtualOffset = currentScrollTop + currentOverscroll + scrollDelta;

  if (virtualOffset >= 0 && virtualOffset <= safeMaxScroll) {
    return {
      scrollTop: Math.round(virtualOffset * 100) / 100,
      overscroll: 0,
    };
  }

  const excess = virtualOffset < 0 ? virtualOffset : virtualOffset - safeMaxScroll;
  const clampedScrollTop = virtualOffset < 0 ? 0 : safeMaxScroll;
  const absExcess = Math.abs(excess);
  const limit = Math.max(24, maxOverscroll);
  const damped = (1 - 1 / ((absExcess * 0.52) / limit + 1)) * limit;
  const overscroll = Math.round(Math.sign(excess) * damped * 100) / 100;

  return {
    scrollTop: clampedScrollTop,
    overscroll,
  };
}

/**
 * Steps the momentum scrolling simulation by one animation frame (default 16.67ms),
 * combining exponential friction decay with spring-damper overscroll recovery.
 */
export function stepMomentumScroll(
  state: MomentumScrollState,
  dtMs: number = 16.667
): MomentumStepResult {
  const maxScroll = Math.max(0, Number(state.maxScroll) || 0);
  const friction = typeof state.friction === 'number' ? state.friction : 0.945;
  const springTension = typeof state.springTension === 'number' ? state.springTension : 0.22;
  const springDamping = typeof state.springDamping === 'number' ? state.springDamping : 0.68;
  const dtRatio = Math.max(0.25, Math.min(2.5, (Number(dtMs) || 16.667) / 16.667));

  let scrollTop = Math.max(0, Math.min(maxScroll, Number(state.scrollTop) || 0));
  let velocity = Number(state.velocity) || 0;
  let overscroll = Number(state.overscroll) || 0;

  // Case 1: Currently in rubber-band overscroll
  if (Math.abs(overscroll) > 0.01) {
    // If velocity is still pushing further into overscroll, damp it heavily
    if (overscroll * velocity > 0) {
      overscroll += velocity * 0.32 * dtRatio;
      velocity *= Math.pow(0.55, dtRatio);
      overscroll = Math.max(-90, Math.min(90, overscroll));
    } else {
      velocity = 0;
    }

    // Spring restoring pull toward 0
    overscroll *= Math.pow(1 - springTension, dtRatio);
    velocity *= Math.pow(springDamping, dtRatio);

    if (Math.abs(overscroll) < 0.45 && Math.abs(velocity) < 0.35) {
      return {
        scrollTop,
        velocity: 0,
        overscroll: 0,
        active: false,
        phase: 'idle',
      };
    }

    return {
      scrollTop: Math.round(scrollTop * 100) / 100,
      velocity: Math.round(velocity * 100) / 100,
      overscroll: Math.round(overscroll * 100) / 100,
      active: true,
      phase: Math.abs(velocity) > 0.8 ? 'overscroll' : 'springback',
    };
  }

  // Case 2: Standard inertial coasting within bounds
  velocity *= Math.pow(friction, dtRatio);
  const nextRaw = scrollTop + velocity * dtRatio;

  if (nextRaw < 0) {
    const excess = nextRaw;
    scrollTop = 0;
    overscroll = Math.max(-72, excess * 0.38);
    velocity *= 0.45;
    return {
      scrollTop: 0,
      velocity: Math.round(velocity * 100) / 100,
      overscroll: Math.round(overscroll * 100) / 100,
      active: true,
      phase: 'overscroll',
    };
  }

  if (nextRaw > maxScroll) {
    const excess = nextRaw - maxScroll;
    scrollTop = maxScroll;
    overscroll = Math.min(72, excess * 0.38);
    velocity *= 0.45;
    return {
      scrollTop: maxScroll,
      velocity: Math.round(velocity * 100) / 100,
      overscroll: Math.round(overscroll * 100) / 100,
      active: true,
      phase: 'overscroll',
    };
  }

  scrollTop = nextRaw;

  if (Math.abs(velocity) < 0.22) {
    return {
      scrollTop: Math.round(scrollTop * 100) / 100,
      velocity: 0,
      overscroll: 0,
      active: false,
      phase: 'idle',
    };
  }

  return {
    scrollTop: Math.round(scrollTop * 100) / 100,
    velocity: Math.round(velocity * 100) / 100,
    overscroll: 0,
    active: true,
    phase: 'coasting',
  };
}

/**
 * Computes custom scrollbar thumb height and position percentages,
 * including rubber-band thumb compression during overscroll.
 */
export function computeScrollThumbMetrics(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
  overscroll: number = 0
): ScrollThumbMetrics {
  const safeClient = Math.max(1, Number(clientHeight) || 1);
  const safeScroll = Math.max(safeClient, Number(scrollHeight) || safeClient);
  const maxScroll = Math.max(0, safeScroll - safeClient);
  const scrollable = maxScroll > 2;

  if (!scrollable) {
    return {
      scrollable: false,
      progress: 0,
      thumbHeightPct: 100,
      thumbTopPct: 0,
      overscrollPx: 0,
    };
  }

  const clampedTop = Math.max(0, Math.min(maxScroll, Number(scrollTop) || 0));
  const progress = Math.round((clampedTop / maxScroll) * 1000) / 1000;

  const rawThumbPct = (safeClient / safeScroll) * 100;
  const baseThumbHeightPct = Math.max(12, Math.min(82, rawThumbPct));

  // Compress thumb slightly when overscrolling at top or bottom edge
  const absOver = Math.min(80, Math.abs(Number(overscroll) || 0));
  const compressionPct = (absOver / 80) * Math.min(8, baseThumbHeightPct * 0.35);
  const thumbHeightPct = Math.round(Math.max(8, baseThumbHeightPct - compressionPct) * 100) / 100;

  const availableTrackPct = 100 - thumbHeightPct;
  let thumbTopPct = progress * availableTrackPct;
  if (overscroll < 0) {
    thumbTopPct = 0;
  } else if (overscroll > 0) {
    thumbTopPct = availableTrackPct;
  }

  return {
    scrollable: true,
    progress,
    thumbHeightPct,
    thumbTopPct: Math.round(thumbTopPct * 100) / 100,
    overscrollPx: Math.round((Number(overscroll) || 0) * 10) / 10,
  };
}

/**
 * Resolves the real product photo URL for a cart item or receipt order line,
 * upgrading category icon fallbacks (/images/categories/*.svg) to the catalog's real image.
 */
export function resolveProductImageUrl(
  item: {
    id?: number;
    productId?: number;
    title?: string;
    category?: string;
    image?: string;
  },
  catalog: Array<{
    id: number;
    title?: string;
    category?: string;
    image?: string;
  }> = []
): string {
  const isRealImage = (url?: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed) return false;
    if (trimmed.includes('/images/categories/')) return false;
    return trimmed.startsWith('http') || trimmed.startsWith('/');
  };

  if (isRealImage(item?.image)) {
    return item.image!.trim();
  }

  const targetId = Number(item?.productId ?? item?.id ?? 0);
  if (targetId > 0 && Array.isArray(catalog)) {
    const matchedById = catalog.find((p) => Number(p.id) === targetId);
    if (matchedById && isRealImage(matchedById.image)) {
      return matchedById.image!.trim();
    }
  }

  if (item?.title && Array.isArray(catalog)) {
    const lowerTitle = item.title.trim().toLowerCase();
    const matchedByTitle = catalog.find(
      (p) => (p.title || '').trim().toLowerCase() === lowerTitle
    );
    if (matchedByTitle && isRealImage(matchedByTitle.image)) {
      return matchedByTitle.image!.trim();
    }
  }

  const cat = (item?.category || 'components').trim() || 'components';
  return `/images/categories/${cat}.svg`;
}

export type PaymentMethodType = 'upi' | 'credit_card' | 'debit_card' | 'netbanking' | 'emi';

export interface PaymentMethodInput {
  method?: string;
  upiApp?: string;
  upiId?: string;
  upiMode?: 'vpa' | 'qr';
  cardNumber?: string;
  cardNetwork?: string;
  bankName?: string;
  emiMonths?: number;
}

/**
 * Detects card brand/network from card number prefix or explicit selection.
 */
export function detectCardNetwork(cardNumber?: string, explicitNetwork?: string): string {
  if (explicitNetwork && explicitNetwork.trim()) {
    return explicitNetwork.trim();
  }
  const digits = String(cardNumber || '').replace(/\D/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^(60|65|81|82|508)/.test(digits)) return 'RuPay';
  return 'Visa';
}

/**
 * Formats a human-readable payment method summary for orders and thermal receipts.
 */
export function formatPaymentMethodSummary(input: PaymentMethodInput = {}): string {
  const rawMethod = String(input.method || 'credit_card').trim().toLowerCase();

  if (rawMethod === 'upi') {
    const app = (input.upiApp || 'GPay').trim();
    if (input.upiMode === 'qr') {
      return `UPI QR (${app})`;
    }
    const vpa = (input.upiId || 'voltbox@okaxis').trim();
    return `UPI (${app} · ${vpa})`;
  }

  if (rawMethod === 'debit_card' || rawMethod === 'debit') {
    const digits = String(input.cardNumber || '').replace(/\D/g, '');
    const last4 = digits.length >= 4 ? digits.slice(-4) : '8821';
    const net = detectCardNetwork(input.cardNumber, input.cardNetwork || 'RuPay');
    return `Debit Card (${net} •••• ${last4})`;
  }

  if (rawMethod === 'netbanking' || rawMethod === 'wallet') {
    const bank = (input.bankName || 'HDFC Bank').trim();
    return `NetBanking (${bank})`;
  }

  if (rawMethod === 'emi' || rawMethod === 'pay_later') {
    const months = Number(input.emiMonths) || 3;
    return `No-Cost EMI (${months}M Plan)`;
  }

  // Default: Credit Card
  const digits = String(input.cardNumber || '').replace(/\D/g, '');
  const last4 = digits.length >= 4 ? digits.slice(-4) : '4242';
  const net = detectCardNetwork(input.cardNumber, input.cardNetwork);
  return `Credit Card (${net} •••• ${last4})`;
}

export type UpiAppId = 'GPay' | 'PhonePe' | 'Paytm' | 'BHIM';

export interface UpiAppProfile {
  id: UpiAppId;
  label: string;
  merchantVpa: string;
  defaultPayerVpa: string;
  accentColor: string;
  qrTheme: VoltboxQrThemeKey;
}

export const UPI_APP_PROFILES: Record<UpiAppId, UpiAppProfile> = {
  GPay: {
    id: 'GPay',
    label: 'Google Pay',
    merchantVpa: 'voltbox.gpay@okaxis',
    defaultPayerVpa: 'harish@okaxis',
    accentColor: '#3b82f6',
    qrTheme: 'cyber',
  },
  PhonePe: {
    id: 'PhonePe',
    label: 'PhonePe',
    merchantVpa: 'voltbox.phonepe@ybl',
    defaultPayerVpa: 'harish@ybl',
    accentColor: '#a855f7',
    qrTheme: 'gold',
  },
  Paytm: {
    id: 'Paytm',
    label: 'Paytm',
    merchantVpa: 'voltbox.paytm@paytm',
    defaultPayerVpa: 'harish@paytm',
    accentColor: '#06b6d4',
    qrTheme: 'cyber',
  },
  BHIM: {
    id: 'BHIM',
    label: 'BHIM UPI',
    merchantVpa: 'voltbox.bhim@upi',
    defaultPayerVpa: 'harish@upi',
    accentColor: '#f97316',
    qrTheme: 'amber',
  },
};

export function normalizeUpiAppId(rawApp?: string | null): UpiAppId {
  const clean = String(rawApp || 'GPay').trim().toLowerCase();
  if (clean.includes('phonepe') || clean === 'ybl') return 'PhonePe';
  if (clean.includes('paytm')) return 'Paytm';
  if (clean.includes('bhim')) return 'BHIM';
  return 'GPay';
}

export interface UpiPaymentRequestPayload {
  appId: UpiAppId;
  appLabel: string;
  merchantVpa: string;
  payerVpa: string;
  orderRef: string;
  amountUsd: number;
  amountInr: number;
  upiUri: string;
  paymentMethodSummary: string;
  workflowSteps: [string, string, string];
}

/**
 * Builds the UPI deep-link QR payload and simulated payment request workflow metadata
 * for Google Pay, PhonePe, Paytm, and BHIM UPI.
 */
export function buildUpiPaymentRequestPayload(input: {
  app?: string | null;
  amountUsd: number;
  orderRef?: string | null;
  payerVpa?: string | null;
}): UpiPaymentRequestPayload {
  const appId = normalizeUpiAppId(input.app);
  const profile = UPI_APP_PROFILES[appId];
  const amountUsd = roundMoney(Math.max(0, Number(input.amountUsd) || 0));
  const amountInr = roundMoney(amountUsd * 84);
  const orderRef = (input.orderRef || 'VB-UPI-REQ').trim() || 'VB-UPI-REQ';
  const payerVpa = (input.payerVpa || profile.defaultPayerVpa).trim() || profile.defaultPayerVpa;

  const params = [
    `pa=${encodeURIComponent(profile.merchantVpa)}`,
    `pn=${encodeURIComponent('Voltbox Electronics')}`,
    `tr=${encodeURIComponent(orderRef)}`,
    `am=${amountUsd.toFixed(2)}`,
    `cu=USD`,
    `tn=${encodeURIComponent(`Voltbox Order ${orderRef} via ${profile.label}`)}`,
  ].join('&');

  const upiUri = `upi://pay?${params}`;
  const paymentMethodSummary = formatPaymentMethodSummary({
    method: 'upi',
    upiApp: appId,
    upiMode: 'qr',
    upiId: payerVpa,
  });

  return {
    appId,
    appLabel: profile.label,
    merchantVpa: profile.merchantVpa,
    payerVpa,
    orderRef,
    amountUsd,
    amountInr,
    upiUri,
    paymentMethodSummary,
    workflowSteps: [
      `1. Dynamic ${profile.label} QR & Collect Intent Generated`,
      `2. Waiting for approval in ${profile.label} (${payerVpa})`,
      `3. NPCI UPI Verified · Instant Settlement ($${amountUsd.toFixed(2)})`,
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// 12. SIDE-BY-SIDE PRODUCT COMPARISON LOGIC
// ─────────────────────────────────────────────────────────────

export type SpecIndicatorStatus = 'better' | 'worse' | 'neutral';

export interface ComparisonProductItem {
  id: number;
  sku: string;
  title: string;
  price: number;
  category: string;
  groupLabel: string;
  image: string;
  stock: number;
  lowStock: boolean;
  specs: ProductSpecs;
}

export interface ComparisonMetricRow {
  key: string;
  label: string;
  category: 'pricing' | 'hardware' | 'power' | 'support' | 'stock';
  values: Record<number, string | number>;
  hasDifference: boolean;
  bestProductId?: number;
  worstProductId?: number;
  bestProductIds?: number[];
  worstProductIds?: number[];
  indicators?: Record<number, SpecIndicatorStatus>;
  indicatorLabels?: Record<number, string>;
  highlightNote?: string;
}

export interface ProductComparisonResult {
  productIds: number[];
  count: number;
  products: ComparisonProductItem[];
  hasIdenticalCategory: boolean;
  commonCategory: string | null;
  lowestPriceProductId: number;
  highestPriceProductId: number;
  priceSpread: number;
  metrics: ComparisonMetricRow[];
  summary: string;
}

export function parsePowerWatts(powerDraw: string): number {
  const text = String(powerDraw || '').trim();
  const wattMatch = text.match(/(\d+(?:\.\d+)?)\s*W\b/i);
  if (wattMatch) {
    return parseFloat(wattMatch[1]);
  }
  const mahMatch = text.match(/([\d,]+)\s*mAh/i);
  if (mahMatch) {
    return 8;
  }
  const hourMatch = text.match(/(\d+)\s*-?\s*Hour/i);
  if (hourMatch) {
    return 10;
  }
  if (/24-Pin\s*ATX/i.test(text)) {
    return 45;
  }
  return 65;
}

export function scoreInterfaceBandwidth(interfaceSpec: string): number {
  const text = String(interfaceSpec || '').toLowerCase();
  if (text.includes('pcie 5.0') || text.includes('gen5')) return 100;
  if (text.includes('7,450 mb/s') || text.includes('nvme 2.0') || text.includes('pcie gen4')) return 92;
  if (text.includes('ddr5-6400') || text.includes('socket am5')) return 88;
  if (text.includes('hdmi 2.1') || text.includes('wi-fi 7')) return 84;
  if (text.includes('pcie 4.0')) return 78;
  if (text.includes('bluetooth 5.3')) return 72;
  if (text.includes('bluetooth 5.1')) return 66;
  if (text.includes('sata iii') || text.includes('6.0 gb/s')) return 50;
  return 70;
}

export function scoreArchitectureTier(architecture: string): number {
  const text = String(architecture || '').toLowerCase();
  if (text.includes('blackwell') || text.includes('gddr7')) return 98;
  if (text.includes('zen 5') || text.includes('16-core')) return 95;
  if (text.includes('duet rail vrm') || text.includes('server pcb')) return 90;
  if (text.includes('rdna 3.5') || text.includes('ray-tracing')) return 88;
  if (text.includes('3d tlc nand') || text.includes('dram cache')) return 85;
  if (text.includes('neodymium') || text.includes('dsp')) return 80;
  if (text.includes('dual-actuator') || text.includes('haptic')) return 76;
  if (text.includes('7200 rpm') || text.includes('cmr')) return 62;
  return 74;
}

export function parseWarrantyScore(warranty: string): number {
  const text = String(warranty || '');
  const yearMatch = text.match(/(\d+)\s*-?\s*Year/i);
  let score = yearMatch ? parseInt(yearMatch[1], 10) * 10 : 20;
  if (/bench verified|endurance|bios protection/i.test(text)) {
    score += 3;
  }
  return score;
}

export function evaluateSpecRowIndicators(
  scoresByProductId: Record<number, number>,
  higherIsBetter: boolean,
  betterLabel = 'Better',
  worseLabel = 'Worse'
): {
  indicators: Record<number, SpecIndicatorStatus>;
  indicatorLabels: Record<number, string>;
  bestProductId?: number;
  worstProductId?: number;
  bestProductIds: number[];
  worstProductIds: number[];
} {
  const entries = Object.entries(scoresByProductId).map(([k, v]) => [Number(k), Number(v)] as [number, number]);
  const indicators: Record<number, SpecIndicatorStatus> = {};
  const indicatorLabels: Record<number, string> = {};
  for (const [id] of entries) {
    indicators[id] = 'neutral';
    indicatorLabels[id] = '';
  }

  if (entries.length === 0) {
    return { indicators, indicatorLabels, bestProductIds: [], worstProductIds: [] };
  }

  let minVal = entries[0][1];
  let maxVal = entries[0][1];
  for (const [, val] of entries) {
    if (val < minVal) minVal = val;
    if (val > maxVal) maxVal = val;
  }

  const targetBestVal = higherIsBetter ? maxVal : minVal;
  const targetWorstVal = higherIsBetter ? minVal : maxVal;

  const bestProductIds = entries.filter(([, val]) => val === targetBestVal).map(([id]) => id);
  const worstProductIds = minVal < maxVal ? entries.filter(([, val]) => val === targetWorstVal).map(([id]) => id) : [];

  if (entries.length >= 2 && minVal < maxVal) {
    for (const id of bestProductIds) {
      indicators[id] = 'better';
      indicatorLabels[id] = betterLabel;
    }
    for (const id of worstProductIds) {
      indicators[id] = 'worse';
      indicatorLabels[id] = worseLabel;
    }
  }

  return {
    indicators,
    indicatorLabels,
    bestProductId: bestProductIds[0],
    worstProductId: worstProductIds[0],
    bestProductIds,
    worstProductIds,
  };
}

export function buildProductComparison(
  rawProducts: Array<{
    id: number;
    title?: string;
    price: number;
    category?: string;
    stock?: number;
    quantity?: number;
    description?: string;
    image?: string;
  }>,
  allCatalogProducts: Array<{ id: number; title?: string; category?: string; image?: string }> = []
): ProductComparisonResult {
  if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
    return {
      productIds: [],
      count: 0,
      products: [],
      hasIdenticalCategory: true,
      commonCategory: null,
      lowestPriceProductId: 0,
      highestPriceProductId: 0,
      priceSpread: 0,
      metrics: [],
      summary: 'No products selected for comparison.',
    };
  }

  const catalogContext = allCatalogProducts.length > 0 ? allCatalogProducts : rawProducts;

  const enrichedProducts: ComparisonProductItem[] = rawProducts.map((p) => {
    const specs = getProductSpecs(p);
    const resolvedStock = getProductQuantity(p);
    const resolvedImg = resolveProductImageUrl(p, catalogContext);
    return {
      id: p.id,
      sku: specs.sku,
      title: p.title || 'Component',
      price: roundMoney(p.price),
      category: p.category || 'general',
      groupLabel: specs.groupLabel,
      image: resolvedImg,
      stock: resolvedStock,
      lowStock: resolvedStock <= 3,
      specs,
    };
  });

  const productIds = enrichedProducts.map((p) => p.id);
  const categories = enrichedProducts.map((p) => p.category.toLowerCase());
  const hasIdenticalCategory = categories.every((cat) => cat === categories[0]);
  const commonCategory = hasIdenticalCategory ? categories[0] : null;

  // Pricing analysis
  let lowestPriceItem = enrichedProducts[0];
  let highestPriceItem = enrichedProducts[0];

  for (const item of enrichedProducts) {
    if (item.price < lowestPriceItem.price) lowestPriceItem = item;
    if (item.price > highestPriceItem.price) highestPriceItem = item;
  }

  const priceSpread = roundMoney(highestPriceItem.price - lowestPriceItem.price);

  // Stock analysis
  let highestStockItem = enrichedProducts[0];
  for (const item of enrichedProducts) {
    if (item.stock > highestStockItem.stock) highestStockItem = item;
  }

  const priceEval = evaluateSpecRowIndicators(
    Object.fromEntries(enrichedProducts.map((p) => [p.id, p.price])),
    false,
    'Best Price',
    'Highest Cost'
  );
  const archEval = evaluateSpecRowIndicators(
    Object.fromEntries(enrichedProducts.map((p) => [p.id, scoreArchitectureTier(p.specs.architecture)])),
    true,
    'Top Silicon Tier',
    'Lower Tier'
  );
  const interfaceEval = evaluateSpecRowIndicators(
    Object.fromEntries(enrichedProducts.map((p) => [p.id, scoreInterfaceBandwidth(p.specs.interfaceSpec)])),
    true,
    'Faster Bus',
    'Slower Bus'
  );
  const powerEval = evaluateSpecRowIndicators(
    Object.fromEntries(enrichedProducts.map((p) => [p.id, parsePowerWatts(p.specs.powerDraw)])),
    false,
    'Best Efficiency',
    'High Power Draw'
  );
  const historyEval = evaluateSpecRowIndicators(
    Object.fromEntries(enrichedProducts.map((p) => [p.id, p.specs.avgPrice])),
    false,
    'Lowest 6M Avg',
    'Highest 6M Avg'
  );
  const stockEval = evaluateSpecRowIndicators(
    Object.fromEntries(enrichedProducts.map((p) => [p.id, p.stock])),
    true,
    'Best Availability',
    'Lowest Stock'
  );
  const warrantyEval = evaluateSpecRowIndicators(
    Object.fromEntries(enrichedProducts.map((p) => [p.id, parseWarrantyScore(p.specs.warranty)])),
    true,
    'Longest Coverage',
    'Shorter Coverage'
  );

  // Construct comparative rows
  const metrics: ComparisonMetricRow[] = [
    {
      key: 'price',
      label: 'Retail Price',
      category: 'pricing',
      values: Object.fromEntries(enrichedProducts.map((p) => [p.id, `$${p.price.toFixed(2)}`])),
      hasDifference: enrichedProducts.some((p) => p.price !== enrichedProducts[0].price),
      bestProductId: lowestPriceItem.id,
      worstProductId: priceEval.worstProductId,
      bestProductIds: priceEval.bestProductIds,
      worstProductIds: priceEval.worstProductIds,
      indicators: priceEval.indicators,
      indicatorLabels: priceEval.indicatorLabels,
      highlightNote: priceSpread > 0 ? `$${priceSpread.toFixed(2)} price difference` : 'Identical pricing',
    },
    {
      key: 'componentGroup',
      label: 'Component Class',
      category: 'hardware',
      values: Object.fromEntries(enrichedProducts.map((p) => [p.id, p.groupLabel])),
      hasDifference: enrichedProducts.some((p) => p.groupLabel !== enrichedProducts[0].groupLabel),
      indicators: Object.fromEntries(enrichedProducts.map((p) => [p.id, 'neutral' as SpecIndicatorStatus])),
      indicatorLabels: Object.fromEntries(enrichedProducts.map((p) => [p.id, ''])),
    },
    {
      key: 'architecture',
      label: 'Silicon Architecture',
      category: 'hardware',
      values: Object.fromEntries(enrichedProducts.map((p) => [p.id, p.specs.architecture])),
      hasDifference: enrichedProducts.some((p) => p.specs.architecture !== enrichedProducts[0].specs.architecture),
      bestProductId: archEval.bestProductId,
      worstProductId: archEval.worstProductId,
      bestProductIds: archEval.bestProductIds,
      worstProductIds: archEval.worstProductIds,
      indicators: archEval.indicators,
      indicatorLabels: archEval.indicatorLabels,
    },
    {
      key: 'interfaceSpec',
      label: 'Bus & Interface',
      category: 'hardware',
      values: Object.fromEntries(enrichedProducts.map((p) => [p.id, p.specs.interfaceSpec])),
      hasDifference: enrichedProducts.some((p) => p.specs.interfaceSpec !== enrichedProducts[0].specs.interfaceSpec),
      bestProductId: interfaceEval.bestProductId,
      worstProductId: interfaceEval.worstProductId,
      bestProductIds: interfaceEval.bestProductIds,
      worstProductIds: interfaceEval.worstProductIds,
      indicators: interfaceEval.indicators,
      indicatorLabels: interfaceEval.indicatorLabels,
    },
    {
      key: 'powerDraw',
      label: 'Thermal TDP & Power',
      category: 'power',
      values: Object.fromEntries(enrichedProducts.map((p) => [p.id, p.specs.powerDraw])),
      hasDifference: enrichedProducts.some((p) => p.specs.powerDraw !== enrichedProducts[0].specs.powerDraw),
      bestProductId: powerEval.bestProductId,
      worstProductId: powerEval.worstProductId,
      bestProductIds: powerEval.bestProductIds,
      worstProductIds: powerEval.worstProductIds,
      indicators: powerEval.indicators,
      indicatorLabels: powerEval.indicatorLabels,
    },
    {
      key: 'priceHistory',
      label: '6-Month Low → High',
      category: 'pricing',
      values: Object.fromEntries(
        enrichedProducts.map((p) => [
          p.id,
          `$${p.specs.lowestPrice.toFixed(0)} – $${p.specs.highestPrice.toFixed(0)} (Avg: $${p.specs.avgPrice.toFixed(0)})`,
        ])
      ),
      hasDifference: enrichedProducts.some(
        (p) => p.specs.lowestPrice !== enrichedProducts[0].specs.lowestPrice || p.specs.highestPrice !== enrichedProducts[0].specs.highestPrice
      ),
      bestProductId: historyEval.bestProductId,
      worstProductId: historyEval.worstProductId,
      bestProductIds: historyEval.bestProductIds,
      worstProductIds: historyEval.worstProductIds,
      indicators: historyEval.indicators,
      indicatorLabels: historyEval.indicatorLabels,
    },
    {
      key: 'stockStatus',
      label: 'Warehouse Stock',
      category: 'stock',
      values: Object.fromEntries(
        enrichedProducts.map((p) => [
          p.id,
          p.stock > 0 ? `${p.stock} units available${p.lowStock ? ' (Low Stock!)' : ''}` : 'Out of stock',
        ])
      ),
      hasDifference: enrichedProducts.some((p) => p.stock !== enrichedProducts[0].stock),
      bestProductId: highestStockItem.id,
      worstProductId: stockEval.worstProductId,
      bestProductIds: stockEval.bestProductIds,
      worstProductIds: stockEval.worstProductIds,
      indicators: stockEval.indicators,
      indicatorLabels: stockEval.indicatorLabels,
    },
    {
      key: 'warranty',
      label: 'Warranty & Testing',
      category: 'support',
      values: Object.fromEntries(enrichedProducts.map((p) => [p.id, p.specs.warranty])),
      hasDifference: enrichedProducts.some((p) => p.specs.warranty !== enrichedProducts[0].specs.warranty),
      bestProductId: warrantyEval.bestProductId,
      worstProductId: warrantyEval.worstProductId,
      bestProductIds: warrantyEval.bestProductIds,
      worstProductIds: warrantyEval.worstProductIds,
      indicators: warrantyEval.indicators,
      indicatorLabels: warrantyEval.indicatorLabels,
    },
  ];

  const summary =
    enrichedProducts.length === 1
      ? `Selected ${enrichedProducts[0].title} ($${enrichedProducts[0].price.toFixed(2)}). Add more items to compare side-by-side.`
      : `Comparing ${enrichedProducts.length} components. Lowest price is ${lowestPriceItem.title} at $${lowestPriceItem.price.toFixed(
          2
        )}, with a price spread of $${priceSpread.toFixed(2)}.`;

  return {
    productIds,
    count: enrichedProducts.length,
    products: enrichedProducts,
    hasIdenticalCategory,
    commonCategory,
    lowestPriceProductId: lowestPriceItem.id,
    highestPriceProductId: highestPriceItem.id,
    priceSpread,
    metrics,
    summary,
  };
}

// ═══════════════════════════════════════════════════════════════════
// BUCKET4J TOKEN-BUCKET IP RATE LIMITER LOGIC
// ═══════════════════════════════════════════════════════════════════

export interface ConsumptionProbeResult {
  consumed: boolean;
  remainingTokens: number;
  limitCapacity: number;
  retryAfterSeconds: number;
  clientIp: string;
  tier: 'general' | 'sensitive';
}

interface TokenBucketState {
  tokens: number;
  lastRefillMs: number;
}

export class IpRateLimiter {
  private readonly buckets = new Map<string, TokenBucketState>();
  private readonly generalCapacity: number;
  private readonly sensitiveCapacity: number;
  private readonly refillWindowMs: number;

  constructor(options?: {
    generalCapacity?: number;
    sensitiveCapacity?: number;
    refillWindowMs?: number;
  }) {
    this.generalCapacity = options?.generalCapacity ?? 120;
    this.sensitiveCapacity = options?.sensitiveCapacity ?? 30;
    this.refillWindowMs = options?.refillWindowMs ?? 60_000;
  }

  public normalizeIp(rawIp?: string | null): string {
    if (!rawIp || typeof rawIp !== 'string' || !rawIp.trim()) {
      return '127.0.0.1';
    }
    const first = rawIp.split(',')[0].trim();
    const cleaned = first.startsWith('::ffff:') ? first.slice(7) : first;
    if (cleaned === '::1' || cleaned === '0:0:0:0:0:0:0:1') {
      return '127.0.0.1';
    }
    return cleaned || '127.0.0.1';
  }

  public isSensitiveEndpoint(uri?: string | null, method?: string | null): boolean {
    if (!uri) return false;
    if (uri.startsWith('/api/auth/') || uri.startsWith('/api/login') || uri.startsWith('/api/register')) {
      return true;
    }
    const upperMethod = (method || 'GET').toUpperCase();
    if (upperMethod === 'POST' && (uri.startsWith('/api/orders') || uri.startsWith('/api/checkout'))) {
      return true;
    }
    return false;
  }

  public tryConsume(
    rawIp: string | null | undefined,
    isSensitive = false,
    tokensToConsume = 1,
    nowMs = Date.now()
  ): ConsumptionProbeResult {
    const clientIp = this.normalizeIp(rawIp);
    const tier: 'general' | 'sensitive' = isSensitive ? 'sensitive' : 'general';
    const capacity = isSensitive ? this.sensitiveCapacity : this.generalCapacity;
    const key = `${tier}:${clientIp}`;

    let state = this.buckets.get(key);
    if (!state) {
      state = { tokens: capacity, lastRefillMs: nowMs };
      this.buckets.set(key, state);
    } else {
      const elapsedMs = Math.max(0, nowMs - state.lastRefillMs);
      if (elapsedMs > 0) {
        const refillRatePerMs = capacity / this.refillWindowMs;
        const addedTokens = elapsedMs * refillRatePerMs;
        state.tokens = Math.min(capacity, state.tokens + addedTokens);
        state.lastRefillMs = nowMs;
      }
    }

    const cost = Math.max(1, tokensToConsume);
    if (state.tokens >= cost) {
      state.tokens -= cost;
      return {
        consumed: true,
        remainingTokens: Math.floor(state.tokens),
        limitCapacity: capacity,
        retryAfterSeconds: 0,
        clientIp,
        tier,
      };
    }

    const deficit = cost - state.tokens;
    const refillRatePerSec = capacity / (this.refillWindowMs / 1000);
    const waitSeconds = Math.max(1, Math.ceil(deficit / refillRatePerSec));

    return {
      consumed: false,
      remainingTokens: 0,
      limitCapacity: capacity,
      retryAfterSeconds: waitSeconds,
      clientIp,
      tier,
    };
  }

  public reset(): void {
    this.buckets.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════
// 'NOTIFY ME' PRICE DROP EMAIL ALERT SUBSCRIPTION & EVALUATION LOGIC
// ═══════════════════════════════════════════════════════════════════

export interface PriceAlertSubscription {
  id: string;
  productId: number;
  productTitle: string;
  sku: string;
  email: string;
  targetPrice: number;
  priceAtCreation: number;
  createdAt: number;
  expiresAt: number | null;
  isExpired: boolean;
  triggered: boolean;
  triggeredAt: number | null;
  triggeredPrice: number | null;
}

export function parsePriceAlertExpiryDate(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '' || raw === 0) return null;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === 'none' || trimmed === 'never') return null;
    const isoString = trimmed.includes('T') ? trimmed : `${trimmed}T23:59:59.999Z`;
    const parsed = Date.parse(isoString);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return null;
}

export function isPriceAlertExpired(
  alert: { expiresAt?: number | null; isExpired?: boolean } | undefined | null,
  nowMs = Date.now()
): boolean {
  if (!alert) return false;
  if (alert.isExpired === true) return true;
  const exp = Number(alert.expiresAt);
  if (!Number.isFinite(exp) || exp <= 0) return false;
  return nowMs > exp;
}

export interface PriceAlertEmailNotification {
  alertId: string;
  productId: number;
  productTitle: string;
  sku: string;
  toEmail: string;
  targetPrice: number;
  previousPrice: number;
  newPrice: number;
  savingsAmount: number;
  savingsPct: number;
  subject: string;
  body: string;
  sentAt: number;
}

export interface PriceThresholdPreset {
  key: 'drop5' | 'drop10' | 'drop15' | 'sixMonthLow';
  label: string;
  sublabel: string;
  targetPrice: number;
  savingsPct: number;
}

export function computeSuggestedPriceThresholds(
  currentPrice: number,
  sixMonthLow?: number
): PriceThresholdPreset[] {
  const base = Math.max(1, roundMoney(Number(currentPrice) || 100));
  const p5 = Math.max(1, roundMoney(base * 0.95));
  const p10 = Math.max(1, roundMoney(base * 0.90));
  const p15 = Math.max(1, roundMoney(base * 0.85));
  const low6m =
    typeof sixMonthLow === 'number' && sixMonthLow > 0 && sixMonthLow < base
      ? roundMoney(sixMonthLow)
      : Math.max(1, roundMoney(base * 0.88));
  const lowPct = Math.max(1, Math.round(((base - low6m) / base) * 100));

  return [
    {
      key: 'drop5',
      label: '5% Drop',
      sublabel: `$${p5.toFixed(2)}`,
      targetPrice: p5,
      savingsPct: 5,
    },
    {
      key: 'drop10',
      label: '10% Drop',
      sublabel: `$${p10.toFixed(2)}`,
      targetPrice: p10,
      savingsPct: 10,
    },
    {
      key: 'drop15',
      label: '15% Drop',
      sublabel: `$${p15.toFixed(2)}`,
      targetPrice: p15,
      savingsPct: 15,
    },
    {
      key: 'sixMonthLow',
      label: '6M Low',
      sublabel: `$${low6m.toFixed(2)}`,
      targetPrice: low6m,
      savingsPct: lowPct,
    },
  ];
}

export interface PriceAlertThresholdInsight {
  sixMonthLow: number;
  sixMonthHigh: number;
  sixMonthAvg: number;
  targetPrice: number;
  currentPrice: number;
  monthsAtOrBelowTarget: number;
  totalMonths: number;
  diffFromLow: number;
  likelihoodTier: 'instant-trigger' | 'high-probability' | 'near-6m-low' | 'aggressive-below-low';
  badgeLabel: string;
  guidanceText: string;
}

export function evaluatePriceAlertThresholdVsHistory(
  history: Array<{ month?: string; price: number }> | undefined | null,
  currentPrice: number,
  targetPrice: number
): PriceAlertThresholdInsight {
  const cur = Math.max(0.01, roundMoney(Number(currentPrice) || 100));
  const tgt = Math.max(0.01, roundMoney(Number(targetPrice) || cur));
  const validPrices =
    Array.isArray(history) && history.length > 0
      ? history.map((h) => roundMoney(Number(h.price) || cur)).filter((v) => v > 0)
      : [cur];
  const prices = validPrices.length > 0 ? validPrices : [cur];
  const sixMonthLow = roundMoney(Math.min(...prices));
  const sixMonthHigh = roundMoney(Math.max(...prices));
  const sixMonthAvg = roundMoney(prices.reduce((a, b) => a + b, 0) / prices.length);
  const monthsAtOrBelowTarget = prices.filter((v) => v <= tgt + 0.01).length;
  const totalMonths = prices.length;
  const diffFromLow = roundMoney(tgt - sixMonthLow);

  if (tgt >= cur) {
    return {
      sixMonthLow,
      sixMonthHigh,
      sixMonthAvg,
      targetPrice: tgt,
      currentPrice: cur,
      monthsAtOrBelowTarget,
      totalMonths,
      diffFromLow,
      likelihoodTier: 'instant-trigger',
      badgeLabel: 'Instant Trigger',
      guidanceText: `Target ($${tgt.toFixed(2)}) is at or above current price ($${cur.toFixed(2)}) — alert triggers immediately.`,
    };
  }

  if (tgt < sixMonthLow - 0.05) {
    const belowBy = Math.abs(diffFromLow);
    return {
      sixMonthLow,
      sixMonthHigh,
      sixMonthAvg,
      targetPrice: tgt,
      currentPrice: cur,
      monthsAtOrBelowTarget,
      totalMonths,
      diffFromLow,
      likelihoodTier: 'aggressive-below-low',
      badgeLabel: 'Below 6M Low',
      guidanceText: `$${belowBy.toFixed(2)} below the 6-month floor ($${sixMonthLow.toFixed(2)}). Consider $${sixMonthLow.toFixed(2)} for a higher hit rate.`,
    };
  }

  if (Math.abs(tgt - sixMonthLow) <= Math.max(1.5, cur * 0.015) || monthsAtOrBelowTarget === 1) {
    return {
      sixMonthLow,
      sixMonthHigh,
      sixMonthAvg,
      targetPrice: tgt,
      currentPrice: cur,
      monthsAtOrBelowTarget: Math.max(1, monthsAtOrBelowTarget),
      totalMonths,
      diffFromLow,
      likelihoodTier: 'near-6m-low',
      badgeLabel: '6M Floor Sweet Spot',
      guidanceText: `Matches the 6-month historical floor ($${sixMonthLow.toFixed(2)}) — optimal balance of maximum savings and realistic fill.`,
    };
  }

  return {
    sixMonthLow,
    sixMonthHigh,
    sixMonthAvg,
    targetPrice: tgt,
    currentPrice: cur,
    monthsAtOrBelowTarget,
    totalMonths,
    diffFromLow,
    likelihoodTier: 'high-probability',
    badgeLabel: 'High Likelihood',
    guidanceText: `Reached in ${monthsAtOrBelowTarget} of ${totalMonths} months ($${diffFromLow.toFixed(2)} above 6M low of $${sixMonthLow.toFixed(2)}).`,
  };
}

export function validatePriceAlertInput(input: {
  productId?: number;
  email?: string;
  targetPrice?: number;
  currentPrice?: number;
}): { ok: boolean; message?: string; normalizedEmail: string; normalizedTargetPrice: number } {
  const pid = Number(input.productId);
  if (!pid || Number.isNaN(pid) || pid <= 0) {
    return {
      ok: false,
      message: 'Valid hardware product ID is required.',
      normalizedEmail: '',
      normalizedTargetPrice: 0,
    };
  }

  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return {
      ok: false,
      message: 'Please enter a valid email address to receive price drop alerts.',
      normalizedEmail: email,
      normalizedTargetPrice: 0,
    };
  }

  const target = roundMoney(Number(input.targetPrice));
  if (Number.isNaN(target) || target <= 0) {
    return {
      ok: false,
      message: 'Please enter a target price threshold greater than $0.00.',
      normalizedEmail: email,
      normalizedTargetPrice: 0,
    };
  }

  return {
    ok: true,
    normalizedEmail: email,
    normalizedTargetPrice: target,
  };
}

export function upsertPriceAlertSubscription(
  existingAlerts: PriceAlertSubscription[] | undefined | null,
  params: {
    product: { id: number; title?: string; category?: string; price: number };
    email: string;
    targetPrice: number;
    expiresAt?: number | string | null;
    expiryDate?: number | string | null;
    nowMs?: number;
  }
): { alerts: PriceAlertSubscription[]; subscription: PriceAlertSubscription; isUpdate: boolean } {
  const list: PriceAlertSubscription[] = Array.isArray(existingAlerts)
    ? existingAlerts.map((a) => ({ ...a }))
    : [];
  const now = params.nowMs ?? Date.now();
  const sku = getProductSku(params.product);
  const cleanTarget = roundMoney(params.targetPrice);
  const currentPrice = roundMoney(params.product.price);
  const cleanEmail = params.email.trim().toLowerCase();
  const parsedExpiresAt = parsePriceAlertExpiryDate(params.expiresAt ?? params.expiryDate ?? null);
  const isExpired = isPriceAlertExpired({ expiresAt: parsedExpiresAt, isExpired: false }, now);

  const existingIdx = list.findIndex((a) => a.productId === params.product.id);
  const alreadyBelow = currentPrice < cleanTarget;

  const sub: PriceAlertSubscription = {
    id:
      existingIdx >= 0
        ? list[existingIdx].id
        : `PA-${params.product.id}-${(now % 100000).toString(36).toUpperCase()}`,
    productId: params.product.id,
    productTitle: params.product.title || 'Hardware Component',
    sku,
    email: cleanEmail,
    targetPrice: cleanTarget,
    priceAtCreation: currentPrice,
    createdAt: now,
    expiresAt: parsedExpiresAt,
    isExpired,
    triggered: alreadyBelow && !isExpired,
    triggeredAt: alreadyBelow && !isExpired ? now : null,
    triggeredPrice: alreadyBelow && !isExpired ? currentPrice : null,
  };

  if (existingIdx >= 0) {
    list[existingIdx] = sub;
    return { alerts: list, subscription: sub, isUpdate: true };
  }

  list.unshift(sub);
  return { alerts: list, subscription: sub, isUpdate: false };
}

export function removePriceAlertSubscription(
  existingAlerts: PriceAlertSubscription[] | undefined | null,
  productId: number
): { alerts: PriceAlertSubscription[]; removed: boolean } {
  const list = Array.isArray(existingAlerts) ? existingAlerts : [];
  const next = list.filter((a) => a.productId !== Number(productId));
  return {
    alerts: next,
    removed: next.length !== list.length,
  };
}

export function buildPriceAlertEmailPayload(
  alert: PriceAlertSubscription,
  newPrice: number,
  nowMs = Date.now()
): PriceAlertEmailNotification {
  const cleanNew = roundMoney(newPrice);
  const baseline = Math.max(alert.priceAtCreation, alert.targetPrice, cleanNew);
  const savingsAmount = Math.max(0, roundMoney(baseline - cleanNew));
  const savingsPct = baseline > 0 ? Math.max(0, Math.round((savingsAmount / baseline) * 100)) : 0;

  const subject = `Price Drop Alert: ${alert.productTitle} dropped to $${cleanNew.toFixed(2)} (Below your $${alert.targetPrice.toFixed(2)} threshold)`;
  const body = [
    `VOLTBOX HARDWARE BENCH — PRICE DROP ALERT`,
    `--------------------------------------------------`,
    `Component: ${alert.productTitle}`,
    `Part SKU:  ${alert.sku}`,
    ``,
    `Good news! The component you're watching has dropped below your target price threshold:`,
    `  • New Live Price:     $${cleanNew.toFixed(2)}`,
    `  • Your Alert Target:  $${alert.targetPrice.toFixed(2)}`,
    `  • Original Price:     $${alert.priceAtCreation.toFixed(2)}`,
    savingsAmount > 0 ? `  • Total Savings:      $${savingsAmount.toFixed(2)} (${savingsPct}% off)` : null,
    ``,
    `Order now on Voltbox before stock runs out: /?product=${alert.productId}`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    alertId: alert.id,
    productId: alert.productId,
    productTitle: alert.productTitle,
    sku: alert.sku,
    toEmail: alert.email,
    targetPrice: alert.targetPrice,
    previousPrice: alert.priceAtCreation,
    newPrice: cleanNew,
    savingsAmount,
    savingsPct,
    subject,
    body,
    sentAt: nowMs,
  };
}

export function evaluatePriceDropAlerts(
  alerts: PriceAlertSubscription[] | undefined | null,
  productId: number,
  newPrice: number,
  nowMs = Date.now()
): {
  updatedAlerts: PriceAlertSubscription[];
  triggeredNotifications: PriceAlertEmailNotification[];
} {
  const list: PriceAlertSubscription[] = Array.isArray(alerts)
    ? alerts.map((a) => ({ ...a }))
    : [];
  const cleanNew = roundMoney(newPrice);
  const notifications: PriceAlertEmailNotification[] = [];

  for (const alert of list) {
    if (alert.productId !== Number(productId)) continue;
    // Check if expired - skip notification and mark expired
    if (isPriceAlertExpired(alert, nowMs)) {
      alert.isExpired = true;
      continue;
    }
    // Trigger when newPrice drops below or equals the user-defined threshold
    if (cleanNew <= alert.targetPrice) {
      alert.triggered = true;
      alert.triggeredAt = nowMs;
      alert.triggeredPrice = cleanNew;
      notifications.push(buildPriceAlertEmailPayload(alert, cleanNew, nowMs));
    }
  }

  return {
    updatedAlerts: list,
    triggeredNotifications: notifications,
  };
}

// ── QR Scanner 'Scan History' (Last 10 Products Scanned) Pure Logic ──

export const MAX_SCAN_HISTORY_ITEMS = 10;

export interface QrScanHistoryItem {
  productId: number;
  title: string;
  sku: string;
  category: string;
  price: number;
  image: string;
  scannedAt: number;
  scanCount: number;
}

export function recordScannedProduct(
  existingHistory: QrScanHistoryItem[] | undefined | null,
  product: {
    id: number;
    title?: string;
    name?: string;
    sku?: string;
    category?: string;
    price?: number;
    image?: string;
  } | null | undefined,
  nowMs = Date.now()
): QrScanHistoryItem[] {
  const list: QrScanHistoryItem[] = Array.isArray(existingHistory)
    ? existingHistory.filter((item) => item && typeof item.productId === 'number' && item.productId > 0).map((item) => ({ ...item }))
    : [];

  if (!product || typeof product.id !== 'number' || product.id <= 0) {
    return list.slice(0, MAX_SCAN_HISTORY_ITEMS);
  }

  const pid = Number(product.id);
  const title = String(product.title || product.name || `Part #${pid}`).trim();
  const category = String(product.category || 'components').trim();
  const sku = String(product.sku || getProductSku({ id: pid, title, category })).trim();
  const price = roundMoney(Number(product.price || 0));
  const image = resolveProductImageUrl({ id: pid, title, category, image: product.image });

  const existingIndex = list.findIndex((item) => item.productId === pid);
  const prevCount = existingIndex !== -1 ? Math.max(1, Number(list[existingIndex].scanCount || 1)) : 0;

  if (existingIndex !== -1) {
    list.splice(existingIndex, 1);
  }

  const newEntry: QrScanHistoryItem = {
    productId: pid,
    title,
    sku,
    category,
    price,
    image,
    scannedAt: Number(nowMs) || Date.now(),
    scanCount: prevCount + 1,
  };

  return [newEntry, ...list].slice(0, MAX_SCAN_HISTORY_ITEMS);
}

export function removeScannedProduct(
  existingHistory: QrScanHistoryItem[] | undefined | null,
  productId: number
): QrScanHistoryItem[] {
  if (!Array.isArray(existingHistory)) return [];
  const targetId = Number(productId);
  return existingHistory
    .filter((item) => item && Number(item.productId) !== targetId)
    .slice(0, MAX_SCAN_HISTORY_ITEMS);
}

export function clearScanHistory(): QrScanHistoryItem[] {
  return [];
}

export function formatScanHistoryRelativeTime(scannedAt: number, nowMs = Date.now()): string {
  const ts = Number(scannedAt);
  if (!Number.isFinite(ts) || ts <= 0) return 'Recently';
  const diffSec = Math.max(0, Math.floor((nowMs - ts) / 1000));
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

// ── Smart Catalog Toolbar: Budget Ceiling, Category, Search & Rating Sort Pure Logic ──

export type CatalogSortMode = 'featured' | 'price-asc' | 'price-desc' | 'rating-desc' | 'stock-asc' | 'best-deal';
export type CatalogViewMode = 'grid' | 'list';

export interface CatalogFilterProduct {
  id: number;
  title?: string;
  description?: string;
  category?: string;
  componentGroup?: ComponentGroup;
  price: number;
  quantity?: number;
  stock?: number;
  stockQuantity?: number;
  backorder?: boolean;
  stockStatus?: string;
  ratingRate?: number;
  ratingCount?: number;
  addedByName?: string;
}

export interface CatalogFilterOptions {
  categoryFilter?: string;
  searchQuery?: string;
  maxBudget?: number | null;
  stockFilter?: QuickStockFilterMode;
  sortMode?: CatalogSortMode;
  wishlistIds?: number[];
}

export interface CatalogFilterResult<T extends CatalogFilterProduct> {
  items: T[];
  visibleCount: number;
  totalCount: number;
  availableNowCount: number;
  backorderCount: number;
  hasActiveFilters: boolean;
  activeFilterLabels: string[];
}

export function filterAndSortCatalogProducts<T extends CatalogFilterProduct>(
  products: T[],
  options: CatalogFilterOptions = {}
): CatalogFilterResult<T> {
  const list = Array.isArray(products) ? products.slice() : [];
  const totalCount = list.length;
  const cat = (options.categoryFilter || 'all').trim().toLowerCase();
  const query = (options.searchQuery || '').trim().toLowerCase();
  const maxBudget =
    typeof options.maxBudget === 'number' && Number.isFinite(options.maxBudget) && options.maxBudget > 0
      ? options.maxBudget
      : null;
  const rawStockFilter = (options.stockFilter || 'all').trim().toLowerCase();
  const stockFilter: QuickStockFilterMode =
    rawStockFilter === 'available-now' || rawStockFilter === 'backorder' ? rawStockFilter : 'all';
  const sortMode: CatalogSortMode = options.sortMode || 'featured';
  const wishlistSet = new Set((options.wishlistIds || []).map((id) => Number(id)));

  let availableNowCount = 0;
  let backorderCount = 0;
  for (const item of list) {
    if (getStockAvailabilityStatus(item) === 'backorder') {
      backorderCount++;
    } else {
      availableNowCount++;
    }
  }

  // 1. Sort
  if (sortMode === 'price-asc') {
    list.sort((a, b) => a.price - b.price);
  } else if (sortMode === 'price-desc') {
    list.sort((a, b) => b.price - a.price);
  } else if (sortMode === 'rating-desc') {
    list.sort((a, b) => {
      const rDiff = (Number(b.ratingRate) || 0) - (Number(a.ratingRate) || 0);
      if (Math.abs(rDiff) > 0.001) return rDiff;
      return (Number(b.ratingCount) || 0) - (Number(a.ratingCount) || 0);
    });
  } else if (sortMode === 'stock-asc') {
    list.sort((a, b) => getProductQuantity(a) - getProductQuantity(b));
  } else if (sortMode === 'best-deal') {
    list.sort((a, b) => {
      const dropA = computePriceDropFromSixMonthAvg(a).percentageDrop;
      const dropB = computePriceDropFromSixMonthAvg(b).percentageDrop;
      if (Math.abs(dropB - dropA) > 0.001) return dropB - dropA;
      return a.price - b.price;
    });
  }

  // 2. Filter
  const filtered = list.filter((p) => {
    const group = p.componentGroup || classifyComponentGroup(p);
    const sku = getProductSku(p);
    if (query) {
      const hay = `${p.title || ''} ${p.description || ''} ${p.category || ''} ${group} ${sku} ${p.addedByName || ''}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }

    if (cat === 'low-stock') {
      if (!isLowStock(p)) return false;
    } else if (cat === 'wishlist') {
      if (!wishlistSet.has(Number(p.id))) return false;
    } else if (cat !== 'all') {
      if (group !== cat) return false;
    }

    if (maxBudget !== null && Number(p.price) > maxBudget) {
      return false;
    }

    if (stockFilter !== 'all') {
      const availStatus = getStockAvailabilityStatus(p);
      if (availStatus !== stockFilter) return false;
    }

    return true;
  });

  const activeFilterLabels: string[] = [];
  if (cat !== 'all') activeFilterLabels.push(`Category: ${cat}`);
  if (query) activeFilterLabels.push(`Search: "${query}"`);
  if (maxBudget !== null) activeFilterLabels.push(`Under $${maxBudget}`);
  if (stockFilter === 'available-now') activeFilterLabels.push('Stock: Available Now');
  if (stockFilter === 'backorder') activeFilterLabels.push('Stock: Backorder');
  if (sortMode !== 'featured') {
    activeFilterLabels.push(sortMode === 'best-deal' ? 'Sort: Best Deal (6M Drop)' : `Sort: ${sortMode}`);
  }

  return {
    items: filtered,
    visibleCount: filtered.length,
    totalCount,
    availableNowCount,
    backorderCount,
    hasActiveFilters:
      cat !== 'all' || query.length > 0 || maxBudget !== null || stockFilter !== 'all' || sortMode !== 'featured',
    activeFilterLabels,
  };
}

// ==========================================================================
// WEB SPEECH API — HANDS-FREE VOICE SEARCH TRANSCRIPT PARSER
// ==========================================================================

export interface VoiceSearchParseResult {
  rawTranscript: string;
  query: string;
  isClearCommand: boolean;
  budgetMaxHint: number | null;
  categoryHint: string | null;
}

/**
 * Normalizes a spoken Web Speech API transcript into a clean product search query,
 * stripping conversational filler ("search for", "show me", "find"), normalizing
 * spoken hardware acronyms ("r t x" -> "RTX", "s s d" -> "SSD", "c p u" -> "CPU"),
 * and detecting spoken clear commands or budget ceiling hints ("under $150").
 */
export function normalizeVoiceSearchTranscript(rawTranscript: string): VoiceSearchParseResult {
  const raw = String(rawTranscript ?? '').trim();
  if (!raw) {
    return {
      rawTranscript: '',
      query: '',
      isClearCommand: false,
      budgetMaxHint: null,
      categoryHint: null,
    };
  }

  // Strip trailing punctuation often added by Web Speech API (., ?, !)
  let cleaned = raw.replace(/[.?!,;]+$/g, '').trim();

  // Detect explicit clear/reset voice commands
  const lowerFull = cleaned.toLowerCase();
  if (
    lowerFull === 'clear' ||
    lowerFull === 'clear search' ||
    lowerFull === 'reset' ||
    lowerFull === 'reset search' ||
    lowerFull === 'show all' ||
    lowerFull === 'show all products' ||
    lowerFull === 'all products'
  ) {
    return {
      rawTranscript: raw,
      query: '',
      isClearCommand: true,
      budgetMaxHint: null,
      categoryHint: null,
    };
  }

  // Strip leading conversational filler phrases
  cleaned = cleaned
    .replace(
      /^(?:please\s+)?(?:search\s+for|search|find\s+me|find|show\s+me|show|look\s+for|looking\s+for|filter\s+by|i\s+want|i\s+need)\s+/i,
      ''
    )
    .trim();

  // Detect optional budget ceiling hint: e.g. "under 150 dollars", "under $100", "below 200"
  let budgetMaxHint: number | null = null;
  const budgetMatch = cleaned.match(/\b(?:under|below|less\s+than)\s*\$?\s*(\d{2,4})(?:\s*(?:dollars|bucks|usd))?\b/i);
  if (budgetMatch) {
    const parsedBudget = Number(budgetMatch[1]);
    if (Number.isFinite(parsedBudget) && parsedBudget > 0) {
      budgetMaxHint = parsedBudget;
    }
    cleaned = cleaned.replace(budgetMatch[0], '').trim();
  }

  // Normalize spaced-out spoken hardware acronyms
  const acronymReplacements: Array<[RegExp, string]> = [
    [/\br\s+t\s+x\b/gi, 'RTX'],
    [/\bg\s+t\s+x\b/gi, 'GTX'],
    [/\bs\s+s\s+d\b/gi, 'SSD'],
    [/\bn\s+v\s+m\s+e\b/gi, 'NVMe'],
    [/\bc\s+p\s+u\s*s?\b/gi, 'CPU'],
    [/\bg\s+p\s+u\s*s?\b/gi, 'GPU'],
    [/\bd\s+d\s+r\s*5\b/gi, 'DDR5'],
    [/\bp\s+s\s*5\b/gi, 'PS5'],
    [/\ba\s+m\s+d\b/gi, 'AMD'],
    [/\bm\s+s\s+i\b/gi, 'MSI'],
    [/\bo\s+l\s+e\s+d\b/gi, 'OLED'],
    [/\bu\s+s\s+b\s+c\b/gi, 'USB-C'],
  ];

  for (const [pattern, replacement] of acronymReplacements) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  // Collapse multiple spaces and trailing punctuation again
  cleaned = cleaned.replace(/\s+/g, ' ').replace(/[.?!,;]+$/g, '').trim();

  // Detect category hint if the spoken query maps to a catalog tab
  let categoryHint: string | null = null;
  const lowerClean = cleaned.toLowerCase();
  if (/^(?:gpus?|graphics\s+cards?)$/.test(lowerClean)) {
    categoryHint = 'gpus';
  } else if (/^(?:cpus?|processors?)$/.test(lowerClean)) {
    categoryHint = 'cpus';
  } else if (/^(?:motherboards?|mainboards?)$/.test(lowerClean)) {
    categoryHint = 'motherboards';
  } else if (/^(?:storage|ssds?|hard\s+drives?)$/.test(lowerClean)) {
    categoryHint = 'storage';
  } else if (/^(?:audio|headphones?|microphones?)$/.test(lowerClean)) {
    categoryHint = 'audio';
  } else if (/^(?:gaming|consoles?|controllers?)$/.test(lowerClean)) {
    categoryHint = 'gaming';
  }

  return {
    rawTranscript: raw,
    query: cleaned,
    isClearCommand: false,
    budgetMaxHint,
    categoryHint,
  };
}

// ==========================================================================
// STUDIO UI & BACKGROUND TEMPLATE ENGINE + LIVE PSU / TDP WATTAGE ESTIMATOR
// ==========================================================================

export type UiTemplateId = 'obsidian' | 'blueprint' | 'copper' | 'titanium';

export interface UiBackgroundTemplateSpec {
  id: UiTemplateId;
  name: string;
  shortLabel: string;
  tagline: string;
  legacyBgMode: 'quantum' | 'overclock' | 'cyber' | 'copper';
  bgHex: string;
  cardHex: string;
  accentHex: string;
  accentSecondaryHex: string;
  gridStyle: 'wafer-cyan' | 'cad-cobalt' | 'anodized-amber' | 'lab-emerald';
}

export const UI_BACKGROUND_TEMPLATES: Record<UiTemplateId, UiBackgroundTemplateSpec> = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Studio',
    shortLabel: 'Obsidian',
    tagline: 'Architectural Carbon & Precision Cyan',
    legacyBgMode: 'quantum',
    bgHex: '#090d16',
    cardHex: '#121826',
    accentHex: '#38bdf8',
    accentSecondaryHex: '#2dd4bf',
    gridStyle: 'wafer-cyan',
  },
  blueprint: {
    id: 'blueprint',
    name: 'Cobalt Blueprint',
    shortLabel: 'Blueprint',
    tagline: 'CAD Schematic Navy & Royal Cobalt',
    legacyBgMode: 'overclock',
    bgHex: '#070e1e',
    cardHex: '#0f1930',
    accentHex: '#60a5fa',
    accentSecondaryHex: '#3b82f6',
    gridStyle: 'cad-cobalt',
  },
  copper: {
    id: 'copper',
    name: 'Anodized Copper',
    shortLabel: 'Copper',
    tagline: 'Warm Gunmetal & Brushed Amber Gold',
    legacyBgMode: 'copper',
    bgHex: '#110e0c',
    cardHex: '#1c1714',
    accentHex: '#f59e0b',
    accentSecondaryHex: '#fbbf24',
    gridStyle: 'anodized-amber',
  },
  titanium: {
    id: 'titanium',
    name: 'Titanium Lab',
    shortLabel: 'Titanium',
    tagline: 'Clean Bench Slate & Emerald Telemetry',
    legacyBgMode: 'cyber',
    bgHex: '#0a1015',
    cardHex: '#121c24',
    accentHex: '#10b981',
    accentSecondaryHex: '#2dd4bf',
    gridStyle: 'lab-emerald',
  },
};

export const UI_TEMPLATE_ORDER: UiTemplateId[] = ['obsidian', 'blueprint', 'copper', 'titanium'];

export function resolveUiTemplateTheme(rawInput?: string | null): UiBackgroundTemplateSpec {
  const key = String(rawInput || '').trim().toLowerCase();
  if (key === 'obsidian' || key === 'quantum') return UI_BACKGROUND_TEMPLATES.obsidian;
  if (key === 'blueprint' || key === 'overclock' || key === 'sapphire') return UI_BACKGROUND_TEMPLATES.blueprint;
  if (key === 'copper' || key === 'amber' || key === 'gold') return UI_BACKGROUND_TEMPLATES.copper;
  if (key === 'titanium' || key === 'cyber' || key === 'emerald') return UI_BACKGROUND_TEMPLATES.titanium;
  return UI_BACKGROUND_TEMPLATES.obsidian;
}

export function getNextUiTemplateTheme(currentInput?: string | null): UiBackgroundTemplateSpec {
  const current = resolveUiTemplateTheme(currentInput);
  const idx = UI_TEMPLATE_ORDER.indexOf(current.id);
  const nextId = UI_TEMPLATE_ORDER[(idx + 1) % UI_TEMPLATE_ORDER.length];
  return UI_BACKGROUND_TEMPLATES[nextId];
}

export interface PowerEstimateInputItem {
  id?: number;
  title?: string;
  category?: string;
  componentGroup?: string;
  price?: number;
  quantity?: number;
}

export interface SystemPowerEstimate {
  baseSystemWatts: number;
  componentsWatts: number;
  estimatedPeakWatts: number;
  recommendedPsuWatts: number;
  psuTierLabel: string;
  loadPercentage: number;
  headroomStatus: 'idle' | 'optimal' | 'balanced' | 'high-draw';
  activeComponentCount: number;
}

/**
 * Estimates total PC / hardware system wattage (TDP) and recommends an appropriate
 * ATX 3.1 power supply tier based on cart/rig items.
 */
export function computeSystemPowerEstimate(
  items: PowerEstimateInputItem[]
): SystemPowerEstimate {
  const baseSystemWatts = 65; // Fans, AIO pump, RGB controller, USB peripherals baseline
  let componentsWatts = 0;
  let activeComponentCount = 0;

  if (Array.isArray(items)) {
    for (const item of items) {
      if (!item) continue;
      const qty = Math.max(0, Math.floor(Number(item.quantity ?? 1)));
      if (qty <= 0) continue;

      activeComponentCount += qty;
      const group = (item.componentGroup || classifyComponentGroup(item as any) || '').toLowerCase();
      const titleLower = String(item.title || '').toLowerCase();

      let unitWatts = 18;
      if (group === 'gpus') {
        if (titleLower.includes('5090') || titleLower.includes('4090')) unitWatts = 450;
        else if (titleLower.includes('5080') || titleLower.includes('4080')) unitWatts = 320;
        else unitWatts = 250;
      } else if (group === 'cpus') {
        if (titleLower.includes('ryzen 9') || titleLower.includes('i9')) unitWatts = 170;
        else if (titleLower.includes('ryzen 7') || titleLower.includes('i7')) unitWatts = 120;
        else unitWatts = 95;
      } else if (group === 'motherboards') {
        unitWatts = 55;
      } else if (group === 'storage') {
        unitWatts = 12;
      } else if (group === 'gaming') {
        unitWatts = 35;
      } else if (group === 'audio') {
        unitWatts = 10;
      }

      componentsWatts += unitWatts * qty;
    }
  }

  const estimatedPeakWatts = activeComponentCount > 0 ? baseSystemWatts + componentsWatts : 0;

  // Compute recommended PSU with ~30% transient spike & efficiency headroom
  const targetWithHeadroom = Math.ceil(estimatedPeakWatts * 1.32);
  let recommendedPsuWatts = 550;
  let psuTierLabel = '550W 80+ Bronze';

  if (activeComponentCount === 0) {
    recommendedPsuWatts = 650;
    psuTierLabel = '650W ATX 3.1 Ready';
  } else if (targetWithHeadroom <= 550) {
    recommendedPsuWatts = 550;
    psuTierLabel = '550W 80+ Bronze';
  } else if (targetWithHeadroom <= 650) {
    recommendedPsuWatts = 650;
    psuTierLabel = '650W 80+ Gold';
  } else if (targetWithHeadroom <= 750) {
    recommendedPsuWatts = 750;
    psuTierLabel = '750W 80+ Gold';
  } else if (targetWithHeadroom <= 850) {
    recommendedPsuWatts = 850;
    psuTierLabel = '850W ATX 3.1 Gold';
  } else if (targetWithHeadroom <= 1000) {
    recommendedPsuWatts = 1000;
    psuTierLabel = '1000W ATX 3.1 Platinum';
  } else {
    recommendedPsuWatts = 1200;
    psuTierLabel = '1200W ATX 3.1 Titanium';
  }

  const loadPercentage =
    activeComponentCount === 0
      ? 12
      : Math.min(98, Math.max(15, Math.round((estimatedPeakWatts / recommendedPsuWatts) * 100)));

  let headroomStatus: 'idle' | 'optimal' | 'balanced' | 'high-draw' = 'idle';
  if (activeComponentCount > 0) {
    if (estimatedPeakWatts >= 680) headroomStatus = 'high-draw';
    else if (estimatedPeakWatts >= 350) headroomStatus = 'balanced';
    else headroomStatus = 'optimal';
  }

  return {
    baseSystemWatts: activeComponentCount > 0 ? baseSystemWatts : 0,
    componentsWatts,
    estimatedPeakWatts,
    recommendedPsuWatts,
    psuTierLabel,
    loadPercentage,
    headroomStatus,
    activeComponentCount,
  };
}

export function formatInstagramHandle(name?: string | null, role?: string | null): string {
  const raw = String(name || 'builder').trim().toLowerCase();
  const slug = raw.replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'builder';
  const roleStr = String(role || '').trim().toLowerCase();
  if (roleStr === 'moderator' || roleStr === 'staff_architect') {
    return `@${slug}.voltbox`;
  }
  return `@${slug}`;
}

export function recommendStarterRigBundle<
  T extends { id: number; title?: string; category?: string; componentGroup?: string; price: number; ratingRate?: number; takenDown?: boolean }
>(catalog: T[]): T[] {
  if (!Array.isArray(catalog) || catalog.length === 0) return [];
  const requiredGroups = ['gpus', 'cpus', 'motherboards', 'storage'];
  const selected: T[] = [];

  for (const group of requiredGroups) {
    const candidates = catalog.filter((p) => {
      if (!p || p.takenDown) return false;
      if (getProductQuantity(p as any) <= 0) return false;
      const g = (p.componentGroup || classifyComponentGroup(p as any) || '').toLowerCase();
      return g === group;
    });
    candidates.sort((a, b) => {
      const rDiff = (Number(b.ratingRate) || 0) - (Number(a.ratingRate) || 0);
      if (Math.abs(rDiff) > 0.001) return rDiff;
      return a.price - b.price;
    });
    if (candidates.length > 0) {
      selected.push(candidates[0]);
    }
  }
  return selected;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CATALOG GRID KEYBOARD NAVIGATION SUPPORT
   ═══════════════════════════════════════════════════════════════════════════ */

export type GridNavKey =
  | 'ArrowRight'
  | 'ArrowLeft'
  | 'ArrowDown'
  | 'ArrowUp'
  | 'Home'
  | 'End'
  | 'PageDown'
  | 'PageUp';

export type CardActionType =
  | 'open-specs'
  | 'inc-cart'
  | 'dec-cart'
  | 'toggle-compare'
  | 'toggle-wishlist'
  | 'toggle-history'
  | 'navigate'
  | 'none';

/**
 * Computes next active card index based on arrow keys, grid column count, and boundary limits.
 */
export function computeGridNavigationIndex(
  currentIndex: number,
  totalItems: number,
  columnsCount: number,
  key: string
): number {
  if (totalItems <= 0) return 0;
  const cols = Math.max(1, Math.floor(columnsCount));
  const curr = Math.min(Math.max(0, currentIndex), totalItems - 1);

  switch (key) {
    case 'ArrowRight':
      return Math.min(totalItems - 1, curr + 1);

    case 'ArrowLeft':
      return Math.max(0, curr - 1);

    case 'ArrowDown': {
      const nextDown = curr + cols;
      if (nextDown < totalItems) return nextDown;
      // If jumping beyond totalItems, jump to last item if not already in last row
      const currentRow = Math.floor(curr / cols);
      const totalRows = Math.ceil(totalItems / cols);
      if (currentRow < totalRows - 1) {
        return totalItems - 1;
      }
      return curr;
    }

    case 'ArrowUp':
      return Math.max(0, curr - cols);

    case 'Home':
      return 0;

    case 'End':
      return Math.max(0, totalItems - 1);

    case 'PageDown':
      return Math.min(totalItems - 1, curr + cols * 2);

    case 'PageUp':
      return Math.max(0, curr - cols * 2);

    default:
      return curr;
  }
}

/**
 * Resolves standard responsive column counts for the hardware grid across viewport tiers.
 */
export function calculateGridColumnCount(containerWidth: number, viewMode: 'grid' | 'list' = 'grid'): number {
  if (viewMode === 'list') return 1;
  const width = typeof containerWidth === 'number' && containerWidth > 0 ? containerWidth : 1280;
  if (width <= 640) return 2;
  if (width <= 834) return 2;
  if (width <= 1024) return 3;
  if (width <= 1280) return 3;
  return 4;
}

/**
 * Evaluates shortcut key presses on a focused card.
 */
export function handleProductCardKeyAction(key: string): CardActionType {
  const rawKey = String(key || '');
  if (rawKey === ' ' || rawKey === 'Spacebar' || rawKey === 'Space') {
    return 'open-specs';
  }
  const cleanKey = rawKey.trim();
  if (cleanKey === 'Enter') {
    return 'open-specs';
  }
  if (cleanKey === '+' || cleanKey === '=') {
    return 'inc-cart';
  }
  if (cleanKey === '-' || cleanKey === '_') {
    return 'dec-cart';
  }
  const lower = cleanKey.toLowerCase();
  if (lower === 'c') {
    return 'toggle-compare';
  }
  if (lower === 'w') {
    return 'toggle-wishlist';
  }
  if (lower === 'p') {
    return 'toggle-history';
  }
  if (lower === 's') {
    return 'open-specs';
  }
  if (
    cleanKey === 'ArrowRight' ||
    cleanKey === 'ArrowLeft' ||
    cleanKey === 'ArrowDown' ||
    cleanKey === 'ArrowUp' ||
    cleanKey === 'Home' ||
    cleanKey === 'End' ||
    cleanKey === 'PageDown' ||
    cleanKey === 'PageUp'
  ) {
    return 'navigate';
  }
  return 'none';
}

// ─────────────────────────────────────────────────────────────────────────────
// Real-Time Order Tracking Dashboard & Progress Timeline Logic
// ─────────────────────────────────────────────────────────────────────────────

export type OrderTrackingStageKey = 'placed' | 'processing' | 'shipped' | 'delivered';

export interface OrderTrackingStage {
  key: OrderTrackingStageKey;
  stepNumber: number;
  label: string;
  status: string;
  subtitle: string;
  location: string;
  timestamp: string;
  timestampMs: number;
  state: 'completed' | 'current' | 'upcoming';
  icon: string;
}

export interface OrderTrackingCarrier {
  name: string;
  service: string;
  trackingNumber: string;
  trackingUrl: string;
  contactPhone: string;
}

export interface OrderTrackingTimeline {
  orderId: string;
  currentStatus: string;
  currentStageIndex: number;
  currentStageKey: OrderTrackingStageKey;
  progressPercent: number;
  stages: OrderTrackingStage[];
  carrier: OrderTrackingCarrier;
  estimatedDelivery: string;
  estimatedDeliveryTimestampMs: number;
  destination: {
    name: string;
    address: string;
  };
  itemCount: number;
  total: number;
  placedAt: number;
  canAdvance: boolean;
  nextStage: string | null;
}

export interface TrackableOrderLike {
  id: string;
  placedAt?: number;
  status?: string;
  count?: number;
  total?: number;
  shippingName?: string;
  shippingAddress?: string;
  lines?: Array<{
    productId?: number;
    title?: string;
    price?: number;
    qty?: number;
    image?: string;
  }>;
}

/**
 * Normalizes an arbitrary order status string into one of the 4 canonical timeline stages.
 */
export function normalizeTrackingStatus(status?: string | null): {
  stageIndex: number;
  stageKey: OrderTrackingStageKey;
  canonicalLabel: string;
} {
  const raw = String(status || '').trim().toLowerCase();
  if (!raw) {
    return { stageIndex: 0, stageKey: 'placed', canonicalLabel: 'Order Placed' };
  }
  if (raw.includes('deliver') || raw.includes('complete') || raw.includes('arrived')) {
    return { stageIndex: 3, stageKey: 'delivered', canonicalLabel: 'Delivered' };
  }
  if (raw.includes('ship') || raw.includes('transit') || raw.includes('dispatch') || raw.includes('out for delivery')) {
    return { stageIndex: 2, stageKey: 'shipped', canonicalLabel: 'Shipped' };
  }
  if (raw.includes('process') || raw.includes('pack') || raw.includes('bench') || raw.includes('quality') || raw.includes('inspect')) {
    return { stageIndex: 1, stageKey: 'processing', canonicalLabel: 'Processing' };
  }
  return { stageIndex: 0, stageKey: 'placed', canonicalLabel: 'Order Placed' };
}

/**
 * Returns the next logical status in the 4-stage fulfillment lifecycle.
 */
export function advanceOrderTrackingStage(currentStatus?: string | null): string {
  const { stageIndex } = normalizeTrackingStatus(currentStatus);
  switch (stageIndex) {
    case 0:
      return 'Processing';
    case 1:
      return 'Shipped';
    case 2:
      return 'Delivered';
    case 3:
    default:
      return 'Delivered';
  }
}

/**
 * Computes deterministic, real-time tracking timeline metrics, milestones, checkpoints and ETA.
 */
export function resolveOrderTrackingTimeline(
  order: TrackableOrderLike,
  nowMs: number = Date.now()
): OrderTrackingTimeline {
  const orderId = String(order?.id || 'VB-ORDER');
  const placedAt = typeof order?.placedAt === 'number' && order.placedAt > 0 ? order.placedAt : nowMs - 3600000;
  const currentStatus = order?.status || 'Order Placed';
  const { stageIndex, stageKey } = normalizeTrackingStatus(currentStatus);

  // Deterministic tracking number (AWB) from numeric parts of order ID
  const digitsOnly = orderId.replace(/\D/g, '');
  const awbSuffix = digitsOnly.length >= 6 ? digitsOnly.slice(-6) : '882194';
  const trackingNumber = `VB-TRK-${awbSuffix}`;

  // Time calculations (placed -> +4h processing -> +24h shipped -> +72h delivered)
  const processingTimeMs = placedAt + 4 * 3600 * 1000;
  const shippedTimeMs = placedAt + 24 * 3600 * 1000;
  const deliveredTimeMs = placedAt + 72 * 3600 * 1000;

  function formatTrackingDate(ms: number): string {
    const d = new Date(ms);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const shippingDest = order.shippingAddress && order.shippingAddress.trim()
    ? order.shippingAddress.trim()
    : 'Recipient Destination Address';

  const stages: OrderTrackingStage[] = [
    {
      key: 'placed',
      stepNumber: 1,
      label: 'Order Placed',
      status: 'Order Placed',
      subtitle: 'Payment verified · ESD invoice generated',
      location: 'Voltbox Digital Gateway, BLR',
      timestamp: formatTrackingDate(placedAt),
      timestampMs: placedAt,
      state: stageIndex > 0 ? 'completed' : stageIndex === 0 ? 'current' : 'upcoming',
      icon: 'clipboard-check',
    },
    {
      key: 'processing',
      stepNumber: 2,
      label: 'Processing',
      status: 'Processing',
      subtitle: 'ESD bench inspection · Components boxed & cushioned',
      location: 'Voltbox ESD Hub, Bengaluru',
      timestamp: stageIndex >= 1 ? formatTrackingDate(Math.min(nowMs, processingTimeMs)) : 'Expected within 4 hours',
      timestampMs: processingTimeMs,
      state: stageIndex > 1 ? 'completed' : stageIndex === 1 ? 'current' : 'upcoming',
      icon: 'package',
    },
    {
      key: 'shipped',
      stepNumber: 3,
      label: 'Shipped',
      status: 'Shipped',
      subtitle: 'Dispatched via BlueDart Express Air Cargo',
      location: 'Transit Air Hub · Flight AI-512',
      timestamp: stageIndex >= 2 ? formatTrackingDate(Math.min(nowMs, shippedTimeMs)) : 'Scheduled next business day',
      timestampMs: shippedTimeMs,
      state: stageIndex > 2 ? 'completed' : stageIndex === 2 ? 'current' : 'upcoming',
      icon: 'truck',
    },
    {
      key: 'delivered',
      stepNumber: 4,
      label: 'Delivered',
      status: 'Delivered',
      subtitle: 'Delivered and signed by recipient',
      location: shippingDest,
      timestamp: stageIndex >= 3 ? formatTrackingDate(Math.min(nowMs, deliveredTimeMs)) : 'Estimated in 2-3 business days',
      timestampMs: deliveredTimeMs,
      state: stageIndex >= 3 ? 'completed' : 'upcoming',
      icon: 'check-circle',
    },
  ];

  // Calculate percentage along the 3 connecting segments (0%, 33.3%, 66.7%, 100%)
  const progressPercent = Math.round((stageIndex / 3) * 100);

  const estDateObj = new Date(deliveredTimeMs);
  const estimatedDelivery = estDateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const canAdvance = stageIndex < 3;
  const nextStage = canAdvance ? advanceOrderTrackingStage(currentStatus) : null;

  return {
    orderId,
    currentStatus: stages[stageIndex].label,
    currentStageIndex: stageIndex,
    currentStageKey: stageKey,
    progressPercent,
    stages,
    carrier: {
      name: 'BlueDart Express',
      service: 'Apex Priority Air Cargo (Insured)',
      trackingNumber,
      trackingUrl: `https://www.bluedart.com/tracking?handler=t&trackFor=0&action=funcCall&trackingBox=${trackingNumber}`,
      contactPhone: '1800 233 1234',
    },
    estimatedDelivery,
    estimatedDeliveryTimestampMs: deliveredTimeMs,
    destination: {
      name: order.shippingName || 'Alex Chen',
      address: shippingDest,
    },
    itemCount: typeof order.count === 'number' ? order.count : (order.lines?.length || 0),
    total: typeof order.total === 'number' ? order.total : 0,
    placedAt,
    canAdvance,
    nextStage,
  };
}

// ─────────────────────────────────────────────────────────────
// QR Scanner Audio Ping Feedback (Subtle & Satisfying Sound Feedback)
// ─────────────────────────────────────────────────────────────

export interface ScanPingToneSpec {
  freq: number;
  harmonicName: string;
  type: 'sine' | 'triangle';
  gain: number;
  durationSec: number;
  delaySec: number;
}

export interface ScanPingAudioConfig {
  profile: 'crystal' | 'subtle' | 'classic';
  masterGain: number;
  tones: ScanPingToneSpec[];
  vibrationPattern: number[];
  visualFeedbackMs: number;
  toneDurationMs: number;
}

export interface ScheduledToneEvent {
  toneIndex: number;
  harmonicName: string;
  frequency: number;
  type: 'sine' | 'triangle';
  startTime: number;
  peakTime: number;
  stopTime: number;
  peakGain: number;
  endGain: number;
}

/**
 * Returns the audio configuration for subtle, satisfying acoustic feedback upon QR recognition.
 * Engineered with a crisp fundamental (C6 / 1046.5Hz) and a gentle harmonic shimmer (G6 / 1567.98Hz),
 * tapering off smoothly without harsh pops or digital clipping.
 */
export function getScanPingAudioConfig(profile: 'crystal' | 'subtle' | 'classic' = 'subtle'): ScanPingAudioConfig {
  if (profile === 'crystal') {
    return {
      profile: 'crystal',
      masterGain: 0.20,
      tones: [
        { freq: 1318.51, harmonicName: 'fundamental_e6', type: 'sine', gain: 0.16, durationSec: 0.17, delaySec: 0.0 },
        { freq: 2093.00, harmonicName: 'octave_c7', type: 'sine', gain: 0.08, durationSec: 0.11, delaySec: 0.012 },
      ],
      vibrationPattern: [35, 20, 45],
      visualFeedbackMs: 650,
      toneDurationMs: 200,
    };
  }

  if (profile === 'classic') {
    return {
      profile: 'classic',
      masterGain: 0.22,
      tones: [
        { freq: 880.00, harmonicName: 'fundamental_a5', type: 'sine', gain: 0.18, durationSec: 0.18, delaySec: 0.0 },
        { freq: 1320.00, harmonicName: 'fifth_e6', type: 'sine', gain: 0.09, durationSec: 0.12, delaySec: 0.010 },
      ],
      vibrationPattern: [40, 25, 50],
      visualFeedbackMs: 650,
      toneDurationMs: 210,
    };
  }

  // Default: subtle — warm, refined, high-end electronics ping
  return {
    profile: 'subtle',
    masterGain: 0.22,
    tones: [
      { freq: 1046.50, harmonicName: 'fundamental_c6', type: 'sine', gain: 0.18, durationSec: 0.18, delaySec: 0.0 },
      { freq: 1567.98, harmonicName: 'shimmer_g6', type: 'sine', gain: 0.075, durationSec: 0.12, delaySec: 0.012 },
    ],
    vibrationPattern: [30, 20, 40],
    visualFeedbackMs: 650,
    toneDurationMs: 220,
  };
}

/**
 * Calculates exact oscillator and gain node scheduling timestamps for the Web Audio API graph.
 */
export function calculateScanPingSchedule(startTimeSec: number, config?: ScanPingAudioConfig): ScheduledToneEvent[] {
  const cfg = config || getScanPingAudioConfig('subtle');
  const baseTime = Math.max(0, Number(startTimeSec) || 0);

  return cfg.tones.map((tone, idx) => {
    const toneStart = baseTime + Math.max(0, tone.delaySec);
    const attackDuration = 0.003; // 3ms clickless attack ramp
    const peakTime = toneStart + attackDuration;
    const toneDuration = Math.max(0.02, tone.durationSec);
    const stopTime = toneStart + toneDuration;
    const peakGain = Math.round(tone.gain * cfg.masterGain * 10000) / 10000;
    const endGain = 0.0001; // Exponential ramp target

    return {
      toneIndex: idx,
      harmonicName: tone.harmonicName,
      frequency: tone.freq,
      type: tone.type,
      startTime: Math.round(toneStart * 10000) / 10000,
      peakTime: Math.round(peakTime * 10000) / 10000,
      stopTime: Math.round(stopTime * 10000) / 10000,
      peakGain,
      endGain,
    };
  });
}

/**
 * Validates whether a detected camera/scanner optical payload qualifies to trigger the scan success ping.
 */
export function validateQrScanAudioTrigger(rawPayload: unknown): {
  shouldTrigger: boolean;
  productId: number | null;
  reason: string;
  label: string;
} {
  if (rawPayload == null) {
    return { shouldTrigger: false, productId: null, reason: 'Payload is null or undefined', label: 'No Data' };
  }

  let text = '';
  if (typeof rawPayload === 'string') {
    text = rawPayload.trim();
  } else if (typeof rawPayload === 'number') {
    text = String(rawPayload);
  } else if (typeof rawPayload === 'object') {
    try {
      const obj = rawPayload as Record<string, unknown>;
      if (typeof obj.productId === 'number') return { shouldTrigger: true, productId: obj.productId, reason: 'Parsed productId from object', label: `Part #${obj.productId}` };
      if (typeof obj.id === 'number') return { shouldTrigger: true, productId: obj.id, reason: 'Parsed id from object', label: `Part #${obj.id}` };
      text = JSON.stringify(rawPayload);
    } catch {
      text = String(rawPayload);
    }
  } else {
    text = String(rawPayload);
  }

  if (!text) {
    return { shouldTrigger: false, productId: null, reason: 'Payload string is empty', label: 'Empty' };
  }

  // 1. Check URL query params: ?product=19 or &product=19
  const qMatch = text.match(/[?&]product=(\d+)/i);
  if (qMatch) {
    const id = Number(qMatch[1]);
    return { shouldTrigger: true, productId: id, reason: 'Matched product query parameter', label: `Component #${id}` };
  }

  // 2. Check URL path: /product/19
  const pathMatch = text.match(/\/product\/(\d+)/i);
  if (pathMatch) {
    const id = Number(pathMatch[1]);
    return { shouldTrigger: true, productId: id, reason: 'Matched product path segment', label: `Component #${id}` };
  }

  // 3. Check SKU pattern: VB-GPU-019
  const skuMatch = text.match(/VB-[A-Z]{3}-(\d+)/i);
  if (skuMatch) {
    const id = Number(skuMatch[1]);
    return { shouldTrigger: true, productId: id, reason: 'Matched Voltbox SKU format', label: `SKU VB-${id}` };
  }

  // 4. Check Voltbox prefix: VB:19 or VOLTBOX:19
  const prefixMatch = text.match(/^(?:VOLTBOX|VB):(\d+)$/i);
  if (prefixMatch) {
    const id = Number(prefixMatch[1]);
    return { shouldTrigger: true, productId: id, reason: 'Matched Voltbox ID prefix', label: `Voltbox #${id}` };
  }

  // 5. Clean numeric string: "19"
  if (/^\d+$/.test(text)) {
    const id = Number(text);
    return { shouldTrigger: true, productId: id, reason: 'Matched direct numeric product identifier', label: `Part #${id}` };
  }

  // 6. Generic recognized URL
  if (/^https?:\/\//i.test(text)) {
    return { shouldTrigger: true, productId: null, reason: 'Recognized valid web URL payload', label: 'Web Link' };
  }

  // If text is too short or unstructured noise
  if (text.length < 3) {
    return { shouldTrigger: false, productId: null, reason: 'Payload too brief to represent a hardware code', label: 'Noise' };
  }

  // Fallback: treated as unrecognized code
  return { shouldTrigger: false, productId: null, reason: 'Unrecognized product code pattern', label: text.slice(0, 16) };
}

/**
 * Returns the UI button state and accessibility attributes for the audio ping toggle.
 */
export function formatAudioPingToggleState(enabled: boolean): {
  enabled: boolean;
  label: string;
  shortLabel: string;
  icon: 'volume-2' | 'volume-x';
  tooltip: string;
  ariaLabel: string;
  ariaChecked: boolean;
} {
  const isEnabled = !!enabled;
  return {
    enabled: isEnabled,
    label: isEnabled ? 'Audio Ping: ON' : 'Audio Ping: MUTED',
    shortLabel: isEnabled ? 'Ping ON' : 'Muted',
    icon: isEnabled ? 'volume-2' : 'volume-x',
    tooltip: isEnabled ? 'Subtle audio ping enabled on QR detection. Click to mute.' : 'Audio ping muted. Click to enable sound feedback.',
    ariaLabel: isEnabled ? 'Audio ping feedback enabled. Click to mute sound.' : 'Audio ping feedback muted. Click to enable sound.',
    ariaChecked: isEnabled,
  };
}

/**
 * Pure mathematical synthesis of the scan ping audio waveform into a Float32Array PCM buffer.
 * Used for audio validation, testing harmonic frequencies, and ensuring zero clicks or harsh distortion.
 */
export function synthesizeScanPingPcmBuffer(sampleRate = 44100, config?: ScanPingAudioConfig): Float32Array {
  const cfg = config || getScanPingAudioConfig('subtle');
  const sr = Math.max(8000, Math.floor(sampleRate));
  const totalDurationSec = (cfg.toneDurationMs + 50) / 1000;
  const numSamples = Math.floor(totalDurationSec * sr);
  const buffer = new Float32Array(numSamples);

  for (const tone of cfg.tones) {
    const delaySamples = Math.floor(tone.delaySec * sr);
    const durationSamples = Math.floor(tone.durationSec * sr);
    const attackSamples = Math.floor(0.003 * sr); // 3ms attack
    const peakGain = tone.gain * cfg.masterGain;

    for (let i = 0; i < durationSamples; i++) {
      const sampleIdx = delaySamples + i;
      if (sampleIdx >= numSamples) break;

      const tSec = i / sr;
      // Exponential decay envelope
      let envelope = 0;
      if (i < attackSamples) {
        envelope = peakGain * (i / attackSamples);
      } else {
        const decayProgress = (i - attackSamples) / Math.max(1, durationSamples - attackSamples);
        envelope = peakGain * Math.exp(-decayProgress * 5.0);
      }

      // Sine wave calculation
      const phase = 2 * Math.PI * tone.freq * tSec;
      const sampleVal = Math.sin(phase) * envelope;
      buffer[sampleIdx] = Math.max(-1.0, Math.min(1.0, buffer[sampleIdx] + sampleVal));
    }
  }

  return buffer;
}

// ─────────────────────────────────────────────────────────────
// Subtle Wishlist Toast Notification Logic
// ─────────────────────────────────────────────────────────────

export interface WishlistToastPayload {
  productId: number;
  productTitle: string;
  productPrice: number;
  productSku: string;
  added: boolean;
  actionType: 'wishlist-added' | 'wishlist-removed';
  badgeLabel: string;
  headline: string;
  subline: string;
  message: string;
  wishlistCount: number;
  icon: 'heart' | 'trash';
  accentTone: 'rose' | 'slate';
  undoActionLabel: string;
}

/**
 * Builds a structured, non-modal toast notification payload when a user adds or removes
 * a hardware component from their personal wishlist.
 */
export function buildWishlistToastPayload(
  product: { id: number; title?: string; price?: number; sku?: string; category?: string } | null | undefined,
  added: boolean,
  wishlistCount: number
): WishlistToastPayload {
  const productId = product && typeof product.id === 'number' ? Math.floor(product.id) : 0;
  const productTitle = (product && product.title ? String(product.title).trim() : '') || (productId > 0 ? `Component #${productId}` : 'Hardware Component');
  const productPrice = product && typeof product.price === 'number' && Number.isFinite(product.price) ? Math.round(product.price * 100) / 100 : 0;
  const productSku = (product && product.sku ? String(product.sku).trim() : '') || (productId > 0 ? getProductSku({ id: productId, title: productTitle, category: product?.category }) : 'VB-PRT-000');
  const cleanCount = Math.max(0, Math.floor(Number(wishlistCount) || 0));
  const isAdded = Boolean(added);

  const countSuffix = `${cleanCount} ${cleanCount === 1 ? 'item' : 'items'} in wishlist`;
  const priceTag = productPrice > 0 ? ` ($${productPrice.toFixed(2)})` : '';

  if (isAdded) {
    return {
      productId,
      productTitle,
      productPrice,
      productSku,
      added: true,
      actionType: 'wishlist-added',
      badgeLabel: 'Saved to Wishlist',
      headline: `Saved to Wishlist: ${productTitle}`,
      subline: `${productSku}${priceTag} · ${countSuffix}`,
      message: `Saved to Wishlist: ${productTitle} · ${countSuffix}`,
      wishlistCount: cleanCount,
      icon: 'heart',
      accentTone: 'rose',
      undoActionLabel: 'Undo',
    };
  }

  return {
    productId,
    productTitle,
    productPrice,
    productSku,
    added: false,
    actionType: 'wishlist-removed',
    badgeLabel: 'Removed from Wishlist',
    headline: `Removed from Wishlist: ${productTitle}`,
    subline: `${productSku} removed · ${countSuffix}`,
    message: `Removed from Wishlist: ${productTitle} · ${countSuffix}`,
    wishlistCount: cleanCount,
    icon: 'heart',
    accentTone: 'slate',
    undoActionLabel: 'Restore',
  };
}

// ─────────────────────────────────────────────────────────────
// Checkout Modal 'Print Summary' & Printable Order Estimate
// ─────────────────────────────────────────────────────────────

export interface CheckoutSummaryLineItem {
  id: number;
  sku: string;
  title: string;
  category: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CheckoutPrintSummary {
  summaryId: string;
  generatedAt: string;
  recipientName: string;
  shippingAddress: string;
  paymentMethodSummary: string;
  promoCode: string | null;
  promoLabel: string | null;
  items: CheckoutSummaryLineItem[];
  totalQuantity: number;
  subtotal: number;
  rigDiscount: number;
  promoDiscount: number;
  taxRatePercent: number;
  tax: number;
  shippingCost: number;
  totalUsd: number;
  totalInr: number;
}

/**
 * Generates a structured pre-purchase order summary for the Checkout modal's 'Print Summary' view.
 */
export function buildCheckoutPrintSummary(
  cartItems: Array<{ id: number; title?: string; price: number; quantity: number; category?: string; sku?: string }>,
  options?: {
    recipientName?: string;
    shippingAddress?: string;
    paymentMethodSummary?: string;
    promoCode?: string | null;
    promoDiscount?: number;
    rigDiscount?: number;
    taxRate?: number;
    nowMs?: number;
  }
): CheckoutPrintSummary {
  const opts = options || {};
  const now = typeof opts.nowMs === 'number' && Number.isFinite(opts.nowMs) ? new Date(opts.nowMs) : new Date();
  const lines: CheckoutSummaryLineItem[] = [];
  let subtotal = 0;
  let totalQuantity = 0;

  if (Array.isArray(cartItems)) {
    for (const item of cartItems) {
      if (!item || typeof item.quantity !== 'number' || item.quantity <= 0) continue;
      const qty = Math.floor(item.quantity);
      const unitPrice = Math.max(0, Math.round(Number(item.price || 0) * 100) / 100);
      const lineTotal = Math.round(unitPrice * qty * 100) / 100;
      const sku = item.sku || getProductSku({ id: item.id, title: item.title, category: item.category });
      lines.push({
        id: Number(item.id),
        sku,
        title: String(item.title || `Component #${item.id}`).trim(),
        category: String(item.category || 'components').trim(),
        unitPrice,
        quantity: qty,
        lineTotal,
      });
      subtotal = Math.round((subtotal + lineTotal) * 100) / 100;
      totalQuantity += qty;
    }
  }

  const rigDiscount = Math.max(0, Math.round(Number(opts.rigDiscount || 0) * 100) / 100);
  const promoDiscount = Math.max(0, Math.round(Number(opts.promoDiscount || 0) * 100) / 100);
  const discountedSubtotal = Math.max(0, Math.round((subtotal - rigDiscount - promoDiscount) * 100) / 100);
  const taxRate = typeof opts.taxRate === 'number' && opts.taxRate >= 0 ? opts.taxRate : 0.08;
  const tax = Math.round(discountedSubtotal * taxRate * 100) / 100;
  const totalUsd = Math.round((discountedSubtotal + tax) * 100) / 100;
  const totalInr = Math.round(totalUsd * 83.5);

  const hashSeed = Math.abs(Math.floor(totalUsd * 100) + totalQuantity * 37 + lines.length * 13) % 9000 + 1000;
  const summaryId = `VB-SUM-${hashSeed}`;

  return {
    summaryId,
    generatedAt: now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    recipientName: String(opts.recipientName || 'Valued Builder').trim() || 'Valued Builder',
    shippingAddress: String(opts.shippingAddress || '42 Circuit Lane, Silicon Bay').trim() || '42 Circuit Lane, Silicon Bay',
    paymentMethodSummary: String(opts.paymentMethodSummary || 'UPI / Instant').trim() || 'UPI / Instant',
    promoCode: opts.promoCode ? String(opts.promoCode).trim().toUpperCase() : null,
    promoLabel: opts.promoCode ? `Promo (${String(opts.promoCode).trim().toUpperCase()})` : null,
    items: lines,
    totalQuantity,
    subtotal,
    rigDiscount,
    promoDiscount,
    taxRatePercent: Math.round(taxRate * 100),
    tax,
    shippingCost: 0,
    totalUsd,
    totalInr,
  };
}

// ─────────────────────────────────────────────────────────────
// Storefront Advanced Settings State & Validation
// ─────────────────────────────────────────────────────────────

export interface StorefrontAdvancedSettings {
  audioPingEnabled: boolean;
  audioPingProfile: 'subtle' | 'crystal' | 'classic';
  wishlistToastsEnabled: boolean;
  toastDurationMs: 2500 | 3800 | 5500;
  cardParallaxTiltEnabled: boolean;
  backgroundAnimationEnabled: boolean;
  gridDensity: 'comfortable' | 'compact';
  showDualCurrencyInr: boolean;
  autoExpandCheckoutSummary: boolean;
}

export const DEFAULT_ADVANCED_SETTINGS: StorefrontAdvancedSettings = {
  audioPingEnabled: true,
  audioPingProfile: 'subtle',
  wishlistToastsEnabled: true,
  toastDurationMs: 3800,
  cardParallaxTiltEnabled: true,
  backgroundAnimationEnabled: true,
  gridDensity: 'comfortable',
  showDualCurrencyInr: false,
  autoExpandCheckoutSummary: true,
};

export function resolveAdvancedSettings(raw?: Partial<Record<keyof StorefrontAdvancedSettings, unknown>> | null): StorefrontAdvancedSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_ADVANCED_SETTINGS };
  }
  const profileRaw = String(raw.audioPingProfile || '').toLowerCase();
  const audioPingProfile: 'subtle' | 'crystal' | 'classic' =
    profileRaw === 'crystal' || profileRaw === 'classic' ? profileRaw : 'subtle';

  const durNum = Number(raw.toastDurationMs);
  const toastDurationMs: 2500 | 3800 | 5500 =
    durNum === 2500 || durNum === 5500 ? durNum : 3800;

  const densityRaw = String(raw.gridDensity || '').toLowerCase();
  const gridDensity: 'comfortable' | 'compact' =
    densityRaw === 'compact' ? 'compact' : 'comfortable';

  return {
    audioPingEnabled: typeof raw.audioPingEnabled === 'boolean' ? raw.audioPingEnabled : DEFAULT_ADVANCED_SETTINGS.audioPingEnabled,
    audioPingProfile,
    wishlistToastsEnabled: typeof raw.wishlistToastsEnabled === 'boolean' ? raw.wishlistToastsEnabled : DEFAULT_ADVANCED_SETTINGS.wishlistToastsEnabled,
    toastDurationMs,
    cardParallaxTiltEnabled: typeof raw.cardParallaxTiltEnabled === 'boolean' ? raw.cardParallaxTiltEnabled : DEFAULT_ADVANCED_SETTINGS.cardParallaxTiltEnabled,
    backgroundAnimationEnabled: typeof raw.backgroundAnimationEnabled === 'boolean' ? raw.backgroundAnimationEnabled : DEFAULT_ADVANCED_SETTINGS.backgroundAnimationEnabled,
    gridDensity,
    showDualCurrencyInr: typeof raw.showDualCurrencyInr === 'boolean' ? raw.showDualCurrencyInr : DEFAULT_ADVANCED_SETTINGS.showDualCurrencyInr,
    autoExpandCheckoutSummary: typeof raw.autoExpandCheckoutSummary === 'boolean' ? raw.autoExpandCheckoutSummary : DEFAULT_ADVANCED_SETTINGS.autoExpandCheckoutSummary,
  };
}

// ─────────────────────────────────────────────────────────────
// Catalog Toolbar 'Compare All Visible' Selection Logic
// ─────────────────────────────────────────────────────────────

export const MAX_COMPARISON_ITEMS = 4;

export interface CompareAllVisibleResult {
  nextCompareIds: number[];
  addedIds: number[];
  alreadySelectedIds: number[];
  visibleCount: number;
  eligibleCount: number;
  cappedAtLimit: boolean;
  allVisibleAlreadyCompared: boolean;
  replacedPreviousFullSelection: boolean;
  maxLimit: number;
  buttonLabel: string;
  toastMessage: string;
}

export interface CompareAllVisibleButtonState {
  visibleCount: number;
  eligibleCount: number;
  maxLimit: number;
  disabled: boolean;
  isAllCompared: boolean;
  labelText: string;
  badgeText: string;
  ariaLabel: string;
}

/**
 * Computes the button label, count badge, and active/disabled state for the
 * 'Compare All Visible' button in the catalog toolbar.
 */
export function getCompareAllVisibleButtonState(
  visibleProductsOrIds: Array<number | { id: number }>,
  currentCompareIds: number[] = [],
  maxLimit: number = MAX_COMPARISON_ITEMS
): CompareAllVisibleButtonState {
  const limit = Math.max(1, Math.floor(Number(maxLimit) || MAX_COMPARISON_ITEMS));
  const visibleIds: number[] = [];
  if (Array.isArray(visibleProductsOrIds)) {
    for (const item of visibleProductsOrIds) {
      const rawId = typeof item === 'number' ? item : item && typeof item === 'object' ? item.id : 0;
      const id = Math.floor(Number(rawId));
      if (id > 0 && !visibleIds.includes(id)) {
        visibleIds.push(id);
      }
    }
  }

  const compareSet = new Set<number>(
    Array.isArray(currentCompareIds)
      ? currentCompareIds.map((x) => Math.floor(Number(x))).filter((x) => x > 0)
      : []
  );

  const visibleCount = visibleIds.length;
  const eligibleCount = Math.min(visibleCount, limit);
  const targetSlice = visibleIds.slice(0, limit);
  const isAllCompared = targetSlice.length > 0 && targetSlice.every((id) => compareSet.has(id));
  const disabled = visibleCount === 0;
  const labelText = isAllCompared ? 'Comparing Visible' : 'Compare All Visible';
  const badgeText = visibleCount > limit ? `${eligibleCount}/${limit}` : String(eligibleCount);
  const ariaLabel = disabled
    ? 'Compare all visible products (no visible products)'
    : isAllCompared
      ? `All ${eligibleCount} visible products are in comparison — click to view matrix`
      : `Compare all visible products (adds up to ${eligibleCount} of ${visibleCount} filtered components)`;

  return {
    visibleCount,
    eligibleCount,
    maxLimit: limit,
    disabled,
    isAllCompared,
    labelText,
    badgeText,
    ariaLabel,
  };
}

/**
 * Selects all currently filtered/visible products (up to maxLimit = 4) for the comparison tool.
 * Preserves existing compared items when slots are available, or loads the top visible filtered
 * items when the comparison slots were previously full with other items.
 */
export function selectVisibleProductsForComparison(
  visibleProductsOrIds: Array<number | { id: number; title?: string }>,
  currentCompareIds: number[] = [],
  maxLimit: number = MAX_COMPARISON_ITEMS
): CompareAllVisibleResult {
  const limit = Math.max(1, Math.floor(Number(maxLimit) || MAX_COMPARISON_ITEMS));

  const visibleIds: number[] = [];
  if (Array.isArray(visibleProductsOrIds)) {
    for (const item of visibleProductsOrIds) {
      const rawId = typeof item === 'number' ? item : item && typeof item === 'object' ? item.id : 0;
      const id = Math.floor(Number(rawId));
      if (id > 0 && !visibleIds.includes(id)) {
        visibleIds.push(id);
      }
    }
  }

  const existingIds: number[] = [];
  if (Array.isArray(currentCompareIds)) {
    for (const raw of currentCompareIds) {
      const id = Math.floor(Number(raw));
      if (id > 0 && !existingIds.includes(id) && existingIds.length < limit) {
        existingIds.push(id);
      }
    }
  }

  const visibleCount = visibleIds.length;
  const eligibleCount = Math.min(visibleCount, limit);
  const cappedAtLimit = visibleCount > limit;
  const targetSlice = visibleIds.slice(0, limit);

  if (visibleCount === 0) {
    return {
      nextCompareIds: existingIds,
      addedIds: [],
      alreadySelectedIds: [],
      visibleCount: 0,
      eligibleCount: 0,
      cappedAtLimit: false,
      allVisibleAlreadyCompared: false,
      replacedPreviousFullSelection: false,
      maxLimit: limit,
      buttonLabel: 'Compare All Visible',
      toastMessage: 'No visible components match current filters to compare.',
    };
  }

  const alreadySelectedIds = targetSlice.filter((id) => existingIds.includes(id));
  const allVisibleAlreadyCompared = alreadySelectedIds.length === targetSlice.length && targetSlice.length > 0;

  if (allVisibleAlreadyCompared) {
    return {
      nextCompareIds: existingIds,
      addedIds: [],
      alreadySelectedIds,
      visibleCount,
      eligibleCount,
      cappedAtLimit,
      allVisibleAlreadyCompared: true,
      replacedPreviousFullSelection: false,
      maxLimit: limit,
      buttonLabel: 'Comparing Visible',
      toastMessage: `All ${targetSlice.length} visible component${targetSlice.length === 1 ? '' : 's'} already in comparison.`,
    };
  }

  let nextCompareIds: number[];
  let addedIds: number[];
  let replacedPreviousFullSelection = false;

  if (existingIds.length < limit) {
    nextCompareIds = [...existingIds];
    addedIds = [];
    for (const id of visibleIds) {
      if (nextCompareIds.length >= limit) break;
      if (!nextCompareIds.includes(id)) {
        nextCompareIds.push(id);
        addedIds.push(id);
      }
    }
  } else {
    // Existing selection was already at maxLimit (4) from another filter; load top visible filtered products
    nextCompareIds = [...targetSlice];
    addedIds = targetSlice.filter((id) => !existingIds.includes(id));
    replacedPreviousFullSelection = true;
  }

  const countAdded = addedIds.length;
  const limitSuffix = cappedAtLimit ? ` (max ${limit} limit reached)` : '';
  const toastMessage = replacedPreviousFullSelection
    ? `Loaded top ${nextCompareIds.length} visible component${nextCompareIds.length === 1 ? '' : 's'} into comparison${limitSuffix}.`
    : `Added ${countAdded} visible component${countAdded === 1 ? '' : 's'} to comparison (${nextCompareIds.length}/${limit} selected)${limitSuffix}.`;

  return {
    nextCompareIds,
    addedIds,
    alreadySelectedIds,
    visibleCount,
    eligibleCount,
    cappedAtLimit,
    allVisibleAlreadyCompared: false,
    replacedPreviousFullSelection,
    maxLimit: limit,
    buttonLabel: 'Comparing Visible',
    toastMessage,
  };
}

// ─────────────────────────────────────────────────────────────
// Full Order History Page: Enrichment, Receipt Breakdown & Filtering
// ─────────────────────────────────────────────────────────────

export interface OrderHistoryLineInput {
  productId: number;
  title?: string;
  image?: string;
  price: number;
  qty: number;
  sku?: string;
  category?: string;
}

export interface OrderHistoryRawInput {
  id: string;
  placedAt: number;
  count?: number;
  subtotal?: number;
  rigDiscount?: number;
  promoDiscount?: number;
  discountTotal?: number;
  promoCode?: string | null;
  tax?: number;
  total?: number;
  amountPaid?: number;
  shippingName?: string;
  shippingAddress?: string;
  paymentMethod?: string;
  status?: string;
  lines?: OrderHistoryLineInput[];
}

export interface EnrichedOrderLineItem {
  productId: number;
  sku: string;
  title: string;
  category: string;
  image: string;
  price: number;
  qty: number;
  lineSubtotal: number;
  sharePercent: number;
}

export interface EnrichedOrderHistoryRecord {
  id: string;
  placedAt: number;
  formattedDate: string;
  count: number;
  uniqueSkus: number;
  subtotal: number;
  rigDiscount: number;
  promoDiscount: number;
  discountTotal: number;
  promoCode: string | null;
  tax: number;
  taxRatePercent: number;
  total: number;
  amountPaid: number;
  shippingName: string;
  shippingAddress: string;
  paymentMethod: string;
  status: string;
  rawStatus: string;
  stageKey: OrderTrackingStageKey;
  stageIndex: number;
  progressPercent: number;
  carrierName: string;
  trackingNumber: string;
  estimatedDelivery: string;
  receiptCode: string;
  lines: EnrichedOrderLineItem[];
  timeline: OrderTrackingTimeline;
}

export interface OrderHistorySummaryMetrics {
  totalOrders: number;
  totalSpent: number;
  totalItemsPurchased: number;
  totalSavings: number;
  averageOrderValue: number;
  statusCounts: {
    all: number;
    placed: number;
    processing: number;
    shipped: number;
    delivered: number;
  };
}

export type OrderHistoryStatusFilter = 'all' | 'placed' | 'processing' | 'shipped' | 'delivered';
export type OrderHistorySortOption = 'newest' | 'oldest' | 'total-desc' | 'total-asc' | 'items-desc';

/**
 * Enriches a backend Order record with complete item breakdowns (SKU, category, line subtotals,
 * share of order), receipt metadata, and 4-stage fulfillment status timeline.
 */
export function enrichOrderForHistory(
  order: OrderHistoryRawInput,
  catalogProducts: Array<{ id: number; title?: string; category?: string; image?: string; price?: number }> = [],
  nowMs: number = Date.now()
): EnrichedOrderHistoryRecord {
  const id = String(order?.id || 'VB-0000').trim().toUpperCase();
  const placedAt = typeof order?.placedAt === 'number' && order.placedAt > 0 ? order.placedAt : nowMs;
  const rawLines = Array.isArray(order?.lines) ? order.lines : [];

  let computedSubtotal = 0;
  let computedQtyCount = 0;

  const prelimLines = rawLines.map((ln) => {
    const productId = Math.max(0, Math.floor(Number(ln?.productId) || 0));
    const catalogMatch = catalogProducts.find((p) => p.id === productId);
    const title = String(ln?.title || catalogMatch?.title || `Component #${productId}`).trim();
    const category = String(ln?.category || catalogMatch?.category || classifyComponentGroup({ title })).trim().toLowerCase();
    const sku = String(ln?.sku || getProductSku({ id: productId, title, category })).trim();
    const image = resolveProductImageUrl(
      { id: productId, productId, title, category, image: ln?.image || catalogMatch?.image },
      catalogProducts
    );
    const price = roundMoney(Math.max(0, Number(ln?.price ?? catalogMatch?.price ?? 0)));
    const qty = Math.max(1, Math.floor(Number(ln?.qty) || 1));
    const lineSubtotal = roundMoney(price * qty);

    computedSubtotal = roundMoney(computedSubtotal + lineSubtotal);
    computedQtyCount += qty;

    return {
      productId,
      sku,
      title,
      category,
      image,
      price,
      qty,
      lineSubtotal,
    };
  });

  const subtotal = typeof order?.subtotal === 'number' && order.subtotal > 0
    ? roundMoney(order.subtotal)
    : computedSubtotal;

  const lines: EnrichedOrderLineItem[] = prelimLines.map((item) => ({
    ...item,
    sharePercent: subtotal > 0 ? Math.min(100, Math.max(1, Math.round((item.lineSubtotal / subtotal) * 100))) : 100,
  }));

  const count = typeof order?.count === 'number' && order.count > 0 ? Math.floor(order.count) : computedQtyCount;
  const uniqueSkus = lines.length;
  const rigDiscount = roundMoney(Math.max(0, Number(order?.rigDiscount) || 0));
  const promoDiscount = roundMoney(Math.max(0, Number(order?.promoDiscount) || 0));
  const discountTotal = typeof order?.discountTotal === 'number' && order.discountTotal >= 0
    ? roundMoney(order.discountTotal)
    : roundMoney(rigDiscount + promoDiscount);
  const promoCode = order?.promoCode ? String(order.promoCode).trim().toUpperCase() : null;

  const discountedSubtotal = Math.max(0, roundMoney(subtotal - discountTotal));
  const tax = typeof order?.tax === 'number' && order.tax >= 0
    ? roundMoney(order.tax)
    : roundMoney(discountedSubtotal * DEFAULT_TAX_RATE);
  const total = typeof order?.total === 'number' && order.total > 0
    ? roundMoney(order.total)
    : roundMoney(discountedSubtotal + tax);
  const amountPaid = typeof order?.amountPaid === 'number' && order.amountPaid > 0
    ? roundMoney(order.amountPaid)
    : total;

  const taxRatePercent = discountedSubtotal > 0
    ? Math.round((tax / discountedSubtotal) * 10000) / 100
    : roundMoney(DEFAULT_TAX_RATE * 100);

  const shippingName = String(order?.shippingName || 'Valued Builder').trim() || 'Valued Builder';
  const shippingAddress = String(order?.shippingAddress || '42 Circuit Lane, Silicon Bay').trim() || '42 Circuit Lane, Silicon Bay';
  const rawPay = String(order?.paymentMethod || 'Verified Digital Payment').trim();
  const paymentMethod = rawPay === 'Fake Pay' ? 'Voltbox Instant Pay (Verified)' : rawPay;

  const rawStatus = String(order?.status || '').trim();
  const normalized = normalizeTrackingStatus(rawStatus || 'Order Placed');
  const timeline = resolveOrderTrackingTimeline(
    {
      id,
      placedAt,
      status: rawStatus || normalized.canonicalLabel,
      count,
      total,
      shippingName,
      shippingAddress,
      lines,
    },
    nowMs
  );

  const dateObj = new Date(placedAt);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const cleanCode = id.replace(/[^A-Z0-9]/g, '') || 'VB0000';
  const receiptCode = `RCPT-${cleanCode}-${String(placedAt).slice(-4)}`;

  return {
    id,
    placedAt,
    formattedDate,
    count,
    uniqueSkus,
    subtotal,
    rigDiscount,
    promoDiscount,
    discountTotal,
    promoCode,
    tax,
    taxRatePercent,
    total,
    amountPaid,
    shippingName,
    shippingAddress,
    paymentMethod,
    status: normalized.canonicalLabel,
    rawStatus: rawStatus || normalized.canonicalLabel,
    stageKey: normalized.stageKey,
    stageIndex: normalized.stageIndex,
    progressPercent: timeline.progressPercent,
    carrierName: timeline.carrier.name,
    trackingNumber: timeline.carrier.trackingNumber,
    estimatedDelivery: timeline.estimatedDelivery,
    receiptCode,
    lines,
    timeline,
  };
}

/**
 * Computes summary analytics across a list of enriched or raw orders for the Order History header ribbon.
 */
export function computeOrderHistorySummary(
  orders: Array<EnrichedOrderHistoryRecord | OrderHistoryRawInput>
): OrderHistorySummaryMetrics {
  const safeOrders = Array.isArray(orders) ? orders : [];
  let totalSpent = 0;
  let totalItemsPurchased = 0;
  let totalSavings = 0;
  const statusCounts = {
    all: safeOrders.length,
    placed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
  };

  for (const ord of safeOrders) {
    const total = roundMoney(Math.max(0, Number(ord?.total) || 0));
    const discount = roundMoney(
      Math.max(
        0,
        Number(ord?.discountTotal ?? ((Number(ord?.rigDiscount) || 0) + (Number(ord?.promoDiscount) || 0)))
      )
    );
    const lineCount = Array.isArray(ord?.lines)
      ? ord.lines.reduce((acc, l) => acc + Math.max(1, Math.floor(Number(l?.qty) || 1)), 0)
      : 0;
    const itemCount = typeof ord?.count === 'number' && ord.count > 0 ? Math.floor(ord.count) : lineCount;

    totalSpent = roundMoney(totalSpent + total);
    totalItemsPurchased += itemCount;
    totalSavings = roundMoney(totalSavings + discount);

    const stageKey = 'stageKey' in ord && ord.stageKey
      ? ord.stageKey
      : normalizeTrackingStatus(ord?.status).stageKey;

    if (stageKey === 'delivered') statusCounts.delivered++;
    else if (stageKey === 'shipped') statusCounts.shipped++;
    else if (stageKey === 'processing') statusCounts.processing++;
    else statusCounts.placed++;
  }

  const totalOrders = safeOrders.length;
  const averageOrderValue = totalOrders > 0 ? roundMoney(totalSpent / totalOrders) : 0;

  return {
    totalOrders,
    totalSpent,
    totalItemsPurchased,
    totalSavings,
    averageOrderValue,
    statusCounts,
  };
}

/**
 * Filters and sorts enriched order history records by status stage, search query (ID, title, SKU,
 * recipient, address, payment method), and sort order.
 */
export function filterAndSortOrderHistory(
  orders: EnrichedOrderHistoryRecord[],
  options?: {
    statusFilter?: OrderHistoryStatusFilter | string;
    searchQuery?: string;
    sortBy?: OrderHistorySortOption | string;
  }
): EnrichedOrderHistoryRecord[] {
  const list = Array.isArray(orders) ? [...orders] : [];
  const rawStatusFilter = String(options?.statusFilter || 'all').trim().toLowerCase();
  const query = String(options?.searchQuery || '').trim().toLowerCase();
  const sortBy = String(options?.sortBy || 'newest').trim().toLowerCase();

  const filtered = list.filter((ord) => {
    if (
      rawStatusFilter &&
      rawStatusFilter !== 'all' &&
      ord.stageKey !== rawStatusFilter &&
      ord.status.toLowerCase() !== rawStatusFilter
    ) {
      return false;
    }

    if (query) {
      const lineText = (ord.lines || [])
        .map((ln) => `${ln.title} ${ln.sku} ${ln.category}`)
        .join(' ');
      const haystack = [
        ord.id,
        ord.receiptCode,
        ord.trackingNumber,
        ord.status,
        ord.rawStatus,
        ord.shippingName,
        ord.shippingAddress,
        ord.paymentMethod,
        ord.promoCode || '',
        lineText,
      ]
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(query)) {
        return false;
      }
    }

    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'oldest') {
      return a.placedAt - b.placedAt;
    }
    if (sortBy === 'total-desc') {
      return b.total - a.total || b.placedAt - a.placedAt;
    }
    if (sortBy === 'total-asc') {
      return a.total - b.total || b.placedAt - a.placedAt;
    }
    if (sortBy === 'items-desc') {
      return b.count - a.count || b.placedAt - a.placedAt;
    }
    // Default: newest first
    return b.placedAt - a.placedAt;
  });

  return filtered;
}

// ── Verified Buyer Review & Rating System Pure Logic ──

export interface ProductReview {
  id: string;
  productId: number;
  productTitle?: string;
  sku?: string;
  authorName: string;
  authorEmail: string;
  authorColor: string;
  authorInitial: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  useCaseTag?: string;
  verifiedPurchase: boolean;
  orderId: string | null;
  purchasedAt?: number | null;
  helpfulCount: number;
  helpfulVoterEmails?: string[];
  createdAt: number;
  updatedAt?: number;
}

export interface MatchingPurchaseOrder {
  orderId: string;
  placedAt: number;
  formattedDate: string;
  qty: number;
  price: number;
  status: string;
}

export interface PurchaseVerificationResult {
  productId: number;
  hasPurchased: boolean;
  matchingOrders: MatchingPurchaseOrder[];
  latestOrderId: string | null;
  latestPurchasedAt: number | null;
  totalUnitsPurchased: number;
  existingReview: ProductReview | null;
}

export interface ReviewSubmissionInput {
  productId?: number | string;
  rating?: number | string;
  title?: string;
  comment?: string;
  useCaseTag?: string;
  orderId?: string | null;
}

export interface ReviewValidationResult {
  ok: boolean;
  code?: 'INVALID_PRODUCT' | 'NOT_PURCHASED' | 'INVALID_RATING' | 'TITLE_TOO_SHORT' | 'COMMENT_TOO_SHORT';
  message?: string;
  normalized?: {
    productId: number;
    rating: number;
    title: string;
    comment: string;
    useCaseTag: string;
    orderId: string | null;
  };
}

export interface ProductReviewSummary {
  productId: number;
  reviewCount: number;
  totalRatingCount: number;
  averageRating: number;
  submittedAverageRating: number;
  verifiedPurchaseCount: number;
  recommendPercent: number;
  starCounts: Record<1 | 2 | 3 | 4 | 5, number>;
  starPercentages: Record<1 | 2 | 3 | 4 | 5, number>;
}

export type ProductReviewSortOption = 'newest' | 'highest' | 'lowest' | 'helpful';

export const ALLOWED_REVIEW_USE_CASE_TAGS = [
  'Gaming Rig',
  'AI / Workstation',
  'Creator Build',
  'Silent / Thermal',
  'Drop-In Upgrade',
] as const;

/**
 * Checks whether a shopper has purchased a specific hardware component across their order history,
 * returning matching orders (newest first) and any existing review submitted by that shopper.
 */
export function verifyComponentPurchaseForReview(
  productId: number,
  userOrders: Array<{
    id?: string;
    placedAt?: number;
    status?: string;
    lines?: Array<{
      productId?: number;
      id?: number;
      title?: string;
      price?: number;
      qty?: number;
    }>;
  }> | null | undefined,
  existingProductReviews?: ProductReview[] | null,
  userEmail?: string | null
): PurchaseVerificationResult {
  const targetPid = Math.floor(Number(productId) || 0);
  const orders = Array.isArray(userOrders) ? userOrders : [];
  const matchingOrders: MatchingPurchaseOrder[] = [];
  let totalUnitsPurchased = 0;

  for (const ord of orders) {
    const lines = Array.isArray(ord?.lines) ? ord.lines : [];
    let matchedQty = 0;
    let matchedPrice = 0;
    for (const ln of lines) {
      const lnPid = Math.floor(Number(ln?.productId ?? ln?.id ?? 0));
      if (lnPid === targetPid && targetPid > 0) {
        const q = Math.max(1, Math.floor(Number(ln?.qty) || 1));
        matchedQty += q;
        matchedPrice = roundMoney(Math.max(0, Number(ln?.price) || 0));
      }
    }
    if (matchedQty > 0) {
      const placedAt = Number(ord?.placedAt) > 0 ? Number(ord.placedAt) : Date.now();
      const formattedDate = new Date(placedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      matchingOrders.push({
        orderId: String(ord?.id || 'VB-0000').trim(),
        placedAt,
        formattedDate,
        qty: matchedQty,
        price: matchedPrice,
        status: normalizeTrackingStatus(ord?.status || 'Order Placed').canonicalLabel,
      });
      totalUnitsPurchased += matchedQty;
    }
  }

  matchingOrders.sort((a, b) => b.placedAt - a.placedAt);

  const cleanEmail = String(userEmail || '').trim().toLowerCase();
  const reviews = Array.isArray(existingProductReviews) ? existingProductReviews : [];
  const existingReview =
    cleanEmail && targetPid > 0
      ? reviews.find(
          (r) =>
            Number(r?.productId) === targetPid &&
            String(r?.authorEmail || '').trim().toLowerCase() === cleanEmail
        ) || null
      : null;

  return {
    productId: targetPid,
    hasPurchased: matchingOrders.length > 0,
    matchingOrders,
    latestOrderId: matchingOrders.length > 0 ? matchingOrders[0].orderId : null,
    latestPurchasedAt: matchingOrders.length > 0 ? matchingOrders[0].placedAt : null,
    totalUnitsPurchased,
    existingReview,
  };
}

/**
 * Validates a shopper's review submission and enforces verified purchase eligibility.
 */
export function validateProductReviewSubmission(
  input: ReviewSubmissionInput,
  eligibility: Pick<PurchaseVerificationResult, 'hasPurchased' | 'matchingOrders' | 'latestOrderId'>
): ReviewValidationResult {
  const productId = Math.floor(Number(input?.productId) || 0);
  if (productId <= 0) {
    return {
      ok: false,
      code: 'INVALID_PRODUCT',
      message: 'A valid hardware component ID is required to submit a review.',
    };
  }

  if (!eligibility || !eligibility.hasPurchased) {
    return {
      ok: false,
      code: 'NOT_PURCHASED',
      message: 'Only shoppers who have purchased this hardware component can submit a verified review.',
    };
  }

  const rawRating = Number(input?.rating);
  if (Number.isNaN(rawRating) || rawRating < 1 || rawRating > 5) {
    return {
      ok: false,
      code: 'INVALID_RATING',
      message: 'Please select a star rating between 1 and 5 stars.',
    };
  }
  const rating = Math.min(5, Math.max(1, Math.round(rawRating)));

  const rawTitle = String(input?.title || '').trim().replace(/\s+/g, ' ');
  if (rawTitle.length < 3) {
    return {
      ok: false,
      code: 'TITLE_TOO_SHORT',
      message: 'Please enter a review headline (at least 3 characters).',
    };
  }
  const title = rawTitle.slice(0, 120);

  const rawComment = String(input?.comment || '').trim();
  if (rawComment.length < 8) {
    return {
      ok: false,
      code: 'COMMENT_TOO_SHORT',
      message: 'Please share at least 8 characters of feedback about this component.',
    };
  }
  const comment = rawComment.slice(0, 1200);

  const rawTag = String(input?.useCaseTag || '').trim();
  const useCaseTag = rawTag ? rawTag.slice(0, 40) : 'Gaming Rig';

  const requestedOrderId = String(input?.orderId || '').trim();
  const validOrderIds = new Set((eligibility.matchingOrders || []).map((o) => o.orderId));
  const resolvedOrderId =
    requestedOrderId && validOrderIds.has(requestedOrderId)
      ? requestedOrderId
      : eligibility.latestOrderId || (eligibility.matchingOrders?.[0]?.orderId ?? null);

  return {
    ok: true,
    normalized: {
      productId,
      rating,
      title,
      comment,
      useCaseTag,
      orderId: resolvedOrderId,
    },
  };
}

/**
 * Computes aggregate rating score, star distribution counts/percentages, and recommendation rate
 * across submitted reviews for a component.
 */
export function computeProductReviewSummary(
  reviews: ProductReview[] | null | undefined,
  productId = 0,
  fallbackRatingRate = 0
): ProductReviewSummary {
  const list = Array.isArray(reviews) ? reviews.filter((r) => r && Number(r.rating) >= 1 && Number(r.rating) <= 5) : [];
  const starCounts: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let sumRatings = 0;
  let verifiedCount = 0;
  let recommendedCount = 0;

  for (const rev of list) {
    const r = Math.min(5, Math.max(1, Math.round(Number(rev.rating) || 5))) as 1 | 2 | 3 | 4 | 5;
    starCounts[r] = (starCounts[r] || 0) + 1;
    sumRatings += r;
    if (rev.verifiedPurchase) verifiedCount++;
    if (r >= 4) recommendedCount++;
  }

  const reviewCount = list.length;
  const submittedAverageRating = reviewCount > 0 ? Math.round((sumRatings / reviewCount) * 10) / 10 : 0;
  const averageRating =
    reviewCount > 0
      ? submittedAverageRating
      : fallbackRatingRate > 0
      ? Math.round(Number(fallbackRatingRate) * 10) / 10
      : 0;

  const starPercentages: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: reviewCount > 0 ? Math.round((starCounts[1] / reviewCount) * 100) : 0,
    2: reviewCount > 0 ? Math.round((starCounts[2] / reviewCount) * 100) : 0,
    3: reviewCount > 0 ? Math.round((starCounts[3] / reviewCount) * 100) : 0,
    4: reviewCount > 0 ? Math.round((starCounts[4] / reviewCount) * 100) : 0,
    5: reviewCount > 0 ? Math.round((starCounts[5] / reviewCount) * 100) : 0,
  };

  const recommendPercent = reviewCount > 0 ? Math.round((recommendedCount / reviewCount) * 100) : 100;

  return {
    productId: Math.floor(Number(productId) || 0),
    reviewCount,
    totalRatingCount: reviewCount,
    averageRating,
    submittedAverageRating,
    verifiedPurchaseCount: verifiedCount,
    recommendPercent,
    starCounts,
    starPercentages,
  };
}

/**
 * Filters and sorts product reviews by star rating, search query, and sort order.
 */
export function filterAndSortProductReviews(
  reviews: ProductReview[] | null | undefined,
  options?: {
    starFilter?: number | 'all' | string;
    sortBy?: ProductReviewSortOption | string;
    searchQuery?: string;
  }
): ProductReview[] {
  const list = Array.isArray(reviews) ? [...reviews] : [];
  const rawStar = options?.starFilter;
  const starNum = rawStar !== undefined && rawStar !== 'all' && rawStar !== '' ? Math.round(Number(rawStar)) : 0;
  const sortBy = String(options?.sortBy || 'newest').trim().toLowerCase();
  const query = String(options?.searchQuery || '').trim().toLowerCase();

  const filtered = list.filter((rev) => {
    if (starNum >= 1 && starNum <= 5) {
      if (Math.round(Number(rev.rating)) !== starNum) return false;
    }
    if (query) {
      const hay = [
        rev.title,
        rev.comment,
        rev.authorName,
        rev.useCaseTag || '',
        rev.orderId || '',
        rev.sku || '',
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'highest') {
      return b.rating - a.rating || b.helpfulCount - a.helpfulCount || b.createdAt - a.createdAt;
    }
    if (sortBy === 'lowest') {
      return a.rating - b.rating || b.createdAt - a.createdAt;
    }
    if (sortBy === 'helpful') {
      return b.helpfulCount - a.helpfulCount || b.rating - a.rating || b.createdAt - a.createdAt;
    }
    // Default: newest first
    return b.createdAt - a.createdAt;
  });

  return filtered;
}

// ============================================================================
// Admin Catalog Batch Edit Mode & Single-Transaction Bulk Updates
// ============================================================================

export type BatchPriceOperationMode = 'none' | 'percent' | 'delta' | 'set';
export type BatchStockOperationMode = 'none' | 'delta' | 'set';

export interface BatchEditOperationInput {
  productIds: Array<number | string>;
  priceMode?: BatchPriceOperationMode | string;
  priceValue?: number | string | null;
  stockMode?: BatchStockOperationMode | string;
  stockValue?: number | string | null;
  reason?: string;
}

export interface BatchProductMutationPreview {
  productId: number;
  sku: string;
  title: string;
  category: string;
  previousPrice: number;
  nextPrice: number;
  priceDelta: number;
  priceChanged: boolean;
  previousStock: number;
  nextStock: number;
  stockDelta: number;
  stockChanged: boolean;
  nextLowStock: boolean;
}

export interface BatchEditTransactionPlan {
  ok: boolean;
  code?:
    | 'NO_PRODUCTS_SELECTED'
    | 'NO_OPERATION_SPECIFIED'
    | 'INVALID_PRICE_VALUE'
    | 'INVALID_STOCK_VALUE'
    | 'NO_MATCHING_PRODUCTS';
  message?: string;
  transactionId: string;
  selectedCount: number;
  updatedCount: number;
  priceChangedCount: number;
  stockChangedCount: number;
  totalPriceDeltaPerUnit: number;
  totalStockUnitsDelta: number;
  previousValuation: number;
  nextValuation: number;
  valuationDelta: number;
  normalizedReason: string;
  priceMode: BatchPriceOperationMode;
  priceValue: number | null;
  stockMode: BatchStockOperationMode;
  stockValue: number | null;
  mutations: BatchProductMutationPreview[];
}

/**
 * Pure selection state helper for toggling, adding, removing, or replacing product IDs in Batch Edit Mode.
 */
export function toggleBatchSelectionIds(
  currentIds: Array<number | string> | null | undefined,
  targetIds: number | string | Array<number | string>,
  mode: 'toggle' | 'add' | 'remove' | 'replace' | 'clear' = 'toggle'
): number[] {
  if (mode === 'clear') {
    return [];
  }

  const normalizeIds = (arr: Array<number | string>): number[] => {
    const out: number[] = [];
    const seen = new Set<number>();
    for (const raw of arr) {
      const id = Math.floor(Number(raw) || 0);
      if (id > 0 && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
    return out;
  };

  const baseList = Array.isArray(currentIds) ? normalizeIds(currentIds) : [];
  const targets = normalizeIds(Array.isArray(targetIds) ? targetIds : [targetIds]);

  if (mode === 'replace') {
    return targets;
  }

  const set = new Set<number>(baseList);

  if (mode === 'add') {
    for (const id of targets) set.add(id);
    return Array.from(set);
  }

  if (mode === 'remove') {
    for (const id of targets) set.delete(id);
    return Array.from(set);
  }

  // Default: 'toggle'
  for (const id of targets) {
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
  }
  return Array.from(set);
}

/**
 * Computes the next unit price for a single product under a batch price operation.
 */
export function computeBatchProductPrice(
  currentPrice: number,
  priceMode?: BatchPriceOperationMode | string,
  priceValue?: number | string | null
): {
  ok: boolean;
  nextPrice: number;
  delta: number;
  changed: boolean;
  error?: string;
} {
  const basePrice = Math.max(0.01, roundMoney(Number(currentPrice) || 0));
  const mode = String(priceMode || 'none').trim().toLowerCase();

  if (!mode || mode === 'none') {
    return {
      ok: true,
      nextPrice: basePrice,
      delta: 0,
      changed: false,
    };
  }

  if (priceValue === undefined || priceValue === null || String(priceValue).trim() === '') {
    return {
      ok: false,
      nextPrice: basePrice,
      delta: 0,
      changed: false,
      error: 'Enter a numeric value for the bulk price update.',
    };
  }

  const val = Number(priceValue);
  if (!Number.isFinite(val)) {
    return {
      ok: false,
      nextPrice: basePrice,
      delta: 0,
      changed: false,
      error: 'Price adjustment value must be a valid number.',
    };
  }

  let computed = basePrice;
  if (mode === 'set') {
    if (val < 1 || val > 50000) {
      return {
        ok: false,
        nextPrice: basePrice,
        delta: 0,
        changed: false,
        error: 'Exact unit price must be between $1.00 and $50,000.00.',
      };
    }
    computed = roundMoney(val);
  } else if (mode === 'delta') {
    if (val < -10000 || val > 10000) {
      return {
        ok: false,
        nextPrice: basePrice,
        delta: 0,
        changed: false,
        error: 'Fixed price offset must be between -$10,000.00 and +$10,000.00.',
      };
    }
    computed = Math.max(1.0, roundMoney(basePrice + val));
  } else if (mode === 'percent') {
    if (val <= -95 || val > 500) {
      return {
        ok: false,
        nextPrice: basePrice,
        delta: 0,
        changed: false,
        error: 'Percentage price change must be between -95% and +500%.',
      };
    }
    computed = Math.max(1.0, roundMoney(basePrice * (1 + val / 100)));
  } else {
    return {
      ok: false,
      nextPrice: basePrice,
      delta: 0,
      changed: false,
      error: `Unsupported price operation mode: ${mode}`,
    };
  }

  const delta = roundMoney(computed - basePrice);
  return {
    ok: true,
    nextPrice: computed,
    delta,
    changed: Math.abs(delta) >= 0.01,
  };
}

/**
 * Computes the next stock quantity for a single product under a batch stock operation.
 */
export function computeBatchProductStock(
  currentStock: number,
  stockMode?: BatchStockOperationMode | string,
  stockValue?: number | string | null
): {
  ok: boolean;
  nextStock: number;
  delta: number;
  changed: boolean;
  error?: string;
} {
  const baseStock = Math.max(0, Math.floor(Number(currentStock) || 0));
  const mode = String(stockMode || 'none').trim().toLowerCase();

  if (!mode || mode === 'none') {
    return {
      ok: true,
      nextStock: baseStock,
      delta: 0,
      changed: false,
    };
  }

  if (stockValue === undefined || stockValue === null || String(stockValue).trim() === '') {
    return {
      ok: false,
      nextStock: baseStock,
      delta: 0,
      changed: false,
      error: 'Enter an integer quantity for the bulk stock adjustment.',
    };
  }

  const val = Number(stockValue);
  if (!Number.isFinite(val)) {
    return {
      ok: false,
      nextStock: baseStock,
      delta: 0,
      changed: false,
      error: 'Stock adjustment value must be a valid integer.',
    };
  }

  const intVal = Math.round(val);
  let computed = baseStock;

  if (mode === 'set') {
    if (intVal < 0 || intVal > 9999) {
      return {
        ok: false,
        nextStock: baseStock,
        delta: 0,
        changed: false,
        error: 'Exact stock quantity must be between 0 and 9,999 units.',
      };
    }
    computed = intVal;
  } else if (mode === 'delta') {
    if (intVal < -9999 || intVal > 9999) {
      return {
        ok: false,
        nextStock: baseStock,
        delta: 0,
        changed: false,
        error: 'Stock adjustment delta must be between -9,999 and +9,999 units.',
      };
    }
    computed = Math.max(0, Math.min(9999, baseStock + intVal));
  } else {
    return {
      ok: false,
      nextStock: baseStock,
      delta: 0,
      changed: false,
      error: `Unsupported stock operation mode: ${mode}`,
    };
  }

  const delta = computed - baseStock;
  return {
    ok: true,
    nextStock: computed,
    delta,
    changed: delta !== 0,
  };
}

/**
 * Plans and validates a single-transaction bulk price and/or stock update across multiple selected catalog products.
 */
export function planBatchProductTransaction(
  catalog: Array<{
    id: number;
    title?: string;
    name?: string;
    category?: string;
    sku?: string;
    price: number;
    quantity?: number;
    stock?: number;
    stockQuantity?: number;
    takenDown?: boolean;
  }>,
  input: BatchEditOperationInput,
  timestampMs = Date.now()
): BatchEditTransactionPlan {
  const normalizedIds = toggleBatchSelectionIds([], input?.productIds || [], 'replace');
  const rawPriceMode = String(input?.priceMode || 'none').trim().toLowerCase();
  const priceMode: BatchPriceOperationMode =
    rawPriceMode === 'percent' || rawPriceMode === 'delta' || rawPriceMode === 'set'
      ? rawPriceMode
      : 'none';

  const rawStockMode = String(input?.stockMode || 'none').trim().toLowerCase();
  const stockMode: BatchStockOperationMode =
    rawStockMode === 'delta' || rawStockMode === 'set' ? rawStockMode : 'none';

  const txSuffix = Math.abs(Math.floor(Number(timestampMs) || Date.now()))
    .toString(36)
    .toUpperCase()
    .slice(-5)
    .padStart(5, '0');
  const transactionId = `TX-BATCH-${txSuffix}`;

  const rawReason = String(input?.reason || '').trim();
  const defaultReasonParts: string[] = [];
  if (priceMode !== 'none' && input?.priceValue !== undefined && input?.priceValue !== null && String(input.priceValue).trim() !== '') {
    const pv = Number(input.priceValue);
    if (priceMode === 'percent') defaultReasonParts.push(`Price ${pv >= 0 ? '+' : ''}${pv}%`);
    else if (priceMode === 'delta') defaultReasonParts.push(`Price ${pv >= 0 ? '+$' : '-$'}${Math.abs(pv).toFixed(2)}`);
    else if (priceMode === 'set') defaultReasonParts.push(`Price set to $${pv.toFixed(2)}`);
  }
  if (stockMode !== 'none' && input?.stockValue !== undefined && input?.stockValue !== null && String(input.stockValue).trim() !== '') {
    const sv = Math.round(Number(input.stockValue));
    if (stockMode === 'delta') defaultReasonParts.push(`Stock ${sv >= 0 ? '+' : ''}${sv} units`);
    else if (stockMode === 'set') defaultReasonParts.push(`Stock set to ${sv} units`);
  }
  const normalizedReason =
    rawReason ||
    (defaultReasonParts.length > 0
      ? `Admin Batch Edit (${defaultReasonParts.join(' · ')})`
      : 'Admin Batch Catalog Update');

  const emptyPlan = (
    code: NonNullable<BatchEditTransactionPlan['code']>,
    message: string
  ): BatchEditTransactionPlan => ({
    ok: false,
    code,
    message,
    transactionId,
    selectedCount: normalizedIds.length,
    updatedCount: 0,
    priceChangedCount: 0,
    stockChangedCount: 0,
    totalPriceDeltaPerUnit: 0,
    totalStockUnitsDelta: 0,
    previousValuation: 0,
    nextValuation: 0,
    valuationDelta: 0,
    normalizedReason,
    priceMode,
    priceValue: input?.priceValue != null && String(input.priceValue).trim() !== '' ? Number(input.priceValue) : null,
    stockMode,
    stockValue: input?.stockValue != null && String(input.stockValue).trim() !== '' ? Math.round(Number(input.stockValue)) : null,
    mutations: [],
  });

  if (normalizedIds.length === 0) {
    return emptyPlan('NO_PRODUCTS_SELECTED', 'Select at least one product in the catalog to apply a batch update.');
  }

  if (priceMode === 'none' && stockMode === 'none') {
    return emptyPlan(
      'NO_OPERATION_SPECIFIED',
      'Choose a bulk price update or a bulk stock adjustment to apply.'
    );
  }

  // Validate price and stock inputs upfront
  if (priceMode !== 'none') {
    const priceCheck = computeBatchProductPrice(100, priceMode, input?.priceValue);
    if (!priceCheck.ok) {
      return emptyPlan('INVALID_PRICE_VALUE', priceCheck.error || 'Invalid bulk price value.');
    }
  }

  if (stockMode !== 'none') {
    const stockCheck = computeBatchProductStock(10, stockMode, input?.stockValue);
    if (!stockCheck.ok) {
      return emptyPlan('INVALID_STOCK_VALUE', stockCheck.error || 'Invalid bulk stock value.');
    }
  }

  const catalogList = Array.isArray(catalog) ? catalog : [];
  const byId = new Map<number, (typeof catalogList)[number]>();
  for (const p of catalogList) {
    if (p && typeof p.id === 'number') {
      byId.set(p.id, p);
    }
  }

  const mutations: BatchProductMutationPreview[] = [];
  let updatedCount = 0;
  let priceChangedCount = 0;
  let stockChangedCount = 0;
  let totalPriceDeltaPerUnit = 0;
  let totalStockUnitsDelta = 0;
  let previousValuation = 0;
  let nextValuation = 0;

  for (const pid of normalizedIds) {
    const prod = byId.get(pid);
    if (!prod) continue;

    const prevPrice = roundMoney(Number(prod.price) || 0);
    const prevStock =
      typeof prod.stockQuantity === 'number'
        ? Math.max(0, Math.floor(prod.stockQuantity))
        : getProductQuantity(prod);

    const priceRes = computeBatchProductPrice(prevPrice, priceMode, input?.priceValue);
    const stockRes = computeBatchProductStock(prevStock, stockMode, input?.stockValue);

    const sku = prod.sku || getProductSku({ id: prod.id, category: prod.category });
    const title = String(prod.title || prod.name || `Component #${prod.id}`).trim();
    const category = String(prod.category || 'components').trim();

    if (priceRes.changed) priceChangedCount++;
    if (stockRes.changed) stockChangedCount++;
    if (priceRes.changed || stockRes.changed) updatedCount++;

    totalPriceDeltaPerUnit = roundMoney(totalPriceDeltaPerUnit + priceRes.delta);
    totalStockUnitsDelta += stockRes.delta;

    previousValuation = roundMoney(previousValuation + prevPrice * prevStock);
    nextValuation = roundMoney(nextValuation + priceRes.nextPrice * stockRes.nextStock);

    mutations.push({
      productId: prod.id,
      sku,
      title,
      category,
      previousPrice: prevPrice,
      nextPrice: priceRes.nextPrice,
      priceDelta: priceRes.delta,
      priceChanged: priceRes.changed,
      previousStock: prevStock,
      nextStock: stockRes.nextStock,
      stockDelta: stockRes.delta,
      stockChanged: stockRes.changed,
      nextLowStock: isLowStock({ quantity: stockRes.nextStock }),
    });
  }

  if (mutations.length === 0) {
    return emptyPlan('NO_MATCHING_PRODUCTS', 'None of the selected product IDs exist in the catalog.');
  }

  return {
    ok: true,
    transactionId,
    selectedCount: mutations.length,
    updatedCount,
    priceChangedCount,
    stockChangedCount,
    totalPriceDeltaPerUnit,
    totalStockUnitsDelta,
    previousValuation,
    nextValuation,
    valuationDelta: roundMoney(nextValuation - previousValuation),
    normalizedReason,
    priceMode,
    priceValue: input?.priceValue != null && String(input.priceValue).trim() !== '' ? Number(input.priceValue) : null,
    stockMode,
    stockValue: input?.stockValue != null && String(input.stockValue).trim() !== '' ? Math.round(Number(input.stockValue)) : null,
    mutations,
  };
}

// ============================================================================
// 26. ADVANCED PRICE TRENDS & 6-MONTH VOLATILITY INDEX ANALYTICS (D3 MODEL)
// ============================================================================

export type VolatilityRegimeTier = 'low' | 'moderate' | 'elevated' | 'high';

export interface AdvancedPriceTrendPoint {
  index: number;
  month: string;
  price: number;
  marketAvg: number;
  rollingMean: number;
  rollingStdDev: number;
  upperBand: number;
  lowerBand: number;
  monthlyChangeUsd: number;
  monthlyChangePct: number;
  absMonthlySwingPct: number;
  deviationFromSixMonthMeanPct: number;
  zScore: number;
  volatilityIndex: number; // 0 to 100
  volatilityRegime: VolatilityRegimeTier;
}

export type VolatilityEventSeverity = 'peak-spike' | 'elevated-swing' | 'drawdown-trough';

export interface VolatilityEventFlag {
  month: string;
  index: number;
  severity: VolatilityEventSeverity;
  badgeLabel: string;
  shortTag: string;
  headline: string;
  summary: string;
  price: number;
  volatilityIndex: number;
  monthlyChangeUsd: number;
  monthlyChangePct: number;
  zScore: number;
  isPrimaryPeak: boolean;
}

export interface HighVolatilityThresholdConfig {
  enabled: boolean;
  sigmaThreshold: number; // e.g. 1.0, 1.5, 2.0 (default 2.0)
}

export interface VolatilityThresholdBreach {
  month: string;
  index: number;
  price: number;
  volatilityIndex: number;
  thresholdVolatilityIndex: number;
  exceedanceVolPoints: number;
  effectiveSigmaScore: number;
  priceZScore: number;
  monthlyChangePct: number;
  shortMarkerLabel: string;
  badgeText: string;
  summary: string;
}

export interface HighVolatilityThresholdEvaluation {
  enabled: boolean;
  sigmaThreshold: number;
  sigmaLabel: string;
  seriesMeanVolatility: number;
  seriesStdDevVolatility: number;
  thresholdVolatilityIndex: number;
  zScoreCutoff: number;
  breachCount: number;
  breachedMonths: string[];
  breaches: VolatilityThresholdBreach[];
  statusSummary: string;
}

export interface AdvancedPriceTrendsAnalytics {
  sixMonthMean: number;
  sixMonthLow: number;
  sixMonthHigh: number;
  currentPrice: number;
  standardDeviationUsd: number;
  coefficientOfVariationPct: number;
  sixMonthVolatilityIndex: number; // 0 to 100 composite score
  peakMonthlyVolatilityIndex: number;
  peakVolatilityMonth: string;
  volatilityRegime: VolatilityRegimeTier;
  volatilityRegimeLabel: 'Low Volatility' | 'Moderate Volatility' | 'Elevated Volatility' | 'High Volatility';
  maxDrawdownPct: number;
  priceRangeSpreadUsd: number;
  priceRangeSpreadPct: number;
  currentZScore: number;
  buySignalLabel: 'Strong Buy Zone' | 'Below 6M Mean' | 'Fair Value Band' | 'Above 6M Mean';
  buySignalReason: string;
  points: AdvancedPriceTrendPoint[];
  peakEvents: VolatilityEventFlag[];
  highVolatilityThreshold: HighVolatilityThresholdEvaluation;
}

export function classifyVolatilityRegime(indexScore: number): {
  regime: VolatilityRegimeTier;
  label: 'Low Volatility' | 'Moderate Volatility' | 'Elevated Volatility' | 'High Volatility';
} {
  const s = Number.isFinite(indexScore) ? indexScore : 0;
  if (s >= 65) {
    return { regime: 'high', label: 'High Volatility' };
  }
  if (s >= 42) {
    return { regime: 'elevated', label: 'Elevated Volatility' };
  }
  if (s >= 22) {
    return { regime: 'moderate', label: 'Moderate Volatility' };
  }
  return { regime: 'low', label: 'Low Volatility' };
}

/**
 * Automatically detects and flags peak volatility events and major price swing inflection
 * months across a 6-month component price series for D3 vertical marker and tooltip rendering.
 */
export function detectPeakVolatilityEvents(
  points: AdvancedPriceTrendPoint[],
  sixMonthLow?: number
): VolatilityEventFlag[] {
  if (!Array.isArray(points) || points.length === 0) {
    return [];
  }

  // Check if series has any non-zero volatility
  const maxVol = Math.max(...points.map((p) => p.volatilityIndex));
  if (maxVol <= 0.05) {
    return [];
  }

  // 1. Identify primary peak volatility month (highest volatilityIndex)
  let primaryIdx = 0;
  for (let i = 0; i < points.length; i++) {
    if (points[i].volatilityIndex >= points[primaryIdx].volatilityIndex) {
      primaryIdx = i;
    }
  }

  const flaggedIndices = new Set<number>([primaryIdx]);

  // 2. Identify deepest trough / drawdown or second-highest elevated volatility spike (>= 50v or |MoM| >= 8%)
  const rankedByVol = points
    .map((pt, idx) => ({ pt, idx }))
    .filter(({ idx, pt }) => idx !== primaryIdx && (pt.volatilityIndex >= 50 || Math.abs(pt.monthlyChangePct) >= 8))
    .sort((a, b) => b.pt.volatilityIndex - a.pt.volatilityIndex);

  if (rankedByVol.length > 0) {
    flaggedIndices.add(rankedByVol[0].idx);
  } else if (typeof sixMonthLow === 'number') {
    const troughIdx = points.findIndex(
      (pt, idx) => idx !== primaryIdx && Math.abs(pt.price - sixMonthLow) < 0.02 && pt.volatilityIndex >= 22
    );
    if (troughIdx !== -1) {
      flaggedIndices.add(troughIdx);
    }
  }

  const orderedIndices = Array.from(flaggedIndices).sort((a, b) => a - b);

  return orderedIndices.map((idx) => {
    const pt = points[idx];
    const isPrimaryPeak = idx === primaryIdx;
    const isTrough =
      typeof sixMonthLow === 'number' && Math.abs(pt.price - sixMonthLow) < 0.02 && pt.monthlyChangePct < 0;

    const severity: VolatilityEventSeverity = isPrimaryPeak
      ? 'peak-spike'
      : isTrough
        ? 'drawdown-trough'
        : 'elevated-swing';

    const momSign = pt.monthlyChangePct > 0 ? '+' : '';
    const usdSign = pt.monthlyChangeUsd > 0 ? '+$' : '-$';
    const absUsd = Math.abs(pt.monthlyChangeUsd).toFixed(2);

    const shortTag = isPrimaryPeak
      ? `PEAK ${pt.volatilityIndex.toFixed(0)}v`
      : isTrough
        ? `LOW $${pt.price.toFixed(0)}`
        : `SWING ${pt.volatilityIndex.toFixed(0)}v`;

    const badgeLabel = isPrimaryPeak
      ? `⚡ ${pt.month} Peak · ${pt.volatilityIndex.toFixed(1)}v (${momSign}${pt.monthlyChangePct.toFixed(1)}%)`
      : isTrough
        ? `↘ ${pt.month} 6M Trough · $${pt.price.toFixed(2)} (${momSign}${pt.monthlyChangePct.toFixed(1)}%)`
        : `Δ ${pt.month} Swing · ${pt.volatilityIndex.toFixed(1)}v (${momSign}${pt.monthlyChangePct.toFixed(1)}%)`;

    const headline = isPrimaryPeak
      ? `${pt.month} Peak Volatility Spike (${pt.volatilityIndex.toFixed(1)} / 100)`
      : isTrough
        ? `${pt.month} 6-Month Support Trough ($${pt.price.toFixed(2)})`
        : `${pt.month} Elevated Price Swing (${pt.volatilityIndex.toFixed(1)} / 100)`;

    const directionPhrase =
      pt.monthlyChangePct < -0.05
        ? `dropped ${pt.monthlyChangePct.toFixed(2)}% MoM (${usdSign}${absUsd})`
        : pt.monthlyChangePct > 0.05
          ? `surged +${pt.monthlyChangePct.toFixed(2)}% MoM (${usdSign}${absUsd})`
          : `stabilized at $${pt.price.toFixed(2)}`;

    const summary = `Spot price ${directionPhrase} to $${pt.price.toFixed(2)} (${pt.zScore >= 0 ? '+' : ''}${pt.zScore.toFixed(2)}σ vs 6M mean).`;

    return {
      month: pt.month,
      index: pt.index,
      severity,
      badgeLabel,
      shortTag,
      headline,
      summary,
      price: pt.price,
      volatilityIndex: pt.volatilityIndex,
      monthlyChangeUsd: pt.monthlyChangeUsd,
      monthlyChangePct: pt.monthlyChangePct,
      zScore: pt.zScore,
      isPrimaryPeak,
    };
  });
}

/**
 * Normalizes a requested volatility standard-deviation multiplier (e.g., 1.0, 1.5, 2.0)
 * into a safe finite range [0.5, 3.5], defaulting to 2.0σ.
 */
export function normalizeVolatilitySigmaThreshold(rawSigma?: number | string | null): number {
  const num = Number(rawSigma);
  if (!Number.isFinite(num) || num <= 0) {
    return 2.0;
  }
  return roundMoney(Math.max(0.5, Math.min(3.5, num)));
}

/**
 * Evaluates a 6-month volatility series against a configurable standard-deviation threshold
 * (e.g., 2.0σ, 1.5σ, 1.0σ) and returns all periods where the volatility index or standardized
 * deviation exceeds the threshold for automatic D3 highlighting.
 */
export function evaluateHighVolatilityThreshold(
  points: AdvancedPriceTrendPoint[],
  config?: Partial<HighVolatilityThresholdConfig>
): HighVolatilityThresholdEvaluation {
  const enabled = config?.enabled !== undefined ? Boolean(config.enabled) : true;
  const sigmaThreshold = normalizeVolatilitySigmaThreshold(config?.sigmaThreshold);
  const sigmaLabel = `${sigmaThreshold.toFixed(1)}σ`;

  if (!Array.isArray(points) || points.length === 0) {
    return {
      enabled,
      sigmaThreshold,
      sigmaLabel,
      seriesMeanVolatility: 0,
      seriesStdDevVolatility: 0,
      thresholdVolatilityIndex: roundMoney(Math.min(92, Math.max(35, 25 + sigmaThreshold * 25))),
      zScoreCutoff: sigmaThreshold,
      breachCount: 0,
      breachedMonths: [],
      breaches: [],
      statusSummary: enabled
        ? `No periods exceed ${sigmaLabel} threshold`
        : `High Volatility Threshold (${sigmaLabel}) disabled`,
    };
  }

  const volValues = points.map((p) => Number(p.volatilityIndex) || 0);
  const seriesMeanVolatility = roundMoney(
    volValues.reduce((a, b) => a + b, 0) / Math.max(1, volValues.length)
  );
  const volVariance =
    volValues.reduce((acc, v) => acc + Math.pow(v - seriesMeanVolatility, 2), 0) /
    Math.max(1, volValues.length);
  const seriesStdDevVolatility = roundMoney(Math.sqrt(volVariance));

  // Calibrated volatility index threshold: baseline calm mean (25v) + sigmaThreshold * 25v
  // (1.0σ -> 50.0v, 1.5σ -> 62.5v, 2.0σ -> 75.0v)
  const thresholdVolatilityIndex = roundMoney(
    Math.min(92, Math.max(35, 25 + sigmaThreshold * 25))
  );

  // Calibrated Z-score cutoff for the Z-Score view mode
  const zScoreCutoff = roundMoney(Math.max(0.65, sigmaThreshold * 0.72));

  const maxVol = Math.max(...volValues);
  const breaches: VolatilityThresholdBreach[] = [];

  if (maxVol > 0.05) {
    for (const pt of points) {
      const effectiveSigmaScore = roundMoney(
        Math.max(Math.abs(pt.zScore), Math.max(0, (pt.volatilityIndex - 25) / 25))
      );
      const isBreach =
        pt.volatilityIndex >= thresholdVolatilityIndex ||
        Math.abs(pt.zScore) >= sigmaThreshold;

      if (isBreach) {
        const exceedanceVolPoints = roundMoney(
          Math.max(0, pt.volatilityIndex - thresholdVolatilityIndex)
        );
        const momSign = pt.monthlyChangePct > 0 ? '+' : '';
        const shortMarkerLabel = `>${sigmaLabel} (${ effectiveSigmaScore.toFixed(1)}σ)`;
        const badgeText = `${pt.month} · ${pt.volatilityIndex.toFixed(1)}v (${effectiveSigmaScore.toFixed(2)}σ)`;
        const summary = `${pt.month} volatility (${pt.volatilityIndex.toFixed(1)}v, ${effectiveSigmaScore.toFixed(2)}σ) exceeds the ${sigmaLabel} threshold (${thresholdVolatilityIndex.toFixed(1)}v cutoff; ${momSign}${pt.monthlyChangePct.toFixed(1)}% MoM).`;

        breaches.push({
          month: pt.month,
          index: pt.index,
          price: pt.price,
          volatilityIndex: pt.volatilityIndex,
          thresholdVolatilityIndex,
          exceedanceVolPoints,
          effectiveSigmaScore,
          priceZScore: pt.zScore,
          monthlyChangePct: pt.monthlyChangePct,
          shortMarkerLabel,
          badgeText,
          summary,
        });
      }
    }
  }

  const breachedMonths = breaches.map((b) => b.month);
  const breachCount = breaches.length;
  const statusSummary = !enabled
    ? `Threshold markers hidden (${sigmaLabel} ≥ ${thresholdVolatilityIndex.toFixed(0)}v)`
    : breachCount > 0
      ? `Cutoff ≥${thresholdVolatilityIndex.toFixed(0)}v (${sigmaLabel}) · ${breachCount} ${breachCount === 1 ? 'Period' : 'Periods'} Highlighted (${breachedMonths.join(', ')})`
      : `Cutoff ≥${thresholdVolatilityIndex.toFixed(0)}v (${sigmaLabel}) · 0 Periods Exceed Threshold`;

  return {
    enabled,
    sigmaThreshold,
    sigmaLabel,
    seriesMeanVolatility,
    seriesStdDevVolatility,
    thresholdVolatilityIndex,
    zScoreCutoff,
    breachCount,
    breachedMonths,
    breaches,
    statusSummary,
  };
}

/**
 * Computes 6-month volatility index series, rolling Bollinger-style volatility envelopes,
 * Z-scores, maximum drawdown, and buy-zone telemetry for D3 visualization in the spec drawer.
 */
export function computeAdvancedPriceTrends(
  rawHistory: Array<{ month: string; price: number; marketAvg?: number }>,
  thresholdConfig?: Partial<HighVolatilityThresholdConfig>
): AdvancedPriceTrendsAnalytics {
  const fallbackMonths = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const sanitized = Array.isArray(rawHistory) && rawHistory.length > 0
    ? rawHistory.map((pt, i) => {
        const price = Math.max(0.01, roundMoney(Number(pt?.price) || 100));
        const marketAvg = Math.max(
          0.01,
          roundMoney(Number(pt?.marketAvg) > 0 ? Number(pt.marketAvg) : price * 1.07)
        );
        return {
          month: String(pt?.month || fallbackMonths[i % fallbackMonths.length]).trim() || fallbackMonths[i % fallbackMonths.length],
          price,
          marketAvg,
        };
      })
    : generatePriceHistory({ id: 19, price: 150 });

  const prices = sanitized.map((d) => d.price);
  const n = prices.length;
  const sixMonthMean = roundMoney(prices.reduce((acc, p) => acc + p, 0) / n);
  const sixMonthLow = roundMoney(Math.min(...prices));
  const sixMonthHigh = roundMoney(Math.max(...prices));
  const currentPrice = roundMoney(prices[n - 1] ?? sixMonthMean);

  const variance =
    prices.reduce((acc, p) => acc + Math.pow(p - sixMonthMean, 2), 0) / Math.max(1, n);
  const standardDeviationUsd = roundMoney(Math.sqrt(variance));
  const coefficientOfVariationPct =
    sixMonthMean > 0 ? roundMoney((standardDeviationUsd / sixMonthMean) * 100) : 0;

  // Compute max peak-to-trough drawdown across the 6M window
  let runningPeak = prices[0] || currentPrice;
  let maxDrawdownPct = 0;
  for (const p of prices) {
    if (p > runningPeak) {
      runningPeak = p;
    }
    if (runningPeak > 0) {
      const dd = ((runningPeak - p) / runningPeak) * 100;
      if (dd > maxDrawdownPct) {
        maxDrawdownPct = dd;
      }
    }
  }
  maxDrawdownPct = roundMoney(maxDrawdownPct);

  const priceRangeSpreadUsd = roundMoney(sixMonthHigh - sixMonthLow);
  const priceRangeSpreadPct =
    sixMonthMean > 0 ? roundMoney((priceRangeSpreadUsd / sixMonthMean) * 100) : 0;

  const points: AdvancedPriceTrendPoint[] = sanitized.map((pt, idx) => {
    const windowSlice = prices.slice(0, idx + 1);
    const rollingMean = roundMoney(
      windowSlice.reduce((a, b) => a + b, 0) / windowSlice.length
    );

    // Use a 3-point local window (or full 6M stdDev scaled for point 0) so the envelope is smooth and meaningful
    const localStart = Math.max(0, idx - 2);
    const localEnd = Math.min(n, idx + 2);
    const localPrices = prices.slice(localStart, localEnd);
    const localMean = localPrices.reduce((a, b) => a + b, 0) / localPrices.length;
    const localVar =
      localPrices.reduce((acc, v) => acc + Math.pow(v - localMean, 2), 0) /
      Math.max(1, localPrices.length);
    const rollingStdDev = roundMoney(
      Math.max(standardDeviationUsd * 0.45, Math.sqrt(localVar))
    );

    const upperBand = roundMoney(rollingMean + 1.25 * rollingStdDev);
    const lowerBand = roundMoney(Math.max(0.01, rollingMean - 1.25 * rollingStdDev));

    const prevPrice = idx > 0 ? prices[idx - 1] : sixMonthMean;
    const monthlyChangeUsd = roundMoney(pt.price - prevPrice);
    const monthlyChangePct =
      prevPrice > 0 ? roundMoney(((pt.price - prevPrice) / prevPrice) * 100) : 0;
    const absMonthlySwingPct = roundMoney(Math.abs(monthlyChangePct));

    const deviationFromSixMonthMeanPct =
      sixMonthMean > 0
        ? roundMoney(((pt.price - sixMonthMean) / sixMonthMean) * 100)
        : 0;

    const zScore =
      standardDeviationUsd > 0.001
        ? roundMoney((pt.price - sixMonthMean) / standardDeviationUsd)
        : 0;

    // Normalized 0-100 Volatility Index combining monthly swing %, deviation from 6M mean %, and local dispersion
    const localDispersionPct =
      rollingMean > 0 ? (rollingStdDev / rollingMean) * 100 : 0;
    const rawVolatilityScore =
      standardDeviationUsd < 0.01 && absMonthlySwingPct < 0.01
        ? 0
        : absMonthlySwingPct * 3.1 +
          Math.abs(deviationFromSixMonthMeanPct) * 2.2 +
          localDispersionPct * 2.4;
    const volatilityIndex = Math.max(
      0,
      Math.min(100, roundMoney(rawVolatilityScore))
    );

    const { regime: volatilityRegime } = classifyVolatilityRegime(volatilityIndex);

    return {
      index: idx,
      month: pt.month,
      price: pt.price,
      marketAvg: pt.marketAvg,
      rollingMean,
      rollingStdDev,
      upperBand,
      lowerBand,
      monthlyChangeUsd,
      monthlyChangePct,
      absMonthlySwingPct,
      deviationFromSixMonthMeanPct,
      zScore,
      volatilityIndex,
      volatilityRegime,
    };
  });

  const avgPointVolatility =
    points.reduce((acc, p) => acc + p.volatilityIndex, 0) / Math.max(1, points.length);
  const sixMonthVolatilityIndex =
    standardDeviationUsd < 0.01
      ? 0
      : Math.max(
          0,
          Math.min(
            100,
            roundMoney(
              avgPointVolatility * 0.65 +
                coefficientOfVariationPct * 2.2 +
                maxDrawdownPct * 0.6
            )
          )
        );

  let peakMonthlyVolatilityIndex = 0;
  let peakVolatilityMonth = points[0]?.month || 'May';
  for (const pt of points) {
    if (pt.volatilityIndex >= peakMonthlyVolatilityIndex) {
      peakMonthlyVolatilityIndex = pt.volatilityIndex;
      peakVolatilityMonth = pt.month;
    }
  }

  const { regime: volatilityRegime, label: volatilityRegimeLabel } =
    classifyVolatilityRegime(sixMonthVolatilityIndex);

  const currentZScore =
    points[points.length - 1]?.zScore ?? 0;

  let buySignalLabel: AdvancedPriceTrendsAnalytics['buySignalLabel'] = 'Fair Value Band';
  let buySignalReason = `Current price ($${currentPrice.toFixed(2)}) tracks within the 6-month equilibrium envelope ($${sixMonthMean.toFixed(2)} mean).`;

  if (currentZScore <= -0.75 || currentPrice <= sixMonthLow * 1.02) {
    buySignalLabel = 'Strong Buy Zone';
    buySignalReason = `Trading ${Math.abs(currentZScore).toFixed(2)}σ below the 6-month average ($${sixMonthMean.toFixed(2)}) near the 6M support floor ($${sixMonthLow.toFixed(2)}).`;
  } else if (currentZScore < -0.15 || currentPrice < sixMonthMean) {
    buySignalLabel = 'Below 6M Mean';
    buySignalReason = `Priced $${roundMoney(sixMonthMean - currentPrice).toFixed(2)} below the 6-month mean ($${sixMonthMean.toFixed(2)}) with ${volatilityRegimeLabel.toLowerCase()}.`;
  } else if (currentZScore >= 0.65) {
    buySignalLabel = 'Above 6M Mean';
    buySignalReason = `Trading +${currentZScore.toFixed(2)}σ above the 6-month mean ($${sixMonthMean.toFixed(2)}); consider setting a Price Drop Alert.`;
  }

  const peakEvents = detectPeakVolatilityEvents(points, sixMonthLow);
  const highVolatilityThreshold = evaluateHighVolatilityThreshold(points, thresholdConfig);

  return {
    sixMonthMean,
    sixMonthLow,
    sixMonthHigh,
    currentPrice,
    standardDeviationUsd,
    coefficientOfVariationPct,
    sixMonthVolatilityIndex,
    peakMonthlyVolatilityIndex,
    peakVolatilityMonth,
    volatilityRegime,
    volatilityRegimeLabel,
    maxDrawdownPct,
    priceRangeSpreadUsd,
    priceRangeSpreadPct,
    currentZScore,
    buySignalLabel,
    buySignalReason,
    points,
    peakEvents,
    highVolatilityThreshold,
  };
}

export type D3TrendViewMode = 'composite' | 'volatility-bars' | 'zscore';

export interface D3GsapTransitionProfile {
  fromMode: D3TrendViewMode;
  toMode: D3TrendViewMode;
  isModeSwitch: boolean;
  direction: -1 | 0 | 1;
  reducedMotion: boolean;
  stageDurationSec: number;
  stageShiftPx: number;
  stageEase: string;
  barDurationSec: number;
  barStaggerSec: number;
  barEase: string;
  pathDurationSec: number;
  pathEase: string;
  nodeDurationSec: number;
  nodeStaggerSec: number;
  nodeEase: string;
}

const D3_MODE_ORDER: readonly D3TrendViewMode[] = [
  'composite',
  'volatility-bars',
  'zscore',
];

export function normalizeD3TrendViewMode(mode?: string | null): D3TrendViewMode {
  if (mode === 'volatility-bars' || mode === 'zscore' || mode === 'composite') {
    return mode;
  }
  return 'composite';
}

/**
 * Computes deterministic GSAP animation timing, easing, stagger, and directional shift
 * parameters when transitioning between 'composite', 'volatility-bars', and 'zscore' D3 views.
 */
export function resolveD3ModeGsapTransitionProfile(
  fromModeInput?: string | null,
  toModeInput?: string | null,
  options?: { reducedMotion?: boolean }
): D3GsapTransitionProfile {
  const fromMode = normalizeD3TrendViewMode(fromModeInput);
  const toMode = normalizeD3TrendViewMode(toModeInput);
  const fromIdx = D3_MODE_ORDER.indexOf(fromMode);
  const toIdx = D3_MODE_ORDER.indexOf(toMode);
  const isModeSwitch = Boolean(fromModeInput) && fromMode !== toMode;
  const rawDir = toIdx - fromIdx;
  const direction: -1 | 0 | 1 = !isModeSwitch
    ? 0
    : rawDir > 0
      ? 1
      : rawDir < 0
        ? -1
        : 0;

  const reducedMotion = Boolean(options?.reducedMotion);
  if (reducedMotion) {
    return {
      fromMode,
      toMode,
      isModeSwitch,
      direction,
      reducedMotion: true,
      stageDurationSec: 0,
      stageShiftPx: 0,
      stageEase: 'none',
      barDurationSec: 0,
      barStaggerSec: 0,
      barEase: 'none',
      pathDurationSec: 0,
      pathEase: 'none',
      nodeDurationSec: 0,
      nodeStaggerSec: 0,
      nodeEase: 'none',
    };
  }

  return {
    fromMode,
    toMode,
    isModeSwitch,
    direction,
    reducedMotion: false,
    stageDurationSec: isModeSwitch ? 0.34 : 0.26,
    stageShiftPx: direction * 10,
    stageEase: 'power2.out',
    barDurationSec: toMode === 'volatility-bars' ? 0.42 : 0.36,
    barStaggerSec: 0.032,
    barEase: 'power3.out',
    pathDurationSec: 0.46,
    pathEase: 'power2.out',
    nodeDurationSec: 0.3,
    nodeStaggerSec: 0.028,
    nodeEase: 'back.out(1.5)',
  };
}

export interface D3LegendItemDescriptor {
  key: string;
  swatchClass: string;
  label: string;
}

export interface D3LegendToggleState {
  legendVisible: boolean;
  isHidden: boolean;
  buttonLabel: 'Hide Legend' | 'Show Legend';
  ariaPressed: 'true' | 'false';
  ariaExpanded: 'true' | 'false';
  statusNote: string;
}

/**
 * Resolves the UI button label, ARIA state attributes, and status copy for the
 * D3 signal legend visibility toggle ('Hide Legend' / 'Show Legend').
 */
export function resolveD3LegendToggleState(legendVisibleInput?: boolean | null): D3LegendToggleState {
  const legendVisible = legendVisibleInput !== undefined && legendVisibleInput !== null ? Boolean(legendVisibleInput) : true;
  return {
    legendVisible,
    isHidden: !legendVisible,
    buttonLabel: legendVisible ? 'Hide Legend' : 'Show Legend',
    ariaPressed: legendVisible ? 'false' : 'true',
    ariaExpanded: legendVisible ? 'true' : 'false',
    statusNote: legendVisible
      ? 'Signal legend visible'
      : 'Signal legend hidden for cleaner chart view',
  };
}

/**
 * Returns the structured list of signal legend items for the active D3 view mode
 * ('composite', 'volatility-bars', or 'zscore') and threshold configuration.
 */
export function getD3ModeLegendItems(
  modeInput?: string | null,
  thresholdConfig?: Partial<HighVolatilityThresholdConfig>
): D3LegendItemDescriptor[] {
  const mode = normalizeD3TrendViewMode(modeInput);
  const thresholdEnabled =
    thresholdConfig?.enabled !== undefined ? Boolean(thresholdConfig.enabled) : true;
  const sigmaVal = normalizeVolatilitySigmaThreshold(thresholdConfig?.sigmaThreshold);
  const sigmaShort = sigmaVal.toFixed(1).replace(/\.0$/, '') + 'σ';

  let items: D3LegendItemDescriptor[];
  if (mode === 'volatility-bars') {
    items = [
      { key: 'low', swatchClass: 'is-stable', label: 'Low (<25)' },
      { key: 'mod', swatchClass: 'is-mod', label: 'Mod (25–54)' },
      { key: 'high', swatchClass: 'is-elev', label: 'High (55+)' },
      { key: 'peak', swatchClass: 'is-peak-marker', label: 'Peak Event' },
    ];
  } else if (mode === 'zscore') {
    items = [
      { key: 'zneg', swatchClass: 'is-zneg', label: 'Below Mean (-σ Buy Zone)' },
      { key: 'zpos', swatchClass: 'is-zpos', label: 'Above Mean (+σ Premium)' },
      { key: 'peak', swatchClass: 'is-peak-marker', label: 'Peak Event' },
    ];
  } else {
    items = [
      { key: 'band', swatchClass: 'is-band', label: '±1σ Envelope' },
      { key: 'price', swatchClass: 'is-price', label: 'Spot Price' },
      { key: 'vol', swatchClass: 'is-vol', label: 'Volatility Index' },
      { key: 'peak', swatchClass: 'is-peak-marker', label: 'Peak Event' },
    ];
  }

  if (thresholdEnabled) {
    items.push({
      key: 'threshold',
      swatchClass: 'is-threshold-marker',
      label: `≥${sigmaShort} Threshold`,
    });
  }

  return items;
}

// ── Google Maps Platform Store & Pickup Hub Locator Pure Logic ──

export const GMP_ATTRIBUTION_ID = 'gmp_mcp_codeassist_v1_aistudio' as const;
export const GMP_DEFAULT_MAP_ID = 'DEMO_MAP_ID' as const;

export const GMP_PLACE_SEARCH_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'businessStatus',
  'googleMapsURI',
  'attributions',
] as const;

export interface GmpLatLngLiteral {
  lat: number;
  lng: number;
}

export interface GmpTextSearchRequestOptions {
  center?: GmpLatLngLiteral | null;
  radiusMeters?: number;
  maxResultCount?: number;
  minRating?: number;
  isOpenNow?: boolean;
  language?: string;
  region?: string;
}

export interface GmpNormalizedTextSearchRequest {
  textQuery: string;
  fields: string[];
  maxResultCount: number;
  language: string;
  region: string;
  internalUsageAttributionIds: string[];
  locationBias?: {
    center: GmpLatLngLiteral;
    radius: number;
  };
  minRating?: number;
  isOpenNow?: boolean;
}

export interface GmpPlaceAttributionItem {
  provider: string;
  providerURI: string | null;
}

export interface VoltboxGmpPlaceCard {
  id: string;
  index: number;
  badgeNumber: string;
  displayName: string;
  formattedAddress: string;
  location: GmpLatLngLiteral | null;
  rating: number | null;
  userRatingCount: number;
  businessStatus: string;
  googleMapsURI: string | null;
  attributions: GmpPlaceAttributionItem[];
}

/**
 * Pure helper to detect whether an error message, HTTP status, or SDK error object
 * indicates Google Maps Platform quota exhaustion (OverQuotaMapError, QuotaExceededError,
 * OVER_QUERY_LIMIT, RESOURCE_EXHAUSTED, or HTTP 429). Never returns true for normal
 * empty results or generic network 404s.
 */
export function isGmpQuotaExceededSignal(input: unknown): boolean {
  if (!input) return false;

  if (typeof input === 'number') {
    return input === 429;
  }

  if (typeof input === 'string') {
    const str = input.trim();
    if (!str) return false;
    return (
      str.includes('OverQuotaMapError') ||
      str.includes('QuotaExceededError') ||
      str.includes('OVER_QUERY_LIMIT') ||
      str.includes('RESOURCE_EXHAUSTED') ||
      /\b429\b/.test(str)
    );
  }

  if (typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    if (obj.status === 429 || obj.code === 429) return true;
    if (
      typeof obj.status === 'string' &&
      (obj.status === 'OVER_QUERY_LIMIT' || obj.status === 'RESOURCE_EXHAUSTED')
    ) {
      return true;
    }
    if (
      typeof obj.code === 'string' &&
      (obj.code === 'OVER_QUERY_LIMIT' || obj.code === 'RESOURCE_EXHAUSTED')
    ) {
      return true;
    }
    if (obj.error && isGmpQuotaExceededSignal(obj.error)) {
      return true;
    }
    const combinedMsg = [obj.name, obj.message, obj.statusText]
      .filter((v) => typeof v === 'string')
      .join(' ');
    if (combinedMsg && isGmpQuotaExceededSignal(combinedMsg)) {
      return true;
    }
  }

  return false;
}

/**
 * Builds a compliant Places API (New) `Place.searchByText()` request payload
 * with explicit field masks and the required `gmp_mcp_codeassist_v1_aistudio` attribution ID.
 */
export function buildGmpTextSearchRequest(
  queryInput?: string | null,
  options?: GmpTextSearchRequestOptions
): GmpNormalizedTextSearchRequest {
  const cleanedQuery = String(queryInput || '').trim();
  const textQuery = cleanedQuery || 'computer hardware electronics store in Bengaluru';

  const rawMax = Number(options?.maxResultCount);
  const maxResultCount = Number.isFinite(rawMax)
    ? Math.max(1, Math.min(20, Math.round(rawMax)))
    : 8;

  const req: GmpNormalizedTextSearchRequest = {
    textQuery,
    fields: [...GMP_PLACE_SEARCH_FIELDS],
    maxResultCount,
    language: String(options?.language || 'en-US').trim() || 'en-US',
    region: String(options?.region || 'in').trim() || 'in',
    internalUsageAttributionIds: [GMP_ATTRIBUTION_ID],
  };

  if (
    options?.center &&
    typeof options.center.lat === 'number' &&
    typeof options.center.lng === 'number' &&
    Number.isFinite(options.center.lat) &&
    Number.isFinite(options.center.lng)
  ) {
    const rawRadius = Number(options?.radiusMeters);
    const radius =
      Number.isFinite(rawRadius) && rawRadius >= 100
        ? Math.min(50000, Math.round(rawRadius))
        : 12000;
    req.locationBias = {
      center: {
        lat: Number(options.center.lat.toFixed(6)),
        lng: Number(options.center.lng.toFixed(6)),
      },
      radius,
    };
  }

  if (typeof options?.minRating === 'number' && Number.isFinite(options.minRating)) {
    const clampedRating = Math.max(1.0, Math.min(5.0, Math.round(options.minRating * 10) / 10));
    req.minRating = clampedRating;
  }

  if (typeof options?.isOpenNow === 'boolean') {
    req.isOpenNow = options.isOpenNow;
  }

  return req;
}

/**
 * Extracts and normalizes a live `google.maps.places.Place` result without fabricating
 * any place fields. Preserves `attributions` for mandatory UI attribution display.
 */
export function normalizeGmpPlaceResult(
  rawPlace: any,
  index = 0
): VoltboxGmpPlaceCard | null {
  if (!rawPlace || typeof rawPlace !== 'object') return null;

  let lat: number | null = null;
  let lng: number | null = null;
  const loc = rawPlace.location;
  if (loc) {
    const rawLat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
    const rawLng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
    if (typeof rawLat === 'number' && typeof rawLng === 'number' && Number.isFinite(rawLat) && Number.isFinite(rawLng)) {
      lat = Number(rawLat.toFixed(6));
      lng = Number(rawLng.toFixed(6));
    }
  }

  const displayName = String(rawPlace.displayName || '').trim();
  const formattedAddress = String(rawPlace.formattedAddress || '').trim();
  const id = String(rawPlace.id || '').trim();

  if (!id && !displayName && lat === null) {
    return null;
  }

  const rawRating = Number(rawPlace.rating);
  const rating =
    Number.isFinite(rawRating) && rawRating > 0
      ? Math.round(rawRating * 10) / 10
      : null;

  const rawCount = Number(rawPlace.userRatingCount);
  const userRatingCount =
    Number.isFinite(rawCount) && rawCount >= 0 ? Math.round(rawCount) : 0;

  const attributions: GmpPlaceAttributionItem[] = Array.isArray(rawPlace.attributions)
    ? rawPlace.attributions
        .map((attr: any): GmpPlaceAttributionItem | null => {
          if (!attr || typeof attr !== 'object') return null;
          const provider = String(attr.provider || '').trim();
          if (!provider) return null;
          const providerURI = attr.providerURI ? String(attr.providerURI).trim() : null;
          return { provider, providerURI };
        })
        .filter((item: GmpPlaceAttributionItem | null): item is GmpPlaceAttributionItem => item !== null)
    : [];

  return {
    id: id || `gmp-place-${index + 1}`,
    index,
    badgeNumber: String(index + 1),
    displayName,
    formattedAddress,
    location: lat !== null && lng !== null ? { lat, lng } : null,
    rating,
    userRatingCount,
    businessStatus: String(rawPlace.businessStatus || 'OPERATIONAL').trim(),
    googleMapsURI: rawPlace.googleMapsURI ? String(rawPlace.googleMapsURI).trim() : null,
    attributions,
  };
}

// ── D3 Volatility Engine Mouse-Wheel Zoom & Drag-to-Pan Pure Logic ──

export const D3_ZOOM_MIN_SCALE = 1;
export const D3_ZOOM_MAX_SCALE = 4;
export const D3_ZOOM_STEP_FACTOR = 1.35;
export const D3_PAN_STEP_PX = 64;

export interface D3ZoomPanTransformInput {
  k?: number;
  x?: number;
}

export interface D3ClampedZoomPanTransform {
  k: number;
  x: number;
  minX: number;
  maxX: number;
  isZoomed: boolean;
  isAtLeftEdge: boolean;
  isAtRightEdge: boolean;
  zoomPercent: number;
  scaleLabel: string;
}

export interface D3ZoomedVisibleWindow extends D3ClampedZoomPanTransform {
  visibleMonths: string[];
  startMonth: string;
  endMonth: string;
  visibleCount: number;
  totalCount: number;
  windowLabel: string;
  statusSummary: string;
}

/**
 * Clamps a horizontal D3 zoom/pan transform `{ k, x }` so `k` stays within `[minScale, maxScale]`
 * (default `[1, 4]`) and `x` stays within `[-(innerWidth * (k - 1)), 0]`.
 */
export function clampD3ZoomPanTransform(
  transform?: D3ZoomPanTransformInput | null,
  innerWidth = 300,
  minScale = D3_ZOOM_MIN_SCALE,
  maxScale = D3_ZOOM_MAX_SCALE
): D3ClampedZoomPanTransform {
  const safeMinScale = Number.isFinite(minScale) && minScale >= 1 ? minScale : D3_ZOOM_MIN_SCALE;
  const safeMaxScale =
    Number.isFinite(maxScale) && maxScale > safeMinScale ? maxScale : D3_ZOOM_MAX_SCALE;
  const w = Number.isFinite(innerWidth) && innerWidth > 0 ? innerWidth : 300;

  const rawK = Number(transform?.k);
  const clampedRawK = Number.isFinite(rawK)
    ? Math.max(safeMinScale, Math.min(safeMaxScale, rawK))
    : safeMinScale;
  const k = clampedRawK <= safeMinScale + 0.01 ? safeMinScale : Math.round(clampedRawK * 100) / 100;
  const isZoomed = k > safeMinScale + 0.01;

  const maxX = 0;
  const minX = isZoomed ? -Math.round(w * (k - 1) * 100) / 100 : 0;

  const rawX = Number(transform?.x);
  const clampedRawX =
    isZoomed && Number.isFinite(rawX) ? Math.max(minX, Math.min(maxX, rawX)) : 0;
  const x = Math.abs(clampedRawX) < 0.05 ? 0 : Math.round(clampedRawX * 100) / 100;

  const isAtLeftEdge = !isZoomed || x >= maxX - 0.5;
  const isAtRightEdge = !isZoomed || x <= minX + 0.5;
  const zoomPercent = Math.round(k * 100);
  const scaleLabel = `${Number.isInteger(k) ? k.toFixed(1) : k.toFixed(2).replace(/0$/, '')}×`;

  return {
    k,
    x,
    minX,
    maxX,
    isZoomed,
    isAtLeftEdge,
    isAtRightEdge,
    zoomPercent,
    scaleLabel,
  };
}

/**
 * Computes the next horizontal zoom/pan transform from a mouse-wheel event (`wheelDeltaY`)
 * anchored at cursor X position `anchorX` within `[0, innerWidth]`.
 * Negative `wheelDeltaY` (scrolling up) zooms in; positive `wheelDeltaY` zooms out.
 */
export function computeD3WheelZoomTransform(
  currentTransform?: D3ZoomPanTransformInput | null,
  wheelDeltaY = -100,
  anchorX?: number,
  innerWidth = 300,
  minScale = D3_ZOOM_MIN_SCALE,
  maxScale = D3_ZOOM_MAX_SCALE
): D3ClampedZoomPanTransform {
  const w = Number.isFinite(innerWidth) && innerWidth > 0 ? innerWidth : 300;
  const current = clampD3ZoomPanTransform(currentTransform, w, minScale, maxScale);
  const deltaY = Number(wheelDeltaY);

  if (!Number.isFinite(deltaY) || Math.abs(deltaY) < 0.001) {
    return current;
  }

  const focalX =
    typeof anchorX === 'number' && Number.isFinite(anchorX)
      ? Math.max(0, Math.min(w, anchorX))
      : w / 2;

  const magnitude = Math.min(Math.abs(deltaY), 240);
  const stepRatio = 1 + Math.max(0.14, magnitude / 280);
  const nextRawK = deltaY < 0 ? current.k * stepRatio : current.k / stepRatio;
  const clampedNextK = Math.max(minScale, Math.min(maxScale, nextRawK));

  // Keep the data point under focalX stationary while zooming
  const unscaledFocalX = (focalX - current.x) / current.k;
  const nextRawX = focalX - unscaledFocalX * clampedNextK;

  return clampD3ZoomPanTransform({ k: clampedNextK, x: nextRawX }, w, minScale, maxScale);
}

/**
 * Computes the next horizontal zoom/pan transform when dragging horizontally by `deltaX` pixels.
 */
export function computeD3DragPanTransform(
  startTransform?: D3ZoomPanTransformInput | null,
  deltaX = 0,
  innerWidth = 300,
  minScale = D3_ZOOM_MIN_SCALE,
  maxScale = D3_ZOOM_MAX_SCALE
): D3ClampedZoomPanTransform {
  const w = Number.isFinite(innerWidth) && innerWidth > 0 ? innerWidth : 300;
  const base = clampD3ZoomPanTransform(startTransform, w, minScale, maxScale);
  if (!base.isZoomed) {
    return base;
  }
  const dx = Number.isFinite(Number(deltaX)) ? Number(deltaX) : 0;
  return clampD3ZoomPanTransform({ k: base.k, x: base.x + dx }, w, minScale, maxScale);
}

/**
 * Resolves which months in the 6-month series fall inside the visible zoomed/panned viewport
 * and returns formatted status and window labels for the D3 Volatility Engine toolbar.
 */
export function resolveD3ZoomedVisibleWindow(
  months: string[],
  innerWidth = 300,
  transform?: D3ZoomPanTransformInput | null,
  edgePaddingPx = 14
): D3ZoomedVisibleWindow {
  const safeMonths = Array.isArray(months) && months.length > 0
    ? months.map((m) => String(m || '').trim()).filter(Boolean)
    : ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const totalCount = safeMonths.length;
  const w = Number.isFinite(innerWidth) && innerWidth > 0 ? innerWidth : 300;
  const pad = Math.max(0, Math.min(w * 0.2, Number(edgePaddingPx) || 14));
  const clamped = clampD3ZoomPanTransform(transform, w);

  if (!clamped.isZoomed || totalCount <= 1) {
    const startMonth = safeMonths[0] || 'May';
    const endMonth = safeMonths[totalCount - 1] || 'Oct';
    const windowLabel = `${startMonth} – ${endMonth} (All ${totalCount}M)`;
    return {
      ...clamped,
      visibleMonths: [...safeMonths],
      startMonth,
      endMonth,
      visibleCount: totalCount,
      totalCount,
      windowLabel,
      statusSummary: `${clamped.scaleLabel} · ${windowLabel} · Scroll wheel to zoom, drag to pan`,
    };
  }

  const span = Math.max(1, w - pad * 2);
  const positioned = safeMonths.map((month, idx) => {
    const baseX = pad + (idx / Math.max(1, totalCount - 1)) * span;
    const tx = baseX * clamped.k + clamped.x;
    const distFromCenter = Math.abs(tx - w / 2);
    return { month, idx, baseX, tx, distFromCenter };
  });

  // Tolerance around [0, w] so edge ticks remain counted when slightly inside the frame
  let visible = positioned.filter((item) => item.tx >= -8 && item.tx <= w + 8);
  if (visible.length === 0) {
    const sorted = [...positioned].sort((a, b) => a.distFromCenter - b.distFromCenter);
    visible = sorted.slice(0, Math.min(2, sorted.length)).sort((a, b) => a.idx - b.idx);
  }

  const visibleMonths = visible.map((v) => v.month);
  const startMonth = visibleMonths[0] || safeMonths[0];
  const endMonth = visibleMonths[visibleMonths.length - 1] || startMonth;
  const visibleCount = visibleMonths.length;

  const rangeText = startMonth === endMonth ? startMonth : `${startMonth} – ${endMonth}`;
  const countSuffix =
    visibleCount >= totalCount ? `(All ${totalCount}M)` : `(${visibleCount}/${totalCount}M)`;
  const windowLabel = `${rangeText} ${countSuffix}`;

  return {
    ...clamped,
    visibleMonths,
    startMonth,
    endMonth,
    visibleCount,
    totalCount,
    windowLabel,
    statusSummary: `${clamped.scaleLabel} Zoom · ${windowLabel} · Drag chart to pan`,
  };
}

// ── Product Spec Drawer Section Navigation & Structured Layout Helpers ──

export type SpecDrawerSectionId =
  | 'overview'
  | 'd3-volatility'
  | 'tech-specs'
  | 'reviews';

export interface SpecDrawerSectionNavItem {
  id: SpecDrawerSectionId;
  targetElementId: string;
  label: string;
  shortLabel: string;
  badgeText?: string;
  isActive: boolean;
}

export const SPEC_DRAWER_SECTIONS: ReadonlyArray<{
  id: SpecDrawerSectionId;
  targetElementId: string;
  label: string;
  shortLabel: string;
}> = [
  {
    id: 'overview',
    targetElementId: 'spec-overview-section',
    label: 'Overview & 6M Price',
    shortLabel: 'Overview',
  },
  {
    id: 'd3-volatility',
    targetElementId: 'spec-advanced-price-trends',
    label: 'D3 Volatility Engine',
    shortLabel: 'D3 Volatility',
  },
  {
    id: 'tech-specs',
    targetElementId: 'spec-technical-section',
    label: 'Tech Specs & Bench',
    shortLabel: 'Tech Specs',
  },
  {
    id: 'reviews',
    targetElementId: 'spec-reviews-section',
    label: 'Verified Reviews',
    shortLabel: 'Reviews',
  },
];

export function resolveSpecDrawerSectionNav(
  activeSectionId?: string | null,
  options?: { reviewCount?: number; volatilityScore?: number }
): SpecDrawerSectionNavItem[] {
  const normalizedActive: SpecDrawerSectionId =
    activeSectionId === 'd3-volatility' ||
    activeSectionId === 'tech-specs' ||
    activeSectionId === 'reviews'
      ? activeSectionId
      : 'overview';

  const revCount =
    typeof options?.reviewCount === 'number' &&
    Number.isFinite(options.reviewCount) &&
    options.reviewCount >= 0
      ? Math.round(options.reviewCount)
      : undefined;

  const volScore =
    typeof options?.volatilityScore === 'number' &&
    Number.isFinite(options.volatilityScore) &&
    options.volatilityScore >= 0
      ? Math.round(options.volatilityScore)
      : undefined;

  return SPEC_DRAWER_SECTIONS.map((sec) => {
    let badgeText: string | undefined;
    if (sec.id === 'reviews' && revCount !== undefined) {
      badgeText = String(revCount);
    } else if (sec.id === 'd3-volatility' && volScore !== undefined) {
      badgeText = `${volScore}v`;
    }
    return {
      ...sec,
      badgeText,
      isActive: sec.id === normalizedActive,
    };
  });
}

export function resolveActiveSpecSectionFromScroll(
  scrollTop: number,
  sectionOffsets: Array<{ id: SpecDrawerSectionId; offsetTop: number }>,
  activationThresholdPx = 90
): SpecDrawerSectionId {
  if (!Array.isArray(sectionOffsets) || sectionOffsets.length === 0) {
    return 'overview';
  }
  const safeScroll = Math.max(0, Number(scrollTop) || 0);
  const threshold = Math.max(0, Number(activationThresholdPx) || 90);
  const sorted = [...sectionOffsets]
    .filter((s) => s && typeof s.offsetTop === 'number' && Number.isFinite(s.offsetTop))
    .sort((a, b) => a.offsetTop - b.offsetTop);

  let current: SpecDrawerSectionId = 'overview';
  for (const item of sorted) {
    if (safeScroll + threshold >= item.offsetTop) {
      current = item.id;
    }
  }
  return current;
}

// ============================================================================
// PRODUCT CARD FLOATING CONTEXT MENU & LONG-PRESS QUICK ACTIONS
// ============================================================================

export const CARD_LONG_PRESS_DURATION_MS = 480;
export const CARD_LONG_PRESS_MOVE_TOLERANCE_PX = 10;

export type ProductContextMenuActionId =
  | 'add-to-cart'
  | 'toggle-wishlist'
  | 'toggle-compare'
  | 'copy-name'
  | 'copy-sku'
  | 'open-specs'
  | 'open-volatility'
  | 'price-alert';

export interface ProductContextMenuInput {
  productId: number;
  title: string;
  sku?: string;
  price: number;
  effectiveStock: number;
  cartQty?: number;
  isWishlisted?: boolean;
  isCompared?: boolean;
  hasPriceAlert?: boolean;
}

export interface ProductContextMenuItem {
  id: ProductContextMenuActionId;
  label: string;
  sublabel?: string;
  shortcut: string;
  icon: string;
  section: 'primary' | 'clipboard' | 'inspect';
  active: boolean;
  disabled: boolean;
  badgeText?: string;
}

export interface ProductContextMenuPosition {
  left: number;
  top: number;
  placement: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  transformOrigin: string;
}

/**
 * Clamps a floating context menu popover inside the viewport and selects the optimal transform-origin
 * so right-clicking or long-pressing near screen edges never clips the menu.
 */
export function computeProductContextMenuPosition(
  anchorX: number,
  anchorY: number,
  menuWidth = 256,
  menuHeight = 328,
  viewportWidth = 1440,
  viewportHeight = 900,
  margin = 12
): ProductContextMenuPosition {
  const safeW = Math.max(180, Number(menuWidth) || 256);
  const safeH = Math.max(160, Number(menuHeight) || 328);
  const vw = Math.max(safeW + margin * 2, Number(viewportWidth) || 1440);
  const vh = Math.max(safeH + margin * 2, Number(viewportHeight) || 900);
  const pad = Math.max(4, Number(margin) || 12);

  const rawX = Number.isFinite(anchorX) ? anchorX : vw / 2;
  const rawY = Number.isFinite(anchorY) ? anchorY : vh / 2;

  const flipHoriz = rawX + safeW + pad > vw;
  const flipVert = rawY + safeH + pad > vh;

  let left = flipHoriz ? rawX - safeW : rawX;
  let top = flipVert ? rawY - safeH : rawY;

  left = Math.round(Math.max(pad, Math.min(vw - safeW - pad, left)));
  top = Math.round(Math.max(pad, Math.min(vh - safeH - pad, top)));

  let placement: ProductContextMenuPosition['placement'] = 'bottom-right';
  let transformOrigin = 'top left';
  if (flipHoriz && flipVert) {
    placement = 'top-left';
    transformOrigin = 'bottom right';
  } else if (flipHoriz) {
    placement = 'bottom-left';
    transformOrigin = 'top right';
  } else if (flipVert) {
    placement = 'top-right';
    transformOrigin = 'bottom left';
  }

  return {
    left,
    top,
    placement,
    transformOrigin,
  };
}

/**
 * Determines whether a touch/pointer movement exceeds the long-press cancellation tolerance.
 */
export function shouldCancelLongPressOnMove(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  tolerancePx = CARD_LONG_PRESS_MOVE_TOLERANCE_PX
): boolean {
  const dx = (Number(currentX) || 0) - (Number(startX) || 0);
  const dy = (Number(currentY) || 0) - (Number(startY) || 0);
  const dist = Math.hypot(dx, dy);
  return dist > Math.max(2, Number(tolerancePx) || CARD_LONG_PRESS_MOVE_TOLERANCE_PX);
}

/**
 * Formats clipboard text when copying product name or SKU + price from the context menu.
 */
export function formatProductCopyPayload(
  product: { id?: number; title?: string; sku?: string; price?: number },
  mode: 'name' | 'sku-price' = 'name'
): string {
  const title = String(product?.title || 'Voltbox Component').trim();
  if (mode === 'name') {
    return title;
  }
  const pid = Number(product?.id) || 1;
  const sku = String(product?.sku || `VB-PRT-${String(pid).padStart(3, '0')}`).trim();
  const price = Math.max(0, Number(product?.price) || 0).toFixed(2);
  return `${title} (${sku}) — $${price}`;
}

/**
 * Builds the stateful list of quick-action items for a product card's floating context menu.
 */
export function buildProductContextMenuItems(
  input: ProductContextMenuInput
): ProductContextMenuItem[] {
  const title = String(input?.title || 'Component').trim();
  const pid = Number(input?.productId) || 1;
  const sku = String(input?.sku || `VB-PRT-${String(pid).padStart(3, '0')}`).trim();
  const price = Math.max(0, Number(input?.price) || 0);
  const stock = Math.max(0, Math.floor(Number(input?.effectiveStock) || 0));
  const cartQty = Math.max(0, Math.floor(Number(input?.cartQty) || 0));
  const isWishlisted = Boolean(input?.isWishlisted);
  const isCompared = Boolean(input?.isCompared);
  const hasPriceAlert = Boolean(input?.hasPriceAlert);
  const outOfStock = stock <= 0;

  return [
    {
      id: 'add-to-cart',
      label: outOfStock
        ? 'Out of Stock (Backorder)'
        : cartQty > 0
          ? `Add to Cart (${cartQty} in cart)`
          : 'Add to Cart',
      sublabel: outOfStock ? '0 available' : `${stock} in stock`,
      shortcut: '+',
      icon: 'cart',
      section: 'primary',
      active: cartQty > 0,
      disabled: outOfStock,
      badgeText: `$${price.toFixed(2)}`,
    },
    {
      id: 'toggle-wishlist',
      label: isWishlisted ? 'Remove from Wishlist' : 'Toggle Wishlist',
      sublabel: isWishlisted ? 'Saved to personal wishlist' : 'Save for later',
      shortcut: 'W',
      icon: 'heart',
      section: 'primary',
      active: isWishlisted,
      disabled: false,
    },
    {
      id: 'toggle-compare',
      label: isCompared ? 'Remove from Compare' : 'Compare Side-by-Side',
      sublabel: isCompared ? 'Active in comparison tray' : 'Add to 4-slot bench compare',
      shortcut: 'C',
      icon: 'sliders',
      section: 'primary',
      active: isCompared,
      disabled: false,
    },
    {
      id: 'copy-name',
      label: 'Copy Name',
      sublabel: title,
      shortcut: '⌘C',
      icon: 'copy',
      section: 'clipboard',
      active: false,
      disabled: false,
    },
    {
      id: 'copy-sku',
      label: 'Copy SKU & Price',
      sublabel: `${sku} · $${price.toFixed(2)}`,
      shortcut: 'S',
      icon: 'tag',
      section: 'clipboard',
      active: false,
      disabled: false,
    },
    {
      id: 'open-specs',
      label: 'Inspect Full Specs',
      sublabel: 'Open hardware spec drawer',
      shortcut: 'Enter',
      icon: 'eye',
      section: 'inspect',
      active: false,
      disabled: false,
    },
    {
      id: 'open-volatility',
      label: 'D3 Volatility Chart',
      sublabel: '6-month σ bands & zoom engine',
      shortcut: 'V',
      icon: 'trending-up',
      section: 'inspect',
      active: false,
      disabled: false,
    },
    {
      id: 'price-alert',
      label: hasPriceAlert ? 'Manage Price Alert' : 'Set Price Drop Alert',
      sublabel: hasPriceAlert ? 'Active threshold alert' : 'Get notified on price drop',
      shortcut: 'A',
      icon: hasPriceAlert ? 'bell-ring' : 'bell',
      section: 'inspect',
      active: hasPriceAlert,
      disabled: false,
    },
  ];
}

// ── Server-Side SKU Formatting & Stock Level Validation Layer (mirrors com.voltbox.validation.ProductValidator) ──

export const MIN_STOCK_QUANTITY = 0;
export const MAX_STOCK_QUANTITY = 1000;
export const MIN_RESTOCK_AMOUNT = 1;
export const MAX_RESTOCK_AMOUNT = 500;
export const MAX_STOCK_DELTA = 500;
export const MIN_PRODUCT_PRICE = 0;
export const MAX_PRODUCT_PRICE = 99999.99;

export const VALID_SKU_PREFIXES = ['GPU', 'CPU', 'MBD', 'STR', 'AUD', 'GMG', 'PRT'] as const;
export type ValidSkuPrefix = (typeof VALID_SKU_PREFIXES)[number];

export const CANONICAL_SKU_REGEX = /^VB-(GPU|CPU|MBD|STR|AUD|GMG|PRT)-(\d{3,4})(?:-([A-Z0-9]{1,4}))?$/;
const LOOSE_VB_SKU_REGEX = /^VB-([A-Z0-9]+)-(\d+)(?:-(.*))?$/;

export interface ProductValidationViolation {
  field: string;
  code: string;
  message: string;
  rejectedValue: unknown;
}

export interface ProductValidationResult {
  ok: boolean;
  code: string;
  message: string;
  normalizedSku?: string | null;
  normalizedStock?: number | null;
  normalizedPrice?: number | null;
  errors: ProductValidationViolation[];
}

export interface SkuValidationCatalogItem {
  id: number;
  sku?: string | null;
  title?: string;
  name?: string;
  category?: string;
  takenDown?: boolean;
}

function buildValidationResult(
  violations: ProductValidationViolation[],
  normalized?: {
    sku?: string | null;
    stock?: number | null;
    price?: number | null;
  }
): ProductValidationResult {
  const ok = violations.length === 0;
  return {
    ok,
    code: ok ? 'OK' : violations[0].code,
    message: ok ? 'Validation passed.' : violations[0].message,
    normalizedSku: normalized?.sku ?? null,
    normalizedStock: normalized?.stock ?? null,
    normalizedPrice: normalized?.price ?? null,
    errors: violations,
  };
}

/**
 * Validates a hardware SKU string against the canonical Voltbox format:
 * `VB-(GPU|CPU|MBD|STR|AUD|GMG|PRT)-<001..9999>[-<optional 1-4 char alphanumeric suffix>]`
 * and verifies uniqueness across active catalog items.
 */
export function validateProductSku(
  rawSku: unknown,
  options?: {
    required?: boolean;
    currentProductId?: number | null;
    existingProducts?: SkuValidationCatalogItem[];
  }
): ProductValidationResult {
  const required = Boolean(options?.required);
  const currentProductId = options?.currentProductId ?? null;
  const existingProducts = Array.isArray(options?.existingProducts) ? options!.existingProducts : [];

  if (rawSku === undefined || rawSku === null) {
    if (required) {
      return buildValidationResult([
        {
          field: 'sku',
          code: 'SKU_REQUIRED',
          message: 'Product SKU is required (expected format: VB-GPU-019).',
          rejectedValue: rawSku,
        },
      ]);
    }
    return buildValidationResult([]);
  }

  const trimmed = String(rawSku).trim();
  if (!trimmed) {
    if (required) {
      return buildValidationResult([
        {
          field: 'sku',
          code: 'SKU_BLANK',
          message:
            'Product SKU cannot be empty. Expected canonical format VB-<GRP>-<001..9999> (e.g. VB-GPU-019).',
          rejectedValue: rawSku,
        },
      ]);
    }
    return buildValidationResult([]);
  }

  if (trimmed !== trimmed.toUpperCase()) {
    return buildValidationResult([
      {
        field: 'sku',
        code: 'SKU_LOWERCASE_NOT_ALLOWED',
        message: `SKU '${trimmed}' must use uppercase characters (e.g. '${trimmed.toUpperCase()}').`,
        rejectedValue: trimmed,
      },
    ]);
  }

  if (trimmed.length < 10 || trimmed.length > 16) {
    return buildValidationResult([
      {
        field: 'sku',
        code: 'SKU_INVALID_LENGTH',
        message: `SKU '${trimmed}' must be between 10 and 16 characters in format VB-<GRP>-<NNN>.`,
        rejectedValue: trimmed,
      },
    ]);
  }

  const canonicalMatch = trimmed.match(CANONICAL_SKU_REGEX);
  if (!canonicalMatch) {
    const looseMatch = trimmed.match(LOOSE_VB_SKU_REGEX);
    if (looseMatch) {
      const prefix = looseMatch[1];
      const digits = looseMatch[2];
      if (!(VALID_SKU_PREFIXES as readonly string[]).includes(prefix)) {
        return buildValidationResult([
          {
            field: 'sku',
            code: 'SKU_INVALID_PREFIX',
            message: `Invalid SKU component group prefix '${prefix}' in '${trimmed}'. Allowed prefixes: GPU, CPU, MBD, STR, AUD, GMG, PRT.`,
            rejectedValue: trimmed,
          },
        ]);
      }
      if (digits.length < 3 || digits.length > 4) {
        return buildValidationResult([
          {
            field: 'sku',
            code: 'SKU_INVALID_SEQUENCE_LENGTH',
            message: `SKU sequence number '${digits}' in '${trimmed}' must be 3 to 4 digits (e.g. VB-${prefix}-019).`,
            rejectedValue: trimmed,
          },
        ]);
      }
    }

    return buildValidationResult([
      {
        field: 'sku',
        code: 'SKU_INVALID_FORMAT',
        message: `Invalid SKU format '${trimmed}'. Must match VB-(GPU|CPU|MBD|STR|AUD|GMG|PRT)-<001..9999> (e.g. VB-GPU-019).`,
        rejectedValue: trimmed,
      },
    ]);
  }

  const seqDigits = canonicalMatch[2];
  const seqNum = Number.parseInt(seqDigits, 10);
  if (Number.isNaN(seqNum) || seqNum <= 0) {
    return buildValidationResult([
      {
        field: 'sku',
        code: 'SKU_ZERO_SEQUENCE',
        message: `SKU sequence number in '${trimmed}' must be greater than zero (001–9999).`,
        rejectedValue: trimmed,
      },
    ]);
  }

  for (const existing of existingProducts) {
    if (!existing || existing.takenDown) continue;
    if (currentProductId !== null && existing.id === currentProductId) continue;
    const existingSku = getProductSku(existing);
    if (existingSku.toUpperCase() === trimmed.toUpperCase()) {
      const existingTitle = existing.title || existing.name || `Product #${existing.id}`;
      return buildValidationResult([
        {
          field: 'sku',
          code: 'SKU_DUPLICATE',
          message: `SKU '${trimmed}' is already assigned to active product #${existing.id} (${existingTitle}).`,
          rejectedValue: trimmed,
        },
      ]);
    }
  }

  return buildValidationResult([], { sku: trimmed });
}

/**
 * Validates an absolute warehouse stock quantity (whole integer in `[0, 1000]`).
 */
export function validateProductStockLevel(
  rawStock: unknown,
  options?: { required?: boolean }
): ProductValidationResult {
  const required = Boolean(options?.required);

  if (rawStock === undefined || rawStock === null || String(rawStock).trim() === '') {
    if (required) {
      return buildValidationResult([
        {
          field: 'stockQuantity',
          code: 'STOCK_REQUIRED',
          message: `Stock quantity is required and must be an integer between ${MIN_STOCK_QUANTITY} and ${MAX_STOCK_QUANTITY}.`,
          rejectedValue: rawStock,
        },
      ]);
    }
    return buildValidationResult([]);
  }

  let parsedStock: number;
  if (typeof rawStock === 'number') {
    if (!Number.isFinite(rawStock) || !Number.isInteger(rawStock)) {
      return buildValidationResult([
        {
          field: 'stockQuantity',
          code: 'STOCK_NOT_INTEGER',
          message: `Stock quantity must be a whole integer (received ${rawStock}).`,
          rejectedValue: rawStock,
        },
      ]);
    }
    parsedStock = rawStock;
  } else {
    const rawStr = String(rawStock).trim();
    if (!/^[+-]?\d+$/.test(rawStr)) {
      return buildValidationResult([
        {
          field: 'stockQuantity',
          code: 'STOCK_NOT_INTEGER',
          message: `Stock quantity must be a valid whole integer (received '${rawStr}').`,
          rejectedValue: rawStock,
        },
      ]);
    }
    parsedStock = Number.parseInt(rawStr, 10);
    if (!Number.isSafeInteger(parsedStock)) {
      return buildValidationResult([
        {
          field: 'stockQuantity',
          code: 'STOCK_NOT_INTEGER',
          message: `Stock quantity is out of integer bounds (received '${rawStr}').`,
          rejectedValue: rawStock,
        },
      ]);
    }
  }

  if (parsedStock < MIN_STOCK_QUANTITY) {
    return buildValidationResult([
      {
        field: 'stockQuantity',
        code: 'STOCK_NEGATIVE',
        message: `Stock quantity cannot be negative (received ${parsedStock}). Minimum allowed stock is ${MIN_STOCK_QUANTITY} units.`,
        rejectedValue: parsedStock,
      },
    ]);
  }

  if (parsedStock > MAX_STOCK_QUANTITY) {
    return buildValidationResult([
      {
        field: 'stockQuantity',
        code: 'STOCK_EXCEEDS_MAX',
        message: `Stock quantity cannot exceed warehouse bin capacity of ${MAX_STOCK_QUANTITY} units per SKU (received ${parsedStock}).`,
        rejectedValue: parsedStock,
      },
    ]);
  }

  return buildValidationResult([], { stock: parsedStock });
}

/**
 * Validates a stock mutation (either setting an absolute target stock level or applying a delta/restock).
 */
export function validateProductStockAdjustment(
  currentStock: number,
  options: {
    targetStock?: unknown;
    delta?: unknown;
    isRestockOnly?: boolean;
  }
): ProductValidationResult {
  const baseStock = Math.max(0, Math.floor(Number(currentStock) || 0));
  const hasTarget =
    options?.targetStock !== undefined &&
    options?.targetStock !== null &&
    String(options.targetStock).trim() !== '';

  if (hasTarget) {
    return validateProductStockLevel(options.targetStock, { required: true });
  }

  const rawDelta = options?.delta;
  if (rawDelta === undefined || rawDelta === null || String(rawDelta).trim() === '') {
    return buildValidationResult([
      {
        field: 'delta',
        code: 'STOCK_MUTATION_REQUIRED',
        message: 'Provide either a valid stockQuantity (0–1000) or an integer stock delta.',
        rejectedValue: rawDelta,
      },
    ]);
  }

  let parsedDelta: number;
  if (typeof rawDelta === 'number') {
    if (!Number.isFinite(rawDelta) || !Number.isInteger(rawDelta)) {
      return buildValidationResult([
        {
          field: 'delta',
          code: 'DELTA_NOT_INTEGER',
          message: `Stock adjustment delta must be a whole integer (received ${rawDelta}).`,
          rejectedValue: rawDelta,
        },
      ]);
    }
    parsedDelta = rawDelta;
  } else {
    const rawStr = String(rawDelta).trim();
    if (!/^[+-]?\d+$/.test(rawStr)) {
      return buildValidationResult([
        {
          field: 'delta',
          code: 'DELTA_NOT_INTEGER',
          message: `Stock adjustment delta must be a valid whole integer (received '${rawStr}').`,
          rejectedValue: rawDelta,
        },
      ]);
    }
    parsedDelta = Number.parseInt(rawStr, 10);
  }

  if (options?.isRestockOnly) {
    if (parsedDelta < MIN_RESTOCK_AMOUNT || parsedDelta > MAX_RESTOCK_AMOUNT) {
      return buildValidationResult([
        {
          field: 'amount',
          code: 'RESTOCK_OUT_OF_RANGE',
          message: `Restock amount must be between ${MIN_RESTOCK_AMOUNT} and ${MAX_RESTOCK_AMOUNT} units (received ${parsedDelta}).`,
          rejectedValue: parsedDelta,
        },
      ]);
    }
  } else {
    if (parsedDelta < -MAX_STOCK_DELTA || parsedDelta > MAX_STOCK_DELTA) {
      return buildValidationResult([
        {
          field: 'delta',
          code: 'DELTA_OUT_OF_RANGE',
          message: `Stock adjustment delta must be between -${MAX_STOCK_DELTA} and +${MAX_STOCK_DELTA} units (received ${parsedDelta}).`,
          rejectedValue: parsedDelta,
        },
      ]);
    }
  }

  const resultingStock = baseStock + parsedDelta;
  if (resultingStock < MIN_STOCK_QUANTITY) {
    return buildValidationResult([
      {
        field: 'stockQuantity',
        code: 'STOCK_UNDERFLOW',
        message: `Stock adjustment of ${parsedDelta} units on current stock (${baseStock}) would result in negative stock (${resultingStock}).`,
        rejectedValue: resultingStock,
      },
    ]);
  }

  if (resultingStock > MAX_STOCK_QUANTITY) {
    return buildValidationResult([
      {
        field: 'stockQuantity',
        code: 'STOCK_OVERFLOW',
        message: `Stock adjustment of +${parsedDelta} units on current stock (${baseStock}) would exceed warehouse bin capacity of ${MAX_STOCK_QUANTITY} units (resulting in ${resultingStock}).`,
        rejectedValue: resultingStock,
      },
    ]);
  }

  return buildValidationResult([], { stock: resultingStock });
}

/**
 * Validates a full product create or modification request payload before updating the JSON data store.
 */
export function validateProductModificationPayload(
  payload: Record<string, unknown> | null | undefined,
  options?: {
    isCreate?: boolean;
    currentProductId?: number | null;
    existingProducts?: SkuValidationCatalogItem[];
  }
): ProductValidationResult {
  const isCreate = Boolean(options?.isCreate);
  const currentProductId = options?.currentProductId ?? null;
  const existingProducts = Array.isArray(options?.existingProducts) ? options!.existingProducts : [];
  const violations: ProductValidationViolation[] = [];

  if (!payload || typeof payload !== 'object') {
    return buildValidationResult([
      {
        field: 'body',
        code: 'PAYLOAD_REQUIRED',
        message: 'Request payload is required for product modification.',
        rejectedValue: payload,
      },
    ]);
  }

  const hasTitleField = 'title' in payload || 'name' in payload;
  if (isCreate || hasTitleField) {
    const rawTitle = 'title' in payload && payload.title !== undefined ? payload.title : payload.name;
    const cleanTitle = rawTitle !== undefined && rawTitle !== null ? String(rawTitle).trim() : '';
    if (!cleanTitle) {
      violations.push({
        field: 'title',
        code: 'TITLE_REQUIRED',
        message: 'Product name/title cannot be blank.',
        rejectedValue: rawTitle,
      });
    } else if (cleanTitle.length > 180) {
      violations.push({
        field: 'title',
        code: 'TITLE_TOO_LONG',
        message: 'Product name/title cannot exceed 180 characters.',
        rejectedValue: cleanTitle.length,
      });
    }
  }

  let normalizedSku: string | null = null;
  if ('sku' in payload) {
    const rawSku = payload.sku;
    const skuStr = rawSku !== undefined && rawSku !== null ? String(rawSku).trim() : '';
    if (skuStr !== '') {
      const skuRes = validateProductSku(rawSku, {
        required: true,
        currentProductId,
        existingProducts,
      });
      if (!skuRes.ok) {
        violations.push(...skuRes.errors);
      } else {
        normalizedSku = skuRes.normalizedSku ?? null;
      }
    } else if (!isCreate && rawSku !== undefined && rawSku !== null) {
      violations.push({
        field: 'sku',
        code: 'SKU_BLANK',
        message:
          'Product SKU cannot be cleared to an empty string. Provide a valid SKU (e.g. VB-GPU-019).',
        rejectedValue: rawSku,
      });
    }
  }

  let normalizedStock: number | null = null;
  const hasStockField = 'stockQuantity' in payload || 'quantity' in payload || 'stock' in payload;
  if (hasStockField) {
    const rawStock =
      payload.stockQuantity !== undefined
        ? payload.stockQuantity
        : payload.quantity !== undefined
          ? payload.quantity
          : payload.stock;
    const stockRes = validateProductStockLevel(rawStock, { required: true });
    if (!stockRes.ok) {
      violations.push(...stockRes.errors);
    } else {
      normalizedStock = stockRes.normalizedStock ?? null;
    }
  }

  let normalizedPrice: number | null = null;
  if (isCreate || 'price' in payload) {
    const rawPrice = payload.price;
    if (rawPrice === undefined || rawPrice === null || String(rawPrice).trim() === '') {
      if (isCreate) {
        violations.push({
          field: 'price',
          code: 'PRICE_REQUIRED',
          message: 'Unit price is required.',
          rejectedValue: rawPrice,
        });
      }
    } else {
      const parsedPrice = Number(rawPrice);
      if (typeof rawPrice === 'boolean' || Number.isNaN(parsedPrice) || !Number.isFinite(parsedPrice)) {
        violations.push({
          field: 'price',
          code: 'PRICE_INVALID',
          message: `Unit price must be a valid numeric amount (received '${String(rawPrice)}').`,
          rejectedValue: rawPrice,
        });
      } else if (parsedPrice < MIN_PRODUCT_PRICE || parsedPrice > MAX_PRODUCT_PRICE) {
        violations.push({
          field: 'price',
          code: 'PRICE_OUT_OF_RANGE',
          message: `Unit price must be between $${MIN_PRODUCT_PRICE.toFixed(2)} and $${MAX_PRODUCT_PRICE.toFixed(2)} (received ${parsedPrice}).`,
          rejectedValue: parsedPrice,
        });
      } else {
        normalizedPrice = roundMoney(parsedPrice);
      }
    }
  }

  return buildValidationResult(violations, {
    sku: normalizedSku,
    stock: normalizedStock,
    price: normalizedPrice,
  });
}

// ── Product Grid Card CSS Grid Template & Layout Consistency Engine ─────────

export const CARD_IMAGE_ASPECT_RATIO_LABEL = '4 / 3';
export const CARD_IMAGE_ASPECT_RATIO = 4 / 3;

export const PRODUCT_CARD_GRID_AREAS = [
  'media',
  'meta',
  'title',
  'desc',
  'rating',
  'price',
  'barcode',
  'actions',
] as const;

export type ProductCardGridArea = (typeof PRODUCT_CARD_GRID_AREAS)[number] | 'chart';

export interface ProductCardGridTemplateSpec {
  viewMode: 'grid' | 'list';
  columnCount: number;
  gridTemplateColumns: string;
  gridAutoRows: string;
  cardDisplay: 'grid';
  cardGridTemplateColumns: string;
  cardGridTemplateAreas: string[];
  cardGridTemplateRows: string;
  imageAspectRatio: string;
  imageAspectRatioNumeric: number;
  footerAlignSelf: 'end' | 'center';
}

export function resolveProductCardGridTemplate(options?: {
  viewMode?: 'grid' | 'list';
  isChartOpen?: boolean;
  viewportWidth?: number;
}): ProductCardGridTemplateSpec {
  const viewMode = options?.viewMode === 'list' ? 'list' : 'grid';
  const isChartOpen = Boolean(options?.isChartOpen);
  const vw =
    typeof options?.viewportWidth === 'number' && Number.isFinite(options.viewportWidth) && options.viewportWidth > 0
      ? options.viewportWidth
      : 1440;

  if (viewMode === 'list') {
    return {
      viewMode: 'list',
      columnCount: 1,
      gridTemplateColumns: 'minmax(0, 1fr)',
      gridAutoRows: 'auto',
      cardDisplay: 'grid',
      cardGridTemplateColumns: vw <= 820 ? '110px minmax(0, 1fr)' : '150px minmax(0, 1.5fr) minmax(0, 1fr) auto',
      cardGridTemplateAreas:
        vw <= 820
          ? ['"img meta"', '"img title"', '"img price"', '"actions actions"', '"chart chart"']
          : [
              '"img meta price actions"',
              '"img title price actions"',
              '"img desc barcode actions"',
              '"chart chart chart chart"',
            ],
      cardGridTemplateRows: 'auto',
      imageAspectRatio: CARD_IMAGE_ASPECT_RATIO_LABEL,
      imageAspectRatioNumeric: CARD_IMAGE_ASPECT_RATIO,
      footerAlignSelf: 'center',
    };
  }

  let columnCount = 4;
  if (vw <= 1024) {
    columnCount = 2;
  } else if (vw <= 1280) {
    columnCount = 3;
  }

  const areas = isChartOpen
    ? ['"media"', '"meta"', '"title"', '"desc"', '"rating"', '"price"', '"barcode"', '"chart"', '"actions"']
    : ['"media"', '"meta"', '"title"', '"desc"', '"rating"', '"price"', '"barcode"', '"actions"'];

  const rows = isChartOpen
    ? 'auto 24px 22px 34px 20px 32px 28px auto minmax(40px, 1fr)'
    : 'auto 24px 22px 34px 20px 32px 28px minmax(40px, 1fr)';

  return {
    viewMode: 'grid',
    columnCount,
    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
    gridAutoRows: '1fr',
    cardDisplay: 'grid',
    cardGridTemplateColumns: 'minmax(0, 1fr)',
    cardGridTemplateAreas: areas,
    cardGridTemplateRows: rows,
    imageAspectRatio: CARD_IMAGE_ASPECT_RATIO_LABEL,
    imageAspectRatioNumeric: CARD_IMAGE_ASPECT_RATIO,
    footerAlignSelf: 'end',
  };
}

export interface NormalizedProductCardSlots {
  id: number;
  title: string;
  description: string;
  ratingRate: number;
  ratingCount: number;
  ratingLabel: string;
  sku: string;
  formattedPrice: string;
  inrEstimateLabel: string;
}

export function normalizeProductCardContentSlots(product: {
  id: number;
  title?: string;
  name?: string;
  description?: string;
  ratingRate?: number;
  ratingCount?: number;
  price?: number;
  category?: string;
  sku?: string;
}): NormalizedProductCardSlots {
  const id = Number(product?.id) || 0;
  const rawTitle = String(product?.title || product?.name || `Hardware Component #${id}`).trim();
  const title = rawTitle || `Hardware Component #${id}`;
  const rawDesc = String(product?.description || '').trim();
  const description =
    rawDesc ||
    'Precision bench-verified hardware component with full ESD validation and manufacturer warranty.';

  const rawCount = Number(product?.ratingCount) || 0;
  const ratingCount = Math.max(0, Math.floor(rawCount));
  const rawRate = Number(product?.ratingRate);
  const ratingRate =
    ratingCount > 0 && Number.isFinite(rawRate) && rawRate > 0
      ? Math.min(5, Math.max(1, Math.round(rawRate * 10) / 10))
      : 4.8;
  const ratingLabel = ratingCount > 0 ? `${ratingRate} (${ratingCount})` : `${ratingRate.toFixed(1)} (Verified)`;

  const priceNum = Number.isFinite(Number(product?.price)) && Number(product?.price) >= 0 ? Number(product?.price) : 0;
  const formattedPrice = `$${priceNum.toFixed(2)}`;
  const inrEstimateLabel = `≈ ₹${Math.round(priceNum * 83.5).toLocaleString('en-IN')}`;
  const sku = getProductSku(product);

  return {
    id,
    title,
    description,
    ratingRate,
    ratingCount,
    ratingLabel,
    sku,
    formattedPrice,
    inrEstimateLabel,
  };
}

export interface CardLayoutMeasurement {
  cardId: string | number;
  cardRect: { top: number; bottom: number; width: number; height: number };
  imageRect: { width: number; height: number };
  footerRect: { top: number; bottom: number; height: number };
}

export interface ProductGridAlignmentAudit {
  totalCards: number;
  rowCount: number;
  allImagesMatchAspectRatio: boolean;
  maxAspectRatioVariancePct: number;
  allFootersPinnedToBottom: boolean;
  allRowsAligned: boolean;
  maxFooterBottomDeltaPx: number;
  maxCardHeightDeltaPx: number;
}

export function evaluateProductGridCardAlignment(
  measurements: CardLayoutMeasurement[],
  tolerancePx = 2.5
): ProductGridAlignmentAudit {
  const list = Array.isArray(measurements) ? measurements : [];
  if (list.length === 0) {
    return {
      totalCards: 0,
      rowCount: 0,
      allImagesMatchAspectRatio: true,
      maxAspectRatioVariancePct: 0,
      allFootersPinnedToBottom: true,
      allRowsAligned: true,
      maxFooterBottomDeltaPx: 0,
      maxCardHeightDeltaPx: 0,
    };
  }

  let maxAspectRatioVariancePct = 0;
  let allImagesMatchAspectRatio = true;
  let allFootersPinnedToBottom = true;

  for (const m of list) {
    const imgW = Number(m.imageRect?.width) || 0;
    const imgH = Number(m.imageRect?.height) || 0;
    if (imgW <= 0 || imgH <= 0) {
      allImagesMatchAspectRatio = false;
    } else {
      const actualRatio = imgW / imgH;
      const variancePct = (Math.abs(actualRatio - CARD_IMAGE_ASPECT_RATIO) / CARD_IMAGE_ASPECT_RATIO) * 100;
      if (variancePct > maxAspectRatioVariancePct) {
        maxAspectRatioVariancePct = Math.round(variancePct * 100) / 100;
      }
      if (variancePct > 2.0) {
        allImagesMatchAspectRatio = false;
      }
    }

    // Footer bottom should sit near card bottom (within card bottom padding ~8px-20px)
    const gapToCardBottom = (Number(m.cardRect?.bottom) || 0) - (Number(m.footerRect?.bottom) || 0);
    if (gapToCardBottom < -tolerancePx || gapToCardBottom > 24) {
      allFootersPinnedToBottom = false;
    }
  }

  // Group cards into visual rows by cardRect.top (within 8px vertical threshold)
  const rows: CardLayoutMeasurement[][] = [];
  const sortedByTop = list.slice().sort((a, b) => a.cardRect.top - b.cardRect.top);
  for (const item of sortedByTop) {
    const matchingRow = rows.find((r) => Math.abs(r[0].cardRect.top - item.cardRect.top) <= 8);
    if (matchingRow) {
      matchingRow.push(item);
    } else {
      rows.push([item]);
    }
  }

  let maxFooterBottomDeltaPx = 0;
  let maxCardHeightDeltaPx = 0;
  let allRowsAligned = true;

  for (const row of rows) {
    if (row.length <= 1) continue;
    const footerBottoms = row.map((c) => Number(c.footerRect.bottom) || 0);
    const cardHeights = row.map((c) => Number(c.cardRect.height) || 0);

    const fDelta = Math.max(...footerBottoms) - Math.min(...footerBottoms);
    const hDelta = Math.max(...cardHeights) - Math.min(...cardHeights);

    if (fDelta > maxFooterBottomDeltaPx) {
      maxFooterBottomDeltaPx = Math.round(fDelta * 100) / 100;
    }
    if (hDelta > maxCardHeightDeltaPx) {
      maxCardHeightDeltaPx = Math.round(hDelta * 100) / 100;
    }

    if (fDelta > tolerancePx || hDelta > tolerancePx) {
      allRowsAligned = false;
    }
  }

  return {
    totalCards: list.length,
    rowCount: rows.length,
    allImagesMatchAspectRatio,
    maxAspectRatioVariancePct,
    allFootersPinnedToBottom,
    allRowsAligned,
    maxFooterBottomDeltaPx,
    maxCardHeightDeltaPx,
  };
}

export interface CatalogFilterDrawerInput {
  stockFilter?: string | null;
  budgetMax?: number | null;
  sortMode?: string | null;
  activePromoCode?: string | null;
  batchEditActive?: boolean;
  isExpanded?: boolean;
}

export interface CatalogFilterDrawerSummary {
  activeCount: number;
  hasActiveFilters: boolean;
  activeTags: string[];
  buttonLabel: string;
  ariaExpanded: 'true' | 'false';
}

/**
 * Computes the progressive-disclosure state for the consolidated "Filters & Deals"
 * toolbar button so secondary filters (Stock, Budget, Best Deals, Promo Codes, Batch Edit)
 * stay neatly tucked away by default while surfacing active filter counts clearly.
 */
export function computeCatalogFilterDrawerSummary(
  input: CatalogFilterDrawerInput = {}
): CatalogFilterDrawerSummary {
  const tags: string[] = [];

  const stock = String(input.stockFilter || 'all').trim().toLowerCase();
  if (stock === 'available-now') {
    tags.push('In Stock');
  } else if (stock === 'backorder') {
    tags.push('Backorder');
  }

  const budget =
    typeof input.budgetMax === 'number' && Number.isFinite(input.budgetMax) && input.budgetMax > 0
      ? input.budgetMax
      : null;
  if (budget !== null) {
    tags.push(`Under $${budget}`);
  }

  const sort = String(input.sortMode || 'featured').trim().toLowerCase();
  if (sort === 'best-deal') {
    tags.push('6M Deals');
  }

  const promo = String(input.activePromoCode || '').trim().toUpperCase();
  if (promo.length > 0) {
    tags.push(promo);
  }

  if (input.batchEditActive) {
    tags.push('Batch Edit');
  }

  const activeCount = tags.length;
  const hasActiveFilters = activeCount > 0;
  const buttonLabel = hasActiveFilters ? `Filters & Deals (${activeCount})` : 'Filters & Deals';

  return {
    activeCount,
    hasActiveFilters,
    activeTags: tags,
    buttonLabel,
    ariaExpanded: input.isExpanded ? 'true' : 'false',
  };
}

// ============================================================================
// SERVER-SIDE SEARCH QUERY LOGGING & CATALOG GAP ANALYTICS (JAVA PARITY)
// ============================================================================

export interface SearchQueryLogEntry {
  id: number;
  rawQuery: string;
  normalizedQuery: string;
  categoryFilter: string;
  resultCount: number;
  zeroResultGap: boolean;
  inferredComponentGroup: string;
  source: string;
  actorName: string;
  timestamp: string;
}

export interface AggregatedSearchMetric {
  query: string;
  sampleRawQuery: string;
  searchCount: number;
  avgResultCount: number;
  latestResultCount: number;
  zeroResultCount: number;
  inferredGroup: string;
  recommendedSkuPrefix: string;
  lastSearchedAt: string;
  isCatalogGap: boolean;
  priorityLevel: 'CRITICAL_GAP' | 'HIGH_GAP' | 'EMERGING_GAP' | 'STOCKED';
}

export interface SearchCategoryDemandMetric {
  group: string;
  searchVolume: number;
  gapSearches: number;
  recommendedSkuPrefix: string;
}

export interface SearchAnalyticsReport {
  totalSearchesLogged: number;
  uniqueQueriesCount: number;
  zeroResultSearchesCount: number;
  distinctCatalogGapsCount: number;
  zeroResultRatePct: number;
  popularSearches: AggregatedSearchMetric[];
  catalogGaps: AggregatedSearchMetric[];
  categoryDemand: SearchCategoryDemandMetric[];
  recentSearchLogs: SearchQueryLogEntry[];
}

export function normalizeSearchQueryForLog(rawQuery?: string | null): string {
  if (!rawQuery) return '';
  return String(rawQuery)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s\-+.]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function inferHardwareGroupFromSearchQuery(
  normalizedQuery?: string | null,
  categoryFilter?: string | null
): string {
  const cat = String(categoryFilter || '').trim().toLowerCase();
  if (
    cat &&
    cat !== 'all' &&
    cat !== 'low-stock' &&
    cat !== 'wishlist' &&
    ['gpus', 'cpus', 'motherboards', 'storage', 'audio', 'gaming'].includes(cat)
  ) {
    return cat;
  }

  const q = normalizeSearchQueryForLog(normalizedQuery);
  if (!q) return 'accessories';

  if (
    /\b(rtx|gtx|radeon|rx|gpu|graphics|vram|geforce|arc|quadro|4090|5090|4080|5080|7900)\b/.test(q)
  ) {
    return 'gpus';
  }
  if (/\b(ryzen|intel|core|i9|i7|i5|threadripper|xeon|cpu|processor|am5|lga1700|9800x3d|7800x3d)\b/.test(q)) {
    return 'cpus';
  }
  if (/\b(motherboard|mainboard|b650|x670|x870|z790|z890|b570|atx|itx|mobo|pcie|bios|ddr5|ram|memory|ecc)\b/.test(q)) {
    return 'motherboards';
  }
  if (/\b(ssd|nvme|m\.2|harddisk|hdd|storage|sata|2tb|4tb|8tb|nas|gen5)\b/.test(q)) {
    return 'storage';
  }
  if (/\b(dac|amp|headphone|headset|microphone|mic|xlr|speaker|audio|soundcard|iems|earbuds)\b/.test(q)) {
    return 'audio';
  }
  if (/\b(ps5|xbox|switch|steam\s*deck|controller|gamepad|vr|console|oled|monitor|keyboard|mouse|gaming)\b/.test(q)) {
    return 'gaming';
  }
  return 'accessories';
}

export function recommendedSkuPrefixForSearchGroup(group?: string | null): string {
  const g = String(group || '').trim().toLowerCase();
  switch (g) {
    case 'gpus':
      return 'VB-GPU-';
    case 'cpus':
      return 'VB-CPU-';
    case 'motherboards':
      return 'VB-MBD-';
    case 'storage':
      return 'VB-STR-';
    case 'audio':
      return 'VB-AUD-';
    case 'gaming':
      return 'VB-GAM-';
    default:
      return 'VB-PRT-';
  }
}

export function createSearchQueryLogEntry(input: {
  id: number;
  rawQuery: string;
  categoryFilter?: string | null;
  resultCount: number;
  source?: string | null;
  actorName?: string | null;
  timestamp?: string | null;
}): SearchQueryLogEntry | null {
  const rawTrimmed = String(input.rawQuery || '').trim();
  const normalized = normalizeSearchQueryForLog(rawTrimmed);
  if (normalized.length < 2) {
    return null;
  }

  const cleanCategory =
    input.categoryFilter && String(input.categoryFilter).trim()
      ? String(input.categoryFilter).trim().toLowerCase()
      : 'all';
  const safeResults = Math.max(0, Math.floor(Number(input.resultCount) || 0));
  const inferredGroup = inferHardwareGroupFromSearchQuery(normalized, cleanCategory);
  const cleanSource =
    input.source && String(input.source).trim()
      ? String(input.source).trim().toLowerCase()
      : 'catalog-search';
  const cleanActor =
    input.actorName && String(input.actorName).trim()
      ? String(input.actorName).trim()
      : 'guest';

  return {
    id: Math.max(1, Math.floor(Number(input.id) || 1)),
    rawQuery: rawTrimmed,
    normalizedQuery: normalized,
    categoryFilter: cleanCategory,
    resultCount: safeResults,
    zeroResultGap: safeResults === 0,
    inferredComponentGroup: inferredGroup,
    source: cleanSource,
    actorName: cleanActor,
    timestamp: input.timestamp || new Date().toISOString(),
  };
}

export const DEFAULT_SEEDED_SEARCH_LOGS: Array<Omit<SearchQueryLogEntry, 'id'>> = [
  // Popular matched component searches
  { rawQuery: 'RTX 5090', normalizedQuery: 'rtx 5090', categoryFilter: 'all', resultCount: 2, zeroResultGap: false, inferredComponentGroup: 'gpus', source: 'catalog-search', actorName: 'builder_arjun', timestamp: new Date(Date.now() - 4200 * 1000).toISOString() },
  { rawQuery: 'rtx 5090', normalizedQuery: 'rtx 5090', categoryFilter: 'gpus', resultCount: 2, zeroResultGap: false, inferredComponentGroup: 'gpus', source: 'catalog-search', actorName: 'guest', timestamp: new Date(Date.now() - 3900 * 1000).toISOString() },
  { rawQuery: 'Nvidia RTX 5090', normalizedQuery: 'nvidia rtx 5090', categoryFilter: 'all', resultCount: 1, zeroResultGap: false, inferredComponentGroup: 'gpus', source: 'voice-search', actorName: 'kiran_oc', timestamp: new Date(Date.now() - 3500 * 1000).toISOString() },
  { rawQuery: 'RTX 5090', normalizedQuery: 'rtx 5090', categoryFilter: 'all', resultCount: 2, zeroResultGap: false, inferredComponentGroup: 'gpus', source: 'catalog-search', actorName: 'dev_rig_lab', timestamp: new Date(Date.now() - 2900 * 1000).toISOString() },
  { rawQuery: 'RTX 5090', normalizedQuery: 'rtx 5090', categoryFilter: 'gpus', resultCount: 2, zeroResultGap: false, inferredComponentGroup: 'gpus', source: 'catalog-search', actorName: 'ananya_render', timestamp: new Date(Date.now() - 1100 * 1000).toISOString() },
  { rawQuery: 'Ryzen 9', normalizedQuery: 'ryzen 9', categoryFilter: 'cpus', resultCount: 2, zeroResultGap: false, inferredComponentGroup: 'cpus', source: 'catalog-search', actorName: 'guest', timestamp: new Date(Date.now() - 3400 * 1000).toISOString() },
  { rawQuery: 'AMD Ryzen 9', normalizedQuery: 'amd ryzen 9', categoryFilter: 'all', resultCount: 2, zeroResultGap: false, inferredComponentGroup: 'cpus', source: 'catalog-search', actorName: 'meera_cad', timestamp: new Date(Date.now() - 2700 * 1000).toISOString() },
  { rawQuery: 'Ryzen 9', normalizedQuery: 'ryzen 9', categoryFilter: 'all', resultCount: 2, zeroResultGap: false, inferredComponentGroup: 'cpus', source: 'catalog-search', actorName: 'guest', timestamp: new Date(Date.now() - 1800 * 1000).toISOString() },
  { rawQuery: 'NVMe SSD', normalizedQuery: 'nvme ssd', categoryFilter: 'storage', resultCount: 3, zeroResultGap: false, inferredComponentGroup: 'storage', source: 'catalog-search', actorName: 'guest', timestamp: new Date(Date.now() - 3100 * 1000).toISOString() },
  { rawQuery: 'NVMe SSD', normalizedQuery: 'nvme ssd', categoryFilter: 'all', resultCount: 3, zeroResultGap: false, inferredComponentGroup: 'storage', source: 'catalog-search', actorName: 'rohan_nas', timestamp: new Date(Date.now() - 1900 * 1000).toISOString() },
  { rawQuery: 'OLED monitor', normalizedQuery: 'oled monitor', categoryFilter: 'gaming', resultCount: 2, zeroResultGap: false, inferredComponentGroup: 'gaming', source: 'catalog-search', actorName: 'guest', timestamp: new Date(Date.now() - 2200 * 1000).toISOString() },
  { rawQuery: 'B570 motherboard', normalizedQuery: 'b570 motherboard', categoryFilter: 'motherboards', resultCount: 1, zeroResultGap: false, inferredComponentGroup: 'motherboards', source: 'catalog-search', actorName: 'guest', timestamp: new Date(Date.now() - 1600 * 1000).toISOString() },

  // Zero-result catalog gap searches (high-demand unstocked components)
  { rawQuery: 'DDR5 64GB ECC RAM', normalizedQuery: 'ddr5 64gb ecc ram', categoryFilter: 'motherboards', resultCount: 0, zeroResultGap: true, inferredComponentGroup: 'motherboards', source: 'catalog-search', actorName: 'ai_workstation_blr', timestamp: new Date(Date.now() - 3800 * 1000).toISOString() },
  { rawQuery: 'ddr5 64gb ecc ram', normalizedQuery: 'ddr5 64gb ecc ram', categoryFilter: 'all', resultCount: 0, zeroResultGap: true, inferredComponentGroup: 'motherboards', source: 'catalog-search', actorName: 'guest', timestamp: new Date(Date.now() - 2600 * 1000).toISOString() },
  { rawQuery: 'DDR5 64GB ECC RAM', normalizedQuery: 'ddr5 64gb ecc ram', categoryFilter: 'all', resultCount: 0, zeroResultGap: true, inferredComponentGroup: 'motherboards', source: 'voice-search', actorName: 'vikram_ml', timestamp: new Date(Date.now() - 1200 * 1000).toISOString() },
  { rawQuery: 'PCIe 5.0 Riser Cable', normalizedQuery: 'pcie 5.0 riser cable', categoryFilter: 'all', resultCount: 0, zeroResultGap: true, inferredComponentGroup: 'motherboards', source: 'catalog-search', actorName: 'sff_builder', timestamp: new Date(Date.now() - 3200 * 1000).toISOString() },
  { rawQuery: 'pcie 5.0 riser cable', normalizedQuery: 'pcie 5.0 riser cable', categoryFilter: 'all', resultCount: 0, zeroResultGap: true, inferredComponentGroup: 'motherboards', source: 'catalog-search', actorName: 'guest', timestamp: new Date(Date.now() - 1400 * 1000).toISOString() },
  { rawQuery: '8TB NVMe Gen5', normalizedQuery: '8tb nvme gen5', categoryFilter: 'storage', resultCount: 0, zeroResultGap: true, inferredComponentGroup: 'storage', source: 'catalog-search', actorName: 'studio_edit_pro', timestamp: new Date(Date.now() - 2400 * 1000).toISOString() },
  { rawQuery: '8tb nvme gen5', normalizedQuery: '8tb nvme gen5', categoryFilter: 'all', resultCount: 0, zeroResultGap: true, inferredComponentGroup: 'storage', source: 'catalog-search', actorName: 'guest', timestamp: new Date(Date.now() - 950 * 1000).toISOString() },
  { rawQuery: 'Threadripper PRO 7995WX', normalizedQuery: 'threadripper pro 7995wx', categoryFilter: 'cpus', resultCount: 0, zeroResultGap: true, inferredComponentGroup: 'cpus', source: 'catalog-search', actorName: 'vfx_render_node', timestamp: new Date(Date.now() - 1500 * 1000).toISOString() },
  { rawQuery: 'XLR Boom Arm', normalizedQuery: 'xlr boom arm', categoryFilter: 'audio', resultCount: 0, zeroResultGap: true, inferredComponentGroup: 'audio', source: 'catalog-search', actorName: 'podcaster_ind', timestamp: new Date(Date.now() - 800 * 1000).toISOString() },
];

export function computeSearchQueryAnalytics(
  rawLogs: SearchQueryLogEntry[] = [],
  currentCatalogProducts: Array<{ id?: number; title?: string; category?: string; sku?: string; description?: string }> = []
): SearchAnalyticsReport {
  const logs = Array.isArray(rawLogs) ? rawLogs.filter(Boolean) : [];
  const totalSearches = logs.length;
  const zeroResultSearches = logs.filter((l) => l.zeroResultGap || l.resultCount === 0).length;

  interface Bucket {
    normalizedQuery: string;
    sampleRawQuery: string;
    searchCount: number;
    totalResultsAccumulated: number;
    latestResultCount: number;
    zeroResultCount: number;
    inferredGroup: string;
    lastSearchedAt: string;
  }

  const buckets = new Map<string, Bucket>();

  for (const entry of logs) {
    const norm = normalizeSearchQueryForLog(entry.normalizedQuery || entry.rawQuery);
    if (!norm) continue;

    let b = buckets.get(norm);
    if (!b) {
      b = {
        normalizedQuery: norm,
        sampleRawQuery: entry.rawQuery || norm,
        searchCount: 0,
        totalResultsAccumulated: 0,
        latestResultCount: entry.resultCount,
        zeroResultCount: 0,
        inferredGroup:
          entry.inferredComponentGroup ||
          inferHardwareGroupFromSearchQuery(norm, entry.categoryFilter),
        lastSearchedAt: entry.timestamp || '',
      };
      buckets.set(norm, b);
    }

    b.searchCount += 1;
    b.totalResultsAccumulated += Math.max(0, Number(entry.resultCount) || 0);
    if (entry.zeroResultGap || entry.resultCount === 0) {
      b.zeroResultCount += 1;
    }
    if (entry.timestamp && (!b.lastSearchedAt || entry.timestamp >= b.lastSearchedAt)) {
      b.lastSearchedAt = entry.timestamp;
      b.latestResultCount = entry.resultCount;
      if (entry.rawQuery) {
        b.sampleRawQuery = entry.rawQuery;
      }
    }
  }

  // Re-evaluate against current live catalog so if an admin just stocked a gap item,
  // its latestResultCount reflects the newly added SKU immediately!
  const hasLiveCatalog = Array.isArray(currentCatalogProducts) && currentCatalogProducts.length > 0;

  const allAggregated: AggregatedSearchMetric[] = Array.from(buckets.values())
    .map((b) => {
      let liveCount = b.latestResultCount;
      if (hasLiveCatalog) {
        const qLower = b.normalizedQuery.toLowerCase();
        liveCount = currentCatalogProducts.filter((p) => {
          const hay = `${p.title || ''} ${p.description || ''} ${p.category || ''} ${p.sku || ''}`.toLowerCase();
          return hay.includes(qLower);
        }).length;
      }

      const avgRes =
        b.searchCount > 0 ? Math.round((b.totalResultsAccumulated / b.searchCount) * 10) / 10 : 0;
      const isGap = liveCount === 0 && b.zeroResultCount > 0;
      const priorityLevel: AggregatedSearchMetric['priorityLevel'] = isGap
        ? b.searchCount >= 3
          ? 'CRITICAL_GAP'
          : b.searchCount >= 2
          ? 'HIGH_GAP'
          : 'EMERGING_GAP'
        : 'STOCKED';

      return {
        query: b.normalizedQuery,
        sampleRawQuery: b.sampleRawQuery,
        searchCount: b.searchCount,
        avgResultCount: avgRes,
        latestResultCount: liveCount,
        zeroResultCount: b.zeroResultCount,
        inferredGroup: b.inferredGroup,
        recommendedSkuPrefix: recommendedSkuPrefixForSearchGroup(b.inferredGroup),
        lastSearchedAt: b.lastSearchedAt,
        isCatalogGap: isGap,
        priorityLevel,
      };
    })
    .sort((a, b) => {
      if (b.searchCount !== a.searchCount) return b.searchCount - a.searchCount;
      return (b.lastSearchedAt || '').localeCompare(a.lastSearchedAt || '');
    });

  const popularSearches = allAggregated.slice(0, 12);
  const catalogGaps = allAggregated
    .filter((m) => m.isCatalogGap)
    .sort((a, b) => {
      if (b.zeroResultCount !== a.zeroResultCount) return b.zeroResultCount - a.zeroResultCount;
      return b.searchCount - a.searchCount;
    })
    .slice(0, 12);

  const groupMap = new Map<string, { group: string; searchVolume: number; gapSearches: number }>();
  for (const m of allAggregated) {
    const g = m.inferredGroup || 'accessories';
    const curr = groupMap.get(g) || { group: g, searchVolume: 0, gapSearches: 0 };
    curr.searchVolume += m.searchCount;
    curr.gapSearches += m.isCatalogGap ? m.zeroResultCount : 0;
    groupMap.set(g, curr);
  }

  const categoryDemand: SearchCategoryDemandMetric[] = Array.from(groupMap.values())
    .map((g) => ({
      group: g.group,
      searchVolume: g.searchVolume,
      gapSearches: g.gapSearches,
      recommendedSkuPrefix: recommendedSkuPrefixForSearchGroup(g.group),
    }))
    .sort((a, b) => b.searchVolume - a.searchVolume);

  const recentSearchLogs = [...logs]
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
    .slice(0, 30);

  const zeroResultRatePct =
    totalSearches > 0 ? Math.round((zeroResultSearches / totalSearches) * 1000) / 10 : 0;

  return {
    totalSearchesLogged: totalSearches,
    uniqueQueriesCount: buckets.size,
    zeroResultSearchesCount: zeroResultSearches,
    distinctCatalogGapsCount: catalogGaps.length,
    zeroResultRatePct,
    popularSearches,
    catalogGaps,
    categoryDemand,
    recentSearchLogs,
  };
}

// ============================================================================
// iOS / APPLE HIG LIGHT MODE, DARK MODE & SF PRO TYPOGRAPHY TOKENS
// ============================================================================

export type IosColorMode = 'light' | 'dark';

export const IOS_SYSTEM_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';

export const IOS_DISPLAY_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif';

export const IOS_MONO_FONT_STACK =
  '"SF Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

export interface IosColorModeTokens {
  mode: IosColorMode;
  label: string;
  shortLabel: string;
  nextMode: IosColorMode;
  nextModeLabel: string;
  bgGroupedPrimary: string;
  bgGroupedSecondary: string;
  surfaceElevated: string;
  surfaceFrosted: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  iosSystemBlue: string;
  iosSystemGreen: string;
  iosSystemOrange: string;
  iosSystemRed: string;
  separatorHairline: string;
  backdropFilter: string;
  cardBorderRadiusPx: number;
  fontSans: string;
  fontDisplay: string;
  fontMono: string;
}

export function resolveIosColorMode(rawMode?: string | null): IosColorMode {
  const cleaned = String(rawMode || '').trim().toLowerCase();
  if (cleaned === 'light' || cleaned === 'ios-light' || cleaned === 'day') {
    return 'light';
  }
  return 'dark';
}

export function toggleIosColorMode(currentMode?: string | null): IosColorMode {
  return resolveIosColorMode(currentMode) === 'light' ? 'dark' : 'light';
}

export function getIosColorModeTokens(rawMode?: string | null): IosColorModeTokens {
  const mode = resolveIosColorMode(rawMode);
  if (mode === 'light') {
    return {
      mode: 'light',
      label: 'iOS Light Mode',
      shortLabel: 'Light',
      nextMode: 'dark',
      nextModeLabel: 'Switch to Dark Mode',
      bgGroupedPrimary: '#F2F2F7',
      bgGroupedSecondary: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      surfaceFrosted: 'rgba(255, 255, 255, 0.82)',
      textPrimary: '#1C1C1E',
      textSecondary: '#3A3A3C',
      textMuted: '#6C6C70',
      iosSystemBlue: '#007AFF',
      iosSystemGreen: '#34C759',
      iosSystemOrange: '#FF9500',
      iosSystemRed: '#FF3B30',
      separatorHairline: 'rgba(60, 60, 67, 0.14)',
      backdropFilter: 'saturate(180%) blur(20px)',
      cardBorderRadiusPx: 16,
      fontSans: IOS_SYSTEM_FONT_STACK,
      fontDisplay: IOS_DISPLAY_FONT_STACK,
      fontMono: IOS_MONO_FONT_STACK,
    };
  }

  return {
    mode: 'dark',
    label: 'iOS Dark Mode',
    shortLabel: 'Dark',
    nextMode: 'light',
    nextModeLabel: 'Switch to Light Mode',
    bgGroupedPrimary: '#000000',
    bgGroupedSecondary: '#1C1C1E',
    surfaceElevated: '#1C1C1E',
    surfaceFrosted: 'rgba(28, 28, 30, 0.80)',
    textPrimary: '#F2F2F7',
    textSecondary: '#AEAEB2',
    textMuted: '#8E8E93',
    iosSystemBlue: '#0A84FF',
    iosSystemGreen: '#30D158',
    iosSystemOrange: '#FF9F0A',
    iosSystemRed: '#FF453A',
    separatorHairline: 'rgba(84, 84, 88, 0.42)',
    backdropFilter: 'saturate(180%) blur(20px)',
    cardBorderRadiusPx: 16,
    fontSans: IOS_SYSTEM_FONT_STACK,
    fontDisplay: IOS_DISPLAY_FONT_STACK,
    fontMono: IOS_MONO_FONT_STACK,
  };
}

/* ============================================================================
   iOS / Apple HIG Haptic Feedback Service Pure Logic
   Mimics UISelectionFeedbackGenerator, UIImpactFeedbackGenerator (.light, .medium, .heavy)
   and UINotificationFeedbackGenerator (.success, .warning, .error)
   ============================================================================ */

export type HapticFeedbackType =
  | 'selection'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error';

export interface HapticPatternDefinition {
  type: HapticFeedbackType;
  pattern: number[];
  label: string;
  higEquivalent: string;
  description: string;
}

export const IOS_HAPTIC_PATTERNS: Record<HapticFeedbackType, HapticPatternDefinition> = {
  selection: {
    type: 'selection',
    pattern: [10],
    label: 'Selection',
    higEquivalent: 'UISelectionFeedbackGenerator',
    description: 'Ultra-crisp 10ms tap for filter chips, category tabs, and segmented controls.',
  },
  light: {
    type: 'light',
    pattern: [15],
    label: 'Light Impact',
    higEquivalent: 'UIImpactFeedbackGenerator(style: .light)',
    description: 'Subtle 15ms impact for general buttons, sheet toggles, and modal dismissals.',
  },
  medium: {
    type: 'medium',
    pattern: [25],
    label: 'Medium Impact',
    higEquivalent: 'UIImpactFeedbackGenerator(style: .medium)',
    description: 'Noticeable 25ms impact for quantity increments, cart add, and compare toggles.',
  },
  heavy: {
    type: 'heavy',
    pattern: [40],
    label: 'Heavy Impact',
    higEquivalent: 'UIImpactFeedbackGenerator(style: .heavy)',
    description: 'Solid 40ms pulse for checkout initiation, rig builder completion, and batch actions.',
  },
  success: {
    type: 'success',
    pattern: [15, 55, 25],
    label: 'Success Notification',
    higEquivalent: 'UINotificationFeedbackGenerator(notificationType: .success)',
    description: 'Signature iOS double-pulse for order placement, wishlist save, and coupon redemption.',
  },
  warning: {
    type: 'warning',
    pattern: [25, 50, 25],
    label: 'Warning Notification',
    higEquivalent: 'UINotificationFeedbackGenerator(notificationType: .warning)',
    description: 'Two sharp pulses for backorders, removals, and stock depletion alerts.',
  },
  error: {
    type: 'error',
    pattern: [35, 45, 35, 45, 40],
    label: 'Error Notification',
    higEquivalent: 'UINotificationFeedbackGenerator(notificationType: .error)',
    description: 'Three rapid warning pulses for failed validations, network disconnects, or card declines.',
  },
};

export function resolveHapticFeedbackPattern(rawType?: string | null): number[] {
  if (!rawType) return IOS_HAPTIC_PATTERNS.light.pattern;
  const normalized = rawType.toLowerCase().trim() as HapticFeedbackType;
  if (normalized in IOS_HAPTIC_PATTERNS) {
    return IOS_HAPTIC_PATTERNS[normalized].pattern;
  }
  return IOS_HAPTIC_PATTERNS.light.pattern;
}

export function isHapticFeedbackSupported(navigatorLike?: { vibrate?: unknown } | null): boolean {
  if (!navigatorLike) return false;
  return typeof navigatorLike.vibrate === 'function';
}

export function resolveHapticFeedbackPreference(stored?: string | null): boolean {
  if (stored === null || stored === undefined) return true;
  const s = String(stored).trim().toLowerCase();
  if (s === '0' || s === 'false' || s === 'off' || s === 'disabled') {
    return false;
  }
  return true;
}

export function inferHapticTypeForElement(elementMetadata: {
  tagName?: string;
  className?: string;
  role?: string;
  datasetHaptic?: string;
  isActionSuccess?: boolean;
}): HapticFeedbackType {
  if (elementMetadata.isActionSuccess) return 'success';
  if (elementMetadata.datasetHaptic && elementMetadata.datasetHaptic in IOS_HAPTIC_PATTERNS) {
    return elementMetadata.datasetHaptic as HapticFeedbackType;
  }

  const cls = (elementMetadata.className || '').toLowerCase();
  const role = (elementMetadata.role || '').toLowerCase();

  if (cls.includes('checkout') || cls.includes('batch-apply')) {
    return 'heavy';
  }
  if (cls.includes('qty-btn') || cls.includes('cart') || cls.includes('wishlist') || cls.includes('notify')) {
    return 'medium';
  }
  if (
    role === 'tab' ||
    role === 'radio' ||
    role === 'switch' ||
    cls.includes('filter-tab') ||
    cls.includes('chip') ||
    cls.includes('view-toggle') ||
    cls.includes('theme-mode')
  ) {
    return 'selection';
  }

  return 'light';
}

export interface HapticExecutionResult {
  type: HapticFeedbackType;
  pattern: number[];
  executed: boolean;
  reason: 'vibrated' | 'disabled_by_user' | 'unsupported_platform';
  higEquivalent: string;
}

export function evaluateHapticTrigger(
  type: HapticFeedbackType,
  options?: {
    enabled?: boolean;
    hasVibrateApi?: boolean;
    lastTriggerTimestamp?: number;
    now?: number;
    debounceMs?: number;
  }
): HapticExecutionResult {
  const enabled = options?.enabled ?? true;
  const hasVibrate = options?.hasVibrateApi ?? true;
  const pattern = resolveHapticFeedbackPattern(type);
  const higEquivalent = IOS_HAPTIC_PATTERNS[type]?.higEquivalent || 'UIImpactFeedbackGenerator';

  if (!enabled) {
    return {
      type,
      pattern,
      executed: false,
      reason: 'disabled_by_user',
      higEquivalent,
    };
  }

  if (!hasVibrate) {
    return {
      type,
      pattern,
      executed: false,
      reason: 'unsupported_platform',
      higEquivalent,
    };
  }

  const debounceMs = options?.debounceMs ?? 30;
  if (
    options?.lastTriggerTimestamp !== undefined &&
    options?.now !== undefined &&
    options.now - options.lastTriggerTimestamp < debounceMs
  ) {
    return {
      type,
      pattern,
      executed: false,
      reason: 'vibrated',
      higEquivalent,
    };
  }

  return {
    type,
    pattern,
    executed: true,
    reason: 'vibrated',
    higEquivalent,
  };
}



