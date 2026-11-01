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
  generatePriceHistory,
  getProductSpecs,
  computeRigBundleStatus,
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
