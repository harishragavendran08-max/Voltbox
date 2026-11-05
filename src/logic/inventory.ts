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

  // Construct comparative rows
  const metrics: ComparisonMetricRow[] = [
    {
      key: 'price',
      label: 'Retail Price',
      category: 'pricing',
      values: Object.fromEntries(enrichedProducts.map((p) => [p.id, `$${p.price.toFixed(2)}`])),
      hasDifference: enrichedProducts.some((p) => p.price !== enrichedProducts[0].price),
      bestProductId: lowestPriceItem.id,
      highlightNote: priceSpread > 0 ? `$${priceSpread.toFixed(2)} price difference` : 'Identical pricing',
    },
    {
      key: 'componentGroup',
      label: 'Component Class',
      category: 'hardware',
      values: Object.fromEntries(enrichedProducts.map((p) => [p.id, p.groupLabel])),
      hasDifference: enrichedProducts.some((p) => p.groupLabel !== enrichedProducts[0].groupLabel),
    },
    {
      key: 'architecture',
      label: 'Silicon Architecture',
      category: 'hardware',
      values: Object.fromEntries(enrichedProducts.map((p) => [p.id, p.specs.architecture])),
      hasDifference: enrichedProducts.some((p) => p.specs.architecture !== enrichedProducts[0].specs.architecture),
    },
    {
      key: 'interfaceSpec',
      label: 'Bus & Interface',
      category: 'hardware',
      values: Object.fromEntries(enrichedProducts.map((p) => [p.id, p.specs.interfaceSpec])),
      hasDifference: enrichedProducts.some((p) => p.specs.interfaceSpec !== enrichedProducts[0].specs.interfaceSpec),
    },
    {
      key: 'powerDraw',
      label: 'Thermal TDP & Power',
      category: 'power',
      values: Object.fromEntries(enrichedProducts.map((p) => [p.id, p.specs.powerDraw])),
      hasDifference: enrichedProducts.some((p) => p.specs.powerDraw !== enrichedProducts[0].specs.powerDraw),
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
    },
    {
      key: 'warranty',
      label: 'Warranty & Testing',
      category: 'support',
      values: Object.fromEntries(enrichedProducts.map((p) => [p.id, p.specs.warranty])),
      hasDifference: enrichedProducts.some((p) => p.specs.warranty !== enrichedProducts[0].specs.warranty),
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
  triggered: boolean;
  triggeredAt: number | null;
  triggeredPrice: number | null;
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
    triggered: alreadyBelow,
    triggeredAt: alreadyBelow ? now : null,
    triggeredPrice: alreadyBelow ? currentPrice : null,
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

export type CatalogSortMode = 'featured' | 'price-asc' | 'price-desc' | 'rating-desc' | 'stock-asc';
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
  ratingRate?: number;
  ratingCount?: number;
  addedByName?: string;
}

export interface CatalogFilterOptions {
  categoryFilter?: string;
  searchQuery?: string;
  maxBudget?: number | null;
  sortMode?: CatalogSortMode;
  wishlistIds?: number[];
}

export interface CatalogFilterResult<T extends CatalogFilterProduct> {
  items: T[];
  visibleCount: number;
  totalCount: number;
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
  const sortMode: CatalogSortMode = options.sortMode || 'featured';
  const wishlistSet = new Set((options.wishlistIds || []).map((id) => Number(id)));

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

    return true;
  });

  const activeFilterLabels: string[] = [];
  if (cat !== 'all') activeFilterLabels.push(`Category: ${cat}`);
  if (query) activeFilterLabels.push(`Search: "${query}"`);
  if (maxBudget !== null) activeFilterLabels.push(`Under $${maxBudget}`);
  if (sortMode !== 'featured') activeFilterLabels.push(`Sort: ${sortMode}`);

  return {
    items: filtered,
    visibleCount: filtered.length,
    totalCount,
    hasActiveFilters: cat !== 'all' || query.length > 0 || maxBudget !== null || sortMode !== 'featured',
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


