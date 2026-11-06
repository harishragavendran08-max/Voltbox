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

export const MAX_SCAN_HISTORY_ITEMS = 10;

export interface QrScanHistoryEntry {
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
  existingHistory: QrScanHistoryEntry[],
  product: {
    id: number;
    title?: string;
    name?: string;
    sku?: string;
    category?: string;
    price?: number;
    image?: string;
  },
  nowMs?: number
): QrScanHistoryEntry[] {
  var list: QrScanHistoryEntry[] = Array.isArray(existingHistory)
    ? existingHistory.filter(function (item) { return item && typeof item.productId === 'number' && item.productId > 0; })
    : [];
  if (!product || typeof product.id !== 'number' || product.id <= 0) {
    return list.slice(0, MAX_SCAN_HISTORY_ITEMS);
  }
  var pid = Number(product.id);
  var existingIdx = list.findIndex(function (item) { return Number(item.productId) === pid; });
  var prevCount = existingIdx !== -1 ? Math.max(1, Number(list[existingIdx].scanCount || 1)) : 0;
  if (existingIdx !== -1) {
    list.splice(existingIdx, 1);
  }
  var entry: QrScanHistoryEntry = {
    productId: pid,
    title: String(product.title || product.name || ('Part #' + pid)).trim(),
    sku: String(product.sku || ('VB-PRT-' + String(pid).padStart(3, '0'))).trim(),
    category: String(product.category || 'components').trim(),
    price: Math.round(Number(product.price || 0) * 100) / 100,
    image: String(product.image || ''),
    scannedAt: Number(nowMs) || Date.now(),
    scanCount: prevCount + 1,
  };
  return [entry].concat(list).slice(0, MAX_SCAN_HISTORY_ITEMS);
}

export function removeScannedProduct(existingHistory: QrScanHistoryEntry[], productId: number): QrScanHistoryEntry[] {
  if (!Array.isArray(existingHistory)) return [];
  var targetId = Number(productId);
  return existingHistory
    .filter(function (item) { return item && Number(item.productId) !== targetId; })
    .slice(0, MAX_SCAN_HISTORY_ITEMS);
}

export function clearScanHistory(): QrScanHistoryEntry[] {
  return [];
}

export function formatScanHistoryRelativeTime(scannedAt: number, nowMs?: number): string {
  var ts = Number(scannedAt);
  var now = Number(nowMs) || Date.now();
  if (!isFinite(ts) || ts <= 0) return 'Recently';
  var diffSec = Math.max(0, Math.floor((now - ts) / 1000));
  if (diffSec < 45) return 'Just now';
  var diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return diffMin + 'm ago';
  var diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr + 'h ago';
  var diffDays = Math.floor(diffHr / 24);
  return diffDays + 'd ago';
}

export type ShareDescriptionTone = 'spec' | 'deal' | 'concise';

export function generateProductShareDescription(
  product: {
    id: number;
    title?: string;
    price?: number;
    sku?: string;
    category?: string;
    description?: string;
    specs?: {
      architecture?: string;
      interfaceSpec?: string;
      powerDraw?: string;
    };
  },
  shareUrl?: string,
  tone: ShareDescriptionTone = 'spec'
): string {
  var title = String(product.title || ('Component #' + product.id)).trim();
  var price = Math.round((Number(product.price) || 0) * 100) / 100;
  var sku = String(product.sku || ('VB-PRT-' + String(product.id).padStart(3, '0'))).trim();
  var arch = (product.specs && product.specs.architecture) || 'Precision Solid-State';
  var iface = (product.specs && product.specs.interfaceSpec) || 'PCIe 4.0 / USB-C';
  var pwr = (product.specs && product.specs.powerDraw) || '65W Nominal';
  var urlSuffix = shareUrl ? (' ' + shareUrl) : '';

  if (tone === 'deal') {
    return '⚡ Hardware Drop on Voltbox: ' + title + ' (' + sku + ') is live at $' + price.toFixed(2) + '! Features ' + arch + ' & ' + iface + ' — qualifies for the 5% Rig Builder Bundle.' + urlSuffix;
  }
  if (tone === 'concise') {
    return 'Check out ' + title + ' ($' + price.toFixed(2) + ' · SKU ' + sku + ') on Voltbox Electronics!' + urlSuffix;
  }
  return '🔧 ' + title + ' [$' + price.toFixed(2) + ' · ' + sku + '] on Voltbox Electronics — ' + arch + ', ' + iface + ', ' + pwr + '. Bench-verified & ready to ship!' + urlSuffix;
}

