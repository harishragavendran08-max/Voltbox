import express, { Request, Response, NextFunction } from 'express';
import http from 'node:http';
import path from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { Store, Order, User } from './src/store';
import {
  DEFAULT_TAX_RATE,
  InventoryTransactionEntity,
  buildCartEntity,
  buildInventoryItem,
  buildInventorySummary,
  classifyComponentGroup,
  computeCartTotals,
  generatePriceHistory,
  getProductQuantity,
  getProductSku,
  getProductSpecs,
  isLowStock,
  makeOrderId,
  roundMoney,
  sanitizeChatMessage,
  toProductJpaEntity,
  computeSystemHealthMetrics,
  evaluateAccountPermissions,
  resolveSocialLoginIdentity,
  buildWishlistSummary,
  toggleWishlistItem,
  generateProductSharePayload,
  generateProductQrSvgAsync,
  generateProductQrDataUrl,
  resolveProductImageUrl,
  formatPaymentMethodSummary,
  buildProductComparison,
  IpRateLimiter,
  PriceAlertEmailNotification,
  validatePriceAlertInput,
  upsertPriceAlertSubscription,
  removePriceAlertSubscription,
  buildPriceAlertEmailPayload,
  evaluatePriceDropAlerts,
  computeSuggestedPriceThresholds,
  isPriceAlertExpired,
  resolveUiTemplateTheme,
  computeSystemPowerEstimate,
  formatInstagramHandle,
  recommendStarterRigBundle,
  advanceOrderTrackingStage,
  resolveOrderTrackingTimeline,
  enrichOrderForHistory,
  computeOrderHistorySummary,
  filterAndSortOrderHistory,
  verifyComponentPurchaseForReview,
  validateProductReviewSubmission,
  computeProductReviewSummary,
  filterAndSortProductReviews,
  planBatchProductTransaction,
  buildProductContextMenuItems,
  formatProductCopyPayload,
  validateProductSku,
  validateProductStockLevel,
  validateProductStockAdjustment,
  validateProductModificationPayload,
  computeSearchQueryAnalytics,
  normalizeSearchQueryForLog,
} from './src/logic/inventory';

const PORT = 3000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '8853303342-j5l5dnn3okihtcifetfo1d0prg56ugu9.apps.googleusercontent.com';
const DONATE_URL = process.env.VOLTBOX_DONATE_URL || 'https://share.google/5TT6WxXqXBWnaoSIP';
const UPI_ID = process.env.VOLTBOX_UPI_ID || 'harishragavendran08@okaxis';
const DONATE_QR = process.env.VOLTBOX_DONATE_QR || 'donate-qr.jpeg';
const DONATE_IMAGES_RAW = process.env.VOLTBOX_DONATE_IMAGES || '';
const MAIL_READY = Boolean(process.env.VOLTBOX_MAIL_USERNAME && process.env.VOLTBOX_MAIL_PASSWORD);

const store = new Store();
const inventoryTransactions: InventoryTransactionEntity[] = [];
const ipRateLimiter = new IpRateLimiter({
  generalCapacity: 120,
  sensitiveCapacity: 30,
  refillWindowMs: 60_000,
});
const app = express();
const server = http.createServer(app);

function recordInventoryTransaction(
  product: { id: number; title?: string; category?: string },
  type: InventoryTransactionEntity['type'],
  delta: number,
  previousStock: number,
  newStock: number,
  actorName: string,
  reason: string
) {
  const now = Date.now();
  const txId = 'INV-' + (now % 65536).toString(16).toUpperCase().padStart(4, '0');
  inventoryTransactions.unshift({
    id: txId,
    productId: product.id,
    sku: getProductSku(product),
    productTitle: product.title || 'Component',
    type,
    delta,
    previousStock,
    newStock,
    actorName,
    reason,
    timestamp: now,
  });
  if (inventoryTransactions.length > 50) {
    inventoryTransactions.length = 50;
  }
}

app.use(express.json());

// Permissive headers allowing embedding in AI Studio iFrame preview
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; img-src 'self' data: blob: https:; connect-src 'self' ws: wss: https:; frame-ancestors *;");
  next();
});

