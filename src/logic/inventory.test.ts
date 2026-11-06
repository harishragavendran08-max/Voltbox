import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOW_STOCK_THRESHOLD,
  getProductQuantity,
  isLowStock,
  getStockBadgeLabel,
  computeCartTotals,
  makeOrderId,
  classifyComponentGroup,
  getProductSku,
  generateSkuBarcodeBars,
  encodeReceiptCode39Bars,
  generateReceiptQrMatrix,
  generatePriceHistory,
  getProductSpecs,
  computeRigBundleStatus,
  computeOdometerColumns,
  computeAuthKeyTelemetry,
  computeCardParallaxTilt,
  sanitizeChatMessage,
  classifyDeviceViewport,
  buildInventoryItem,
  buildInventorySummary,
  buildCartEntity,
  toProductJpaEntity,
  computeSystemHealthMetrics,
  evaluateAccountPermissions,
  resolveSocialLoginIdentity,
  toggleWishlistItem,
  buildWishlistSummary,
  generateProductShareUrl,
  generateProductSharePayload,
  generateProductShareDescription,
  buildSocialShareUrls,
  generateProductQrSvgAsync,
  generateProductQrDataUrl,
  VOLTBOX_QR_THEMES,
  resolveQrColors,
  parseScannedProductPayload,
  MIN_TOUCH_TARGET_PX,
  validateTouchTargetDimensions,
  computeTouchVelocity,
  computeRubberBandDrag,
  stepMomentumScroll,
  computeScrollThumbMetrics,
  resolveProductImageUrl,
  detectCardNetwork,
  formatPaymentMethodSummary,
  UPI_APP_PROFILES,
  normalizeUpiAppId,
  buildUpiPaymentRequestPayload,
  buildProductComparison,
  evaluateSpecRowIndicators,
  parsePowerWatts,
  scoreInterfaceBandwidth,
  scoreArchitectureTier,
  parseWarrantyScore,
  IpRateLimiter,
  computeSuggestedPriceThresholds,
  validatePriceAlertInput,
  upsertPriceAlertSubscription,
  removePriceAlertSubscription,
  buildPriceAlertEmailPayload,
  evaluatePriceDropAlerts,
  MAX_SCAN_HISTORY_ITEMS,
  recordScannedProduct,
  removeScannedProduct,
  clearScanHistory,
  formatScanHistoryRelativeTime,
  filterAndSortCatalogProducts,
  getStockAvailabilityStatus,
  isBackorderProduct,
  normalizeVoiceSearchTranscript,
  resolveUiTemplateTheme,
  getNextUiTemplateTheme,
  computeSystemPowerEstimate,
  formatInstagramHandle,
  recommendStarterRigBundle,
  evaluatePriceAlertThresholdVsHistory,
  computePriceDropFromSixMonthAvg,
  parsePriceAlertExpiryDate,
  isPriceAlertExpired,
  computeGridNavigationIndex,
  calculateGridColumnCount,
  handleProductCardKeyAction,
  normalizeTrackingStatus,
  advanceOrderTrackingStage,
  resolveOrderTrackingTimeline,
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
} from './inventory';

test('LOW_STOCK_THRESHOLD is 5', () => {
  assert.equal(LOW_STOCK_THRESHOLD, 5);
});

test('isLowStock returns true when quantity is below 5 and false when 5 or above', () => {
  assert.equal(isLowStock({ quantity: 0 }), true);
  assert.equal(isLowStock({ quantity: 1 }), true);
  assert.equal(isLowStock({ quantity: 2 }), true);
  assert.equal(isLowStock({ quantity: 3 }), true);
  assert.equal(isLowStock({ quantity: 4 }), true);
  assert.equal(isLowStock({ quantity: 5 }), false);
  assert.equal(isLowStock({ quantity: 12 }), false);
});

test('getStockBadgeLabel returns "Low Stock" only when quantity < 5 and "Backorder" when 0', () => {
  assert.equal(getStockBadgeLabel({ quantity: 0 }), 'Backorder');
  assert.equal(getStockBadgeLabel({ quantity: 4 }), 'Low Stock');
  assert.equal(getStockBadgeLabel({ quantity: 1 }), 'Low Stock');
  assert.equal(getStockBadgeLabel({ quantity: 5 }), null);
  assert.equal(getStockBadgeLabel({ quantity: 10 }), null);
  assert.equal(getStockAvailabilityStatus({ quantity: 5 }), 'available-now');
  assert.equal(getStockAvailabilityStatus({ quantity: 0 }), 'backorder');
  assert.equal(isBackorderProduct({ quantity: 0 }), true);
  assert.equal(isBackorderProduct({ quantity: 3 }), false);
});

test('getProductQuantity falls back to stock or default seed map', () => {
  assert.equal(getProductQuantity({ quantity: 3 }), 3);
  assert.equal(getProductQuantity({ stock: 4 }), 4);
  assert.equal(getProductQuantity({ id: 19 }), 2); // Nvidia RTX 5090 seeded low stock
  assert.equal(getProductQuantity({ id: 20 }), 12); // AMD RYZEN 9 seeded normal stock
});

test('classifyComponentGroup and getProductSku classify PC parts accurately', () => {
  assert.equal(classifyComponentGroup({ title: 'Nvidia RTX 5090', category: 'memory' }), 'gpus');
  assert.equal(classifyComponentGroup({ title: 'AMD RYZEN 9', category: 'memory' }), 'cpus');
  assert.equal(classifyComponentGroup({ title: 'MSI MotherBoard B570', category: 'microcontrollers' }), 'motherboards');
  assert.equal(classifyComponentGroup({ title: 'Samsung 1TB SSD', category: 'storage' }), 'storage');
  assert.equal(getProductSku({ id: 19, title: 'Nvidia RTX 5090' }), 'VB-GPU-019');
  assert.equal(getProductSku({ id: 20, title: 'AMD RYZEN 9' }), 'VB-CPU-020');
});

test('generateSkuBarcodeBars produces deterministic non-overlapping industrial barcode bars for each SKU', () => {
  const gpuBars = generateSkuBarcodeBars('VB-GPU-019');
  const cpuBars = generateSkuBarcodeBars('VB-CPU-020');
  assert.ok(gpuBars.length >= 20);
  assert.deepEqual(gpuBars, generateSkuBarcodeBars('VB-GPU-019'));
  assert.notDeepEqual(gpuBars, cpuBars);
  assert.equal(gpuBars[0].isGuard, true);
  assert.equal(gpuBars[gpuBars.length - 1].isGuard, true);
  for (let i = 1; i < gpuBars.length; i++) {
    assert.ok(gpuBars[i].x >= gpuBars[i - 1].x + gpuBars[i - 1].width, 'bars must not overlap');
  }
});

test('generatePriceHistory and getProductSpecs return 6 months of deterministic price data', () => {
  const history = generatePriceHistory({ id: 19, price: 200 });
  assert.equal(history.length, 6);
  assert.equal(history[5].month, 'Oct');
  assert.equal(history[5].price, 200);
  const specs = getProductSpecs({ id: 19, title: 'Nvidia RTX 5090', price: 200 });
  assert.equal(specs.sku, 'VB-GPU-019');
  assert.ok(specs.lowestPrice <= 200);
  assert.ok(specs.highestPrice >= 200);
});

test('computeRigBundleStatus activates 5% bundle discount when 3+ core PC component groups are in cart', () => {
  const catalog = [
    { id: 19, title: 'Nvidia RTX 5090', price: 200 },
    { id: 20, title: 'AMD RYZEN 9', price: 180 },
    { id: 21, title: 'MSI MotherBoard B570', price: 150 },
    { id: 22, title: 'Samsung 1TB SSD', price: 120 },
  ];
  const partial = computeRigBundleStatus(catalog, { '19': 1, '20': 1 });
  assert.equal(partial.completedCoreCount, 2);
  assert.equal(partial.qualifiesForBundle, false);

  const bundle3 = computeRigBundleStatus(catalog, { '19': 1, '20': 1, '21': 1 });
  assert.equal(bundle3.completedCoreCount, 3);
  assert.equal(bundle3.qualifiesForBundle, true);
  assert.equal(bundle3.discountRate, 0.05);
});

test('computeCartTotals calculates count, subtotal, rig bundle discount, promo code discount, tax, and total', () => {
  const products = [
    { id: 19, title: 'Nvidia RTX 5090', price: 200.0, quantity: 2 },
    { id: 20, title: 'AMD RYZEN 9', price: 180.0, quantity: 12 },
    { id: 21, title: 'MSI MotherBoard B570', price: 150.0, quantity: 3 },
  ];
  const totals2 = computeCartTotals(products, { '19': 1, '20': 1 });
  assert.equal(totals2.count, 2);
  assert.equal(totals2.sub, 380.0);
  assert.equal(totals2.discountTotal, 0);
  assert.equal(totals2.tax, 31.35);
  assert.equal(totals2.total, 411.35);

  // With 3 core components (5% bundle discount) + VOLT10 (10% promo discount)
  const totalsBundlePromo = computeCartTotals(products, { '19': 1, '20': 1, '21': 1 }, 0.0825, 'volt10');
  assert.equal(totalsBundlePromo.sub, 530.0);
  assert.equal(totalsBundlePromo.rigDiscount, 26.5);
  assert.equal(totalsBundlePromo.promoDiscount, 53.0);
  assert.equal(totalsBundlePromo.discountTotal, 79.5);
  assert.equal(totalsBundlePromo.discountedSub, 450.5);
  assert.equal(totalsBundlePromo.appliedPromo, 'VOLT10');
});

test('makeOrderId formats 4-character hex order ID', () => {
  assert.match(makeOrderId(1785215975277), /^VB-[0-9A-F]{4}$/);
});

test('encodeReceiptCode39Bars encodes receipt ID in standard Code-39 with start/stop asterisks and 5 bars per character', () => {
  const b1 = encodeReceiptCode39Bars('VB-885D');
  const b2 = encodeReceiptCode39Bars('VB-995F');
  assert.equal(b1.encodedValue, '*VB-885D*');
  // 9 characters in *VB-885D*, each character has 5 black bars = 45 bars
  assert.equal(b1.bars.length, 45);
  assert.deepEqual(b1, encodeReceiptCode39Bars('VB-885D'));
  assert.notDeepEqual(b1.bars, b2.bars);
});

test('generateReceiptQrMatrix builds a 21x21 QR matrix with finder patterns and distinct payload per receipt ID', () => {
  const qr1 = generateReceiptQrMatrix('VB-885D');
  const qr2 = generateReceiptQrMatrix('VB-995F');
  assert.equal(qr1.length, 21);
  assert.equal(qr1[0].length, 21);
  // Top-left, top-right, and bottom-left finder corners are dark
  assert.equal(qr1[0][0], true);
  assert.equal(qr1[0][20], true);
  assert.equal(qr1[20][0], true);
  assert.deepEqual(qr1, generateReceiptQrMatrix('VB-885D'));
  assert.notDeepEqual(qr1, qr2);
});