export function buildSocialShareUrls(
  url: string,
  description: string,
  hashtags?: string[]
): { twitter: string; whatsapp: string; facebook: string } {
  var cleanUrl = (url || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')).trim();
  var cleanDesc = (description || 'Check out this component on Voltbox Electronics!').trim();
  var escapedUrl = cleanUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  var descWithoutTrailingUrl = cleanDesc.replace(new RegExp('\\s*' + escapedUrl + '\\s*$'), '').trim();
  var tags = Array.isArray(hashtags) && hashtags.length > 0 ? hashtags : ['Voltbox', 'PCHardware', 'BuildARig'];
  var tagString = tags.filter(Boolean).join(',');

  var twitter =
    'https://twitter.com/intent/tweet?text=' + encodeURIComponent(descWithoutTrailingUrl) +
    '&url=' + encodeURIComponent(cleanUrl) +
    (tagString ? ('&hashtags=' + encodeURIComponent(tagString)) : '');

  var whatsappMessage = cleanDesc.indexOf(cleanUrl) !== -1 ? cleanDesc : (cleanDesc + ' ' + cleanUrl);
  var whatsapp = 'https://wa.me/?text=' + encodeURIComponent(whatsappMessage);

  var facebook =
    'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(cleanUrl) +
    '&quote=' + encodeURIComponent(descWithoutTrailingUrl);

  return {
    twitter: twitter,
    whatsapp: whatsapp,
    facebook: facebook,
  };
}

export function normalizeVoiceSearchTranscript(rawTranscript: string): {
  rawTranscript: string;
  query: string;
  isClearCommand: boolean;
  budgetMaxHint: number | null;
  categoryHint: string | null;
} {
  var raw = String(rawTranscript || '').trim();
  if (!raw) {
    return {
      rawTranscript: '',
      query: '',
      isClearCommand: false,
      budgetMaxHint: null,
      categoryHint: null,
    };
  }
  var cleaned = raw.replace(/[.?!,;]+$/g, '').trim();
  var lowerFull = cleaned.toLowerCase();
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
  cleaned = cleaned
    .replace(
      /^(?:please\s+)?(?:search\s+for|search|find\s+me|find|show\s+me|show|look\s+for|looking\s+for|filter\s+by|i\s+want|i\s+need)\s+/i,
      ''
    )
    .trim();

  var budgetMaxHint: number | null = null;
  var budgetMatch = cleaned.match(/\b(?:under|below|less\s+than)\s*\$?\s*(\d{2,4})(?:\s*(?:dollars|bucks|usd))?\b/i);
  if (budgetMatch) {
    var parsedBudget = Number(budgetMatch[1]);
    if (isFinite(parsedBudget) && parsedBudget > 0) {
      budgetMaxHint = parsedBudget;
    }
    cleaned = cleaned.replace(budgetMatch[0], '').trim();
  }

  cleaned = cleaned
    .replace(/\br\s+t\s+x\b/gi, 'RTX')
    .replace(/\bg\s+t\s+x\b/gi, 'GTX')
    .replace(/\bs\s+s\s+d\b/gi, 'SSD')
    .replace(/\bn\s+v\s+m\s+e\b/gi, 'NVMe')
    .replace(/\bc\s+p\s+u\s*s?\b/gi, 'CPU')
    .replace(/\bg\s+p\s+u\s*s?\b/gi, 'GPU')
    .replace(/\bd\s+d\s+r\s*5\b/gi, 'DDR5')
    .replace(/\bp\s+s\s*5\b/gi, 'PS5')
    .replace(/\ba\s+m\s+d\b/gi, 'AMD')
    .replace(/\bm\s+s\s+i\b/gi, 'MSI')
    .replace(/\bo\s+l\s+e\s+d\b/gi, 'OLED')
    .replace(/\bu\s+s\s+b\s+c\b/gi, 'USB-C')
    .replace(/\s+/g, ' ')
    .replace(/[.?!,;]+$/g, '')
    .trim();

  var categoryHint: string | null = null;
  var lowerClean = cleaned.toLowerCase();
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
    budgetMaxHint: budgetMaxHint,
    categoryHint: categoryHint,
  };
}