// Bucket4j IP-Based Rate Limiter Middleware for /api/*
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  const fullPath = req.originalUrl || req.url || '';
  const forwardedFor = req.header('X-Forwarded-For') || req.header('X-Real-IP') || req.socket.remoteAddress || '127.0.0.1';
  const isSensitive = ipRateLimiter.isSensitiveEndpoint(fullPath, req.method);
  const probe = ipRateLimiter.tryConsume(forwardedFor, isSensitive);

  res.setHeader('X-RateLimit-Limit', String(probe.limitCapacity));
  res.setHeader('X-RateLimit-Remaining', String(probe.remainingTokens));

  if (!probe.consumed) {
    res.setHeader('Retry-After', String(probe.retryAfterSeconds));
    res.setHeader('X-RateLimit-Retry-After-Seconds', String(probe.retryAfterSeconds));
    res.status(429).json({
      status: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded for IP ${probe.clientIp}. Please wait before retrying.`,
      retryAfterSeconds: probe.retryAfterSeconds,
      limit: probe.limitCapacity,
    });
    return;
  }

  next();
});

// WebSocket setup on /ws/community
interface AuthenticatedSocket extends WebSocket {
  userEmail?: string;
  userRole?: string;
}

const wss = new WebSocketServer({ server, path: '/ws/community' });
const wsClients = new Set<AuthenticatedSocket>();

wss.on('connection', (ws: AuthenticatedSocket, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const token = url.searchParams.get('token');
  const user = store.findByToken(token);
  if (!user) {
    ws.close(1008, 'Not signed in');
    return;
  }
  ws.userEmail = user.email;
  ws.userRole = user.role;
  wsClients.add(ws);
  broadcastToAll({ type: 'presence-update', onlineCount: Math.max(1, wsClients.size) });

  ws.on('close', () => {
    wsClients.delete(ws);
    broadcastToAll({ type: 'presence-update', onlineCount: Math.max(1, wsClients.size) });
  });
  ws.on('error', () => {
    wsClients.delete(ws);
  });
});

function broadcastToAll(payload: unknown): void {
  const text = JSON.stringify(payload);
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(text);
    }
  }
}

function broadcastToModerators(payload: unknown): void {
  const text = JSON.stringify(payload);
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN && client.userRole === 'moderator') {
      client.send(text);
    }
  }
}

function broadcastToUser(email: string, payload: unknown): void {
  const text = JSON.stringify(payload);
  const target = email.toLowerCase();
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN && client.userEmail?.toLowerCase() === target) {
      client.send(text);
    }
  }
}

// Helper functions
function bearerToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring('Bearer '.length).trim();
}

function userFromReq(req: Request): User | null {
  return store.findByToken(bearerToken(req.header('Authorization')));
}

function isModerator(u: User): boolean {
  return u.role === 'moderator';
}

function canContribute(u: User): boolean {
  return u.role === 'contributor' || u.role === 'moderator';
}

function notSignedIn(res: Response) {
  return res.status(401).json({ ok: false, message: "You're not signed in." });
}

function badRequest(res: Response, message: string) {
  return res.status(400).json({ ok: false, message });
}

function forbidden(res: Response, message: string) {
  return res.status(403).json({ ok: false, message });
}

function notFound(res: Response, message: string) {
  return res.status(404).json({ ok: false, message });
}

function signedInResponse(user: User, authProvider = 'password') {
  const permissions = evaluateAccountPermissions(user.role);
  return {
    ok: true,
    token: store.startSession(user),
    name: user.name,
    email: user.email,
    role: user.role,
    isAdmin: permissions.isAdmin,
    canAccessAdminDashboard: permissions.canAccessAdminDashboard,
    authProvider,
    permissions,
  };
}

function splitDonateImages(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
}

// ── API Gateway & Resilience Actuator Controllers ──
app.get(['/actuator/health', '/api/health'], (_req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    database: 'Voltbox Bench JPA Store',
    catalogSize: store.getProducts().length,
  });
});

// ── Google Maps Platform Configuration Endpoint ──
app.get('/api/maps/config', (_req, res) => {
  const apiKey =
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    '';
  res.json({
    ok: true,
    apiKey,
    hasApiKey: Boolean(apiKey),
    mapId: 'DEMO_MAP_ID',
    attributionId: 'gmp_mcp_codeassist_v1_aistudio',
  });
});

// ── Product Controller (mirrors com.voltbox.controller.ProductController & JPA ProductEntity) ──
function enrichProduct(p: ReturnType<typeof store.getProducts>[number]) {
  const productReviews = store.getReviews(p.id);
  const reviewSummary = computeProductReviewSummary(productReviews, p.id, p.ratingRate);
  return {
    ...p,
    ...toProductJpaEntity(p),
    verifiedReviewCount: productReviews.length,
    reviewSummary,
  };
}

// Side-by-Side Product Comparison API endpoint
app.get('/api/products/compare', (req, res) => {
  const idsStr = typeof req.query.ids === 'string' ? req.query.ids : '';
  const idList = idsStr.split(',').map((s) => Number.parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n) && n > 0);
  const catalog = store.getProducts().filter((p) => !p.takenDown);
  const selected = catalog.filter((p) => idList.includes(p.id));
  const comparison = buildProductComparison(selected, catalog);
  res.json(comparison);
});

app.get('/api/products', (req, res) => {
  const categoryFilter = typeof req.query.category === 'string' ? req.query.category.trim().toLowerCase() : '';
  const groupFilter = typeof req.query.group === 'string' ? req.query.group.trim().toLowerCase() : '';
  const searchFilter = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const stockStatusFilter = typeof req.query.stockStatus === 'string' ? req.query.stockStatus.trim().toLowerCase() : '';
  const lowStockOnly = req.query.lowStock === 'true';

  const shelf = store
    .getProducts()
    .filter((p) => !p.takenDown)
    .map(enrichProduct)
    .filter((pe) => !categoryFilter || categoryFilter === 'all' || pe.category.toLowerCase() === categoryFilter)
    .filter((pe) => !groupFilter || groupFilter === 'all' || pe.componentGroup.toLowerCase() === groupFilter)
    .filter((pe) => !lowStockOnly || pe.lowStock)
    .filter((pe) => {
      if (!stockStatusFilter || stockStatusFilter === 'all') return true;
      if (stockStatusFilter === 'available-now') return pe.stockStatus === 'available-now';
      if (stockStatusFilter === 'backorder') return pe.stockStatus === 'backorder';
      return true;
    })
    .filter((pe) => {
      if (!searchFilter) return true;
      const hay = `${pe.name} ${pe.title} ${pe.description || ''} ${pe.category} ${pe.componentGroup} ${pe.sku}`.toLowerCase();
      return hay.includes(searchFilter);
    });

  // Server-side search query logging in ProductController when ?search= is provided
  if (searchFilter && searchFilter.length >= 2) {
    const user = userFromReq(req);
    const actor = user ? user.name : 'guest';
    const logged = store.addSearchLog({
      rawQuery: typeof req.query.search === 'string' ? req.query.search.trim() : searchFilter,
      categoryFilter: categoryFilter || groupFilter || 'all',
      resultCount: shelf.length,
      source: 'api-products-query',
      actorName: actor,
    });
    if (logged) {
      console.info(
        `[Voltbox SearchLog] source=api-products-query actor="${logged.actorName}" query="${logged.rawQuery}" normalized="${logged.normalizedQuery}" category="${logged.categoryFilter}" inferredGroup="${logged.inferredComponentGroup}" results=${logged.resultCount} catalogGap=${logged.zeroResultGap}`
      );
    }
  }

  res.json(shelf);
});

app.post('/api/products/search-log', (req, res) => {
  const user = userFromReq(req);
  const rawQuery = String(req.body?.query ?? req.body?.rawQuery ?? '').trim();
  const category = String(req.body?.category ?? req.body?.categoryFilter ?? 'all').trim().toLowerCase();
  const source = String(req.body?.source ?? 'catalog-search').trim().toLowerCase();
  const actor =
    user
      ? user.name
      : typeof req.body?.actorName === 'string' && req.body.actorName.trim()
      ? req.body.actorName.trim()
      : 'guest';

  let resultCount = -1;
  if (req.body?.resultCount !== undefined && req.body?.resultCount !== null) {
    const parsed = Number.parseInt(String(req.body.resultCount), 10);
    if (!Number.isNaN(parsed)) {
      resultCount = Math.max(0, parsed);
    }
  }

  if (resultCount < 0 && rawQuery) {
    const qLower = normalizeSearchQueryForLog(rawQuery);
    resultCount = store
      .getProducts()
      .filter((p) => !p.takenDown)
      .map(enrichProduct)
      .filter((pe) => !category || category === 'all' || category === 'low-stock' || category === 'wishlist' || pe.category.toLowerCase() === category || pe.componentGroup.toLowerCase() === category)
      .filter((pe) => {
        const hay = `${pe.name} ${pe.title} ${pe.description || ''} ${pe.category} ${pe.componentGroup} ${pe.sku}`.toLowerCase();
        return hay.includes(qLower);
      }).length;
  }

  const logged = store.addSearchLog({
    rawQuery,
    categoryFilter: category || 'all',
    resultCount: Math.max(0, resultCount),
    source,
    actorName: actor,
  });

  if (!logged) {
    return res.json({
      ok: false,
      logged: false,
      message: 'Query too short to log (minimum 2 characters).',
    });
  }

  console.info(
    `[Voltbox SearchLog] source=${logged.source} actor="${logged.actorName}" query="${logged.rawQuery}" normalized="${logged.normalizedQuery}" category="${logged.categoryFilter}" inferredGroup="${logged.inferredComponentGroup}" results=${logged.resultCount} catalogGap=${logged.zeroResultGap}`
  );

  return res.json({
    ok: true,
    logged: true,
    entry: logged,
  });
});

app.get('/api/products/low-stock', (_req, res) => {
  const lowStockList = store
    .getProducts()
    .filter((p) => !p.takenDown)
    .map(enrichProduct)
    .filter((pe) => pe.lowStock)
    .sort((a, b) => a.stockQuantity - b.stockQuantity);
  return res.json(lowStockList);
});

app.get('/api/products/sku/:sku', (req, res) => {
  const sku = String(req.params.sku || '').trim().toUpperCase();
  if (!sku) return notFound(res, 'Product SKU not found.');
  const match = store
    .getProducts()
    .filter((p) => !p.takenDown)
    .map(enrichProduct)
    .find((pe) => pe.sku.toUpperCase() === sku);
  if (!match) return notFound(res, 'Product SKU not found.');
  return res.json(match);
});

app.get('/api/products/:id/inventory', (req, res) => {
  const id = Number.parseInt(String(req.params.id || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p || p.takenDown) return notFound(res, 'Product inventory not found.');

  let reserved = 0;
  for (const u of store.getUsers()) {
    const q = Number((u.cart || {})[String(p.id)]) || 0;
    if (q > 0) reserved += q;
  }
  return res.json({
    ok: true,
    product: enrichProduct(p),
    inventory: buildInventoryItem(p, reserved),
  });
});

app.post(['/api/products/validate', '/api/admin/products/validate'], (req, res) => {
  const rawPid = req.body?.productId ?? req.body?.id;
  const parsedPid = rawPid !== undefined && rawPid !== null && String(rawPid).trim() !== ''
    ? Number.parseInt(String(rawPid), 10)
    : null;
  const currentProductId = parsedPid !== null && !Number.isNaN(parsedPid) ? parsedPid : null;
  const isCreate = req.body?.isCreate !== undefined ? Boolean(req.body.isCreate) : currentProductId === null;

  const result = validateProductModificationPayload(req.body || {}, {
    isCreate,
    currentProductId,
    existingProducts: store.getProducts(),
  });
  return res.status(result.ok ? 200 : 400).json(result);
});

app.post('/api/products/:id/inventory', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const id = Number.parseInt(String(req.params.id || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p || p.takenDown) return notFound(res, 'Product not found.');

  const prevQty = getProductQuantity(p);
  const hasTarget =
    req.body &&
    (req.body.stockQuantity !== undefined ||
      req.body.quantity !== undefined ||
      req.body.stock !== undefined);
  const rawTarget = hasTarget
    ? (req.body.stockQuantity ?? req.body.quantity ?? req.body.stock)
    : undefined;
  const hasDelta = req.body && (req.body.delta !== undefined || req.body.amount !== undefined);
  const rawDelta = hasDelta
    ? (req.body.delta ?? req.body.amount)
    : (hasTarget ? undefined : 3);

  const validation = validateProductStockAdjustment(prevQty, {
    targetStock: rawTarget,
    delta: rawDelta,
    isRestockOnly: false,
  });
  if (!validation.ok || validation.normalizedStock === null || validation.normalizedStock === undefined) {
    return res.status(400).json(validation);
  }

  const nextQty = validation.normalizedStock;
  p.quantity = nextQty;
  p.stock = nextQty;
  p.lowStock = isLowStock({ quantity: nextQty });
  store.save();

  const reason =
    typeof req.body?.reason === 'string' && req.body.reason.trim()
      ? req.body.reason.trim()
      : 'Inventory update via ProductController';
  recordInventoryTransaction(
    p,
    nextQty >= prevQty ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
    nextQty - prevQty,
    prevQty,
    nextQty,
    user.name,
    reason
  );

  const enriched = enrichProduct(p);
  const inventory = buildInventoryItem(p, 0);
  broadcastToAll({
    type: 'product-restocked',
    product: enriched,
    added: nextQty - prevQty,
    actor: user.name,
  });
  return res.json({ ok: true, product: enriched, inventory });
});

app.get('/api/products/:id/quick-actions', (req, res) => {
  const id = Number.parseInt(String(req.params.id || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p || p.takenDown) return notFound(res, 'Product not found.');

  const enriched = enrichProduct(p);
  const cartQty = Math.max(0, Number.parseInt(String(req.query.cartQty || '0'), 10) || 0);
  const wishlisted = String(req.query.wishlisted || 'false') === 'true';
  const compared = String(req.query.compared || 'false') === 'true';
  const hasAlert = String(req.query.hasAlert || 'false') === 'true';

  const group = enriched.componentGroup || classifyComponentGroup(p);
  const rigEligible = ['gpus', 'cpus', 'motherboards', 'storage'].includes(group);
  const avgPrice = enriched.specs?.avgPrice || enriched.price;
  const dropVsAvgPct = avgPrice > 0 ? roundMoney(((avgPrice - enriched.price) / avgPrice) * 100) : 0;

  const actions = buildProductContextMenuItems({
    productId: enriched.id,
    title: enriched.title,
    sku: enriched.sku,
    price: enriched.price,
    effectiveStock: enriched.stockQuantity,
    cartQty,
    isWishlisted: wishlisted,
    isCompared: compared,
    hasPriceAlert: hasAlert,
  });

  return res.json({
    ok: true,
    productId: enriched.id,
    sku: enriched.sku,
    title: enriched.title,
    price: enriched.price,
    stockQuantity: enriched.stockQuantity,
    lowStock: enriched.lowStock,
    inStock: enriched.stockQuantity > 0,
    rigBundleEligible: rigEligible,
    sixMonthAvgPrice: avgPrice,
    dropVsSixMonthAvgPct: dropVsAvgPct,
    copyNameText: formatProductCopyPayload(enriched, 'name'),
    copySkuPriceText: formatProductCopyPayload(enriched, 'sku-price'),
    actions,
  });
});

app.get('/api/products/:id', (req, res) => {
  const id = Number.parseInt(String(req.params.id || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p || p.takenDown) return notFound(res, 'Product not found.');
  return res.json(enrichProduct(p));
});

// ── Verified Buyer Review & Rating Controller ──
app.get('/api/products/:id/reviews', (req, res) => {
  const id = Number.parseInt(String(req.params.id || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p || p.takenDown) return notFound(res, 'Product not found.');

  const user = userFromReq(req);
  const allReviews = store.getReviews(p.id);
  const starFilter = typeof req.query.star === 'string' ? req.query.star : 'all';
  const sortBy = typeof req.query.sort === 'string' ? req.query.sort : 'newest';
  const searchQuery = typeof req.query.search === 'string' ? req.query.search : '';

  const filteredReviews = filterAndSortProductReviews(allReviews, {
    starFilter,
    sortBy,
    searchQuery,
  });

  const summary = computeProductReviewSummary(allReviews, p.id, p.ratingRate);
  const eligibility = verifyComponentPurchaseForReview(
    p.id,
    user?.orders || [],
    allReviews,
    user?.email || null
  );

  return res.json({
    ok: true,
    productId: p.id,
    sku: getProductSku(p),
    productTitle: p.title,
    reviews: filteredReviews,
    allReviews,
    summary,
    eligibility,
  });
});

app.post('/api/products/:id/reviews', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const id = Number.parseInt(String(req.params.id || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p || p.takenDown) return notFound(res, 'Product not found.');

  const existingReviews = store.getReviews(p.id);
  const eligibility = verifyComponentPurchaseForReview(
    p.id,
    user.orders || [],
    existingReviews,
    user.email
  );

  const validation = validateProductReviewSubmission(
    {
      productId: p.id,
      rating: req.body?.rating,
      title: req.body?.title,
      comment: req.body?.comment,
      useCaseTag: req.body?.useCaseTag,
      orderId: req.body?.orderId,
    },
    eligibility
  );

  if (!validation.ok || !validation.normalized) {
    const status = validation.code === 'NOT_PURCHASED' ? 403 : 400;
    return res.status(status).json({
      ok: false,
      code: validation.code || 'VALIDATION_ERROR',
      message: validation.message || 'Invalid review submission.',
      eligibility,
    });
  }

  const matchedOrder = eligibility.matchingOrders.find(
    (o) => o.orderId === validation.normalized?.orderId
  ) || eligibility.matchingOrders[0];

  const upserted = store.upsertReview({
    productId: p.id,
    authorName: user.name,
    authorEmail: user.email,
    authorColor: user.avatarColor || '#ffd23f',
    authorInitial: store.getUserInitial(user),
    rating: validation.normalized.rating,
    title: validation.normalized.title,
    comment: validation.normalized.comment,
    useCaseTag: validation.normalized.useCaseTag,
    orderId: validation.normalized.orderId,
    purchasedAt: matchedOrder?.placedAt || eligibility.latestPurchasedAt || Date.now(),
  });

  const updatedReviews = store.getReviews(p.id);
  const summary = computeProductReviewSummary(updatedReviews, p.id, p.ratingRate);
  const updatedEligibility = verifyComponentPurchaseForReview(
    p.id,
    user.orders || [],
    updatedReviews,
    user.email
  );
  const enriched = enrichProduct(p);

  broadcastToAll({
    type: 'product-review-submitted',
    productId: p.id,
    review: upserted.review,
    summary,
    product: enriched,
    isUpdate: upserted.isUpdate,
    timestamp: Date.now(),
  });
  broadcastToAll({
    type: 'activity-feed',
    message: `${user.name} rated ${p.title} ${upserted.review.rating}★ ("${upserted.review.title}")`,
    timestamp: Date.now(),
  });

  return res.json({
    ok: true,
    isUpdate: upserted.isUpdate,
    review: upserted.review,
    reviews: updatedReviews,
    summary,
    eligibility: updatedEligibility,
    product: enriched,
    message: upserted.isUpdate
      ? `Updated your verified ${upserted.review.rating}★ review for ${p.title}.`
      : `Published your verified ${upserted.review.rating}★ review for ${p.title}!`,
  });
});

app.post('/api/products/:id/reviews/:reviewId/helpful', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const id = Number.parseInt(String(req.params.id || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p || p.takenDown) return notFound(res, 'Product not found.');

  const reviewId = String(req.params.reviewId || '').trim();
  const toggled = store.toggleReviewHelpful(reviewId, user.email);
  if (!toggled.review) {
    return notFound(res, 'Review not found.');
  }

  const allReviews = store.getReviews(p.id);
  const summary = computeProductReviewSummary(allReviews, p.id, p.ratingRate);

  return res.json({
    ok: true,
    voted: toggled.voted,
    review: toggled.review,
    reviews: allReviews,
    summary,
  });
});

app.get('/api/products/:id/qr', async (req, res) => {
  const id = Number.parseInt(String(req.params.id || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p || p.takenDown) return notFound(res, 'Product not found.');

  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const origin = `${protocol}://${host}`;
  const sharePayload = generateProductSharePayload(origin, p);
  const theme = typeof req.query.theme === 'string' ? req.query.theme : 'gold';
  const colorDark = typeof req.query.colorDark === 'string' ? req.query.colorDark : undefined;
  const colorLight = typeof req.query.colorLight === 'string' ? req.query.colorLight : undefined;

  try {
    const qrSvg = await generateProductQrSvgAsync(sharePayload.url, { theme, colorDark, colorLight });
    const qrDataUrl = await generateProductQrDataUrl(sharePayload.url, { theme, colorDark, colorLight });
    return res.json({
      ok: true,
      productId: p.id,
      theme,
      share: sharePayload,
      qrSvg,
      qrDataUrl,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Failed to generate QR code' });
  }
});

app.get('/product/:id', (req, res) => {
  const id = Number.parseInt(String(req.params.id || ''), 10);
  return res.redirect(`/?product=${id}`);
});


app.put('/api/products/:id', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const id = Number.parseInt(String(req.params.id || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p || p.takenDown) return notFound(res, 'Product not found.');

  const mine = Boolean(p.addedByEmail && p.addedByEmail.toLowerCase() === user.email.toLowerCase());
  if (!isModerator(user) && !mine) {
    return forbidden(res, 'You can only update your own listings.');
  }

  const validation = validateProductModificationPayload(req.body || {}, {
    isCreate: false,
    currentProductId: p.id,
    existingProducts: store.getProducts(),
  });
  if (!validation.ok) {
    return res.status(400).json(validation);
  }

  if (validation.normalizedSku) {
    p.sku = validation.normalizedSku;
  }
  const nextTitle = typeof (req.body?.name ?? req.body?.title) === 'string'
    ? String(req.body.name ?? req.body.title).trim()
    : '';
  if (nextTitle) p.title = nextTitle;
  if (typeof req.body?.category === 'string' && req.body.category.trim()) {
    p.category = req.body.category.trim();
  }
  if (typeof req.body?.description === 'string') {
    p.description = req.body.description.trim();
  }
  if (typeof req.body?.image === 'string' && req.body.image.trim()) {
    p.image = req.body.image.trim();
  }
  const prevPrice = p.price;
  if (validation.normalizedPrice !== null && validation.normalizedPrice !== undefined && validation.normalizedPrice > 0) {
    p.price = validation.normalizedPrice;
  }
  if (validation.normalizedStock !== null && validation.normalizedStock !== undefined) {
    const nextQty = validation.normalizedStock;
    p.quantity = nextQty;
    p.stock = nextQty;
    p.lowStock = isLowStock({ quantity: nextQty });
  }

  const triggeredEmails: PriceAlertEmailNotification[] = [];
  if (p.price < prevPrice) {
    for (const u of store.getUsers()) {
      if (!Array.isArray(u.priceAlerts) || u.priceAlerts.length === 0) continue;
      const evalRes = evaluatePriceDropAlerts(u.priceAlerts, p.id, p.price);
      u.priceAlerts = evalRes.updatedAlerts;
      for (const notif of evalRes.triggeredNotifications) {
        triggeredEmails.push(notif);
        broadcastToUser(u.email, {
          type: 'price-drop-alert',
          notification: notif,
          product: enrichProduct(p),
        });
      }
    }
  }
  store.save();

  const enriched = enrichProduct(p);
  broadcastToAll({
    type: 'product-restocked',
    product: enriched,
    actor: user.name,
    priceDropped: p.price < prevPrice,
    triggeredAlertCount: triggeredEmails.length,
  });
  return res.json({ ...enriched, triggeredAlerts: triggeredEmails });
});

app.patch('/api/products/:id/stock', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const id = Number.parseInt(String(req.params.id || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p || p.takenDown) return notFound(res, 'Product not found.');

  const rawQty = req.body?.stockQuantity ?? req.body?.quantity ?? req.body?.stock;
  const validation = validateProductStockLevel(rawQty, { required: true });
  if (!validation.ok || validation.normalizedStock === null || validation.normalizedStock === undefined) {
    return res.status(400).json(validation);
  }
  const prevQty = getProductQuantity(p);
  const nextQty = validation.normalizedStock;
  p.quantity = nextQty;
  p.stock = nextQty;
  p.lowStock = isLowStock({ quantity: nextQty });
  store.save();

  recordInventoryTransaction(p, 'MANUAL_ADJUSTMENT', nextQty - prevQty, prevQty, nextQty, user.name, 'Stock quantity updated');
  const enriched = enrichProduct(p);
  broadcastToAll({ type: 'product-restocked', product: enriched, actor: user.name });
  return res.json(enriched);
});

// ── Inventory Controller (mirrors com.voltbox.controller.InventoryController) ──
app.get('/api/inventory', (_req, res) => {
  const carts = store.getUsers().map((u) => u.cart || {});
  const summary = buildInventorySummary(store.getProducts(), carts, inventoryTransactions);
  return res.json(summary);
});

app.get('/api/inventory/low-stock', (_req, res) => {
  const carts = store.getUsers().map((u) => u.cart || {});
  const summary = buildInventorySummary(store.getProducts(), carts, inventoryTransactions);
  return res.json(summary.items.filter((i) => i.lowStock));
});

app.get('/api/inventory/:productId', (req, res) => {
  const id = Number.parseInt(String(req.params.productId || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p || p.takenDown) return notFound(res, 'Inventory record not found.');

  let reserved = 0;
  for (const u of store.getUsers()) {
    const q = Number((u.cart || {})[String(p.id)]) || 0;
    if (q > 0) reserved += q;
  }
  return res.json(buildInventoryItem(p, reserved));
});

app.post('/api/inventory/:productId/restock', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const id = Number.parseInt(String(req.params.productId || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p || p.takenDown) return notFound(res, 'Product not found.');

  const prevQty = getProductQuantity(p);
  const rawAmount = req.body?.amount !== undefined ? req.body.amount : 3;
  const validation = validateProductStockAdjustment(prevQty, {
    delta: rawAmount,
    isRestockOnly: true,
  });
  if (!validation.ok || validation.normalizedStock === null || validation.normalizedStock === undefined) {
    return res.status(400).json(validation);
  }
  const nextQty = validation.normalizedStock;
  const addQty = nextQty - prevQty;
  p.quantity = nextQty;
  p.stock = nextQty;
  p.lowStock = isLowStock({ quantity: nextQty });
  store.save();

  const reason = typeof req.body?.reason === 'string' && req.body.reason.trim() ? req.body.reason.trim() : 'Warehouse restock';
  recordInventoryTransaction(p, 'RESTOCK', addQty, prevQty, nextQty, user.name, reason);

  const enriched = enrichProduct(p);
  const inventory = buildInventoryItem(p, 0);
  broadcastToAll({
    type: 'product-restocked',
    product: enriched,
    added: addQty,
    actor: user.name,
  });
  broadcastToAll({
    type: 'activity-feed',
    message: `${user.name} restocked +${addQty} units of ${p.title}`,
    timestamp: Date.now(),
  });
  return res.json({ ok: true, product: enriched, inventory });
});

app.patch('/api/inventory/:productId', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const id = Number.parseInt(String(req.params.productId || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p || p.takenDown) return notFound(res, 'Product not found.');

  const prevQty = getProductQuantity(p);
  const hasTarget =
    req.body &&
    (req.body.stockQuantity !== undefined ||
      req.body.quantity !== undefined ||
      req.body.stock !== undefined);
  const rawTarget = hasTarget
    ? (req.body.stockQuantity ?? req.body.quantity ?? req.body.stock)
    : undefined;
  const rawDelta = req.body?.delta;

  const validation = validateProductStockAdjustment(prevQty, {
    targetStock: rawTarget,
    delta: rawDelta,
    isRestockOnly: false,
  });
  if (!validation.ok || validation.normalizedStock === null || validation.normalizedStock === undefined) {
    return res.status(400).json(validation);
  }

  const nextQty = validation.normalizedStock;
  p.quantity = nextQty;
  p.stock = nextQty;
  p.lowStock = isLowStock({ quantity: nextQty });
  store.save();

  const reason = typeof req.body?.reason === 'string' && req.body.reason.trim() ? req.body.reason.trim() : 'Manual stock adjustment';
  recordInventoryTransaction(p, 'MANUAL_ADJUSTMENT', nextQty - prevQty, prevQty, nextQty, user.name, reason);

  const enriched = enrichProduct(p);
  const inventory = buildInventoryItem(p, 0);
  broadcastToAll({
    type: 'product-restocked',
    product: enriched,
    added: nextQty - prevQty,
    actor: user.name,
  });
  return res.json({ ok: true, inventory, product: enriched });
});

// ── Auth Controller ──
app.post('/api/signup', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!name || !email || !password.trim()) {
    return badRequest(res, 'Name, email, and password are all required.');
  }
  if (!email.includes('@')) {
    return badRequest(res, "That doesn't look like an email address.");
  }
  if (password.length < 4) {
    return badRequest(res, 'Password needs to be at least 4 characters.');
  }
  if (store.findByEmail(email)) {
    return badRequest(res, 'An account with that email already exists.');
  }

  const user = store.add(name, email, password);
  return res.json(signedInResponse(user));
});

app.post('/api/login', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const loginType = typeof req.body?.loginType === 'string' ? req.body.loginType.trim().toLowerCase() : 'user';

  const user = store.findByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ ok: false, message: 'Wrong email or password.' });
  }

  const permissions = evaluateAccountPermissions(user.role);
  if (loginType === 'admin' && !permissions.isAdmin) {
    return res.status(403).json({
      ok: false,
      message: 'Access denied: This is a User (Shopper) account for browsing and buying. Switch to User Login or sign in with an Administrator account.',
    });
  }

  return res.json(signedInResponse(user, 'password'));
});