test('computeOdometerColumns calculates vertical CSS transform offsets, right-aligned positions, and roll direction', () => {
  const upRoll = computeOdometerColumns('0.00', '380.00');
  assert.equal(upRoll.direction, 'up');
  assert.equal(upRoll.columns.length, 6);
  // First column '3' (hundreds place, posFromRight=5) translates by -30%
  assert.equal(upRoll.columns[0].char, '3');
  assert.equal(upRoll.columns[0].posFromRight, 5);
  assert.equal(upRoll.columns[0].translateYPercent, -30);
  assert.equal(upRoll.columns[0].changed, true);
  // Second column '8' (tens place, posFromRight=4) translates by -80%
  assert.equal(upRoll.columns[1].char, '8');
  assert.equal(upRoll.columns[1].translateYPercent, -80);
  // Decimal point separator (posFromRight=2)
  assert.equal(upRoll.columns[3].type, 'sep');
  assert.equal(upRoll.columns[3].char, '.');

  const downRoll = computeOdometerColumns('380.00', '180.00');
  assert.equal(downRoll.direction, 'down');
  assert.equal(downRoll.columns[0].digit, 1);
  assert.equal(downRoll.columns[0].prevDigit, 3);
  assert.equal(downRoll.columns[0].changed, true);
  assert.equal(downRoll.columns[0].translateYPercent, -10);
  // '8' in tens place did not change between 380.00 and 180.00
  assert.equal(downRoll.columns[1].changed, false);
});

test('computeAuthKeyTelemetry formats KEY_LEN and calculates password strength and email status', () => {
  const idle = computeAuthKeyTelemetry('', '');
  assert.equal(idle.keyLengthFormatted, 'KEY_LEN: 00');
  assert.equal(idle.strengthScore, 0);
  assert.equal(idle.strengthLabel, 'IDLE');
  assert.equal(idle.emailStatus, 'IDLE');

  const demo = computeAuthKeyTelemetry('Harish123', 'harish@voltbox.test');
  assert.equal(demo.keyLengthFormatted, 'KEY_LEN: 09');
  assert.equal(demo.strengthScore, 4);
  assert.equal(demo.strengthLabel, 'STRONG');
  assert.equal(demo.emailStatus, 'VALID');
});

test('computeCardParallaxTilt calculates 3D tilt angles and parallax shifts towards the cursor', () => {
  // Dead center of a 240x360 card -> zero tilt and 50%/50% glare
  const center = computeCardParallaxTilt(120, 180, 240, 360, 6, 4.5);
  assert.equal(center.rotateXDeg, 0);
  assert.equal(center.rotateYDeg, 0);
  assert.equal(center.shiftXPx, 0);
  assert.equal(center.shiftYPx, 0);
  assert.equal(center.glareXPercent, 50);
  assert.equal(center.glareYPercent, 50);

  // Top-right corner (240, 0) -> tilts +X (up) and +Y (right), shifts content +X and -Y
  const topRight = computeCardParallaxTilt(240, 0, 240, 360, 6, 4.5);
  assert.equal(topRight.rotateXDeg, 6);
  assert.equal(topRight.rotateYDeg, 6);
  assert.equal(topRight.shiftXPx, 4.5);
  assert.equal(topRight.shiftYPx, -4.5);
  assert.equal(topRight.glareXPercent, 100);
  assert.equal(topRight.glareYPercent, 0);

  // Bottom-left corner (0, 360) -> tilts -X (down) and -Y (left), shifts content -X and +Y
  const bottomLeft = computeCardParallaxTilt(0, 360, 240, 360, 6, 4.5);
  assert.equal(bottomLeft.rotateXDeg, -6);
  assert.equal(bottomLeft.rotateYDeg, -6);
  assert.equal(bottomLeft.shiftXPx, -4.5);
  assert.equal(bottomLeft.shiftYPx, 4.5);
  assert.equal(bottomLeft.glareXPercent, 0);
  assert.equal(bottomLeft.glareYPercent, 100);
});

test('sanitizeChatMessage validates channels, trims message text, and supports attached hardware product IDs', () => {
  const empty = sanitizeChatMessage({ text: '   ', channel: 'general' });
  assert.equal(empty.valid, false);

  const validMsg = sanitizeChatMessage({
    text: '  Pairing Intel Core Ultra 9 with X870E!  ',
    channel: 'rig-builds',
    productId: '36',
  });
  assert.equal(validMsg.valid, true);
  assert.equal(validMsg.channel, 'rig-builds');
  assert.equal(validMsg.text, 'Pairing Intel Core Ultra 9 with X870E!');
  assert.equal(validMsg.productId, 36);
});

test('classifyDeviceViewport adapts layout across iOS/Android mobile, iPad tablet, and desktop viewports', () => {
  const iphone = classifyDeviceViewport(390, 844);
  assert.equal(iphone.deviceTier, 'mobile');
  assert.equal(iphone.showBottomAppDock, true);
  assert.equal(iphone.compactOrderBarByDefault, true);
  assert.equal(iphone.minTouchTargetPx, 44);

  const ipad = classifyDeviceViewport(820, 1180);
  assert.equal(ipad.deviceTier, 'ipad-tablet');
  assert.equal(ipad.showBottomAppDock, true);
  assert.equal(ipad.columnsSuggested, 3);
  assert.equal(ipad.minTouchTargetPx, 44);

  const desktop = classifyDeviceViewport(1440, 900);
  assert.equal(desktop.deviceTier, 'desktop');
  assert.equal(desktop.showBottomAppDock, false);
  assert.equal(desktop.columnsSuggested, 4);
  assert.equal(desktop.minTouchTargetPx, 44);
});

test('validateTouchTargetDimensions enforces 44x44px minimum touch target size for mobile interactive elements', () => {
  assert.equal(MIN_TOUCH_TARGET_PX, 44);

  const compliantBtn = validateTouchTargetDimensions(44, 44);
  assert.equal(compliantBtn.valid, true);
  assert.equal(compliantBtn.deficitWidthPx, 0);
  assert.equal(compliantBtn.deficitHeightPx, 0);

  const largeNav = validateTouchTargetDimensions(72, 50);
  assert.equal(largeNav.valid, true);

  const undersizedIcon = validateTouchTargetDimensions(30, 30);
  assert.equal(undersizedIcon.valid, false);
  assert.equal(undersizedIcon.deficitWidthPx, 14);
  assert.equal(undersizedIcon.deficitHeightPx, 14);
});

test('buildInventoryItem and buildInventorySummary compute warehouse stock, cart reservations, and low-stock status', () => {
  const catalog = [
    { id: 19, title: 'Nvidia RTX 5090', category: 'gpus', price: 200, quantity: 2 },
    { id: 20, title: 'AMD RYZEN 9', category: 'cpus', price: 180, quantity: 10 },
  ];

  const rtxInv = buildInventoryItem(catalog[0], 1);
  assert.equal(rtxInv.sku, 'VB-GPU-019');
  assert.equal(rtxInv.lowStock, true);
  assert.equal(rtxInv.criticalStock, true);
  assert.equal(rtxInv.stockStatus, 'CRITICAL');

  const summary = buildInventorySummary(catalog, [{ '20': 3 }], []);
  assert.equal(summary.ok, true);
  assert.equal(summary.totalSkus, 2);
  assert.equal(summary.totalUnitsInStock, 12);
  assert.equal(summary.reservedUnitsInCarts, 3);
  assert.equal(summary.lowStockCount, 1);
  assert.equal(summary.totalInventoryValue, 2200);
});

test('buildCartEntity constructs enriched Cart with CartItem line items, Rig Builder bundle status, and promo discounts', () => {
  const catalog = [
    { id: 19, title: 'Nvidia RTX 5090', category: 'gpus', image: '/gpu.png', price: 200, quantity: 2 },
    { id: 20, title: 'AMD RYZEN 9', category: 'cpus', image: '/cpu.png', price: 180, quantity: 12 },
    { id: 21, title: 'MSI MotherBoard B570', category: 'motherboards', image: '/mb.png', price: 150, quantity: 6 },
  ];

  const cartEntity = buildCartEntity(
    catalog,
    { '19': 1, '20': 1, '21': 1 },
    'harish@voltbox.test',
    'VOLT10'
  );

  assert.equal(cartEntity.userEmail, 'harish@voltbox.test');
  assert.equal(cartEntity.items.length, 3);
  assert.equal(cartEntity.count, 3);
  assert.equal(cartEntity.subtotal, 530);
  assert.equal(cartEntity.rigBundle.qualifiesForBundle, true);
  assert.equal(cartEntity.rigDiscount, 26.5);
  assert.equal(cartEntity.promoDiscount, 53);
  assert.equal(cartEntity.discountTotal, 79.5);
  assert.equal(cartEntity.appliedPromo, 'VOLT10');
});

test('toProductJpaEntity maps Product JPA entity fields (id, sku, name, title, price, stockQuantity, quantity, stock, category)', () => {
  const jpaEntity = toProductJpaEntity({
    id: 19,
    title: 'Nvidia RTX 5090',
    price: 200,
    quantity: 2,
    category: 'memory',
  });
  assert.equal(jpaEntity.id, 19);
  assert.equal(jpaEntity.sku, 'VB-GPU-019');
  assert.equal(jpaEntity.name, 'Nvidia RTX 5090');
  assert.equal(jpaEntity.title, 'Nvidia RTX 5090');
  assert.equal(jpaEntity.price, 200);
  assert.equal(jpaEntity.stockQuantity, 2);
  assert.equal(jpaEntity.quantity, 2);
  assert.equal(jpaEntity.stock, 2);
  assert.equal(jpaEntity.lowStock, true);
  assert.equal(jpaEntity.category, 'memory');
  assert.equal(jpaEntity.componentGroup, 'gpus');
  assert.equal(jpaEntity.priceHistory.length, 6);
  assert.equal(jpaEntity.specs.sku, 'VB-GPU-019');
});

test('computeSystemHealthMetrics aggregates catalog valuation, stock health, commerce metrics, and Spring Boot JVM/DB status', () => {
  const health = computeSystemHealthMetrics({
    products: [
      { id: 19, title: 'Nvidia RTX 5090', category: 'gpus', price: 200, stockQuantity: 2, official: true, takenDown: false },
      { id: 20, title: 'AMD Ryzen 9', category: 'cpus', price: 180, stockQuantity: 10, official: true, takenDown: false },
      { id: 21, title: 'Old Archive Board', category: 'motherboards', price: 90, stockQuantity: 0, official: false, takenDown: true },
    ],
    users: [
      { role: 'moderator', cart: { '20': 2 }, orders: [{ total: 560.5 }] },
      { role: 'contributor', cart: {}, orders: [] },
    ],
    openReportsCount: 1,
    pendingApplicationsCount: 2,
    activeWebSocketClients: 3,
    uptimeSeconds: 7200,
    heapUsedMb: 128,
    heapMaxMb: 512,
  });

  assert.equal(health.ok, true);
  assert.equal(health.status, 'UP');
  assert.equal(health.database.status, 'CONNECTED');
  assert.equal(health.jvm.heapUtilizationPct, 25);
  assert.equal(health.catalog.totalProducts, 3);
  assert.equal(health.catalog.activeProducts, 2);
  assert.equal(health.catalog.takenDownProducts, 1);
  assert.equal(health.catalog.totalUnitsInStock, 12);
  assert.equal(health.catalog.reservedUnitsInCarts, 2);
  assert.equal(health.catalog.lowStockCount, 1);
  assert.equal(health.catalog.totalInventoryValuation, 2200);
  assert.equal(health.commerce.totalUsers, 2);
  assert.equal(health.commerce.totalOrders, 1);
  assert.equal(health.commerce.totalRevenue, 560.5);
});

