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
} from './src/logic/inventory';

const PORT = Number(process.env.PORT) || 3000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '8853303342-j5l5dnn3okihtcifetfo1d0prg56ugu9.apps.googleusercontent.com';
const DONATE_URL = process.env.VOLTBOX_DONATE_URL || 'https://share.google/5TT6WxXqXBWnaoSIP';
const UPI_ID = process.env.VOLTBOX_UPI_ID || 'harishragavendran08@okaxis';
const DONATE_QR = process.env.VOLTBOX_DONATE_QR || 'donate-qr.jpeg';
const DONATE_IMAGES_RAW = process.env.VOLTBOX_DONATE_IMAGES || '';
const MAIL_READY = Boolean(process.env.VOLTBOX_MAIL_USERNAME && process.env.VOLTBOX_MAIL_PASSWORD);

const store = new Store();
const inventoryTransactions: InventoryTransactionEntity[] = [];
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

// ApiNoCacheFilter equivalent
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');
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

function signedInResponse(user: User) {
  return {
    ok: true,
    token: store.startSession(user),
    name: user.name,
    email: user.email,
  };
}

function splitDonateImages(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
}

// ── API Gateway Controller ──
app.get('/gateway/health', (_req, res) => {
  res.send('API gateway healthy');
});

app.get('/gateway/routes', (_req, res) => {
  res.json([
    '/api/products',
    '/api/inventory',
    '/api/cart',
    '/api/checkout',
    '/api/login',
    '/api/signup',
    '/ws/community',
  ]);
});

// ── Product Controller (mirrors com.voltbox.controller.ProductController & JPA ProductEntity) ──
function enrichProduct(p: ReturnType<typeof store.getProducts>[number]) {
  return {
    ...p,
    ...toProductJpaEntity(p),
  };
}