app.post(['/api/auth/google', '/api/google-login'], async (req, res) => {
  const credential = typeof req.body?.credential === 'string' ? req.body.credential.trim() : '';

  // If a direct Google OAuth account selection payload is provided (User Login flow)
  if (!credential || credential.startsWith('google-oauth-')) {
    const identity = resolveSocialLoginIdentity({
      provider: 'google',
      email: typeof req.body?.email === 'string' ? req.body.email : 'alex.chen@gmail.com',
      name: typeof req.body?.name === 'string' ? req.body.name : undefined,
    });
    let user = store.findByEmail(identity.email);
    if (!user) {
      user = store.add(identity.name, identity.email, '(signed in with Google)');
      user.role = 'member';
      store.save();
    }
    return res.json(signedInResponse(user, 'google'));
  }

  try {
    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!resp.ok) {
      return badRequest(res, "Couldn't verify that Google sign-in — try again.");
    }
    const payload = (await resp.json()) as Record<string, string>;
    if (GOOGLE_CLIENT_ID && payload.aud !== GOOGLE_CLIENT_ID) {
      return badRequest(res, "That Google sign-in wasn't meant for this app.");
    }
    const email = payload.email?.trim();
    const name = payload.name?.trim();
    if (!email) {
      return badRequest(res, "Google didn't give us an email to sign in with.");
    }
    let user = store.findByEmail(email);
    if (!user) {
      user = store.add(name || email, email, '(signed in with Google)');
      user.role = 'member';
      store.save();
    }
    return res.json(signedInResponse(user, 'google'));
  } catch {
    return badRequest(res, "Couldn't verify that Google sign-in — try again.");
  }
});