test('evaluateAccountPermissions separates User (browse & buy only) from Admin (storefront + admin dashboard)', () => {
  const userPerm = evaluateAccountPermissions('member');
  assert.equal(userPerm.isAdmin, false);
  assert.equal(userPerm.canBrowseAndBuy, true);
  assert.equal(userPerm.canAccessAdminDashboard, false);
  assert.equal(userPerm.canManageInventory, false);
  assert.equal(userPerm.roleBadge, 'USER · SHOPPER');
  assert.deepEqual(userPerm.allowedLoginModes, ['user']);

  const adminPerm = evaluateAccountPermissions('moderator');
  assert.equal(adminPerm.isAdmin, true);
  assert.equal(adminPerm.canBrowseAndBuy, true);
  assert.equal(adminPerm.canAccessAdminDashboard, true);
  assert.equal(adminPerm.canManageInventory, true);
  assert.equal(adminPerm.roleBadge, 'ADMIN · FULL ACCESS');
  assert.deepEqual(adminPerm.allowedLoginModes, ['user', 'admin']);
});

test('resolveSocialLoginIdentity normalizes Google Login and Apple Login (including Hide My Email relay) for User Login', () => {
  const googleUser = resolveSocialLoginIdentity({
    provider: 'google',
    email: 'Alex.Chen@gmail.com',
    name: 'Alex Chen',
  });
  assert.equal(googleUser.provider, 'google');
  assert.equal(googleUser.email, 'alex.chen@gmail.com');
  assert.equal(googleUser.name, 'Alex Chen');
  assert.equal(googleUser.role, 'member');
  assert.equal(googleUser.isPrivateRelay, false);

  const applePrivateUser = resolveSocialLoginIdentity({
    provider: 'apple',
    email: 'maya.lin@icloud.com',
    hideMyEmail: true,
  });
  assert.equal(applePrivateUser.provider, 'apple');
  assert.equal(applePrivateUser.email, 'maya.lin.relay@privaterelay.appleid.com');
  assert.equal(applePrivateUser.name, 'Maya Lin');
  assert.equal(applePrivateUser.role, 'member');
  assert.equal(applePrivateUser.isPrivateRelay, true);
});

test('toggleWishlistItem adds unlisted items and removes already saved items cleanly', () => {
  const initial: number[] = [19, 20];
  const step1 = toggleWishlistItem(initial, 28);
  assert.equal(step1.added, true);
  assert.equal(step1.productId, 28);
  assert.deepEqual(step1.wishlist, [19, 20, 28]);

  const step2 = toggleWishlistItem(step1.wishlist, 20);
  assert.equal(step2.added, false);
  assert.equal(step2.productId, 20);
  assert.deepEqual(step2.wishlist, [19, 28]);

  // Handles undefined/empty input
  const step3 = toggleWishlistItem(undefined, 36);
  assert.equal(step3.added, true);
  assert.deepEqual(step3.wishlist, [36]);
});

test('buildWishlistSummary compiles saved products with SKU, stock status and valuation', () => {
  const mockProducts = [
    { id: 19, title: 'Nvidia RTX 5090', price: 200, category: 'gpus', quantity: 2, takenDown: false },
    { id: 28, title: 'Corsair Vengeance 32GB', price: 115, category: 'memory', quantity: 5, takenDown: false },
    { id: 99, title: 'Discontinued Card', price: 80, category: 'gpus', quantity: 0, takenDown: true },
  ];

  const summary = buildWishlistSummary([19, 28, 99], mockProducts);
  assert.equal(summary.count, 2);
  assert.deepEqual(summary.productIds, [19, 28]);
  assert.equal(summary.totalValue, 315);
  assert.equal(summary.items[0].sku, 'VB-GPU-019');
  assert.equal(summary.items[0].inStock, true);
  assert.equal(summary.items[1].sku, 'VB-MBD-028');
});

test('generateProductShareUrl formats sanitized deep links with encoded product IDs', () => {
  const url1 = generateProductShareUrl('https://voltbox.test', 19);
  assert.equal(url1, 'https://voltbox.test/?product=19');

  // Handles trailing slashes cleanly
  const url2 = generateProductShareUrl('https://voltbox.test/store///', '42');
  assert.equal(url2, 'https://voltbox.test/store/?product=42');

  // Handles empty origin by defaulting to localhost:3000
  const url3 = generateProductShareUrl('', 1);
  assert.equal(url3, 'http://localhost:3000/?product=1');
});

test('generateProductSharePayload creates full share metadata and text for social/mobile', () => {
  const payload = generateProductSharePayload('https://voltbox.test', {
    id: 19,
    title: 'Nvidia RTX 5090',
    price: 200,
    sku: 'VB-GPU-019',
  });

  assert.equal(payload.url, 'https://voltbox.test/?product=19');
  assert.equal(payload.title, 'Nvidia RTX 5090');
  assert.equal(payload.price, 200);
  assert.equal(payload.sku, 'VB-GPU-019');
  assert.match(payload.text, /Nvidia RTX 5090/);
  assert.match(payload.text, /\$200\.00/);
  assert.equal(payload.qrPayload, payload.url);
});

test('generateProductQrSvgAsync produces valid SVG containing QR path modules', async () => {
  const testUrl = 'https://voltbox.test/?product=19';
  const svg = await generateProductQrSvgAsync(testUrl, { margin: 1 });

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('viewBox='));
  assert.ok(svg.includes('</svg>'));
  assert.ok(svg.includes('path'));
});

test('generateProductQrDataUrl produces base64 image/png data URI for mobile downloading', async () => {
  const testUrl = 'https://voltbox.test/?product=19';
  const dataUrl = await generateProductQrDataUrl(testUrl, { width: 200 });

  assert.ok(dataUrl.startsWith('data:image/png;base64,'));
  assert.ok(dataUrl.length > 200);
});

test('VOLTBOX_QR_THEMES and resolveQrColors support Voltbox electric gold, amber, and cyber palettes', () => {
  assert.equal(VOLTBOX_QR_THEMES.gold.dark, '#ffd23f');
  assert.equal(VOLTBOX_QR_THEMES.amber.dark, '#f59e0b');

  // Default theme is gold
  const def = resolveQrColors();
  assert.equal(def.dark, '#ffd23f');
  assert.equal(def.light, '#0a0e17');

  // Amber theme
  const amb = resolveQrColors({ theme: 'amber' });
  assert.equal(amb.dark, '#f59e0b');

  // Custom color override
  const custom = resolveQrColors({ colorDark: '#ff5500', colorLight: '#ffffff' });
  assert.equal(custom.dark, '#ff5500');
  assert.equal(custom.light, '#ffffff');
});

test('generateProductQrSvgAsync applies Voltbox branded gold and amber colors to generated SVG', async () => {
  const testUrl = 'https://voltbox.test/?product=19';

  // Gold theme
  const goldSvg = await generateProductQrSvgAsync(testUrl, { theme: 'gold' });
  assert.ok(goldSvg.includes('#ffd23f') || goldSvg.includes('#FFD23F'));
  assert.ok(goldSvg.includes('#0a0e17') || goldSvg.includes('#0A0E17'));

  // Amber theme
  const amberSvg = await generateProductQrSvgAsync(testUrl, { theme: 'amber' });
  assert.ok(amberSvg.includes('#f59e0b') || amberSvg.includes('#F59E0B'));
});

test('parseScannedProductPayload accurately resolves product IDs from URLs, SKUs, and codes', () => {
  const mockCatalog = [
    { id: 19, sku: 'VB-GPU-019', title: 'Nvidia RTX 5090' },
    { id: 20, sku: 'VB-CPU-020', title: 'AMD RYZEN 9' },
  ];

  // Query parameter
  const res1 = parseScannedProductPayload('https://voltbox.test/?product=19');
  assert.equal(res1.productId, 19);
  assert.equal(res1.matchedBy, 'query_param');

  // Path deep link
  const res2 = parseScannedProductPayload('https://voltbox.test/product/20');
  assert.equal(res2.productId, 20);
  assert.equal(res2.matchedBy, 'path');

  // Catalog SKU exact match
  const res3 = parseScannedProductPayload('VB-GPU-019', mockCatalog);
  assert.equal(res3.productId, 19);
  assert.equal(res3.matchedBy, 'catalog_sku');

  // Sku pattern fallback
  const res4 = parseScannedProductPayload('VB-MBD-028');
  assert.equal(res4.productId, 28);
  assert.equal(res4.matchedBy, 'sku_pattern');

  // Voltbox prefix
  const res5 = parseScannedProductPayload('VOLTBOX:19');
  assert.equal(res5.productId, 19);

  // Plain numeric ID
  const res6 = parseScannedProductPayload('20');
  assert.equal(res6.productId, 20);

  // Invalid payload
  const res7 = parseScannedProductPayload('https://google.com/search?q=pc');
  assert.equal(res7.productId, null);
});

test('computeTouchVelocity calculates flick velocity from touch samples and clamps to maxVelocity', () => {
  // Upward finger swipe (y decreases from 400 to 250 over 50ms -> scrolling down with positive velocity)
  const downFlick = computeTouchVelocity([
    { y: 400, t: 100 },
    { y: 330, t: 125 },
    { y: 250, t: 150 },
  ]);
  assert.ok(downFlick > 30);
  assert.ok(downFlick <= 72);

  // Downward finger swipe (y increases from 200 to 350 over 50ms -> scrolling up with negative velocity)
  const upFlick = computeTouchVelocity([
    { y: 200, t: 100 },
    { y: 275, t: 125 },
    { y: 350, t: 150 },
  ]);
  assert.ok(upFlick < -30);

  // Stationary / stale touch release produces 0 velocity
  const stationary = computeTouchVelocity([
    { y: 300, t: 100 },
    { y: 300, t: 350 },
  ]);
  assert.equal(stationary, 0);
});

test('computeRubberBandDrag tracks 1:1 inside bounds and applies hyperbolic damping past top and bottom edges', () => {
  // Normal drag inside [0, 500]
  const inside = computeRubberBandDrag(-40, 100, 0, 500);
  assert.equal(inside.scrollTop, 140);
  assert.equal(inside.overscroll, 0);

  // Pulling down past top edge (scrollTop = 0, finger moves down +60px)
  const topPull = computeRubberBandDrag(60, 0, 0, 500, 84);
  assert.equal(topPull.scrollTop, 0);
  assert.ok(topPull.overscroll < 0);
  assert.ok(Math.abs(topPull.overscroll) < 60); // damped

  // Pulling up past bottom edge (scrollTop = 500, finger moves up -60px)
  const bottomPull = computeRubberBandDrag(-60, 500, 0, 500, 84);
  assert.equal(bottomPull.scrollTop, 500);
  assert.ok(bottomPull.overscroll > 0);
  assert.ok(bottomPull.overscroll < 60); // damped
});

test('stepMomentumScroll applies exponential friction coasting and spring-back recovery at drawer boundaries', () => {
  // Free coasting in the middle of a drawer
  const step1 = stepMomentumScroll({
    scrollTop: 100,
    velocity: 24,
    overscroll: 0,
    maxScroll: 600,
  });
  assert.equal(step1.phase, 'coasting');
  assert.equal(step1.active, true);
  assert.ok(step1.scrollTop > 120);
  assert.ok(step1.velocity < 24 && step1.velocity > 20);
  assert.equal(step1.overscroll, 0);

  // Coasting past bottom boundary triggers overscroll and then springs back to 0 overscroll
  let state = stepMomentumScroll({
    scrollTop: 590,
    velocity: 30,
    overscroll: 0,
    maxScroll: 600,
  });
  assert.equal(state.scrollTop, 600);
  assert.ok(state.overscroll > 0);
  assert.equal(state.active, true);

  // Step through spring-back until idle
  for (let i = 0; i < 45 && state.active; i++) {
    state = stepMomentumScroll({
      scrollTop: state.scrollTop,
      velocity: state.velocity,
      overscroll: state.overscroll,
      maxScroll: 600,
    });
  }
  assert.equal(state.active, false);
  assert.equal(state.phase, 'idle');
  assert.equal(state.scrollTop, 600);
  assert.equal(state.overscroll, 0);
});

