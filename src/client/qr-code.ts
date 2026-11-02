import QRCode from 'qrcode';
import jsQR from 'jsqr';

export const VOLTBOX_QR_THEMES = {
  gold: {
    dark: '#ffd23f', // Voltbox Electric Gold
    light: '#0a0e17', // Voltbox Cyber Charcoal Chassis
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

export interface QrOptions {
  margin?: number;
  width?: number;
  colorDark?: string;
  colorLight?: string;
  theme?: VoltboxQrThemeKey | string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export function resolveQrColors(options?: QrOptions): { dark: string; light: string; themeName: string } {
  var themeKey = (options && options.theme) || 'gold';
  var selectedTheme = (VOLTBOX_QR_THEMES as any)[themeKey] || VOLTBOX_QR_THEMES.gold;
  return {
    dark: (options && options.colorDark) || selectedTheme.dark,
    light: (options && options.colorLight) || selectedTheme.light,
    themeName: selectedTheme.name,
  };
}

export function generateProductUrl(productId: number | string, origin?: string): string {
  var base = (origin || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')).replace(/\/+$/, '');
  return base + '/?product=' + encodeURIComponent(String(productId));
}

export async function generateQrSvg(url: string, options?: QrOptions): Promise<string> {
  var colors = resolveQrColors(options);
  return QRCode.toString(url, {
    type: 'svg',
    margin: options && typeof options.margin === 'number' ? options.margin : 1,
    errorCorrectionLevel: (options && options.errorCorrectionLevel) || 'M',
    color: {
      dark: colors.dark,
      light: colors.light,
    },
  });
}

export async function generateQrDataUrl(url: string, options?: QrOptions): Promise<string> {
  var colors = resolveQrColors(options);
  return QRCode.toDataURL(url, {
    margin: options && typeof options.margin === 'number' ? options.margin : 1,
    width: options && typeof options.width === 'number' ? options.width : 320,
    errorCorrectionLevel: (options && options.errorCorrectionLevel) || 'M',
    color: {
      dark: colors.dark,
      light: colors.light,
    },
  });
}

export async function renderQrIntoElement(container: HTMLElement | string, url: string, options?: QrOptions): Promise<void> {
  var el = typeof container === 'string' ? document.getElementById(container) : container;
  if (!el) return;
  var svg = await generateQrSvg(url, options);
  el.innerHTML = svg;
}

export function decodeQrFromImageData(
  imageData: ImageData | { data: Uint8ClampedArray; width: number; height: number }
): { data: string; location?: any } | null {
  if (!imageData || !imageData.data || !imageData.width || !imageData.height) return null;
  try {
    var result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
    if (result && result.data) {
      return { data: result.data, location: result.location };
    }
  } catch (err) {
    console.warn('QR decode error:', err);
  }
  return null;
}

export function parseScannedProduct(
  rawText: string,
  catalog?: Array<{ id: number; sku?: string; title?: string }>
): { productId: number | null; rawText: string; matchedBy: string | null } {
  if (!rawText || typeof rawText !== 'string') {
    return { productId: null, rawText: '', matchedBy: null };
  }
  var clean = rawText.trim();

  // 1. URL Query parameter ?product=19 or &product=19
  var queryMatch = clean.match(/[?&]product=(\d+)/i);
  if (queryMatch) {
    return { productId: Number(queryMatch[1]), rawText: clean, matchedBy: 'query_param' };
  }

  // 2. URL Path /product/19
  var pathMatch = clean.match(/\/product\/(\d+)/i);
  if (pathMatch) {
    return { productId: Number(pathMatch[1]), rawText: clean, matchedBy: 'path' };
  }

  // 3. Hash #product=19 or #product-19
  var hashMatch = clean.match(/#product[=-](\d+)/i);
  if (hashMatch) {
    return { productId: Number(hashMatch[1]), rawText: clean, matchedBy: 'hash' };
  }

  // 4. Match by exact SKU in catalog
  if (Array.isArray(catalog) && catalog.length > 0) {
    var skuClean = clean.toUpperCase();
    var foundBySku = catalog.find(function (p) {
      return p.sku && p.sku.toUpperCase() === skuClean;
    });
    if (foundBySku) {
      return { productId: foundBySku.id, rawText: clean, matchedBy: 'catalog_sku' };
    }
  }

  // 5. Voltbox SKU pattern VB-XXX-019
  var skuPatternMatch = clean.match(/VB-[A-Z]{3}-(\d+)/i);
  if (skuPatternMatch) {
    return { productId: Number(skuPatternMatch[1]), rawText: clean, matchedBy: 'sku_pattern' };
  }

  // 6. VOLTBOX:19 or VB:19 prefix
  var voltboxPrefixMatch = clean.match(/^(?:VOLTBOX|VB):(\d+)$/i);
  if (voltboxPrefixMatch) {
    return { productId: Number(voltboxPrefixMatch[1]), rawText: clean, matchedBy: 'voltbox_prefix' };
  }

  // 7. Plain numeric ID (e.g. 19)
  if (/^\d+$/.test(clean)) {
    return { productId: Number(clean), rawText: clean, matchedBy: 'numeric_id' };
  }

  return { productId: null, rawText: clean, matchedBy: null };
}

// Expose globally on window for app.js
if (typeof window !== 'undefined') {
  (window as any).VoltboxQR = {
    themes: VOLTBOX_QR_THEMES,
    generateProductUrl,
    generateQrSvg,
    generateQrDataUrl,
    renderQrIntoElement,
    decodeQrFromImageData,
    parseScannedProduct,
  };
}