app.post(['/api/auth/apple', '/api/apple-login'], (req, res) => {
  const identity = resolveSocialLoginIdentity({
    provider: 'apple',
    email: typeof req.body?.email === 'string' ? req.body.email : 'maya.lin@icloud.com',
    name: typeof req.body?.name === 'string' ? req.body.name : undefined,
    hideMyEmail: Boolean(req.body?.hideMyEmail),
  });

  let user = store.findByEmail(identity.email);
  if (!user) {
    user = store.add(identity.name, identity.email, '(signed in with Apple ID)');
    user.role = 'member';
    store.save();
  }
  return res.json(signedInResponse(user, 'apple'));
});

app.post('/api/logout', (req, res) => {
  store.endSession(bearerToken(req.header('Authorization')));
  return res.json({ ok: true });
});

// ── Account Controller (mirrors com.voltbox.controller.AccountController) ──
app.get('/api/me', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const cartDetails = buildCartEntity(store.getProducts(), user.cart || {}, user.email, null);
  const permissions = evaluateAccountPermissions(user.role);
  const wishlistSummary = buildWishlistSummary(user.wishlist, store.getProducts());

  return res.json({
    name: user.name,
    email: user.email,
    initial: store.getUserInitial(user),
    color: user.avatarColor,
    role: user.role,
    isAdmin: permissions.isAdmin,
    canAccessAdminDashboard: permissions.canAccessAdminDashboard,
    permissions,
    billEmail: user.billEmail,
    cart: user.cart || {},
    cartDetails,
    wishlist: user.wishlist || [],
    wishlistSummary,
    priceAlerts: user.priceAlerts || [],
    orderCount: (user.orders || []).length,
    mailReady: MAIL_READY,
    donateUrl: DONATE_URL,
    upiId: UPI_ID,
    donateQr: DONATE_QR,
    donateImages: splitDonateImages(DONATE_IMAGES_RAW),
  });
});

// ── 'Notify Me' Price Drop Email Alert Controller ──
app.get('/api/price-alerts', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const alerts = Array.isArray(user.priceAlerts) ? user.priceAlerts : [];
  return res.json({
    ok: true,
    count: alerts.length,
    alerts,
  });
});

app.post(['/api/price-alerts', '/api/products/:id/price-alert'], (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const rawPid = req.params.id ?? req.body?.productId;
  const productId = Number.parseInt(String(rawPid || '0'), 10);
  const product = Number.isNaN(productId) ? null : store.findProduct(productId);
  if (!product || product.takenDown) {
    return notFound(res, 'Product not found.');
  }

  const rawEmail =
    typeof req.body?.email === 'string' && req.body.email.trim()
      ? req.body.email.trim()
      : user.billEmail || user.email;
  const rawTarget = req.body?.targetPrice ?? req.body?.threshold;

  const validation = validatePriceAlertInput({
    productId: product.id,
    email: rawEmail,
    targetPrice: Number(rawTarget),
    currentPrice: product.price,
  });
  if (!validation.ok) {
    return badRequest(res, validation.message || 'Invalid price alert configuration.');
  }

  const rawExpiresAt = req.body?.expiresAt ?? req.body?.expiryDate ?? null;

  const upserted = upsertPriceAlertSubscription(user.priceAlerts, {
    product,
    email: validation.normalizedEmail,
    targetPrice: validation.normalizedTargetPrice,
    expiresAt: rawExpiresAt,
  });
  user.priceAlerts = upserted.alerts;

  let emailNotification: PriceAlertEmailNotification | null = null;
  if (!upserted.subscription.isExpired && product.price <= validation.normalizedTargetPrice) {
    upserted.subscription.triggered = true;
    upserted.subscription.triggeredAt = Date.now();
    upserted.subscription.triggeredPrice = roundMoney(product.price);
    emailNotification = buildPriceAlertEmailPayload(upserted.subscription, product.price);
  }
  store.save();

  const specs = getProductSpecs(product);
  const presets = computeSuggestedPriceThresholds(product.price, specs.lowestPrice);

  return res.json({
    ok: true,
    isUpdate: upserted.isUpdate,
    subscription: upserted.subscription,
    alerts: user.priceAlerts,
    presets,
    emailNotification,
    message: emailNotification
      ? `Price alert active & instant email dispatched to ${validation.normalizedEmail} (${product.title} is already $${product.price.toFixed(2)}!)`
      : `Price alert set! We'll email ${validation.normalizedEmail} as soon as ${product.title} drops below $${validation.normalizedTargetPrice.toFixed(2)}.`,
  });
});

app.delete(['/api/price-alerts/:productId', '/api/products/:productId/price-alert'], (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const productId = Number.parseInt(String(req.params.productId || '0'), 10);
  if (Number.isNaN(productId) || productId <= 0) {
    return badRequest(res, 'Valid product ID required.');
  }

  const removedRes = removePriceAlertSubscription(user.priceAlerts, productId);
  user.priceAlerts = removedRes.alerts;
  store.save();

  return res.json({
    ok: true,
    removed: removedRes.removed,
    productId,
    alerts: user.priceAlerts,
    message: 'Price drop alert removed.',
  });
});

app.post('/api/price-alerts/:productId/simulate-drop', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const productId = Number.parseInt(String(req.params.productId || '0'), 10);
  const product = Number.isNaN(productId) ? null : store.findProduct(productId);
  if (!product || product.takenDown) {
    return notFound(res, 'Product not found.');
  }

  const userAlerts = Array.isArray(user.priceAlerts) ? user.priceAlerts : [];
  let sub = userAlerts.find((a) => a.productId === productId);
  if (sub && (sub.isExpired || isPriceAlertExpired(sub))) {
    return badRequest(
      res,
      'This price alert has expired. Please renew or pick a future expiry date in the alert settings.'
    );
  }
  if (!sub) {
    const defaultTarget = roundMoney(product.price * 0.95);
    const created = upsertPriceAlertSubscription(userAlerts, {
      product,
      email: user.billEmail || user.email,
      targetPrice: defaultTarget,
    });
    user.priceAlerts = created.alerts;
    sub = created.subscription;
  }

  const requestedPrice = Number(req.body?.newPrice);
  const simulatedNewPrice =
    !Number.isNaN(requestedPrice) && requestedPrice > 0
      ? roundMoney(requestedPrice)
      : Math.max(1, roundMoney(sub.targetPrice - Math.max(1, roundMoney(sub.targetPrice * 0.03))));

  const previousPrice = product.price;
  product.price = simulatedNewPrice;

  const evalRes = evaluatePriceDropAlerts(user.priceAlerts, product.id, simulatedNewPrice);
  user.priceAlerts = evalRes.updatedAlerts;
  const updatedSub = user.priceAlerts.find((a) => a.productId === product.id) || sub;
  const emailNotification =
    evalRes.triggeredNotifications[0] || buildPriceAlertEmailPayload(updatedSub, simulatedNewPrice);

  store.save();

  const enriched = enrichProduct(product);
  broadcastToUser(user.email, {
    type: 'price-drop-alert',
    notification: emailNotification,
    product: enriched,
  });
  broadcastToAll({
    type: 'product-restocked',
    product: enriched,
    actor: 'Voltbox Price Watch',
    priceDropped: simulatedNewPrice < previousPrice,
  });

  return res.json({
    ok: true,
    previousPrice,
    newPrice: simulatedNewPrice,
    product: enriched,
    subscription: updatedSub,
    alerts: user.priceAlerts,
    emailNotification,
    message: `Price dropped to $${simulatedNewPrice.toFixed(2)}! Email alert sent to ${emailNotification.toEmail}.`,
  });
});

// ── Cart Controller (mirrors com.voltbox.controller.CartController) ──
app.get('/api/cart', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const promoCode = typeof req.query.promoCode === 'string' ? req.query.promoCode : null;
  const cartEntity = buildCartEntity(store.getProducts(), user.cart || {}, user.email, promoCode);
  return res.json(cartEntity);
});

app.put('/api/cart', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const clean: Record<string, number> = {};
  const body = req.body;
  if (body && typeof body === 'object') {
    for (const [key, val] of Object.entries(body)) {
      const qty = Number(val);
      const productId = Number.parseInt(key, 10);
      const product = Number.isNaN(productId) ? null : store.findProduct(productId);
      if (qty > 0 && product && !product.takenDown) {
        clean[key] = Math.floor(qty);
      }
    }
  }
  user.cart = clean;
  store.save();

  const promoCode = typeof req.query.promoCode === 'string' ? req.query.promoCode : null;
  const cartEntity = buildCartEntity(store.getProducts(), user.cart, user.email, promoCode);
  return res.json({ ok: true, cart: cartEntity });
});