test('computeScrollThumbMetrics computes proportional thumb size, offset, and overscroll compression', () => {
  const nonScrollable = computeScrollThumbMetrics(0, 400, 400, 0);
  assert.equal(nonScrollable.scrollable, false);

  const midScroll = computeScrollThumbMetrics(250, 1000, 500, 0);
  assert.equal(midScroll.scrollable, true);
  assert.equal(midScroll.progress, 0.5);
  assert.equal(midScroll.thumbHeightPct, 50);
  assert.equal(midScroll.thumbTopPct, 25);

  const overscrolledBottom = computeScrollThumbMetrics(500, 1000, 500, 40);
  assert.equal(overscrolledBottom.scrollable, true);
  assert.ok(overscrolledBottom.thumbHeightPct < 50); // compressed during overscroll
  assert.equal(
    Math.round((overscrolledBottom.thumbHeightPct + overscrolledBottom.thumbTopPct) * 10) / 10,
    100
  );
});

test('resolveProductImageUrl upgrades category SVG fallbacks to real product photos for cart and bill', () => {
  const catalog = [
    {
      id: 28,
      title: 'Corsair Vengeance 32GB DDR5-6000 RGB',
      category: 'memory',
      image: '/src/assets/images/product_ddr5_ram_kit_1793511150356.jpg',
    },
    {
      id: 36,
      title: 'Intel Core Ultra 9 285K Processor',
      category: 'cpus',
      image: '/src/assets/images/product_intel_ultra_cpu_1793517563101.jpg',
    },
  ];

  // Direct real image preserved
  assert.equal(
    resolveProductImageUrl(
      { productId: 28, image: '/src/assets/images/product_ddr5_ram_kit_1793511150356.jpg' },
      catalog
    ),
    '/src/assets/images/product_ddr5_ram_kit_1793511150356.jpg'
  );

  // Category icon fallback upgraded via productId lookup
  assert.equal(
    resolveProductImageUrl(
      { productId: 36, image: '/images/categories/cpus.svg', category: 'cpus' },
      catalog
    ),
    '/src/assets/images/product_intel_ultra_cpu_1793517563101.jpg'
  );

  // Category icon fallback upgraded via title lookup
  assert.equal(
    resolveProductImageUrl(
      { title: 'Corsair Vengeance 32GB DDR5-6000 RGB', image: '' },
      catalog
    ),
    '/src/assets/images/product_ddr5_ram_kit_1793511150356.jpg'
  );
});

test('detectCardNetwork and formatPaymentMethodSummary format UPI, Credit Card, Debit Card, NetBanking, and EMI options', () => {
  assert.equal(detectCardNetwork('4242 4242 4242 4242'), 'Visa');
  assert.equal(detectCardNetwork('5412 7534 8899 1023'), 'Mastercard');
  assert.equal(detectCardNetwork('3782 822463 10005'), 'Amex');
  assert.equal(detectCardNetwork('6521 8800 1122 8821'), 'RuPay');

  assert.equal(
    formatPaymentMethodSummary({ method: 'upi', upiApp: 'GPay', upiId: 'harish@okaxis' }),
    'UPI (GPay · harish@okaxis)'
  );
  assert.equal(
    formatPaymentMethodSummary({ method: 'upi', upiApp: 'PhonePe', upiMode: 'qr' }),
    'UPI QR (PhonePe)'
  );
  assert.equal(
    formatPaymentMethodSummary({ method: 'credit_card', cardNumber: '5412 0000 1111 9988' }),
    'Credit Card (Mastercard •••• 9988)'
  );
  assert.equal(
    formatPaymentMethodSummary({ method: 'debit_card', cardNumber: '6521 0000 1111 8821' }),
    'Debit Card (RuPay •••• 8821)'
  );
  assert.equal(
    formatPaymentMethodSummary({ method: 'netbanking', bankName: 'HDFC Bank' }),
    'NetBanking (HDFC Bank)'
  );
  assert.equal(
    formatPaymentMethodSummary({ method: 'emi', emiMonths: 6 }),
    'No-Cost EMI (6M Plan)'
  );
});

test('buildUpiPaymentRequestPayload builds UPI QR deep links and workflow steps for Google Pay, PhonePe, and Paytm', () => {
  assert.equal(normalizeUpiAppId('Google Pay'), 'GPay');
  assert.equal(normalizeUpiAppId('PhonePe'), 'PhonePe');
  assert.equal(normalizeUpiAppId('Paytm'), 'Paytm');
  assert.equal(normalizeUpiAppId('BHIM'), 'BHIM');

  const gpayReq = buildUpiPaymentRequestPayload({
    app: 'Google Pay',
    amountUsd: 199.5,
    orderRef: 'VB-9012',
  });
  assert.equal(gpayReq.appId, 'GPay');
  assert.equal(gpayReq.appLabel, 'Google Pay');
  assert.equal(gpayReq.merchantVpa, UPI_APP_PROFILES.GPay.merchantVpa);
  assert.equal(gpayReq.paymentMethodSummary, 'UPI QR (GPay)');
  assert.ok(gpayReq.upiUri.startsWith('upi://pay?pa=voltbox.gpay%40okaxis'));
  assert.ok(gpayReq.upiUri.includes('am=199.50'));
  assert.ok(gpayReq.upiUri.includes('tr=VB-9012'));
  assert.equal(gpayReq.workflowSteps.length, 3);
  assert.ok(gpayReq.workflowSteps[1].includes('Google Pay'));

  const phonepeReq = buildUpiPaymentRequestPayload({
    app: 'PhonePe',
    amountUsd: 349.0,
    orderRef: 'VB-9013',
  });
  assert.equal(phonepeReq.appId, 'PhonePe');
  assert.equal(phonepeReq.merchantVpa, 'voltbox.phonepe@ybl');
  assert.equal(phonepeReq.paymentMethodSummary, 'UPI QR (PhonePe)');
  assert.ok(phonepeReq.upiUri.includes('voltbox.phonepe%40ybl'));

  const paytmReq = buildUpiPaymentRequestPayload({
    app: 'Paytm',
    amountUsd: 89.99,
    orderRef: 'VB-9014',
  });
  assert.equal(paytmReq.appId, 'Paytm');
  assert.equal(paytmReq.merchantVpa, 'voltbox.paytm@paytm');
  assert.equal(paytmReq.paymentMethodSummary, 'UPI QR (Paytm)');
  assert.ok(paytmReq.upiUri.includes('voltbox.paytm%40paytm'));
});

test('buildProductComparison builds side-by-side matrix, diff detection, and value highlights', () => {
  const p1 = {
    id: 19,
    title: 'Nvidia RTX 5090',
    price: 200,
    category: 'memory',
    quantity: 8,
    image: 'https://images.unsplash.com/photo-rtx',
  };
  const p2 = {
    id: 20,
    title: 'AMD Ryzen 9 9950X',
    price: 180,
    category: 'cpus',
    quantity: 3,
    image: 'https://images.unsplash.com/photo-ryzen',
  };

  const comp = buildProductComparison([p1, p2]);
  assert.equal(comp.count, 2);
  assert.equal(comp.productIds.length, 2);
  assert.equal(comp.lowestPriceProductId, 20);
  assert.equal(comp.highestPriceProductId, 19);
  assert.equal(comp.priceSpread, 20);
  assert.equal(comp.hasIdenticalCategory, false);

  // Check metrics
  assert.ok(comp.metrics.length >= 7);
  const priceMetric = comp.metrics.find((m) => m.key === 'price');
  assert.ok(priceMetric);
  assert.equal(priceMetric.hasDifference, true);
  assert.equal(priceMetric.values[19], '$200.00');
  assert.equal(priceMetric.values[20], '$180.00');
  assert.equal(priceMetric.bestProductId, 20);
  assert.equal(priceMetric.worstProductId, 19);
  assert.equal(priceMetric.indicators?.[20], 'better');
  assert.equal(priceMetric.indicators?.[19], 'worse');
  assert.equal(priceMetric.indicatorLabels?.[20], 'Best Price');
  assert.equal(priceMetric.indicatorLabels?.[19], 'Highest Cost');

  const stockMetric = comp.metrics.find((m) => m.key === 'stockStatus');
  assert.ok(stockMetric);
  assert.ok(String(stockMetric.values[20]).includes('Low Stock!'));
  assert.equal(stockMetric.bestProductId, 19);
  assert.equal(stockMetric.worstProductId, 20);
  assert.equal(stockMetric.indicators?.[19], 'better');
  assert.equal(stockMetric.indicators?.[20], 'worse');

  const powerMetric = comp.metrics.find((m) => m.key === 'powerDraw');
  assert.ok(powerMetric);
  // CPU (170W) has lower power draw than GPU (450W)
  assert.equal(powerMetric.indicators?.[20], 'better');
  assert.equal(powerMetric.indicators?.[19], 'worse');

  const archMetric = comp.metrics.find((m) => m.key === 'architecture');
  assert.ok(archMetric);
  // GPU Blackwell (98) vs CPU Zen 5 (95)
  assert.equal(archMetric.indicators?.[19], 'better');
  assert.equal(archMetric.indicators?.[20], 'worse');

  // 3-product comparison check (better, neutral, worse)
  const p3 = {
    id: 21,
    title: 'Samsung 990 Pro NVMe',
    price: 150,
    category: 'storage',
    quantity: 5,
    image: 'https://images.unsplash.com/photo-nvme',
  };
  const comp3 = buildProductComparison([p1, p2, p3]);
  const priceMetric3 = comp3.metrics.find((m) => m.key === 'price');
  assert.ok(priceMetric3);
  assert.equal(priceMetric3.indicators?.[21], 'better'); // $150
  assert.equal(priceMetric3.indicators?.[20], 'neutral'); // $180
  assert.equal(priceMetric3.indicators?.[19], 'worse'); // $200

  assert.equal(parsePowerWatts('450W TDP (16-Pin 12V-2x6)'), 450);
  assert.equal(parsePowerWatts('5.4W Active / 40mW DevSleep'), 5.4);
  assert.ok(scoreInterfaceBandwidth('PCIe 5.0 x16') > scoreInterfaceBandwidth('SATA III 6.0 Gb/s'));
  assert.ok(scoreArchitectureTier('Blackwell / Ada 32GB GDDR7') > scoreArchitectureTier('CMR 7200 RPM Multi-Platter Cache'));
  assert.ok(parseWarrantyScore('5-Year / 600 TBW Endurance') > parseWarrantyScore('1-Year Hardware Replacement'));

  const tiedEval = evaluateSpecRowIndicators({ 1: 100, 2: 100 }, false);
  assert.equal(tiedEval.indicators[1], 'neutral');
  assert.equal(tiedEval.indicators[2], 'neutral');

  // Single product comparison check
  const singleComp = buildProductComparison([p1]);
  assert.equal(singleComp.count, 1);
  assert.equal(singleComp.priceSpread, 0);

  // Empty list check
  const emptyComp = buildProductComparison([]);
  assert.equal(emptyComp.count, 0);
  assert.equal(emptyComp.products.length, 0);
});