app.get('/api/products', (req, res) => {
  const categoryFilter = typeof req.query.category === 'string' ? req.query.category.trim().toLowerCase() : '';
  const groupFilter = typeof req.query.group === 'string' ? req.query.group.trim().toLowerCase() : '';
  const searchFilter = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const lowStockOnly = req.query.lowStock === 'true';

  const shelf = store
    .getProducts()
    .filter((p) => !p.takenDown)
    .map(enrichProduct)
    .filter((pe) => !categoryFilter || categoryFilter === 'all' || pe.category.toLowerCase() === categoryFilter)
    .filter((pe) => !groupFilter || groupFilter === 'all' || pe.componentGroup.toLowerCase() === groupFilter)
    .filter((pe) => !lowStockOnly || pe.lowStock)
    .filter((pe) => {
      if (!searchFilter) return true;
      const hay = `${pe.name} ${pe.title} ${pe.description || ''} ${pe.category} ${pe.componentGroup} ${pe.sku}`.toLowerCase();
      return hay.includes(searchFilter);
    });
  res.json(shelf);
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

app.post('/api/products/:id/inventory', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const id = Number.parseInt(String(req.params.id || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p || p.takenDown) return notFound(res, 'Product not found.');

  const prevQty = getProductQuantity(p);
  const rawTarget = req.body?.stockQuantity ?? req.body?.quantity ?? req.body?.stock;
  const rawDelta = req.body?.delta ?? req.body?.amount;

  let nextQty = prevQty;
  if (rawTarget !== undefined && !Number.isNaN(Number(rawTarget))) {
    nextQty = Math.max(0, Math.floor(Number(rawTarget)));
  } else if (rawDelta !== undefined && !Number.isNaN(Number(rawDelta))) {
    nextQty = Math.max(0, prevQty + Math.floor(Number(rawDelta)));
  } else {
    nextQty = prevQty + 3;
  }

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

app.get('/api/products/:id', (req, res) => {
  const id = Number.parseInt(String(req.params.id || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p || p.takenDown) return notFound(res, 'Product not found.');
  return res.json(enrichProduct(p));
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
  if (req.body?.price !== undefined && !Number.isNaN(Number(req.body.price)) && Number(req.body.price) > 0) {
    p.price = roundMoney(Number(req.body.price));
  }
  const rawQty = req.body?.stockQuantity ?? req.body?.quantity ?? req.body?.stock;
  if (rawQty !== undefined && !Number.isNaN(Number(rawQty))) {
    const nextQty = Math.max(0, Math.floor(Number(rawQty)));
    p.quantity = nextQty;
    p.stock = nextQty;
    p.lowStock = isLowStock({ quantity: nextQty });
  }
  store.save();

  const enriched = enrichProduct(p);
  broadcastToAll({ type: 'product-restocked', product: enriched, actor: user.name });
  return res.json(enriched);
});

app.patch('/api/products/:id/stock', (req, res) => {
  const user = userFromReq(req);
  if (!user) return notSignedIn(res);

  const id = Number.parseInt(String(req.params.id || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p || p.takenDown) return notFound(res, 'Product not found.');

  const rawQty = req.body?.stockQuantity ?? req.body?.quantity ?? req.body?.stock;
  if (rawQty === undefined || Number.isNaN(Number(rawQty))) {
    return badRequest(res, 'Provide stockQuantity or quantity.');
  }
  const prevQty = getProductQuantity(p);
  const nextQty = Math.max(0, Math.floor(Number(rawQty)));
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

  const addQty = Math.max(1, Math.min(50, Number(req.body?.amount) || 3));
  const prevQty = getProductQuantity(p);
  const nextQty = prevQty + addQty;
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
  let nextQty = prevQty;
  if (req.body?.quantity !== undefined && !Number.isNaN(Number(req.body.quantity))) {
    nextQty = Math.max(0, Math.floor(Number(req.body.quantity)));
  } else if (req.body?.delta !== undefined && !Number.isNaN(Number(req.body.delta))) {
    nextQty = Math.max(0, prevQty + Math.floor(Number(req.body.delta)));
  }

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

  const user = store.findByEmail(email);
  if (user && user.password === password) {
    return res.json(signedInResponse(user));
  }
  return res.status(401).json({ ok: false, message: 'Wrong email or password.' });
});

app.post('/api/google-login', async (req, res) => {
  const credential = typeof req.body?.credential === 'string' ? req.body.credential.trim() : '';
  if (!credential) {
    return badRequest(res, 'Missing Google credential.');
  }
  if (!GOOGLE_CLIENT_ID) {
    return badRequest(res, "Google sign-in isn't set up on this server yet.");
  }
  try {
    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!resp.ok) {
      return badRequest(res, "Couldn't verify that Google sign-in — try again.");
    }
    const payload = (await resp.json()) as Record<string, string>;
    if (payload.aud !== GOOGLE_CLIENT_ID) {
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
    }
    return res.json(signedInResponse(user));
  } catch {
    return badRequest(res, "Couldn't verify that Google sign-in — try again.");
  }
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

  return res.json({
    name: user.name,
    email: user.email,
    initial: store.getUserInitial(user),
    color: user.avatarColor,
    role: user.role,
    billEmail: user.billEmail,
    cart: user.cart || {},
    cartDetails,
    orderCount: (user.orders || []).length,
    mailReady: MAIL_READY,
    donateUrl: DONATE_URL,
    upiId: UPI_ID,
    donateQr: DONATE_QR,
    donateImages: splitDonateImages(DONATE_IMAGES_RAW),
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
    paymentMethod: 'Fake Pay',
    status: 'Pending',
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
      image: p.image,
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
      `Order checkout ${order.id}`
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

  const newestFirst = [...(user.orders || [])].reverse();
  return res.json(newestFirst);
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
        return res.json({ ok: true, id: o.id, status: o.status });
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
  const price = req.body?.price !== undefined ? Number(req.body.price) : -1;
  const rawQuantity = req.body?.quantity !== undefined ? Number(req.body.quantity) : 3;
  const quantity = Number.isNaN(rawQuantity) || rawQuantity < 0 ? 3 : Math.floor(rawQuantity);

  if (!title || !category) {
    return badRequest(res, 'A listing needs at least a title and a category.');
  }
  if (Number.isNaN(price) || price < 0) {
    return badRequest(res, 'Give it a price of zero or more.');
  }
  if (!image) {
    return badRequest(res, 'Add an image link for the listing — a photo of the part.');
  }
  if (!image.startsWith('http') && !image.startsWith('/')) {
    return badRequest(res, "That image link doesn't look right — it should start with https://");
  }

  const product = store.addProduct({
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

  const addQty = Math.max(1, Math.min(20, Number(req.body?.amount) || 3));
  const nextQty = getProductQuantity(p) + addQty;
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
    senderRole: user.role,
    senderColor: user.avatarColor,
    text: finalText,
    productId: linkedProduct ? linkedProduct.id : null,
    productTitle: linkedProduct ? linkedProduct.title : null,
    productPrice: linkedProduct ? linkedProduct.price : null,
    productSku: linkedProduct ? getProductSku(linkedProduct) : null,
    productImage: linkedProduct ? linkedProduct.image : null,
  });

  broadcastToAll({
    type: 'chat-message',
    message: created,
    onlineCount: Math.max(1, wsClients.size),
  });

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

  return res.json(metrics);
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

  const title = typeof (req.body?.title ?? req.body?.name) === 'string'
    ? String(req.body.title ?? req.body.name).trim()
    : '';
  const category = typeof req.body?.category === 'string' && req.body.category.trim()
    ? req.body.category.trim()
    : 'components';
  const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
  const rawImage = typeof req.body?.image === 'string' ? req.body.image.trim() : '';
  const image = rawImage || `/images/categories/${category.toLowerCase()}.svg`;
  const price = req.body?.price !== undefined ? Number(req.body.price) : 0;
  const rawQty = req.body?.stockQuantity ?? req.body?.quantity ?? 8;
  const quantity = Number.isNaN(Number(rawQty)) || Number(rawQty) < 0 ? 8 : Math.floor(Number(rawQty));
  const official = req.body?.official !== undefined ? Boolean(req.body.official) : isModerator(user);

  if (!title) {
    return badRequest(res, 'Product name/title is required.');
  }
  if (Number.isNaN(price) || price < 0) {
    return badRequest(res, 'Price must be zero or greater.');
  }

  const created = store.addProduct({
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

  const id = Number.parseInt(String(req.params.id || ''), 10);
  const p = Number.isNaN(id) ? null : store.findProduct(id);
  if (!p) return notFound(res, 'Product not found.');

  const prevQty = getProductQuantity(p);
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
  if (req.body?.price !== undefined && !Number.isNaN(Number(req.body.price)) && Number(req.body.price) >= 0) {
    p.price = roundMoney(Number(req.body.price));
  }
  if (req.body?.official !== undefined) {
    p.official = Boolean(req.body.official);
  }
  if (req.body?.takenDown !== undefined) {
    p.takenDown = Boolean(req.body.takenDown);
  }

  const rawQty = req.body?.stockQuantity ?? req.body?.quantity ?? req.body?.stock;
  if (rawQty !== undefined && !Number.isNaN(Number(rawQty))) {
    const nextQty = Math.max(0, Math.floor(Number(rawQty)));
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

// ── Serve Static Frontend & Generated Assets ──
const assetsDir = path.resolve(process.cwd(), 'src/assets');
app.use('/src/assets', express.static(assetsDir));

const staticDir = path.resolve(process.cwd(), 'src/main/resources/static');
app.use(express.static(staticDir));

app.get(['/admin', '/admin.html'], (_req, res) => {
  res.sendFile(path.join(staticDir, 'admin.html'));
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Voltbox server listening on http://0.0.0.0:${PORT}`);
});