app.post('/api/cart/items', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const productId = Number.parseInt(String(req.body?.productId ?? '0'), 10);
  const deltaQty = req.body?.quantity !== undefined ? Math.floor(Number(req.body.quantity)) : 1;
  if (Number.isNaN(productId) || productId <= 0 || Number.isNaN(deltaQty)) {
    return badRequest(res, 'Invalid product ID or quantity.');
  }

  const product = store.findProduct(productId);
  if (!product || product.takenDown) return notFound(res, 'Product not found.');

  const key = String(productId);
  const current = Number((user.cart || {})[key]) || 0;
  const next = current + deltaQty;
  if (!user.cart) user.cart = {};
  if (next <= 0) {
    delete user.cart[key];
  } else {
    user.cart[key] = next;
  }
  store.save();

  const promoCode = typeof req.body?.promoCode === 'string' ? req.body.promoCode : null;
  const cartEntity = buildCartEntity(store.getProducts(), user.cart, user.email, promoCode);
  return res.json({ ok: true, cart: cartEntity });
});

app.patch('/api/cart/items/:productId', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const productId = Number.parseInt(String(req.params.productId || '0'), 10);
  const nextQty = Math.floor(Number(req.body?.quantity ?? 0));
  if (Number.isNaN(productId) || productId <= 0 || Number.isNaN(nextQty)) {
    return badRequest(res, 'Invalid quantity.');
  }

  const product = store.findProduct(productId);
  if (!product || product.takenDown) return notFound(res, 'Product not found.');

  const key = String(productId);
  if (!user.cart) user.cart = {};
  if (nextQty <= 0) {
    delete user.cart[key];
  } else {
    user.cart[key] = nextQty;
  }
  store.save();

  const promoCode = typeof req.body?.promoCode === 'string' ? req.body.promoCode : null;
  const cartEntity = buildCartEntity(store.getProducts(), user.cart, user.email, promoCode);
  return res.json({ ok: true, cart: cartEntity });
});

app.delete('/api/cart/items/:productId', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const productId = Number.parseInt(String(req.params.productId || '0'), 10);
  if (!Number.isNaN(productId) && user.cart) {
    delete user.cart[String(productId)];
    store.save();
  }
  const promoCode = typeof req.query.promoCode === 'string' ? req.query.promoCode : null;
  const cartEntity = buildCartEntity(store.getProducts(), user.cart || {}, user.email, promoCode);
  return res.json({ ok: true, cart: cartEntity });
});

app.delete('/api/cart', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  user.cart = {};
  store.save();
  const cartEntity = buildCartEntity(store.getProducts(), {}, user.email, null);
  return res.json({ ok: true, cart: cartEntity });
});

app.post('/api/cart/promo', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const promoCode = typeof req.body?.promoCode === 'string' ? req.body.promoCode.trim().toUpperCase() : '';
  const cartEntity = buildCartEntity(store.getProducts(), user.cart || {}, user.email, promoCode);
  const valid = promoCode.length === 0 || cartEntity.appliedPromo !== null;
  return res.json({
    ok: valid,
    appliedPromo: cartEntity.appliedPromo || '',
    cart: cartEntity,
  });
});

app.post('/api/cart/starter-rig', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const promoCode = typeof req.body?.promoCode === 'string' ? req.body.promoCode.trim().toUpperCase() : null;
  const starterParts = recommendStarterRigBundle(store.getProducts());
  user.cart = user.cart || {};
  for (const part of starterParts) {
    const key = String(part.id);
    user.cart[key] = Math.max(1, Number(user.cart[key] || 0));
  }
  store.save();
  const cartEntity = buildCartEntity(store.getProducts(), user.cart, user.email, promoCode);
  const powerEstimate = computeSystemPowerEstimate(cartEntity.items);
  return res.json({
    ok: true,
    cart: cartEntity,
    powerEstimate,
  });
});

app.get('/api/cart/power-estimate', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const cartEntity = buildCartEntity(store.getProducts(), user.cart || {}, user.email, null);
  const powerEstimate = computeSystemPowerEstimate(cartEntity.items);
  return res.json({
    ok: true,
    powerEstimate,
    rigBundle: cartEntity.rigBundle,
  });
});

app.get('/api/studio/telemetry', (req, res) => {
  const theme = resolveUiTemplateTheme(typeof req.query.theme === 'string' ? req.query.theme : null);
  const starterRig = recommendStarterRigBundle(store.getProducts());
  return res.json({
    ok: true,
    theme,
    starterRigProductIds: starterRig.map((p) => p.id),
    engine: 'Voltbox Java 21 Spring Boot Hardware Engine',
  });
});

// ── Wishlist Controller (Personal list accessed through profile) ──
app.get('/api/wishlist', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const summary = buildWishlistSummary(user.wishlist, store.getProducts());
  return res.json({
    ok: true,
    count: summary.count,
    totalValue: summary.totalValue,
    productIds: summary.productIds,
    items: summary.items,
  });
});

app.post('/api/wishlist/toggle', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const productId = Number.parseInt(String(req.body?.productId ?? '0'), 10);
  if (Number.isNaN(productId) || productId <= 0) {
    return badRequest(res, 'Valid product ID required.');
  }

  const product = store.findProduct(productId);
  if (!product || product.takenDown) return notFound(res, 'Product not found.');

  const result = toggleWishlistItem(user.wishlist, productId);
  user.wishlist = result.wishlist;
  store.save();

  const summary = buildWishlistSummary(user.wishlist, store.getProducts());
  return res.json({
    ok: true,
    added: result.added,
    productId,
    count: summary.count,
    totalValue: summary.totalValue,
    productIds: summary.productIds,
    items: summary.items,
    message: result.added ? `Saved "${product.title}" to your personal wishlist.` : `Removed "${product.title}" from your wishlist.`,
  });
});

app.post('/api/wishlist/items', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const productId = Number.parseInt(String(req.body?.productId ?? '0'), 10);
  if (Number.isNaN(productId) || productId <= 0) {
    return badRequest(res, 'Valid product ID required.');
  }

  const product = store.findProduct(productId);
  if (!product || product.takenDown) return notFound(res, 'Product not found.');

  if (!Array.isArray(user.wishlist)) user.wishlist = [];
  if (!user.wishlist.includes(productId)) {
    user.wishlist.push(productId);
    store.save();
  }

  const summary = buildWishlistSummary(user.wishlist, store.getProducts());
  return res.json({
    ok: true,
    added: true,
    productId,
    count: summary.count,
    totalValue: summary.totalValue,
    productIds: summary.productIds,
    items: summary.items,
  });
});

app.delete('/api/wishlist/items/:productId', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const productId = Number.parseInt(String(req.params.productId || '0'), 10);
  if (!Number.isNaN(productId) && Array.isArray(user.wishlist)) {
    user.wishlist = user.wishlist.filter((id) => id !== productId);
    store.save();
  }

  const summary = buildWishlistSummary(user.wishlist, store.getProducts());
  return res.json({
    ok: true,
    removedId: productId,
    count: summary.count,
    totalValue: summary.totalValue,
    productIds: summary.productIds,
    items: summary.items,
  });
});

app.post('/api/wishlist/clear', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  user.wishlist = [];
  store.save();
  return res.json({
    ok: true,
    count: 0,
    totalValue: 0,
    productIds: [],
    items: [],
  });
});

app.post('/api/wishlist/add-all-to-cart', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  if (!user.cart) user.cart = {};
  let addedCount = 0;

  for (const pid of user.wishlist || []) {
    const p = store.findProduct(pid);
    if (p && !p.takenDown && getProductQuantity(p) > 0) {
      const key = String(pid);
      user.cart[key] = (Number(user.cart[key]) || 0) + 1;
      addedCount++;
    }
  }

  store.save();
  const cartEntity = buildCartEntity(store.getProducts(), user.cart, user.email, null);
  const summary = buildWishlistSummary(user.wishlist, store.getProducts());

  return res.json({
    ok: true,
    addedCount,
    cart: cartEntity,
    wishlist: summary,
  });
});

app.post('/api/checkout', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const shippingName = typeof req.body?.shippingName === 'string' ? req.body.shippingName.trim() : '';
  const shippingAddress = typeof req.body?.shippingAddress === 'string' ? req.body.shippingAddress.trim() : '';
  const promoCode = typeof req.body?.promoCode === 'string' ? req.body.promoCode.trim() : null;

  if (!shippingName || !shippingAddress) {
    return badRequest(res, 'Add a name and address before paying.');
  }

  if (user.orders.length > 0) {
    const last = user.orders[user.orders.length - 1];
    if (Date.now() - last.placedAt < 2000) {
      return res.json(last);
    }
  }

  const cartEntries = Object.entries(user.cart || {});
  if (cartEntries.length === 0) {
    return badRequest(res, 'Your cart is empty.');
  }

  const activeProducts = store.getProducts().filter((p) => !p.takenDown);
  const calc = computeCartTotals(activeProducts, user.cart || {}, DEFAULT_TAX_RATE, promoCode);

  const rawPaymentMethod = typeof req.body?.paymentMethod === 'string' ? req.body.paymentMethod.trim() : '';
  const paymentSummary = rawPaymentMethod
    ? rawPaymentMethod
    : formatPaymentMethodSummary(
        req.body?.paymentDetails && typeof req.body.paymentDetails === 'object'
          ? req.body.paymentDetails
          : {
              method: req.body?.method,
              upiApp: req.body?.upiApp,
              upiId: req.body?.upiId,
              upiMode: req.body?.upiMode,
              cardNumber: req.body?.cardNumber,
              cardNetwork: req.body?.cardNetwork,
              bankName: req.body?.bankName,
              emiMonths: req.body?.emiMonths,
            }
      );

  const placedAt = Date.now();
  const order: Order = {
    id: makeOrderId(placedAt),
    placedAt,
    count: 0,
    subtotal: 0,
    rigDiscount: calc.rigDiscount,
    promoDiscount: calc.promoDiscount,
    discountTotal: calc.discountTotal,
    promoCode: calc.appliedPromo,
    tax: 0,
    total: 0,
    lines: [],
    shippingName,
    shippingAddress,
    paymentMethod: paymentSummary,
    status: 'Paid · Verified',
    amountPaid: 0,
  };

  for (const [idStr, qtyVal] of cartEntries) {
    const productId = Number.parseInt(idStr, 10);
    const p = Number.isNaN(productId) ? null : store.findProduct(productId);
    if (!p || p.takenDown) continue;
    const qty = Number(qtyVal) || 0;
    if (qty <= 0) continue;

    order.lines.push({
      productId: p.id,
      title: p.title,
      image: resolveProductImageUrl(p, store.getProducts()),
      price: p.price,
      qty,
    });

    // Decrement product stock quantity when purchased
    const currentStock = getProductQuantity(p);
    const nextStock = Math.max(0, currentStock - qty);
    p.quantity = nextStock;
    p.stock = nextStock;
    p.lowStock = isLowStock({ quantity: nextStock });
    recordInventoryTransaction(
      p,
      'CHECKOUT_DEDUCTION',
      -(currentStock - nextStock),
      currentStock,
      nextStock,
      user.name,
      `Order checkout ${order.id} via ${paymentSummary}`
    );
  }

  order.count = calc.count;
  order.subtotal = calc.sub;
  order.tax = calc.tax;
  order.total = calc.total;
  order.amountPaid = order.total;

  user.orders.push(order);
  user.cart = {};
  store.save();



  broadcastToAll({
    type: 'activity-feed',
    message: `${user.name} checked out ${order.count} part${order.count === 1 ? '' : 's'} (${order.id})`,
    timestamp: placedAt,
  });

  return res.json(order);
});