test('IpRateLimiter enforces Bucket4j per-IP token bucket rate limits, isolates IPs, and refills over time', () => {
  const limiter = new IpRateLimiter({
    generalCapacity: 3,
    sensitiveCapacity: 2,
    refillWindowMs: 60_000,
  });

  const t0 = 1_000_000;
  // IP normalization
  assert.equal(limiter.normalizeIp('::ffff:192.168.1.42, 10.0.0.1'), '192.168.1.42');
  assert.equal(limiter.normalizeIp('::1'), '127.0.0.1');

  // Sensitive route detection
  assert.equal(limiter.isSensitiveEndpoint('/api/auth/login', 'POST'), true);
  assert.equal(limiter.isSensitiveEndpoint('/api/orders', 'POST'), true);
  assert.equal(limiter.isSensitiveEndpoint('/api/products', 'GET'), false);

  // Consume general bucket for IP A (capacity 3)
  const r1 = limiter.tryConsume('203.0.113.10', false, 1, t0);
  assert.equal(r1.consumed, true);
  assert.equal(r1.remainingTokens, 2);
  assert.equal(r1.limitCapacity, 3);

  const r2 = limiter.tryConsume('203.0.113.10', false, 1, t0);
  assert.equal(r2.consumed, true);
  assert.equal(r2.remainingTokens, 1);

  const r3 = limiter.tryConsume('203.0.113.10', false, 1, t0);
  assert.equal(r3.consumed, true);
  assert.equal(r3.remainingTokens, 0);

  // 4th request from IP A is rejected (429 Too Many Requests)
  const r4 = limiter.tryConsume('203.0.113.10', false, 1, t0);
  assert.equal(r4.consumed, false);
  assert.equal(r4.remainingTokens, 0);
  assert.ok(r4.retryAfterSeconds >= 1);

  // Different IP B is isolated and still has full tokens
  const otherIp = limiter.tryConsume('198.51.100.7', false, 1, t0);
  assert.equal(otherIp.consumed, true);
  assert.equal(otherIp.remainingTokens, 2);

  // After 20 seconds (1/3 of 60s window), 1 token refills for IP A
  const afterRefill = limiter.tryConsume('203.0.113.10', false, 1, t0 + 20_000);
  assert.equal(afterRefill.consumed, true);
  assert.equal(afterRefill.remainingTokens, 0);
});

test('Notify Me price drop alert logic validates inputs, computes presets, upserts/removes subscriptions, and dispatches email alerts when price drops below threshold', () => {
  // 1. Preset thresholds
  const presets = computeSuggestedPriceThresholds(200, 172);
  assert.equal(presets.length, 4);
  assert.equal(presets[0].key, 'drop5');
  assert.equal(presets[0].targetPrice, 190);
  assert.equal(presets[1].key, 'drop10');
  assert.equal(presets[1].targetPrice, 180);
  assert.equal(presets[2].key, 'drop15');
  assert.equal(presets[2].targetPrice, 170);
  assert.equal(presets[3].key, 'sixMonthLow');
  assert.equal(presets[3].targetPrice, 172);

  // 2. Input validation
  const invalidEmail = validatePriceAlertInput({ productId: 19, email: 'not-an-email', targetPrice: 180 });
  assert.equal(invalidEmail.ok, false);

  const invalidPrice = validatePriceAlertInput({ productId: 19, email: 'harish@voltbox.test', targetPrice: -10 });
  assert.equal(invalidPrice.ok, false);

  const valid = validatePriceAlertInput({ productId: 19, email: '  Harish@Voltbox.Test ', targetPrice: 185.5 });
  assert.equal(valid.ok, true);
  assert.equal(valid.normalizedEmail, 'harish@voltbox.test');
  assert.equal(valid.normalizedTargetPrice, 185.5);

  // 3. Upsert subscription
  const rtx5090 = { id: 19, title: 'NVIDIA GeForce RTX 5090', category: 'gpus', price: 200 };
  const created = upsertPriceAlertSubscription([], {
    product: rtx5090,
    email: 'harish@voltbox.test',
    targetPrice: 185,
    nowMs: 1_700_000_000_000,
  });
  assert.equal(created.isUpdate, false);
  assert.equal(created.alerts.length, 1);
  assert.equal(created.subscription.productId, 19);
  assert.equal(created.subscription.sku, 'VB-GPU-019');
  assert.equal(created.subscription.targetPrice, 185);
  assert.equal(created.subscription.triggered, false);

  // Updating the same product alert updates targetPrice in-place
  const updated = upsertPriceAlertSubscription(created.alerts, {
    product: rtx5090,
    email: 'harish@voltbox.test',
    targetPrice: 180,
    nowMs: 1_700_000_005_000,
  });
  assert.equal(updated.isUpdate, true);
  assert.equal(updated.alerts.length, 1);
  assert.equal(updated.subscription.targetPrice, 180);

  // 4. Price stays above threshold ($189 > $180): no email triggered
  const evalAbove = evaluatePriceDropAlerts(updated.alerts, 19, 189, 1_700_000_010_000);
  assert.equal(evalAbove.triggeredNotifications.length, 0);
  assert.equal(evalAbove.updatedAlerts[0].triggered, false);

  // 5. Price drops below threshold ($175 <= $180): email notification triggered!
  const evalDrop = evaluatePriceDropAlerts(updated.alerts, 19, 175, 1_700_000_020_000);
  assert.equal(evalDrop.triggeredNotifications.length, 1);
  assert.equal(evalDrop.updatedAlerts[0].triggered, true);
  assert.equal(evalDrop.updatedAlerts[0].triggeredPrice, 175);

  const emailPayload = evalDrop.triggeredNotifications[0];
  assert.equal(emailPayload.toEmail, 'harish@voltbox.test');
  assert.equal(emailPayload.newPrice, 175);
  assert.equal(emailPayload.targetPrice, 180);
  assert.equal(emailPayload.savingsAmount, 25);
  assert.ok(emailPayload.subject.includes('RTX 5090'));
  assert.ok(emailPayload.subject.includes('$175.00'));
  assert.ok(emailPayload.body.includes('VB-GPU-019'));

  // 6. Remove subscription
  const removed = removePriceAlertSubscription(evalDrop.updatedAlerts, 19);
  assert.equal(removed.removed, true);
  assert.equal(removed.alerts.length, 0);

  // 7. Evaluate target price relative to 6-month historical sparkline data
  const sample6mHistory = [
    { month: 'Jun', price: 205 },
    { month: 'Jul', price: 198 },
    { month: 'Aug', price: 185 },
    { month: 'Sep', price: 192 },
    { month: 'Oct', price: 176 },
    { month: 'Nov', price: 190 },
  ];
  const instantEval = evaluatePriceAlertThresholdVsHistory(sample6mHistory, 190, 195);
  assert.equal(instantEval.likelihoodTier, 'instant-trigger');
  assert.equal(instantEval.sixMonthLow, 176);
  assert.equal(instantEval.sixMonthHigh, 205);

  const highProbEval = evaluatePriceAlertThresholdVsHistory(sample6mHistory, 190, 186);
  assert.equal(highProbEval.likelihoodTier, 'high-probability');
  assert.equal(highProbEval.monthsAtOrBelowTarget, 2);

  const sweetSpotEval = evaluatePriceAlertThresholdVsHistory(sample6mHistory, 190, 176);
  assert.equal(sweetSpotEval.likelihoodTier, 'near-6m-low');
  assert.equal(sweetSpotEval.badgeLabel, '6M Floor Sweet Spot');

  const aggressiveEval = evaluatePriceAlertThresholdVsHistory(sample6mHistory, 190, 160);
  assert.equal(aggressiveEval.likelihoodTier, 'aggressive-below-low');
  assert.equal(aggressiveEval.badgeLabel, 'Below 6M Low');
});

test('QR Scan History: records scanned products in most-recent-first order, deduplicates re-scans, and caps at 10 items', () => {
  assert.equal(MAX_SCAN_HISTORY_ITEMS, 10);

  let history = clearScanHistory();
  assert.deepEqual(history, []);

  // 1. Scan first product
  history = recordScannedProduct(
    history,
    { id: 19, title: 'NVIDIA GeForce RTX 5090', category: 'gpus', price: 200 },
    1_700_000_000_000
  );
  assert.equal(history.length, 1);
  assert.equal(history[0].productId, 19);
  assert.equal(history[0].sku, 'VB-GPU-019');
  assert.equal(history[0].scanCount, 1);
  assert.equal(formatScanHistoryRelativeTime(history[0].scannedAt, 1_700_000_010_000), 'Just now');
  assert.equal(formatScanHistoryRelativeTime(history[0].scannedAt, 1_700_000_180_000), '3m ago');

  // 2. Scan second product -> becomes index 0
  history = recordScannedProduct(
    history,
    { id: 20, title: 'AMD Ryzen 9 9950X', category: 'cpus', price: 112 },
    1_700_000_060_000
  );
  assert.equal(history.length, 2);
  assert.equal(history[0].productId, 20);
  assert.equal(history[1].productId, 19);

  // 3. Re-scan product 19 -> moves back to index 0, deduplicates, increments scanCount to 2
  history = recordScannedProduct(
    history,
    { id: 19, title: 'NVIDIA GeForce RTX 5090', category: 'gpus', price: 200 },
    1_700_000_120_000
  );
  assert.equal(history.length, 2);
  assert.equal(history[0].productId, 19);
  assert.equal(history[0].scanCount, 2);
  assert.equal(history[1].productId, 20);

  // 4. Scan 12 distinct products -> strictly caps at 10 most recent items
  for (let id = 1; id <= 12; id++) {
    history = recordScannedProduct(
      history,
      { id, title: `Hardware Component #${id}`, category: 'components', price: 10 * id },
      1_700_000_200_000 + id * 1000
    );
  }
  assert.equal(history.length, 10);
  assert.equal(history[0].productId, 12);
  assert.equal(history[9].productId, 3);
  assert.equal(history.some((item) => item.productId === 1), false);
  assert.equal(history.some((item) => item.productId === 2), false);

  // 5. Remove a single item from history
  history = removeScannedProduct(history, 10);
  assert.equal(history.length, 9);
  assert.equal(history.some((item) => item.productId === 10), false);

  // 6. Clear history
  history = clearScanHistory();
  assert.equal(history.length, 0);
});