export const UI_BACKGROUND_TEMPLATES = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Studio',
    shortLabel: 'Obsidian',
    tagline: 'Architectural Carbon & Precision Cyan',
    legacyBgMode: 'quantum',
  },
  blueprint: {
    id: 'blueprint',
    name: 'Cobalt Blueprint',
    shortLabel: 'Blueprint',
    tagline: 'CAD Schematic Navy & Royal Cobalt',
    legacyBgMode: 'overclock',
  },
  copper: {
    id: 'copper',
    name: 'Anodized Copper',
    shortLabel: 'Copper',
    tagline: 'Warm Gunmetal & Brushed Amber Gold',
    legacyBgMode: 'copper',
  },
  titanium: {
    id: 'titanium',
    name: 'Titanium Lab',
    shortLabel: 'Titanium',
    tagline: 'Clean Bench Slate & Emerald Telemetry',
    legacyBgMode: 'cyber',
  },
} as const;

export function resolveUiTemplateTheme(rawInput?: string | null) {
  var key = String(rawInput || '').trim().toLowerCase();
  if (key === 'blueprint' || key === 'overclock' || key === 'sapphire') return UI_BACKGROUND_TEMPLATES.blueprint;
  if (key === 'copper' || key === 'amber' || key === 'gold') return UI_BACKGROUND_TEMPLATES.copper;
  if (key === 'titanium' || key === 'cyber' || key === 'emerald') return UI_BACKGROUND_TEMPLATES.titanium;
  return UI_BACKGROUND_TEMPLATES.obsidian;
}

export function computeSystemPowerEstimate(
  items: Array<{ title?: string; category?: string; componentGroup?: string; quantity?: number }>
) {
  var baseSystemWatts = 65;
  var componentsWatts = 0;
  var activeComponentCount = 0;

  if (Array.isArray(items)) {
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!item) continue;
      var qty = Math.max(0, Math.floor(Number(item.quantity == null ? 1 : item.quantity)));
      if (qty <= 0) continue;
      activeComponentCount += qty;

      var group = String(item.componentGroup || item.category || '').toLowerCase();
      var titleLower = String(item.title || '').toLowerCase();
      var unitWatts = 18;
      if (group === 'gpus' || titleLower.indexOf('rtx') !== -1 || titleLower.indexOf('radeon') !== -1) {
        if (titleLower.indexOf('5090') !== -1 || titleLower.indexOf('4090') !== -1) unitWatts = 450;
        else if (titleLower.indexOf('5080') !== -1 || titleLower.indexOf('4080') !== -1) unitWatts = 320;
        else unitWatts = 250;
      } else if (group === 'cpus' || titleLower.indexOf('ryzen') !== -1 || titleLower.indexOf('core') !== -1) {
        if (titleLower.indexOf('ryzen 9') !== -1 || titleLower.indexOf('i9') !== -1 || titleLower.indexOf('ultra 9') !== -1) unitWatts = 170;
        else if (titleLower.indexOf('ryzen 7') !== -1 || titleLower.indexOf('i7') !== -1) unitWatts = 120;
        else unitWatts = 95;
      } else if (group === 'motherboards' || titleLower.indexOf('motherboard') !== -1) {
        unitWatts = 55;
      } else if (group === 'storage' || titleLower.indexOf('ssd') !== -1 || titleLower.indexOf('harddisk') !== -1) {
        unitWatts = 12;
      } else if (group === 'gaming') {
        unitWatts = 35;
      } else if (group === 'audio') {
        unitWatts = 10;
      }
      componentsWatts += unitWatts * qty;
    }
  }

  var estimatedPeakWatts = activeComponentCount > 0 ? baseSystemWatts + componentsWatts : 0;
  var targetWithHeadroom = Math.ceil(estimatedPeakWatts * 1.32);
  var recommendedPsuWatts = 650;
  var psuTierLabel = '650W ATX 3.1 Ready';

  if (activeComponentCount > 0) {
    if (targetWithHeadroom <= 550) {
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
  }

  var loadPercentage =
    activeComponentCount === 0
      ? 12
      : Math.min(98, Math.max(15, Math.round((estimatedPeakWatts / recommendedPsuWatts) * 100)));

  var headroomStatus = 'idle';
  if (activeComponentCount > 0) {
    if (estimatedPeakWatts >= 680) headroomStatus = 'high-draw';
    else if (estimatedPeakWatts >= 350) headroomStatus = 'balanced';
    else headroomStatus = 'optimal';
  }

  return {
    baseSystemWatts: activeComponentCount > 0 ? baseSystemWatts : 0,
    componentsWatts: componentsWatts,
    estimatedPeakWatts: estimatedPeakWatts,
    recommendedPsuWatts: recommendedPsuWatts,
    psuTierLabel: psuTierLabel,
    loadPercentage: loadPercentage,
    headroomStatus: headroomStatus,
    activeComponentCount: activeComponentCount,
  };
}