app.get('/api/orders', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const allProducts = store.getProducts();
  const nowMs = Date.now();
  const newestFirst = [...(user.orders || [])]
    .reverse()
    .map((ord) => enrichOrderForHistory(ord, allProducts, nowMs));
  return res.json(newestFirst);
});

app.get('/api/orders/history', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const allProducts = store.getProducts();
  const nowMs = Date.now();
  const enriched = [...(user.orders || [])]
    .reverse()
    .map((ord) => enrichOrderForHistory(ord, allProducts, nowMs));

  const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : 'all';
  const searchQuery = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const sortBy = typeof req.query.sort === 'string' ? req.query.sort.trim() : 'newest';

  const summary = computeOrderHistorySummary(enriched);
  const filtered = filterAndSortOrderHistory(enriched, { statusFilter, searchQuery, sortBy });

  return res.json({
    ok: true,
    orders: filtered,
    allOrders: enriched,
    summary,
  });
});

app.put('/api/me/bill-email', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const address = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  if (!address) {
    user.billEmail = null;
    store.save();
    return res.json({ ok: true, billEmail: '' });
  }
  if (!address.includes('@')) {
    return badRequest(res, "That doesn't look like an email address.");
  }
  user.billEmail = address;
  store.save();
  return res.json({ ok: true, billEmail: address });
});

app.post('/api/orders/:orderId/email', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const orderId = String(req.params.orderId || '');
  const order = (user.orders || []).find((o) => o.id === orderId);
  if (!order) {
    return notFound(res, 'Order not found.');
  }
  const recipient = user.billEmail || user.email;
  return res.json({ ok: true, sentTo: recipient });
});

app.get('/api/orders/:orderId/tracking', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const orderId = String(req.params.orderId || '').trim();
  if (!orderId) return badRequest(res, 'Missing order ID');

  let targetOrder: Order | undefined = (user.orders || []).find((o) => o.id === orderId);

  // If not found in own orders and user is moderator, search all users
  if (!targetOrder && isModerator(user)) {
    for (const u of store.getUsers()) {
      const match = (u.orders || []).find((o) => o.id === orderId);
      if (match) {
        targetOrder = match;
        break;
      }
    }
  }

  // If still not found, check if it matches the newest order or any order in store for demo/guest convenience
  if (!targetOrder) {
    for (const u of store.getUsers()) {
      const match = (u.orders || []).find((o) => o.id === orderId);
      if (match) {
        targetOrder = match;
        break;
      }
    }
  }

  if (!targetOrder) {
    return notFound(res, 'Order not found');
  }

  const allProducts = store.getProducts();
  const enrichedLines = (targetOrder.lines || []).map((ln) => ({
    ...ln,
    image: resolveProductImageUrl(ln, allProducts),
  }));

  const timeline = resolveOrderTrackingTimeline(
    {
      ...targetOrder,
      lines: enrichedLines,
    },
    Date.now()
  );

  return res.json({
    ok: true,
    order: {
      ...targetOrder,
      lines: enrichedLines,
    },
    timeline,
  });
});

app.post('/api/orders/:orderId/advance', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const orderId = String(req.params.orderId || '').trim();
  if (!orderId) return badRequest(res, 'Missing order ID');

  let targetOrder: Order | undefined;
  for (const u of store.getUsers()) {
    const match = (u.orders || []).find((o) => o.id === orderId);
    if (match) {
      targetOrder = match;
      break;
    }
  }

  if (!targetOrder) {
    return notFound(res, 'Order not found');
  }

  const prevStatus = targetOrder.status || 'Order Placed';
  const nextStatus = advanceOrderTrackingStage(prevStatus);
  targetOrder.status = nextStatus;
  store.save();

  const allProducts = store.getProducts();
  const enrichedLines = (targetOrder.lines || []).map((ln) => ({
    ...ln,
    image: resolveProductImageUrl(ln, allProducts),
  }));

  const timeline = resolveOrderTrackingTimeline(
    {
      ...targetOrder,
      lines: enrichedLines,
    },
    Date.now()
  );

  broadcastToAll({
    type: 'order-tracking-update',
    orderId: targetOrder.id,
    status: targetOrder.status,
    timeline,
    message: `Order #${targetOrder.id} status is now: ${targetOrder.status}`,
    timestamp: Date.now(),
  });

  return res.json({
    ok: true,
    order: {
      ...targetOrder,
      lines: enrichedLines,
    },
    timeline,
  });
});

app.get('/api/admin/orders', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);
  if (!isModerator(user)) return forbidden(res, 'Forbidden');

  const out: Array<Record<string, unknown>> = [];
  for (const u of store.getUsers()) {
    for (const o of u.orders || []) {
      out.push({
        id: o.id,
        placedAt: o.placedAt,
        count: o.count,
        total: o.total,
        status: o.status || 'Pending',
        owner: { email: u.email, name: u.name },
      });
    }
  }
  out.sort((a, b) => Number(b.placedAt) - Number(a.placedAt));
  return res.json(out);
});

app.put('/api/orders/:orderId/status', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);
  if (!isModerator(user)) return forbidden(res, 'Forbidden');

  const status = typeof req.body?.status === 'string' ? req.body.status.trim() : '';
  if (!status) return badRequest(res, 'Missing status');

  const orderId = String(req.params.orderId || '');
  for (const u of store.getUsers()) {
    for (const o of u.orders || []) {
      if (o.id === orderId) {
        o.status = status;
        store.save();

        const allProducts = store.getProducts();
        const enrichedLines = (o.lines || []).map((ln) => ({
          ...ln,
          image: resolveProductImageUrl(ln, allProducts),
        }));
        const timeline = resolveOrderTrackingTimeline(
          { ...o, lines: enrichedLines },
          Date.now()
        );

        broadcastToAll({
          type: 'order-tracking-update',
          orderId: o.id,
          status: o.status,
          timeline,
          message: `Order #${o.id} status updated to ${o.status}`,
          timestamp: Date.now(),
        });

        return res.json({ ok: true, id: o.id, status: o.status, timeline });
      }
    }
  }
  return notFound(res, 'Order not found');
});

// ── Community Controller ──
app.post('/api/products', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);
  if (!canContribute(user)) return forbidden(res, 'Only contributors can add listings.');

  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const category = typeof req.body?.category === 'string' ? req.body.category.trim() : '';
  const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
  const image = typeof req.body?.image === 'string' ? req.body.image.trim() : '';

  if (!title || !category) {
    return badRequest(res, 'A listing needs at least a title and a category.');
  }
  const validation = validateProductModificationPayload(req.body || {}, {
    isCreate: true,
    currentProductId: null,
    existingProducts: store.getProducts(),
  });
  if (!validation.ok) {
    return res.status(400).json(validation);
  }
  if (!image) {
    return badRequest(res, 'Add an image link for the listing — a photo of the part.');
  }
  if (!image.startsWith('http') && !image.startsWith('/')) {
    return badRequest(res, "That image link doesn't look right — it should start with https://");
  }

  const price = validation.normalizedPrice ?? 0;
  const quantity = validation.normalizedStock ?? 3;

  const product = store.addProduct({
    ...(validation.normalizedSku ? { sku: validation.normalizedSku } : {}),
    title,
    price,
    description,
    category,
    image,
    ratingRate: 0,
    ratingCount: 0,
    official: false,
    addedByName: user.name,
    addedByColor: user.avatarColor,
    addedByEmail: user.email,
    takenDown: false,
    quantity,
    stock: quantity,
  });

  const enriched = enrichProduct(product);
  broadcastToAll({ type: 'product-added', product: enriched });
  broadcastToAll({
    type: 'activity-feed',
    message: `${user.name} listed ${enriched.title} ($${enriched.price.toFixed(2)})`,
    timestamp: Date.now(),
  });
  return res.json(enriched);
});

app.post('/api/products/:id/restock', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const id = Number.parseInt(String(req.params.id || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p || p.takenDown) return notFound(res, "Couldn't find that listing.");

  const prevQty = getProductQuantity(p);
  const rawAmount = req.body?.amount !== undefined ? req.body.amount : 3;
  const validation = validateProductStockAdjustment(prevQty, {
    delta: rawAmount,
    isRestockOnly: true,
  });
  if (!validation.ok || validation.normalizedStock === null || validation.normalizedStock === undefined) {
    return res.status(400).json(validation);
  }
  const nextQty = validation.normalizedStock;
  const addQty = nextQty - prevQty;
  p.quantity = nextQty;
  p.stock = nextQty;
  p.lowStock = isLowStock({ quantity: nextQty });
  store.save();

  const enriched = enrichProduct(p);
  broadcastToAll({
    type: 'product-restocked',
    product: enriched,
    added: addQty,
    actor: user.name,
  });
  broadcastToAll({
    type: 'activity-feed',
    message: `${user.name} restocked +${addQty} units of ${p.title}`,
    timestamp: Date.now(),
  });
  return res.json(enriched);
});

app.get('/api/my-products', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);
  if (!canContribute(user)) return forbidden(res, 'Only contributors have an upload history.');

  const mine = store
    .getProducts()
    .filter((p) => p.addedByEmail && p.addedByEmail.toLowerCase() === user.email.toLowerCase())
    .reverse();
  return res.json(mine);
});

app.delete('/api/products/:id', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const id = Number.parseInt(String(req.params.id || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p) return notFound(res, "Couldn't find that listing.");

  const mine = Boolean(p.addedByEmail && p.addedByEmail.toLowerCase() === user.email.toLowerCase());
  if (!isModerator(user) && !mine) {
    return forbidden(res, 'You can only take down your own listings.');
  }

  p.takenDown = true;
  store.save();
  broadcastToAll({ type: 'product-taken-down', productId: id });
  return res.json({ ok: true });
});

app.post('/api/applications', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  if (canContribute(user)) {
    return badRequest(res, "You're already a contributor.");
  }
  const existingPending = store
    .getApplications()
    .find((a) => a.applicantEmail.toLowerCase() === user.email.toLowerCase() && a.status === 'pending');
  if (existingPending) {
    return badRequest(res, "You've already applied — hang tight while it's reviewed.");
  }

  const workplace = typeof req.body?.workplace === 'string' ? req.body.workplace.trim() : '';
  const idCardImage = typeof req.body?.idCardImage === 'string' ? req.body.idCardImage.trim() : '';
  const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';

  if (!workplace || !idCardImage) {
    return badRequest(res, 'Tell us where you work in IT and add a link to your work ID.');
  }

  const appRecord = store.addApplication({
    applicantEmail: user.email,
    applicantName: user.name,
    workplace,
    idCardImage,
    note,
    status: 'pending',
    submittedAt: Date.now(),
    decidedAt: 0,
  });

  broadcastToModerators({ type: 'application-new', application: appRecord });
  return res.json({ ok: true, status: 'pending' });
});

app.get('/api/applications/mine', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  let latest = null;
  for (const a of store.getApplications()) {
    if (a.applicantEmail.toLowerCase() === user.email.toLowerCase()) {
      latest = a;
    }
  }
  return res.json({ application: latest ?? '' });
});

app.get('/api/applications', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);
  if (!isModerator(user)) return forbidden(res, 'Only the moderator reviews applications.');

  const pending = store
    .getApplications()
    .filter((a) => a.status === 'pending')
    .reverse();
  return res.json(pending);
});