test('filterAndSortCatalogProducts filters by category, budget ceiling, search query, and sorts by rating-desc', () => {
  const sampleCatalog = [
    { id: 19, title: 'NVIDIA GeForce RTX 5090', category: 'gpus', price: 200, quantity: 2, ratingRate: 4.9, ratingCount: 120 },
    { id: 20, title: 'AMD Ryzen 9 9950X', category: 'cpus', price: 112, quantity: 12, ratingRate: 4.8, ratingCount: 95 },
    { id: 21, title: 'MSI MAG B570 Tomahawk', category: 'motherboards', price: 145, quantity: 3, ratingRate: 4.6, ratingCount: 64 },
    { id: 22, title: 'Samsung 990 Pro 2TB SSD', category: 'storage', price: 89, quantity: 8, ratingRate: 4.95, ratingCount: 210 },
  ];

  // Default state: all 4 items visible, no active filters
  const base = filterAndSortCatalogProducts(sampleCatalog);
  assert.equal(base.visibleCount, 4);
  assert.equal(base.totalCount, 4);
  assert.equal(base.hasActiveFilters, false);

  // Budget ceiling filter: Under $150 -> excludes $200 RTX 5090
  const under150 = filterAndSortCatalogProducts(sampleCatalog, { maxBudget: 150 });
  assert.equal(under150.visibleCount, 3);
  assert.equal(under150.hasActiveFilters, true);
  assert.equal(under150.items.some((p) => p.id === 19), false);

  // Under $100 -> only $89 SSD
  const under100 = filterAndSortCatalogProducts(sampleCatalog, { maxBudget: 100 });
  assert.equal(under100.visibleCount, 1);
  assert.equal(under100.items[0].id, 22);

  // Sort by highest rating first
  const byRating = filterAndSortCatalogProducts(sampleCatalog, { sortMode: 'rating-desc' });
  assert.deepEqual(
    byRating.items.map((p) => p.id),
    [22, 19, 20, 21]
  );

  // Quick Stock Filter: Available Now vs Backorder
  const mixedStockCatalog = [
    ...sampleCatalog,
    { id: 29, title: 'Alienware 34" QD-OLED Curved Monitor', category: 'monitors', price: 249, quantity: 0, ratingRate: 4.9, ratingCount: 64 },
    { id: 37, title: 'ASUS ROG Crosshair X870E Hero Motherboard', category: 'motherboards', price: 230, quantity: 0, backorder: true, ratingRate: 4.9, ratingCount: 58 },
  ];
  const allStockRes = filterAndSortCatalogProducts(mixedStockCatalog, { stockFilter: 'all' });
  assert.equal(allStockRes.totalCount, 6);
  assert.equal(allStockRes.availableNowCount, 4);
  assert.equal(allStockRes.backorderCount, 2);
  assert.equal(allStockRes.visibleCount, 6);

  const availNowRes = filterAndSortCatalogProducts(mixedStockCatalog, { stockFilter: 'available-now' });
  assert.equal(availNowRes.visibleCount, 4);
  assert.equal(availNowRes.hasActiveFilters, true);
  assert.ok(availNowRes.activeFilterLabels.includes('Stock: Available Now'));
  assert.equal(availNowRes.items.every((p) => (p.quantity ?? 0) > 0), true);

  const backorderRes = filterAndSortCatalogProducts(mixedStockCatalog, { stockFilter: 'backorder' });
  assert.equal(backorderRes.visibleCount, 2);
  assert.equal(backorderRes.hasActiveFilters, true);
  assert.ok(backorderRes.activeFilterLabels.includes('Stock: Backorder'));
  assert.deepEqual(backorderRes.items.map((p) => p.id), [29, 37]);
});

test('Product Spec Drawer Share: generates descriptions across tones and builds Twitter, WhatsApp, and Facebook share URLs', () => {
  const gpu = {
    id: 19,
    title: 'Nvidia RTX 5090',
    price: 182.4,
    sku: 'VB-GPU-019',
    category: 'gpus',
  };

  const payload = generateProductSharePayload('https://voltbox.test', gpu, 'spec');
  assert.equal(payload.url, 'https://voltbox.test/?product=19');
  assert.ok(payload.generatedDescription.includes('Nvidia RTX 5090'));
  assert.ok(payload.generatedDescription.includes('$182.40'));
  assert.ok(payload.generatedDescription.includes('VB-GPU-019'));
  assert.ok(payload.generatedDescription.includes('Blackwell'));

  // Tone variants
  assert.ok(payload.descriptionsByTone.deal.includes('5% Rig Builder Bundle'));
  assert.ok(payload.descriptionsByTone.concise.includes('Check out Nvidia RTX 5090'));

  // Social share URLs for Twitter, WhatsApp, and Facebook
  assert.ok(payload.socialUrls.twitter.startsWith('https://twitter.com/intent/tweet?text='));
  assert.ok(payload.socialUrls.twitter.includes(encodeURIComponent('https://voltbox.test/?product=19')));
  assert.ok(payload.socialUrls.twitter.includes('hashtags='));

  assert.ok(payload.socialUrls.whatsapp.startsWith('https://wa.me/?text='));
  assert.ok(payload.socialUrls.whatsapp.includes(encodeURIComponent('https://voltbox.test/?product=19')));
  assert.ok(payload.socialUrls.whatsapp.includes(encodeURIComponent('Nvidia RTX 5090')));

  assert.ok(payload.socialUrls.facebook.startsWith('https://www.facebook.com/sharer/sharer.php?u='));
  assert.ok(payload.socialUrls.facebook.includes(encodeURIComponent('https://voltbox.test/?product=19')));
  assert.ok(payload.socialUrls.facebook.includes('quote='));

  // Custom edited description updates social URLs accurately
  const customUrls = buildSocialShareUrls(
    payload.url,
    'Custom rig build post for RTX 5090!',
    ['Voltbox', 'RTX5090']
  );
  assert.ok(customUrls.twitter.includes(encodeURIComponent('Custom rig build post for RTX 5090!')));
  assert.ok(customUrls.whatsapp.includes(encodeURIComponent('Custom rig build post for RTX 5090! https://voltbox.test/?product=19')));
  assert.ok(customUrls.facebook.includes(encodeURIComponent('Custom rig build post for RTX 5090!')));
});

test('Web Speech API Voice Search: normalizeVoiceSearchTranscript strips filler, normalizes hardware acronyms, extracts budget hints, and handles clear commands', () => {
  // 1. Conversational filler + spaced hardware acronym + trailing period
  const res1 = normalizeVoiceSearchTranscript('Search for Nvidia R T X 5090.');
  assert.equal(res1.query, 'Nvidia RTX 5090');
  assert.equal(res1.isClearCommand, false);
  assert.equal(res1.budgetMaxHint, null);

  // 2. Spoken budget hint + SSD acronym
  const res2 = normalizeVoiceSearchTranscript('show me Samsung S S D under 150 dollars!');
  assert.equal(res2.query, 'Samsung SSD');
  assert.equal(res2.budgetMaxHint, 150);
  assert.equal(res2.isClearCommand, false);

  // 3. Spoken category hint
  const res3 = normalizeVoiceSearchTranscript('find graphics cards');
  assert.equal(res3.query, 'graphics cards');
  assert.equal(res3.categoryHint, 'gpus');

  // 4. Clear search command
  const res4 = normalizeVoiceSearchTranscript('Clear search.');
  assert.equal(res4.query, '');
  assert.equal(res4.isClearCommand, true);
});

test('Studio UI Templates, Live PSU Wattage Estimator, Instagram Direct Handles & Starter Rig Recommender', () => {
  // 1. UI & Background Template resolution & cycling
  const obsidian = resolveUiTemplateTheme('obsidian');
  assert.equal(obsidian.id, 'obsidian');
  assert.equal(obsidian.name, 'Obsidian Studio');

  const nextTheme = getNextUiTemplateTheme('obsidian');
  assert.equal(nextTheme.id, 'blueprint');
  assert.equal(resolveUiTemplateTheme('copper').id, 'copper');
  assert.equal(resolveUiTemplateTheme('titanium').id, 'titanium');

  // 2. System Power & ATX 3.1 PSU Wattage Estimator
  const idleEst = computeSystemPowerEstimate([]);
  assert.equal(idleEst.estimatedPeakWatts, 0);
  assert.equal(idleEst.recommendedPsuWatts, 650);

  const rigEst = computeSystemPowerEstimate([
    { title: 'Nvidia RTX 5090', componentGroup: 'gpus', quantity: 1 },
    { title: 'AMD Ryzen 9', componentGroup: 'cpus', quantity: 1 },
    { title: 'MSI MotherBoard B570', componentGroup: 'motherboards', quantity: 1 },
    { title: 'Samsung 1TB SSD', componentGroup: 'storage', quantity: 1 },
  ]);
  assert.equal(rigEst.estimatedPeakWatts, 65 + 450 + 170 + 55 + 12); // 752W
  assert.equal(rigEst.recommendedPsuWatts, 1000);
  assert.equal(rigEst.psuTierLabel, '1000W ATX 3.1 Platinum');
  assert.equal(rigEst.headroomStatus, 'high-draw');

  // 3. Instagram Direct Handle Formatting
  assert.equal(formatInstagramHandle('Elena Vance', 'STAFF_ARCHITECT'), '@elena.vance.voltbox');
  assert.equal(formatInstagramHandle('Marcus Chen', 'VERIFIED_BUILDER'), '@marcus.chen');

  // 4. Starter Rig 4-Part Bundle Recommender
  const starter = recommendStarterRigBundle([
    { id: 19, title: 'Nvidia RTX 5090', componentGroup: 'gpus', price: 1999, ratingRate: 4.9 },
    { id: 20, title: 'AMD RYZEN 9', componentGroup: 'cpus', price: 549, ratingRate: 4.8 },
    { id: 21, title: 'MSI MotherBoard B570', componentGroup: 'motherboards', price: 219, ratingRate: 4.7 },
    { id: 22, title: 'Samsung 1TB SSD', componentGroup: 'storage', price: 99, ratingRate: 4.9 },
  ]);
  assert.equal(starter.length, 4);
});

test('Best Deal quick-filter: computePriceDropFromSixMonthAvg and filterAndSortCatalogProducts with best-deal sort mode', () => {
  const p1 = { id: 1, price: 100 };
  const dealMetrics1 = computePriceDropFromSixMonthAvg(p1);
  assert.equal(typeof dealMetrics1.sixMonthAvg, 'number');
  assert.equal(typeof dealMetrics1.percentageDrop, 'number');
  assert.equal(typeof dealMetrics1.savingsAmount, 'number');
  assert.equal(typeof dealMetrics1.isDeal, 'boolean');

  // Multi-product sort check
  const products = [
    { id: 1, title: 'Component A', price: 100 },
    { id: 2, title: 'Component B', price: 200 },
    { id: 3, title: 'Component C', price: 300 },
  ];

  const sortedResult = filterAndSortCatalogProducts(products, { sortMode: 'best-deal' });
  assert.equal(sortedResult.items.length, 3);
  assert.ok(sortedResult.activeFilterLabels.includes('Sort: Best Deal (6M Drop)'));

  // Verify descending order of percentage drop
  const drop0 = computePriceDropFromSixMonthAvg(sortedResult.items[0]).percentageDrop;
  const drop1 = computePriceDropFromSixMonthAvg(sortedResult.items[1]).percentageDrop;
  const drop2 = computePriceDropFromSixMonthAvg(sortedResult.items[2]).percentageDrop;
  assert.ok(drop0 >= drop1, `drop0 (${drop0}) should be >= drop1 (${drop1})`);
  assert.ok(drop1 >= drop2, `drop1 (${drop1}) should be >= drop2 (${drop2})`);
});

