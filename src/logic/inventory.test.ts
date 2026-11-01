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

test('getStockBadgeLabel returns "Low Stock" only when quantity < 5', () => {
  assert.equal(getStockBadgeLabel({ quantity: 4 }), 'Low Stock');
  assert.equal(getStockBadgeLabel({ quantity: 1 }), 'Low Stock');
  assert.equal(getStockBadgeLabel({ quantity: 5 }), null);
  assert.equal(getStockBadgeLabel({ quantity: 10 }), null);
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

  const ipad = classifyDeviceViewport(820, 1180);
  assert.equal(ipad.deviceTier, 'ipad-tablet');
  assert.equal(ipad.showBottomAppDock, true);
  assert.equal(ipad.columnsSuggested, 3);

  const desktop = classifyDeviceViewport(1440, 900);
  assert.equal(desktop.deviceTier, 'desktop');
  assert.equal(desktop.showBottomAppDock, false);
  assert.equal(desktop.columnsSuggested, 4);
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