function decideApplication(req: Request, res: Response, approved: boolean) {
  const mod = userFromReq(req);
  if (!mod) return notSignedIn(res);
  if (!isModerator(mod)) return forbidden(res, 'Only the moderator can decide applications.');

  const id = Number.parseInt(String(req.params.id || ''), 10);
  const appRecord = Number.isNaN(id) ? null : store.findApplication(id);
  if (!appRecord) return notFound(res, "Couldn't find that application.");
  if (appRecord.status !== 'pending') {
    return badRequest(res, 'That application has already been decided.');
  }

  appRecord.status = approved ? 'approved' : 'declined';
  appRecord.decidedAt = Date.now();

  if (approved) {
    const applicant = store.findByEmail(appRecord.applicantEmail);
    if (applicant && applicant.role === 'member') {
      applicant.role = 'contributor';
    }
  }
  store.save();
  broadcastToUser(appRecord.applicantEmail, {
    type: 'application-decided',
    status: appRecord.status,
  });

  return res.json({ ok: true, status: appRecord.status });
}

app.post('/api/applications/:id/approve', (req, res) => decideApplication(req, res, true));
app.post('/api/applications/:id/decline', (req, res) => decideApplication(req, res, false));

app.get('/api/contributors', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);
  if (!isModerator(user)) return forbidden(res, 'Only the moderator sees the roster.');

  const list = store
    .getUsers()
    .filter((u) => canContribute(u))
    .map((u) => ({
      name: u.name,
      email: u.email,
      color: u.avatarColor,
      role: u.role,
    }));
  return res.json(list);
});

app.post('/api/contributors/grant', (req, res) => {
  const mod = userFromReq(req);
  if (!mod) return notSignedIn(res);
  if (!isModerator(mod)) return forbidden(res, 'Only the moderator can grant access.');

  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  if (!email) return badRequest(res, 'Whose email?');

  const target = store.findByEmail(email);
  if (!target) return notFound(res, 'No account with that email — they need to sign up first.');
  if (canContribute(target)) return badRequest(res, `${target.name} already has access.`);

  target.role = 'contributor';
  store.save();
  broadcastToUser(target.email, { type: 'role-changed', role: 'contributor' });
  return res.json({ ok: true, name: target.name });
});

app.post('/api/reports', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const productId = Number(req.body?.productId) || 0;
  const p = store.findProduct(productId);
  if (!p) return notFound(res, "Couldn't find that listing.");

  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
  const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';

  const report = store.addReport({
    productId,
    productTitle: p.title,
    reporterName: user.name,
    reporterEmail: user.email,
    reason,
    note,
    status: 'open',
    createdAt: Date.now(),
  });

  broadcastToModerators({ type: 'report-new', report });
  return res.json({ ok: true });
});

app.get('/api/reports', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);
  if (!isModerator(user)) return forbidden(res, 'Only the moderator sees reports.');

  const open = store
    .getReports()
    .filter((r) => r.status === 'open')
    .reverse();
  return res.json(open);
});

app.post('/api/reports/:id/resolve', (req, res) => {
  const mod = userFromReq(req);
  if (!mod) return notSignedIn(res);
  if (!isModerator(mod)) return forbidden(res, 'Only the moderator can resolve reports.');

  const id = Number.parseInt(String(req.params.id || ''), 10);
  const r = Number.isNaN(id) ? null : store.findReport(id);
  if (!r) return notFound(res, "Couldn't find that report.");

  const action = typeof req.body?.action === 'string' ? req.body.action.trim() : '';
  if (action === 'takedown') {
    const p = store.findProduct(r.productId);
    if (p) p.takenDown = true;
    r.status = 'resolved';
  } else {
    r.status = 'dismissed';
  }
  store.save();
  return res.json({ ok: true, status: r.status });
});

// ── Real-Time Bench Messenger Controller (/api/messages) ──
app.get('/api/messages/channels', (_req, res) => {
  res.json({
    ok: true,
    channels: [
      { id: 'engineering-desk', label: 'Engineering Desk', icon: 'cpu', topic: 'Architecture & QA Support', activeCount: 8 },
      { id: 'rig-builds', label: 'Rig Builds', icon: 'layers', topic: 'PC Part Lists & Benchmarks', activeCount: 12 },
      { id: 'stock-radar', label: 'Stock Radar', icon: 'refresh', topic: 'Real-Time Restocks & Deals', activeCount: 24 },
      { id: 'vip-concierge', label: 'VIP Concierge', icon: 'shield', topic: 'Priority Order & RMA Assistance', activeCount: 4 },
    ],
  });
});

app.get('/api/messages', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const channel = typeof req.query.channel === 'string' ? req.query.channel.trim() : 'all';
  return res.json({
    ok: true,
    onlineCount: Math.max(1, wsClients.size),
    messages: store.getMessages(channel),
  });
});

app.post('/api/messages/:id/reactions', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const id = Number.parseInt(String(req.params.id || ''), 10);
  const emoji = typeof req.body?.emoji === 'string' ? req.body.emoji : '👍';
  const updated = store.toggleMessageReaction(id, emoji);
  if (!updated) return notFound(res, 'Message not found');

  broadcastToAll({
    type: 'message-reaction',
    messageId: id,
    reactions: updated.reactions,
  });

  return res.json({ ok: true, message: updated });
});

app.post('/api/messages', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const check = sanitizeChatMessage({
    text: req.body?.text,
    channel: req.body?.channel,
    productId: req.body?.productId,
  });

  if (!check.valid) {
    return badRequest(res, check.error || 'Message cannot be empty.');
  }

  const linkedProduct = check.productId ? store.findProduct(check.productId) : null;
  const finalText =
    check.text ||
    (linkedProduct ? `Shared hardware component: ${linkedProduct.title}` : '');

  const created = store.addMessage({
    channel: check.channel,
    senderName: user.name,
    senderEmail: user.email,
    senderRole: user.role === 'admin' || user.role === 'moderator' ? 'STAFF_ARCHITECT' : 'VERIFIED_BUILDER',
    senderColor: user.avatarColor || '#3b82f6',
    text: finalText,
    productId: linkedProduct ? linkedProduct.id : null,
    productTitle: linkedProduct ? linkedProduct.title : null,
    productPrice: linkedProduct ? linkedProduct.price : null,
    productSku: linkedProduct ? getProductSku(linkedProduct) : null,
    productImage: linkedProduct ? linkedProduct.image : null,
    reactions: { '⚡': 1 },
  });

  broadcastToAll({
    type: 'chat-message',
    message: created,
    onlineCount: Math.max(1, wsClients.size),
  });

  // Simulated Expert Engineer AI / Architect Consultation response
  if (finalText.includes('?') || finalText.toLowerCase().includes('recommend') || finalText.toLowerCase().includes('pair') || finalText.toLowerCase().includes('bottleneck')) {
    setTimeout(() => {
      const answers = [
        `Bench telemetry confirms 0% bottleneck. Both parts utilize dedicated PCIe 5.0 lanes with under 1.2ns latency. Highly recommended.`,
        `Checked thermal dissipation curve: peak VRM temperature stays under 54°C under sustained AVX-512 workload. Clean pairing.`,
        `Verified with Voltbox QA Bench: compatible with ATX 3.1 12V-2x6 power supply standards. Make sure to claim the 5% Rig Bundle discount!`,
      ];
      const reply = store.addMessage({
        channel: check.channel,
        senderName: 'Alex Rivera',
        senderEmail: 'alex.rivera@voltbox.hardware',
        senderRole: 'STAFF_ARCHITECT',
        senderColor: '#3b82f6',
        text: answers[Math.floor(Math.random() * answers.length)],
        productId: linkedProduct ? linkedProduct.id : null,
        productTitle: linkedProduct ? linkedProduct.title : null,
        productPrice: linkedProduct ? linkedProduct.price : null,
        productSku: linkedProduct ? getProductSku(linkedProduct) : null,
        productImage: linkedProduct ? linkedProduct.image : null,
        reactions: { '🚀': 2, '🔥': 1 },
      });
      broadcastToAll({
        type: 'chat-message',
        message: reply,
        onlineCount: Math.max(1, wsClients.size),
      });
    }, 750);
  }

  return res.json({
    ok: true,
    message: created,
    onlineCount: Math.max(1, wsClients.size),
  });
});

// ── Dynamic Category SVG Tile Endpoint (prevents 404s on /images/categories/*.svg) ──
app.get('/images/categories/:file', (req, res) => {
  const rawName = String(req.params.file || '').replace(/\.svg$/i, '').toLowerCase();
  const safeLabel = rawName.replace(/[^a-z0-9 -]/g, '') || 'part';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1c2029"/>
        <stop offset="100%" stop-color="#14171e"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#bg)"/>
    <circle cx="200" cy="175" r="58" fill="none" stroke="#2dd4bf" stroke-width="3" opacity="0.35"/>
    <path d="M207 135 L177 180 H202 L195 215 L225 170 H200 Z" fill="#2dd4bf" opacity="0.85"/>
    <text x="200" y="275" fill="#9aa1ad" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="600" text-anchor="middle" letter-spacing="1.5">${safeLabel.toUpperCase()}</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(svg);
});

// ── Admin Controller (mirrors com.voltbox.controller.AdminController) ──
app.get(['/api/admin/metrics', '/api/admin/health'], (_req, res) => {
  const mem = process.memoryUsage();
  const heapUsedMb = roundMoney(mem.heapUsed / (1024 * 1024));
  const heapMaxMb = roundMoney(Math.max(mem.heapTotal, 512 * 1024 * 1024) / (1024 * 1024));
  const openReportsCount = store.getReports().filter((r) => r.status === 'open').length;
  const pendingApplicationsCount = store.getApplications().filter((a) => a.status === 'pending').length;

  const metrics = computeSystemHealthMetrics({
    products: store.getProducts(),
    users: store.getUsers(),
    openReportsCount,
    pendingApplicationsCount,
    activeWebSocketClients: Math.max(1, wsClients.size),
    uptimeSeconds: Math.max(1, Math.floor(process.uptime())),
    heapUsedMb,
    heapMaxMb,
  });

  const activeProducts = store.getProducts().filter((p) => !p.takenDown).map(enrichProduct);
  const searchAnalytics = computeSearchQueryAnalytics(store.getSearchLogs(), activeProducts);

  return res.json({
    ...metrics,
    searchAnalytics,
  });
});

app.get('/api/admin/search-analytics', (_req, res) => {
  const activeProducts = store.getProducts().filter((p) => !p.takenDown).map(enrichProduct);
  const report = computeSearchQueryAnalytics(store.getSearchLogs(), activeProducts);
  return res.json({
    ok: true,
    ...report,
  });
});

app.delete('/api/admin/search-analytics', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);
  if (!isModerator(user)) return forbidden(res, 'Administrator privileges required.');

  store.clearSearchLogs();
  const activeProducts = store.getProducts().filter((p) => !p.takenDown).map(enrichProduct);
  const report = computeSearchQueryAnalytics(store.getSearchLogs(), activeProducts);
  return res.json({
    ok: true,
    message: 'Search query logs cleared.',
    ...report,
  });
});