test('Price Drop Alert Expiry Date: parsePriceAlertExpiryDate, isPriceAlertExpired, upsert and evaluatePriceDropAlerts', () => {
  const now = 1700000000000;

  // 1. Parsing raw values
  assert.equal(parsePriceAlertExpiryDate(null), null);
  assert.equal(parsePriceAlertExpiryDate(''), null);
  assert.equal(parsePriceAlertExpiryDate('none'), null);
  assert.equal(parsePriceAlertExpiryDate(now + 86400000), now + 86400000);

  const dateParsed = parsePriceAlertExpiryDate('2026-12-31');
  assert.ok(typeof dateParsed === 'number' && dateParsed > 0);
  assert.ok(new Date(dateParsed).toISOString().includes('2026-12-31'));

  // 2. Expiry evaluation
  const futureAlert = { expiresAt: now + 50000, isExpired: false };
  const pastAlert = { expiresAt: now - 50000, isExpired: false };
  const noExpiryAlert = { expiresAt: null, isExpired: false };
  const alreadyExpiredAlert = { expiresAt: now + 50000, isExpired: true };

  assert.equal(isPriceAlertExpired(futureAlert, now), false);
  assert.equal(isPriceAlertExpired(pastAlert, now), true);
  assert.equal(isPriceAlertExpired(noExpiryAlert, now), false);
  assert.equal(isPriceAlertExpired(alreadyExpiredAlert, now), true);

  // 3. Upserting with expiry date
  const product = { id: 19, title: 'Nvidia RTX 5090', price: 1000 };
  const res = upsertPriceAlertSubscription([], {
    product,
    email: 'builder@example.com',
    targetPrice: 900,
    expiresAt: now + 86400000,
    nowMs: now,
  });

  assert.equal(res.subscription.expiresAt, now + 86400000);
  assert.equal(res.subscription.isExpired, false);
  assert.equal(res.subscription.triggered, false);

  // 4. evaluatePriceDropAlerts skips expired alert
  const expiredRes = evaluatePriceDropAlerts(
    res.alerts,
    19,
    850,
    now + 100000000 // future timestamp where alert is expired
  );
  assert.equal(expiredRes.triggeredNotifications.length, 0);
  assert.equal(expiredRes.updatedAlerts[0].isExpired, true);

  // 5. evaluatePriceDropAlerts triggers active (non-expired) alert
  const activeAlerts = upsertPriceAlertSubscription([], {
    product,
    email: 'builder@example.com',
    targetPrice: 900,
    expiresAt: now + 86400000,
    nowMs: now,
  }).alerts;

  const activeRes = evaluatePriceDropAlerts(activeAlerts, 19, 850, now + 1000);
  assert.equal(activeRes.triggeredNotifications.length, 1);
  assert.equal(activeRes.updatedAlerts[0].triggered, true);
  assert.equal(activeRes.triggeredNotifications[0].newPrice, 850);
});

test('Catalog Grid Keyboard Navigation: computeGridNavigationIndex, calculateGridColumnCount and handleProductCardKeyAction', () => {
  const total = 30;
  const cols = 4;

  // 1. Arrow Right and Left
  assert.equal(computeGridNavigationIndex(0, total, cols, 'ArrowRight'), 1);
  assert.equal(computeGridNavigationIndex(29, total, cols, 'ArrowRight'), 29); // clamp at end
  assert.equal(computeGridNavigationIndex(5, total, cols, 'ArrowLeft'), 4);
  assert.equal(computeGridNavigationIndex(0, total, cols, 'ArrowLeft'), 0); // clamp at start

  // 2. Arrow Down and Up (vertical jumps by column count)
  assert.equal(computeGridNavigationIndex(2, total, cols, 'ArrowDown'), 6);
  assert.equal(computeGridNavigationIndex(6, total, cols, 'ArrowUp'), 2);
  assert.equal(computeGridNavigationIndex(1, total, cols, 'ArrowUp'), 0);
  // Near end of grid: jumping down to bottom row clamps to total - 1
  assert.equal(computeGridNavigationIndex(27, total, cols, 'ArrowDown'), 29);
  assert.equal(computeGridNavigationIndex(29, total, cols, 'ArrowDown'), 29);

  // 3. Home, End, PageUp, PageDown
  assert.equal(computeGridNavigationIndex(15, total, cols, 'Home'), 0);
  assert.equal(computeGridNavigationIndex(15, total, cols, 'End'), 29);
  assert.equal(computeGridNavigationIndex(2, total, cols, 'PageDown'), 10); // +2 rows (8 items)
  assert.equal(computeGridNavigationIndex(12, total, cols, 'PageUp'), 4);   // -2 rows

  // 4. calculateGridColumnCount across viewport widths and list mode
  assert.equal(calculateGridColumnCount(1440, 'grid'), 4);
  assert.equal(calculateGridColumnCount(1024, 'grid'), 3);
  assert.equal(calculateGridColumnCount(768, 'grid'), 2);
  assert.equal(calculateGridColumnCount(390, 'grid'), 2);
  assert.equal(calculateGridColumnCount(1440, 'list'), 1);

  // 5. handleProductCardKeyAction
  assert.equal(handleProductCardKeyAction('Enter'), 'open-specs');
  assert.equal(handleProductCardKeyAction(' '), 'open-specs');
  assert.equal(handleProductCardKeyAction('+'), 'inc-cart');
  assert.equal(handleProductCardKeyAction('='), 'inc-cart');
  assert.equal(handleProductCardKeyAction('-'), 'dec-cart');
  assert.equal(handleProductCardKeyAction('c'), 'toggle-compare');
  assert.equal(handleProductCardKeyAction('C'), 'toggle-compare');
  assert.equal(handleProductCardKeyAction('w'), 'toggle-wishlist');
  assert.equal(handleProductCardKeyAction('p'), 'toggle-history');
  assert.equal(handleProductCardKeyAction('s'), 'open-specs');
  assert.equal(handleProductCardKeyAction('ArrowDown'), 'navigate');
  assert.equal(handleProductCardKeyAction('x'), 'none');
});

test('Real-Time Order Tracking Dashboard: resolveOrderTrackingTimeline, normalizeTrackingStatus and advanceOrderTrackingStage', () => {
  const baseOrder = {
    id: 'VB-261105-882194',
    placedAt: 1730800000000,
    status: 'Order Placed',
    count: 3,
    total: 2450.0,
    shippingName: 'Alex Chen',
    shippingAddress: 'Flat 402, Cyber Heights, Indiranagar, Bengaluru, KA 560038',
    lines: [
      { productId: 1, title: 'RTX 4090 OC 24GB', price: 1899.99, qty: 1 },
      { productId: 2, title: 'Ryzen 9 7950X 16-Core', price: 549.99, qty: 1 },
    ],
  };

  // 1. Stage 0: Order Placed
  const t0 = resolveOrderTrackingTimeline(baseOrder, 1730800000000 + 1000);
  assert.equal(t0.orderId, 'VB-261105-882194');
  assert.equal(t0.currentStageIndex, 0);
  assert.equal(t0.currentStageKey, 'placed');
  assert.equal(t0.currentStatus, 'Order Placed');
  assert.equal(t0.progressPercent, 0);
  assert.equal(t0.canAdvance, true);
  assert.equal(t0.nextStage, 'Processing');
  assert.equal(t0.carrier.name, 'BlueDart Express');
  assert.equal(t0.carrier.trackingNumber, 'VB-TRK-882194');
  assert.equal(t0.stages.length, 4);
  assert.equal(t0.stages[0].state, 'current');
  assert.equal(t0.stages[1].state, 'upcoming');
  assert.equal(t0.stages[2].state, 'upcoming');
  assert.equal(t0.stages[3].state, 'upcoming');
  assert.equal(t0.destination.name, 'Alex Chen');
  assert.match(t0.destination.address, /Indiranagar/);

  // 2. Advance to Stage 1: Processing
  const nextStage1 = advanceOrderTrackingStage(t0.currentStatus);
  assert.equal(nextStage1, 'Processing');
  const t1 = resolveOrderTrackingTimeline({ ...baseOrder, status: nextStage1 });
  assert.equal(t1.currentStageIndex, 1);
  assert.equal(t1.currentStageKey, 'processing');
  assert.equal(t1.currentStatus, 'Processing');
  assert.equal(t1.progressPercent, 33);
  assert.equal(t1.canAdvance, true);
  assert.equal(t1.nextStage, 'Shipped');
  assert.equal(t1.stages[0].state, 'completed');
  assert.equal(t1.stages[1].state, 'current');
  assert.equal(t1.stages[2].state, 'upcoming');
  assert.equal(t1.stages[3].state, 'upcoming');

  // 3. Advance to Stage 2: Shipped
  const nextStage2 = advanceOrderTrackingStage(t1.currentStatus);
  assert.equal(nextStage2, 'Shipped');
  const t2 = resolveOrderTrackingTimeline({ ...baseOrder, status: nextStage2 });
  assert.equal(t2.currentStageIndex, 2);
  assert.equal(t2.currentStageKey, 'shipped');
  assert.equal(t2.currentStatus, 'Shipped');
  assert.equal(t2.progressPercent, 67);
  assert.equal(t2.canAdvance, true);
  assert.equal(t2.nextStage, 'Delivered');
  assert.equal(t2.stages[0].state, 'completed');
  assert.equal(t2.stages[1].state, 'completed');
  assert.equal(t2.stages[2].state, 'current');
  assert.equal(t2.stages[3].state, 'upcoming');

  // 4. Advance to Stage 3: Delivered
  const nextStage3 = advanceOrderTrackingStage(t2.currentStatus);
  assert.equal(nextStage3, 'Delivered');
  const t3 = resolveOrderTrackingTimeline({ ...baseOrder, status: nextStage3 });
  assert.equal(t3.currentStageIndex, 3);
  assert.equal(t3.currentStageKey, 'delivered');
  assert.equal(t3.currentStatus, 'Delivered');
  assert.equal(t3.progressPercent, 100);
  assert.equal(t3.canAdvance, false);
  assert.equal(t3.nextStage, null);
  assert.equal(t3.stages[0].state, 'completed');
  assert.equal(t3.stages[1].state, 'completed');
  assert.equal(t3.stages[2].state, 'completed');
  assert.equal(t3.stages[3].state, 'completed');

  // 5. Normalization tolerance for legacy or custom status strings
  assert.equal(normalizeTrackingStatus('Paid · Verified').canonicalLabel, 'Order Placed');
  assert.equal(normalizeTrackingStatus('In Transit').canonicalLabel, 'Shipped');
  assert.equal(normalizeTrackingStatus('Quality Check Bench').canonicalLabel, 'Processing');
  assert.equal(normalizeTrackingStatus('Completed').canonicalLabel, 'Delivered');
  assert.equal(normalizeTrackingStatus('').canonicalLabel, 'Order Placed');
});

