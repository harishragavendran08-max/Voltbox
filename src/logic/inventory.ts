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
  if (hay.includes('ryzen') || hay.includes('intel') || hay.includes('core ultra') || hay.includes('core i') || hay.includes('cpu') || hay.includes('processor') || hay.includes('noctua') || hay.includes('cooler')) {
    return 'cpus';
  }
  if (hay.includes('motherboard') || hay.includes('b550') || hay.includes('b570') || hay.includes('x670') || hay.includes('x870') || hay.includes('crosshair') || hay.includes('z790') || hay.includes('tomahawk') || hay.includes('ddr5') || hay.includes('vengeance') || hay.includes('raspberry')) {
    return 'motherboards';
  }
  if (hay.includes('ssd') || hay.includes('nvme') || hay.includes('mp700') || hay.includes('sn850') || hay.includes('harddisk') || hay.includes('hard disk') || hay.includes('hdd') || hay.includes('storage')) {
    return 'storage';
  }
  if (hay.includes('airpods') || hay.includes('headphone') || hay.includes('xm5') || hay.includes('earbud') || hay.includes('audio') || hay.includes('speaker') || hay.includes('mic') || hay.includes('shure') || hay.includes('sm7') || hay.includes('broadcast') || hay.includes('webcam') || hay.includes('facecam')) {
    return 'audio';
  }
  if (hay.includes('playstation') || hay.includes('ps5') || hay.includes('xbox') || hay.includes('controller') || hay.includes('console') || hay.includes('handheld') || hay.includes('aethel') || hay.includes('steam deck') || hay.includes('mouse') || hay.includes('viper') || hay.includes('apex pro') || hay.includes('gaming') || hay.includes('alienware') || hay.includes('oled') || hay.includes('monitor') || hay.includes('keychron') || hay.includes('keyboard')) {
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

export interface DeviceViewportProfile {
  deviceTier: 'mobile' | 'ipad-tablet' | 'desktop';
  columnsSuggested: number;
  showBottomAppDock: boolean;
  compactOrderBarByDefault: boolean;
}

export function classifyDeviceViewport(width: number, _height = 800): DeviceViewportProfile {
  const w = Number.isFinite(width) && width > 0 ? width : 1280;
  if (w <= 680) {
    return {
      deviceTier: 'mobile',
      columnsSuggested: 2,
      showBottomAppDock: true,
      compactOrderBarByDefault: true,
    };
  }
  if (w <= 1040) {
    return {
      deviceTier: 'ipad-tablet',
      columnsSuggested: 3,
      showBottomAppDock: true,
      compactOrderBarByDefault: false,
    };
  }
  return {
    deviceTier: 'desktop',
    columnsSuggested: 4,
    showBottomAppDock: false,
    compactOrderBarByDefault: false,
  };
}