export function formatInstagramHandle(name?: string | null, role?: string | null): string {
  var raw = String(name || 'builder').trim().toLowerCase();
  var slug = raw.replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'builder';
  var roleStr = String(role || '').trim().toLowerCase();
  if (roleStr === 'moderator' || roleStr === 'staff_architect') {
    return '@' + slug + '.voltbox';
  }
  return '@' + slug;
}

export {
  getScanPingAudioConfig,
  calculateScanPingSchedule,
  validateQrScanAudioTrigger,
  formatAudioPingToggleState,
  synthesizeScanPingPcmBuffer,
  buildWishlistToastPayload,
  buildCheckoutPrintSummary,
  DEFAULT_ADVANCED_SETTINGS,
  resolveAdvancedSettings,
  MAX_COMPARISON_ITEMS,
  getCompareAllVisibleButtonState,
  selectVisibleProductsForComparison,
} from '../logic/inventory';

import {
  getScanPingAudioConfig,
  calculateScanPingSchedule,
  validateQrScanAudioTrigger,
  formatAudioPingToggleState,
  synthesizeScanPingPcmBuffer,
  buildWishlistToastPayload,
  buildCheckoutPrintSummary,
  DEFAULT_ADVANCED_SETTINGS,
  resolveAdvancedSettings,
  MAX_COMPARISON_ITEMS,
  getCompareAllVisibleButtonState,
  selectVisibleProductsForComparison,
} from '../logic/inventory';

// Expose globally on window for app.js
if (typeof window !== 'undefined') {
  (window as any).VoltboxQR = {
    themes: VOLTBOX_QR_THEMES,
    uiTemplates: UI_BACKGROUND_TEMPLATES,
    MAX_SCAN_HISTORY_ITEMS,
    MAX_COMPARISON_ITEMS,
    generateProductUrl,
    generateQrSvg,
    generateQrDataUrl,
    renderQrIntoElement,
    decodeQrFromImageData,
    parseScannedProduct,
    recordScannedProduct,
    removeScannedProduct,
    clearScanHistory,
    formatScanHistoryRelativeTime,
    generateProductShareDescription,
    buildSocialShareUrls,
    normalizeVoiceSearchTranscript,
    resolveUiTemplateTheme,
    computeSystemPowerEstimate,
    formatInstagramHandle,
    getScanPingAudioConfig,
    calculateScanPingSchedule,
    validateQrScanAudioTrigger,
    formatAudioPingToggleState,
    synthesizeScanPingPcmBuffer,
    buildWishlistToastPayload,
    buildCheckoutPrintSummary,
    DEFAULT_ADVANCED_SETTINGS,
    resolveAdvancedSettings,
    getCompareAllVisibleButtonState,
    selectVisibleProductsForComparison,
  };
}