test('QR Scanner Audio Ping: getScanPingAudioConfig, calculateScanPingSchedule, validateQrScanAudioTrigger, formatAudioPingToggleState and synthesizeScanPingPcmBuffer', () => {
  // 1. Audio Configurations (subtle, crystal, classic)
  const subtleCfg = getScanPingAudioConfig('subtle');
  assert.equal(subtleCfg.profile, 'subtle');
  assert.equal(subtleCfg.masterGain, 0.22);
  assert.equal(subtleCfg.tones.length, 2);
  assert.equal(subtleCfg.tones[0].freq, 1046.50); // C6 fundamental
  assert.equal(subtleCfg.tones[1].freq, 1567.98); // G6 harmonic shimmer
  assert.equal(subtleCfg.tones[1].delaySec, 0.012);
  assert.deepEqual(subtleCfg.vibrationPattern, [30, 20, 40]);
  assert.equal(subtleCfg.visualFeedbackMs, 650);

  const crystalCfg = getScanPingAudioConfig('crystal');
  assert.equal(crystalCfg.profile, 'crystal');
  assert.equal(crystalCfg.tones[0].freq, 1318.51); // E6
  assert.equal(crystalCfg.tones[1].freq, 2093.00); // C7

  const classicCfg = getScanPingAudioConfig('classic');
  assert.equal(classicCfg.profile, 'classic');
  assert.equal(classicCfg.tones[0].freq, 880.00); // A5

  // 2. Web Audio Event Scheduling
  const schedule = calculateScanPingSchedule(1.5, subtleCfg);
  assert.equal(schedule.length, 2);
  // Tone 0
  assert.equal(schedule[0].startTime, 1.5);
  assert.equal(schedule[0].peakTime, 1.503); // 3ms clickless attack
  assert.equal(schedule[0].stopTime, 1.68); // 1.5 + 0.18s
  assert.equal(schedule[0].peakGain, Math.round(0.18 * 0.22 * 10000) / 10000);
  // Tone 1 (Delayed shimmer)
  assert.equal(schedule[1].startTime, 1.512); // 1.5 + 0.012s
  assert.equal(schedule[1].peakTime, 1.515);
  assert.equal(schedule[1].stopTime, 1.632); // 1.512 + 0.12s
  assert.equal(schedule[1].type, 'sine');

  // 3. Payload Optical Validation
  const validUrlRes = validateQrScanAudioTrigger('https://voltbox.dev/catalog?product=19');
  assert.equal(validUrlRes.shouldTrigger, true);
  assert.equal(validUrlRes.productId, 19);

  const validPathRes = validateQrScanAudioTrigger('https://voltbox.dev/product/20');
  assert.equal(validPathRes.shouldTrigger, true);
  assert.equal(validPathRes.productId, 20);

  const validSkuRes = validateQrScanAudioTrigger('VB-GPU-019');
  assert.equal(validSkuRes.shouldTrigger, true);
  assert.equal(validSkuRes.productId, 19);

  const validPrefixRes = validateQrScanAudioTrigger('VOLTBOX:21');
  assert.equal(validPrefixRes.shouldTrigger, true);
  assert.equal(validPrefixRes.productId, 21);

  const validNumRes = validateQrScanAudioTrigger('22');
  assert.equal(validNumRes.shouldTrigger, true);
  assert.equal(validNumRes.productId, 22);

  const validObjRes = validateQrScanAudioTrigger({ productId: 19, title: 'RTX 5090' });
  assert.equal(validObjRes.shouldTrigger, true);
  assert.equal(validObjRes.productId, 19);

  // Invalid / noise payloads should not trigger ping
  assert.equal(validateQrScanAudioTrigger(null).shouldTrigger, false);
  assert.equal(validateQrScanAudioTrigger('').shouldTrigger, false);
  assert.equal(validateQrScanAudioTrigger('   ').shouldTrigger, false);
  assert.equal(validateQrScanAudioTrigger('x').shouldTrigger, false);
  assert.equal(validateQrScanAudioTrigger('random-gibberish-string').shouldTrigger, false);

  // 4. UI Toggle State & Accessibility
  const onState = formatAudioPingToggleState(true);
  assert.equal(onState.enabled, true);
  assert.equal(onState.label, 'Audio Ping: ON');
  assert.equal(onState.icon, 'volume-2');
  assert.equal(onState.ariaChecked, true);

  const mutedState = formatAudioPingToggleState(false);
  assert.equal(mutedState.enabled, false);
  assert.equal(mutedState.label, 'Audio Ping: MUTED');
  assert.equal(mutedState.icon, 'volume-x');
  assert.equal(mutedState.ariaChecked, false);

  // 5. PCM Waveform Synthesis & Audio Safety
  const pcm = synthesizeScanPingPcmBuffer(44100, subtleCfg);
  assert.ok(pcm.length > 0);
  assert.equal(pcm.length, Math.floor(((220 + 50) / 1000) * 44100)); // ~11907 samples

  let peakAbs = 0;
  let nonZeroCount = 0;
  for (let i = 0; i < pcm.length; i++) {
    const abs = Math.abs(pcm[i]);
    if (abs > peakAbs) peakAbs = abs;
    if (abs > 0.0001) nonZeroCount++;
  }

  // Audio energy verification:
  // Must have clear non-zero acoustic samples
  assert.ok(nonZeroCount > 1000, 'Audio ping should contain acoustic energy');
  // Must be pleasant & safe (neither dead silence nor clipping > 0.5)
  assert.ok(peakAbs > 0.02, 'Audio ping must have noticeable peak volume');
  assert.ok(peakAbs < 0.25, 'Audio ping must remain subtle, non-piercing, and well below clipping');

  // Must decay gracefully to near-silence at tail
  const tailSample = Math.abs(pcm[pcm.length - 1]);
  assert.ok(tailSample < 0.0001, 'Audio ping must taper smoothly to zero at tail');
});

test('Subtle Wishlist Toast Notification: buildWishlistToastPayload generates non-modal confirmation payloads for add and remove', () => {
  const sampleGpu = { id: 19, title: 'Nvidia RTX 5090', price: 999.99, category: 'gpus' };

  const addedToast = buildWishlistToastPayload(sampleGpu, true, 3);
  assert.equal(addedToast.productId, 19);
  assert.equal(addedToast.productTitle, 'Nvidia RTX 5090');
  assert.equal(addedToast.added, true);
  assert.equal(addedToast.actionType, 'wishlist-added');
  assert.equal(addedToast.badgeLabel, 'Saved to Wishlist');
  assert.equal(addedToast.headline, 'Saved to Wishlist: Nvidia RTX 5090');
  assert.ok(addedToast.subline.includes('3 items in wishlist'));
  assert.ok(addedToast.subline.includes('$999.99'));
  assert.equal(addedToast.accentTone, 'rose');
  assert.equal(addedToast.undoActionLabel, 'Undo');

  const removedToast = buildWishlistToastPayload(sampleGpu, false, 1);
  assert.equal(removedToast.productId, 19);
  assert.equal(removedToast.added, false);
  assert.equal(removedToast.actionType, 'wishlist-removed');
  assert.equal(removedToast.badgeLabel, 'Removed from Wishlist');
  assert.equal(removedToast.headline, 'Removed from Wishlist: Nvidia RTX 5090');
  assert.ok(removedToast.subline.includes('1 item in wishlist'));
  assert.equal(removedToast.accentTone, 'slate');
  assert.equal(removedToast.undoActionLabel, 'Restore');
});

test('Checkout Print Summary & Advanced Settings: buildCheckoutPrintSummary and resolveAdvancedSettings', () => {
  const summary = buildCheckoutPrintSummary(
    [
      { id: 19, title: 'Nvidia RTX 5090', price: 1000, quantity: 1, category: 'gpus' },
      { id: 20, title: 'AMD Ryzen 9', price: 500, quantity: 2, category: 'cpus' },
    ],
    {
      recipientName: 'Harish Ragavendran',
      shippingAddress: '42 Circuit Lane, Silicon Bay',
      paymentMethodSummary: 'Google Pay (UPI)',
      promoCode: 'VOLT10',
      promoDiscount: 200,
      rigDiscount: 0,
      taxRate: 0.08,
      nowMs: 1762400000000,
    }
  );

  assert.equal(summary.items.length, 2);
  assert.equal(summary.totalQuantity, 3);
  assert.equal(summary.subtotal, 2000);
  assert.equal(summary.promoDiscount, 200);
  assert.equal(summary.tax, 144); // 8% of (2000 - 200)
  assert.equal(summary.totalUsd, 1944);
  assert.equal(summary.recipientName, 'Harish Ragavendran');
  assert.equal(summary.promoCode, 'VOLT10');
  assert.ok(summary.summaryId.startsWith('VB-SUM-'));

  const defaults = resolveAdvancedSettings(null);
  assert.deepEqual(defaults, DEFAULT_ADVANCED_SETTINGS);

  const custom = resolveAdvancedSettings({
    audioPingEnabled: false,
    audioPingProfile: 'crystal',
    toastDurationMs: 5500,
    gridDensity: 'compact',
    showDualCurrencyInr: true,
  });
  assert.equal(custom.audioPingEnabled, false);
  assert.equal(custom.audioPingProfile, 'crystal');
  assert.equal(custom.toastDurationMs, 5500);
  assert.equal(custom.gridDensity, 'compact');
  assert.equal(custom.showDualCurrencyInr, true);
});

test('Catalog Toolbar Compare All Visible: selectVisibleProductsForComparison and getCompareAllVisibleButtonState enforce 4-item limit and filter state', () => {
  assert.equal(MAX_COMPARISON_ITEMS, 4);

  // 1. Empty visible list disables button and leaves existing comparison untouched
  const emptyBtn = getCompareAllVisibleButtonState([], [19]);
  assert.equal(emptyBtn.disabled, true);
  assert.equal(emptyBtn.visibleCount, 0);
  assert.equal(emptyBtn.eligibleCount, 0);
  assert.equal(emptyBtn.badgeText, '0');

  const emptyRes = selectVisibleProductsForComparison([], [19]);
  assert.deepEqual(emptyRes.nextCompareIds, [19]);
  assert.deepEqual(emptyRes.addedIds, []);
  assert.equal(emptyRes.visibleCount, 0);

  // 2. Filtered category with 2 visible products (e.g. GPUs) adds both
  const twoVisible = [{ id: 19, title: 'Nvidia RTX 5090' }, { id: 42, title: 'AMD Radeon RX 7900 XTX' }];
  const btnTwo = getCompareAllVisibleButtonState(twoVisible, []);
  assert.equal(btnTwo.disabled, false);
  assert.equal(btnTwo.visibleCount, 2);
  assert.equal(btnTwo.eligibleCount, 2);
  assert.equal(btnTwo.badgeText, '2');
  assert.equal(btnTwo.isAllCompared, false);
  assert.equal(btnTwo.labelText, 'Compare All Visible');

  const resTwo = selectVisibleProductsForComparison(twoVisible, []);
  assert.deepEqual(resTwo.nextCompareIds, [19, 42]);
  assert.deepEqual(resTwo.addedIds, [19, 42]);
  assert.equal(resTwo.cappedAtLimit, false);
  assert.equal(resTwo.allVisibleAlreadyCompared, false);

  // 3. Large visible catalog (e.g. 6 items) caps at 4 items
  const sixVisible = [19, 20, 21, 22, 23, 24];
  const btnSix = getCompareAllVisibleButtonState(sixVisible, []);
  assert.equal(btnSix.visibleCount, 6);
  assert.equal(btnSix.eligibleCount, 4);
  assert.equal(btnSix.badgeText, '4/4');

  const resSix = selectVisibleProductsForComparison(sixVisible, []);
  assert.deepEqual(resSix.nextCompareIds, [19, 20, 21, 22]);
  assert.deepEqual(resSix.addedIds, [19, 20, 21, 22]);
  assert.equal(resSix.cappedAtLimit, true);
  assert.equal(resSix.eligibleCount, 4);

  // 4. Additive behavior when 1 item is already selected
  const resAdditive = selectVisibleProductsForComparison([20, 21, 22, 23, 24], [19]);
  assert.deepEqual(resAdditive.nextCompareIds, [19, 20, 21, 22]);
  assert.deepEqual(resAdditive.addedIds, [20, 21, 22]);
  assert.equal(resAdditive.replacedPreviousFullSelection, false);

  // 5. All visible items (up to 4) already selected -> marks allVisibleAlreadyCompared = true
  const btnAlready = getCompareAllVisibleButtonState([19, 20, 21, 22, 23], [19, 20, 21, 22]);
  assert.equal(btnAlready.isAllCompared, true);
  assert.equal(btnAlready.labelText, 'Comparing Visible');

  const resAlready = selectVisibleProductsForComparison([19, 20, 21, 22, 23], [19, 20, 21, 22]);
  assert.equal(resAlready.allVisibleAlreadyCompared, true);
  assert.deepEqual(resAlready.addedIds, []);
  assert.deepEqual(resAlready.nextCompareIds, [19, 20, 21, 22]);

  // 6. Switching to a new filtered category when 4 other items were previously selected replaces with new visible items
  const resReplace = selectVisibleProductsForComparison([31, 32, 33, 34, 35], [19, 20, 21, 22]);
  assert.equal(resReplace.replacedPreviousFullSelection, true);
  assert.deepEqual(resReplace.nextCompareIds, [31, 32, 33, 34]);
  assert.deepEqual(resReplace.addedIds, [31, 32, 33, 34]);
});