app.get('/api/admin/products', (req, res) => {
  const includeTakenDown = req.query.includeTakenDown !== 'false';
  const groupFilter = typeof req.query.group === 'string' ? req.query.group.trim().toLowerCase() : '';
  const searchFilter = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

  const list = store
    .getProducts()
    .filter((p) => includeTakenDown || !p.takenDown)
    .map(enrichProduct)
    .filter((pe) => !groupFilter || groupFilter === 'all' || pe.componentGroup.toLowerCase() === groupFilter)
    .filter((pe) => {
      if (!searchFilter) return true;
      const hay = `${pe.name} ${pe.title} ${pe.sku} ${pe.category} ${pe.componentGroup} ${pe.description || ''}`.toLowerCase();
      return hay.includes(searchFilter);
    });
  return res.json(list);
});

app.post('/api/admin/products', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);
  if (!isModerator(user)) return forbidden(res, 'Administrator privileges required.');

  const validation = validateProductModificationPayload(req.body || {}, {
    isCreate: true,
    currentProductId: null,
    existingProducts: store.getProducts(),
  });
  if (!validation.ok) {
    return res.status(400).json(validation);
  }

  const title = String(req.body?.title ?? req.body?.name ?? '').trim();
  const category = typeof req.body?.category === 'string' && req.body.category.trim()
    ? req.body.category.trim()
    : 'components';
  const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
  const rawImage = typeof req.body?.image === 'string' ? req.body.image.trim() : '';
  const image = rawImage || `/images/categories/${category.toLowerCase()}.svg`;
  const price = validation.normalizedPrice ?? 0;
  const quantity = validation.normalizedStock ?? 8;
  const official = req.body?.official !== undefined ? Boolean(req.body.official) : isModerator(user);

  const created = store.addProduct({
    ...(validation.normalizedSku ? { sku: validation.normalizedSku } : {}),
    title,
    price: roundMoney(price),
    description,
    category,
    image,
    ratingRate: 4.8,
    ratingCount: 12,
    official,
    addedByName: user.name,
    addedByColor: user.avatarColor,
    addedByEmail: user.email,
    takenDown: false,
    quantity,
    stock: quantity,
  });

  recordInventoryTransaction(created, 'RESTOCK', quantity, 0, quantity, user.name, 'Created via Admin Console');
  const enriched = enrichProduct(created);
  broadcastToAll({ type: 'product-added', product: enriched });
  return res.json({ ok: true, product: enriched });
});

app.put('/api/admin/products/:id', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);
  if (!isModerator(user)) return forbidden(res, 'Administrator privileges required.');

  const id = Number.parseInt(String(req.params.id || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p) return notFound(res, 'Product not found.');

  const validation = validateProductModificationPayload(req.body || {}, {
    isCreate: false,
    currentProductId: p.id,
    existingProducts: store.getProducts(),
  });
  if (!validation.ok) {
    return res.status(400).json(validation);
  }

  const prevQty = getProductQuantity(p);
  if (validation.normalizedSku) {
    p.sku = validation.normalizedSku;
  }
  const nextTitle = typeof (req.body?.name ?? req.body?.title) === 'string'
    ? String(req.body.name ?? req.body.title).trim()
    : '';
  if (nextTitle) p.title = nextTitle;
  if (typeof req.body?.category === 'string' && req.body.category.trim()) {
    p.category = req.body.category.trim();
  }
  if (typeof req.body?.description === 'string') {
    p.description = req.body.description.trim();
  }
  if (typeof req.body?.image === 'string' && req.body.image.trim()) {
    p.image = req.body.image.trim();
  }
  if (validation.normalizedPrice !== null && validation.normalizedPrice !== undefined) {
    p.price = validation.normalizedPrice;
  }
  if (req.body?.official !== undefined) {
    p.official = Boolean(req.body.official);
  }
  if (req.body?.takenDown !== undefined) {
    p.takenDown = Boolean(req.body.takenDown);
  }

  if (validation.normalizedStock !== null && validation.normalizedStock !== undefined) {
    const nextQty = validation.normalizedStock;
    p.quantity = nextQty;
    p.stock = nextQty;
    p.lowStock = isLowStock({ quantity: nextQty });
    if (nextQty !== prevQty) {
      recordInventoryTransaction(
        p,
        nextQty >= prevQty ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
        nextQty - prevQty,
        prevQty,
        nextQty,
        user.name,
        'Admin CRUD edit'
      );
    }
  }
  store.save();

  const enriched = enrichProduct(p);
  broadcastToAll({ type: 'product-restocked', product: enriched, actor: user.name });
  return res.json({ ok: true, product: enriched });
});

app.delete('/api/admin/products/:id', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);
  if (!isModerator(user)) return forbidden(res, 'Administrator privileges required.');

  const id = Number.parseInt(String(req.params.id || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p) return notFound(res, 'Product not found.');

  const restore = req.query.restore === 'true';
  p.takenDown = !restore;
  store.save();

  const enriched = enrichProduct(p);
  if (p.takenDown) {
    broadcastToAll({ type: 'product-taken-down', productId: p.id });
  } else {
    broadcastToAll({ type: 'product-added', product: enriched });
  }
  return res.json({ ok: true, product: enriched });
});

app.post('/api/admin/inventory/restock-low-stock', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);
  if (!isModerator(user)) return forbidden(res, 'Administrator privileges required.');

  const amount = Math.max(1, Math.min(50, Number(req.body?.amount) || 5));
  const updatedProducts: ReturnType<typeof enrichProduct>[] = [];

  for (const p of store.getProducts()) {
    if (p.takenDown) continue;
    const prevQty = getProductQuantity(p);
    if (isLowStock({ quantity: prevQty })) {
      const nextQty = prevQty + amount;
      p.quantity = nextQty;
      p.stock = nextQty;
      p.lowStock = isLowStock({ quantity: nextQty });
      recordInventoryTransaction(
        p,
        'RESTOCK',
        amount,
        prevQty,
        nextQty,
        user.name,
        'Admin Batch Low-Stock Replenishment'
      );
      const enriched = enrichProduct(p);
      updatedProducts.push(enriched);
      broadcastToAll({
        type: 'product-restocked',
        product: enriched,
        added: amount,
        actor: user.name,
      });
    }
  }
  store.save();

  return res.json({
    ok: true,
    restockedCount: updatedProducts.length,
    amountAddedPerSku: amount,
    products: updatedProducts,
  });
});

app.post(
  ['/api/admin/products/batch-update', '/api/admin/products/batch'],
  (req, res) => {
    const user = userFromReq(req);
    if (!user) return notSignedIn(res);
    if (!isModerator(user)) return forbidden(res, 'Administrator privileges required.');

    const rawProductIds = Array.isArray(req.body?.productIds)
      ? req.body.productIds
      : Array.isArray(req.body?.ids)
      ? req.body.ids
      : [];

    const plan = planBatchProductTransaction(store.getProducts(), {
      productIds: rawProductIds,
      priceMode: req.body?.priceMode,
      priceValue: req.body?.priceValue,
      stockMode: req.body?.stockMode,
      stockValue: req.body?.stockValue,
      reason: req.body?.reason,
    });

    if (!plan.ok) {
      return res.status(400).json({
        ok: false,
        code: plan.code || 'BATCH_VALIDATION_ERROR',
        message: plan.message || 'Invalid batch edit configuration.',
        plan,
      });
    }

    const updatedProducts: ReturnType<typeof enrichProduct>[] = [];
    const triggeredAlerts: PriceAlertEmailNotification[] = [];

    for (const mut of plan.mutations) {
      const p = store.findProduct(mut.productId);
      if (!p) continue;

      if (mut.priceChanged) {
        p.price = mut.nextPrice;
        if (mut.nextPrice < mut.previousPrice) {
          for (const u of store.getUsers()) {
            if (!Array.isArray(u.priceAlerts) || u.priceAlerts.length === 0) continue;
            const evalRes = evaluatePriceDropAlerts(u.priceAlerts, p.id, p.price);
            u.priceAlerts = evalRes.updatedAlerts;
            for (const notif of evalRes.triggeredNotifications) {
              triggeredAlerts.push(notif);
              broadcastToUser(u.email, {
                type: 'price-drop-alert',
                notification: notif,
                product: enrichProduct(p),
              });
            }
          }
        }
      }

      if (mut.stockChanged) {
        p.quantity = mut.nextStock;
        p.stock = mut.nextStock;
        p.lowStock = mut.nextLowStock;
      }

      if (mut.priceChanged || mut.stockChanged) {
        const txReason = `[${plan.transactionId}] ${plan.normalizedReason}${
          mut.priceChanged ? ` (Price $${mut.previousPrice.toFixed(2)} → $${mut.nextPrice.toFixed(2)})` : ''
        }`;
        recordInventoryTransaction(
          p,
          mut.stockDelta >= 0 ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
          mut.stockDelta,
          mut.previousStock,
          mut.nextStock,
          user.name,
          txReason
        );
      }

      const enriched = enrichProduct(p);
      updatedProducts.push(enriched);
      broadcastToAll({
        type: 'product-restocked',
        product: enriched,
        added: mut.stockDelta,
        actor: user.name,
        priceDropped: mut.nextPrice < mut.previousPrice,
      });
    }

    // Commit all mutations in a single persistence transaction
    store.save();

    broadcastToAll({
      type: 'products-batch-updated',
      transactionId: plan.transactionId,
      selectedCount: plan.selectedCount,
      updatedCount: plan.updatedCount,
      products: updatedProducts,
      actor: user.name,
      timestamp: Date.now(),
    });
    broadcastToAll({
      type: 'activity-feed',
      message: `${user.name} executed Batch Edit ${plan.transactionId} across ${plan.selectedCount} SKUs (${plan.normalizedReason})`,
      timestamp: Date.now(),
    });

    return res.json({
      ok: true,
      transactionId: plan.transactionId,
      selectedCount: plan.selectedCount,
      updatedCount: plan.updatedCount,
      priceChangedCount: plan.priceChangedCount,
      stockChangedCount: plan.stockChangedCount,
      valuationDelta: plan.valuationDelta,
      normalizedReason: plan.normalizedReason,
      plan,
      products: updatedProducts,
      triggeredAlerts,
      message: `Transaction ${plan.transactionId} applied to ${plan.selectedCount} product${
        plan.selectedCount === 1 ? '' : 's'
      } (${plan.priceChangedCount} price update${plan.priceChangedCount === 1 ? '' : 's'}, ${
        plan.stockChangedCount
      } stock adjustment${plan.stockChangedCount === 1 ? '' : 's'}).`,
    });
  }
);

// ── Serve Static Frontend & Generated Assets ──
const assetsDir = path.resolve(process.cwd(), 'src/assets');
app.use('/src/assets', express.static(assetsDir));

const staticDir = path.resolve(process.cwd(), 'src/main/resources/static');
app.use(express.static(staticDir));

app.get(['/admin', '/admin.html'], (_req, res) => {
  res.sendFile(path.join(staticDir, 'admin.html'));
});

app.get(['/user-login', '/login/user'], (_req, res) => {
  res.redirect('/login.html?switch=1&mode=user');
});

app.get(['/admin-login', '/login/admin'], (_req, res) => {
  res.redirect('/login.html?switch=1&mode=admin');
});

app.get(['/', '/orders', '/order-history'], (_req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Voltbox server listening on http://0.0.0.0:${PORT}`);
});

