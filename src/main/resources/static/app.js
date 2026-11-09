var TAX_RATE = 0.0825;
var RIG_BUNDLE_RATE = 0.05;
var PROMO_MAP = {
  VOLT10: { code: "VOLT10", rate: 0.10, label: "10% Off (VOLT10)" },
  BUILDER5: { code: "BUILDER5", rate: 0.05, label: "5% Off (BUILDER5)" }
};

var NO_IMAGE =
  "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">' +
    '<rect width="400" height="400" fill="#22262f"/>' +
    '<text x="50%" y="50%" fill="#9aa1ad" font-family="sans-serif" ' +
    'font-size="22" text-anchor="middle" dominant-baseline="middle">no image</text></svg>');

var STORE = {
  name:    "VOLTBOX",
  tagline: "ELECTRONICS & GADGETS",
  address: "42 Circuit Lane, Silicon Bay",
  phone:   "(555) 010-VOLT",
};

// ── state ──
var cart = {};
var products = [];
var wishlist = [];
var priceAlerts = [];
var activePriceAlertProductId = null;
var me = null;
var shownOrder = null;
var saveTimer = null;
var activeCategoryFilter = "all";
var activeSortMode = "featured";
var activeBudgetMax = null;
var activeStockFilter = "all";
var activeCatalogView = "grid";
var activePromoCode = null;
var expandedCharts = {};
var activeSpecProductId = null;
var toastTimer = null;
var QR_SCAN_HISTORY_STORAGE_KEY = "voltbox_qr_scan_history";
var MAX_QR_SCAN_HISTORY = 10;
var qrScanHistory = [];

// ── grab DOM elements once ──
var gridEl      = document.getElementById("product-grid");
var loadingEl   = document.getElementById("loading");
var searchEl    = document.getElementById("product-search");
var subEl       = document.getElementById("subtotal");
var taxEl       = document.getElementById("tax");
var totalEl     = document.getElementById("total");
var checkoutEl  = document.getElementById("checkout-btn");
var orderBarEl  = document.getElementById("order-bar");

// filter, sort, promo & rig builder controls
var filterBarEl       = document.getElementById("category-filters");
var sortSelectEl      = document.getElementById("sort-select");
var rigBuilderBtnEl   = document.getElementById("rig-builder-btn");
var rigBuilderCountEl = document.getElementById("rig-builder-count");
var promoInputEl      = document.getElementById("promo-code-input");
var promoApplyBtnEl   = document.getElementById("promo-apply-btn");
var promoStatusNoteEl = document.getElementById("promo-status-note");
var discountRowEl     = document.getElementById("discount-row");
var discountLabelEl   = document.getElementById("discount-label");
var discountAmountEl  = document.getElementById("discount-amount");

// drawers & live toast
var rigDrawerOverlayEl  = document.getElementById("rig-drawer-overlay");
var rigDrawerCloseEl    = document.getElementById("rig-drawer-close");
var rigSlotsListEl      = document.getElementById("rig-slots-list");
var rigBannerTitleEl    = document.getElementById("rig-banner-title");
var rigBannerFractionEl = document.getElementById("rig-banner-fraction");
var rigMeterFillEl      = document.getElementById("rig-meter-fill");
var rigBannerSubEl      = document.getElementById("rig-banner-sub");
var rigBundleBannerEl   = document.getElementById("rig-bundle-banner");

var specDrawerOverlayEl = document.getElementById("spec-drawer-overlay");
var specDrawerCloseEl   = document.getElementById("spec-drawer-close");

var activityToastEl     = document.getElementById("live-activity-toast");
var activityTextEl      = document.getElementById("live-activity-text");

// cart panel
var cartBtnEl      = document.getElementById("cart-btn");
var cartSheetEl    = document.getElementById("cart-sheet");
var cartBadgeEl    = document.getElementById("cart-badge");
var cartLinesEl    = document.getElementById("cart-lines");
var cartHeadNoteEl = document.getElementById("cart-head-note");
var cartSheetTotEl = document.getElementById("cart-sheet-total");
var cartSheetGoEl  = document.getElementById("cart-sheet-checkout");

// profile panel
var avatarBtnEl     = document.getElementById("avatar-btn");
var profileSheetEl  = document.getElementById("profile-sheet");
var avatarEl        = document.getElementById("avatar");
var avatarBigEl     = document.getElementById("avatar-big");
var profileNameEl   = document.getElementById("profile-name");
var profileEmailEl  = document.getElementById("profile-email");
var billInputEl     = document.getElementById("bill-email-input");
var billSaveEl      = document.getElementById("bill-email-save");
var billMsgEl       = document.getElementById("bill-email-msg");
var billNoteEl      = document.getElementById("bill-email-note");
var historyToggleEl = document.getElementById("history-toggle");
var historyCountEl  = document.getElementById("history-count");
var historyListEl   = document.getElementById("history-list");
var historyChevEl   = document.getElementById("history-chevron");
var logoutEl        = document.getElementById("logout-btn");

// receipt elements
var overlayEl         = document.getElementById("receipt-overlay");
var receiptPaperEl    = document.getElementById("receipt-paper");
var receiptBodyEl     = document.getElementById("receipt-body");
var receiptCloseEl    = document.getElementById("receipt-close");
var receiptPrintEl    = document.getElementById("receipt-print");
var receiptDownloadEl = document.getElementById("receipt-download");
var receiptEmailEl    = document.getElementById("receipt-email");
var receiptMsgEl      = document.getElementById("receipt-msg");

// checkout modal
var checkoutOverlayEl = document.getElementById("checkout-overlay");
var checkoutCloseEl   = document.getElementById("checkout-close");
var checkoutFormEl    = document.getElementById("checkout-form");
var checkoutSuccessEl = document.getElementById("checkout-success");
var checkoutNameEl    = document.getElementById("checkout-name");
var checkoutAddressEl = document.getElementById("checkout-address");
var checkoutCardNumEl = document.getElementById("checkout-card-number");
var checkoutExpiryEl  = document.getElementById("checkout-card-expiry");
var checkoutCvvEl     = document.getElementById("checkout-card-cvv");
var checkoutMsgEl     = document.getElementById("checkout-msg");
var checkoutPayEl     = document.getElementById("checkout-pay");


// Bench Messenger, Quantum FX, PWA & Mobile Dock elements
var bgFxBtnEl            = document.getElementById("bg-fx-btn");
var bgFxLabelEl          = document.getElementById("bg-fx-label");
var pwaInstallBtnEl      = document.getElementById("pwa-install-btn");
var pwaInstallOverlayEl  = document.getElementById("pwa-install-overlay");
var pwaInstallCloseEl    = document.getElementById("pwa-install-close");
var pwaNativeTriggerEl   = document.getElementById("pwa-native-install-btn") || document.getElementById("pwa-native-trigger");
var offlineBannerEl      = document.getElementById("offline-banner");

var messengerBtnEl       = document.getElementById("messenger-btn");
var messengerBadgeEl     = document.getElementById("messenger-badge");
var messengerOverlayEl   = document.getElementById("messenger-overlay");
var messengerCloseEl     = document.getElementById("messenger-close");
var messengerChannelsEl  = document.getElementById("messenger-channels");
var messengerChipsEl     = document.getElementById("messenger-quick-chips");
var messengerFeedEl      = document.getElementById("messenger-feed");
var messengerOnlineEl    = document.getElementById("messenger-online-pill") || document.getElementById("messenger-online-label");
var messengerFormEl      = document.getElementById("messenger-form");
var chatProductSelectEl  = document.getElementById("chat-product-select");
var chatMessageInputEl   = document.getElementById("chat-input") || document.getElementById("chat-message-input");
var chatSendBtnEl        = document.getElementById("chat-send-btn");

var orderExpandToggleEl  = document.getElementById("order-expand-toggle");
var mobileAppNavEl       = document.getElementById("mobile-app-nav");
var mnavRigCountEl       = document.getElementById("mnav-rig-count");
var mnavMsgBadgeEl       = document.getElementById("mnav-msg-badge");
var mnavCartBadgeEl      = document.getElementById("mnav-cart-badge");

var chatMessages = [];
var activeChatChannel = "engineering-desk";
var unreadChatCount = 0;
var isMessengerOpen = false;
var bgModes = ["quantum", "overclock", "cyber"];
var bgModeLabels = { quantum: "Theme: Obsidian", overclock: "Theme: Sapphire", cyber: "Theme: Titanium" };
var currentBgModeIdx = 0;
var deferredPwaPrompt = null;

// ── kick things off ──

document.addEventListener("DOMContentLoaded", function () {
  wireUpButtons();
  initMomentumDrawers();
  watchScroll();
  watchCursorSpotlight();
  initQuantumCanvasBg();
  initPwaExperience();
  loadMe();
});

var signalBurstTimer = null;
function triggerPerimeterSignalPulse() {
  if (!document.body) return;
  document.body.classList.remove("signal-burst");
  void document.body.offsetWidth;
  document.body.classList.add("signal-burst");
  if (typeof window.triggerVoltboxShockwave === "function") {
    window.triggerVoltboxShockwave();
  }
  clearTimeout(signalBurstTimer);
  signalBurstTimer = setTimeout(function () {
    document.body.classList.remove("signal-burst");
  }, 950);
}

function watchCursorSpotlight() {
  var rafPending = false;
  var lastX = window.innerWidth * 0.5;
  var lastY = window.innerHeight * 0.35;
  window.addEventListener("mousemove", function (e) {
    lastX = e.clientX;
    lastY = e.clientY;
    if (!rafPending) {
      rafPending = true;
      window.requestAnimationFrame(function () {
        document.documentElement.style.setProperty("--mouse-x", lastX + "px");
        document.documentElement.style.setProperty("--mouse-y", lastY + "px");
        rafPending = false;
      });
    }
  }, { passive: true });
}


function myToken() {
  return localStorage.getItem("voltbox_token") || "";
}

function api(path, options) {
  options = options || {};
  options.headers = options.headers || {};
  options.headers["Authorization"] = "Bearer " + myToken();
  if (options.body) {
    options.headers["Content-Type"] = "application/json";
  }
  return fetch(path, options);
}


// ── who's signed in? ──

var DEFAULT_DEMO_TOKEN = "ed4a9555-540b-4bb9-a406-b353acded905";

function loadMe(retriedWithDemoToken) {
  api("/api/me")
    .then(function (res) {
      if (res.status === 401) {
        if (sessionStorage.getItem("voltbox_signed_out") === "1") {
          forgetAndGoToLogin();
          return null;
        }
        if (!retriedWithDemoToken) {
          localStorage.setItem("voltbox_token", DEFAULT_DEMO_TOKEN);
          localStorage.setItem("voltbox_user", "Harish");
          loadMe(true);
          return null;
        }
        forgetAndGoToLogin();
        return null;
      }
      if (!res.ok) return null;
      return res.json();
    })
    .then(function (data) {
      if (!data) return;
      me = data;
      cart = data.cart || {};
      wishlist = Array.isArray(data.wishlist) ? data.wishlist : [];
      priceAlerts = Array.isArray(data.priceAlerts) ? data.priceAlerts : [];
      if (data.cartDetails) {
        window.serverCartState = data.cartDetails;
      }
      paintProfile();
      paintWishlist();
      paintPriceAlerts();
      fetchProducts();
      fetchCart();
      fetchInventorySummary();
      if (window.onMeLoaded) window.onMeLoaded();
    })
    .catch(function (err) {
      console.warn("Account session check note:", err);
    });
}

function fetchCart(promoOverride) {
  var code = promoOverride !== undefined ? promoOverride : activePromoCode;
  var url = "/api/cart" + (code ? ("?promoCode=" + encodeURIComponent(code)) : "");
  return api(url, { method: "GET" })
    .then(function (res) {
      if (!res.ok) return null;
      return res.json();
    })
    .then(function (data) {
      if (!data) return null;
      var serverCart = data.cart || data;
      if (serverCart && typeof serverCart === "object") {
        window.serverCartState = serverCart;
      }
      if (data.rawCart && typeof data.rawCart === "object") {
        cart = data.rawCart;
      } else if (serverCart && serverCart.rawMap && typeof serverCart.rawMap === "object") {
        cart = serverCart.rawMap;
      }
      if (products.length > 0) {
        for (var i = 0; i < products.length; i++) {
          refreshCard(products[i].id);
        }
        recalc(false);
      }
      return serverCart;
    })
    .catch(function (err) {
      console.error("couldn't fetch cart from /api/cart:", err);
      return null;
    });
}

function fetchInventorySummary() {
  return fetch("/api/inventory")
    .then(function (res) {
      if (!res.ok) return null;
      return res.json();
    })
    .then(function (summary) {
      if (summary && summary.ok) {
        window.voltboxInventorySummary = summary;
      }
      return summary;
    })
    .catch(function () { return null; });
}

function isCurrentUserAdmin() {
  return Boolean(me && (me.isAdmin || me.role === "moderator" || me.role === "admin"));
}

function canCurrentUserRestock() {
  return Boolean(me && (me.isAdmin || me.role === "moderator" || me.role === "admin" || me.role === "contributor"));
}

function paintProfile() {
  avatarEl.textContent = me.initial;
  avatarBigEl.textContent = me.initial;
  avatarEl.style.background = me.color;
  avatarBigEl.style.background = me.color;

  profileNameEl.textContent = me.name;
  profileEmailEl.textContent = me.email;

  var isAdmin = isCurrentUserAdmin();
  localStorage.setItem("voltbox_role", me.role || "member");

  var adminConsoleLinkEl = document.getElementById("admin-console-link");
  if (adminConsoleLinkEl) {
    adminConsoleLinkEl.hidden = !isAdmin;
  }

  var catalogBatchEditBtnEl = document.getElementById("catalog-batch-edit-btn");
  if (catalogBatchEditBtnEl) {
    catalogBatchEditBtnEl.hidden = !isAdmin;
  }

  var adminDropEl = document.getElementById("admin-drop");
  if (adminDropEl) {
    adminDropEl.hidden = !canCurrentUserRestock();
  }

  var roleBadgeEl = document.getElementById("topbar-role-badge");
  var roleLabelEl = document.getElementById("topbar-role-label");
  var roleLedEl   = document.getElementById("topbar-role-led");
  if (roleLabelEl) {
    roleLabelEl.textContent = isAdmin ? "Admin Login" : "User Login";
  }
  if (roleLedEl) {
    roleLedEl.className = isAdmin ? "led-dot amber" : "led-dot emerald";
  }
  if (roleBadgeEl) {
    roleBadgeEl.href = isAdmin ? "login.html?switch=1&mode=user" : "login.html?switch=1&mode=admin";
    roleBadgeEl.setAttribute("data-role", isAdmin ? "admin" : "user");
  }

  var profileRolePillEl = document.getElementById("profile-role-pill");
  if (profileRolePillEl) {
    profileRolePillEl.textContent = isAdmin ? "Admin" : "User";
    profileRolePillEl.className = isAdmin ? "profile-role-pill admin" : "profile-role-pill user";
  }

  var profileAdminShortcutEl = document.getElementById("profile-admin-shortcut");
  if (profileAdminShortcutEl) {
    profileAdminShortcutEl.hidden = !isAdmin;
  }

  billInputEl.value = me.billEmail || "";
  paintHistoryCount(me.orderCount);
  paintWishlist();

  if (!me.mailReady) {
    billNoteEl.textContent =
      "Emailing bills isn't switched on for this shop yet — you can still " +
      "save an address here for when it is.";
  }
}

function paintHistoryCount(n) {
  var countNum = Number(n) || 0;
  if (historyCountEl) {
    historyCountEl.textContent = countNum + (countNum === 1 ? " bill" : " bills");
  }
  var topbarOrdersBadge = document.getElementById("topbar-orders-badge");
  if (topbarOrdersBadge) {
    topbarOrdersBadge.textContent = String(countNum);
    topbarOrdersBadge.hidden = false;
  }
}

function isProductInWishlist(productId) {
  var id = Number(productId);
  return wishlist.indexOf(id) !== -1;
}

function updateWishlistCardButtons(productId, isIn) {
  var cardBtn = document.getElementById("wishlist-btn-" + productId);
  if (cardBtn) {
    cardBtn.classList.toggle("active", isIn);
    cardBtn.setAttribute("aria-label", isIn ? "Remove from wishlist" : "Add to wishlist");
    cardBtn.setAttribute("title", isIn ? "Remove from wishlist" : "Save to wishlist");
    var svg = cardBtn.querySelector("svg");
    if (svg) {
      svg.style.fill = isIn ? "#f43f5e" : "none";
    }
  }
  var drawerBtn = document.getElementById("spec-wishlist-btn");
  if (drawerBtn && activeSpecProductId === productId) {
    drawerBtn.classList.toggle("active", isIn);
    drawerBtn.innerHTML = icon("heart", 15) + " <span>" + (isIn ? "Saved to Wishlist" : "Add to Wishlist") + "</span>";
    var dSvg = drawerBtn.querySelector("svg");
    if (dSvg) {
      dSvg.style.fill = isIn ? "#f43f5e" : "none";
    }
  }
}

function toggleWishlist(e, productId) {
  if (e) {
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
  }
  var id = Number(productId);
  var prod = findProductById(id);
  var wasIn = isProductInWishlist(id);

  return api("/api/wishlist/toggle", {
    method: "POST",
    body: JSON.stringify({ productId: id })
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && Array.isArray(data.wishlist)) {
        wishlist = data.wishlist;
      } else {
        if (wasIn) {
          wishlist = wishlist.filter(function (x) { return x !== id; });
        } else {
          wishlist.push(id);
        }
      }
      var nowIn = isProductInWishlist(id);
      updateWishlistCardButtons(id, nowIn);
      paintWishlist();
      updateFilterTabCounts();
      if (activeCategoryFilter === "wishlist") {
        applyFiltersAndSearch();
      }
      var title = prod ? prod.title : ("Part #" + id);
      if (typeof showWishlistToast === "function") {
        showWishlistToast(prod || { id: id, title: title, price: 0 }, nowIn, wishlist.length);
      } else {
        showActivityToast(nowIn ? ("Saved to Wishlist: " + title) : ("Removed from Wishlist: " + title));
      }
      return data;
    })
    .catch(function (err) {
      console.error("couldn't toggle wishlist:", err);
    });
}

function paintWishlist() {
  var countEl = document.getElementById("profile-wishlist-count");
  var filterCountEl = document.getElementById("wishlist-filter-count");
  var listEl = document.getElementById("profile-wishlist-list");
  var actionsEl = document.getElementById("profile-wishlist-actions");

  var count = wishlist.length;
  if (countEl) {
    countEl.textContent = count + " saved";
  }
  if (filterCountEl) {
    filterCountEl.textContent = String(count);
  }

  if (!listEl) return;

  if (count === 0) {
    listEl.innerHTML =
      '<p class="sheet-empty">Your personal wishlist is empty.<br/><small>Click the heart icon on any hardware part to save it here.</small></p>';
    if (actionsEl) actionsEl.hidden = true;
    return;
  }

  if (actionsEl) actionsEl.hidden = false;
  var html = "";
  for (var i = 0; i < wishlist.length; i++) {
    var p = findProductById(wishlist[i]);
    if (!p) continue;
    var stock = getEffectiveStock(p);
    var low = isLowStockItem(p);
    var img = (p.image && (p.image.indexOf("http") === 0 || p.image.indexOf("/") === 0)) ? p.image : tileFor(p.category);
    html +=
      '<div class="wishlist-item" data-product-id="' + p.id + '">' +
        '<img class="wishlist-thumb" src="' + esc(img) + '" alt="" onerror="this.onerror=null;this.src=NO_IMAGE" />' +
        '<div class="wishlist-item-main" onclick="openSpecDrawer(' + p.id + ')">' +
          '<strong class="wishlist-item-title">' + esc(p.title) + '</strong>' +
          '<div class="wishlist-item-meta">' +
            '<span class="wishlist-item-price">$' + p.price.toFixed(2) + '</span>' +
            '<span class="wishlist-item-stock ' + (low ? 'low' : '') + '">' + (stock > 0 ? (stock + ' in stock') : 'Out of stock') + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="wishlist-item-actions">' +
          '<button type="button" class="wishlist-cart-btn" onclick="inc(' + p.id + '); showActivityToast(\'Added ' + esc(p.title).replace(/'/g, "\\'") + ' to cart\');" title="Add to cart" aria-label="Add to cart">' +
            icon("cart", 13) +
          '</button>' +
          '<button type="button" class="wishlist-remove-btn" onclick="toggleWishlist(event, ' + p.id + ')" title="Remove from wishlist" aria-label="Remove ' + esc(p.title) + ' from wishlist">&times;</button>' +
        '</div>' +
      '</div>';
  }
  listEl.innerHTML = html;
}

function toggleWishlistPanel() {
  var panel = document.getElementById("profile-wishlist-panel");
  var toggle = document.getElementById("wishlist-toggle");
  var chev = document.getElementById("wishlist-chevron");
  if (!panel || !toggle) return;
  var opening = panel.hidden;
  panel.hidden = !opening;
  toggle.setAttribute("aria-expanded", opening ? "true" : "false");
  if (chev) chev.classList.toggle("up", opening);
}

// ── 'Notify Me' Price Drop Email Alert Helpers & Modal Controller ──

function getPriceAlertForProduct(productId) {
  var id = Number(productId);
  if (!Array.isArray(priceAlerts)) return null;
  for (var i = 0; i < priceAlerts.length; i++) {
    if (Number(priceAlerts[i].productId) === id) {
      return priceAlerts[i];
    }
  }
  return null;
}

function isProductInPriceAlerts(productId) {
  return Boolean(getPriceAlertForProduct(productId));
}

function updatePriceAlertCardButtons(productId) {
  var id = Number(productId);
  var alertSub = getPriceAlertForProduct(id);
  var isActive = Boolean(alertSub);
  var p = findProductById(id);
  var pTitle = p ? p.title : ("Component #" + id);

  var cardBellBtn = document.getElementById("notify-btn-" + id);
  if (cardBellBtn) {
    cardBellBtn.classList.toggle("active", isActive);
    cardBellBtn.classList.toggle("triggered", Boolean(alertSub && alertSub.triggered));
    var bellTitle = isActive
      ? ("Price Alert active: Notify at $" + Number(alertSub.targetPrice).toFixed(2) + " (" + alertSub.email + ")")
      : ("Notify Me when price drops for " + pTitle);
    cardBellBtn.setAttribute("title", bellTitle);
    cardBellBtn.setAttribute("aria-label", bellTitle);
    cardBellBtn.setAttribute("aria-pressed", isActive ? "true" : "false");
    cardBellBtn.innerHTML =
      icon(isActive ? "bell-ring" : "bell", 14) +
      '<span class="notify-btn-label">' +
        (isActive ? ("Alert &lt; $" + Number(alertSub.targetPrice).toFixed(0)) : "Notify Me") +
      '</span>';
  }

  var drawerNotifyBtn = document.getElementById("spec-notify-btn");
  if (drawerNotifyBtn && activeSpecProductId === id) {
    drawerNotifyBtn.classList.toggle("active", isActive);
    drawerNotifyBtn.innerHTML =
      icon(isActive ? "bell-ring" : "bell", 15) +
      " <span>" +
        (isActive ? ("Alert Set (&lt; $" + Number(alertSub.targetPrice).toFixed(2) + ")") : "Notify Me") +
      "</span>";
  }
}

function paintPriceAlerts() {
  var countEl = document.getElementById("profile-price-alerts-count");
  var listEl = document.getElementById("profile-price-alerts-list");
  var count = Array.isArray(priceAlerts) ? priceAlerts.length : 0;

  if (countEl) {
    countEl.textContent = count + " active";
  }
  if (!listEl) return;

  if (count === 0) {
    listEl.innerHTML =
      '<p class="sheet-empty">No price drop alerts set.<br/><small>Click the Notify Me bell icon on any component to get emailed when the price drops.</small></p>';
    return;
  }

  var html = "";
  for (var i = 0; i < priceAlerts.length; i++) {
    var al = priceAlerts[i];
    var p = findProductById(al.productId);
    var title = p ? p.title : (al.productTitle || ("Component #" + al.productId));
    var currentP = p ? p.price : (al.priceAtCreation || al.targetPrice);
    var img = p ? getProductImageUrl(p) : tileFor("components");
    var statusText = al.triggered
      ? ('Triggered at $' + Number(al.triggeredPrice || currentP).toFixed(2))
      : ('Target: &lt; $' + Number(al.targetPrice).toFixed(2));

    var isExp = al.isExpired === true || (al.expiresAt && Date.now() > Number(al.expiresAt));
    var expiryBadge = "";
    if (isExp) {
      expiryBadge = '<span class="price-alert-expiry-badge expired" data-testid="price-alert-expired-badge">⚠️ Expired</span>';
    } else if (al.expiresAt) {
      var expD = new Date(Number(al.expiresAt));
      var expStr = expD.toISOString().split("T")[0];
      expiryBadge = '<span class="price-alert-expiry-badge active">Until ' + expStr + '</span>';
    }

    html +=
      '<div class="wishlist-item price-alert-sheet-item" data-product-id="' + al.productId + '">' +
        '<img class="wishlist-thumb" src="' + esc(img) + '" alt="" onerror="this.onerror=null;this.src=NO_IMAGE" />' +
        '<div class="wishlist-item-main" onclick="closeAllSheets(); openPriceAlertModal(null, ' + al.productId + ')">' +
          '<strong class="wishlist-item-title">' + esc(title) + '</strong>' +
          '<div class="wishlist-item-meta">' +
            '<span class="wishlist-item-price">' + statusText + '</span>' +
            expiryBadge +
            '<span class="wishlist-item-stock">' + esc(al.email) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="wishlist-item-actions">' +
          '<button type="button" class="wishlist-remove-btn" onclick="removePriceAlert(' + al.productId + ')" title="Remove price alert" aria-label="Remove price alert for ' + esc(title) + '">&times;</button>' +
        '</div>' +
      '</div>';
  }
  listEl.innerHTML = html;
}

function togglePriceAlertsPanel() {
  var panel = document.getElementById("profile-price-alerts-panel");
  var toggle = document.getElementById("price-alerts-toggle");
  var chev = document.getElementById("price-alerts-chevron");
  if (!panel || !toggle) return;
  var opening = panel.hidden;
  panel.hidden = !opening;
  toggle.setAttribute("aria-expanded", opening ? "true" : "false");
  if (chev) chev.classList.toggle("up", opening);
}

function evaluateThresholdVsHistory(history, currentPrice, targetPrice) {
  var cur = Math.max(0.01, round(Number(currentPrice) || 100));
  var tgt = Math.max(0.01, round(Number(targetPrice) || cur));
  var validPrices = Array.isArray(history) && history.length > 0
    ? history.map(function (h) { return round(Number(h.price) || cur); }).filter(function (v) { return v > 0; })
    : [cur];
  var prices = validPrices.length > 0 ? validPrices : [cur];
  var sixMonthLow = round(Math.min.apply(null, prices));
  var sixMonthHigh = round(Math.max.apply(null, prices));
  var sum = 0;
  var monthsAtOrBelowTarget = 0;
  for (var i = 0; i < prices.length; i++) {
    sum += prices[i];
    if (prices[i] <= tgt + 0.01) monthsAtOrBelowTarget++;
  }
  var sixMonthAvg = round(sum / prices.length);
  var totalMonths = prices.length;
  var diffFromLow = round(tgt - sixMonthLow);

  if (tgt >= cur) {
    return {
      sixMonthLow: sixMonthLow,
      sixMonthHigh: sixMonthHigh,
      sixMonthAvg: sixMonthAvg,
      monthsAtOrBelowTarget: monthsAtOrBelowTarget,
      totalMonths: totalMonths,
      likelihoodTier: "instant-trigger",
      badgeLabel: "Instant Trigger",
      guidanceText: "Target ($" + tgt.toFixed(2) + ") is at or above current price ($" + cur.toFixed(2) + ") — alert triggers immediately."
    };
  }
  if (tgt < sixMonthLow - 0.05) {
    var belowBy = Math.abs(diffFromLow);
    return {
      sixMonthLow: sixMonthLow,
      sixMonthHigh: sixMonthHigh,
      sixMonthAvg: sixMonthAvg,
      monthsAtOrBelowTarget: monthsAtOrBelowTarget,
      totalMonths: totalMonths,
      likelihoodTier: "aggressive-below-low",
      badgeLabel: "Below 6M Low",
      guidanceText: "$" + belowBy.toFixed(2) + " below the 6-month floor ($" + sixMonthLow.toFixed(2) + "). Consider $" + sixMonthLow.toFixed(2) + " for a higher hit rate."
    };
  }
  if (Math.abs(tgt - sixMonthLow) <= Math.max(1.5, cur * 0.015) || monthsAtOrBelowTarget === 1) {
    return {
      sixMonthLow: sixMonthLow,
      sixMonthHigh: sixMonthHigh,
      sixMonthAvg: sixMonthAvg,
      monthsAtOrBelowTarget: Math.max(1, monthsAtOrBelowTarget),
      totalMonths: totalMonths,
      likelihoodTier: "near-6m-low",
      badgeLabel: "6M Floor Sweet Spot",
      guidanceText: "Matches the 6-month historical floor ($" + sixMonthLow.toFixed(2) + ") — optimal balance of maximum savings and realistic fill."
    };
  }
  return {
    sixMonthLow: sixMonthLow,
    sixMonthHigh: sixMonthHigh,
    sixMonthAvg: sixMonthAvg,
    monthsAtOrBelowTarget: monthsAtOrBelowTarget,
    totalMonths: totalMonths,
    likelihoodTier: "high-probability",
    badgeLabel: "High Likelihood",
    guidanceText: "Reached in " + monthsAtOrBelowTarget + " of " + totalMonths + " months ($" + diffFromLow.toFixed(2) + " above 6M low of $" + sixMonthLow.toFixed(2) + ")."
  };
}

function renderPriceAlertSparkline(p, targetVal) {
  if (!p) return;
  var history = getPriceHistoryFor(p);
  var targetNum = parseFloat(targetVal);
  var cleanTarget = (!isNaN(targetNum) && targetNum > 0) ? round(targetNum) : round(p.price * 0.95);
  var insight = evaluateThresholdVsHistory(history, p.price, cleanTarget);

  var lowEl = document.getElementById("price-alert-spark-low");
  var avgEl = document.getElementById("price-alert-spark-avg");
  var highEl = document.getElementById("price-alert-spark-high");
  var badgeEl = document.getElementById("price-alert-likelihood-badge");
  var insightEl = document.getElementById("price-alert-sparkline-insight");
  var mountEl = document.getElementById("price-alert-sparkline-mount");

  if (lowEl) lowEl.textContent = "$" + insight.sixMonthLow.toFixed(2);
  if (avgEl) avgEl.textContent = "$" + insight.sixMonthAvg.toFixed(2);
  if (highEl) highEl.textContent = "$" + insight.sixMonthHigh.toFixed(2);
  if (badgeEl) {
    badgeEl.textContent = insight.badgeLabel;
    badgeEl.className = "price-alert-likelihood-badge tier-" + insight.likelihoodTier;
  }
  if (insightEl) {
    insightEl.textContent = insight.guidanceText;
  }
  if (mountEl && typeof window.renderVoltboxPriceChart === "function") {
    window.renderVoltboxPriceChart(mountEl, history, {
      variant: "alert-sparkline",
      accentColor: "#38bdf8",
      targetPrice: cleanTarget,
      height: 124
    });
  }
}

function updatePriceAlertSavingsCallout(currentPrice, targetVal, emailVal) {
  var calloutTextEl = document.getElementById("price-alert-savings-text");
  if (!calloutTextEl) return;
  var target = parseFloat(targetVal);
  var recipient = (emailVal && emailVal.trim()) ? emailVal.trim() : ((me && (me.billEmail || me.email)) || "your email");
  if (isNaN(target) || target <= 0) {
    calloutTextEl.textContent = "Enter a valid target price threshold above $0.00.";
    return;
  }
  if (target < currentPrice) {
    var diff = round(currentPrice - target);
    var pct = Math.max(1, Math.round((diff / currentPrice) * 100));
    calloutTextEl.innerHTML =
      "We'll email <b>" + esc(recipient) + "</b> as soon as this part drops to <b>$" +
      target.toFixed(2) + "</b> — saving you <b>$" + diff.toFixed(2) + " (" + pct + "% off)</b>.";
  } else {
    calloutTextEl.innerHTML =
      "Current price ($" + currentPrice.toFixed(2) + ") is already at or below <b>$" +
      target.toFixed(2) + "</b> — setting this alert will dispatch an instant email to <b>" + esc(recipient) + "</b>!";
  }
}

function renderPriceAlertEmailPreview(notification) {
  var previewBox = document.getElementById("price-alert-email-preview");
  if (!previewBox) return;
  if (!notification) {
    previewBox.hidden = true;
    return;
  }
  var toEl = document.getElementById("price-alert-email-to");
  var subjEl = document.getElementById("price-alert-email-subject");
  var bodyEl = document.getElementById("price-alert-email-body");
  if (toEl) toEl.textContent = "To: " + (notification.toEmail || "");
  if (subjEl) subjEl.textContent = notification.subject || "Price Drop Alert";
  if (bodyEl) bodyEl.textContent = notification.body || "";
  previewBox.hidden = false;
}

function openPriceAlertModal(e, productId) {
  if (e) {
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
  }
  var id = Number(productId);
  var p = findProductById(id);
  if (!p) return;

  activePriceAlertProductId = id;
  var overlay = document.getElementById("price-alert-overlay");
  if (!overlay) return;

  var existing = getPriceAlertForProduct(id);
  var sku = getSkuFor(p);
  var history = getPriceHistoryFor(p);
  var prices = history.map(function (h) { return h.price; });
  var min6m = Math.min.apply(null, prices);

  var imgEl = document.getElementById("price-alert-prod-img");
  var skuEl = document.getElementById("price-alert-prod-sku");
  var titleEl = document.getElementById("price-alert-prod-title");
  var curValEl = document.getElementById("price-alert-current-val");
  var lowValEl = document.getElementById("price-alert-low-val");
  var thresholdInput = document.getElementById("price-alert-threshold-input");
  var emailInput = document.getElementById("price-alert-email-input");
  var saveLabelEl = document.getElementById("price-alert-save-label");
  var removeBtnEl = document.getElementById("price-alert-remove-btn");
  var msgEl = document.getElementById("price-alert-msg");
  var presetsGridEl = document.getElementById("price-alert-presets-grid");

  if (imgEl) {
    imgEl.src = getProductImageUrl(p);
    imgEl.alt = p.title;
  }
  if (skuEl) skuEl.textContent = sku;
  if (titleEl) titleEl.textContent = p.title;
  if (curValEl) curValEl.textContent = "$" + p.price.toFixed(2);
  if (lowValEl) lowValEl.textContent = "$" + min6m.toFixed(2);

  var defaultThreshold = existing
    ? Number(existing.targetPrice)
    : Math.max(1, round(p.price * 0.95));
  var defaultEmail = existing && existing.email
    ? existing.email
    : ((me && (me.billEmail || me.email)) || "harish@voltbox.test");

  if (thresholdInput) thresholdInput.value = defaultThreshold.toFixed(2);
  if (emailInput) emailInput.value = defaultEmail;
  if (saveLabelEl) saveLabelEl.textContent = existing ? "Update Price Alert" : "Set Price Drop Alert";
  if (removeBtnEl) removeBtnEl.hidden = !existing;
  if (msgEl) msgEl.hidden = true;
  renderPriceAlertEmailPreview(null);

  // Initialize Expiry Date input & status
  var expiryInput = document.getElementById("price-alert-expiry-input");
  var todayIso = new Date().toISOString().split("T")[0];
  if (expiryInput) {
    expiryInput.min = todayIso;
    if (existing && existing.expiresAt) {
      var expD = new Date(Number(existing.expiresAt));
      var yyyy = expD.getUTCFullYear();
      var mm = String(expD.getUTCMonth() + 1).padStart(2, "0");
      var dd = String(expD.getUTCDate()).padStart(2, "0");
      expiryInput.value = yyyy + "-" + mm + "-" + dd;
    } else {
      expiryInput.value = "";
    }
  }
  if (typeof updateExpiryUIFromInput === "function") {
    updateExpiryUIFromInput();
  }

  // Build 4 quick-select preset buttons
  if (presetsGridEl) {
    var p5 = Math.max(1, round(p.price * 0.95));
    var p10 = Math.max(1, round(p.price * 0.90));
    var p15 = Math.max(1, round(p.price * 0.85));
    var lowPreset = (min6m > 0 && min6m < p.price) ? round(min6m) : Math.max(1, round(p.price * 0.88));
    var presets = [
      { label: "5% Drop", val: p5 },
      { label: "10% Drop", val: p10 },
      { label: "15% Drop", val: p15 },
      { label: "6M Low", val: lowPreset }
    ];
    var presetsHtml = "";
    for (var i = 0; i < presets.length; i++) {
      var pr = presets[i];
      var isSel = Math.abs(pr.val - defaultThreshold) < 0.05;
      presetsHtml +=
        '<button type="button" class="price-preset-chip' + (isSel ? ' active' : '') + '" data-target-price="' + pr.val.toFixed(2) + '">' +
          '<span class="preset-chip-label">' + esc(pr.label) + '</span>' +
          '<strong class="preset-chip-val">$' + pr.val.toFixed(2) + '</strong>' +
        '</button>';
    }
    presetsGridEl.innerHTML = presetsHtml;
  }

  updatePriceAlertSavingsCallout(p.price, defaultThreshold, defaultEmail);
  openModal(overlay);
  renderPriceAlertSparkline(p, defaultThreshold);
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(function () {
      renderPriceAlertSparkline(p, defaultThreshold);
    });
  }
}

function closePriceAlertModal() {
  var overlay = document.getElementById("price-alert-overlay");
  if (!overlay) return;
  closeModal(overlay);
  activePriceAlertProductId = null;
}

function showPriceAlertMsg(text, isError) {
  var msgEl = document.getElementById("price-alert-msg");
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.className = isError ? "modal-msg error" : "modal-msg";
  msgEl.hidden = false;
}

function savePriceAlert(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!activePriceAlertProductId) return;

  var thresholdInput = document.getElementById("price-alert-threshold-input");
  var emailInput = document.getElementById("price-alert-email-input");
  var expiryInput = document.getElementById("price-alert-expiry-input");
  var saveBtn = document.getElementById("price-alert-save-btn");
  var removeBtn = document.getElementById("price-alert-remove-btn");
  var saveLabelEl = document.getElementById("price-alert-save-label");

  var targetPrice = parseFloat(thresholdInput ? thresholdInput.value : "0");
  var email = emailInput ? emailInput.value.trim() : "";
  var expiryVal = expiryInput && expiryInput.value ? expiryInput.value.trim() : null;

  if (!targetPrice || targetPrice <= 0) {
    showPriceAlertMsg("Please enter a target price threshold greater than $0.00.", true);
    return;
  }
  if (!email || email.indexOf("@") === -1) {
    showPriceAlertMsg("Please enter a valid email address for the alert.", true);
    return;
  }

  if (saveBtn) saveBtn.disabled = true;

  api("/api/price-alerts", {
    method: "POST",
    body: JSON.stringify({
      productId: activePriceAlertProductId,
      targetPrice: targetPrice,
      email: email,
      expiresAt: expiryVal
    })
  })
    .then(function (res) {
      return res.json().then(function (data) { return { ok: res.ok, data: data }; });
    })
    .then(function (result) {
      if (saveBtn) saveBtn.disabled = false;
      if (!result.ok || !result.data) {
        showPriceAlertMsg((result.data && result.data.message) || "Couldn't save price alert.", true);
        return;
      }
      if (Array.isArray(result.data.alerts)) {
        priceAlerts = result.data.alerts;
      }
      updatePriceAlertCardButtons(activePriceAlertProductId);
      paintPriceAlerts();
      if (saveLabelEl) saveLabelEl.textContent = "Update Price Alert";
      if (removeBtn) removeBtn.hidden = false;

      showPriceAlertMsg(result.data.message || "Price drop alert saved!", false);
      if (result.data.emailNotification) {
        renderPriceAlertEmailPreview(result.data.emailNotification);
      }
      showActivityToast(result.data.message || "Price drop alert activated!");
    })
    .catch(function () {
      if (saveBtn) saveBtn.disabled = false;
      showPriceAlertMsg("Can't reach the server right now.", true);
    });
}

function removePriceAlert(productId) {
  var id = Number(productId || activePriceAlertProductId);
  if (!id) return;

  api("/api/price-alerts/" + id, { method: "DELETE" })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && Array.isArray(data.alerts)) {
        priceAlerts = data.alerts;
      } else {
        priceAlerts = priceAlerts.filter(function (a) { return Number(a.productId) !== id; });
      }
      updatePriceAlertCardButtons(id);
      paintPriceAlerts();
      if (activePriceAlertProductId === id) {
        var removeBtn = document.getElementById("price-alert-remove-btn");
        var saveLabelEl = document.getElementById("price-alert-save-label");
        if (removeBtn) removeBtn.hidden = true;
        if (saveLabelEl) saveLabelEl.textContent = "Set Price Drop Alert";
        renderPriceAlertEmailPreview(null);
        showPriceAlertMsg("Price drop alert removed.", false);
      }
      showActivityToast("Removed price drop alert.");
    })
    .catch(function () {});
}

function simulatePriceDropAlert() {
  if (!activePriceAlertProductId) return;
  var id = activePriceAlertProductId;
  var testBtn = document.getElementById("price-alert-test-btn");
  var thresholdInput = document.getElementById("price-alert-threshold-input");
  var emailInput = document.getElementById("price-alert-email-input");
  var expiryInput = document.getElementById("price-alert-expiry-input");
  var targetVal = parseFloat(thresholdInput ? thresholdInput.value : "0");
  var emailVal = emailInput ? emailInput.value.trim() : "";
  var expiryVal = expiryInput && expiryInput.value ? expiryInput.value.trim() : null;

  if (testBtn) testBtn.disabled = true;

  // Ensure the current form threshold & email are saved first, then trigger simulated price drop
  api("/api/price-alerts", {
    method: "POST",
    body: JSON.stringify({
      productId: id,
      targetPrice: targetVal > 0 ? targetVal : undefined,
      email: emailVal || undefined,
      expiresAt: expiryVal
    })
  })
    .then(function () {
      var simulatedPrice = targetVal > 1 ? Math.max(1, round(targetVal - Math.max(1, round(targetVal * 0.04)))) : undefined;
      return api("/api/price-alerts/" + id + "/simulate-drop", {
        method: "POST",
        body: JSON.stringify({ newPrice: simulatedPrice })
      });
    })
    .then(function (res) {
      return res.json().then(function (data) { return { ok: res.ok, data: data }; });
    })
    .then(function (result) {
      if (testBtn) testBtn.disabled = false;
      if (!result.ok || !result.data) {
        showPriceAlertMsg((result.data && result.data.message) || "Couldn't simulate price drop.", true);
        return;
      }
      var d = result.data;
      if (Array.isArray(d.alerts)) {
        priceAlerts = d.alerts;
      }
      var p = findProductById(id);
      if (p && typeof d.newPrice === "number") {
        p.price = d.newPrice;
        var cardPriceEl = document.querySelector("#card-" + id + " .card-price");
        if (cardPriceEl) cardPriceEl.textContent = "$" + p.price.toFixed(2);
        var curValEl = document.getElementById("price-alert-current-val");
        if (curValEl) curValEl.textContent = "$" + p.price.toFixed(2);
        recalc(false);
      }
      updatePriceAlertCardButtons(id);
      paintPriceAlerts();
      var removeBtn = document.getElementById("price-alert-remove-btn");
      if (removeBtn) removeBtn.hidden = false;

      showPriceAlertMsg(d.message || "Price drop triggered and email alert sent!", false);
      if (d.emailNotification) {
        renderPriceAlertEmailPreview(d.emailNotification);
      }
      showActivityToast(d.message || "Price drop email alert sent!");
    })
    .catch(function () {
      if (testBtn) testBtn.disabled = false;
      showPriceAlertMsg("Can't reach the server right now.", true);
    });
}

window.onPriceDropAlertReceived = function (msg) {
  if (!msg || !msg.notification) return;
  var notif = msg.notification;
  if (msg.product && msg.product.id) {
    var p = findProductById(msg.product.id);
    if (p) {
      p.price = msg.product.price;
      var cardPriceEl = document.querySelector("#card-" + p.id + " .card-price");
      if (cardPriceEl) cardPriceEl.textContent = "$" + p.price.toFixed(2);
    }
    updatePriceAlertCardButtons(msg.product.id);
  }
  showActivityToast(
    "Price Drop Alert Emailed to " + notif.toEmail + ": " + notif.productTitle + " is now $" + Number(notif.newPrice).toFixed(2) + "!"
  );
};

function addAllWishlistToCart() {
  if (wishlist.length === 0) return;
  var addAllBtn = document.getElementById("wishlist-add-all-btn");
  if (addAllBtn) addAllBtn.disabled = true;

  api("/api/wishlist/add-all-to-cart", { method: "POST" })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (addAllBtn) addAllBtn.disabled = false;
      if (data && data.cart) {
        window.serverCartState = data.cart;
        cart = data.cart.rawCart || data.cart.rawMap || cart;
      }
      for (var i = 0; i < products.length; i++) {
        refreshCard(products[i].id);
      }
      recalc(true);
      showActivityToast("Added " + (data.addedCount || wishlist.length) + " wishlist items to your cart!");
    })
    .catch(function () {
      if (addAllBtn) addAllBtn.disabled = false;
      showActivityToast("Couldn't add all items to cart.");
    });
}

function clearWishlist() {
  if (wishlist.length === 0) return;
  var clearBtn = document.getElementById("wishlist-clear-btn");
  if (clearBtn) clearBtn.disabled = true;

  api("/api/wishlist/clear", { method: "POST" })
    .then(function (res) { return res.json(); })
    .then(function () {
      if (clearBtn) clearBtn.disabled = false;
      var prevIds = wishlist.slice();
      wishlist = [];
      for (var i = 0; i < prevIds.length; i++) {
        updateWishlistCardButtons(prevIds[i], false);
      }
      paintWishlist();
      updateFilterTabCounts();
      if (activeCategoryFilter === "wishlist") {
        applyFiltersAndSearch();
      }
      showActivityToast("Personal wishlist cleared.");
    })
    .catch(function () {
      if (clearBtn) clearBtn.disabled = false;
    });
}


function signOut() {
  sessionStorage.setItem("voltbox_signed_out", "1");
  api("/api/logout", { method: "POST" })
    .catch(function () {})
    .then(forgetAndGoToLogin);
}

function forgetAndGoToLogin() {
  sessionStorage.setItem("voltbox_signed_out", "1");
  localStorage.removeItem("voltbox_token");
  localStorage.removeItem("voltbox_user");
  localStorage.removeItem("voltbox_role");
  localStorage.removeItem("voltbox_auth_provider");
  window.location.replace("login.html");
}


// ── product classification, SKU, & price history helpers ──

function getComponentGroup(p) {
  if (p.componentGroup) return p.componentGroup;
  var hay = ((p.title || "") + " " + (p.category || "")).toLowerCase();
  if (hay.indexOf("rtx") !== -1 || hay.indexOf("gtx") !== -1 || hay.indexOf("radeon") !== -1 || hay.indexOf("gpu") !== -1) return "gpus";
  if (hay.indexOf("ryzen") !== -1 || hay.indexOf("intel") !== -1 || hay.indexOf("ultra") !== -1 || hay.indexOf("cpu") !== -1 || hay.indexOf("processor") !== -1) return "cpus";
  if (hay.indexOf("motherboard") !== -1 || hay.indexOf("b550") !== -1 || hay.indexOf("b570") !== -1 || hay.indexOf("x870") !== -1 || hay.indexOf("z790") !== -1 || hay.indexOf("tomahawk") !== -1) return "motherboards";
  if (hay.indexOf("ssd") !== -1 || hay.indexOf("nvme") !== -1 || hay.indexOf("harddisk") !== -1 || hay.indexOf("mp700") !== -1 || hay.indexOf("storage") !== -1) return "storage";
  if (hay.indexOf("airpods") !== -1 || hay.indexOf("headphone") !== -1 || hay.indexOf("mic") !== -1 || hay.indexOf("shure") !== -1 || hay.indexOf("audio") !== -1) return "audio";
  if (hay.indexOf("playstation") !== -1 || hay.indexOf("ps5") !== -1 || hay.indexOf("controller") !== -1 || hay.indexOf("mouse") !== -1 || hay.indexOf("handheld") !== -1 || hay.indexOf("console") !== -1 || hay.indexOf("gaming") !== -1) return "gaming";
  return "other";
}

function getSkuFor(p) {
  if (p.sku) return p.sku;
  var map = { gpus: "GPU", cpus: "CPU", motherboards: "MBD", storage: "STR", audio: "AUD", gaming: "GMG", other: "PRT" };
  var prefix = map[getComponentGroup(p)] || "PRT";
  var num = String(p.id || 0);
  while (num.length < 3) num = "0" + num;
  return "VB-" + prefix + "-" + num;
}

function renderSkuBarcodeGraphic(sku) {
  var clean = String(sku || "VB-PRT-000").trim().toUpperCase();
  var rects = [
    '<rect class="bc-guard" x="0" y="0" width="1.5" height="18" rx="0.3" />',
    '<rect class="bc-guard" x="2.8" y="0" width="1.0" height="18" rx="0.3" />'
  ];
  var cursor = 5.8;
  var maxRight = 113.5;
  var idx = 0;
  var hasMidGuard = false;
  var widths = [1.0, 1.5, 2.2, 3.0];
  var gaps = [1.3, 1.7, 2.1, 2.5];

  while (cursor < maxRight) {
    var ch = clean.charCodeAt(idx % clean.length) || 65;
    var mix = (ch * 13 + idx * 7) % 16;

    if (!hasMidGuard && cursor >= 56 && cursor <= 60) {
      rects.push('<rect class="bc-guard" x="' + cursor.toFixed(1) + '" y="0" width="1.1" height="17.5" rx="0.3" />');
      rects.push('<rect class="bc-guard" x="' + (cursor + 2.3).toFixed(1) + '" y="0" width="1.1" height="17.5" rx="0.3" />');
      cursor += 5.2;
      hasMidGuard = true;
      idx++;
      continue;
    }

    var w = widths[mix % widths.length];
    var gap = gaps[Math.floor(mix / 4) % gaps.length];
    if (cursor + w > maxRight) break;
    rects.push('<rect class="bc-bar" x="' + cursor.toFixed(1) + '" y="0" width="' + w.toFixed(1) + '" height="14" rx="0.25" />');
    cursor += w + gap;
    idx++;
  }

  rects.push('<rect class="bc-guard" x="115.8" y="0" width="1.0" height="18" rx="0.3" />');
  rects.push('<rect class="bc-guard" x="118.2" y="0" width="1.5" height="18" rx="0.3" />');

  return (
    '<div class="card-sku-barcode" data-testid="card-sku-barcode" title="Hardware SKU: ' + esc(clean) + '">' +
      '<svg class="card-barcode-svg" viewBox="0 0 120 18" preserveAspectRatio="none" aria-hidden="true">' +
        rects.join("") +
      '</svg>' +
      '<div class="card-barcode-caption">' +
        '<span class="card-barcode-prefix">SKU</span>' +
        '<span class="card-sku">' + esc(clean) + '</span>' +
      '</div>' +
    '</div>'
  );
}

function getPriceHistoryFor(p) {
  if (Array.isArray(p.priceHistory) && p.priceHistory.length > 0) {
    return p.priceHistory;
  }
  var months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  var base = Math.max(1, Number(p.price) || 100);
  var seed = (Number(p.id) || 1) * 17;
  var mults = [
    1.12 - ((seed % 5) * 0.01),
    1.07 + ((seed % 4) * 0.008),
    0.94 - ((seed % 3) * 0.005),
    1.04 + ((seed % 5) * 0.006),
    0.90 - ((seed % 4) * 0.005),
    1.0
  ];
  var out = [];
  for (var i = 0; i < months.length; i++) {
    var pr = i === months.length - 1 ? round(base) : round(base * mults[i]);
    out.push({
      month: months[i],
      price: pr,
      marketAvg: round(pr * 1.07)
    });
  }
  return out;
}


// ── fetch the product list from our backend ──

function fetchProducts(filterParams) {
  var queryParts = [];
  if (filterParams && typeof filterParams === "object") {
    if (filterParams.category) queryParts.push("category=" + encodeURIComponent(filterParams.category));
    if (filterParams.group) queryParts.push("group=" + encodeURIComponent(filterParams.group));
    if (filterParams.search) queryParts.push("search=" + encodeURIComponent(filterParams.search));
    if (filterParams.lowStock) queryParts.push("lowStock=true");
  }
  var endpoint = "/api/products" + (queryParts.length > 0 ? ("?" + queryParts.join("&")) : "");

  return fetch(endpoint)
    .then(function (res) {
      if (!res.ok) throw new Error("server returned " + res.status);
      return res.json();
    })
    .then(function (data) {
      products = Array.isArray(data) ? data.map(normalizeProductEntity) : [];
      renderAllCards();
      recalc();
      if (activeSpecProductId) {
        var current = findProductById(activeSpecProductId);
        if (current) populateSpecDrawer(current);
      }
      loadQrScanHistory();
      renderQrScanHistory();
      checkDeepLinkProduct();
      return products;
    })
    .catch(function (err) {
      console.error("couldn't load products:", err);
      if (loadingEl) {
        loadingEl.innerHTML =
          '<p style="color:#ff6b6b;">couldn\'t load products — is the server running?</p>';
      }
      return [];
    });
}

function normalizeProductEntity(p) {
  if (!p || typeof p !== "object") return p;
  if (!p.title && p.name) p.title = p.name;
  if (!p.name && p.title) p.name = p.title;
  var stockVal = typeof p.stockQuantity === "number" ? p.stockQuantity
    : (typeof p.quantity === "number" ? p.quantity : (typeof p.stock === "number" ? p.stock : 10));
  p.stockQuantity = stockVal;
  p.quantity = stockVal;
  p.stock = stockVal;
  return p;
}

function findProductById(id) {
  var numId = Number(id);
  for (var i = 0; i < products.length; i++) {
    if (products[i].id === numId) return products[i];
  }
  return null;
}


function upgradeCardPhotos() {
  var imgs = gridEl.querySelectorAll(".card-img[data-photo]");
  for (var i = 0; i < imgs.length; i++) {
    loadRealPhoto(imgs[i]);
  }
}

function loadRealPhoto(img) {
  var url = img.getAttribute("data-photo");
  img.removeAttribute("data-photo");
  if (!url) return;

  var probe = new Image();
  var timer = setTimeout(function () {
    probe.onload = null;
    probe.src = "";
  }, 8000);

  probe.onload = function () {
    clearTimeout(timer);
    img.src = url;
  };
  probe.src = url;
}

function tileFor(category) {
  return "/images/categories/" + (category || "components") + ".svg";
}

function getProductImageUrl(item) {
  if (!item) return tileFor("components");
  var raw = typeof item.image === "string" ? item.image.trim() : "";
  if (raw && raw.indexOf("/images/categories/") === -1 && (raw.indexOf("http") === 0 || raw.indexOf("/") === 0)) {
    return raw;
  }
  var pid = Number(item.productId || item.id || 0);
  if (pid > 0) {
    var byId = findProductById(pid);
    if (byId && byId.image && byId.image.indexOf("/images/categories/") === -1) {
      return byId.image;
    }
    if (byId && byId.category) {
      return tileFor(byId.category);
    }
  }
  if (item.title && Array.isArray(products)) {
    var targetTitle = String(item.title).trim().toLowerCase();
    for (var i = 0; i < products.length; i++) {
      if (String(products[i].title || "").trim().toLowerCase() === targetTitle && products[i].image) {
        return products[i].image;
      }
    }
  }
  return tileFor(item.category || "components");
}

function cardTag(p) {
  var color = p.addedByColor || "var(--accent)";
  var label = p.official ? "Voltbox" : ("Added by " + (p.addedByName || "a contributor"));
  return '<span class="card-tag' + (p.official ? " official" : "") + '" ' +
         'style="--tag:' + color + '">' +
           '<span class="card-tag-dot"></span>' + esc(label) +
         '</span>';
}

var LOW_STOCK_LIMIT = 5;

function getProductStock(p) {
  if (typeof p.stockQuantity === "number" && !isNaN(p.stockQuantity)) return p.stockQuantity;
  if (typeof p.quantity === "number" && !isNaN(p.quantity)) return p.quantity;
  if (typeof p.stock === "number" && !isNaN(p.stock)) return p.stock;
  return 10;
}

function getEffectiveStock(p) {
  var base = getProductStock(p);
  if (base < LOW_STOCK_LIMIT) return base;
  var inCart = cart[p.id] || 0;
  return Math.max(0, base - inCart);
}

function isLowStockItem(p) {
  return getEffectiveStock(p) < LOW_STOCK_LIMIT;
}

function isBackorderItem(p) {
  if (!p) return false;
  if (p.backorder === true || p.stockStatus === "backorder") return true;
  return getEffectiveStock(p) <= 0;
}

function getStockStatusForProduct(p) {
  return isBackorderItem(p) ? "backorder" : "available-now";
}

function getProductDiscountFrom6mAvg(p) {
  if (!p) return { avg: 0, current: 0, dropPct: 0, savings: 0, isDeal: false };
  var h = getPriceHistoryFor(p);
  var prs = h.map(function (x) { return x.price; });
  var avg = prs.length > 0 ? (prs.reduce(function (a, b) { return a + b; }, 0) / prs.length) : p.price;
  avg = Math.round(avg * 100) / 100;
  var current = Math.round(Number(p.price) * 100) / 100;
  var savings = Math.max(0, Math.round((avg - current) * 100) / 100);
  var dropPct = avg > 0 ? Math.round(((avg - current) / avg) * 1000) / 10 : 0;
  return {
    avg: avg,
    current: current,
    dropPct: dropPct,
    savings: savings,
    isDeal: dropPct > 0
  };
}

function syncBestDealPillUI() {
  var pill = document.getElementById("catalog-best-deal-pill");
  if (!pill) return;
  var isActive = activeSortMode === "best-deal";
  pill.classList.toggle("active", isActive);
  pill.setAttribute("aria-pressed", isActive ? "true" : "false");
}

function getSortedProductsList() {
  var copy = products.slice();
  if (activeSortMode === "price-asc") {
    copy.sort(function (a, b) { return a.price - b.price; });
  } else if (activeSortMode === "price-desc") {
    copy.sort(function (a, b) { return b.price - a.price; });
  } else if (activeSortMode === "rating-desc") {
    copy.sort(function (a, b) {
      var diff = (Number(b.ratingRate) || 0) - (Number(a.ratingRate) || 0);
      if (Math.abs(diff) > 0.001) return diff;
      return (Number(b.ratingCount) || 0) - (Number(a.ratingCount) || 0);
    });
  } else if (activeSortMode === "stock-asc") {
    copy.sort(function (a, b) { return getEffectiveStock(a) - getEffectiveStock(b); });
  } else if (activeSortMode === "best-deal") {
    copy.sort(function (a, b) {
      var dropA = getProductDiscountFrom6mAvg(a).dropPct;
      var dropB = getProductDiscountFrom6mAvg(b).dropPct;
      if (Math.abs(dropB - dropA) > 0.01) return dropB - dropA;
      return a.price - b.price;
    });
  }
  return copy;
}

function computeCardParallaxTilt(offsetX, offsetY, width, height, maxTiltDeg, maxShiftPx) {
  var maxTilt = typeof maxTiltDeg === "number" ? maxTiltDeg : 6;
  var maxShift = typeof maxShiftPx === "number" ? maxShiftPx : 4.5;
  if (!(width > 0) || !(height > 0)) {
    return {
      rotateXDeg: 0,
      rotateYDeg: 0,
      shiftXPx: 0,
      shiftYPx: 0,
      glareXPercent: 50,
      glareYPercent: 50
    };
  }
  var halfW = width / 2;
  var halfH = height / 2;
  var nx = Math.max(-1, Math.min(1, (offsetX - halfW) / halfW));
  var ny = Math.max(-1, Math.min(1, (offsetY - halfH) / halfH));

  var rx = Math.round(-ny * maxTilt * 100) / 100;
  var ry = Math.round(nx * maxTilt * 100) / 100;
  var sx = Math.round(nx * maxShift * 100) / 100;
  var sy = Math.round(ny * maxShift * 100) / 100;
  var gx = Math.round(Math.max(0, Math.min(100, (offsetX / width) * 100)) * 100) / 100;
  var gy = Math.round(Math.max(0, Math.min(100, (offsetY / height) * 100)) * 100) / 100;

  return {
    rotateXDeg: rx === 0 ? 0 : rx,
    rotateYDeg: ry === 0 ? 0 : ry,
    shiftXPx: sx === 0 ? 0 : sx,
    shiftYPx: sy === 0 ? 0 : sy,
    glareXPercent: gx === 0 ? 0 : gx,
    glareYPercent: gy === 0 ? 0 : gy
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   CATALOG GRID KEYBOARD NAVIGATION ENGINE
   ═══════════════════════════════════════════════════════════════════════════ */

function getActualGridColumns() {
  if (activeCatalogView === "list") return 1;
  var cards = Array.from(gridEl.querySelectorAll(".card:not([hidden])"));
  if (cards.length <= 1) return 1;
  var firstTop = cards[0].offsetTop;
  var count = 0;
  for (var i = 0; i < cards.length; i++) {
    if (Math.abs(cards[i].offsetTop - firstTop) < 14) {
      count++;
    } else {
      break;
    }
  }
  return Math.max(1, count);
}

function computeGridNavIndex(curr, total, cols, key) {
  if (total <= 0) return 0;
  var c = Math.max(1, Math.floor(cols));
  var cur = Math.min(Math.max(0, curr), total - 1);
  if (key === "ArrowRight") return Math.min(total - 1, cur + 1);
  if (key === "ArrowLeft") return Math.max(0, cur - 1);
  if (key === "ArrowDown") {
    var nextDown = cur + c;
    if (nextDown < total) return nextDown;
    var currentRow = Math.floor(cur / c);
    var totalRows = Math.ceil(total / c);
    if (currentRow < totalRows - 1) return total - 1;
    return cur;
  }
  if (key === "ArrowUp") return Math.max(0, cur - c);
  if (key === "Home") return 0;
  if (key === "End") return Math.max(0, total - 1);
  if (key === "PageDown") return Math.min(total - 1, cur + c * 2);
  if (key === "PageUp") return Math.max(0, cur - c * 2);
  return cur;
}

function showToast(msg) {
  if (typeof window.showActivityToast === "function") {
    window.showActivityToast(msg);
  }
}

function handleCardKeyNavigation(e, cardEl, p) {
  var target = e.target;
  var isChildInput = target !== cardEl && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT");
  if (isChildInput) return;

  var key = e.key;

  // Selection via Enter or Space: Opens spec drawer
  if (key === "Enter" || key === " " || key === "Spacebar") {
    if (target !== cardEl && target.tagName === "BUTTON") {
      return; // allow button native behavior
    }
    e.preventDefault();
    e.stopPropagation();
    openSpecDrawer(p.id);
    return;
  }

  // Quick Action Shortcuts
  if (key === "+" || key === "=") {
    e.preventDefault();
    inc(p.id);
    showToast("Added " + p.title + " to cart", "cart");
    return;
  }
  if (key === "-" || key === "_") {
    e.preventDefault();
    dec(p.id);
    return;
  }
  var lk = key.toLowerCase();
  if (lk === "c") {
    e.preventDefault();
    toggleCompareItem(p.id);
    return;
  }
  if (lk === "w") {
    e.preventDefault();
    toggleWishlist(null, p.id);
    return;
  }
  if (lk === "p") {
    e.preventDefault();
    toggleCardChart(p.id);
    return;
  }
  if (lk === "s") {
    e.preventDefault();
    openSpecDrawer(p.id);
    return;
  }

  // Arrow key grid navigation
  if (key === "ArrowRight" || key === "ArrowLeft" || key === "ArrowDown" || key === "ArrowUp" || key === "Home" || key === "End" || key === "PageDown" || key === "PageUp") {
    e.preventDefault();
    var cards = Array.from(gridEl.querySelectorAll(".card:not([hidden])"));
    if (!cards.length) return;
    var currentIdx = cards.indexOf(cardEl);
    if (currentIdx === -1) currentIdx = 0;
    var cols = getActualGridColumns();
    var nextIdx = computeGridNavIndex(currentIdx, cards.length, cols, key);
    if (cards[nextIdx]) {
      cards[nextIdx].focus();
      cards[nextIdx].scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }
  }
}

// ── build the card HTML for every product and drop it in the grid ──

function renderAllCards() {
  if (loadingEl) loadingEl.classList.add("gone");

  var existingCards = gridEl.querySelectorAll(".card");
  for (var c = 0; c < existingCards.length; c++) {
    existingCards[c].remove();
  }

  var sorted = getSortedProductsList();

  for (var i = 0; i < sorted.length; i++) {
    var p = sorted[i];
    var q = cart[p.id] || 0;
    var stockQty = getEffectiveStock(p);
    var isBackorder = isBackorderItem(p);
    var lowStock = isLowStockItem(p);
    var isCriticalStock = stockQty <= 2;
    var sku = getSkuFor(p);
    var isChartOpen = !!expandedCharts[p.id];
    var history = getPriceHistoryFor(p);
    var prices = history.map(function (h) { return h.price; });
    var minPrice = Math.min.apply(null, prices);
    var maxPrice = Math.max.apply(null, prices);

    var dealMetrics = getProductDiscountFrom6mAvg(p);
    var dealBadge = dealMetrics.isDeal
      ? '<span class="card-deal-badge" id="deal-badge-' + p.id + '" data-testid="card-deal-badge-' + p.id + '" title="' + dealMetrics.dropPct.toFixed(1) + '% below 6-month historical average of $' + dealMetrics.avg.toFixed(2) + '"><span class="deal-fire">🔥</span> ' + dealMetrics.dropPct.toFixed(0) + '% off 6M avg</span>'
      : '';

    var card = document.createElement("article");
    card.className = "card" + (lowStock ? " is-low-stock" : "") + (isBackorder ? " is-backorder" : "") + (dealMetrics.isDeal ? " has-deal-drop" : "") + (isChartOpen ? " has-open-chart" : "");
    card.id = "card-" + p.id;
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "article");
    card.setAttribute("aria-label", p.title + ", $" + p.price.toFixed(2) + (lowStock ? ", Low Stock" : "") + (isBackorder ? ", Backorder" : ""));
    card.setAttribute("data-product-id", String(p.id));
    card.setAttribute("data-card-index", String(i));
    card.setAttribute("data-stock", String(stockQty));
    card.setAttribute("data-stock-status", isBackorder ? "backorder" : "available-now");
    card.setAttribute("data-deal-drop", String(dealMetrics.dropPct));
    card.setAttribute("data-group", getComponentGroup(p));
    card.style.setProperty("--stagger-idx", String(i));

    var normalizedSlots = (window.VoltboxQR && typeof window.VoltboxQR.normalizeProductCardContentSlots === "function")
      ? window.VoltboxQR.normalizeProductCardContentSlots(p)
      : {
          title: p.title || ("Hardware Component #" + p.id),
          description: p.description || "Precision bench-verified hardware component with full ESD validation and manufacturer warranty.",
          ratingRate: p.ratingCount > 0 ? p.ratingRate : 4.8,
          ratingCount: p.ratingCount || 0,
          ratingLabel: p.ratingCount > 0 ? (p.ratingRate + " (" + p.ratingCount + ")") : "4.8 (Verified)"
        };

    var ratingRow =
      '<div class="card-rating">' +
        starRating(normalizedSlots.ratingRate) +
        '<span>' + esc(normalizedSlots.ratingLabel) + '</span>' +
      '</div>';

    var tag = cardTag(p);

    var lowStockBadge = isBackorder
      ? '<span class="low-stock-badge backorder" id="low-stock-' + p.id + '" data-testid="backorder-badge">Backorder</span>'
      : (lowStock
          ? '<span class="low-stock-badge' + (isCriticalStock ? ' critical' : '') + '" id="low-stock-' + p.id + '" data-testid="low-stock-badge">Low Stock</span>'
          : '');

    var stockNote = isBackorder
      ? '<span class="card-stock backorder" id="stock-note-' + p.id + '">Backorder &middot; Ships in 3&ndash;5d</span>'
      : (lowStock
          ? '<span class="card-stock low" id="stock-note-' + p.id + '">' + stockQty + ' left in stock</span>'
          : '<span class="card-stock" id="stock-note-' + p.id + '">' + stockQty + ' in stock</span>');

    var isWish = isProductInWishlist(p.id);
    var wishBtn =
      '<button class="card-wishlist-btn' + (isWish ? ' active' : '') + '" ' +
      '        id="wishlist-btn-' + p.id + '" ' +
      '        type="button" ' +
      '        onclick="event.stopPropagation(); toggleWishlist(event, ' + p.id + ')" ' +
      '        title="' + (isWish ? 'Remove from wishlist' : 'Save to wishlist') + '" ' +
      '        aria-label="' + (isWish ? 'Remove from wishlist' : 'Save to wishlist') + '">' +
        icon("heart", 15) +
      '</button>';

    var alertSub = getPriceAlertForProduct(p.id);
    var hasAlert = Boolean(alertSub);
    var notifyBtnTitle = hasAlert
      ? ("Price Alert active: Notify at $" + Number(alertSub.targetPrice).toFixed(2) + " (" + alertSub.email + ")")
      : ("Notify Me when price drops for " + p.title);
    var notifyBtn =
      '<button class="card-notify-btn' + (hasAlert ? ' active' : '') + (alertSub && alertSub.triggered ? ' triggered' : '') + '" ' +
      '        id="notify-btn-' + p.id + '" ' +
      '        data-testid="notify-bell-btn-' + p.id + '" ' +
      '        type="button" ' +
      '        onclick="event.stopPropagation(); openPriceAlertModal(event, ' + p.id + ')" ' +
      '        title="' + esc(notifyBtnTitle) + '" ' +
      '        aria-label="' + esc(notifyBtnTitle) + '" ' +
      '        aria-pressed="' + (hasAlert ? 'true' : 'false') + '">' +
        icon(hasAlert ? "bell-ring" : "bell", 14) +
        '<span class="notify-btn-label">' + (hasAlert ? ('Alert &lt; $' + Number(alertSub.targetPrice).toFixed(0)) : 'Notify Me') + '</span>' +
      '</button>';

    var flag =
      '<button class="card-flag" onclick="reportProduct(' + p.id + ')" ' +
      '        title="Report this listing" aria-label="Report ' + esc(p.title) + '">' +
        icon("flag", 15) +
      '</button>';

    var hasRealPhoto = p.image && (p.image.indexOf("http") === 0 || p.image.indexOf("/") === 0);
    var directImgSrc = hasRealPhoto ? p.image : tileFor(p.category);
    var isBatchSel = isProductInCatalogBatchSelection(p.id);
    if (isBatchSel) {
      card.classList.add("is-batch-selected");
    }
    var batchSelectBtn =
      '<button type="button" class="card-batch-select-btn' + (isBatchSel ? ' is-checked' : '') + '"' +
      '        id="card-batch-select-' + p.id + '"' +
      '        data-testid="card-batch-select-' + p.id + '"' +
      '        onclick="event.stopPropagation(); toggleCatalogBatchProductSelection(' + p.id + ')"' +
      '        aria-pressed="' + (isBatchSel ? 'true' : 'false') + '"' +
      '        aria-label="Select ' + esc(p.title) + ' for batch edit"' +
      '        title="Select for Batch Edit">' +
        '<span class="card-batch-check-box">' + (isBatchSel ? '✓' : '') + '</span>' +
        '<span class="card-batch-check-label">' + (isBatchSel ? 'Selected' : 'Batch Select') + '</span>' +
      '</button>';

    card.innerHTML =
      '<div class="card-img-wrap" onclick="handleCardImageAreaClick(event, ' + p.id + ')">' +
        '<img class="card-img"' +
        '     src="' + esc(directImgSrc) + '"' +
        '     alt="' + esc(p.title) + '"' +
        '     loading="lazy"' +
        '     onerror="this.onerror=null;this.src=\'' + tileFor(p.category) + '\'" />' +
        batchSelectBtn +
        lowStockBadge +
        dealBadge +
        notifyBtn +
        wishBtn +
        flag +
      '</div>' +
      '<div class="card-meta-row">' +
        tag +
        '<div class="card-meta-right">' +
          stockNote +
          '<span class="card-batch-stock-preview" id="card-batch-stock-preview-' + p.id + '" hidden></span>' +
          '<button class="card-specs-link" type="button" onclick="openSpecDrawer(' + p.id + ')" aria-label="Specs for ' + esc(p.title) + '">Specs &rarr;</button>' +
        '</div>' +
      '</div>' +
      '<h3 class="card-title"><button type="button" class="card-title-btn" onclick="handleCardTitleAreaClick(event, ' + p.id + ')">' + esc(normalizedSlots.title) + '</button></h3>' +
      '<p class="card-desc">' + esc(normalizedSlots.description) + '</p>' +
      ratingRow +
      '<div class="card-price-row">' +
        '<p class="card-price" id="card-price-text-' + p.id + '">$' + p.price.toFixed(2) + '<span class="card-price-inr-sub">≈ ₹' + Math.round(p.price * 83.5).toLocaleString("en-IN") + '</span><span class="card-batch-price-preview" id="card-batch-price-preview-' + p.id + '" hidden></span></p>' +
        '<button type="button" class="chart-toggle-btn' + (isChartOpen ? ' active' : '') + '" ' +
                'id="chart-toggle-' + p.id + '" ' +
                'aria-expanded="' + (isChartOpen ? 'true' : 'false') + '" ' +
                'aria-label="Price History for ' + esc(p.title) + '" ' +
                'onclick="toggleCardChart(' + p.id + ')">' +
          icon("chart", 13) + ' <span>Price History</span>' +
        '</button>' +
      '</div>' +
      renderSkuBarcodeGraphic(sku) +
      '<div class="card-chart-drawer' + (isChartOpen ? ' open' : '') + '" id="card-chart-panel-' + p.id + '"' + (isChartOpen ? '' : ' hidden') + '>' +
        '<div class="card-chart-meta">' +
          '<span>6M Low: <b>$' + minPrice.toFixed(0) + '</b></span>' +
          '<span>Peak: <b>$' + maxPrice.toFixed(0) + '</b></span>' +
        '</div>' +
        '<div class="card-chart-mount" id="card-chart-mount-' + p.id + '" data-testid="card-price-chart"></div>' +
      '</div>' +
      '<div class="card-footer-actions">' +
        '<div class="card-footer-left">' +
          '<button type="button" class="card-compare-btn' + (isProductInCompare(p.id) ? ' active' : '') + '" ' +
          '        id="card-compare-btn-' + p.id + '" ' +
          '        onclick="event.stopPropagation(); toggleCompareItem(' + p.id + ')" ' +
          '        title="' + (isProductInCompare(p.id) ? 'Remove from comparison' : 'Compare with other components') + '" ' +
          '        aria-pressed="' + (isProductInCompare(p.id) ? 'true' : 'false') + '">' +
            icon(isProductInCompare(p.id) ? "check" : "sliders", 13) +
            ' <span>' + (isProductInCompare(p.id) ? 'Comparing' : 'Compare') + '</span>' +
          '</button>' +
          '<button type="button" class="card-quick-actions-btn" ' +
          '        id="card-quick-actions-btn-' + p.id + '" ' +
          '        data-testid="card-quick-actions-btn-' + p.id + '" ' +
          '        onclick="openCardQuickActionsFromButton(event, ' + p.id + ')" ' +
          '        title="Quick Actions (Right-click or long-press card)" ' +
          '        aria-haspopup="menu" ' +
          '        aria-label="Quick actions for ' + esc(p.title) + '">' +
            icon("more-horizontal", 14) +
          '</button>' +
        '</div>' +
        '<div class="qty">' +
          '<button class="qty-btn" id="dec-' + p.id + '"' +
          '        onclick="dec(' + p.id + ')"' +
          '        ' + (q <= 0 ? 'disabled' : '') +
          '        aria-label="Decrease quantity for ' + esc(p.title) + '">−</button>' +
          '<span class="qty-value' + (q > 0 ? ' active' : '') + '"' +
          '      id="qty-' + p.id + '">' + q + '</span>' +
          '<button class="qty-btn" id="inc-' + p.id + '"' +
          '        onclick="inc(' + p.id + ')"' +
          '        aria-label="Increase quantity for ' + esc(p.title) + '">+</button>' +
        '</div>' +
      '</div>';

    bindCardContextMenuInteractions(card, p.id);

    // Release stagger-in class once entrance finishes so 3D hover transform is unrestricted
    card.addEventListener("animationend", function (ev) {
      if (ev.animationName === "cardStaggerIn") {
        this.classList.remove("stagger-in");
      }
    });

    // Cursor radial spotlight + 3D parallax tilt tracking (strictly desktop > 1024px only; locked on mobile & iPad)
    card.addEventListener("mousemove", function (ev) {
      var tiltDisabled = window.voltboxAdvSettings && window.voltboxAdvSettings.cardParallaxTiltEnabled === false;
      if (tiltDisabled || window.innerWidth <= 1024 || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches)) {
        this.classList.remove("is-tilting");
        this.style.setProperty("--card-rx", "0deg");
        this.style.setProperty("--card-ry", "0deg");
        this.style.setProperty("--parallax-x", "0px");
        this.style.setProperty("--parallax-y", "0px");
        return;
      }
      var rect = this.getBoundingClientRect();
      var ox = ev.clientX - rect.left;
      var oy = ev.clientY - rect.top;
      var tilt = computeCardParallaxTilt(ox, oy, rect.width, rect.height, 4, 3);

      this.classList.remove("stagger-in");
      this.classList.add("is-tilting");
      this.style.setProperty("--mouse-x", ox.toFixed(1) + "px");
      this.style.setProperty("--mouse-y", oy.toFixed(1) + "px");
      this.style.setProperty("--card-rx", tilt.rotateXDeg + "deg");
      this.style.setProperty("--card-ry", tilt.rotateYDeg + "deg");
      this.style.setProperty("--parallax-x", tilt.shiftXPx + "px");
      this.style.setProperty("--parallax-y", tilt.shiftYPx + "px");
      this.style.setProperty("--glare-x", tilt.glareXPercent + "%");
      this.style.setProperty("--glare-y", tilt.glareYPercent + "%");
    });

    card.addEventListener("mouseleave", function () {
      this.classList.remove("is-tilting");
      this.style.setProperty("--card-rx", "0deg");
      this.style.setProperty("--card-ry", "0deg");
      this.style.setProperty("--parallax-x", "0px");
      this.style.setProperty("--parallax-y", "0px");
      this.style.setProperty("--glare-x", "50%");
      this.style.setProperty("--glare-y", "50%");
    });

    // Keyboard navigation focus management
    (function (currentCard, currentProd) {
      currentCard.addEventListener("focus", function () {
        var allCards = gridEl.querySelectorAll(".card");
        for (var k = 0; k < allCards.length; k++) {
          if (allCards[k] !== this) allCards[k].classList.remove("keyboard-focused");
        }
        this.classList.add("keyboard-focused");
      });

      currentCard.addEventListener("blur", function () {
        this.classList.remove("keyboard-focused");
      });

      currentCard.addEventListener("keydown", function (ev) {
        handleCardKeyNavigation(ev, this, currentProd);
      });
    })(card, p);

    gridEl.appendChild(card);

    if (isChartOpen) {
      mountCardRecharts(p);
    }
  }

  upgradeCardPhotos();
  applyFiltersAndSearch();
  populateMessengerProductSelect();
  updateCatalogBatchEditUI();
}

function mountCardRecharts(p) {
  var mountEl = document.getElementById("card-chart-mount-" + p.id);
  if (!mountEl || typeof window.renderVoltboxPriceChart !== "function") return;
  window.renderVoltboxPriceChart(mountEl, getPriceHistoryFor(p), {
    variant: "card",
    accentColor: "#ffd23f",
    height: 112
  });
}

function toggleCardChart(productId) {
  var nextState = !expandedCharts[productId];
  expandedCharts[productId] = nextState;

  var cardEl = document.getElementById("card-" + productId);
  var panel = document.getElementById("card-chart-panel-" + productId);
  var btn = document.getElementById("chart-toggle-" + productId);
  if (cardEl) {
    cardEl.classList.toggle("has-open-chart", nextState);
  }
  if (btn) {
    btn.classList.toggle("active", nextState);
    btn.setAttribute("aria-expanded", nextState ? "true" : "false");
  }
  if (panel) {
    panel.hidden = !nextState;
    panel.classList.toggle("open", nextState);
  }
  if (nextState) {
    var p = findProductById(productId);
    if (p) mountCardRecharts(p);
  }
}


// ── Product Quick-View & Spec Sheet Drawer (with Recharts LineChart) ──

function openSpecDrawer(productId) {
  var p = findProductById(productId);
  if (!p) return;
  activeSpecProductId = productId;
  populateSpecDrawer(p);
  specDrawerOverlayEl.classList.add("open");
  specDrawerOverlayEl.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  prepareProductShare(p);
  if (window.momentumDrawers && window.momentumDrawers.spec) {
    window.momentumDrawers.spec.scrollTo(0, false);
    setTimeout(function () {
      if (window.momentumDrawers && window.momentumDrawers.spec) {
        window.momentumDrawers.spec.refreshMetrics();
      }
    }, 60);
  }

  // Fetch individual product details, inventory, and verified buyer reviews in parallel
  fetchAndRenderProductReviews(productId);

  Promise.all([
    fetch("/api/products/" + productId).then(function (r) { return r.ok ? r.json() : null; }),
    fetch("/api/products/" + productId + "/inventory").then(function (r) { return r.ok ? r.json() : null; })
  ])
    .then(function (results) {
      var detailEntity = results[0];
      var invPayload = results[1];
      var rawProduct = detailEntity || (invPayload && invPayload.product);
      if (!rawProduct) return;
      var liveProduct = normalizeProductEntity(rawProduct);
      if (invPayload && invPayload.inventory) {
        liveProduct.inventory = invPayload.inventory;
      }
      for (var i = 0; i < products.length; i++) {
        if (products[i].id === liveProduct.id) {
          products[i] = liveProduct;
          break;
        }
      }
      refreshCard(liveProduct.id);
      if (activeSpecProductId === liveProduct.id) {
        populateSpecDrawer(liveProduct);
      }
    })
    .catch(function () {});
}

function closeSpecDrawer() {
  specDrawerOverlayEl.classList.remove("open");
  specDrawerOverlayEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
  activeSpecProductId = null;
  var shareCard = document.getElementById("spec-share-card");
  if (shareCard) shareCard.hidden = true;
  var headBtn = document.getElementById("spec-head-share-btn");
  if (headBtn) headBtn.classList.remove("active");
  var barBtn = document.getElementById("spec-share-btn");
  if (barBtn) barBtn.classList.remove("active");
}

function populateSpecDrawer(p) {
  var specs = p.specs || {};
  var sku = getSkuFor(p);
  var stockQty = getEffectiveStock(p);
  var lowStock = isLowStockItem(p);
  var q = cart[p.id] || 0;
  var history = getPriceHistoryFor(p);
  var prices = history.map(function (h) { return h.price; });
  var minP = Math.min.apply(null, prices);
  var maxP = Math.max.apply(null, prices);
  var avgP = round(prices.reduce(function (a, b) { return a + b; }, 0) / prices.length);

  document.getElementById("spec-drawer-sku").textContent = sku;
  document.getElementById("spec-drawer-title").textContent = p.title;
  document.getElementById("spec-drawer-group").textContent = specs.groupLabel || getComponentGroup(p).toUpperCase();
  document.getElementById("spec-drawer-price").textContent = "$" + p.price.toFixed(2);

  var stockEl = document.getElementById("spec-drawer-stock");
  stockEl.textContent = lowStock ? ("Low Stock · " + stockQty + " left in stock") : (stockQty + " units available");
  stockEl.className = lowStock ? "spec-stock-line low" : "spec-stock-line";

  var ratingSummaryEl = document.getElementById("spec-drawer-rating-summary");
  if (ratingSummaryEl) {
    var cachedRev = productReviewsCache[p.id];
    var rateVal = (cachedRev && cachedRev.summary && cachedRev.summary.averageRating > 0)
      ? cachedRev.summary.averageRating
      : (Number(p.ratingRate) > 0 ? Number(p.ratingRate) : 4.8);
    var revCount = (cachedRev && cachedRev.summary && typeof cachedRev.summary.reviewCount === "number")
      ? cachedRev.summary.reviewCount
      : (typeof p.verifiedReviewCount === "number" ? p.verifiedReviewCount : (Number(p.ratingCount) || 0));
    ratingSummaryEl.innerHTML =
      '<span class="spec-hero-stars" aria-hidden="true">' + renderStaticStarsText(rateVal) + '</span>' +
      '<strong class="spec-hero-rate-num">' + Number(rateVal).toFixed(1) + '</strong>' +
      '<span class="spec-hero-rate-sep">·</span>' +
      '<button type="button" class="spec-hero-reviews-jump" onclick="scrollSpecDrawerToReviews()">' +
        revCount + (revCount === 1 ? ' Verified Review' : ' Verified Reviews') + ' · Rate / Read &darr;' +
      '</button>';
  }

  if (productReviewsCache[p.id]) {
    renderProductReviewsSection(p.id, productReviewsCache[p.id]);
  } else {
    renderProductReviewsLoading(p);
  }

  var imgEl = document.getElementById("spec-drawer-img");
  imgEl.src = (p.image && (p.image.indexOf("http") === 0 || p.image.indexOf("/") === 0)) ? p.image : tileFor(p.category);
  imgEl.alt = p.title;
  imgEl.onerror = function () { this.onerror = null; this.src = tileFor(p.category); };

  var descEl = document.getElementById("spec-drawer-desc");
  descEl.textContent = p.description || "Community-verified electronics hardware component with live inventory tracking and historical pricing.";

  var deltaPct = specs.priceDeltaPct || round(((p.price - prices[0]) / prices[0]) * 100);
  var deltaNote = document.getElementById("spec-price-delta");
  deltaNote.textContent = (deltaPct <= 0 ? "↓ " + Math.abs(deltaPct) + "% vs May" : "↑ " + deltaPct + "% vs May");

  document.getElementById("spec-price-stats").innerHTML =
    '<div class="spec-stat-cell"><span class="spec-stat-label">6M Low</span><span class="spec-stat-val">$' + minP.toFixed(2) + '</span></div>' +
    '<div class="spec-stat-cell"><span class="spec-stat-label">6M Average</span><span class="spec-stat-val">$' + avgP.toFixed(2) + '</span></div>' +
    '<div class="spec-stat-cell"><span class="spec-stat-label">6M Peak</span><span class="spec-stat-val">$' + maxP.toFixed(2) + '</span></div>';

  document.getElementById("spec-contributor-note").textContent =
    p.official ? "Official Voltbox Catalog" : ("Listed by " + (p.addedByName || "Contributor"));

  document.getElementById("spec-table-rows").innerHTML =
    '<div class="spec-row"><span>Part SKU</span><span class="mono">' + esc(sku) + '</span></div>' +
    '<div class="spec-row"><span>Architecture</span><span>' + esc(specs.architecture || "Precision Solid-State") + '</span></div>' +
    '<div class="spec-row"><span>Interface / Bus</span><span>' + esc(specs.interfaceSpec || "PCIe / High-Speed Bus") + '</span></div>' +
    '<div class="spec-row"><span>Power / Thermal</span><span>' + esc(specs.powerDraw || "65W Nominal") + '</span></div>' +
    '<div class="spec-row"><span>Warranty</span><span>' + esc(specs.warranty || "3-Year Hardware") + '</span></div>';

  var benchRowsEl = document.getElementById("spec-bench-rows");
  if (benchRowsEl) {
    var grp = getComponentGroup(p);
    var psuRec = grp === "gpus" ? "850W ATX 3.1 (12V-2x6)" : (grp === "cpus" ? "750W+ 80+ Gold" : "Standard ATX / USB-PD");
    var acousticNote = grp === "gpus" ? "28.4 dBA @ 62°C Load" : (grp === "cpus" ? "360mm AIO / Dual-Tower Air" : "Passive / Zero-RPM Idle");
    var boxContents = grp === "gpus"
      ? "GPU Unit, 16-Pin Adapter, Anti-Sag Bracket, Bench QA Certificate"
      : (grp === "motherboards"
        ? "ATX Board, 2× SATA 6Gb/s, Wi-Fi 7 Antenna, M.2 Thermal Pads"
        : "Retail Hardware Unit, Quick-Start Spec Guide, ESD Shield Packaging");
    benchRowsEl.innerHTML =
      '<div class="spec-row"><span>Recommended PSU Rail</span><span class="mono">' + esc(psuRec) + '</span></div>' +
      '<div class="spec-row"><span>Acoustic &amp; Thermal Load</span><span>' + esc(acousticNote) + '</span></div>' +
      '<div class="spec-row"><span>Rig Bundle Eligibility</span><span>' + (["cpus", "gpus", "motherboards", "storage"].indexOf(grp) !== -1 ? "Qualifies for 5% Rig Bundle" : "Accessory / Expansion Tier") + '</span></div>' +
      '<div class="spec-row"><span>ESD &amp; Bench Verification</span><span class="mono">VB-QA-' + (1000 + Number(p.id || 1) * 7) + ' · PASSED</span></div>' +
      '<div class="spec-row"><span>Package Box Contents</span><span>' + esc(boxContents) + '</span></div>';
  }

  var isSaved = isProductInWishlist(p.id);
  var wishBtnHtml =
    '<button class="spec-wishlist-btn' + (isSaved ? ' active' : '') + '" id="spec-wishlist-btn" ' +
    '        type="button" onclick="toggleWishlist(event, ' + p.id + ')" ' +
    '        aria-label="' + (isSaved ? 'Remove from wishlist' : 'Save to wishlist') + '">' +
      icon("heart", 15) + ' <span>' + (isSaved ? 'Saved to Wishlist' : 'Add to Wishlist') + '</span>' +
    '</button>';

  var shareBtnHtml =
    '<button class="spec-share-btn" id="spec-share-btn" type="button" onclick="toggleProductShareCard()" title="Share product to Twitter, WhatsApp, or Facebook" aria-label="Share product link and generated description">' +
      icon("share", 15) + ' <span>Share</span>' +
    '</button>';

  var restockBtnHtml = canCurrentUserRestock()
    ? '<button class="restock-btn" type="button" onclick="restockProduct(' + p.id + ')">' +
        icon("refresh", 14) + ' <span>Restock +3</span>' +
      '</button>'
    : '';

  var isSpecInComp = isProductInCompare(p.id);
  var compareBtnHtml =
    '<button class="spec-compare-btn' + (isSpecInComp ? ' active' : '') + '" id="spec-compare-btn" type="button" onclick="toggleCompareItem(' + p.id + ')" title="Compare side-by-side with other components" aria-label="Compare ' + esc(p.title) + '">' +
      icon(isSpecInComp ? "check" : "sliders", 15) + ' <span>' + (isSpecInComp ? 'Comparing' : 'Compare') + '</span>' +
    '</button>';

  var specAlertSub = getPriceAlertForProduct(p.id);
  var notifySpecBtnHtml =
    '<button class="spec-notify-btn' + (specAlertSub ? ' active' : '') + '" id="spec-notify-btn" type="button" onclick="openPriceAlertModal(event, ' + p.id + ')" title="Receive an email alert when price drops below your threshold" aria-label="Notify Me when price drops for ' + esc(p.title) + '">' +
      icon(specAlertSub ? "bell-ring" : "bell", 15) +
      ' <span>' + (specAlertSub ? ('Alert Set (&lt; $' + Number(specAlertSub.targetPrice).toFixed(2) + ')') : 'Notify Me') + '</span>' +
    '</button>';

  document.getElementById("spec-actions-bar").innerHTML =
    '<div class="spec-qty-control">' +
      '<button class="qty-btn" onclick="dec(' + p.id + ')" ' + (q <= 0 ? 'disabled' : '') + ' aria-label="Decrease quantity in drawer">−</button>' +
      '<span class="qty-value' + (q > 0 ? ' active' : '') + '">' + q + ' in cart</span>' +
      '<button class="qty-btn" onclick="inc(' + p.id + ')" aria-label="Increase quantity in drawer">+</button>' +
    '</div>' +
    notifySpecBtnHtml +
    compareBtnHtml +
    wishBtnHtml +
    shareBtnHtml +
    restockBtnHtml;

  prepareProductShare(p);

  var chartContainer = document.getElementById("drawer-chart-container");
  if (chartContainer && typeof window.renderVoltboxPriceChart === "function") {
    window.renderVoltboxPriceChart(chartContainer, history, {
      variant: "drawer",
      accentColor: "#2dd4bf",
      height: 170
    });
  }

  activeSpecD3ZoomTransform = { k: 1, x: 0 };
  renderSpecAdvancedPriceTrends(p, history);
  updateSpecDrawerSectionNavUI("overview", {
    volatilityIndex: activeSpecAnalyticsCache ? activeSpecAnalyticsCache.sixMonthVolatilityIndex : undefined,
    reviewCount: (productReviewsCache[p.id] && productReviewsCache[p.id].summary)
      ? productReviewsCache[p.id].summary.reviewCount
      : (typeof p.verifiedReviewCount === "number" ? p.verifiedReviewCount : (Number(p.ratingCount) || 0))
  });

  if (window.momentumDrawers && window.momentumDrawers.spec) {
    window.momentumDrawers.spec.refreshMetrics();
  }
}

// ── D3.js Advanced Price Trends & 6-Month Volatility Index ──
var activeSpecD3TrendMode = "composite"; // 'composite' | 'volatility-bars' | 'zscore'
var activeSpecPriceHistoryCache = [];
var activeSpecAnalyticsCache = null;
var activeSpecSelectedEventMonth = null;
var activeSpecHighVolThresholdEnabled = true;
var activeSpecHighVolSigma = 2.0;
var activeSpecD3LegendVisible = true;
var activeSpecD3ZoomTransform = { k: 1, x: 0 };

function getSpecThresholdLegendHtml() {
  var sigLbl = Number(activeSpecHighVolSigma || 2).toFixed(1).replace(/\.0$/, "") + "σ";
  return activeSpecHighVolThresholdEnabled
    ? '<span class="spec-d3-legend-item"><i class="spec-d3-swatch is-threshold-marker"></i>≥' + sigLbl + ' Threshold</span>'
    : '';
}

function updateSpecD3LegendRow(mode) {
  var legendEl = document.getElementById("spec-d3-legend-row");
  if (!legendEl) return;
  var thHtml = getSpecThresholdLegendHtml();
  if (mode === "composite") {
    legendEl.innerHTML =
      '<span class="spec-d3-legend-item"><i class="spec-d3-swatch is-band"></i>±1σ Envelope</span>' +
      '<span class="spec-d3-legend-item"><i class="spec-d3-swatch is-price"></i>Spot Price</span>' +
      '<span class="spec-d3-legend-item"><i class="spec-d3-swatch is-vol"></i>Volatility Index</span>' +
      '<span class="spec-d3-legend-item"><i class="spec-d3-swatch is-peak-marker"></i>Peak Event</span>' +
      thHtml;
  } else if (mode === "volatility-bars") {
    legendEl.innerHTML =
      '<span class="spec-d3-legend-item"><i class="spec-d3-swatch is-stable"></i>Low (&lt;25)</span>' +
      '<span class="spec-d3-legend-item"><i class="spec-d3-swatch is-mod"></i>Mod (25–54)</span>' +
      '<span class="spec-d3-legend-item"><i class="spec-d3-swatch is-elev"></i>High (55+)</span>' +
      '<span class="spec-d3-legend-item"><i class="spec-d3-swatch is-peak-marker"></i>Peak Event</span>' +
      thHtml;
  } else {
    legendEl.innerHTML =
      '<span class="spec-d3-legend-item"><i class="spec-d3-swatch is-zneg"></i>Below Mean (-σ Buy Zone)</span>' +
      '<span class="spec-d3-legend-item"><i class="spec-d3-swatch is-zpos"></i>Above Mean (+σ Premium)</span>' +
      '<span class="spec-d3-legend-item"><i class="spec-d3-swatch is-peak-marker"></i>Peak Event</span>' +
      thHtml;
  }
  updateSpecD3LegendVisibilityUI(false);
}

function updateSpecD3LegendVisibilityUI(animate) {
  var stateObj =
    window.VoltboxQR && typeof window.VoltboxQR.resolveD3LegendToggleState === "function"
      ? window.VoltboxQR.resolveD3LegendToggleState(activeSpecD3LegendVisible)
      : {
          legendVisible: Boolean(activeSpecD3LegendVisible),
          isHidden: !activeSpecD3LegendVisible,
          buttonLabel: activeSpecD3LegendVisible ? "Hide Legend" : "Show Legend",
          ariaPressed: activeSpecD3LegendVisible ? "false" : "true",
          ariaExpanded: activeSpecD3LegendVisible ? "true" : "false",
          statusNote: activeSpecD3LegendVisible ? "Signal legend visible" : "Signal legend hidden for cleaner chart view"
        };

  var legendEl = document.getElementById("spec-d3-legend-row");
  var toggleBtn = document.getElementById("spec-d3-legend-toggle-btn");
  var collapsedNote = document.getElementById("spec-d3-legend-collapsed-note");
  var d3Container = document.getElementById("spec-d3-volatility-chart");
  var isVisible = stateObj.legendVisible;

  if (legendEl) {
    legendEl.classList.toggle("is-hidden", !isVisible);
    legendEl.setAttribute("data-legend-visible", isVisible ? "true" : "false");
    legendEl.setAttribute("aria-hidden", isVisible ? "false" : "true");
    if (isVisible) {
      legendEl.removeAttribute("hidden");
    } else {
      legendEl.setAttribute("hidden", "hidden");
    }
  }

  if (collapsedNote) {
    if (isVisible) {
      collapsedNote.setAttribute("hidden", "hidden");
    } else {
      collapsedNote.removeAttribute("hidden");
    }
  }

  if (toggleBtn) {
    toggleBtn.textContent = stateObj.buttonLabel;
    toggleBtn.classList.toggle("is-hidden-state", !isVisible);
    toggleBtn.setAttribute("aria-pressed", String(stateObj.ariaPressed));
    toggleBtn.setAttribute("aria-expanded", String(stateObj.ariaExpanded));
    toggleBtn.setAttribute("data-legend-visible", isVisible ? "true" : "false");
  }

  if (d3Container) {
    d3Container.setAttribute("data-legend-visible", isVisible ? "true" : "false");
    d3Container.classList.toggle("is-clean-view", !isVisible);
    var svgEl = d3Container.querySelector('svg[data-testid="d3-volatility-svg"]');
    if (svgEl) {
      svgEl.setAttribute("data-legend-visible", isVisible ? "true" : "false");
    }
  }

  var isReducedMotion = Boolean(
    typeof userAdvancedSettings === "object" &&
    userAdvancedSettings &&
    userAdvancedSettings.reducedMotion
  );
  if (animate && window.gsap && !isReducedMotion) {
    if (isVisible && legendEl) {
      var items = legendEl.querySelectorAll(".spec-d3-legend-item");
      if (items.length > 0) {
        window.gsap.fromTo(
          items,
          { opacity: 0, y: 3 },
          { opacity: 1, y: 0, duration: 0.22, stagger: 0.025, ease: "power2.out", overwrite: "auto" }
        );
      }
    } else if (!isVisible && collapsedNote) {
      window.gsap.fromTo(
        collapsedNote,
        { opacity: 0, x: -4 },
        { opacity: 1, x: 0, duration: 0.2, ease: "power2.out", overwrite: "auto" }
      );
    }
  }
}

function toggleSpecD3LegendVisibility(forceVisible) {
  if (typeof forceVisible === "boolean") {
    activeSpecD3LegendVisible = forceVisible;
  } else {
    activeSpecD3LegendVisible = !activeSpecD3LegendVisible;
  }
  updateSpecD3LegendVisibilityUI(true);
}
window.toggleSpecD3LegendVisibility = toggleSpecD3LegendVisibility;

function toggleSpecHighVolatilityThreshold(forceEnabled) {
  if (typeof forceEnabled === "boolean") {
    activeSpecHighVolThresholdEnabled = forceEnabled;
  } else {
    activeSpecHighVolThresholdEnabled = !activeSpecHighVolThresholdEnabled;
  }
  updateSpecD3LegendRow(activeSpecD3TrendMode);
  var p = products.find(function(item) { return Number(item.id) === Number(activeSpecProductId); });
  if (p) {
    renderSpecAdvancedPriceTrends(p, activeSpecPriceHistoryCache, {
      previousMode: activeSpecD3TrendMode,
      animateTransition: true,
      selectedEventMonth: activeSpecSelectedEventMonth
    });
  }
}
window.toggleSpecHighVolatilityThreshold = toggleSpecHighVolatilityThreshold;

function setSpecHighVolatilitySigma(sigma) {
  var num = Number(sigma);
  if (!Number.isFinite(num) || num <= 0) num = 2.0;
  activeSpecHighVolSigma = Math.max(0.5, Math.min(3.5, Math.round(num * 100) / 100));
  activeSpecHighVolThresholdEnabled = true;
  updateSpecD3LegendRow(activeSpecD3TrendMode);
  var p = products.find(function(item) { return Number(item.id) === Number(activeSpecProductId); });
  if (p) {
    renderSpecAdvancedPriceTrends(p, activeSpecPriceHistoryCache, {
      previousMode: activeSpecD3TrendMode,
      animateTransition: true,
      selectedEventMonth: activeSpecSelectedEventMonth
    });
  }
}
window.setSpecHighVolatilitySigma = setSpecHighVolatilitySigma;

function updateSpecHighVolatilityThresholdUI(analytics) {
  var toggleBtn = document.getElementById("spec-d3-threshold-toggle");
  var stateEl = document.getElementById("spec-d3-threshold-state");
  var presetsGroup = document.getElementById("spec-d3-sigma-presets");
  var summaryEl = document.getElementById("spec-d3-threshold-summary");

  var evalObj = analytics && analytics.highVolatilityThreshold ? analytics.highVolatilityThreshold : null;
  var enabled = Boolean(activeSpecHighVolThresholdEnabled);
  var sigmaVal = Number(evalObj ? evalObj.sigmaThreshold : activeSpecHighVolSigma);
  var sigmaLabel = sigmaVal.toFixed(1) + "σ";

  if (toggleBtn) {
    toggleBtn.classList.toggle("is-active", enabled);
    toggleBtn.setAttribute("aria-checked", enabled ? "true" : "false");
  }
  if (stateEl) {
    stateEl.textContent = enabled ? ("ON · " + sigmaLabel) : "OFF";
  }
  if (presetsGroup) {
    var btns = presetsGroup.querySelectorAll(".spec-d3-sigma-btn");
    for (var i = 0; i < btns.length; i++) {
      var btnSig = Number(btns[i].getAttribute("data-sigma"));
      var isAct = Math.abs(btnSig - sigmaVal) < 0.05;
      btns[i].classList.toggle("active", isAct);
      btns[i].setAttribute("aria-pressed", isAct ? "true" : "false");
    }
  }
  if (summaryEl && evalObj) {
    summaryEl.textContent = evalObj.statusSummary;
    summaryEl.classList.toggle("is-muted", !enabled);
  }
}

function setSpecD3TrendMode(mode) {
  if (mode !== "composite" && mode !== "volatility-bars" && mode !== "zscore") {
    mode = "composite";
  }
  var prevMode = activeSpecD3TrendMode;
  activeSpecD3TrendMode = mode;
  var isReducedMotion = Boolean(
    typeof userAdvancedSettings === "object" &&
    userAdvancedSettings &&
    userAdvancedSettings.reducedMotion
  );

  var tabsEl = document.getElementById("spec-d3-mode-tabs");
  var activeBtnEl = null;
  if (tabsEl) {
    var btns = tabsEl.querySelectorAll(".spec-d3-mode-btn");
    for (var i = 0; i < btns.length; i++) {
      var btnMode = btns[i].getAttribute("data-mode");
      var isAct = btnMode === mode;
      btns[i].classList.toggle("active", isAct);
      btns[i].setAttribute("aria-selected", isAct ? "true" : "false");
      if (isAct) activeBtnEl = btns[i];
    }
  }

  updateSpecD3LegendRow(mode);
  var legendEl = document.getElementById("spec-d3-legend-row");

  var p = products.find(function(item) { return Number(item.id) === Number(activeSpecProductId); });
  if (p) {
    renderSpecAdvancedPriceTrends(p, activeSpecPriceHistoryCache, {
      previousMode: prevMode,
      animateTransition: true,
      reducedMotion: isReducedMotion,
      selectedEventMonth: activeSpecSelectedEventMonth
    });
  }

  // Subtle GSAP micro-transition on active tab button, legend chips, and hover readout strip
  if (window.gsap && !isReducedMotion && prevMode !== mode) {
    if (activeBtnEl) {
      window.gsap.fromTo(
        activeBtnEl,
        { scale: 0.94, opacity: 0.75 },
        { scale: 1, opacity: 1, duration: 0.24, ease: "power2.out", overwrite: "auto" }
      );
    }
    if (legendEl && activeSpecD3LegendVisible) {
      var legendItems = legendEl.querySelectorAll(".spec-d3-legend-item");
      if (legendItems.length > 0) {
        window.gsap.fromTo(
          legendItems,
          { opacity: 0, y: 4 },
          { opacity: 1, y: 0, duration: 0.26, stagger: 0.035, ease: "power2.out", overwrite: "auto" }
        );
      }
    }
    var readoutEl = document.getElementById("spec-d3-hover-readout");
    if (readoutEl) {
      window.gsap.fromTo(
        readoutEl,
        { opacity: 0.6, y: 3 },
        { opacity: 1, y: 0, duration: 0.28, ease: "power2.out", overwrite: "auto" }
      );
    }
  }
}

function selectSpecPeakVolatilityEvent(month) {
  if (!month) return;
  activeSpecSelectedEventMonth = String(month);
  var p = products.find(function(item) { return Number(item.id) === Number(activeSpecProductId); });
  if (p) {
    renderSpecAdvancedPriceTrends(p, activeSpecPriceHistoryCache, {
      previousMode: activeSpecD3TrendMode,
      animateTransition: false,
      selectedEventMonth: activeSpecSelectedEventMonth
    });
  }
  if (activeSpecAnalyticsCache && Array.isArray(activeSpecAnalyticsCache.points)) {
    var pt = activeSpecAnalyticsCache.points.find(function(d) { return d.month === month; });
    if (pt) {
      updateSpecD3HoverReadout(pt, activeSpecAnalyticsCache);
    }
  }
}

function updateSpecD3HoverReadout(point, analytics) {
  var readoutEl = document.getElementById("spec-d3-hover-readout");
  if (!readoutEl || !point) return;

  var momDelta = Number(point.monthlyChangePct !== undefined ? point.monthlyChangePct : (point.momDeltaPct || 0));
  var momStr = (momDelta > 0 ? "+" : "") + momDelta.toFixed(2) + "% MoM";
  var momClass = momDelta < 0 ? "is-drop" : (momDelta > 0 ? "is-rise" : "is-flat");
  var zStr = (point.zScore > 0 ? "+" : "") + Number(point.zScore || 0).toFixed(2) + "σ";
  var envStr = "$" + Number(point.lowerBand || 0).toFixed(2) + " – $" + Number(point.upperBand || 0).toFixed(2);
  var ptVol = Number(point.volatilityIndex !== undefined ? point.volatilityIndex : (point.pointVolatilityIndex || 0));
  var buyRec = analytics && analytics.buySignalLabel ? analytics.buySignalLabel : "Fair Value Band";

  readoutEl.innerHTML =
    '<div class="spec-d3-readout-cell">' +
      '<span class="spec-d3-ro-k">Selected Month</span>' +
      '<strong class="spec-d3-ro-v">' + esc(point.month) + ' · $' + Number(point.price).toFixed(2) + ' (Avg $' + Number(point.marketAvg || point.rollingMean || point.price).toFixed(2) + ')</strong>' +
    '</div>' +
    '<div class="spec-d3-readout-cell">' +
      '<span class="spec-d3-ro-k">Monthly Volatility</span>' +
      '<strong class="spec-d3-ro-v is-accent">' + ptVol.toFixed(1) + ' / 100 <em class="' + momClass + '">(' + momStr + ')</em></strong>' +
    '</div>' +
    '<div class="spec-d3-readout-cell">' +
      '<span class="spec-d3-ro-k">±1σ Rolling Band</span>' +
      '<strong class="spec-d3-ro-v">' + envStr + ' (' + zStr + ')</strong>' +
    '</div>' +
    '<div class="spec-d3-readout-cell">' +
      '<span class="spec-d3-ro-k">Entry Signal</span>' +
      '<strong class="spec-d3-ro-v is-signal">' + esc(buyRec) + '</strong>' +
    '</div>';
}

function renderSpecPeakEventChips(analytics, selectedMonth) {
  var chipsBox = document.getElementById("spec-d3-event-chips");
  if (!chipsBox) return;
  var peakEvents = analytics && Array.isArray(analytics.peakEvents) ? analytics.peakEvents : [];
  if (peakEvents.length === 0) {
    chipsBox.innerHTML = "";
    chipsBox.style.display = "none";
    return;
  }
  chipsBox.style.display = "flex";
  var activeMonth =
    selectedMonth ||
    (peakEvents.find(function(e) { return e.isPrimaryPeak; }) || peakEvents[0]).month;

  var html = '<span class="spec-d3-events-prefix">Flagged Events:</span>';
  for (var i = 0; i < peakEvents.length; i++) {
    var ev = peakEvents[i];
    var isAct = ev.month === activeMonth;
    var chipClass =
      "spec-d3-event-chip" +
      (ev.isPrimaryPeak ? " is-primary" : " is-secondary") +
      (isAct ? " is-active" : "");
    html +=
      '<button type="button" class="' + chipClass + '" data-testid="spec-d3-event-chip-' + esc(ev.month) + '" data-month="' + esc(ev.month) + '" onclick="selectSpecPeakVolatilityEvent(\'' + esc(ev.month) + '\')" title="' + esc(ev.headline + " — " + ev.summary) + '">' +
        '<span>' + esc(ev.badgeLabel) + '</span>' +
      '</button>';
  }
  chipsBox.innerHTML = html;
}

function renderSpecAdvancedPriceTrends(p, history, transitionOpts) {
  if (!p) return;
  var series = Array.isArray(history) && history.length > 0 ? history : getProductPriceHistory(p);
  activeSpecPriceHistoryCache = series;

  var d3Container = document.getElementById("spec-d3-volatility-chart");
  var kpiGrid = document.getElementById("spec-volatility-kpi-grid");
  var regimeBadge = document.getElementById("spec-volatility-regime-badge");
  var isReducedMotion = Boolean(
    (transitionOpts && transitionOpts.reducedMotion) ||
    (typeof userAdvancedSettings === "object" && userAdvancedSettings && userAdvancedSettings.reducedMotion)
  );
  var selMonth =
    transitionOpts && transitionOpts.selectedEventMonth !== undefined
      ? transitionOpts.selectedEventMonth
      : activeSpecSelectedEventMonth;

  var thresholdConfig = {
    enabled: Boolean(activeSpecHighVolThresholdEnabled),
    sigmaThreshold: Number(activeSpecHighVolSigma || 2.0)
  };

  var analytics = null;
  if (typeof window.renderVoltboxD3AdvancedPriceTrends === "function" && d3Container) {
    analytics = window.renderVoltboxD3AdvancedPriceTrends(d3Container, series, {
      mode: activeSpecD3TrendMode,
      previousMode: transitionOpts && transitionOpts.previousMode !== undefined ? transitionOpts.previousMode : undefined,
      animateTransition: transitionOpts && transitionOpts.animateTransition !== undefined ? transitionOpts.animateTransition : true,
      reducedMotion: isReducedMotion,
      selectedEventMonth: selMonth,
      thresholdConfig: thresholdConfig,
      legendVisible: activeSpecD3LegendVisible,
      zoomTransform: activeSpecD3ZoomTransform,
      height: 196,
      accentColor: "#2dd4bf",
      secondaryColor: "#f59e0b",
      onPointHover: function(pt, computed) {
        updateSpecD3HoverReadout(pt, computed);
      },
      onPeakEventSelect: function(ev, pt, computed) {
        activeSpecSelectedEventMonth = ev.month;
        renderSpecPeakEventChips(computed, ev.month);
        updateSpecD3HoverReadout(pt, computed);
      },
      onZoomPanChange: function(zoomState) {
        activeSpecD3ZoomTransform = { k: zoomState.k, x: zoomState.x };
        updateSpecD3ZoomPanUI(zoomState);
      }
    });
  } else if (window.VoltboxQR && typeof window.VoltboxQR.computeAdvancedPriceTrends === "function") {
    analytics = window.VoltboxQR.computeAdvancedPriceTrends(series, thresholdConfig);
  }

  activeSpecAnalyticsCache = analytics;
  if (!analytics) return;

  updateSpecHighVolatilityThresholdUI(analytics);
  updateSpecD3LegendVisibilityUI(false);
  renderSpecPeakEventChips(analytics, selMonth);
  if (d3Container && d3Container.__voltboxD3ZoomController) {
    updateSpecD3ZoomPanUI(d3Container.__voltboxD3ZoomController.getState());
  }

  var volIndex = Number(analytics.sixMonthVolatilityIndex !== undefined ? analytics.sixMonthVolatilityIndex : (analytics.volatilityIndex || 0));
  var regLabel = analytics.volatilityRegimeLabel || analytics.regimeLabel || "Low Volatility";
  var regTier = String(analytics.volatilityRegime || analytics.regime || "low").toLowerCase();
  var stdDevUsd = Number(analytics.standardDeviationUsd !== undefined ? analytics.standardDeviationUsd : (analytics.stdDevUsd || 0));
  var spreadUsd = Number(analytics.priceRangeSpreadUsd !== undefined ? analytics.priceRangeSpreadUsd : (analytics.priceSwingUsd || 0));
  var peakVol = Number(analytics.peakMonthlyVolatilityIndex || volIndex);
  var peakMonth = analytics.peakVolatilityMonth || "Sep";

  if (regimeBadge) {
    regimeBadge.textContent = regLabel + " (" + volIndex.toFixed(1) + "/100)";
    regimeBadge.className = "spec-volatility-regime-badge regime-" + regTier;
  }
  var volNavBadge = document.getElementById("spec-nav-vol-badge");
  if (volNavBadge && Number.isFinite(volIndex) && volIndex > 0) {
    volNavBadge.textContent = Math.round(volIndex) + "v";
    volNavBadge.hidden = false;
  }

  if (kpiGrid) {
    var zVal = Number(analytics.currentZScore || 0);
    var zText = (zVal > 0 ? "+" : "") + zVal.toFixed(2) + "σ";
    var zTone = zVal <= -0.35 ? "is-favorable" : (zVal >= 0.75 ? "is-elevated" : "is-neutral");
    kpiGrid.innerHTML =
      '<div class="spec-vol-kpi-card" data-testid="spec-kpi-volatility-index">' +
        '<span class="spec-vol-kpi-label">6M Volatility Index</span>' +
        '<strong class="spec-vol-kpi-val is-amber">' + volIndex.toFixed(1) + '<small>/100</small></strong>' +
        '<span class="spec-vol-kpi-sub">' + esc(regLabel) + ' · Peak ' + esc(peakMonth) + ' (' + peakVol.toFixed(0) + ')</span>' +
      '</div>' +
      '<div class="spec-vol-kpi-card" data-testid="spec-kpi-stddev">' +
        '<span class="spec-vol-kpi-label">Std Dev &amp; CoV (σ)</span>' +
        '<strong class="spec-vol-kpi-val">±$' + stdDevUsd.toFixed(2) + '</strong>' +
        '<span class="spec-vol-kpi-sub">CoV ' + Number(analytics.coefficientOfVariationPct || 0).toFixed(2) + '% · Range $' + spreadUsd.toFixed(2) + '</span>' +
      '</div>' +
      '<div class="spec-vol-kpi-card" data-testid="spec-kpi-drawdown">' +
        '<span class="spec-vol-kpi-label">Max 6M Drawdown</span>' +
        '<strong class="spec-vol-kpi-val is-teal">-' + Number(analytics.maxDrawdownPct || 0).toFixed(2) + '%</strong>' +
        '<span class="spec-vol-kpi-sub">6M Low $' + Number(analytics.sixMonthLow || 0).toFixed(2) + ' / High $' + Number(analytics.sixMonthHigh || 0).toFixed(2) + '</span>' +
      '</div>' +
      '<div class="spec-vol-kpi-card" data-testid="spec-kpi-zscore">' +
        '<span class="spec-vol-kpi-label">Z-Score &amp; Timing</span>' +
        '<strong class="spec-vol-kpi-val ' + zTone + '">' + zText + '</strong>' +
        '<span class="spec-vol-kpi-sub">' + esc(analytics.buySignalLabel || "Fair Value Band") + ' (Mean $' + Number(analytics.sixMonthMean || 0).toFixed(2) + ')</span>' +
      '</div>';
  }

  if (analytics.points && analytics.points.length > 0) {
    updateSpecD3HoverReadout(analytics.points[analytics.points.length - 1], analytics);
  }
}

function updateSpecD3ZoomPanUI(zoomState) {
  if (!zoomState) return;
  var zoomBar = document.getElementById("spec-d3-zoom-bar");
  var scaleEl = document.getElementById("spec-d3-zoom-scale");
  var windowEl = document.getElementById("spec-d3-zoom-window");
  var hintEl = document.getElementById("spec-d3-zoom-hint");
  var panLeftBtn = document.getElementById("spec-d3-pan-left-btn");
  var panRightBtn = document.getElementById("spec-d3-pan-right-btn");
  var zoomOutBtn = document.getElementById("spec-d3-zoom-out-btn");
  var zoomInBtn = document.getElementById("spec-d3-zoom-in-btn");
  var resetBtn = document.getElementById("spec-d3-zoom-reset-btn");

  var isZoomed = Boolean(zoomState.isZoomed);
  if (zoomBar) {
    zoomBar.classList.toggle("is-zoomed", isZoomed);
    zoomBar.setAttribute("data-zoom-k", String(zoomState.k));
    zoomBar.setAttribute("data-zoom-x", String(zoomState.x));
    zoomBar.setAttribute("data-is-zoomed", isZoomed ? "true" : "false");
  }
  if (scaleEl) {
    scaleEl.textContent = zoomState.scaleLabel || (Number(zoomState.k || 1).toFixed(1) + "×");
    scaleEl.classList.toggle("is-active", isZoomed);
  }
  if (windowEl) {
    windowEl.textContent = zoomState.windowLabel || "May – Oct (All 6M)";
  }
  if (hintEl) {
    hintEl.textContent = isZoomed ? "Drag to pan" : "Wheel / drag";
  }
  if (zoomOutBtn) {
    zoomOutBtn.disabled = !isZoomed;
  }
  if (zoomInBtn) {
    zoomInBtn.disabled = Number(zoomState.k || 1) >= 3.98;
  }
  if (panLeftBtn) {
    panLeftBtn.disabled = !isZoomed || Boolean(zoomState.isAtLeftEdge);
  }
  if (panRightBtn) {
    panRightBtn.disabled = !isZoomed || Boolean(zoomState.isAtRightEdge);
  }
  if (resetBtn) {
    resetBtn.disabled = !isZoomed;
    resetBtn.classList.toggle("is-active", isZoomed);
  }
}

function zoomSpecD3VolatilityChart(factor, anchorRatio) {
  var d3Container = document.getElementById("spec-d3-volatility-chart");
  if (d3Container && d3Container.__voltboxD3ZoomController) {
    return d3Container.__voltboxD3ZoomController.zoomBy(factor, anchorRatio);
  }
  return null;
}
window.zoomSpecD3VolatilityChart = zoomSpecD3VolatilityChart;

function panSpecD3VolatilityChart(deltaX) {
  var d3Container = document.getElementById("spec-d3-volatility-chart");
  if (d3Container && d3Container.__voltboxD3ZoomController) {
    return d3Container.__voltboxD3ZoomController.panBy(deltaX);
  }
  return null;
}
window.panSpecD3VolatilityChart = panSpecD3VolatilityChart;

function resetSpecD3VolatilityZoom() {
  activeSpecD3ZoomTransform = { k: 1, x: 0 };
  var d3Container = document.getElementById("spec-d3-volatility-chart");
  if (d3Container && d3Container.__voltboxD3ZoomController) {
    return d3Container.__voltboxD3ZoomController.resetZoom();
  }
  return null;
}
window.resetSpecD3VolatilityZoom = resetSpecD3VolatilityZoom;

function setSpecD3VolatilityZoomTransform(transformInput) {
  var d3Container = document.getElementById("spec-d3-volatility-chart");
  if (d3Container && d3Container.__voltboxD3ZoomController) {
    return d3Container.__voltboxD3ZoomController.applyTransform(transformInput, "direct");
  }
  return null;
}
window.setSpecD3VolatilityZoomTransform = setSpecD3VolatilityZoomTransform;

// ── Product URL, Social Share & QR Code Generator ──
var activeQrTheme = "gold"; // Voltbox Signature Electric Gold
var activeShareTone = "spec"; // 'spec' | 'deal' | 'concise'
var qrScanStream = null;
var qrScanAnimFrame = null;
var qrFacingMode = "environment";
var qrScanningActive = false;
var qrAudioContext = null;

function getProductShareUrl(productId) {
  var id = productId || activeSpecProductId;
  if (!id) return window.location.origin;
  if (window.VoltboxQR && typeof window.VoltboxQR.generateProductUrl === "function") {
    return window.VoltboxQR.generateProductUrl(id, window.location.origin);
  }
  return window.location.origin + "/?product=" + encodeURIComponent(String(id));
}

function buildClientProductShareDescription(p, tone) {
  if (!p) return "Check out this PC hardware component on Voltbox Electronics!";
  var selectedTone = tone || activeShareTone || "spec";
  var rawSpecs = (p.specs && typeof p.specs === "object") ? p.specs : {};
  var skuStr = (typeof getSkuFor === "function") ? getSkuFor(p) : (p.sku || ("VBX-" + p.id));

  if (window.VoltboxQR && typeof window.VoltboxQR.generateProductShareDescription === "function") {
    return window.VoltboxQR.generateProductShareDescription({
      id: p.id,
      title: p.title,
      price: Number(p.price || 0),
      category: p.category || "Hardware",
      sku: skuStr,
      specs: {
        architecture: rawSpecs.architecture,
        interfaceSpec: rawSpecs.interfaceSpec,
        powerDraw: rawSpecs.powerDraw
      }
    }, "", selectedTone);
  }
  var priceStr = "$" + Number(p.price || 0).toFixed(2);
  var arch = rawSpecs.architecture || "Precision Solid-State";
  var iface = rawSpecs.interfaceSpec || "PCIe 4.0 / USB-C";
  var pwr = rawSpecs.powerDraw || "65W Nominal";
  if (selectedTone === "deal") {
    return "⚡ Hardware Drop on Voltbox: " + p.title + " (" + skuStr + ") is live at " + priceStr + "! Features " + arch + " & " + iface + " — qualifies for the 5% Rig Builder Bundle.";
  }
  if (selectedTone === "concise") {
    return "Check out " + p.title + " (" + priceStr + " · SKU " + skuStr + ") on Voltbox Electronics!";
  }
  return "🔧 " + p.title + " [" + priceStr + " · " + skuStr + "] on Voltbox Electronics — " + arch + ", " + iface + ", " + pwr + ". Bench-verified & ready to ship!";
}

function computeSocialShareLinks(shareUrl, description) {
  var cleanUrl = String(shareUrl || window.location.origin).trim();
  var cleanDesc = String(description || "").trim();
  if (window.VoltboxQR && typeof window.VoltboxQR.buildSocialShareUrls === "function") {
    return window.VoltboxQR.buildSocialShareUrls(cleanUrl, cleanDesc);
  }
  var combined = cleanDesc ? (cleanDesc + " " + cleanUrl) : cleanUrl;
  return {
    twitter: "https://twitter.com/intent/tweet?text=" + encodeURIComponent(cleanDesc) + "&url=" + encodeURIComponent(cleanUrl) + "&hashtags=" + encodeURIComponent("Voltbox,PCHardware"),
    whatsapp: "https://wa.me/?text=" + encodeURIComponent(combined),
    facebook: "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(cleanUrl) + "&quote=" + encodeURIComponent(cleanDesc)
  };
}

function syncSpecSocialShareLinks() {
  var url = getProductShareUrl(activeSpecProductId);
  var descEl = document.getElementById("spec-share-generated-desc");
  var charCountEl = document.getElementById("spec-social-char-count");
  var desc = descEl ? descEl.value : "";
  if (charCountEl) {
    charCountEl.textContent = String(desc.length) + " chars";
  }
  var links = computeSocialShareLinks(url, desc);
  var twBtn = document.getElementById("spec-share-twitter-btn");
  var waBtn = document.getElementById("spec-share-whatsapp-btn");
  var fbBtn = document.getElementById("spec-share-facebook-btn");
  if (twBtn) twBtn.setAttribute("href", links.twitter);
  if (waBtn) waBtn.setAttribute("href", links.whatsapp);
  if (fbBtn) fbBtn.setAttribute("href", links.facebook);
  return links;
}

function setShareDescriptionTone(tone) {
  activeShareTone = tone || "spec";
  var toneGroup = document.getElementById("spec-share-tone-group");
  if (toneGroup) {
    var buttons = toneGroup.querySelectorAll(".spec-tone-chip");
    for (var i = 0; i < buttons.length; i++) {
      var isMatch = buttons[i].getAttribute("data-share-tone") === activeShareTone;
      buttons[i].classList.toggle("active", isMatch);
      buttons[i].setAttribute("aria-pressed", isMatch ? "true" : "false");
    }
  }
  var p = findProductById(activeSpecProductId);
  var descEl = document.getElementById("spec-share-generated-desc");
  if (p && descEl) {
    descEl.value = buildClientProductShareDescription(p, activeShareTone);
  }
  syncSpecSocialShareLinks();
}

function copyGeneratedSharePost() {
  var url = getProductShareUrl(activeSpecProductId);
  var descEl = document.getElementById("spec-share-generated-desc");
  var desc = descEl ? descEl.value.trim() : "";
  var fullPost = desc ? (desc + "\n" + url) : url;
  showSocialShareStatus("Generated description + product link copied to clipboard!");
  showActivityToast("Share post & link copied to clipboard!");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullPost).catch(function () {
      fallbackCopy(fullPost);
    });
  } else {
    fallbackCopy(fullPost);
  }
}

function showSocialShareStatus(msg) {
  var statusEl = document.getElementById("spec-social-share-status");
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.hidden = false;
}

function handleSocialPlatformShareClick(e, platformName) {
  var links = syncSpecSocialShareLinks();
  var key = String(platformName || "").toLowerCase();
  var targetHref = links[key] || links.twitter;
  var url = getProductShareUrl(activeSpecProductId);
  var descEl = document.getElementById("spec-share-generated-desc");
  var desc = descEl ? descEl.value.trim() : "";
  var fullPost = desc ? (desc + " " + url) : url;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullPost).catch(function () {});
  }
  showSocialShareStatus(platformName + " share link ready & post copied! Opening " + platformName + " composer (" + targetHref.slice(0, 48) + "...)");
  showActivityToast("Sharing to " + platformName + " — post & link ready!");
}

function prepareProductShare(p) {
  if (!p) return;
  var url = getProductShareUrl(p.id);
  var inputEl = document.getElementById("spec-share-url-input");
  if (inputEl) inputEl.value = url;

  var descEl = document.getElementById("spec-share-generated-desc");
  if (descEl) {
    descEl.value = buildClientProductShareDescription(p, activeShareTone);
  }
  var statusEl = document.getElementById("spec-social-share-status");
  if (statusEl) {
    statusEl.hidden = true;
    statusEl.textContent = "";
  }
  syncSpecSocialShareLinks();

  var mountEl = document.getElementById("spec-qr-mount");
  if (!mountEl) return;

  if (window.VoltboxQR && typeof window.VoltboxQR.renderQrIntoElement === "function") {
    window.VoltboxQR.renderQrIntoElement(mountEl, url, {
      margin: 1,
      theme: activeQrTheme
    });
  } else {
    fetch("/api/products/" + p.id + "/qr?theme=" + encodeURIComponent(activeQrTheme))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.qrSvg && mountEl) {
          mountEl.innerHTML = data.qrSvg;
        }
      })
      .catch(function () {});
  }
}

function toggleProductShareCard(forceOpen) {
  var card = document.getElementById("spec-share-card");
  if (!card) return;
  var nextState = (forceOpen !== undefined) ? Boolean(forceOpen) : card.hidden;
  card.hidden = !nextState;
  var headBtn = document.getElementById("spec-head-share-btn");
  var barBtn = document.getElementById("spec-share-btn");
  if (headBtn) headBtn.classList.toggle("active", nextState);
  if (barBtn) barBtn.classList.toggle("active", nextState);

  if (nextState) {
    var p = findProductById(activeSpecProductId);
    if (p) prepareProductShare(p);
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function copyProductShareUrl() {
  var url = getProductShareUrl(activeSpecProductId);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function () {
      showActivityToast("Product direct link copied to clipboard!");
    }).catch(function () {
      fallbackCopy(url);
    });
  } else {
    fallbackCopy(url);
  }
}

function fallbackCopy(text) {
  var inputEl = document.getElementById("spec-share-url-input");
  if (inputEl) {
    inputEl.select();
    inputEl.setSelectionRange(0, 99999);
    try {
      document.execCommand("copy");
      showActivityToast("Product direct link copied to clipboard!");
    } catch (e) {
      showActivityToast("Link: " + text);
    }
  }
}

function shareProductNative() {
  var p = findProductById(activeSpecProductId);
  var url = getProductShareUrl(activeSpecProductId);
  var title = p ? p.title : "Voltbox Component";
  var descEl = document.getElementById("spec-share-generated-desc");
  var text = (descEl && descEl.value.trim()) ? descEl.value.trim() : ("Check out " + title + " on Voltbox Electronics!");

  if (navigator.share) {
    navigator.share({
      title: title,
      text: text,
      url: url
    }).catch(function (err) {
      if (err.name !== "AbortError") {
        copyGeneratedSharePost();
      }
    });
  } else {
    copyGeneratedSharePost();
  }
}

function downloadProductQrCode() {
  var p = findProductById(activeSpecProductId);
  var id = p ? p.id : (activeSpecProductId || 1);
  var title = (p ? p.title : "voltbox-product").replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  var url = getProductShareUrl(id);

  if (window.VoltboxQR && typeof window.VoltboxQR.generateQrDataUrl === "function") {
    window.VoltboxQR.generateQrDataUrl(url, { width: 320, margin: 1, theme: activeQrTheme }).then(function (dataUrl) {
      triggerDownload(dataUrl, title + "-" + activeQrTheme + "-qr.png");
      showActivityToast("Voltbox branded QR code downloaded!");
    });
  } else {
    fetch("/api/products/" + id + "/qr?theme=" + encodeURIComponent(activeQrTheme))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.qrDataUrl) {
          triggerDownload(data.qrDataUrl, title + "-" + activeQrTheme + "-qr.png");
          showActivityToast("Voltbox branded QR code downloaded!");
        }
      });
  }
}

function triggerDownload(dataUrl, filename) {
  var a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Camera QR Code Scanner Implementation ──

var qrAudioContext = null;
var QR_AUDIO_PING_STORAGE_KEY = "voltbox_qr_audio_ping_enabled";

function isQrAudioPingEnabled() {
  try {
    var stored = localStorage.getItem(QR_AUDIO_PING_STORAGE_KEY);
    if (stored !== null) return stored === "true";
  } catch (e) {}
  return true;
}

function setQrAudioPingEnabled(enabled) {
  try {
    localStorage.setItem(QR_AUDIO_PING_STORAGE_KEY, enabled ? "true" : "false");
  } catch (e) {}
  updateQrAudioToggleUi();
}

function initOrResumeQrAudioContext() {
  try {
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!qrAudioContext) {
      qrAudioContext = new AudioCtx();
    }
    if (qrAudioContext.state === "suspended") {
      qrAudioContext.resume().catch(function () {});
    }
    return qrAudioContext;
  } catch (e) {
    return null;
  }
}

function updateQrAudioToggleUi() {
  var enabled = isQrAudioPingEnabled();
  var toggleBtn = document.getElementById("qr-audio-toggle-btn");
  var toggleLabel = document.getElementById("qr-audio-toggle-label");
  var kickerPill = document.getElementById("qr-audio-kicker-pill");
  var kickerLabel = document.getElementById("qr-audio-kicker-label");

  var stateInfo = (window.VoltboxQR && typeof window.VoltboxQR.formatAudioPingToggleState === "function")
    ? window.VoltboxQR.formatAudioPingToggleState(enabled)
    : {
        enabled: enabled,
        label: enabled ? "Audio Ping: ON" : "Audio Ping: MUTED",
        icon: enabled ? "volume-2" : "volume-x",
        ariaLabel: enabled ? "Audio ping feedback enabled. Click to mute sound." : "Audio ping feedback muted. Click to enable sound."
      };

  if (toggleBtn) {
    toggleBtn.className = "qr-scanner-btn audio-toggle" + (enabled ? "" : " muted");
    toggleBtn.setAttribute("aria-pressed", String(enabled));
    toggleBtn.setAttribute("aria-label", stateInfo.ariaLabel);
    var iconSpan = toggleBtn.querySelector("[data-icon]");
    if (iconSpan) {
      iconSpan.setAttribute("data-icon", stateInfo.icon);
      if (typeof renderIcons === "function") renderIcons(toggleBtn);
    }
  }
  if (toggleLabel) {
    toggleLabel.textContent = stateInfo.label;
  }
  if (kickerPill) {
    kickerPill.className = "qr-audio-kicker-pill" + (enabled ? "" : " muted");
    var pillIconSpan = kickerPill.querySelector("[data-icon]");
    if (pillIconSpan) {
      pillIconSpan.setAttribute("data-icon", stateInfo.icon);
      if (typeof renderIcons === "function") renderIcons(kickerPill);
    }
  }
  if (kickerLabel) {
    kickerLabel.textContent = enabled ? "AUDIO PING ON" : "AUDIO PING MUTED";
  }
}

function playScanSuccessChime(forcePreview) {
  var enabled = isQrAudioPingEnabled();
  if (!enabled && !forcePreview) return;

  try {
    var ctx = initOrResumeQrAudioContext();
    if (!ctx) return;

    var scheduleAudioPing = function (audioCtx) {
      try {
        var now = audioCtx.currentTime;
        var activeProfile = (window.voltboxAdvSettings && window.voltboxAdvSettings.audioPingProfile) || "subtle";
        var cfg = (window.VoltboxQR && typeof window.VoltboxQR.getScanPingAudioConfig === "function")
          ? window.VoltboxQR.getScanPingAudioConfig(activeProfile)
          : {
              masterGain: 0.22,
              tones: [
                { freq: 1046.50, type: "sine", gain: 0.18, durationSec: 0.18, delaySec: 0 },
                { freq: 1567.98, type: "sine", gain: 0.075, durationSec: 0.12, delaySec: 0.012 }
              ],
              vibrationPattern: [30, 20, 40]
            };

        var masterGainNode = audioCtx.createGain();
        masterGainNode.gain.setValueAtTime(cfg.masterGain || 0.22, now);
        masterGainNode.connect(audioCtx.destination);

        cfg.tones.forEach(function (tone) {
          var toneStart = now + (tone.delaySec || 0);
          var attackDur = 0.003;
          var peakTime = toneStart + attackDur;
          var stopTime = toneStart + Math.max(0.04, tone.durationSec || 0.18);

          var osc = audioCtx.createOscillator();
          var toneGain = audioCtx.createGain();

          osc.type = tone.type || "sine";
          osc.frequency.setValueAtTime(tone.freq, toneStart);

          toneGain.gain.setValueAtTime(0.0001, toneStart);
          toneGain.gain.linearRampToValueAtTime(tone.gain || 0.15, peakTime);
          toneGain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

          osc.connect(toneGain);
          toneGain.connect(masterGainNode);

          osc.start(toneStart);
          osc.stop(stopTime + 0.02);
        });

        if (navigator.vibrate && cfg.vibrationPattern) {
          navigator.vibrate(cfg.vibrationPattern);
        }
      } catch (scheduleErr) {
        console.warn("Audio ping scheduler error:", scheduleErr);
      }
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(function () {
        scheduleAudioPing(ctx);
      }).catch(function () {});
    } else {
      scheduleAudioPing(ctx);
    }
  } catch (e) {
    console.warn("AudioContext error:", e);
  }
}

function triggerQrScanPingFeedback(customLabel) {
  // 1. Acoustic confirmation chime
  playScanSuccessChime();

  // 2. Kicker pill pulse
  var kickerPill = document.getElementById("qr-audio-kicker-pill");
  if (kickerPill) {
    kickerPill.classList.add("ping-active");
    setTimeout(function () { kickerPill.classList.remove("ping-active"); }, 750);
  }

  // 3. Reticle emerald lock
  var reticle = document.getElementById("qr-scanner-reticle");
  if (reticle) {
    reticle.classList.add("scan-detected");
  }

  // 4. Visual viewfinder flash
  var flash = document.getElementById("qr-scanner-ping-flash");
  var badgeText = document.getElementById("qr-ping-badge-text");
  if (badgeText && customLabel) {
    badgeText.textContent = customLabel;
  }
  if (flash) {
    flash.classList.add("active");
  }
}

function resetQrScanPingFeedback() {
  var reticle = document.getElementById("qr-scanner-reticle");
  if (reticle) {
    reticle.classList.remove("scan-detected");
  }
  var flash = document.getElementById("qr-scanner-ping-flash");
  if (flash) {
    flash.classList.remove("active");
  }
}

function openQrScannerModal() {
  var overlay = document.getElementById("qr-scanner-overlay");
  if (!overlay) return;
  initOrResumeQrAudioContext();
  updateQrAudioToggleUi();
  resetQrScanPingFeedback();
  loadQrScanHistory();
  renderQrScanHistory();
  openModal(overlay);
  startQrCamera();
}

function closeQrScannerModal() {
  var overlay = document.getElementById("qr-scanner-overlay");
  if (!overlay) return;
  stopQrCamera();
  resetQrScanPingFeedback();
  closeModal(overlay);
}

function updateScannerStatus(text, isError) {
  var textEl = document.getElementById("qr-scanner-status-text");
  var dotEl = document.getElementById("qr-scanner-status-dot");
  if (textEl) textEl.textContent = text;
  if (dotEl) {
    dotEl.className = isError ? "status-indicator-dot error" : "status-indicator-dot pulse";
  }
}

function startQrCamera() {
  var video = document.getElementById("qr-scanner-video");
  if (!video) return;

  qrScanningActive = true;
  updateScannerStatus("Initializing optical camera sensor…", false);

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    updateScannerStatus("Webcam hardware not supported on this browser. Upload QR image or use simulation below.", true);
    return;
  }

  var constraints = {
    audio: false,
    video: {
      facingMode: qrFacingMode,
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  };

  navigator.mediaDevices.getUserMedia(constraints)
    .then(function (stream) {
      if (!qrScanningActive) {
        stream.getTracks().forEach(function (t) { t.stop(); });
        return;
      }
      qrScanStream = stream;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      return video.play();
    })
    .then(function () {
      updateScannerStatus("Align product QR code within reticle frame", false);
      qrScanAnimFrame = requestAnimationFrame(scanVideoFrameLoop);
    })
    .catch(function (err) {
      console.warn("Camera sensor unavailable:", err);
      updateScannerStatus("Camera unavailable — upload QR image or simulate below", true);
    });
}

function stopQrCamera() {
  qrScanningActive = false;
  if (qrScanAnimFrame) {
    cancelAnimationFrame(qrScanAnimFrame);
    qrScanAnimFrame = null;
  }
  if (qrScanStream) {
    qrScanStream.getTracks().forEach(function (t) { t.stop(); });
    qrScanStream = null;
  }
  var video = document.getElementById("qr-scanner-video");
  if (video) {
    video.srcObject = null;
  }
}

function flipQrCamera() {
  qrFacingMode = (qrFacingMode === "environment") ? "user" : "environment";
  stopQrCamera();
  startQrCamera();
}

function scanVideoFrameLoop() {
  if (!qrScanningActive) return;
  var video = document.getElementById("qr-scanner-video");
  var canvas = document.getElementById("qr-scanner-canvas");
  if (!video || !canvas || video.readyState < video.HAVE_CURRENT_DATA) {
    qrScanAnimFrame = requestAnimationFrame(scanVideoFrameLoop);
    return;
  }

  var w = video.videoWidth || 640;
  var h = video.videoHeight || 480;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }

  var ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (ctx) {
    ctx.drawImage(video, 0, 0, w, h);
    var imgData = ctx.getImageData(0, 0, w, h);

    // 1. Native BarcodeDetector (Chrome/Edge/Android)
    if (window.BarcodeDetector) {
      try {
        var detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        detector.detect(video).then(function (barcodes) {
          if (barcodes && barcodes.length > 0 && qrScanningActive) {
            handleSuccessfulQrScan(barcodes[0].rawValue);
          } else if (qrScanningActive) {
            qrScanAnimFrame = requestAnimationFrame(scanVideoFrameLoop);
          }
        }).catch(function () {
          decodeWithJsQr(imgData);
        });
        return;
      } catch (e) {
        decodeWithJsQr(imgData);
        return;
      }
    }

    decodeWithJsQr(imgData);
    return;
  }

  qrScanAnimFrame = requestAnimationFrame(scanVideoFrameLoop);
}

function decodeWithJsQr(imgData) {
  if (!qrScanningActive) return;
  if (window.VoltboxQR && typeof window.VoltboxQR.decodeQrFromImageData === "function") {
    var res = window.VoltboxQR.decodeQrFromImageData(imgData);
    if (res && res.data) {
      handleSuccessfulQrScan(res.data);
      return;
    }
  }
  qrScanAnimFrame = requestAnimationFrame(scanVideoFrameLoop);
}

function handleSuccessfulQrScan(rawPayload) {
  if (!rawPayload) return;
  stopQrCamera();

  var parseRes = (window.VoltboxQR && typeof window.VoltboxQR.parseScannedProduct === "function")
    ? window.VoltboxQR.parseScannedProduct(rawPayload, products)
    : parseFallbackScannedProduct(rawPayload);

  var targetId = parseRes ? parseRes.productId : null;

  if (targetId) {
    var targetProduct = findProductById(targetId);
    if (targetProduct) {
      recordProductInQrScanHistory(targetProduct);
    } else {
      recordProductInQrScanHistory({
        id: Number(targetId),
        title: "Hardware Component #" + targetId,
        sku: "VB-PRT-" + String(targetId).padStart(3, "0"),
        category: "components",
        price: 0,
        image: tileFor("components")
      });
    }

    var productLabel = targetProduct ? targetProduct.title : ("Part #" + targetId);
    triggerQrScanPingFeedback("✓ " + productLabel);
    updateScannerStatus("Recognized " + productLabel + " · Specs loading…", false);

    setTimeout(function () {
      closeQrScannerModal();

      var card = document.getElementById("card-" + targetId);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("restock-flash");
        setTimeout(function () { card.classList.remove("restock-flash"); }, 2000);
      }

      openSpecDrawer(targetId);
      showActivityToast("QR Code recognized: " + productLabel);
    }, 380);
  } else {
    updateScannerStatus("Unrecognized QR payload: " + rawPayload.slice(0, 36), true);
    setTimeout(function () {
      if (document.getElementById("qr-scanner-overlay").classList.contains("open")) {
        startQrCamera();
      }
    }, 1800);
  }
}

// ── QR Scanner 'Scan History' (Last 10 Scanned Products) ──

function loadQrScanHistory() {
  try {
    var raw = localStorage.getItem(QR_SCAN_HISTORY_STORAGE_KEY);
    if (!raw) {
      qrScanHistory = [];
      return qrScanHistory;
    }
    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      qrScanHistory = [];
      return qrScanHistory;
    }
    qrScanHistory = parsed
      .filter(function (item) {
        return item && typeof item.productId === "number" && item.productId > 0;
      })
      .map(function (item) {
        var liveProduct = findProductById(item.productId);
        if (liveProduct) {
          return {
            productId: Number(liveProduct.id),
            title: liveProduct.title || item.title || ("Part #" + liveProduct.id),
            sku: getSkuFor(liveProduct),
            category: liveProduct.category || item.category || "components",
            price: typeof liveProduct.price === "number" ? liveProduct.price : Number(item.price || 0),
            image: getProductImageUrl(liveProduct),
            scannedAt: Number(item.scannedAt) || Date.now(),
            scanCount: Math.max(1, Number(item.scanCount || 1))
          };
        }
        return {
          productId: Number(item.productId),
          title: String(item.title || ("Part #" + item.productId)),
          sku: String(item.sku || ("VB-PRT-" + String(item.productId).padStart(3, "0"))),
          category: String(item.category || "components"),
          price: Number(item.price || 0),
          image: item.image || tileFor(item.category || "components"),
          scannedAt: Number(item.scannedAt) || Date.now(),
          scanCount: Math.max(1, Number(item.scanCount || 1))
        };
      })
      .slice(0, MAX_QR_SCAN_HISTORY);
  } catch (e) {
    qrScanHistory = [];
  }
  return qrScanHistory;
}

function saveQrScanHistory() {
  try {
    localStorage.setItem(
      QR_SCAN_HISTORY_STORAGE_KEY,
      JSON.stringify((qrScanHistory || []).slice(0, MAX_QR_SCAN_HISTORY))
    );
  } catch (e) {}
}

function recordProductInQrScanHistory(product) {
  if (!product || !product.id) return;
  loadQrScanHistory();
  var pid = Number(product.id);
  var sku = getSkuFor(product);
  var imgUrl = getProductImageUrl(product);
  var normalizedProduct = {
    id: pid,
    title: product.title || product.name || ("Part #" + pid),
    sku: sku,
    category: product.category || "components",
    price: typeof product.price === "number" ? product.price : Number(product.price || 0),
    image: imgUrl
  };

  if (window.VoltboxQR && typeof window.VoltboxQR.recordScannedProduct === "function") {
    qrScanHistory = window.VoltboxQR.recordScannedProduct(qrScanHistory, normalizedProduct, Date.now());
  } else {
    var existingIdx = -1;
    for (var i = 0; i < qrScanHistory.length; i++) {
      if (Number(qrScanHistory[i].productId) === pid) {
        existingIdx = i;
        break;
      }
    }
    var prevCount = existingIdx !== -1 ? Math.max(1, Number(qrScanHistory[existingIdx].scanCount || 1)) : 0;
    if (existingIdx !== -1) {
      qrScanHistory.splice(existingIdx, 1);
    }
    qrScanHistory.unshift({
      productId: pid,
      title: normalizedProduct.title,
      sku: normalizedProduct.sku,
      category: normalizedProduct.category,
      price: normalizedProduct.price,
      image: normalizedProduct.image,
      scannedAt: Date.now(),
      scanCount: prevCount + 1
    });
    qrScanHistory = qrScanHistory.slice(0, MAX_QR_SCAN_HISTORY);
  }

  saveQrScanHistory();
  renderQrScanHistory();
}

function formatScanTimeAgo(scannedAt) {
  if (window.VoltboxQR && typeof window.VoltboxQR.formatScanHistoryRelativeTime === "function") {
    return window.VoltboxQR.formatScanHistoryRelativeTime(scannedAt, Date.now());
  }
  var ts = Number(scannedAt);
  if (!isFinite(ts) || ts <= 0) return "Recently";
  var diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 45) return "Just now";
  var diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return diffMin + "m ago";
  var diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr + "h ago";
  return Math.floor(diffHr / 24) + "d ago";
}

function renderQrScanHistory() {
  var listEl = document.getElementById("qr-scan-history-list");
  var countEl = document.getElementById("qr-scan-history-count");
  var clearBtnEl = document.getElementById("qr-scan-history-clear-btn");
  if (!listEl) return;

  var items = Array.isArray(qrScanHistory) ? qrScanHistory.slice(0, MAX_QR_SCAN_HISTORY) : [];

  if (countEl) {
    countEl.textContent = items.length + " / " + MAX_QR_SCAN_HISTORY;
  }
  if (clearBtnEl) {
    clearBtnEl.hidden = items.length === 0;
  }

  if (items.length === 0) {
    listEl.innerHTML =
      '<div class="qr-scan-history-empty" data-testid="qr-scan-history-empty">' +
        '<span class="qr-scan-history-empty-icon">' + icon("qr", 18) + '</span>' +
        '<div class="qr-scan-history-empty-copy">' +
          '<strong>No products scanned yet</strong>' +
          '<span>Your last 10 scanned components will appear here for one-click revisit.</span>' +
        '</div>' +
      '</div>';
    return;
  }

  var html = "";
  for (var i = 0; i < items.length; i++) {
    var entry = items[i];
    var liveProduct = findProductById(entry.productId);
    var title = (liveProduct && liveProduct.title) ? liveProduct.title : entry.title;
    var sku = (liveProduct ? getSkuFor(liveProduct) : entry.sku) || ("VB-PRT-" + entry.productId);
    var price = (liveProduct && typeof liveProduct.price === "number") ? liveProduct.price : Number(entry.price || 0);
    var imgSrc = liveProduct ? getProductImageUrl(liveProduct) : (entry.image || tileFor(entry.category || "components"));
    var fallbackTile = tileFor((liveProduct && liveProduct.category) || entry.category || "components");
    var timeLabel = formatScanTimeAgo(entry.scannedAt);
    var countBadge = entry.scanCount > 1
      ? '<span class="qr-history-scan-count" title="Scanned ' + entry.scanCount + ' times">' + entry.scanCount + 'x</span>'
      : '';

    html +=
      '<div class="qr-scan-history-item" role="listitem" data-testid="qr-scan-history-item" data-product-id="' + entry.productId + '">' +
        '<button type="button" class="qr-history-revisit-btn" data-testid="qr-history-revisit-' + entry.productId + '" onclick="revisitScannedProduct(' + entry.productId + ')" title="Revisit ' + esc(title) + '">' +
          '<span class="qr-history-rank">#' + (i + 1) + '</span>' +
          '<img class="qr-history-thumb" src="' + esc(imgSrc) + '" alt="' + esc(title) + '" onerror="this.onerror=null;this.src=\'' + esc(fallbackTile) + '\';" />' +
          '<span class="qr-history-info">' +
            '<span class="qr-history-item-title">' + esc(title) + '</span>' +
            '<span class="qr-history-item-meta">' +
              '<span class="qr-history-sku">' + esc(sku) + '</span>' +
              '<span class="qr-history-dot">&bull;</span>' +
              '<span class="qr-history-price">$' + price.toFixed(2) + '</span>' +
              '<span class="qr-history-dot">&bull;</span>' +
              '<span class="qr-history-time">' + esc(timeLabel) + '</span>' +
              countBadge +
            '</span>' +
          '</span>' +
          '<span class="qr-history-open-pill">Revisit &rarr;</span>' +
        '</button>' +
        '<button type="button" class="qr-history-remove-btn" data-testid="qr-history-remove-' + entry.productId + '" onclick="removeQrScanHistoryItem(event, ' + entry.productId + ')" aria-label="Remove ' + esc(title) + ' from scan history" title="Remove from history">' +
          icon("x", 14) +
        '</button>' +
      '</div>';
  }

  listEl.innerHTML = html;
}

window.revisitScannedProduct = function (productId) {
  var pid = Number(productId);
  if (!pid) return;
  closeQrScannerModal();

  var targetProduct = findProductById(pid);
  var card = document.getElementById("card-" + pid);
  if (card) {
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("restock-flash");
    setTimeout(function () { card.classList.remove("restock-flash"); }, 2000);
  }

  openSpecDrawer(pid);
  showActivityToast("Revisited scanned item: " + (targetProduct ? targetProduct.title : ("Part #" + pid)));
};

window.removeQrScanHistoryItem = function (event, productId) {
  if (event && event.stopPropagation) event.stopPropagation();
  var pid = Number(productId);
  if (window.VoltboxQR && typeof window.VoltboxQR.removeScannedProduct === "function") {
    qrScanHistory = window.VoltboxQR.removeScannedProduct(qrScanHistory, pid);
  } else {
    qrScanHistory = (qrScanHistory || []).filter(function (item) {
      return item && Number(item.productId) !== pid;
    });
  }
  saveQrScanHistory();
  renderQrScanHistory();
};

window.clearQrScanHistory = function () {
  qrScanHistory = [];
  saveQrScanHistory();
  renderQrScanHistory();
  showActivityToast("QR Scan History cleared.");
};

function parseFallbackScannedProduct(rawText) {
  var clean = String(rawText || "").trim();
  var qMatch = clean.match(/[?&]product=(\d+)/i) || clean.match(/\/product\/(\d+)/i) || clean.match(/#product[=-](\d+)/i);
  if (qMatch) return { productId: Number(qMatch[1]) };
  if (/^\d+$/.test(clean)) return { productId: Number(clean) };
  var skuMatch = clean.match(/VB-[A-Z]{3}-(\d+)/i);
  if (skuMatch) return { productId: Number(skuMatch[1]) };
  return { productId: null };
}

window.simulateQrScan = function (productId) {
  var url = getProductShareUrl(productId);
  handleSuccessfulQrScan(url);
};

function handleQrImageUpload(file) {
  if (!file) return;
  updateScannerStatus("Processing uploaded QR image…", false);
  var reader = new FileReader();
  reader.onload = function (e) {
    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (window.VoltboxQR && typeof window.VoltboxQR.decodeQrFromImageData === "function") {
        var res = window.VoltboxQR.decodeQrFromImageData(imgData);
        if (res && res.data) {
          handleSuccessfulQrScan(res.data);
          return;
        }
      }
      updateScannerStatus("No valid QR code detected in uploaded image.", true);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleManualQrSubmit(e) {
  if (e) e.preventDefault();
  var input = document.getElementById("qr-manual-input");
  if (!input || !input.value.trim()) return;
  handleSuccessfulQrScan(input.value.trim());
}

function checkDeepLinkProduct() {
  var params = new URLSearchParams(window.location.search);
  var prodParam = params.get("product") || (window.location.hash.match(/product[=-](\d+)/) || [])[1];
  if (!prodParam) return;
  var targetId = Number(prodParam);
  if (!targetId) return;

  setTimeout(function () {
    var p = findProductById(targetId);
    if (p) {
      var card = document.getElementById("card-" + targetId);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("restock-flash");
      }
      openSpecDrawer(targetId);
      showActivityToast("Opened shared product: " + p.title);
    }
  }, 400);
}

function restockProduct(productId) {
  api("/api/products/" + productId + "/inventory", {
    method: "POST",
    body: JSON.stringify({ delta: 3, amount: 3, reason: "Spec Drawer Bench Restock" })
  })
    .then(function (r) { return r.json(); })
    .then(function (payload) {
      var updated = (payload && payload.product) ? payload.product : payload;
      if (updated && updated.id) {
        onProductRestocked(normalizeProductEntity(updated));
        fetchInventorySummary();
      }
    })
    .catch(function (err) {
      console.error("couldn't restock product:", err);
    });
}

window.onProductRestocked = function (updated) {
  if (!updated || !updated.id) return;
  updated = normalizeProductEntity(updated);
  for (var i = 0; i < products.length; i++) {
    if (products[i].id === updated.id) {
      products[i] = updated;
      break;
    }
  }
  refreshCard(updated.id);
  var card = document.getElementById("card-" + updated.id);
  if (card) {
    card.classList.remove("restock-flash");
    void card.offsetWidth;
    card.classList.add("restock-flash");
  }
  if (activeSpecProductId === updated.id) {
    populateSpecDrawer(updated);
  }
};

var lastWishlistToastProductId = null;

function dismissActivityToast() {
  if (!activityToastEl) return;
  clearTimeout(toastTimer);
  activityToastEl.classList.remove("visible");
  setTimeout(function () {
    if (activityToastEl) activityToastEl.hidden = true;
  }, 220);
}

window.showActivityToast = function (message) {
  if (!activityToastEl || !activityTextEl) return;
  var iconEl = document.getElementById("live-activity-icon");
  var badgeRowEl = document.getElementById("live-activity-badge-row");
  var subtextEl = document.getElementById("live-activity-subtext");
  var actionsEl = document.getElementById("live-activity-actions");

  activityToastEl.classList.remove("toast-wishlist-added", "toast-wishlist-removed");
  activityToastEl.removeAttribute("data-toast-type");
  if (iconEl) iconEl.innerHTML = icon("refresh", 15);
  if (badgeRowEl) badgeRowEl.hidden = true;
  if (subtextEl) {
    subtextEl.hidden = true;
    subtextEl.textContent = "";
  }
  if (actionsEl) actionsEl.hidden = true;

  activityTextEl.textContent = message;
  activityToastEl.hidden = false;
  activityToastEl.classList.add("visible");
  clearTimeout(toastTimer);
  var dur = (window.voltboxAdvSettings && window.voltboxAdvSettings.toastDurationMs) ? Number(window.voltboxAdvSettings.toastDurationMs) : 3800;
  toastTimer = setTimeout(function () {
    dismissActivityToast();
  }, dur);
};

window.showWishlistToast = function (product, added, wishlistCount) {
  if (window.voltboxAdvSettings && window.voltboxAdvSettings.wishlistToastsEnabled === false) {
    return;
  }
  if (!activityToastEl || !activityTextEl) return;

  var payload = (window.VoltboxQR && typeof window.VoltboxQR.buildWishlistToastPayload === "function")
    ? window.VoltboxQR.buildWishlistToastPayload(product, added, wishlistCount)
    : {
        productId: product ? Number(product.id) : 0,
        productTitle: product && product.title ? product.title : "Component",
        added: Boolean(added),
        actionType: added ? "wishlist-added" : "wishlist-removed",
        badgeLabel: added ? "Saved to Wishlist" : "Removed from Wishlist",
        headline: (added ? "Saved to Wishlist: " : "Removed from Wishlist: ") + (product && product.title ? product.title : "Component"),
        subline: wishlistCount + (wishlistCount === 1 ? " item in wishlist" : " items in wishlist"),
        undoActionLabel: added ? "Undo" : "Restore"
      };

  lastWishlistToastProductId = payload.productId;

  var iconEl = document.getElementById("live-activity-icon");
  var badgeRowEl = document.getElementById("live-activity-badge-row");
  var badgeEl = document.getElementById("live-activity-badge");
  var subtextEl = document.getElementById("live-activity-subtext");
  var actionsEl = document.getElementById("live-activity-actions");
  var undoBtn = document.getElementById("toast-undo-btn");

  activityToastEl.classList.remove("toast-wishlist-added", "toast-wishlist-removed");
  activityToastEl.classList.add(payload.added ? "toast-wishlist-added" : "toast-wishlist-removed");
  activityToastEl.setAttribute("data-toast-type", payload.actionType);

  if (iconEl) {
    iconEl.innerHTML = icon("heart", 16);
  }
  if (badgeRowEl && badgeEl) {
    badgeEl.textContent = payload.badgeLabel;
    badgeRowEl.hidden = false;
  }
  activityTextEl.textContent = payload.headline;
  if (subtextEl) {
    subtextEl.textContent = payload.subline;
    subtextEl.hidden = false;
  }
  if (undoBtn) {
    undoBtn.textContent = payload.undoActionLabel;
  }
  if (actionsEl) {
    actionsEl.hidden = !(payload.productId > 0);
  }

  activityToastEl.hidden = false;
  activityToastEl.classList.add("visible");
  clearTimeout(toastTimer);
  var dur = (window.voltboxAdvSettings && window.voltboxAdvSettings.toastDurationMs) ? Number(window.voltboxAdvSettings.toastDurationMs) : 3800;
  toastTimer = setTimeout(function () {
    dismissActivityToast();
  }, dur);
};


// ── Category Filter Bar & Search Filtering ──

var noResultsEl = null;

var CATEGORY_WORDS = {
  cpus: "cpu processor", gpus: "gpu graphics card video card",
  memory: "ram memory", storage: "storage ssd hard drive nvme disk",
  motherboards: "motherboard mainboard", power: "power supply psu ups battery",
  cooling: "cooling fan cooler heatsink", cases: "case chassis tower",
  networking: "network router switch wifi ethernet access point",
  cables: "cable lead cord", peripherals: "keyboard mouse webcam headset microphone peripheral",
  monitors: "monitor display screen", microcontrollers: "microcontroller arduino raspberry pi esp board",
  components: "component resistor capacitor breadboard led ic", sensors: "sensor module",
  tools: "tool multimeter soldering iron", connectors: "connector header terminal plug",
  adapters: "adapter hub dock dongle"
};

function filterProducts(query) {
  applyFiltersAndSearch(query);
}

function applyFiltersAndSearch(explicitQuery) {
  var query = (explicitQuery !== undefined ? explicitQuery : (searchEl ? searchEl.value : "")).trim().toLowerCase();
  var shown = 0;

  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var card = document.getElementById("card-" + p.id);
    if (!card) continue;

    var group = getComponentGroup(p);
    var hay = (p.title + " " + (p.description || "") + " " + p.category + " " + group + " " +
               getSkuFor(p) + " " + (CATEGORY_WORDS[p.category] || "") + " " +
               (p.addedByName || "")).toLowerCase();
    var textMatch = query === "" || hay.indexOf(query) !== -1;

    var catMatch = true;
    if (activeCategoryFilter === "low-stock") {
      catMatch = isLowStockItem(p);
    } else if (activeCategoryFilter === "wishlist") {
      catMatch = isProductInWishlist(p.id);
    } else if (activeCategoryFilter !== "all") {
      catMatch = (group === activeCategoryFilter);
    }

    var budgetMatch = true;
    if (typeof activeBudgetMax === "number" && isFinite(activeBudgetMax) && activeBudgetMax > 0) {
      budgetMatch = Number(p.price) <= activeBudgetMax;
    }

    var stockMatch = true;
    if (activeStockFilter === "available-now") {
      stockMatch = !isBackorderItem(p);
    } else if (activeStockFilter === "backorder") {
      stockMatch = isBackorderItem(p);
    }

    var visible = textMatch && catMatch && budgetMatch && stockMatch;
    card.style.display = visible ? "" : "none";
    if (visible) {
      card.style.setProperty("--stagger-idx", String(shown));
      card.classList.remove("stagger-in");
      void card.offsetWidth;
      card.classList.add("stagger-in");
      shown++;
    }
  }

  var visibleCountEl = document.getElementById("catalog-visible-count");
  var totalCountEl = document.getElementById("catalog-total-count");
  var resetBtnEl = document.getElementById("catalog-reset-filters-btn");
  if (visibleCountEl) visibleCountEl.textContent = String(shown);
  if (totalCountEl) totalCountEl.textContent = String(products.length);
  if (resetBtnEl) {
    var hasActive = activeCategoryFilter !== "all" || query !== "" || activeBudgetMax !== null || activeStockFilter !== "all" || activeSortMode !== "featured";
    resetBtnEl.hidden = !hasActive;
  }

  if (!noResultsEl) {
    noResultsEl = document.createElement("p");
    noResultsEl.className = "no-results";
    gridEl.appendChild(noResultsEl);
  }
  if (shown === 0) {
    if (activeCategoryFilter === "wishlist") {
      noResultsEl.textContent = "Your wishlist is empty. Click the heart icon on any hardware part to save items here.";
    } else if (activeStockFilter === "backorder") {
      noResultsEl.textContent = "No backordered components found matching the current filters.";
    } else if (activeStockFilter === "available-now") {
      noResultsEl.textContent = "No in-stock components found matching the current filters.";
    } else if (activeBudgetMax !== null) {
      noResultsEl.textContent = 'No components found under $' + activeBudgetMax + (query ? (' matching "' + query + '"') : '') + ' in this category.';
    } else {
      noResultsEl.textContent = query
        ? ('No parts match "' + query + '" in this view.')
        : "No parts in this category right now.";
    }
    noResultsEl.style.display = "";
  } else {
    noResultsEl.style.display = "none";
  }

  syncCompareAllVisibleButtonUI();
  if (typeof syncCatalogFiltersToggleUI === "function") {
    syncCatalogFiltersToggleUI();
  }
  if (typeof scheduleServerSearchQueryLog === "function") {
    scheduleServerSearchQueryLog(query, shown, "catalog-search");
  }
}

function resetAllCatalogFilters() {
  activeCategoryFilter = "all";
  activeBudgetMax = null;
  activeStockFilter = "all";
  var prevSort = activeSortMode;
  activeSortMode = "featured";

  if (searchEl) searchEl.value = "";
  if (sortSelectEl) sortSelectEl.value = "featured";
  syncBestDealPillUI();

  if (filterBarEl) {
    var tabs = filterBarEl.querySelectorAll(".filter-tab");
    for (var i = 0; i < tabs.length; i++) {
      var isAll = (tabs[i].getAttribute("data-filter") || "all") === "all";
      tabs[i].classList.toggle("active", isAll);
      tabs[i].setAttribute("aria-selected", isAll ? "true" : "false");
    }
  }

  var stockStripEl = document.getElementById("stock-quick-filter-strip");
  if (stockStripEl) {
    var stockChips = stockStripEl.querySelectorAll(".stock-filter-chip");
    for (var k = 0; k < stockChips.length; k++) {
      var isAllStock = (stockChips[k].getAttribute("data-stock-filter") || "all") === "all";
      stockChips[k].classList.toggle("active", isAllStock);
      stockChips[k].setAttribute("aria-pressed", isAllStock ? "true" : "false");
    }
  }

  var budgetStripEl = document.getElementById("budget-filter-strip");
  if (budgetStripEl) {
    var chips = budgetStripEl.querySelectorAll(".budget-chip");
    for (var j = 0; j < chips.length; j++) {
      var isAllBudget = (chips[j].getAttribute("data-budget") || "all") === "all";
      chips[j].classList.toggle("active", isAllBudget);
      chips[j].setAttribute("aria-pressed", isAllBudget ? "true" : "false");
    }
  }

  if (prevSort !== "featured") {
    renderAllCards();
  } else {
    applyFiltersAndSearch("");
  }
}

function setCatalogViewMode(mode) {
  activeCatalogView = (mode === "list") ? "list" : "grid";
  if (gridEl) {
    gridEl.classList.toggle("list-view", activeCatalogView === "list");
  }
  var gridBtn = document.getElementById("view-grid-btn");
  var listBtn = document.getElementById("view-list-btn");
  if (gridBtn) {
    var isGrid = activeCatalogView === "grid";
    gridBtn.classList.toggle("active", isGrid);
    gridBtn.setAttribute("aria-pressed", isGrid ? "true" : "false");
  }
  if (listBtn) {
    var isList = activeCatalogView === "list";
    listBtn.classList.toggle("active", isList);
    listBtn.setAttribute("aria-pressed", isList ? "true" : "false");
  }
}

// ── Hands-Free Web Speech API Voice Search ──
var voiceRecognitionInstance = null;
var isVoiceSearchListening = false;
var voiceAutoHideTimer = null;

function parseClientVoiceTranscript(rawTranscript) {
  if (window.VoltboxQR && typeof window.VoltboxQR.normalizeVoiceSearchTranscript === "function") {
    return window.VoltboxQR.normalizeVoiceSearchTranscript(rawTranscript);
  }
  var raw = String(rawTranscript || "").trim();
  var cleaned = raw.replace(/[.?!,;]+$/g, "").trim();
  var lower = cleaned.toLowerCase();
  if (lower === "clear" || lower === "clear search" || lower === "reset" || lower === "show all") {
    return { rawTranscript: raw, query: "", isClearCommand: true, budgetMaxHint: null, categoryHint: null };
  }
  cleaned = cleaned
    .replace(/^(?:please\s+)?(?:search\s+for|search|find\s+me|find|show\s+me|show|look\s+for|looking\s+for)\s+/i, "")
    .trim();
  var budgetMaxHint = null;
  var budgetMatch = cleaned.match(/\b(?:under|below|less\s+than)\s*\$?\s*(\d{2,4})(?:\s*(?:dollars|bucks|usd))?\b/i);
  if (budgetMatch) {
    budgetMaxHint = Number(budgetMatch[1]);
    cleaned = cleaned.replace(budgetMatch[0], "").trim();
  }
  cleaned = cleaned
    .replace(/\br\s+t\s+x\b/gi, "RTX")
    .replace(/\bs\s+s\s+d\b/gi, "SSD")
    .replace(/\bn\s+v\s+m\s+e\b/gi, "NVMe")
    .replace(/\bc\s+p\s+u\s*s?\b/gi, "CPU")
    .replace(/\bg\s+p\s+u\s*s?\b/gi, "GPU")
    .replace(/\bp\s+s\s*5\b/gi, "PS5")
    .replace(/\s+/g, " ")
    .replace(/[.?!,;]+$/g, "")
    .trim();
  return {
    rawTranscript: raw,
    query: cleaned,
    isClearCommand: false,
    budgetMaxHint: budgetMaxHint,
    categoryHint: null
  };
}

function updateVoiceSearchUiState(listening, stateLabel, transcriptText, isError) {
  isVoiceSearchListening = Boolean(listening);
  var btn = document.getElementById("search-voice-btn");
  var wrap = document.getElementById("topbar-search-wrap");
  var popover = document.getElementById("voice-search-popover");
  var stateEl = document.getElementById("voice-popover-state");
  var transcriptEl = document.getElementById("voice-popover-transcript");
  var dotEl = document.getElementById("voice-live-dot");

  if (btn) {
    btn.classList.toggle("listening", isVoiceSearchListening);
    btn.setAttribute("aria-pressed", isVoiceSearchListening ? "true" : "false");
  }
  if (wrap) {
    wrap.classList.toggle("voice-listening", isVoiceSearchListening);
  }
  if (searchEl) {
    searchEl.placeholder = isVoiceSearchListening
      ? "Listening… Speak a component, SKU, or budget…"
      : "Search parts, GPUs, CPUs…";
  }
  if (stateEl && stateLabel) {
    stateEl.textContent = stateLabel;
  }
  if (transcriptEl && transcriptText) {
    transcriptEl.textContent = transcriptText;
  }
  if (dotEl) {
    dotEl.classList.toggle("listening", isVoiceSearchListening);
    dotEl.classList.toggle("error", Boolean(isError));
  }
  if (popover && (isVoiceSearchListening || stateLabel)) {
    popover.hidden = false;
  }
}

function closeVoiceSearchPopover() {
  if (isVoiceSearchListening && voiceRecognitionInstance) {
    try { voiceRecognitionInstance.stop(); } catch (e) {}
  }
  updateVoiceSearchUiState(false, "", "", false);
  var popover = document.getElementById("voice-search-popover");
  if (popover) popover.hidden = true;
}

function applyVoiceSearchTranscript(rawText, isFinal) {
  var parsed = parseClientVoiceTranscript(rawText);
  if (parsed.isClearCommand) {
    resetAllCatalogFilters();
    updateVoiceSearchUiState(
      false,
      "Voice Command Applied",
      'Cleared search & filters ("' + parsed.rawTranscript + '")',
      false
    );
    showActivityToast("Voice search: Cleared all catalog filters.");
    return parsed;
  }

  // Apply optional spoken budget ceiling hint if it matches a budget chip or arbitrary threshold
  if (parsed.budgetMaxHint !== null && isFinal !== false) {
    activeBudgetMax = parsed.budgetMaxHint;
    var budgetStripEl = document.getElementById("budget-filter-strip");
    if (budgetStripEl) {
      var chips = budgetStripEl.querySelectorAll(".budget-chip");
      for (var i = 0; i < chips.length; i++) {
        var chipVal = chips[i].getAttribute("data-budget");
        var isMatch = chipVal !== "all" && Number(chipVal) === parsed.budgetMaxHint;
        chips[i].classList.toggle("active", isMatch);
        chips[i].setAttribute("aria-pressed", isMatch ? "true" : "false");
      }
    }
  }

  if (searchEl) {
    searchEl.value = parsed.query;
  }
  applyFiltersAndSearch(parsed.query);

  var visibleCountEl = document.getElementById("catalog-visible-count");
  var matchCount = visibleCountEl ? Number(visibleCountEl.textContent || 0) : 0;

  if (isFinal !== false) {
    var summary = 'Heard: "' + parsed.rawTranscript + '" → Searching "' + (parsed.query || "All") + '"' +
      (parsed.budgetMaxHint ? (" (Under $" + parsed.budgetMaxHint + ")") : "") +
      " · " + matchCount + (matchCount === 1 ? " match" : " matches");
    updateVoiceSearchUiState(false, "Voice Search Complete", summary, false);
    showActivityToast('Voice search: "' + (parsed.query || parsed.rawTranscript) + '" (' + matchCount + ' found)');
    if (typeof dispatchServerSearchQueryLog === "function" && parsed.query && parsed.query.length >= 2) {
      dispatchServerSearchQueryLog(parsed.query, matchCount, "voice-search");
    }
  } else {
    updateVoiceSearchUiState(true, "Listening — Recognizing…", 'Hearing: "' + parsed.rawTranscript + '"', false);
  }
  return parsed;
}

window.applyVoiceSearchTranscript = applyVoiceSearchTranscript;

function toggleVoiceSearch() {
  clearTimeout(voiceAutoHideTimer);
  var popover = document.getElementById("voice-search-popover");

  if (isVoiceSearchListening) {
    if (voiceRecognitionInstance) {
      try { voiceRecognitionInstance.stop(); } catch (e) {}
    }
    updateVoiceSearchUiState(false, "Voice Search Paused", "Click the microphone or choose a voice phrase below.", false);
    return;
  }

  var SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionCtor) {
    updateVoiceSearchUiState(
      false,
      "Hands-Free Voice Search Ready",
      "Select a spoken hardware query below or use a Web Speech API enabled microphone:",
      false
    );
    if (popover) popover.hidden = false;
    return;
  }

  try {
    var recognition = new SpeechRecognitionCtor();
    voiceRecognitionInstance = recognition;
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = function () {
      updateVoiceSearchUiState(
        true,
        "Listening — Speak now…",
        'Say a component name, SKU, or budget (e.g. "Nvidia RTX 5090" or "SSD under 150 dollars")',
        false
      );
    };

    recognition.onresult = function (event) {
      var interimTranscript = "";
      var finalTranscript = "";
      for (var i = event.resultIndex; i < event.results.length; i++) {
        var piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += piece;
        } else {
          interimTranscript += piece;
        }
      }
      if (finalTranscript) {
        applyVoiceSearchTranscript(finalTranscript, true);
      } else if (interimTranscript) {
        applyVoiceSearchTranscript(interimTranscript, false);
      }
    };

    recognition.onerror = function (event) {
      var errCode = (event && event.error) ? event.error : "unknown";
      var friendlyMsg = "Click any voice phrase below to test hands-free search immediately:";
      if (errCode === "not-allowed" || errCode === "service-not-allowed") {
        friendlyMsg = "Microphone permission blocked in this frame — tap a voice phrase below to search hands-free:";
      } else if (errCode === "no-speech") {
        friendlyMsg = "No speech detected — tap the mic again or choose a voice command below:";
      }
      updateVoiceSearchUiState(false, "Voice Assistant Ready", friendlyMsg, false);
    };

    recognition.onend = function () {
      if (isVoiceSearchListening) {
        updateVoiceSearchUiState(
          false,
          "Voice Search Ready",
          "Tap the microphone to speak again or pick a quick voice command below.",
          false
        );
      }
    };

    updateVoiceSearchUiState(
      true,
      "Listening — Speak now…",
      'Say a component name, SKU, or budget (e.g. "Nvidia RTX 5090" or "SSD under 150 dollars")',
      false
    );
    recognition.start();
  } catch (err) {
    updateVoiceSearchUiState(
      false,
      "Voice Assistant Ready",
      "Tap a voice command below to filter the catalog hands-free:",
      false
    );
  }
}


// ── PC Build / Compatibility Bundle Mode ("Rig Builder") ──

var RIG_SLOTS = [
  { key: "cpus", label: "Processor (CPU)", hint: "AM5 / Multi-Core Desktop CPU" },
  { key: "gpus", label: "Graphics Card (GPU)", hint: "PCIe 5.0 Dedicated GPU" },
  { key: "motherboards", label: "Motherboard", hint: "ATX / B570 System Board" },
  { key: "storage", label: "Primary Storage", hint: "NVMe SSD or SATA Drive" }
];

function computeRigStatus() {
  var found = { cpus: null, gpus: null, motherboards: null, storage: null };
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var q = cart[p.id] || 0;
    if (q <= 0) continue;
    var g = getComponentGroup(p);
    if (g in found && !found[g]) {
      found[g] = p;
    }
  }
  var count = (found.cpus ? 1 : 0) + (found.gpus ? 1 : 0) + (found.motherboards ? 1 : 0) + (found.storage ? 1 : 0);
  var qualifies = count >= 3;
  return {
    slots: found,
    completedCount: count,
    qualifies: qualifies,
    discountRate: qualifies ? RIG_BUNDLE_RATE : 0
  };
}

function openRigDrawer() {
  renderRigDrawer();
  rigDrawerOverlayEl.classList.add("open");
  rigDrawerOverlayEl.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  if (window.momentumDrawers && window.momentumDrawers.rig) {
    window.momentumDrawers.rig.scrollTo(0, false);
    setTimeout(function () {
      if (window.momentumDrawers && window.momentumDrawers.rig) {
        window.momentumDrawers.rig.refreshMetrics();
      }
    }, 60);
  }
}

function closeRigDrawer() {
  rigDrawerOverlayEl.classList.remove("open");
  rigDrawerOverlayEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

window.loadRigPreset = function (presetKey) {
  var presets = {
    blackwell4k: [36, 19, 37, 39],
    am5workstation: [20, 35, 21, 22],
    esports240: [20, 19, 21, 39]
  };
  var ids = presets[presetKey] || presets.blackwell4k;
  for (var i = 0; i < ids.length; i++) {
    var pid = ids[i];
    if (findProductById(pid) && !cart[pid]) {
      cart[pid] = 1;
    }
    refreshCard(pid);
  }
  recalc(true);
  queueCartSave();
  showActivityToast("Loaded Rig Builder preset into cart (5% bundle unlocked)!");
};

function renderRigDrawer() {
  var status = computeRigStatus();
  var pct = Math.round((status.completedCount / 4) * 100);

  if (rigBuilderCountEl) {
    rigBuilderCountEl.textContent = status.completedCount + "/4";
  }
  if (mnavRigCountEl) {
    mnavRigCountEl.textContent = status.completedCount + "/4";
  }
  if (rigBuilderBtnEl) {
    rigBuilderBtnEl.classList.toggle("bundle-active", status.qualifies);
  }
  if (!rigSlotsListEl) return;

  rigBannerFractionEl.textContent = status.completedCount + " / 4 Core Slots";
  rigMeterFillEl.style.width = pct + "%";
  rigBundleBannerEl.classList.toggle("unlocked", status.qualifies);

  if (status.qualifies) {
    rigBannerTitleEl.textContent = "5% Rig Builder Bundle Unlocked!";
    rigBannerSubEl.textContent = "Your cart includes " + status.completedCount + " core PC component groups — 5% bundle discount is active at checkout.";
  } else {
    var needed = 3 - status.completedCount;
    rigBannerTitleEl.textContent = "Add " + needed + " more core part" + (needed === 1 ? "" : "s") + " for 5% off";
    rigBannerSubEl.textContent = "Select at least 3 of the 4 core PC component groups below to activate the automatic 5% Rig Bundle discount.";
  }

  var html = "";
  for (var i = 0; i < RIG_SLOTS.length; i++) {
    var slot = RIG_SLOTS[i];
    var chosen = status.slots[slot.key];
    var candidate = null;
    if (!chosen) {
      for (var j = 0; j < products.length; j++) {
        if (getComponentGroup(products[j]) === slot.key) {
          candidate = products[j];
          break;
        }
      }
    }

    html +=
      '<div class="rig-slot-card' + (chosen ? ' filled' : '') + '">' +
        '<div class="rig-slot-top">' +
          '<span class="rig-slot-name">' + esc(slot.label) + '</span>' +
          '<span class="rig-slot-state">' + (chosen ? "Selected" : "Empty Slot") + '</span>' +
        '</div>' +
        (chosen
          ? '<div class="rig-slot-picked">' +
              '<span>' + esc(chosen.title) + ' ($' + chosen.price.toFixed(2) + ')</span>' +
              '<button type="button" class="rig-slot-action remove" onclick="dec(' + chosen.id + ')">Remove</button>' +
            '</div>'
          : '<div class="rig-slot-empty">' +
              '<span>' + esc(slot.hint) + '</span>' +
              (candidate
                ? '<button type="button" class="rig-slot-action add" onclick="inc(' + candidate.id + ')">+ Add ' + esc(candidate.title) + ' ($' + candidate.price.toFixed(0) + ')</button>'
                : '') +
            '</div>') +
      '</div>';
  }

  // System Power, Thermal & Bus Telemetry Block
  var estWatts = 65 +
    (status.slots.cpus ? 170 : 0) +
    (status.slots.gpus ? 420 : 0) +
    (status.slots.motherboards ? 55 : 0) +
    (status.slots.storage ? 12 : 0);
  var recPsu = estWatts > 550 ? "850W 80+ Gold ATX 3.1" : (estWatts > 300 ? "750W 80+ Gold" : "650W Modular ATX");
  var pcieStatus = (status.slots.gpus || status.slots.storage) ? "PCIe 5.0 x16 + M.2 Gen5 Ready" : "Awaiting PCIe Devices";

  html +=
    '<div class="rig-section-block" data-testid="rig-telemetry-section">' +
      '<div class="rig-section-head">' +
        '<span class="rig-section-title">System Power &amp; Bus Telemetry</span>' +
        '<span class="rig-section-badge">' + (status.completedCount > 0 ? "PASS · COMPATIBLE" : "STANDBY") + '</span>' +
      '</div>' +
      '<div class="rig-telemetry-grid">' +
        '<div class="rig-telemetry-cell">' +
          '<span class="rig-telemetry-label">Est. Peak Draw</span>' +
          '<span class="rig-telemetry-val accent">' + estWatts + 'W TDP</span>' +
        '</div>' +
        '<div class="rig-telemetry-cell">' +
          '<span class="rig-telemetry-label">Recommended PSU</span>' +
          '<span class="rig-telemetry-val">' + esc(recPsu) + '</span>' +
        '</div>' +
        '<div class="rig-telemetry-cell">' +
          '<span class="rig-telemetry-label">PCIe &amp; Bus Topology</span>' +
          '<span class="rig-telemetry-val">' + esc(pcieStatus) + '</span>' +
        '</div>' +
        '<div class="rig-telemetry-cell">' +
          '<span class="rig-telemetry-label">Bundle Tier</span>' +
          '<span class="rig-telemetry-val accent">' + (status.qualifies ? "5% OFF ACTIVE" : (status.completedCount + "/3 Min Required")) + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';

  // Quick-Load Benchmarked Rig Presets Block
  html +=
    '<div class="rig-section-block" data-testid="rig-presets-section">' +
      '<div class="rig-section-head">' +
        '<span class="rig-section-title">Benchmarked Rig Presets</span>' +
        '<span class="rig-section-badge">1-Tap Load</span>' +
      '</div>' +
      '<div class="rig-presets-list">' +
        '<div class="rig-preset-card">' +
          '<div class="rig-preset-info">' +
            '<div class="rig-preset-name">Blackwell 4K Flagship Rig</div>' +
            '<div class="rig-preset-meta">Core Ultra 9 · RTX 5090 · ROG X870E · 4TB Gen5</div>' +
          '</div>' +
          '<button type="button" class="rig-preset-btn" onclick="loadRigPreset(\'blackwell4k\')">Load Rig</button>' +
        '</div>' +
        '<div class="rig-preset-card">' +
          '<div class="rig-preset-info">' +
            '<div class="rig-preset-name">AM5 Creator &amp; AI Workstation</div>' +
            '<div class="rig-preset-meta">Ryzen 9 · RX 8900 XTX · MSI B570 · 990 Pro</div>' +
          '</div>' +
          '<button type="button" class="rig-preset-btn" onclick="loadRigPreset(\'am5workstation\')">Load Rig</button>' +
        '</div>' +
        '<div class="rig-preset-card">' +
          '<div class="rig-preset-info">' +
            '<div class="rig-preset-name">High-Refresh 240Hz Esports Rig</div>' +
            '<div class="rig-preset-meta">Ryzen 9 · RTX 5090 · MSI B570 · MP700 4TB</div>' +
          '</div>' +
          '<button type="button" class="rig-preset-btn" onclick="loadRigPreset(\'esports240\')">Load Rig</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  rigSlotsListEl.innerHTML = html;

  if (window.momentumDrawers && window.momentumDrawers.rig) {
    window.momentumDrawers.rig.refreshMetrics();
  }
}


// ── Promo Code Handling ──

function applyPromoCode() {
  var raw = (promoInputEl ? promoInputEl.value : "").trim().toUpperCase();
  if (!raw) {
    activePromoCode = null;
    showPromoNote("Promo cleared.", false);
    recalc();
    fetchCart(null);
    return;
  }
  if (raw in PROMO_MAP) {
    activePromoCode = raw;
    showPromoNote("Applied " + PROMO_MAP[raw].label, false);
    recalc();
    api("/api/cart/promo", {
      method: "POST",
      body: JSON.stringify({ promoCode: raw })
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (data && data.cart) {
          window.serverCartState = data.cart;
          recalc(false);
        }
      })
      .catch(function () {});
  } else {
    showPromoNote("Unknown code — try VOLT10 or BUILDER5", true);
  }
}

function showPromoNote(text, isError) {
  if (!promoStatusNoteEl) return;
  promoStatusNoteEl.textContent = text;
  promoStatusNoteEl.className = isError ? "promo-status-note error" : "promo-status-note";
  promoStatusNoteEl.hidden = false;
}


// ── cart operations ──

function inc(id) {
  var prev = cart[id] || 0;
  cart[id] = prev + 1;
  refreshCard(id);
  recalc(prev === 0);
  triggerPerimeterSignalPulse();
  queueCartSave();
  if (activeSpecProductId === id) {
    var p = findProductById(id);
    if (p) populateSpecDrawer(p);
  }
}

function dec(id) {
  var now = cart[id] || 0;
  if (now <= 0) return;
  cart[id] = now - 1;
  if (cart[id] === 0) delete cart[id];
  refreshCard(id);
  recalc(false);
  queueCartSave();
  if (activeSpecProductId === id) {
    var p = findProductById(id);
    if (p) populateSpecDrawer(p);
  }
}

function queueCartSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveCart, 400);
}

function saveCart() {
  var url = "/api/cart" + (activePromoCode ? ("?promoCode=" + encodeURIComponent(activePromoCode)) : "");
  return api(url, { method: "PUT", body: JSON.stringify(cart) })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (data && data.cart) {
        window.serverCartState = data.cart;
      }
      fetchInventorySummary();
      return data;
    })
    .catch(function (err) {
      console.error("couldn't save the cart:", err);
      return null;
    });
}

function flushCartSave() {
  if (!saveTimer) return;
  clearTimeout(saveTimer);
  saveTimer = null;
  saveCart();
}


// ── update just one card's counter ──

function refreshCard(id) {
  var q = cart[id] || 0;
  var numEl = document.getElementById("qty-" + id);
  var btn   = document.getElementById("dec-" + id);

  if (numEl) {
    numEl.textContent = q;
    numEl.className = q > 0 ? "qty-value active" : "qty-value";
    numEl.classList.remove("pop");
    void numEl.offsetWidth;
    numEl.classList.add("pop");
  }
  if (btn) {
    btn.disabled = (q <= 0);
  }

  var p = findProductById(id);
  if (p) {
    var card = document.getElementById("card-" + id);
    var stockQty = getEffectiveStock(p);
    var isBackorder = isBackorderItem(p);
    var lowStock = isLowStockItem(p);
    var isCriticalStock = stockQty <= 2;
    var stockNoteEl = document.getElementById("stock-note-" + id);
    if (stockNoteEl) {
      if (isBackorder) {
        stockNoteEl.className = "card-stock backorder";
        stockNoteEl.innerHTML = "Backorder &middot; Ships in 3&ndash;5d";
      } else {
        stockNoteEl.className = lowStock ? "card-stock low" : "card-stock";
        stockNoteEl.textContent = lowStock ? (stockQty + " left in stock") : (stockQty + " in stock");
      }
    }
    if (card) {
      card.classList.toggle("is-low-stock", lowStock);
      card.classList.toggle("is-backorder", isBackorder);
      card.setAttribute("data-stock", String(stockQty));
      card.setAttribute("data-stock-status", isBackorder ? "backorder" : "available-now");
      var wrap = card.querySelector(".card-img-wrap");
      var badge = document.getElementById("low-stock-" + id);
      if ((lowStock || isBackorder) && !badge && wrap) {
        var span = document.createElement("span");
        span.className = "low-stock-badge" + (isBackorder ? " backorder" : (isCriticalStock ? " critical" : ""));
        span.id = "low-stock-" + id;
        span.setAttribute("data-testid", isBackorder ? "backorder-badge" : "low-stock-badge");
        span.textContent = isBackorder ? "Backorder" : "Low Stock";
        wrap.insertBefore(span, wrap.querySelector(".card-flag"));
      } else if ((lowStock || isBackorder) && badge) {
        badge.className = "low-stock-badge" + (isBackorder ? " backorder" : (isCriticalStock ? " critical" : ""));
        badge.setAttribute("data-testid", isBackorder ? "backorder-badge" : "low-stock-badge");
        badge.textContent = isBackorder ? "Backorder" : "Low Stock";
      } else if (!lowStock && !isBackorder && badge) {
        badge.remove();
      }
      var priceTextEl = document.getElementById("card-price-text-" + id);
      if (priceTextEl) {
        var existingPreviewEl = document.getElementById("card-batch-price-preview-" + id);
        var previewHtml = existingPreviewEl ? existingPreviewEl.outerHTML : ('<span class="card-batch-price-preview" id="card-batch-price-preview-' + id + '" hidden></span>');
        priceTextEl.innerHTML =
          '$' + Number(p.price || 0).toFixed(2) +
          '<span class="card-price-inr-sub">≈ ₹' + Math.round(Number(p.price || 0) * 83.5).toLocaleString("en-IN") + '</span>' +
          previewHtml;
      }
    }
  }
}


function updateFilterTabCounts() {
  var availableNowTotal = 0;
  var backorderTotal = 0;
  for (var s = 0; s < products.length; s++) {
    if (isBackorderItem(products[s])) {
      backorderTotal++;
    } else {
      availableNowTotal++;
    }
  }
  var stockAllCountEl = document.getElementById("stock-count-all");
  var stockAvailCountEl = document.getElementById("stock-count-available");
  var stockBackorderCountEl = document.getElementById("stock-count-backorder");
  if (stockAllCountEl) stockAllCountEl.textContent = String(products.length);
  if (stockAvailCountEl) stockAvailCountEl.textContent = String(availableNowTotal);
  if (stockBackorderCountEl) stockBackorderCountEl.textContent = String(backorderTotal);

  if (!filterBarEl) return;
  var counts = {
    all: products.length,
    gpus: 0,
    cpus: 0,
    motherboards: 0,
    storage: 0,
    audio: 0,
    gaming: 0,
    "low-stock": 0
  };
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var g = getComponentGroup(p);
    if (counts[g] !== undefined) counts[g]++;
    if (isLowStockItem(p)) counts["low-stock"]++;
  }
  var labels = {
    all: "All",
    gpus: "GPUs",
    cpus: "CPUs",
    motherboards: "Motherboards",
    storage: "Storage",
    audio: "Audio",
    gaming: "Gaming",
    "low-stock": "Low Stock"
  };
  var tabs = filterBarEl.querySelectorAll(".filter-tab");
  for (var t = 0; t < tabs.length; t++) {
    var key = tabs[t].getAttribute("data-filter") || "all";
    if (key === "wishlist") {
      tabs[t].innerHTML = icon("heart", 12) + '<span class="filter-tab-label">Wishlist</span><span class="filter-count" id="wishlist-filter-count">' + wishlist.length + '</span>';
      continue;
    }
    var baseLabel = labels[key] || key;
    var c = counts[key] !== undefined ? counts[key] : 0;
    tabs[t].innerHTML = '<span class="filter-tab-label">' + esc(baseLabel) + '</span><span class="filter-count">' + c + '</span>';
  }
}

function syncCatalogFiltersToggleUI() {
  var toggleBtn = document.getElementById("catalog-filters-toggle-btn");
  var badgeEl = document.getElementById("catalog-filters-active-badge");
  var drawerEl = document.getElementById("catalog-expandable-drawer");
  if (!toggleBtn) return;

  var isExpanded = Boolean(drawerEl && !drawerEl.hidden);
  var summary = (window.VoltboxQR && typeof window.VoltboxQR.computeCatalogFilterDrawerSummary === "function")
    ? window.VoltboxQR.computeCatalogFilterDrawerSummary({
        stockFilter: activeStockFilter,
        budgetMax: activeBudgetMax,
        sortMode: activeSortMode,
        activePromoCode: activePromoCode,
        batchEditActive: typeof isCatalogBatchEditActive !== "undefined" ? Boolean(isCatalogBatchEditActive) : false,
        isExpanded: isExpanded
      })
    : {
        activeCount: (activeStockFilter !== "all" ? 1 : 0) + (activeBudgetMax !== null ? 1 : 0) + (activeSortMode === "best-deal" ? 1 : 0) + (activePromoCode ? 1 : 0),
        hasActiveFilters: activeStockFilter !== "all" || activeBudgetMax !== null || activeSortMode === "best-deal" || Boolean(activePromoCode),
        ariaExpanded: isExpanded ? "true" : "false"
      };

  toggleBtn.setAttribute("aria-expanded", summary.ariaExpanded);
  toggleBtn.classList.toggle("is-open", isExpanded);
  toggleBtn.classList.toggle("has-active-filters", summary.hasActiveFilters);
  if (badgeEl) {
    badgeEl.textContent = String(summary.activeCount);
    badgeEl.hidden = !summary.hasActiveFilters;
  }
}

function toggleCatalogFiltersDrawer(forceState) {
  var drawerEl = document.getElementById("catalog-expandable-drawer");
  if (!drawerEl) return;
  var nextOpen = typeof forceState === "boolean" ? forceState : drawerEl.hidden;
  drawerEl.hidden = !nextOpen;
  syncCatalogFiltersToggleUI();
}
window.toggleCatalogFiltersDrawer = toggleCatalogFiltersDrawer;

// ── Odometer Digit Roll & Totals Calculation ──

function computeOdometerPlan(prevText, nextText) {
  var cleanPrev = String(prevText || "0.00").trim();
  var cleanNext = String(nextText || "0.00").trim();
  var prevNum = parseFloat(cleanPrev.replace(/[^0-9.-]/g, "")) || 0;
  var nextNum = parseFloat(cleanNext.replace(/[^0-9.-]/g, "")) || 0;
  var direction = nextNum > prevNum ? "up" : (nextNum < prevNum ? "down" : "none");

  var columns = [];
  var nextLen = cleanNext.length;
  var prevLen = cleanPrev.length;
  var rollingIndex = 0;

  for (var i = 0; i < nextLen; i++) {
    var posFromRight = nextLen - 1 - i;
    var ch = cleanNext.charAt(i);
    var prevIdx = prevLen - 1 - posFromRight;
    var prevCh = (prevIdx >= 0 && prevIdx < prevLen) ? cleanPrev.charAt(prevIdx) : "0";

    if (ch >= "0" && ch <= "9") {
      var digit = ch.charCodeAt(0) - 48;
      var prevDigit = (prevCh >= "0" && prevCh <= "9") ? (prevCh.charCodeAt(0) - 48) : 0;
      var changed = (digit !== prevDigit) || (prevIdx < 0);
      var delayMs = changed ? (rollingIndex * 22) : 0;
      if (changed) rollingIndex++;
      columns.push({
        posFromRight: posFromRight,
        type: "digit",
        char: ch,
        digit: digit,
        prevDigit: prevDigit,
        changed: changed,
        translateYPercent: -(digit * 10),
        delayMs: delayMs
      });
    } else {
      columns.push({
        posFromRight: posFromRight,
        type: "sep",
        char: ch,
        digit: -1,
        prevDigit: -1,
        changed: false,
        translateYPercent: 0,
        delayMs: 0
      });
    }
  }

  return {
    prevText: cleanPrev,
    nextText: cleanNext,
    direction: direction,
    columns: columns
  };
}

function createOdometerDigitCol(posFromRight, initialDigit) {
  var col = document.createElement("span");
  col.className = "odo-col";
  col.setAttribute("data-pos", String(posFromRight));
  col.setAttribute("data-digit", String(initialDigit));

  var track = document.createElement("span");
  track.className = "odo-track";
  track.style.setProperty("--digit", String(initialDigit));
  track.style.setProperty("--col-delay", "0ms");
  track.style.transform = "translate3d(0, " + (-(initialDigit * 10)) + "%, 0)";

  var cellsHtml = "";
  for (var d = 0; d <= 9; d++) {
    cellsHtml +=
      '<span class="odo-cell' + (d === initialDigit ? ' active' : '') + '" data-n="' + d + '" aria-hidden="true">' +
        d +
      '</span>';
  }
  track.innerHTML = cellsHtml;
  col.appendChild(track);
  return col;
}

function createOdometerSepCol(posFromRight, ch) {
  var sep = document.createElement("span");
  sep.className = "odo-sep";
  sep.setAttribute("data-pos", String(posFromRight));
  sep.textContent = ch;
  return sep;
}

function setOdometerText(el, nextText) {
  if (!el) return;
  var isReady = el.getAttribute("data-odo-ready") === "1";
  var prevText = el.getAttribute("data-val") || el.textContent || "0.00";
  if (isReady && prevText === nextText) return;

  var plan = computeOdometerPlan(prevText, nextText);
  el.setAttribute("data-val", nextText);
  el.setAttribute("aria-label", nextText);

  if (!isReady) {
    el.innerHTML = "";
    el.setAttribute("data-odo-ready", "1");
  }

  // Index existing column elements by right-aligned position so DOM nodes stay mounted
  var existingByPos = {};
  var children = Array.prototype.slice.call(el.children);
  for (var c = 0; c < children.length; c++) {
    var posAttr = children[c].getAttribute("data-pos");
    if (posAttr !== null) {
      existingByPos[posAttr] = children[c];
    } else {
      el.removeChild(children[c]);
    }
  }

  var desiredPosSet = {};
  var orderedNodes = [];
  for (var i = 0; i < plan.columns.length; i++) {
    var spec = plan.columns[i];
    var key = String(spec.posFromRight);
    desiredPosSet[key] = true;
    var existing = existingByPos[key];

    if (spec.type === "sep") {
      if (existing && existing.classList.contains("odo-sep")) {
        existing.textContent = spec.char;
        orderedNodes.push({ node: existing, spec: spec, isNew: false });
      } else {
        if (existing && existing.parentNode === el) el.removeChild(existing);
        var sepNode = createOdometerSepCol(spec.posFromRight, spec.char);
        orderedNodes.push({ node: sepNode, spec: spec, isNew: true });
      }
    } else {
      if (existing && existing.classList.contains("odo-col")) {
        orderedNodes.push({ node: existing, spec: spec, isNew: false });
      } else {
        if (existing && existing.parentNode === el) el.removeChild(existing);
        var startDigit = isReady ? 0 : spec.digit;
        var colNode = createOdometerDigitCol(spec.posFromRight, startDigit);
        orderedNodes.push({ node: colNode, spec: spec, isNew: true });
      }
    }
  }

  // Remove columns that are no longer needed (e.g. hundreds digit when total drops below 100)
  for (var posKey in existingByPos) {
    if (Object.prototype.hasOwnProperty.call(existingByPos, posKey) && !desiredPosSet[posKey]) {
      var staleNode = existingByPos[posKey];
      if (staleNode && staleNode.parentNode === el) {
        el.removeChild(staleNode);
      }
    }
  }

  // Ensure nodes are in left-to-right order without detaching already mounted columns
  for (var idx = 0; idx < orderedNodes.length; idx++) {
    var item = orderedNodes[idx];
    var currentAtIdx = el.children[idx] || null;
    if (item.node !== currentAtIdx) {
      el.insertBefore(item.node, currentAtIdx);
    }
  }

  // Force layout read so any newly inserted leading digit columns establish their 0% baseline
  void el.offsetHeight;

  // Apply CSS transform translate3d(0, -N0%, 0) to roll each digit ribbon vertically
  for (var k = 0; k < orderedNodes.length; k++) {
    var entry = orderedNodes[k];
    var colSpec = entry.spec;
    if (colSpec.type !== "digit") continue;
    var colEl = entry.node;
    var trackEl = colEl.querySelector(".odo-track");
    colEl.setAttribute("data-digit", String(colSpec.digit));
    colEl.setAttribute("data-prev-digit", String(colSpec.prevDigit));
    colEl.classList.toggle("changed", isReady && colSpec.changed);

    if (trackEl) {
      trackEl.style.setProperty("--col-delay", (isReady ? colSpec.delayMs : 0) + "ms");
      trackEl.style.setProperty("--digit", String(colSpec.digit));
      trackEl.style.transform = "translate3d(0, " + colSpec.translateYPercent + "%, 0)";

      var cells = trackEl.querySelectorAll(".odo-cell");
      for (var cellIdx = 0; cellIdx < cells.length; cellIdx++) {
        cells[cellIdx].classList.toggle("active", cellIdx === colSpec.digit);
      }
    }
  }

  if (isReady && plan.direction !== "none") {
    el.setAttribute("data-direction", plan.direction);
    el.classList.remove("roll-up", "roll-down");
    void el.offsetWidth;
    el.classList.add(plan.direction === "up" ? "roll-up" : "roll-down");
    if (el._odoTimer) clearTimeout(el._odoTimer);
    el._odoTimer = setTimeout(function () {
      el.classList.remove("roll-up", "roll-down");
      var changedCols = el.querySelectorAll(".odo-col.changed");
      for (var m = 0; m < changedCols.length; m++) {
        changedCols[m].classList.remove("changed");
      }
    }, 460);
  }
}

function recalc(isNewItemAdded) {
  var totals = computeTotals();
  updateFilterTabCounts();

  setOdometerText(subEl, totals.sub.toFixed(2));
  setOdometerText(taxEl, totals.tax.toFixed(2));
  setOdometerText(totalEl, totals.total.toFixed(2));

  if (discountRowEl && discountAmountEl && discountLabelEl) {
    if (totals.discountTotal > 0) {
      discountRowEl.hidden = false;
      var labels = [];
      if (totals.rigDiscount > 0) labels.push("5% Rig Bundle");
      if (totals.promoDiscount > 0 && activePromoCode) labels.push(activePromoCode);
      discountLabelEl.textContent = "Discount (" + labels.join(" + ") + ")";
      setOdometerText(discountAmountEl, totals.discountTotal.toFixed(2));
    } else {
      discountRowEl.hidden = true;
    }
  }

  cartBadgeEl.textContent = totals.count;
  cartBadgeEl.hidden = (totals.count === 0);
  if (mnavCartBadgeEl) {
    mnavCartBadgeEl.textContent = totals.count;
    mnavCartBadgeEl.hidden = (totals.count === 0);
  }
  if (orderExpandToggleEl) {
    var toggleLabel = document.getElementById("order-expand-label") || orderExpandToggleEl.querySelector(".order-expand-label");
    if (toggleLabel) {
      var arrow = (orderBarEl && orderBarEl.classList.contains("mobile-expanded")) ? "▼" : "▲";
      toggleLabel.textContent = totals.count > 0
        ? (totals.count + (totals.count === 1 ? " item" : " items") + " · Promo & Tax " + arrow)
        : ("Promo & Breakdown " + arrow);
    }
  }

  checkoutEl.disabled    = (totals.count === 0);
  cartSheetGoEl.disabled = (totals.count === 0);

  renderCartSheet(totals);
  renderRigDrawer();
  if (typeof updateStudioCommandStrip === "function") {
    updateStudioCommandStrip();
  }

  cartBtnEl.classList.remove("pop");
  void cartBtnEl.offsetWidth;
  cartBtnEl.classList.add("pop");

  // Fly-to-Cart & Badge Pop + Order Bar Amber Pulse when incrementing from 0 to 1
  if (isNewItemAdded) {
    cartBadgeEl.classList.remove("badge-spring");
    void cartBadgeEl.offsetWidth;
    cartBadgeEl.classList.add("badge-spring");
    if (orderBarEl) {
      orderBarEl.classList.remove("bar-pulse");
      void orderBarEl.offsetWidth;
      orderBarEl.classList.add("bar-pulse");
    }
  }
}

function computeTotals() {
  var count = 0, sub = 0;
  for (var i = 0; i < products.length; i++) {
    var q = cart[products[i].id] || 0;
    count += q;
    sub   += products[i].price * q;
  }
  var roundedSub = round(sub);
  var rigStatus = computeRigStatus();
  var rigDiscount = rigStatus.qualifies ? round(roundedSub * rigStatus.discountRate) : 0;
  var promoObj = activePromoCode && PROMO_MAP[activePromoCode] ? PROMO_MAP[activePromoCode] : null;
  var promoDiscount = promoObj ? round(roundedSub * promoObj.rate) : 0;
  var discountTotal = round(Math.min(roundedSub, rigDiscount + promoDiscount));
  var discountedSub = round(Math.max(0, roundedSub - discountTotal));
  var tax = round(discountedSub * TAX_RATE);
  return {
    count: count,
    sub: roundedSub,
    rigDiscount: rigDiscount,
    promoDiscount: promoDiscount,
    discountTotal: discountTotal,
    tax: tax,
    total: round(discountedSub + tax)
  };
}


function toggleSheet(sheetEl, buttonEl) {
  var opening = sheetEl.hidden;
  closeAllSheets();
  if (opening) {
    sheetEl.hidden = false;
    buttonEl.setAttribute("aria-expanded", "true");
  }
}

function closeAllSheets() {
  var sheets = document.querySelectorAll(".sheet");
  for (var i = 0; i < sheets.length; i++) sheets[i].hidden = true;
  var buttons = document.querySelectorAll('.topbar-right [aria-haspopup="true"]');
  for (var j = 0; j < buttons.length; j++) buttons[j].setAttribute("aria-expanded", "false");
}


// ── the cart panel's contents ──

function renderCartSheet(totals) {
  cartSheetTotEl.textContent = totals.total.toFixed(2);
  cartHeadNoteEl.textContent =
    totals.count === 0 ? "empty" : totals.count + (totals.count === 1 ? " item" : " items");

  if (totals.count === 0) {
    cartLinesEl.innerHTML = '<p class="sheet-empty">Nothing in here yet.</p>';
    return;
  }

  var html = "";
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var q = cart[p.id] || 0;
    if (q === 0) continue;

    var imgUrl = getProductImageUrl(p);
    html +=
      '<div class="cart-line">' +
        '<img class="cart-line-img" src="' + esc(imgUrl) + '" alt="' + esc(p.title) + '" ' +
             'onerror="this.onerror=null;this.src=\'' + tileFor(p.category) + '\'" />' +
        '<div class="cart-line-main">' +
          '<div class="cart-line-name">' + esc(p.title) + '</div>' +
          '<div class="cart-line-sub">$' + p.price.toFixed(2) + ' each</div>' +
        '</div>' +
        '<div class="cart-line-qty">' +
          '<button class="qty-btn tiny" onclick="dec(' + p.id + ')" aria-label="decrease">−</button>' +
          '<span>' + q + '</span>' +
          '<button class="qty-btn tiny" onclick="inc(' + p.id + ')" aria-label="increase">+</button>' +
        '</div>' +
      '</div>';
  }
  cartLinesEl.innerHTML = html;
}


// ── the profile panel: linking an email for bills ──

function saveBillEmail() {
  var address = billInputEl.value.trim();
  billSaveEl.disabled = true;

  api("/api/me/bill-email", { method: "PUT", body: JSON.stringify({ email: address }) })
    .then(function (res) {
      return res.json().then(function (data) { return { ok: res.ok, data: data }; });
    })
    .then(function (result) {
      billSaveEl.disabled = false;
      if (result.ok) {
        me.billEmail = result.data.billEmail || null;
        showBillMsg(address ? "Saved — bills will go to " + address : "Removed.", false);
      } else {
        showBillMsg(result.data.message || "Couldn't save that.", true);
      }
    })
    .catch(function () {
      billSaveEl.disabled = false;
      showBillMsg("Can't reach the server.", true);
    });
}

function showBillMsg(text, isError) {
  billMsgEl.textContent = text;
  billMsgEl.className = isError ? "sheet-msg error" : "sheet-msg";
  billMsgEl.hidden = false;
}


// ── the profile panel: bill history ──

function toggleHistory() {
  var opening = historyListEl.hidden;
  historyListEl.hidden = !opening;
  historyToggleEl.setAttribute("aria-expanded", opening ? "true" : "false");
  historyChevEl.classList.toggle("up", opening);

  if (opening) loadHistory();
}

function collapseHistory() {
  historyListEl.hidden = true;
  historyListEl.innerHTML = "";
  historyToggleEl.setAttribute("aria-expanded", "false");
  historyChevEl.classList.remove("up");
}

function loadHistory() {
  historyListEl.innerHTML = '<p class="sheet-empty">loading…</p>';

  api("/api/orders")
    .then(function (res) { return res.json(); })
    .then(function (orders) {
      paintHistoryCount(orders.length);

      if (orders.length === 0) {
        historyListEl.innerHTML =
          '<p class="sheet-empty">No bills yet — check out once and it\'ll show up here.</p>';
        return;
      }

      var html =
        '<button type="button" class="sheet-btn solid wide" style="margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:6px;" onclick="closeAllSheets();openOrderHistoryPage();">' +
          icon("clipboard-check", 13) + ' <span>Open Full Order History Page (' + orders.length + ')</span>' +
        '</button>';
      for (var i = 0; i < orders.length; i++) {
        var o = orders[i];
        var d = new Date(o.placedAt);
        var lines = Array.isArray(o.lines) ? o.lines : [];
        var thumbsHtml = "";
        for (var l = 0; l < Math.min(3, lines.length); l++) {
          var lnImg = getProductImageUrl(lines[l]);
          thumbsHtml +=
            '<img class="history-item-thumb" src="' + esc(lnImg) + '" alt="' + esc(lines[l].title || "") + '" ' +
                 'onerror="this.onerror=null;this.src=NO_IMAGE" />';
        }
        html +=
          '<div class="history-item-container" style="display:flex;align-items:center;gap:6px;width:100%;margin-bottom:6px;">' +
          '<button class="history-item" style="flex:1;" onclick="openOrderFromHistory(\'' + o.id + '\')">' +
            (thumbsHtml ? '<span class="history-item-thumbs">' + thumbsHtml + '</span>' : '') +
            '<span class="history-item-main">' +
              '<span class="history-item-id">' + esc(o.id) + '</span>' +
              '<span class="history-item-when">' + formatDate(d) + ' · ' +
              o.count + (o.count === 1 ? " item" : " items") + ' · ' + esc(o.status || o.paymentMethod || 'Paid') + '</span>' +
            '</span>' +
            '<span class="history-item-total">$' + o.total.toFixed(2) + '</span>' +
          '</button>' +
          '<button type="button" class="history-track-badge" title="Track Order ' + esc(o.id) + '" onclick="event.stopPropagation();closeAllSheets();openOrderTrackingDashboard(\'' + o.id + '\');">' +
            icon("truck", 12) + ' <span>Track</span>' +
          '</button>' +
          '</div>';
      }
      historyListEl.innerHTML = html;
    })
    .catch(function () {
      historyListEl.innerHTML = '<p class="sheet-empty">Couldn\'t load your bills.</p>';
    });
}

function openOrderFromHistory(orderId) {
  api("/api/orders")
    .then(function (res) { return res.json(); })
    .then(function (orders) {
      for (var i = 0; i < orders.length; i++) {
        if (orders[i].id === orderId) {
          closeAllSheets();
          showReceipt(orders[i]);
          return;
        }
      }
    });
}


function wireUpButtons() {
  logoutEl.addEventListener("click", signOut);

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flushCartSave();
  });
  window.addEventListener("pagehide", flushCartSave);

  searchEl.addEventListener("input", function () { filterProducts(searchEl.value); });

  // Category filter tabs
  if (filterBarEl) {
    filterBarEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-tab");
      if (!btn) return;
      var filterVal = btn.getAttribute("data-filter") || "all";
      activeCategoryFilter = filterVal;
      var tabs = filterBarEl.querySelectorAll(".filter-tab");
      for (var i = 0; i < tabs.length; i++) {
        var isCurrent = tabs[i] === btn;
        tabs[i].classList.toggle("active", isCurrent);
        tabs[i].setAttribute("aria-selected", isCurrent ? "true" : "false");
      }
      applyFiltersAndSearch();
    });
  }

  // Sort select
  if (sortSelectEl) {
    sortSelectEl.addEventListener("change", function () {
      activeSortMode = sortSelectEl.value || "featured";
      syncBestDealPillUI();
      renderAllCards();
    });
  }

  // Best Deal quick-filter pill
  var bestDealPillEl = document.getElementById("catalog-best-deal-pill");
  if (bestDealPillEl) {
    bestDealPillEl.addEventListener("click", function () {
      if (activeSortMode === "best-deal") {
        activeSortMode = "featured";
      } else {
        activeSortMode = "best-deal";
      }
      if (sortSelectEl) sortSelectEl.value = activeSortMode;
      syncBestDealPillUI();
      renderAllCards();
    });
  }

  // Quick Stock Filter strip (All Stock / Available Now / Backorder)
  var stockQuickStripEl = document.getElementById("stock-quick-filter-strip");
  if (stockQuickStripEl) {
    stockQuickStripEl.addEventListener("click", function (e) {
      var chip = e.target.closest(".stock-filter-chip");
      if (!chip) return;
      var val = chip.getAttribute("data-stock-filter") || "all";
      activeStockFilter = (val === "available-now" || val === "backorder") ? val : "all";
      var chips = stockQuickStripEl.querySelectorAll(".stock-filter-chip");
      for (var i = 0; i < chips.length; i++) {
        var isCur = chips[i] === chip;
        chips[i].classList.toggle("active", isCur);
        chips[i].setAttribute("aria-pressed", isCur ? "true" : "false");
      }
      applyFiltersAndSearch();
    });
  }

  // Budget ceiling filter strip & reset button
  var budgetStripEl = document.getElementById("budget-filter-strip");
  if (budgetStripEl) {
    budgetStripEl.addEventListener("click", function (e) {
      var chip = e.target.closest(".budget-chip");
      if (!chip) return;
      var val = chip.getAttribute("data-budget") || "all";
      activeBudgetMax = (val === "all") ? null : Number(val);
      var chips = budgetStripEl.querySelectorAll(".budget-chip");
      for (var i = 0; i < chips.length; i++) {
        var isCur = chips[i] === chip;
        chips[i].classList.toggle("active", isCur);
        chips[i].setAttribute("aria-pressed", isCur ? "true" : "false");
      }
      applyFiltersAndSearch();
    });
  }
  var catalogResetBtnEl = document.getElementById("catalog-reset-filters-btn");
  if (catalogResetBtnEl) {
    catalogResetBtnEl.addEventListener("click", resetAllCatalogFilters);
  }
  var catalogFiltersToggleBtnEl = document.getElementById("catalog-filters-toggle-btn");
  if (catalogFiltersToggleBtnEl) {
    catalogFiltersToggleBtnEl.addEventListener("click", function () {
      toggleCatalogFiltersDrawer();
    });
  }

  // Grid / Compact Spec List view toggle
  var viewGridBtnEl = document.getElementById("view-grid-btn");
  var viewListBtnEl = document.getElementById("view-list-btn");
  if (viewGridBtnEl) {
    viewGridBtnEl.addEventListener("click", function () { setCatalogViewMode("grid"); });
  }
  if (viewListBtnEl) {
    viewListBtnEl.addEventListener("click", function () { setCatalogViewMode("list"); });
  }

  // Compare All Visible button in catalog toolbar
  var compareAllVisibleBtnEl = document.getElementById("compare-all-visible-btn");
  if (compareAllVisibleBtnEl) {
    compareAllVisibleBtnEl.addEventListener("click", compareAllVisibleProducts);
  }

  // Rig Builder drawer
  if (rigBuilderBtnEl) {
    rigBuilderBtnEl.addEventListener("click", openRigDrawer);
  }
  if (rigDrawerCloseEl) {
    rigDrawerCloseEl.addEventListener("click", closeRigDrawer);
  }
  if (rigDrawerOverlayEl) {
    rigDrawerOverlayEl.addEventListener("click", function (e) {
      if (e.target === rigDrawerOverlayEl) closeRigDrawer();
    });
  }

  // Product Spec drawer
  if (specDrawerCloseEl) {
    specDrawerCloseEl.addEventListener("click", closeSpecDrawer);
  }
  if (specDrawerOverlayEl) {
    specDrawerOverlayEl.addEventListener("click", function (e) {
      if (e.target === specDrawerOverlayEl) closeSpecDrawer();
    });
  }
  var specHeadShareBtn = document.getElementById("spec-head-share-btn");
  if (specHeadShareBtn) {
    specHeadShareBtn.addEventListener("click", function () { toggleProductShareCard(); });
  }
  var specShareCloseBtn = document.getElementById("spec-share-close-btn");
  if (specShareCloseBtn) {
    specShareCloseBtn.addEventListener("click", function () { toggleProductShareCard(false); });
  }
  var specShareCopyBtn = document.getElementById("spec-share-copy-btn");
  if (specShareCopyBtn) {
    specShareCopyBtn.addEventListener("click", copyProductShareUrl);
  }
  var specShareNativeBtn = document.getElementById("spec-share-native-btn");
  if (specShareNativeBtn) {
    specShareNativeBtn.addEventListener("click", shareProductNative);
  }
  var specShareDownloadBtn = document.getElementById("spec-share-download-btn");
  if (specShareDownloadBtn) {
    specShareDownloadBtn.addEventListener("click", downloadProductQrCode);
  }
  var specShareToneGroup = document.getElementById("spec-share-tone-group");
  if (specShareToneGroup) {
    specShareToneGroup.addEventListener("click", function (e) {
      var chip = e.target.closest(".spec-tone-chip");
      if (!chip) return;
      var tone = chip.getAttribute("data-share-tone") || "spec";
      setShareDescriptionTone(tone);
    });
  }
  var specShareDescInput = document.getElementById("spec-share-generated-desc");
  if (specShareDescInput) {
    specShareDescInput.addEventListener("input", function () {
      syncSpecSocialShareLinks();
    });
  }
  var specShareCopyDescBtn = document.getElementById("spec-share-copy-desc-btn");
  if (specShareCopyDescBtn) {
    specShareCopyDescBtn.addEventListener("click", copyGeneratedSharePost);
  }
  var specShareTwitterBtn = document.getElementById("spec-share-twitter-btn");
  if (specShareTwitterBtn) {
    specShareTwitterBtn.addEventListener("click", function (e) {
      handleSocialPlatformShareClick(e, "Twitter");
    });
  }
  var specShareWhatsappBtn = document.getElementById("spec-share-whatsapp-btn");
  if (specShareWhatsappBtn) {
    specShareWhatsappBtn.addEventListener("click", function (e) {
      handleSocialPlatformShareClick(e, "WhatsApp");
    });
  }
  var specShareFacebookBtn = document.getElementById("spec-share-facebook-btn");
  if (specShareFacebookBtn) {
    specShareFacebookBtn.addEventListener("click", function (e) {
      handleSocialPlatformShareClick(e, "Facebook");
    });
  }

  // Global Camera QR Scanner & Hands-Free Web Speech API Voice Search
  var searchVoiceBtn = document.getElementById("search-voice-btn");
  if (searchVoiceBtn) {
    searchVoiceBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleVoiceSearch();
    });
  }
  var voicePopoverClose = document.getElementById("voice-popover-close");
  if (voicePopoverClose) {
    voicePopoverClose.addEventListener("click", function (e) {
      e.stopPropagation();
      closeVoiceSearchPopover();
    });
  }
  var voiceSuggestionsEl = document.getElementById("voice-popover-suggestions");
  if (voiceSuggestionsEl) {
    voiceSuggestionsEl.addEventListener("click", function (e) {
      var chip = e.target.closest(".voice-suggestion-chip");
      if (!chip) return;
      var sample = chip.getAttribute("data-voice-sample") || "";
      if (sample) {
        applyVoiceSearchTranscript(sample, true);
      }
    });
  }
  document.addEventListener("click", function (e) {
    var popover = document.getElementById("voice-search-popover");
    var wrap = document.getElementById("topbar-search-wrap");
    if (popover && !popover.hidden && wrap && !wrap.contains(e.target)) {
      closeVoiceSearchPopover();
    }
  });

  var searchScanQrBtn = document.getElementById("search-scan-qr-btn");
  if (searchScanQrBtn) {
    searchScanQrBtn.addEventListener("click", openQrScannerModal);
  }
  var qrScannerClose = document.getElementById("qr-scanner-close");
  if (qrScannerClose) {
    qrScannerClose.addEventListener("click", closeQrScannerModal);
  }
  var qrScannerOverlay = document.getElementById("qr-scanner-overlay");
  if (qrScannerOverlay) {
    qrScannerOverlay.addEventListener("click", function (e) {
      if (e.target === qrScannerOverlay) closeQrScannerModal();
    });
  }
  var qrScannerFlipBtn = document.getElementById("qr-scanner-flip-cam-btn");
  if (qrScannerFlipBtn) {
    qrScannerFlipBtn.addEventListener("click", flipQrCamera);
  }
  var qrScannerFileInput = document.getElementById("qr-scanner-file-input");
  if (qrScannerFileInput) {
    qrScannerFileInput.addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) {
        handleQrImageUpload(e.target.files[0]);
      }
    });
  }
  var qrAudioToggleBtn = document.getElementById("qr-audio-toggle-btn");
  if (qrAudioToggleBtn) {
    qrAudioToggleBtn.addEventListener("click", function () {
      initOrResumeQrAudioContext();
      var newState = !isQrAudioPingEnabled();
      setQrAudioPingEnabled(newState);
      if (newState) {
        playScanSuccessChime(true);
        showActivityToast("Audio ping feedback: Enabled (🔊)");
      } else {
        showActivityToast("Audio ping feedback: Muted (🔇)");
      }
    });
  }

  var qrAudioTestBtn = document.getElementById("qr-audio-test-btn");
  if (qrAudioTestBtn) {
    qrAudioTestBtn.addEventListener("click", function () {
      initOrResumeQrAudioContext();
      triggerQrScanPingFeedback("✓ Acoustic Ping Test");
      setTimeout(resetQrScanPingFeedback, 550);
      showActivityToast("Played subtle QR audio ping feedback");
    });
  }

  var qrManualForm = document.getElementById("qr-manual-entry-form");
  if (qrManualForm) {
    qrManualForm.addEventListener("submit", handleManualQrSubmit);
  }
  var qrScanHistoryClearBtn = document.getElementById("qr-scan-history-clear-btn");
  if (qrScanHistoryClearBtn) {
    qrScanHistoryClearBtn.addEventListener("click", window.clearQrScanHistory);
  }
  loadQrScanHistory();
  renderQrScanHistory();

  // Promo code controls
  if (promoApplyBtnEl) {
    promoApplyBtnEl.addEventListener("click", applyPromoCode);
  }
  if (promoInputEl) {
    promoInputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        applyPromoCode();
      }
    });
  }

  // Top-right sheets
  cartBtnEl.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleSheet(cartSheetEl, cartBtnEl);
  });
  avatarBtnEl.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleSheet(profileSheetEl, avatarBtnEl);
  });

  cartSheetEl.addEventListener("click", function (e) { e.stopPropagation(); });
  profileSheetEl.addEventListener("click", function (e) { e.stopPropagation(); });

  document.addEventListener("click", closeAllSheets);

  billSaveEl.addEventListener("click", saveBillEmail);
  historyToggleEl.addEventListener("click", toggleHistory);

  var wishToggleEl = document.getElementById("wishlist-toggle");
  if (wishToggleEl) {
    wishToggleEl.addEventListener("click", toggleWishlistPanel);
  }
  var wishAddAllBtnEl = document.getElementById("wishlist-add-all-btn");
  if (wishAddAllBtnEl) {
    wishAddAllBtnEl.addEventListener("click", addAllWishlistToCart);
  }
  var wishClearBtnEl = document.getElementById("wishlist-clear-btn");
  if (wishClearBtnEl) {
    wishClearBtnEl.addEventListener("click", clearWishlist);
  }

  // Price Drop Alerts listeners (Profile Sheet & Modal)
  var priceAlertsToggleEl = document.getElementById("price-alerts-toggle");
  if (priceAlertsToggleEl) {
    priceAlertsToggleEl.addEventListener("click", togglePriceAlertsPanel);
  }
  var priceAlertOverlayEl = document.getElementById("price-alert-overlay");
  var priceAlertCloseEl = document.getElementById("price-alert-close");
  var priceAlertFormEl = document.getElementById("price-alert-form");
  var priceAlertTestBtnEl = document.getElementById("price-alert-test-btn");
  var priceAlertRemoveBtnEl = document.getElementById("price-alert-remove-btn");
  var priceAlertPresetsGridEl = document.getElementById("price-alert-presets-grid");
  var priceAlertThresholdInputEl = document.getElementById("price-alert-threshold-input");
  var priceAlertEmailInputEl = document.getElementById("price-alert-email-input");

  if (priceAlertCloseEl) {
    priceAlertCloseEl.addEventListener("click", closePriceAlertModal);
  }
  if (priceAlertOverlayEl) {
    priceAlertOverlayEl.addEventListener("click", function (e) {
      if (e.target === priceAlertOverlayEl) closePriceAlertModal();
    });
  }
  if (priceAlertFormEl) {
    priceAlertFormEl.addEventListener("submit", savePriceAlert);
  }
  if (priceAlertTestBtnEl) {
    priceAlertTestBtnEl.addEventListener("click", simulatePriceDropAlert);
  }
  if (priceAlertRemoveBtnEl) {
    priceAlertRemoveBtnEl.addEventListener("click", function () {
      removePriceAlert(activePriceAlertProductId);
    });
  }
  if (priceAlertPresetsGridEl) {
    priceAlertPresetsGridEl.addEventListener("click", function (e) {
      var chip = e.target.closest(".price-preset-chip");
      if (!chip) return;
      var val = chip.getAttribute("data-target-price");
      if (val && priceAlertThresholdInputEl) {
        priceAlertThresholdInputEl.value = val;
        var allChips = priceAlertPresetsGridEl.querySelectorAll(".price-preset-chip");
        for (var i = 0; i < allChips.length; i++) {
          allChips[i].classList.toggle("active", allChips[i] === chip);
        }
        var p = findProductById(activePriceAlertProductId);
        if (p) {
          updatePriceAlertSavingsCallout(p.price, val, priceAlertEmailInputEl ? priceAlertEmailInputEl.value : "");
          renderPriceAlertSparkline(p, val);
        }
      }
    });
  }
  function onPriceAlertFieldInput() {
    var p = findProductById(activePriceAlertProductId);
    if (!p) return;
    var tVal = priceAlertThresholdInputEl ? priceAlertThresholdInputEl.value : "";
    var eVal = priceAlertEmailInputEl ? priceAlertEmailInputEl.value : "";
    updatePriceAlertSavingsCallout(p.price, tVal, eVal);
    renderPriceAlertSparkline(p, tVal);
  }
  if (priceAlertThresholdInputEl) {
    priceAlertThresholdInputEl.addEventListener("input", onPriceAlertFieldInput);
  }
  if (priceAlertEmailInputEl) {
    priceAlertEmailInputEl.addEventListener("input", onPriceAlertFieldInput);
  }

  // Price Alert Expiry Date inputs & duration presets
  var priceAlertExpiryPresetsEl = document.getElementById("price-alert-expiry-presets");
  var priceAlertExpiryInputEl = document.getElementById("price-alert-expiry-input");

  window.updateExpiryUIFromInput = function () {
    var expiryInput = document.getElementById("price-alert-expiry-input");
    var statusEl = document.getElementById("price-alert-expiry-status");
    var hintEl = document.getElementById("price-alert-expiry-hint");
    var presetsEl = document.getElementById("price-alert-expiry-presets");
    if (!expiryInput) return;
    var rawVal = expiryInput.value ? expiryInput.value.trim() : "";
    if (!rawVal) {
      if (statusEl) {
        statusEl.textContent = "Active until canceled";
        statusEl.className = "price-alert-expiry-status";
      }
      if (hintEl) {
        hintEl.textContent = "Price monitoring will run continuously until you manually remove or cancel the alert.";
      }
      if (presetsEl) {
        var chips = presetsEl.querySelectorAll(".expiry-preset-chip");
        for (var i = 0; i < chips.length; i++) {
          chips[i].classList.toggle("active", chips[i].getAttribute("data-days") === "0");
        }
      }
      return;
    }
    var expDate = new Date(rawVal + "T23:59:59.999Z");
    var now = Date.now();
    var isPast = expDate.getTime() < now;
    if (statusEl) {
      if (isPast) {
        statusEl.textContent = "⚠️ Expired (" + rawVal + ")";
        statusEl.className = "price-alert-expiry-status expired";
      } else {
        var daysLeft = Math.ceil((expDate.getTime() - now) / (1000 * 60 * 60 * 24));
        statusEl.textContent = "Active until " + rawVal + " (" + daysLeft + "d left)";
        statusEl.className = "price-alert-expiry-status active";
      }
    }
    if (hintEl) {
      hintEl.textContent = isPast
        ? "This alert has passed its expiry date and is currently deactivated. Select a future date to re-enable monitoring."
        : "Alert monitoring will automatically deactivate at the end of " + rawVal + ".";
    }
  };

  if (priceAlertExpiryPresetsEl) {
    priceAlertExpiryPresetsEl.addEventListener("click", function (e) {
      var chip = e.target.closest(".expiry-preset-chip");
      if (!chip) return;
      var expiryInput = document.getElementById("price-alert-expiry-input");
      if (!expiryInput) return;
      var days = parseInt(chip.getAttribute("data-days") || "0", 10);
      if (days > 0) {
        var targetDate = new Date(Date.now() + days * 86400000);
        var yyyy = targetDate.getUTCFullYear();
        var mm = String(targetDate.getUTCMonth() + 1).padStart(2, "0");
        var dd = String(targetDate.getUTCDate()).padStart(2, "0");
        expiryInput.value = yyyy + "-" + mm + "-" + dd;
      } else {
        expiryInput.value = "";
      }
      var allChips = priceAlertExpiryPresetsEl.querySelectorAll(".expiry-preset-chip");
      for (var i = 0; i < allChips.length; i++) {
        allChips[i].classList.toggle("active", allChips[i] === chip);
      }
      window.updateExpiryUIFromInput();
    });
  }

  if (priceAlertExpiryInputEl) {
    priceAlertExpiryInputEl.addEventListener("change", function () {
      window.updateExpiryUIFromInput();
      if (priceAlertExpiryPresetsEl) {
        var allChips = priceAlertExpiryPresetsEl.querySelectorAll(".expiry-preset-chip");
        for (var i = 0; i < allChips.length; i++) {
          allChips[i].classList.remove("active");
        }
      }
    });
  }

  checkoutEl.addEventListener("click", openCheckoutModal);
  cartSheetGoEl.addEventListener("click", openCheckoutModal);

  checkoutPayEl.addEventListener("click", payNow);
  checkoutCloseEl.addEventListener("click", function () { closeModal(checkoutOverlayEl); });
  checkoutOverlayEl.addEventListener("click", function (e) {
    if (e.target === checkoutOverlayEl) closeModal(checkoutOverlayEl);
  });

  // Side-by-Side Product Comparison listeners
  var topbarCompareBtn = document.getElementById("topbar-compare-btn");
  if (topbarCompareBtn) {
    topbarCompareBtn.addEventListener("click", openComparisonModal);
  }
  var compareDockLaunchBtn = document.getElementById("compare-dock-launch-btn");
  if (compareDockLaunchBtn) {
    compareDockLaunchBtn.addEventListener("click", openComparisonModal);
  }
  var compareDockClearBtn = document.getElementById("compare-dock-clear-btn");
  if (compareDockClearBtn) {
    compareDockClearBtn.addEventListener("click", clearComparison);
  }
  var compareModalClearBtn = document.getElementById("compare-modal-clear-btn");
  if (compareModalClearBtn) {
    compareModalClearBtn.addEventListener("click", clearComparison);
  }
  var compareCloseBtn = document.getElementById("compare-close");
  if (compareCloseBtn) {
    compareCloseBtn.addEventListener("click", closeComparisonModal);
  }
  var compareOverlayEl = document.getElementById("compare-overlay");
  if (compareOverlayEl) {
    compareOverlayEl.addEventListener("click", function (e) {
      if (e.target === compareOverlayEl) closeComparisonModal();
    });
  }
  var compareDiffToggle = document.getElementById("compare-diff-toggle");
  if (compareDiffToggle) {
    compareDiffToggle.addEventListener("change", function () {
      compareHighlightDiffs = Boolean(this.checked);
      renderComparisonTable();
    });
  }
  var compareAddSelect = document.getElementById("compare-add-part-select");
  if (compareAddSelect) {
    compareAddSelect.addEventListener("change", function () {
      var val = Number(this.value);
      if (val) {
        toggleCompareItem(val);
        this.value = "";
      }
    });
  }
  var compareAddAllBtn = document.getElementById("compare-add-all-cart-btn");
  if (compareAddAllBtn) {
    compareAddAllBtn.addEventListener("click", addAllComparedToCart);
  }

  // Receipt buttons
  receiptCloseEl.addEventListener("click", closeReceipt);
  receiptPrintEl.addEventListener("click", function () { window.print(); });
  if (receiptDownloadEl) {
    receiptDownloadEl.addEventListener("click", downloadReceiptPng);
  }
  receiptEmailEl.addEventListener("click", emailCurrentBill);

  overlayEl.addEventListener("click", function (e) {
    if (e.target === overlayEl) closeReceipt();
  });

  // Background FX Mode Switcher
  if (bgFxBtnEl) {
    bgFxBtnEl.addEventListener("click", cycleBgFxMode);
  }

  // PWA Install Guide Modal
  if (pwaInstallBtnEl) {
    pwaInstallBtnEl.addEventListener("click", openPwaInstallModal);
  }
  if (pwaInstallCloseEl) {
    pwaInstallCloseEl.addEventListener("click", closePwaInstallModal);
  }
  if (pwaInstallOverlayEl) {
    pwaInstallOverlayEl.addEventListener("click", function (e) {
      if (e.target === pwaInstallOverlayEl) closePwaInstallModal();
    });
  }
  if (pwaNativeTriggerEl) {
    pwaNativeTriggerEl.addEventListener("click", function () {
      if (deferredPwaPrompt) {
        deferredPwaPrompt.prompt();
        deferredPwaPrompt.userChoice.finally(function () {
          deferredPwaPrompt = null;
          pwaNativeTriggerEl.hidden = true;
          closePwaInstallModal();
        });
      }
    });
  }

  // Bench Messenger Drawer
  if (messengerBtnEl) {
    messengerBtnEl.addEventListener("click", function () {
      if (isMessengerOpen) closeMessenger();
      else openMessenger();
    });
  }
  if (messengerCloseEl) {
    messengerCloseEl.addEventListener("click", closeMessenger);
  }
  if (messengerOverlayEl) {
    messengerOverlayEl.addEventListener("click", function (e) {
      if (e.target === messengerOverlayEl) closeMessenger();
    });
  }
  if (messengerChannelsEl) {
    messengerChannelsEl.addEventListener("click", function (e) {
      var tab = e.target.closest(".msg-channel-btn, .msg-channel-tab");
      if (!tab) return;
      activeChatChannel = tab.getAttribute("data-channel") || "engineering-desk";
      var allTabs = messengerChannelsEl.querySelectorAll(".msg-channel-btn, .msg-channel-tab");
      for (var i = 0; i < allTabs.length; i++) {
        var active = allTabs[i] === tab;
        allTabs[i].classList.toggle("active", active);
        allTabs[i].setAttribute("aria-selected", active ? "true" : "false");
      }
      if (chatMessageInputEl) {
        chatMessageInputEl.placeholder = "Message #" + activeChatChannel + " or share a PC build…";
      }
      renderMessengerFeed();
    });
  }
  if (messengerChipsEl) {
    messengerChipsEl.addEventListener("click", function (e) {
      var chip = e.target.closest(".msg-quick-chip, .msg-chip");
      if (!chip || !chatMessageInputEl) return;
      var promptText = chip.getAttribute("data-prompt") || "";
      chatMessageInputEl.value = promptText;
      chatMessageInputEl.focus();
    });
  }
  if (messengerFormEl) {
    messengerFormEl.addEventListener("submit", function (e) {
      e.preventDefault();
      sendMessengerMessage();
    });
  }
  if (chatSendBtnEl) {
    chatSendBtnEl.addEventListener("click", function (e) {
      e.preventDefault();
      sendMessengerMessage();
    });
  }
  if (chatMessageInputEl) {
    chatMessageInputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessengerMessage();
      }
    });
  }

  // Collapsible Order Bar Toggle (Mobile, Tablet & Desktop)
  if (orderExpandToggleEl && orderBarEl) {
    orderExpandToggleEl.addEventListener("click", function (e) {
      e.stopPropagation();
      var expanded = orderBarEl.classList.toggle("mobile-expanded");
      orderExpandToggleEl.setAttribute("aria-expanded", expanded ? "true" : "false");
      var toggleLabel = document.getElementById("order-expand-label");
      if (toggleLabel) {
        toggleLabel.textContent = toggleLabel.textContent.replace(/[▲▼]/g, expanded ? "▼" : "▲");
      }
    });
  }

  // Mobile & iPad Bottom App Dock
  if (mobileAppNavEl) {
    mobileAppNavEl.addEventListener("click", function (e) {
      var navBtn = e.target.closest(".mnav-item, .mobile-nav-item");
      if (!navBtn) return;
      e.stopPropagation();
      var target = navBtn.getAttribute("data-nav");
      setMobileDockActive(target);

      if (target === "catalog") {
        closeMessenger();
        closeRigDrawer();
        closeSpecDrawer();
        closeAllSheets();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (target === "rig") {
        closeMessenger();
        closeSpecDrawer();
        closeAllSheets();
        openRigDrawer();
      } else if (target === "messenger") {
        closeRigDrawer();
        closeSpecDrawer();
        closeAllSheets();
        openMessenger();
      } else if (target === "cart") {
        closeMessenger();
        closeRigDrawer();
        closeSpecDrawer();
        toggleSheet(cartSheetEl, cartBtnEl);
      } else if (target === "account") {
        closeMessenger();
        closeRigDrawer();
        closeSpecDrawer();
        toggleSheet(profileSheetEl, avatarBtnEl);
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (overlayEl && overlayEl.classList.contains("open")) closeReceipt();
      else if (checkoutOverlayEl && checkoutOverlayEl.classList.contains("open")) closeModal(checkoutOverlayEl);
      else if (priceAlertOverlayEl && priceAlertOverlayEl.classList.contains("open")) closePriceAlertModal();
      else if (pwaInstallOverlayEl && pwaInstallOverlayEl.classList.contains("open")) closePwaInstallModal();
      else if (messengerOverlayEl && messengerOverlayEl.classList.contains("open")) closeMessenger();
      else if (specDrawerOverlayEl && specDrawerOverlayEl.classList.contains("open")) closeSpecDrawer();
      else if (rigDrawerOverlayEl && rigDrawerOverlayEl.classList.contains("open")) closeRigDrawer();
      else closeAllSheets();
      return;
    }

    // Do not trigger global navigation shortcuts if user is typing in form controls
    var activeTag = document.activeElement ? document.activeElement.tagName : "";
    if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") {
      return;
    }

    // 'g' or 'G' jumps to the catalog grid
    if (e.key === "g" || e.key === "G") {
      var firstCard = gridEl.querySelector(".card:not([hidden])");
      if (firstCard) {
        e.preventDefault();
        firstCard.focus();
        firstCard.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
        showToast("Catalog grid focused — use Arrow keys to navigate, Enter for specs, +/- for cart", "info");
      }
      return;
    }

    // '/' jumps to search input
    if (e.key === "/" && searchEl) {
      e.preventDefault();
      searchEl.focus();
      searchEl.select();
      return;
    }
  });
}

// ── Multi-Method Checkout State & Handlers ──
var activePaymentMethod = "upi";
var activeUpiApp = "GPay";
var activeUpiMode = "vpa";
var activeCardNetwork = "Visa";
var activeNetbank = "HDFC Bank";
var activeEmiMonths = 3;
var paymentUiWired = false;
var upiOverlayTimerInterval = null;
var upiOverlaySecondsLeft = 300;
var upiOverlayOrderRef = "VB-UPI-01";
var upiSimulationRunning = false;

var UPI_OVERLAY_PROFILES = {
  GPay: {
    id: "GPay",
    label: "Google Pay",
    merchantVpa: "voltbox.gpay@okaxis",
    defaultPayerVpa: "harish@okaxis",
    qrTheme: "cyber"
  },
  PhonePe: {
    id: "PhonePe",
    label: "PhonePe",
    merchantVpa: "voltbox.phonepe@ybl",
    defaultPayerVpa: "harish@ybl",
    qrTheme: "gold"
  },
  Paytm: {
    id: "Paytm",
    label: "Paytm",
    merchantVpa: "voltbox.paytm@paytm",
    defaultPayerVpa: "harish@paytm",
    qrTheme: "cyber"
  },
  BHIM: {
    id: "BHIM",
    label: "BHIM UPI",
    merchantVpa: "voltbox.bhim@upi",
    defaultPayerVpa: "harish@upi",
    qrTheme: "amber"
  }
};

function buildClientUpiPayload(appId, amountUsd, orderRef, payerVpa) {
  var profile = UPI_OVERLAY_PROFILES[appId] || UPI_OVERLAY_PROFILES.GPay;
  var usd = Math.max(0, Number(amountUsd) || 0);
  var inr = Math.round(usd * 84);
  var ref = orderRef || upiOverlayOrderRef || "VB-UPI-01";
  var vpa = (payerVpa && payerVpa.trim()) ? payerVpa.trim() : profile.defaultPayerVpa;
  var uri =
    "upi://pay?pa=" + encodeURIComponent(profile.merchantVpa) +
    "&pn=" + encodeURIComponent("Voltbox Electronics") +
    "&tr=" + encodeURIComponent(ref) +
    "&am=" + usd.toFixed(2) +
    "&cu=USD" +
    "&tn=" + encodeURIComponent("Voltbox Order " + ref + " via " + profile.label);
  return {
    appId: profile.id,
    appLabel: profile.label,
    merchantVpa: profile.merchantVpa,
    payerVpa: vpa,
    qrTheme: profile.qrTheme,
    amountUsd: usd,
    amountInr: inr,
    upiUri: uri
  };
}

function detectCardBrand(cardNumber) {
  var digits = String(cardNumber || "").replace(/\D/g, "");
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^(60|65|81|82|508)/.test(digits)) return "RuPay";
  return activeCardNetwork || "Visa";
}

function getFormattedPaymentSummary() {
  if (activePaymentMethod === "upi") {
    if (activeUpiMode === "qr") {
      return "UPI QR (" + activeUpiApp + ")";
    }
    var upiInput = document.getElementById("checkout-upi-id");
    var vpa = (upiInput && upiInput.value.trim()) ? upiInput.value.trim() : "harish@okaxis";
    return "UPI (" + activeUpiApp + " · " + vpa + ")";
  }
  if (activePaymentMethod === "debit_card") {
    var dcDigits = String(checkoutCardNumEl ? checkoutCardNumEl.value : "").replace(/\D/g, "");
    var dcLast4 = dcDigits.length >= 4 ? dcDigits.slice(-4) : "8821";
    var dcNet = detectCardBrand(checkoutCardNumEl ? checkoutCardNumEl.value : "");
    return "Debit Card (" + dcNet + " •••• " + dcLast4 + ")";
  }
  if (activePaymentMethod === "netbanking") {
    return "NetBanking (" + activeNetbank + ")";
  }
  if (activePaymentMethod === "emi") {
    return "No-Cost EMI (" + activeEmiMonths + "M Plan)";
  }
  var ccDigits = String(checkoutCardNumEl ? checkoutCardNumEl.value : "").replace(/\D/g, "");
  var ccLast4 = ccDigits.length >= 4 ? ccDigits.slice(-4) : "4242";
  var ccNet = detectCardBrand(checkoutCardNumEl ? checkoutCardNumEl.value : "");
  return "Credit Card (" + ccNet + " •••• " + ccLast4 + ")";
}

function renderCheckoutItemsPreview(totals) {
  var previewEl = document.getElementById("checkout-items-preview");
  if (!previewEl) return;

  var itemsHtml = "";
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var q = cart[p.id] || 0;
    if (q <= 0) continue;
    var imgUrl = getProductImageUrl(p);
    var lineSum = round(p.price * q);
    itemsHtml +=
      '<div class="checkout-preview-item" data-testid="checkout-preview-item">' +
        '<img class="checkout-preview-img" src="' + esc(imgUrl) + '" alt="' + esc(p.title) + '" ' +
             'onerror="this.onerror=null;this.src=\'' + tileFor(p.category) + '\'" />' +
        '<div class="checkout-preview-info">' +
          '<span class="checkout-preview-title">' + esc(p.title) + '</span>' +
          '<span class="checkout-preview-sub">Qty ' + q + ' × $' + p.price.toFixed(2) + '</span>' +
        '</div>' +
        '<span class="checkout-preview-price">$' + lineSum.toFixed(2) + '</span>' +
      '</div>';
  }

  previewEl.innerHTML =
    '<div class="checkout-preview-head">' +
      '<span>Order Summary (' + totals.count + (totals.count === 1 ? ' item' : ' items') + ')</span>' +
      '<div class="checkout-preview-head-right">' +
        '<button type="button" class="checkout-preview-print-link" id="checkout-preview-print-btn" onclick="openCheckoutPrintSummary()" title="Open printable order summary">' +
          icon("printer", 12) + ' <span>Print Summary</span>' +
        '</button>' +
        '<strong class="checkout-preview-total">$' + totals.total.toFixed(2) + ' incl. tax</strong>' +
      '</div>' +
    '</div>' +
    '<div class="checkout-preview-list">' + itemsHtml + '</div>';
}

function renderCheckoutEmiPlans(totalAmount) {
  var container = document.getElementById("checkout-emi-plans");
  if (!container) return;
  var plans = [
    { months: 3, tag: "0% APR · No-Cost", fee: "$0 Fee" },
    { months: 6, tag: "0% APR · No-Cost", fee: "$0 Fee" },
    { months: 12, tag: "Hardware Flex Plan", fee: "Zero Down" }
  ];
  var html = "";
  for (var i = 0; i < plans.length; i++) {
    var pl = plans[i];
    var monthly = round(totalAmount / pl.months);
    var isSel = activeEmiMonths === pl.months;
    html +=
      '<button type="button" class="emi-plan-card' + (isSel ? ' active' : '') + '" data-emi-months="' + pl.months + '">' +
        '<div class="emi-plan-left">' +
          '<strong>' + pl.months + ' Months × $' + monthly.toFixed(2) + '/mo</strong>' +
          '<span>Total $' + totalAmount.toFixed(2) + ' · ' + pl.fee + '</span>' +
        '</div>' +
        '<span class="emi-plan-badge">' + pl.tag + '</span>' +
      '</button>';
  }
  container.innerHTML = html;
}

function setUpiWorkflowStepState(stepNumber, statusText) {
  var stepsWrap = document.getElementById("upi-workflow-steps");
  if (stepsWrap) {
    var stepEls = stepsWrap.querySelectorAll(".upi-wf-step");
    for (var i = 0; i < stepEls.length; i++) {
      var sNum = Number(stepEls[i].getAttribute("data-wf-step")) || (i + 1);
      stepEls[i].classList.toggle("done", sNum < stepNumber);
      stepEls[i].classList.toggle("active", sNum === stepNumber);
    }
  }
  var statusEl = document.getElementById("upi-overlay-status-text");
  if (statusEl && statusText) {
    statusEl.textContent = statusText;
  }
}

function syncUpiQrOverlay() {
  var totals = computeTotals();
  var payerInput = document.getElementById("upi-overlay-payer-vpa");
  var payload = buildClientUpiPayload(
    activeUpiApp,
    totals.total,
    upiOverlayOrderRef,
    payerInput ? payerInput.value : ""
  );

  // Sync app tabs inside overlay
  var overlayTabs = document.getElementById("upi-overlay-app-tabs");
  if (overlayTabs) {
    var btns = overlayTabs.querySelectorAll(".upi-overlay-app-tab");
    for (var i = 0; i < btns.length; i++) {
      var appAttr = btns[i].getAttribute("data-upi-overlay-app");
      var isAct = (appAttr === activeUpiApp);
      btns[i].classList.toggle("active", isAct);
      btns[i].setAttribute("aria-selected", isAct ? "true" : "false");
    }
  }

  // Sync main checkout UPI app chips as well
  var upiAppsRow = document.getElementById("upi-apps-row");
  if (upiAppsRow) {
    var chips = upiAppsRow.querySelectorAll(".upi-app-chip");
    for (var c = 0; c < chips.length; c++) {
      chips[c].classList.toggle("active", chips[c].getAttribute("data-upi-app") === activeUpiApp);
    }
  }

  var pillEl = document.getElementById("upi-overlay-app-pill");
  if (pillEl) pillEl.textContent = payload.appLabel + " QR · Instant 0% Fee";

  var usdEl = document.getElementById("upi-overlay-amount-usd");
  if (usdEl) usdEl.textContent = "$" + payload.amountUsd.toFixed(2);

  var inrEl = document.getElementById("upi-overlay-amount-inr");
  if (inrEl) inrEl.textContent = "≈ ₹" + payload.amountInr.toLocaleString("en-IN");

  var vpaEl = document.getElementById("upi-overlay-merchant-vpa");
  if (vpaEl) vpaEl.textContent = payload.merchantVpa;

  var wf1 = document.getElementById("upi-wf-text-1");
  var wf2 = document.getElementById("upi-wf-text-2");
  var wf3 = document.getElementById("upi-wf-text-3");
  if (wf1) wf1.textContent = "Dynamic " + payload.appLabel + " QR & Collect Intent Generated";
  if (wf2) wf2.textContent = "Approve payment request in " + payload.appLabel + " (" + payload.payerVpa + ")";
  if (wf3) wf3.textContent = "NPCI UPI Verified · Instant Settlement ($" + payload.amountUsd.toFixed(2) + ")";

  var confirmLabel = document.getElementById("upi-overlay-confirm-label");
  if (confirmLabel && !upiSimulationRunning) {
    confirmLabel.textContent = "Approve & Pay $" + payload.amountUsd.toFixed(2) + " via " + payload.appLabel;
  }

  var overlayQrMount = document.getElementById("upi-overlay-qr-mount");
  if (overlayQrMount) {
    if (window.VoltboxQR && typeof window.VoltboxQR.renderQrIntoElement === "function") {
      window.VoltboxQR.renderQrIntoElement(overlayQrMount, payload.upiUri, {
        margin: 1,
        theme: payload.qrTheme
      });
    } else {
      overlayQrMount.innerHTML = receiptQrSvg("UPI-" + payload.appId.toUpperCase() + "-" + payload.amountUsd.toFixed(2));
    }
  }
}

function startUpiOverlayCountdown() {
  stopUpiOverlayCountdown();
  upiOverlaySecondsLeft = 300;
  var timerEl = document.getElementById("upi-overlay-timer");
  var updateClock = function () {
    if (!timerEl) return;
    var mins = Math.floor(upiOverlaySecondsLeft / 60);
    var secs = upiOverlaySecondsLeft % 60;
    timerEl.textContent = (mins < 10 ? "0" + mins : String(mins)) + ":" + (secs < 10 ? "0" + secs : String(secs));
  };
  updateClock();
  upiOverlayTimerInterval = setInterval(function () {
    if (upiOverlaySecondsLeft > 0) {
      upiOverlaySecondsLeft--;
      updateClock();
    }
  }, 1000);
}

function stopUpiOverlayCountdown() {
  if (upiOverlayTimerInterval) {
    clearInterval(upiOverlayTimerInterval);
    upiOverlayTimerInterval = null;
  }
}

function openUpiQrOverlay(preferredApp) {
  var name = checkoutNameEl ? checkoutNameEl.value.trim() : "";
  var address = checkoutAddressEl ? checkoutAddressEl.value.trim() : "";
  if (!name && checkoutNameEl) checkoutNameEl.value = me ? me.name : "Harish";
  if (!address && checkoutAddressEl) checkoutAddressEl.value = "42 Circuit Lane, Silicon Bay";

  activePaymentMethod = "upi";
  activeUpiMode = "qr";
  if (preferredApp && UPI_OVERLAY_PROFILES[preferredApp]) {
    activeUpiApp = preferredApp;
  } else if (!UPI_OVERLAY_PROFILES[activeUpiApp]) {
    activeUpiApp = "GPay";
  }

  upiOverlayOrderRef = "VB-" + Math.floor(1000 + (Date.now() % 9000));
  upiSimulationRunning = false;

  var payerInput = document.getElementById("upi-overlay-payer-vpa");
  var mainUpiInput = document.getElementById("checkout-upi-id");
  var profile = UPI_OVERLAY_PROFILES[activeUpiApp] || UPI_OVERLAY_PROFILES.GPay;
  if (payerInput) {
    payerInput.value = (mainUpiInput && mainUpiInput.value.trim()) ? mainUpiInput.value.trim() : profile.defaultPayerVpa;
  }

  var vpaModeBtn = document.getElementById("upi-mode-vpa-btn");
  var qrModeBtn = document.getElementById("upi-mode-qr-btn");
  var vpaBox = document.getElementById("upi-vpa-box");
  var qrBox = document.getElementById("upi-qr-box");
  if (vpaModeBtn && qrModeBtn) {
    qrModeBtn.classList.add("active");
    vpaModeBtn.classList.remove("active");
  }
  if (vpaBox) vpaBox.hidden = true;
  if (qrBox) qrBox.hidden = false;

  syncPaymentMethodUi();
  syncUpiQrOverlay();
  setUpiWorkflowStepState(1, "Scan QR with " + profile.label + " or tap Send Request below…");
  startUpiOverlayCountdown();

  var overlayEl = document.getElementById("upi-qr-overlay");
  if (checkoutFormEl) checkoutFormEl.hidden = true;
  if (overlayEl) overlayEl.hidden = false;
}

function closeUpiQrOverlay() {
  stopUpiOverlayCountdown();
  upiSimulationRunning = false;
  var overlayEl = document.getElementById("upi-qr-overlay");
  if (overlayEl) overlayEl.hidden = true;
  if (checkoutFormEl) checkoutFormEl.hidden = false;
  syncPaymentMethodUi();
}

function sendUpiCollectRequestSimulation() {
  if (upiSimulationRunning) return;
  var payerInput = document.getElementById("upi-overlay-payer-vpa");
  var vpa = payerInput ? payerInput.value.trim() : "";
  var profile = UPI_OVERLAY_PROFILES[activeUpiApp] || UPI_OVERLAY_PROFILES.GPay;
  if (!vpa || vpa.indexOf("@") === -1) {
    vpa = profile.defaultPayerVpa;
    if (payerInput) payerInput.value = vpa;
  }
  var mainUpiInput = document.getElementById("checkout-upi-id");
  if (mainUpiInput) mainUpiInput.value = vpa;

  syncUpiQrOverlay();
  setUpiWorkflowStepState(2, "Collect request sent to " + vpa + " on " + profile.label + " — waiting for PIN approval…");
  var sendBtn = document.getElementById("upi-send-collect-btn");
  if (sendBtn) {
    sendBtn.textContent = "Request Sent ✓";
    setTimeout(function () {
      if (sendBtn) sendBtn.textContent = "Send Request";
    }, 2200);
  }
}

function simulateUpiScanAndPay() {
  if (upiSimulationRunning) return;
  upiSimulationRunning = true;

  activePaymentMethod = "upi";
  activeUpiMode = "qr";

  var totals = computeTotals();
  var profile = UPI_OVERLAY_PROFILES[activeUpiApp] || UPI_OVERLAY_PROFILES.GPay;
  var payerInput = document.getElementById("upi-overlay-payer-vpa");
  var mainUpiInput = document.getElementById("checkout-upi-id");
  if (payerInput && payerInput.value.trim() && mainUpiInput) {
    mainUpiInput.value = payerInput.value.trim();
  }

  var confirmBtn = document.getElementById("upi-overlay-confirm-pay-btn");
  var confirmLabel = document.getElementById("upi-overlay-confirm-label");
  if (confirmBtn) confirmBtn.disabled = true;

  setUpiWorkflowStepState(2, "Verifying payment approval in " + profile.label + "…");
  if (confirmLabel) {
    confirmLabel.textContent = "Waiting for " + profile.label + " Approval…";
  }

  setTimeout(function () {
    setUpiWorkflowStepState(3, "NPCI UPI Verified $" + totals.total.toFixed(2) + " via " + profile.label + "!");
    if (confirmLabel) {
      confirmLabel.textContent = "Verified · Generating Receipt…";
    }
    playScanSuccessChime();

    setTimeout(function () {
      stopUpiOverlayCountdown();
      var overlayEl = document.getElementById("upi-qr-overlay");
      if (overlayEl) overlayEl.hidden = true;
      if (checkoutFormEl) checkoutFormEl.hidden = false;
      if (confirmBtn) confirmBtn.disabled = false;
      upiSimulationRunning = false;
      payNow();
    }, 220);
  }, 260);
}

function syncPaymentMethodUi() {
  var totals = computeTotals();
  var tabsWrap = document.getElementById("checkout-payment-tabs");
  if (tabsWrap) {
    var tabs = tabsWrap.querySelectorAll(".pay-method-tab");
    for (var i = 0; i < tabs.length; i++) {
      var m = tabs[i].getAttribute("data-pay-method");
      var isAct = (m === activePaymentMethod);
      tabs[i].classList.toggle("active", isAct);
      tabs[i].setAttribute("aria-selected", isAct ? "true" : "false");
    }
  }

  var panelUpi = document.getElementById("pay-panel-upi");
  var panelCard = document.getElementById("pay-panel-card");
  var panelNb = document.getElementById("pay-panel-netbanking");
  var panelEmi = document.getElementById("pay-panel-emi");

  if (panelUpi) panelUpi.hidden = (activePaymentMethod !== "upi");
  if (panelCard) panelCard.hidden = (activePaymentMethod !== "credit_card" && activePaymentMethod !== "debit_card");
  if (panelNb) panelNb.hidden = (activePaymentMethod !== "netbanking");
  if (panelEmi) panelEmi.hidden = (activePaymentMethod !== "emi");

  var cardModeLabel = document.getElementById("checkout-card-mode-label");
  var cardPerksNote = document.getElementById("checkout-card-perks-note");
  if (cardModeLabel) {
    cardModeLabel.textContent = activePaymentMethod === "debit_card" ? "Debit Card Networks:" : "Credit Card Networks:";
  }
  if (cardPerksNote) {
    cardPerksNote.textContent = activePaymentMethod === "debit_card"
      ? "✓ Zero-MDR RuPay / Visa / Mastercard Debit with Instant OTP Auto-Verify."
      : "✓ 256-Bit Tokenized Credit Card · 5% Cashback on Voltbox Hardware Cards.";
  }

  var qrMount = document.getElementById("checkout-upi-qr-mount");
  var qrAmountEl = document.getElementById("checkout-upi-qr-amount");
  if (qrMount) {
    var inlinePayload = buildClientUpiPayload(activeUpiApp, totals.total, upiOverlayOrderRef, "");
    if (window.VoltboxQR && typeof window.VoltboxQR.renderQrIntoElement === "function") {
      window.VoltboxQR.renderQrIntoElement(qrMount, inlinePayload.upiUri, {
        margin: 1,
        theme: inlinePayload.qrTheme
      });
    } else {
      qrMount.innerHTML = receiptQrSvg("UPI-" + activeUpiApp.toUpperCase() + "-" + totals.total.toFixed(0));
    }
  }
  if (qrAmountEl) {
    qrAmountEl.textContent = "$" + totals.total.toFixed(2) + " via " + activeUpiApp;
  }

  renderCheckoutEmiPlans(totals.total);
  if (checkoutPayEl && !checkoutPayEl.disabled) {
    checkoutPayEl.innerHTML = payBtnLabel(totals.total);
  }
}

function wireUpPaymentGatewayUi() {
  if (paymentUiWired) return;
  paymentUiWired = true;

  var quickUpiBtn = document.getElementById("pay-via-upi-quick-btn");
  if (quickUpiBtn) {
    quickUpiBtn.addEventListener("click", function () {
      openUpiQrOverlay(activeUpiApp);
    });
  }

  var footerUpiBtn = document.getElementById("checkout-pay-via-upi-btn");
  if (footerUpiBtn) {
    footerUpiBtn.addEventListener("click", function () {
      openUpiQrOverlay(activeUpiApp);
    });
  }

  var inlineOpenOverlayBtn = document.getElementById("upi-open-qr-overlay-btn");
  if (inlineOpenOverlayBtn) {
    inlineOpenOverlayBtn.addEventListener("click", function () {
      openUpiQrOverlay(activeUpiApp);
    });
  }

  var overlayCloseBtn = document.getElementById("upi-qr-overlay-close");
  if (overlayCloseBtn) {
    overlayCloseBtn.addEventListener("click", closeUpiQrOverlay);
  }

  var overlayAppTabs = document.getElementById("upi-overlay-app-tabs");
  if (overlayAppTabs) {
    overlayAppTabs.addEventListener("click", function (e) {
      var tab = e.target.closest(".upi-overlay-app-tab");
      if (!tab) return;
      var nextApp = tab.getAttribute("data-upi-overlay-app") || "GPay";
      activeUpiApp = nextApp;
      activePaymentMethod = "upi";
      activeUpiMode = "qr";
      var profile = UPI_OVERLAY_PROFILES[activeUpiApp] || UPI_OVERLAY_PROFILES.GPay;
      var payerInput = document.getElementById("upi-overlay-payer-vpa");
      var mainUpiInput = document.getElementById("checkout-upi-id");
      if (payerInput) payerInput.value = profile.defaultPayerVpa;
      if (mainUpiInput) mainUpiInput.value = profile.defaultPayerVpa;
      syncUpiQrOverlay();
      setUpiWorkflowStepState(1, "Switched to " + profile.label + " QR — ready to scan or send request.");
    });
  }

  var copyVpaBtn = document.getElementById("upi-overlay-copy-vpa-btn");
  if (copyVpaBtn) {
    copyVpaBtn.addEventListener("click", function () {
      var profile = UPI_OVERLAY_PROFILES[activeUpiApp] || UPI_OVERLAY_PROFILES.GPay;
      var labelEl = document.getElementById("upi-overlay-copy-label");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(profile.merchantVpa).catch(function () {});
      }
      if (labelEl) {
        labelEl.textContent = "Copied!";
        setTimeout(function () {
          if (labelEl) labelEl.textContent = "Copy";
        }, 1600);
      }
    });
  }

  var sendCollectBtn = document.getElementById("upi-send-collect-btn");
  if (sendCollectBtn) {
    sendCollectBtn.addEventListener("click", sendUpiCollectRequestSimulation);
  }

  var confirmOverlayPayBtn = document.getElementById("upi-overlay-confirm-pay-btn");
  if (confirmOverlayPayBtn) {
    confirmOverlayPayBtn.addEventListener("click", simulateUpiScanAndPay);
  }

  var tabsWrap = document.getElementById("checkout-payment-tabs");
  if (tabsWrap) {
    tabsWrap.addEventListener("click", function (e) {
      var btn = e.target.closest(".pay-method-tab");
      if (!btn) return;
      activePaymentMethod = btn.getAttribute("data-pay-method") || "upi";
      if (activePaymentMethod === "debit_card" && checkoutCardNumEl && checkoutCardNumEl.value.indexOf("4242") === 0) {
        checkoutCardNumEl.value = "6521 8800 1122 8821";
        activeCardNetwork = "RuPay";
      } else if (activePaymentMethod === "credit_card" && checkoutCardNumEl && !checkoutCardNumEl.value.trim()) {
        checkoutCardNumEl.value = "4242 4242 4242 4242";
        activeCardNetwork = "Visa";
      }
      syncPaymentMethodUi();
    });
  }

  var upiAppsRow = document.getElementById("upi-apps-row");
  if (upiAppsRow) {
    upiAppsRow.addEventListener("click", function (e) {
      var chip = e.target.closest(".upi-app-chip");
      if (!chip) return;
      activeUpiApp = chip.getAttribute("data-upi-app") || "GPay";
      var all = upiAppsRow.querySelectorAll(".upi-app-chip");
      for (var i = 0; i < all.length; i++) {
        all[i].classList.toggle("active", all[i] === chip);
      }
      var upiInput = document.getElementById("checkout-upi-id");
      if (upiInput) {
        var handles = { GPay: "harish@okaxis", PhonePe: "harish@ybl", Paytm: "harish@paytm", BHIM: "harish@upi" };
        upiInput.value = handles[activeUpiApp] || "harish@okaxis";
      }
      syncPaymentMethodUi();
    });
  }

  var vpaModeBtn = document.getElementById("upi-mode-vpa-btn");
  var qrModeBtn = document.getElementById("upi-mode-qr-btn");
  var vpaBox = document.getElementById("upi-vpa-box");
  var qrBox = document.getElementById("upi-qr-box");

  if (vpaModeBtn && qrModeBtn) {
    vpaModeBtn.addEventListener("click", function () {
      activeUpiMode = "vpa";
      vpaModeBtn.classList.add("active");
      qrModeBtn.classList.remove("active");
      if (vpaBox) vpaBox.hidden = false;
      if (qrBox) qrBox.hidden = true;
      syncPaymentMethodUi();
    });
    qrModeBtn.addEventListener("click", function () {
      activeUpiMode = "qr";
      qrModeBtn.classList.add("active");
      vpaModeBtn.classList.remove("active");
      if (vpaBox) vpaBox.hidden = true;
      if (qrBox) qrBox.hidden = false;
      syncPaymentMethodUi();
    });
  }

  var verifyBtn = document.getElementById("upi-verify-btn");
  var verifiedNote = document.getElementById("upi-verified-note");
  if (verifyBtn && verifiedNote) {
    verifyBtn.addEventListener("click", function () {
      var upiInput = document.getElementById("checkout-upi-id");
      var val = upiInput ? upiInput.value.trim() : "";
      if (!val || val.indexOf("@") === -1) {
        verifiedNote.textContent = "⚠ Enter a valid UPI ID with '@' (e.g. name@okaxis)";
        verifiedNote.className = "upi-verified-note warn";
        return;
      }
      verifiedNote.textContent = "✓ Verified VPA (" + val + ") · Account Holder: " + (me ? me.name : "Voltbox Member");
      verifiedNote.className = "upi-verified-note";
      syncPaymentMethodUi();
    });
  }

  var netChips = document.getElementById("card-network-chips");
  if (netChips) {
    netChips.addEventListener("click", function (e) {
      var chip = e.target.closest(".card-net-chip");
      if (!chip) return;
      activeCardNetwork = chip.getAttribute("data-net") || "Visa";
      var sample = chip.getAttribute("data-sample") || "4242 4242 4242 4242";
      if (checkoutCardNumEl) checkoutCardNumEl.value = sample;
      if (checkoutExpiryEl && !checkoutExpiryEl.value) checkoutExpiryEl.value = "08/29";
      if (checkoutCvvEl && !checkoutCvvEl.value) checkoutCvvEl.value = "842";
      var all = netChips.querySelectorAll(".card-net-chip");
      for (var i = 0; i < all.length; i++) {
        all[i].classList.toggle("active", all[i] === chip);
      }
      syncPaymentMethodUi();
    });
  }

  var nbGrid = document.getElementById("netbanking-grid");
  if (nbGrid) {
    nbGrid.addEventListener("click", function (e) {
      var btn = e.target.closest(".bank-option-btn");
      if (!btn) return;
      activeNetbank = btn.getAttribute("data-bank") || "HDFC Bank";
      var all = nbGrid.querySelectorAll(".bank-option-btn");
      for (var i = 0; i < all.length; i++) {
        all[i].classList.toggle("active", all[i] === btn);
      }
      syncPaymentMethodUi();
    });
  }

  var emiContainer = document.getElementById("checkout-emi-plans");
  if (emiContainer) {
    emiContainer.addEventListener("click", function (e) {
      var btn = e.target.closest(".emi-plan-card");
      if (!btn) return;
      activeEmiMonths = Number(btn.getAttribute("data-emi-months")) || 3;
      syncPaymentMethodUi();
    });
  }
}

function openCheckoutModal() {
  var totals = computeTotals();
  if (totals.count === 0) return;

  wireUpPaymentGatewayUi();
  renderCheckoutItemsPreview(totals);

  checkoutNameEl.value = me ? me.name : "Harish";
  if (!checkoutAddressEl.value.trim()) {
    checkoutAddressEl.value = "42 Circuit Lane, Silicon Bay";
  }
  if (!checkoutCardNumEl.value.trim()) {
    checkoutCardNumEl.value = "4242 4242 4242 4242";
  }
  if (!checkoutExpiryEl.value.trim()) {
    checkoutExpiryEl.value = "08/29";
  }
  if (!checkoutCvvEl.value.trim()) {
    checkoutCvvEl.value = "842";
  }
  checkoutMsgEl.hidden = true;
  checkoutPayEl.disabled = false;
  stopUpiOverlayCountdown();
  var upiOverlayEl = document.getElementById("upi-qr-overlay");
  if (upiOverlayEl) upiOverlayEl.hidden = true;
  var printSummaryViewEl = document.getElementById("checkout-print-summary-view");
  if (printSummaryViewEl) printSummaryViewEl.hidden = true;
  document.body.classList.remove("printing-checkout-summary");
  syncPaymentMethodUi();

  checkoutSuccessEl.hidden = true;
  checkoutFormEl.hidden = false;

  closeAllSheets();
  openModal(checkoutOverlayEl);
}

function payBtnLabel(total) {
  var methodSummary = getFormattedPaymentSummary();
  return icon("cart", 16) + " Pay $" + total.toFixed(2) + " via " + esc(methodSummary);
}

function showCheckoutMsg(text, isError) {
  checkoutMsgEl.textContent = text;
  checkoutMsgEl.className = isError ? "modal-msg error" : "modal-msg";
  checkoutMsgEl.hidden = false;
}


function payNow() {
  var name = checkoutNameEl.value.trim();
  var address = checkoutAddressEl.value.trim();
  var cardNumber = checkoutCardNumEl ? checkoutCardNumEl.value.trim() : "";
  var expiry = checkoutExpiryEl ? checkoutExpiryEl.value.trim() : "";
  var cvv = checkoutCvvEl ? checkoutCvvEl.value.trim() : "";

  if (!name || !address) {
    showCheckoutMsg("Add a recipient name and shipping address before paying.", true);
    return;
  }

  if (activePaymentMethod === "credit_card" || activePaymentMethod === "debit_card") {
    if (!cardNumber || !expiry || !cvv) {
      showCheckoutMsg("Fill in the card number, expiry, and CVV fields (or tap a network chip above).", true);
      return;
    }
  } else if (activePaymentMethod === "upi" && activeUpiMode === "vpa") {
    var upiInput = document.getElementById("checkout-upi-id");
    var upiVal = upiInput ? upiInput.value.trim() : "";
    if (!upiVal || upiVal.indexOf("@") === -1) {
      showCheckoutMsg("Enter a valid UPI ID (e.g. harish@okaxis) or switch to Scan UPI QR.", true);
      return;
    }
  }

  var chosenPaymentSummary = getFormattedPaymentSummary();

  checkoutMsgEl.hidden = true;
  checkoutPayEl.disabled = true;
  checkoutPayEl.innerHTML = '<span class="btn-spinner"></span> Authorizing ' + esc(chosenPaymentSummary) + '…';
  clearTimeout(saveTimer);

  Promise.all([
    api("/api/cart", { method: "PUT", body: JSON.stringify(cart) })
      .then(function () {
        return api("/api/checkout", {
          method: "POST",
          body: JSON.stringify({
            shippingName: name,
            shippingAddress: address,
            promoCode: activePromoCode,
            paymentMethod: chosenPaymentSummary,
            paymentDetails: {
              method: activePaymentMethod,
              upiApp: activeUpiApp,
              upiMode: activeUpiMode,
              upiId: (document.getElementById("checkout-upi-id") || {}).value || "harish@okaxis",
              cardNumber: cardNumber,
              cardNetwork: activeCardNetwork,
              bankName: activeNetbank,
              emiMonths: activeEmiMonths
            }
          })
        });
      })
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data: data }; });
      }),
    new Promise(function (resolve) { setTimeout(resolve, 650); })
  ])
    .then(function (results) {
      var result = results[0];
      if (!result.ok) {
        recalc();
        showCheckoutMsg((result.data && result.data.message) || "Couldn't check out.", true);
        checkoutPayEl.disabled = false;
        checkoutPayEl.innerHTML = payBtnLabel(computeTotals().total);
        return;
      }

      cart = {};
      fetchProducts();

      me.orderCount++;
      paintHistoryCount(me.orderCount);
      collapseHistory();

      stopUpiOverlayCountdown();
      var upiOverlayEl = document.getElementById("upi-qr-overlay");
      if (upiOverlayEl) upiOverlayEl.hidden = true;
      checkoutFormEl.hidden = true;
      checkoutSuccessEl.hidden = false;
      triggerPhysicsConfirmation(result.data);
    })
    .catch(function () {
      recalc();
      showCheckoutMsg("Can't reach the server — is it still running?", true);
      checkoutPayEl.disabled = false;
      checkoutPayEl.innerHTML = payBtnLabel(computeTotals().total);
    });
}

// ── Physics-Based Checkout Confirmation & Spring Dynamics ──
var physicsAudioCtx = null;
var autoReceiptTimer = null;

function playPaymentSuccessChime() {
  try {
    if (!physicsAudioCtx) {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) physicsAudioCtx = new AudioCtx();
    }
    if (physicsAudioCtx && physicsAudioCtx.state !== "suspended") {
      var now = physicsAudioCtx.currentTime;

      // Tone 1: 523.25 Hz (C5)
      var osc1 = physicsAudioCtx.createOscillator();
      var gain1 = physicsAudioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc1.connect(gain1);
      gain1.connect(physicsAudioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.26);

      // Tone 2: 659.25 Hz (E5) harmonic chime
      var osc2 = physicsAudioCtx.createOscillator();
      var gain2 = physicsAudioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659.25, now + 0.1);
      gain2.gain.setValueAtTime(0.25, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(physicsAudioCtx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.45);
    }
    if (navigator.vibrate) navigator.vibrate([50, 40, 80]);
  } catch (e) {}
}

function spawnPhysicsConfetti() {
  var container = document.getElementById("physics-particle-field");
  if (!container) return;
  container.innerHTML = "";
  var colors = ["#10b981", "#3b82f6", "#f59e0b", "#a855f7", "#38bdf8", "#ffd23f", "#34d399"];
  var count = 34;

  for (var i = 0; i < count; i++) {
    var spark = document.createElement("div");
    spark.className = "physics-spark";
    var angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
    var dist = 90 + Math.random() * 110;
    var tx = Math.cos(angle) * dist;
    var ty = Math.sin(angle) * dist + (Math.random() * 30 + 10);
    var rot = (Math.random() * 720 - 360) + "deg";
    var color = colors[Math.floor(Math.random() * colors.length)];
    var size = Math.floor(Math.random() * 5 + 5);

    spark.style.setProperty("--tx", tx.toFixed(1) + "px");
    spark.style.setProperty("--ty", ty.toFixed(1) + "px");
    spark.style.setProperty("--rot", rot);
    spark.style.backgroundColor = color;
    spark.style.width = size + "px";
    spark.style.height = size + "px";
    spark.style.borderRadius = Math.random() > 0.4 ? "50%" : "2px";
    spark.style.left = "calc(50% - " + (size / 2) + "px)";
    spark.style.top = "72px";

    container.appendChild(spark);
  }
}

function triggerPhysicsConfirmation(order) {
  var successEl = document.getElementById("checkout-success");
  if (!successEl) return;

  var orderIdEl = document.getElementById("pay-success-order-id");
  var amountEl = document.getElementById("pay-success-amount");
  var railEl = document.getElementById("pay-success-rail");
  var traceEl = document.getElementById("pay-success-trace");

  if (orderIdEl) orderIdEl.textContent = order.id || "VB-0000";
  if (amountEl) amountEl.textContent = "$" + (order.total || 0).toFixed(2);
  if (railEl) railEl.textContent = order.paymentMethod || "Instant Settlement";
  if (traceEl) traceEl.textContent = "req-" + Math.random().toString(36).substring(2, 9);

  // Play harmonic chime & scatter micro-spark particles
  playPaymentSuccessChime();
  spawnPhysicsConfetti();

  var springBadge = document.getElementById("pay-spring-badge");
  if (springBadge) {
    springBadge.style.animation = "none";
    void springBadge.offsetWidth;
    springBadge.style.animation = "";
  }

  var viewBillBtn = document.getElementById("pay-success-view-bill-btn");
  if (viewBillBtn) {
    viewBillBtn.onclick = function () {
      clearTimeout(autoReceiptTimer);
      closeModal(checkoutOverlayEl);
      showReceipt(order);
    };
  }

  // Smooth auto-transition into thermal receipt after 1.8s
  clearTimeout(autoReceiptTimer);
  autoReceiptTimer = setTimeout(function () {
    closeModal(checkoutOverlayEl);
    showReceipt(order);
  }, 1800);
}

// ── Side-by-Side Product Comparison Controller ──
var compareIds = [];
var compareHighlightDiffs = false;

function isProductInCompare(id) {
  return compareIds.indexOf(Number(id)) !== -1;
}

function toggleCompareItem(id) {
  var numId = Number(id);
  var idx = compareIds.indexOf(numId);
  if (idx !== -1) {
    compareIds.splice(idx, 1);
    showActivityToast("Removed item from comparison.");
  } else {
    if (compareIds.length >= 4) {
      showActivityToast("You can compare up to 4 components side-by-side. Remove one first.");
      return;
    }
    compareIds.push(numId);
    var p = findProductById(numId);
    showActivityToast("Added " + (p ? p.title : "part") + " to comparison.");
  }
  updateCompareUI();
}

function clearComparison() {
  compareIds = [];
  updateCompareUI();
  var tableContainer = document.getElementById("compare-table-container");
  if (tableContainer) {
    tableContainer.innerHTML =
      '<div class="compare-empty-state">' +
        '<span data-icon="sliders" data-icon-size="32" class="compare-empty-icon"></span>' +
        '<p class="compare-empty-text">No components selected for comparison.<br/><small>Select 2 to 4 components from the catalog to compare specs side-by-side.</small></p>' +
        '<button type="button" class="sheet-btn small solid" onclick="closeComparisonModal()">Browse Hardware Catalog</button>' +
      '</div>';
  }
  showActivityToast("Comparison list cleared.");
}

function openComparisonModal() {
  var overlay = document.getElementById("compare-overlay");
  if (!overlay) return;
  openModal(overlay);
  populateCompareAddSelect();
  renderComparisonTable();
}

function closeComparisonModal() {
  var overlay = document.getElementById("compare-overlay");
  if (!overlay) return;
  closeModal(overlay);
}

function populateCompareAddSelect() {
  var sel = document.getElementById("compare-add-part-select");
  if (!sel) return;
  var html = '<option value="">+ Add Component to Matrix…</option>';
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    if (!isProductInCompare(p.id)) {
      html += '<option value="' + p.id + '">' + esc(p.title) + ' ($' + p.price.toFixed(2) + ')</option>';
    }
  }
  sel.innerHTML = html;
}

function addAllComparedToCart() {
  if (compareIds.length === 0) return;
  var addedCount = 0;
  for (var i = 0; i < compareIds.length; i++) {
    var pid = compareIds[i];
    cart[pid] = (cart[pid] || 0) + 1;
    addedCount++;
  }
  recalc();
  saveCartRemote();
  renderComparisonTable();
  showActivityToast("Added " + addedCount + " compared items to cart!");
}

function updateCompareUI() {
  // 1. Sync card buttons
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var isComp = isProductInCompare(p.id);
    var cardBtn = document.getElementById("card-compare-btn-" + p.id);
    var cardArticle = document.getElementById("card-" + p.id);
    if (cardBtn) {
      if (isComp) {
        cardBtn.classList.add("active");
        cardBtn.setAttribute("aria-pressed", "true");
        cardBtn.innerHTML = icon("check", 13) + ' <span>Comparing</span>';
      } else {
        cardBtn.classList.remove("active");
        cardBtn.setAttribute("aria-pressed", "false");
        cardBtn.innerHTML = icon("sliders", 13) + ' <span>Compare</span>';
      }
    }
    if (cardArticle) {
      if (isComp) cardArticle.classList.add("in-compare");
      else cardArticle.classList.remove("in-compare");
    }
  }

  // 2. Sync spec drawer compare button
  if (activeSpecProductId) {
    var specCompBtn = document.getElementById("spec-compare-btn");
    if (specCompBtn) {
      var isCompSpec = isProductInCompare(activeSpecProductId);
      if (isCompSpec) {
        specCompBtn.classList.add("active");
        specCompBtn.innerHTML = icon("check", 14) + ' <span>Comparing</span>';
      } else {
        specCompBtn.classList.remove("active");
        specCompBtn.innerHTML = icon("sliders", 14) + ' <span>Compare</span>';
      }
    }
  }

  // 3. Topbar compare count badge
  var topBadge = document.getElementById("compare-badge");
  if (topBadge) {
    topBadge.textContent = String(compareIds.length);
    topBadge.hidden = compareIds.length === 0;
  }

  // 4. Floating Comparison Dock
  var dock = document.getElementById("compare-dock");
  var dockCount = document.getElementById("compare-dock-count");
  var dockThumbs = document.getElementById("compare-dock-thumbnails");
  var dockLaunchText = document.getElementById("compare-dock-launch-text");

  if (dock) {
    if (compareIds.length > 0) {
      dock.hidden = false;
      dock.classList.add("open");
      if (dockCount) dockCount.textContent = compareIds.length + "/4 selected";
      if (dockLaunchText) dockLaunchText.textContent = "Compare (" + compareIds.length + ")";
      if (dockThumbs) {
        dockThumbs.innerHTML = compareIds.map(function (cid) {
          var cp = findProductById(cid);
          if (!cp) return "";
          var img = (cp.image && (cp.image.indexOf("http") === 0 || cp.image.indexOf("/") === 0)) ? cp.image : tileFor(cp.category);
          return '<div class="compare-thumb-chip" title="' + esc(cp.title) + '">' +
            '<img src="' + esc(img) + '" alt="' + esc(cp.title) + '" />' +
            '<button type="button" class="compare-thumb-remove" onclick="event.stopPropagation(); toggleCompareItem(' + cp.id + ')" aria-label="Remove ' + esc(cp.title) + '">×</button>' +
          '</div>';
        }).join("");
      }
    } else {
      dock.hidden = true;
      dock.classList.remove("open");
    }
  }

  populateCompareAddSelect();
  syncCompareAllVisibleButtonUI();

  // 5. If modal is open, refresh comparative table
  var modalOverlay = document.getElementById("compare-overlay");
  if (modalOverlay && modalOverlay.classList.contains("open")) {
    renderComparisonTable();
  }
}

function getVisibleCatalogProductIds() {
  var visibleIds = [];
  if (!gridEl) return visibleIds;
  var cards = gridEl.querySelectorAll(".card");
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    if (card.style.display === "none" || card.hidden) continue;
    var idStr = (card.id || "").replace(/^card-/, "");
    var pid = Number(idStr);
    if (pid > 0 && visibleIds.indexOf(pid) === -1) {
      visibleIds.push(pid);
    }
  }
  return visibleIds;
}

function syncCompareAllVisibleButtonUI() {
  var btn = document.getElementById("compare-all-visible-btn");
  var labelEl = document.getElementById("compare-all-visible-label");
  var badgeEl = document.getElementById("compare-all-visible-badge");
  if (!btn) return;

  var visibleIds = getVisibleCatalogProductIds();
  var state;
  if (window.VoltboxQR && typeof window.VoltboxQR.getCompareAllVisibleButtonState === "function") {
    state = window.VoltboxQR.getCompareAllVisibleButtonState(visibleIds, compareIds, 4);
  } else {
    var vCount = visibleIds.length;
    var elig = Math.min(vCount, 4);
    var slice = visibleIds.slice(0, 4);
    var allIn = slice.length > 0 && slice.every(function (id) { return compareIds.indexOf(id) !== -1; });
    state = {
      visibleCount: vCount,
      eligibleCount: elig,
      maxLimit: 4,
      disabled: vCount === 0,
      isAllCompared: allIn,
      labelText: allIn ? "Comparing Visible" : "Compare All Visible",
      badgeText: vCount > 4 ? (elig + "/4") : String(elig),
      ariaLabel: vCount === 0
        ? "Compare all visible products (no visible products)"
        : (allIn
          ? ("All " + elig + " visible products are in comparison — click to view matrix")
          : ("Compare all visible products (adds up to " + elig + " of " + vCount + " filtered components)"))
    };
  }

  btn.disabled = state.disabled;
  btn.classList.toggle("active", state.isAllCompared);
  btn.setAttribute("aria-pressed", state.isAllCompared ? "true" : "false");
  btn.setAttribute("aria-label", state.ariaLabel);
  if (labelEl) labelEl.textContent = state.labelText;
  if (badgeEl) badgeEl.textContent = state.badgeText;
}

function compareAllVisibleProducts() {
  var visibleIds = getVisibleCatalogProductIds();
  var res;
  if (window.VoltboxQR && typeof window.VoltboxQR.selectVisibleProductsForComparison === "function") {
    res = window.VoltboxQR.selectVisibleProductsForComparison(visibleIds, compareIds, 4);
  } else {
    var vCount = visibleIds.length;
    var slice = visibleIds.slice(0, 4);
    if (vCount === 0) {
      showActivityToast("No visible components match current filters to compare.");
      return;
    }
    var allIn = slice.length > 0 && slice.every(function (id) { return compareIds.indexOf(id) !== -1; });
    if (allIn) {
      openComparisonModal();
      return;
    }
    var next = compareIds.length < 4 ? compareIds.slice() : [];
    for (var i = 0; i < visibleIds.length; i++) {
      if (next.length >= 4) break;
      if (next.indexOf(visibleIds[i]) === -1) next.push(visibleIds[i]);
    }
    res = {
      visibleCount: vCount,
      nextCompareIds: next,
      allVisibleAlreadyCompared: false,
      toastMessage: "Added visible components to comparison (" + next.length + "/4 selected)."
    };
  }

  if (res.visibleCount === 0) {
    showActivityToast(res.toastMessage);
    return;
  }

  if (res.allVisibleAlreadyCompared) {
    openComparisonModal();
    showActivityToast(res.toastMessage);
    return;
  }

  compareIds = res.nextCompareIds.slice(0, 4);
  updateCompareUI();
  showActivityToast(res.toastMessage);
}

function parseComparePowerWatts(powerDraw) {
  var text = String(powerDraw || "").trim();
  var wattMatch = text.match(/(\d+(?:\.\d+)?)\s*W\b/i);
  if (wattMatch) return parseFloat(wattMatch[1]);
  if (/mAh/i.test(text)) return 8;
  if (/Hour/i.test(text)) return 10;
  if (/24-Pin\s*ATX/i.test(text)) return 45;
  return 65;
}

function scoreCompareInterface(interfaceSpec) {
  var text = String(interfaceSpec || "").toLowerCase();
  if (text.indexOf("pcie 5.0") !== -1 || text.indexOf("gen5") !== -1) return 100;
  if (text.indexOf("7,450 mb/s") !== -1 || text.indexOf("nvme 2.0") !== -1 || text.indexOf("pcie gen4") !== -1) return 92;
  if (text.indexOf("ddr5-6400") !== -1 || text.indexOf("socket am5") !== -1) return 88;
  if (text.indexOf("hdmi 2.1") !== -1 || text.indexOf("wi-fi 7") !== -1) return 84;
  if (text.indexOf("pcie 4.0") !== -1) return 78;
  if (text.indexOf("bluetooth 5.3") !== -1) return 72;
  if (text.indexOf("bluetooth 5.1") !== -1) return 66;
  if (text.indexOf("sata iii") !== -1 || text.indexOf("6.0 gb/s") !== -1) return 50;
  return 70;
}

function scoreCompareArchitecture(arch) {
  var text = String(arch || "").toLowerCase();
  if (text.indexOf("blackwell") !== -1 || text.indexOf("gddr7") !== -1) return 98;
  if (text.indexOf("zen 5") !== -1 || text.indexOf("16-core") !== -1) return 95;
  if (text.indexOf("duet rail vrm") !== -1 || text.indexOf("server pcb") !== -1) return 90;
  if (text.indexOf("rdna 3.5") !== -1 || text.indexOf("ray-tracing") !== -1) return 88;
  if (text.indexOf("3d tlc nand") !== -1 || text.indexOf("dram cache") !== -1) return 85;
  if (text.indexOf("neodymium") !== -1 || text.indexOf("dsp") !== -1) return 80;
  if (text.indexOf("dual-actuator") !== -1 || text.indexOf("haptic") !== -1) return 76;
  if (text.indexOf("7200 rpm") !== -1 || text.indexOf("cmr") !== -1) return 62;
  return 74;
}

function scoreCompareWarranty(warranty) {
  var text = String(warranty || "");
  var yearMatch = text.match(/(\d+)\s*-?\s*Year/i);
  var score = yearMatch ? parseInt(yearMatch[1], 10) * 10 : 20;
  if (/bench verified|endurance|bios protection/i.test(text)) {
    score += 3;
  }
  return score;
}

function evaluateCompareRow(compProducts, scoreFn, higherIsBetter, betterLabel, worseLabel) {
  var statusById = {};
  var labelById = {};
  if (!compProducts || compProducts.length === 0) {
    return { statusById: statusById, labelById: labelById };
  }
  var scores = [];
  for (var i = 0; i < compProducts.length; i++) {
    var p = compProducts[i];
    var s = Number(scoreFn(p));
    scores.push({ id: p.id, score: s });
    statusById[p.id] = "neutral";
    labelById[p.id] = "";
  }
  if (compProducts.length < 2) {
    return { statusById: statusById, labelById: labelById };
  }
  var minVal = scores[0].score;
  var maxVal = scores[0].score;
  for (var j = 1; j < scores.length; j++) {
    if (scores[j].score < minVal) minVal = scores[j].score;
    if (scores[j].score > maxVal) maxVal = scores[j].score;
  }
  if (minVal < maxVal) {
    var bestTarget = higherIsBetter ? maxVal : minVal;
    var worstTarget = higherIsBetter ? minVal : maxVal;
    for (var k = 0; k < scores.length; k++) {
      if (scores[k].score === bestTarget) {
        statusById[scores[k].id] = "better";
        labelById[scores[k].id] = betterLabel;
      } else if (scores[k].score === worstTarget) {
        statusById[scores[k].id] = "worse";
        labelById[scores[k].id] = worseLabel;
      }
    }
  }
  return { statusById: statusById, labelById: labelById };
}

function renderSpecIndicatorBadge(status, label) {
  if (status === "better") {
    return ' <span class="compare-spec-indicator better" data-indicator="better"><span class="compare-ind-arrow" aria-hidden="true">▲</span> ' + esc(label || "Better") + '</span>';
  }
  if (status === "worse") {
    return ' <span class="compare-spec-indicator worse" data-indicator="worse"><span class="compare-ind-arrow" aria-hidden="true">▼</span> ' + esc(label || "Worse") + '</span>';
  }
  return "";
}

function renderComparisonTable() {
  var container = document.getElementById("compare-table-container");
  var countTag = document.getElementById("compare-modal-count-tag");
  var summaryText = document.getElementById("compare-summary-text");
  var addAllBtn = document.getElementById("compare-add-all-cart-btn");

  if (!container) return;

  if (countTag) {
    countTag.textContent = compareIds.length === 1 ? "1 Component Selected" : (compareIds.length + " Components Selected");
  }

  if (compareIds.length === 0) {
    if (addAllBtn) addAllBtn.disabled = true;
    if (summaryText) summaryText.textContent = "Select 2 or more components from the catalog to analyze side-by-side specifications.";
    container.innerHTML =
      '<div class="compare-empty-state">' +
        '<div class="compare-empty-icon">' + icon("sliders", 36) + '</div>' +
        '<p class="compare-empty-text">No components selected for comparison.<br/><small>Click "Compare" on any 2–4 hardware items in the catalog to generate a side-by-side benchmark matrix.</small></p>' +
        '<button type="button" class="sheet-btn small solid" onclick="closeComparisonModal()">Browse Catalog</button>' +
      '</div>';
    return;
  }

  var compProducts = [];
  for (var i = 0; i < compareIds.length; i++) {
    var item = findProductById(compareIds[i]);
    if (item) compProducts.push(item);
  }

  if (addAllBtn) addAllBtn.disabled = false;

  // Identify lowest price item and price spread
  var lowestP = compProducts[0];
  var highestP = compProducts[0];
  for (var j = 0; j < compProducts.length; j++) {
    var cur = compProducts[j];
    if (cur.price < lowestP.price) lowestP = cur;
    if (cur.price > highestP.price) highestP = cur;
  }
  var spread = highestP.price - lowestP.price;

  // Evaluate each comparable row for green (better) and red (worse) indicators
  var priceEval = evaluateCompareRow(compProducts, function (p) { return p.price; }, false, "Best Price", "Highest Cost");
  var historyEval = evaluateCompareRow(compProducts, function (p) {
    var h = getPriceHistoryFor(p);
    var prs = h.map(function (x) { return x.price; });
    return prs.reduce(function (a, b) { return a + b; }, 0) / prs.length;
  }, false, "Lowest 6M Avg", "Highest 6M Avg");
  var archEval = evaluateCompareRow(compProducts, function (p) {
    return scoreCompareArchitecture((p.specs && p.specs.architecture) || "Precision Solid-State");
  }, true, "Top Silicon Tier", "Lower Tier");
  var ifaceEval = evaluateCompareRow(compProducts, function (p) {
    return scoreCompareInterface((p.specs && p.specs.interfaceSpec) || "PCIe 4.0 / USB-C");
  }, true, "Faster Bus", "Slower Bus");
  var powerEval = evaluateCompareRow(compProducts, function (p) {
    return parseComparePowerWatts((p.specs && p.specs.powerDraw) || "65W Nominal");
  }, false, "Best Efficiency", "High Power Draw");
  var stockEval = evaluateCompareRow(compProducts, function (p) {
    return getEffectiveStock(p);
  }, true, "Best Availability", "Lowest Stock");
  var warrantyEval = evaluateCompareRow(compProducts, function (p) {
    return scoreCompareWarranty((p.specs && p.specs.warranty) || "3-Year Limited Hardware");
  }, true, "Best Coverage", "Shorter Coverage");

  // Construct Spec Attributes Matrix
  var specRows = [
    {
      key: "price",
      label: "Retail Price",
      evalResult: priceEval,
      values: compProducts.map(function (p) { return "$" + p.price.toFixed(2); }),
      isDiff: compProducts.some(function (p) { return p.price !== compProducts[0].price; }),
      renderCell: function (p, status, label) {
        return '<div class="compare-cell-content"><span class="compare-price-val">$' + p.price.toFixed(2) + '</span>' + renderSpecIndicatorBadge(status, label) + '</div>';
      }
    },
    {
      key: "history",
      label: "6-Month Low → Peak",
      evalResult: historyEval,
      values: compProducts.map(function (p) {
        var h = getPriceHistoryFor(p);
        var prs = h.map(function (x) { return x.price; });
        return "$" + Math.min.apply(null, prs).toFixed(0) + " – $" + Math.max.apply(null, prs).toFixed(0);
      }),
      isDiff: compProducts.some(function (p) { return p.price !== compProducts[0].price || p.id !== compProducts[0].id; }),
      renderCell: function (p, status, label) {
        var h = getPriceHistoryFor(p);
        var prs = h.map(function (x) { return x.price; });
        var minP = Math.min.apply(null, prs);
        var maxP = Math.max.apply(null, prs);
        var avgP = prs.reduce(function (a, b) { return a + b; }, 0) / prs.length;
        return '<div class="compare-cell-content"><div class="compare-stat-line"><span class="mono">$' + minP.toFixed(0) + ' – $' + maxP.toFixed(0) + '</span><span class="compare-sub-note">Avg: $' + avgP.toFixed(0) + '</span></div>' + renderSpecIndicatorBadge(status, label) + '</div>';
      }
    },
    {
      key: "group",
      label: "Category / Form Factor",
      evalResult: { statusById: {}, labelById: {} },
      values: compProducts.map(function (p) { return getComponentGroup(p).toUpperCase(); }),
      isDiff: compProducts.some(function (p) { return getComponentGroup(p) !== getComponentGroup(compProducts[0]); }),
      renderCell: function (p) {
        return '<div class="compare-cell-content"><span class="compare-category-tag">' + (p.specs && p.specs.groupLabel ? p.specs.groupLabel : getComponentGroup(p).toUpperCase()) + '</span></div>';
      }
    },
    {
      key: "architecture",
      label: "Silicon Architecture",
      evalResult: archEval,
      values: compProducts.map(function (p) { return (p.specs && p.specs.architecture) || "Solid-State Silicon"; }),
      isDiff: compProducts.some(function (p) { return (p.specs && p.specs.architecture) !== (compProducts[0].specs && compProducts[0].specs.architecture); }),
      renderCell: function (p, status, label) {
        return '<div class="compare-cell-content"><span>' + esc((p.specs && p.specs.architecture) || "Precision Solid-State") + '</span>' + renderSpecIndicatorBadge(status, label) + '</div>';
      }
    },
    {
      key: "interface",
      label: "Bus & Interface Spec",
      evalResult: ifaceEval,
      values: compProducts.map(function (p) { return (p.specs && p.specs.interfaceSpec) || "PCIe / USB-C"; }),
      isDiff: compProducts.some(function (p) { return (p.specs && p.specs.interfaceSpec) !== (compProducts[0].specs && compProducts[0].specs.interfaceSpec); }),
      renderCell: function (p, status, label) {
        return '<div class="compare-cell-content"><span>' + esc((p.specs && p.specs.interfaceSpec) || "PCIe 4.0 / USB-C") + '</span>' + renderSpecIndicatorBadge(status, label) + '</div>';
      }
    },
    {
      key: "power",
      label: "Thermal TDP & Power",
      evalResult: powerEval,
      values: compProducts.map(function (p) { return (p.specs && p.specs.powerDraw) || "65W Nominal"; }),
      isDiff: compProducts.some(function (p) { return (p.specs && p.specs.powerDraw) !== (compProducts[0].specs && compProducts[0].specs.powerDraw); }),
      renderCell: function (p, status, label) {
        return '<div class="compare-cell-content"><span class="compare-power-tag">' + esc((p.specs && p.specs.powerDraw) || "65W Nominal") + '</span>' + renderSpecIndicatorBadge(status, label) + '</div>';
      }
    },
    {
      key: "stock",
      label: "Warehouse Stock Status",
      evalResult: stockEval,
      values: compProducts.map(function (p) { return String(getEffectiveStock(p)); }),
      isDiff: compProducts.some(function (p) { return getEffectiveStock(p) !== getEffectiveStock(compProducts[0]); }),
      renderCell: function (p, status, label) {
        var s = getEffectiveStock(p);
        var isLow = isLowStockItem(p);
        return '<div class="compare-cell-content">' +
          '<span class="compare-stock-badge ' + (isLow ? 'low' : 'ok') + '">' + (isLow ? 'Low Stock (' + s + ')' : s + ' units') + '</span>' +
          renderSpecIndicatorBadge(status, label) +
        '</div>';
      }
    },
    {
      key: "warranty",
      label: "Warranty & Certification",
      evalResult: warrantyEval,
      values: compProducts.map(function (p) { return (p.specs && p.specs.warranty) || "3-Year Limited"; }),
      isDiff: compProducts.some(function (p) { return (p.specs && p.specs.warranty) !== (compProducts[0].specs && compProducts[0].specs.warranty); }),
      renderCell: function (p, status, label) {
        return '<div class="compare-cell-content"><span class="compare-warranty-val">' + icon("shield", 13) + ' ' + esc((p.specs && p.specs.warranty) || "3-Year Limited Hardware") + '</span>' + renderSpecIndicatorBadge(status, label) + '</div>';
      }
    }
  ];

  // Tally per-product better/worse counts
  var betterCountById = {};
  var worseCountById = {};
  for (var m = 0; m < compProducts.length; m++) {
    betterCountById[compProducts[m].id] = 0;
    worseCountById[compProducts[m].id] = 0;
  }
  for (var sr = 0; sr < specRows.length; sr++) {
    var ev = specRows[sr].evalResult;
    if (!ev || !ev.statusById) continue;
    for (var cpIdx = 0; cpIdx < compProducts.length; cpIdx++) {
      var pid = compProducts[cpIdx].id;
      if (ev.statusById[pid] === "better") betterCountById[pid]++;
      else if (ev.statusById[pid] === "worse") worseCountById[pid]++;
    }
  }

  if (summaryText) {
    if (compProducts.length === 1) {
      summaryText.textContent = "Selected " + compProducts[0].title + " ($" + compProducts[0].price.toFixed(2) + "). Add another component above to unlock green/red spec indicators.";
    } else {
      summaryText.textContent = "Comparing " + compProducts.length + " components. Lowest price: " + lowestP.title + " ($" + lowestP.price.toFixed(2) + (spread > 0 ? ", $" + spread.toFixed(2) + " spread" : "") + "). Green highlights the best value per row; red marks the weakest.";
    }
  }

  // Render Table Markup
  var tableHtml = '<table class="compare-table" role="grid" aria-label="Product comparison table">';
  
  // Sticky Table Header with Products
  tableHtml += '<thead><tr>';
  tableHtml += '<th class="compare-sticky-th" scope="col"><span class="compare-attr-heading">Hardware Spec</span></th>';
  for (var k = 0; k < compProducts.length; k++) {
    var prod = compProducts[k];
    var pImg = (prod.image && (prod.image.indexOf("http") === 0 || prod.image.indexOf("/") === 0)) ? prod.image : tileFor(prod.category);
    var pSku = getSkuFor(prod);
    var inCartQty = cart[prod.id] || 0;
    var bCount = betterCountById[prod.id] || 0;
    var wCount = worseCountById[prod.id] || 0;
    tableHtml += '<th class="compare-product-th" scope="col">';
    tableHtml +=   '<div class="compare-card-head">';
    tableHtml +=     '<button type="button" class="compare-remove-col-btn" onclick="toggleCompareItem(' + prod.id + ')" title="Remove ' + esc(prod.title) + ' from matrix" aria-label="Remove ' + esc(prod.title) + '">×</button>';
    tableHtml +=     '<div class="compare-img-box" onclick="openSpecDrawer(' + prod.id + ')">';
    tableHtml +=       '<img src="' + esc(pImg) + '" alt="' + esc(prod.title) + '" loading="lazy" />';
    tableHtml +=     '</div>';
    tableHtml +=     '<span class="compare-col-sku">' + esc(pSku) + '</span>';
    tableHtml +=     '<h4 class="compare-col-title" onclick="openSpecDrawer(' + prod.id + ')">' + esc(prod.title) + '</h4>';
    if (compProducts.length >= 2) {
      tableHtml +=   '<div class="compare-scorecard-row" aria-label="Spec comparison score">';
      tableHtml +=     '<span class="compare-score-chip better" title="Wins ' + bCount + ' spec rows">▲ ' + bCount + ' Better</span>';
      tableHtml +=     '<span class="compare-score-chip worse" title="Trails in ' + wCount + ' spec rows">▼ ' + wCount + ' Worse</span>';
      tableHtml +=   '</div>';
    }
    tableHtml +=     '<div class="compare-col-actions">';
    tableHtml +=       '<button type="button" class="compare-cart-btn" onclick="inc(' + prod.id + '); renderComparisonTable();">';
    tableHtml +=         icon("cart", 13) + ' <span>' + (inCartQty > 0 ? ('In Cart (' + inCartQty + ')') : 'Add to Cart') + '</span>';
    tableHtml +=       '</button>';
    tableHtml +=     '</div>';
    tableHtml +=   '</div>';
    tableHtml += '</th>';
  }
  tableHtml += '</tr></thead>';

  // Table Body Rows
  tableHtml += '<tbody>';
  for (var r = 0; r < specRows.length; r++) {
    var row = specRows[r];
    var isDiff = row.isDiff;
    if (compareHighlightDiffs && !isDiff) {
      continue; // Skip identical rows when Highlight Differences Only is active
    }
    tableHtml += '<tr class="compare-row' + (isDiff ? ' row-has-diff' : ' row-identical') + '">';
    tableHtml +=   '<th class="compare-sticky-td" scope="row">';
    tableHtml +=     '<span class="compare-row-label">' + esc(row.label) + '</span>';
    if (isDiff) {
      tableHtml +=   '<span class="compare-diff-tag">Diff</span>';
    }
    tableHtml +=   '</th>';
    for (var col = 0; col < compProducts.length; col++) {
      var colProd = compProducts[col];
      var cellStatus = (row.evalResult && row.evalResult.statusById && row.evalResult.statusById[colProd.id]) || "neutral";
      var cellLabel = (row.evalResult && row.evalResult.labelById && row.evalResult.labelById[colProd.id]) || "";
      var cellClass = "compare-cell" + (cellStatus === "better" ? " is-better" : (cellStatus === "worse" ? " is-worse" : ""));
      tableHtml += '<td class="' + cellClass + '" data-spec-status="' + cellStatus + '">';
      tableHtml +=   row.renderCell(colProd, cellStatus, cellLabel);
      tableHtml += '</td>';
    }
    tableHtml += '</tr>';
  }
  tableHtml += '</tbody>';
  tableHtml += '</table>';

  container.innerHTML = tableHtml;
}


function showReceipt(order) {
  shownOrder = order;
  receiptBodyEl.innerHTML = buildReceiptHTML(order);

  receiptMsgEl.hidden = true;
  receiptEmailEl.disabled = false;
  receiptEmailEl.innerHTML = emailBtnLabel();

  if (receiptPaperEl) {
    receiptPaperEl.classList.remove("thermal-feed");
    void receiptPaperEl.offsetWidth;
    receiptPaperEl.classList.add("thermal-feed");
  }

  overlayEl.classList.add("open");
  overlayEl.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
}

function closeReceipt() {
  overlayEl.classList.remove("open");
  overlayEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
  shownOrder = null;
}

function emailCurrentBill() {
  if (!shownOrder) return;

  receiptEmailEl.disabled = true;
  receiptEmailEl.textContent = "Sending…";
  receiptMsgEl.hidden = true;

  api("/api/orders/" + shownOrder.id + "/email", { method: "POST" })
    .then(function (res) {
      return res.json().then(function (data) { return { ok: res.ok, data: data }; });
    })
    .then(function (result) {
      if (result.ok) {
        receiptEmailEl.disabled = true;
        receiptEmailEl.innerHTML = icon("check", 16) + " Sent";
        showReceiptMsg("Bill sent to " + result.data.sentTo, false);
      } else {
        receiptEmailEl.disabled = false;
        receiptEmailEl.innerHTML = emailBtnLabel();
        showReceiptMsg(result.data.message || "Couldn't send it.", true);
      }
    })
    .catch(function () {
      receiptEmailEl.disabled = false;
      receiptEmailEl.innerHTML = emailBtnLabel();
      showReceiptMsg("Can't reach the server.", true);
    });
}

function emailBtnLabel() {
  return icon("mail", 16) + " Email me this bill";
}

function showReceiptMsg(text, isError) {
  receiptMsgEl.textContent = text;
  receiptMsgEl.className = isError ? "receipt-msg error" : "receipt-msg";
  receiptMsgEl.hidden = false;
}

// Downloadable PNG Receipt generator
function downloadReceiptPng() {
  if (!shownOrder) return;
  var order = shownOrder;
  var canvas = document.createElement("canvas");
  var lineCount = (order.lines || []).length;
  var height = 430 + lineCount * 42;
  canvas.width = 640;
  canvas.height = height;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Thermal cream paper background
  ctx.fillStyle = "#f6f2e9";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#1c1a17";
  ctx.textAlign = "center";
  ctx.font = "bold 36px JetBrains Mono, monospace";
  ctx.fillText(STORE.name, 320, 56);
  ctx.font = "14px JetBrains Mono, monospace";
  ctx.fillText(STORE.tagline, 320, 80);
  ctx.fillText(STORE.address + " · " + STORE.phone, 320, 102);

  ctx.strokeStyle = "#1c1a17";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 120);
  ctx.lineTo(600, 120);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.font = "14px JetBrains Mono, monospace";
  var when = new Date(order.placedAt);
  ctx.fillText("ORDER: " + order.id, 40, 148);
  ctx.textAlign = "right";
  ctx.fillText(formatDate(when) + " " + formatTime(when), 600, 148);

  var y = 185;
  for (var i = 0; i < lineCount; i++) {
    var ln = order.lines[i];
    ctx.textAlign = "left";
    ctx.font = "bold 14px JetBrains Mono, monospace";
    ctx.fillText(ln.title.substring(0, 32), 40, y);
    ctx.font = "13px JetBrains Mono, monospace";
    ctx.fillText(ln.qty + " x $" + ln.price.toFixed(2), 40, y + 18);
    ctx.textAlign = "right";
    ctx.fillText("$" + round(ln.qty * ln.price).toFixed(2), 600, y + 10);
    y += 42;
  }

  y += 10;
  ctx.beginPath();
  ctx.moveTo(40, y);
  ctx.lineTo(600, y);
  ctx.stroke();
  y += 28;

  ctx.textAlign = "left";
  ctx.fillText("SUBTOTAL", 40, y);
  ctx.textAlign = "right";
  ctx.fillText("$" + order.subtotal.toFixed(2), 600, y);

  if (order.discountTotal && order.discountTotal > 0) {
    y += 22;
    ctx.textAlign = "left";
    ctx.fillText("DISCOUNT", 40, y);
    ctx.textAlign = "right";
    ctx.fillText("-$" + order.discountTotal.toFixed(2), 600, y);
  }

  y += 22;
  ctx.textAlign = "left";
  ctx.fillText("TAX (8.25%)", 40, y);
  ctx.textAlign = "right";
  ctx.fillText("$" + order.tax.toFixed(2), 600, y);

  y += 32;
  ctx.font = "bold 22px JetBrains Mono, monospace";
  ctx.textAlign = "left";
  ctx.fillText("TOTAL", 40, y);
  ctx.textAlign = "right";
  ctx.fillText("$" + order.total.toFixed(2), 600, y);

  y += 38;
  ctx.textAlign = "center";
  ctx.font = "bold 13px JetBrains Mono, monospace";
  ctx.fillText("*** THANK YOU FOR SUPPORTING VOLTBOX ***", 320, y);

  // Draw encoded Code-39 barcode for order.id onto the PNG canvas
  var code39 = encodeReceiptCode39(order.id);
  var bcScale = Math.min(2.2, 460 / code39.totalWidth);
  var bcDrawWidth = code39.totalWidth * bcScale;
  var bcStartX = Math.round((640 - bcDrawWidth) / 2);
  y += 18;
  ctx.fillStyle = "#1c1a17";
  for (var b = 0; b < code39.bars.length; b++) {
    var bar = code39.bars[b];
    ctx.fillRect(bcStartX + bar.x * bcScale, y, Math.max(1, bar.width * bcScale), bar.height);
  }
  y += 56;
  ctx.font = "bold 12px JetBrains Mono, monospace";
  ctx.fillText(code39.encodedValue + "  ·  RECEIPT ID: " + order.id, 320, y);

  var link = document.createElement("a");
  link.download = "voltbox-receipt-" + order.id + ".png";
  link.href = canvas.toDataURL("image/png");
  link.click();
  showReceiptMsg("Downloaded voltbox-receipt-" + order.id + ".png", false);
}

function buildReceiptHTML(order) {
  var when = new Date(order.placedAt);

  var rows = "";
  for (var i = 0; i < order.lines.length; i++) {
    var line = order.lines[i];
    var lineTotal = round(line.price * line.qty);
    var lineProduct = (typeof findProductById === "function") ? findProductById(line.productId) : null;
    var thumb = getProductImageUrl(lineProduct || line);
    var fallbackCat = (lineProduct && lineProduct.category) ? lineProduct.category : "components";

    rows +=
      '<div class="r-item">' +
        '<img class="r-thumb" src="' + esc(thumb) + '" alt="' + esc(line.title) + '" ' +
             'onerror="this.onerror=null;this.src=\'' + tileFor(fallbackCat) + '\'" />' +
        '<div class="r-item-main">' +
          '<div class="r-item-name">' + esc(line.title) + '</div>' +
          '<div class="r-item-calc">' +
            line.qty + ' × $' + line.price.toFixed(2) +
            '<span class="r-item-line">$' + lineTotal.toFixed(2) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  var discountRows = "";
  if (order.rigDiscount && order.rigDiscount > 0) {
    discountRows += '<div class="r-tot"><span>RIG BUNDLE (5%)</span><span>−$' + order.rigDiscount.toFixed(2) + '</span></div>';
  }
  if (order.promoDiscount && order.promoDiscount > 0) {
    discountRows += '<div class="r-tot"><span>PROMO (' + esc(order.promoCode || "CODE") + ')</span><span>−$' + order.promoDiscount.toFixed(2) + '</span></div>';
  }

  return '' +
    '<div class="r-head">' +
      '<div class="r-bolt"><svg width="26" height="26" viewBox="0 0 24 24"><path fill="#1c1a17" d="M13 2 3 14h7l-1 8 10-12h-7z"/></svg></div>' +
      '<div class="r-store">' + STORE.name + '</div>' +
      '<div class="r-tagline">' + STORE.tagline + '</div>' +
      '<div class="r-meta">' + STORE.address + '</div>' +
      '<div class="r-meta">' + STORE.phone + '</div>' +
    '</div>' +

    '<div class="r-rule"></div>' +

    '<div class="r-info">' +
      '<span>ORDER ' + esc(order.id) + '</span>' +
      '<span>' + formatDate(when) + '</span>' +
    '</div>' +
    '<div class="r-info">' +
      '<span>CASHIER: ' + esc(me ? me.name : "SELF") + '</span>' +
      '<span>' + formatTime(when) + '</span>' +
    '</div>' +

    (order.shippingName
      ? '<div class="r-ship">SHIP TO: ' + esc(order.shippingName) + ' — ' + esc(order.shippingAddress) + '</div>'
      : '') +

    '<div class="r-rule dashed"></div>' +
    rows +
    '<div class="r-rule dashed"></div>' +

    '<div class="r-tot"><span>SUBTOTAL</span><span>$' + order.subtotal.toFixed(2) + '</span></div>' +
    discountRows +
    '<div class="r-tot"><span>TAX (8.25%)</span><span>$' + order.tax.toFixed(2) + '</span></div>' +
    '<div class="r-tot grand"><span>TOTAL</span><span>$' + order.total.toFixed(2) + '</span></div>' +
    '<div class="r-tot small"><span>ITEMS</span><span>' + order.count + '</span></div>' +
    '<div class="r-tot small"><span>PAID $' + (order.amountPaid || order.total).toFixed(2) +
      ' — ' + esc((order.paymentMethod || "Fake Pay").toUpperCase()) + '</span><span>APPROVED</span></div>' +

    '<div class="r-rule dashed"></div>' +

    '<div class="r-foot" data-testid="receipt-printed-footer" data-receipt-id="' + esc(order.id) + '">' +
      '<div class="r-thanks">*** THANK YOU ***</div>' +
      '<div class="r-meta">Verified Community Hardware Receipt</div>' +
      '<div class="r-scan-panel" data-testid="receipt-scan-panel">' +
        '<div class="r-qr-wrap" data-testid="receipt-qr-code">' +
          receiptQrSvg(order.id) +
        '</div>' +
        '<div class="r-barcode-col">' +
          '<div class="r-barcode" data-testid="receipt-barcode">' + barcode(order.id) + '</div>' +
          '<div class="r-barcode-code" data-testid="receipt-encoded-id">*' + esc(order.id) + '*</div>' +
          '<div class="r-meta r-scan-caption">CODE-39 &amp; QR · SCAN TO VERIFY</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}


// ── receipt helpers (ISO Code-39 1D Barcode + 21x21 QR Code Matrix encoding order.id) ──

var CODE39_MAP = {
  "*": "nwnnwnwnn",
  "-": "nwnnnnwnw",
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  "A": "wnnnnwnnw",
  "B": "nnwnnwnnw",
  "C": "wnwnnwnnn",
  "D": "nnnnwwnnw",
  "E": "wnnnwwnnn",
  "F": "nnwnwwnnn",
  "G": "nnnnnwwnw",
  "H": "wnnnnwwnn",
  "I": "nnwnnwwnn",
  "J": "nnnnwwwnn",
  "K": "wnnnnnnww",
  "L": "nnwnnnnww",
  "M": "wnwnnnnwn",
  "N": "nnnnwnnww",
  "O": "wnnnwnnwn",
  "P": "nnwnwnnwn",
  "Q": "nnnnnnwww",
  "R": "wnnnnnwwn",
  "S": "nnwnnnwwn",
  "T": "nnnnwnwwn",
  "U": "wwnnnnnnw",
  "V": "nwwnnnnnw",
  "W": "wwwnnnnnn",
  "X": "nwnnwnnnw",
  "Y": "wwnnwnnnn",
  "Z": "nwwnwnnnn"
};

function encodeReceiptCode39(receiptId) {
  var sanitized = String(receiptId || "VB-0000").toUpperCase().replace(/[^0-9A-Z-]/g, "") || "VB-0000";
  var payload = "*" + sanitized + "*";
  var narrow = 2;
  var wide = 5;
  var quietZone = 8;
  var cursor = quietZone;
  var bars = [];

  for (var c = 0; c < payload.length; c++) {
    var ch = payload.charAt(c);
    var pattern = CODE39_MAP[ch] || CODE39_MAP["-"];
    var isGuard = (c === 0 || c === payload.length - 1);
    for (var i = 0; i < pattern.length; i++) {
      var w = pattern.charAt(i) === "w" ? wide : narrow;
      if (i % 2 === 0) {
        bars.push({
          x: cursor,
          width: w,
          height: isGuard ? 42 : 38
        });
      }
      cursor += w;
    }
    if (c < payload.length - 1) {
      cursor += narrow;
    }
  }

  return {
    sanitized: sanitized,
    encodedValue: payload,
    totalWidth: cursor + quietZone,
    bars: bars
  };
}

function barcode(seedStr) {
  var encoded = encodeReceiptCode39(seedStr);
  var rects = "";
  for (var i = 0; i < encoded.bars.length; i++) {
    var b = encoded.bars[i];
    rects += '<rect x="' + b.x + '" y="0" width="' + b.width + '" height="' + b.height + '" />';
  }
  return '<svg class="barcode-svg" data-encoded-receipt="' + esc(encoded.sanitized) + '" ' +
         'viewBox="0 0 ' + encoded.totalWidth + ' 42" width="100%" height="42" ' +
         'preserveAspectRatio="none" role="img" aria-label="Scannable Code-39 barcode for receipt ' + esc(encoded.sanitized) + '">' +
         '<g fill="#1c1a17">' + rects + '</g></svg>';
}

function receiptQrSvg(receiptId) {
  var size = 21;
  var matrix = [];
  var reserved = [];
  for (var r = 0; r < size; r++) {
    matrix[r] = [];
    reserved[r] = [];
    for (var c = 0; c < size; c++) {
      matrix[r][c] = false;
      reserved[r][c] = false;
    }
  }

  function placeFinder(rOff, cOff) {
    for (var dr = -1; dr <= 7; dr++) {
      for (var dc = -1; dc <= 7; dc++) {
        var rr = rOff + dr;
        var cc = cOff + dc;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        reserved[rr][cc] = true;
        if (dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6) {
          var onBorder = (dr === 0 || dr === 6 || dc === 0 || dc === 6);
          var inCore = (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
          matrix[rr][cc] = (onBorder || inCore);
        } else {
          matrix[rr][cc] = false;
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  for (var t = 8; t < size - 8; t++) {
    reserved[6][t] = true;
    matrix[6][t] = (t % 2 === 0);
    reserved[t][6] = true;
    matrix[t][6] = (t % 2 === 0);
  }

  reserved[size - 8][8] = true;
  matrix[size - 8][8] = true;

  var clean = String(receiptId || "VB-0000").trim().toUpperCase();
  var payload = "VOLTBOX:" + clean;
  var bits = [];
  var hash = 2166136261;
  for (var i = 0; i < payload.length; i++) {
    var code = payload.charCodeAt(i);
    hash ^= code;
    hash = Math.imul(hash, 16777619) >>> 0;
    for (var b = 7; b >= 0; b--) {
      bits.push(((code >> b) & 1) === 1);
    }
  }
  for (var hb = 31; hb >= 0; hb--) {
    bits.push(((hash >> hb) & 1) === 1);
  }

  var bitIdx = 0;
  var rects = "";
  for (var row = 0; row < size; row++) {
    for (var col = 0; col < size; col++) {
      if (!reserved[row][col]) {
        var bit = bits[bitIdx % bits.length];
        var mask = ((row * 3 + col * 5 + bitIdx) % 3 === 0);
        matrix[row][col] = (bit !== mask);
        bitIdx++;
      }
      if (matrix[row][col]) {
        rects += '<rect x="' + (col + 1) + '" y="' + (row + 1) + '" width="1" height="1" />';
      }
    }
  }

  return '<svg class="receipt-qr-svg" data-encoded-receipt="' + esc(clean) + '" ' +
         'viewBox="0 0 23 23" width="66" height="66" shape-rendering="crispEdges" ' +
         'role="img" aria-label="Scannable QR code for receipt ' + esc(clean) + '">' +
         '<rect x="0" y="0" width="23" height="23" fill="#f6f2e9" stroke="#1c1a17" stroke-width="0.6" />' +
         '<g fill="#1c1a17">' + rects + '</g></svg>';
}

function formatDate(d) {
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
}

function formatTime(d) {
  var h = d.getHours(), m = d.getMinutes();
  var ampm = h >= 12 ? "PM" : "AM";
  h = h % 12; if (h === 0) h = 12;
  if (m < 10) m = "0" + m;
  return (h < 10 ? "0" + h : h) + ":" + m + " " + ampm;
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function esc(str) {
  var d = document.createElement("div");
  d.textContent = str == null ? "" : String(str);
  return d.innerHTML;
}

var STAR_PATH = "M11.5 2.3a.53.53 0 0 1 .95 0l2.31 4.68a2.1 2.1 0 0 0 1.6 1.16l5.16.75a.53.53 0 0 1 .3.9l-3.74 3.64a2.1 2.1 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.1 2.1 0 0 0-1.97 0L6.4 21.77a.53.53 0 0 1-.77-.56l.88-5.14a2.1 2.1 0 0 0-.61-1.88L2.16 10.55a.53.53 0 0 1 .3-.9l5.16-.75a2.1 2.1 0 0 0 1.6-1.16z";

function starSvg(filled) {
  return '<svg width="14" height="14" viewBox="0 0 24 24" ' +
    (filled ? 'fill="currentColor" stroke="none"'
            : 'fill="none" stroke="currentColor" stroke-width="2"') +
    ' stroke-linejoin="round"><path d="' + STAR_PATH + '"/></svg>';
}

function starRating(rate) {
  var pct = Math.max(0, Math.min(100, (rate / 5) * 100));
  var outline = "", filled = "";
  for (var i = 0; i < 5; i++) { outline += starSvg(false); filled += starSvg(true); }
  return '<span class="stars" style="--fill:' + pct.toFixed(1) + '%">' +
           '<span class="stars-bg">' + outline + '</span>' +
           '<span class="stars-fg">' + filled + '</span>' +
         '</span>';
}

function watchScroll() {
  var bar = document.getElementById("topbar");
  window.addEventListener("scroll", function () {
    if (window.scrollY > 10) {
      bar.classList.add("scrolled");
    } else {
      bar.classList.remove("scrolled");
    }
  }, { passive: true });
}


// ═══════════════════════════════════════════════════════════════════
// STUDIO UI & BACKGROUND TEMPLATE ENGINE + LIVE PSU ESTIMATOR
// ═══════════════════════════════════════════════════════════════════

var STUDIO_UI_THEMES = {
  obsidian: {
    id: "obsidian",
    name: "Obsidian Studio",
    shortLabel: "Obsidian",
    legacyBgMode: "quantum"
  },
  blueprint: {
    id: "blueprint",
    name: "Cobalt Blueprint",
    shortLabel: "Blueprint",
    legacyBgMode: "overclock"
  },
  copper: {
    id: "copper",
    name: "Anodized Copper",
    shortLabel: "Copper",
    legacyBgMode: "copper"
  },
  titanium: {
    id: "titanium",
    name: "Titanium Lab",
    shortLabel: "Titanium",
    legacyBgMode: "cyber"
  }
};

var STUDIO_THEME_ORDER = ["obsidian", "blueprint", "copper", "titanium"];
var activeStudioThemeId = "obsidian";

function resolveStudioThemeClient(rawInput) {
  if (window.VoltboxQR && typeof window.VoltboxQR.resolveUiTemplateTheme === "function") {
    return window.VoltboxQR.resolveUiTemplateTheme(rawInput);
  }
  var key = String(rawInput || "").trim().toLowerCase();
  if (key === "blueprint" || key === "overclock" || key === "sapphire") return STUDIO_UI_THEMES.blueprint;
  if (key === "copper" || key === "amber" || key === "gold") return STUDIO_UI_THEMES.copper;
  if (key === "titanium" || key === "cyber" || key === "emerald") return STUDIO_UI_THEMES.titanium;
  return STUDIO_UI_THEMES.obsidian;
}

function setStudioUiTheme() {
  var spec = STUDIO_UI_THEMES.obsidian;
  activeStudioThemeId = "obsidian";
  document.body.setAttribute("data-ui-theme", "obsidian");
  document.body.setAttribute("data-bg-mode", "quantum");
  try {
    localStorage.setItem("voltbox.ui.theme", "obsidian");
  } catch (e) {}
  return spec;
}

function cycleBgFxMode() {
  setStudioUiTheme();
}

function initQuantumCanvasBg() {
  window.triggerVoltboxShockwave = function () {};
}

function computeClientPowerEstimate() {
  var items = [];
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var q = cart[p.id] || 0;
    if (q > 0) {
      items.push({
        id: p.id,
        title: p.title,
        category: p.category,
        componentGroup: getComponentGroup(p),
        quantity: q
      });
    }
  }
  if (window.VoltboxQR && typeof window.VoltboxQR.computeSystemPowerEstimate === "function") {
    return window.VoltboxQR.computeSystemPowerEstimate(items);
  }
  var watts = 0;
  var count = 0;
  for (var j = 0; j < items.length; j++) {
    count += items[j].quantity;
    watts += 110 * items[j].quantity;
  }
  var peak = count > 0 ? (65 + watts) : 0;
  return {
    estimatedPeakWatts: peak,
    recommendedPsuWatts: peak > 650 ? 1000 : 650,
    psuTierLabel: peak > 650 ? "1000W ATX 3.1 Platinum" : "650W ATX 3.1 Ready",
    loadPercentage: count > 0 ? Math.min(96, Math.max(18, Math.round((peak / 850) * 100))) : 12,
    headroomStatus: peak >= 680 ? "high-draw" : (count > 0 ? "balanced" : "idle"),
    activeComponentCount: count
  };
}

function updateStudioCommandStrip() {
  var est = computeClientPowerEstimate();
  var wattsEl = document.getElementById("psu-peak-watts");
  var tierEl = document.getElementById("psu-recommended-tier");
  var barEl = document.getElementById("psu-load-bar");
  var starterBtn = document.getElementById("quick-starter-rig-btn");
  var rigStatus = computeRigStatus();

  // Sync Rig Compatibility 4-Slot Status Card
  var slotSummaryEl = document.getElementById("studio-rig-slot-summary");
  var filledSlotCount = typeof rigStatus.completedCount === "number" ? rigStatus.completedCount : 0;
  if (slotSummaryEl) {
    slotSummaryEl.textContent = rigStatus.qualifies
      ? (filledSlotCount + " / 4 Core Slots · 5% Off")
      : (filledSlotCount + " / 4 Core Slots");
  }
  var slotBtns = document.querySelectorAll("#studio-slot-pills [data-slot-filter]");
  for (var s = 0; s < slotBtns.length; s++) {
    var slotBtn = slotBtns[s];
    var groupKey = slotBtn.getAttribute("data-slot-filter");
    var isFilled = Boolean(rigStatus.slots && rigStatus.slots[groupKey]);
    slotBtn.classList.toggle("active", isFilled);
    var dotEl = slotBtn.querySelector(".slot-dot");
    if (dotEl) {
      dotEl.className = "swatch-dot slot-dot " + (isFilled ? "titanium" : "obsidian");
    }
  }

  if (wattsEl) {
    wattsEl.textContent = est.activeComponentCount > 0
      ? (est.estimatedPeakWatts + "W Peak")
      : "Standby (0W)";
  }
  if (tierEl) {
    tierEl.textContent = est.psuTierLabel;
  }
  if (barEl) {
    barEl.style.width = est.loadPercentage + "%";
    barEl.setAttribute("data-status", est.headroomStatus);
  }
  if (starterBtn) {
    if (rigStatus.qualifies) {
      starterBtn.innerHTML = icon("check", 13) + '<span>Rig Ready (5% Off)</span>';
      starterBtn.classList.add("rig-unlocked");
    } else {
      starterBtn.innerHTML = icon("bolt", 13) + '<span>+ Starter Rig</span>';
      starterBtn.classList.remove("rig-unlocked");
    }
  }

  // Sync Instant Promo Offer chips
  var dealStatusEl = document.getElementById("studio-deal-status");
  var promoChips = document.querySelectorAll("#studio-promo-strip .studio-promo-chip");
  for (var i = 0; i < promoChips.length; i++) {
    var chip = promoChips[i];
    var code = chip.getAttribute("data-promo-code");
    var isAct = Boolean(activePromoCode && activePromoCode === code);
    chip.classList.toggle("active", isAct);
    chip.setAttribute("aria-pressed", isAct ? "true" : "false");
  }
  if (dealStatusEl) {
    if (activePromoCode && PROMO_MAP[activePromoCode]) {
      dealStatusEl.textContent = activePromoCode + " Active";
      dealStatusEl.classList.add("active");
    } else {
      dealStatusEl.textContent = "Tap to apply";
      dealStatusEl.classList.remove("active");
    }
  }
  if (typeof syncCatalogFiltersToggleUI === "function") {
    syncCatalogFiltersToggleUI();
  }
}

function applyStarterRigBundle() {
  var requiredGroups = ["gpus", "cpus", "motherboards", "storage"];
  var addedCount = 0;
  for (var g = 0; g < requiredGroups.length; g++) {
    var groupKey = requiredGroups[g];
    var alreadyInCart = false;
    for (var i = 0; i < products.length; i++) {
      if (getComponentGroup(products[i]) === groupKey && (cart[products[i].id] || 0) > 0) {
        alreadyInCart = true;
        break;
      }
    }
    if (!alreadyInCart) {
      var best = null;
      for (var j = 0; j < products.length; j++) {
        var cand = products[j];
        var candStock = typeof cand.stock === "number" ? cand.stock : (cand.stockQuantity || 10);
        if (!cand || cand.takenDown || candStock <= 0) continue;
        if (getComponentGroup(cand) === groupKey) {
          if (!best || (cand.ratingRate || 0) > (best.ratingRate || 0)) {
            best = cand;
          }
        }
      }
      if (best) {
        cart[best.id] = 1;
        refreshCard(best.id);
        addedCount++;
      }
    }
  }
  recalc(true);
  queueCartSave();
  api("/api/cart/starter-rig", {
    method: "POST",
    body: JSON.stringify({ promoCode: activePromoCode || null })
  }).catch(function () {});

  if (addedCount > 0) {
    showActivityToast("Starter Rig Bundle loaded (" + addedCount + " core parts added · 5% Rig Discount active)!");
  } else {
    openRigDrawer();
  }
}

function applyStudioPromoOffer(code) {
  var clean = String(code || "").trim().toUpperCase();
  if (!clean || !PROMO_MAP[clean]) return;

  if (activePromoCode === clean) {
    activePromoCode = "";
    if (promoInputEl) promoInputEl.value = "";
    recalc(false);
    showActivityToast("Removed promo code " + clean);
    return;
  }

  activePromoCode = clean;
  if (promoInputEl) promoInputEl.value = clean;
  if (typeof syncPromoControls === "function") {
    syncPromoControls("");
  }
  recalc(true);
  api("/api/cart/promo", {
    method: "POST",
    body: JSON.stringify({ promoCode: clean })
  }).catch(function () {});
  showActivityToast("Applied promo code " + clean + " (" + PROMO_MAP[clean].label + ")!");
}

function initStudioCommandStrip() {
  setStudioUiTheme();

  var slotPillsEl = document.getElementById("studio-slot-pills");
  if (slotPillsEl) {
    slotPillsEl.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-slot-filter]");
      if (!btn) return;
      var filterCat = btn.getAttribute("data-slot-filter");
      if (filterCat && typeof selectCategoryFilter === "function") {
        selectCategoryFilter(filterCat);
      } else if (filterCat) {
        var tab = document.querySelector('#category-filters .filter-tab[data-filter="' + filterCat + '"]');
        if (tab) tab.click();
      }
    });
  }

  var starterBtn = document.getElementById("quick-starter-rig-btn");
  if (starterBtn) {
    starterBtn.addEventListener("click", applyStarterRigBundle);
  }

  var promoStrip = document.getElementById("studio-promo-strip");
  if (promoStrip) {
    promoStrip.addEventListener("click", function (e) {
      var chip = e.target.closest(".studio-promo-chip");
      if (!chip) return;
      var code = chip.getAttribute("data-promo-code");
      if (code) applyStudioPromoOffer(code);
    });
  }

  var attachToggleBtn = document.getElementById("ig-dm-attach-toggle");
  var attachTrayEl = document.getElementById("ig-attach-tray");
  if (attachToggleBtn && attachTrayEl) {
    attachToggleBtn.addEventListener("click", function () {
      if (chatProductSelectEl) chatProductSelectEl.focus();
    });
  }

  var quickHeartBtn = document.getElementById("ig-quick-heart-btn");
  if (quickHeartBtn) {
    quickHeartBtn.addEventListener("click", function () {
      if (!chatMessageInputEl) return;
      chatMessageInputEl.value = "❤️ Loving this hardware setup! Can we verify PSU headroom?";
      sendMessengerMessage();
    });
  }

  updateStudioCommandStrip();
}

setTimeout(initStudioCommandStrip, 0);


// ═══════════════════════════════════════════════════════════════════
// INSTAGRAM DIRECT-STYLE MESSENGER (REAL-TIME THREADS & PRODUCT TAGS)
// ═══════════════════════════════════════════════════════════════════

function setMobileDockActive(navKey) {
  if (!mobileAppNavEl) return;
  var items = mobileAppNavEl.querySelectorAll(".mnav-item, .mobile-nav-item");
  for (var i = 0; i < items.length; i++) {
    items[i].classList.toggle("active", items[i].getAttribute("data-nav") === navKey);
  }
}

function updateMessengerBadges() {
  if (messengerBadgeEl) {
    messengerBadgeEl.textContent = String(unreadChatCount);
    messengerBadgeEl.hidden = (unreadChatCount <= 0);
  }
  if (mnavMsgBadgeEl) {
    mnavMsgBadgeEl.textContent = String(unreadChatCount);
    mnavMsgBadgeEl.hidden = (unreadChatCount <= 0);
  }
}

function openMessenger() {
  if (!messengerOverlayEl) return;
  isMessengerOpen = true;
  unreadChatCount = 0;
  updateMessengerBadges();
  closeAllSheets();
  messengerOverlayEl.classList.add("open");
  messengerOverlayEl.setAttribute("aria-hidden", "false");
  if (messengerBtnEl) messengerBtnEl.setAttribute("aria-expanded", "true");
  document.body.classList.add("no-scroll");
  setMobileDockActive("messenger");

  loadMessengerMessages();
  setTimeout(function () {
    if (chatMessageInputEl) chatMessageInputEl.focus();
  }, 120);
}

function closeMessenger() {
  if (!messengerOverlayEl) return;
  isMessengerOpen = false;
  messengerOverlayEl.classList.remove("open");
  messengerOverlayEl.setAttribute("aria-hidden", "true");
  if (messengerBtnEl) messengerBtnEl.setAttribute("aria-expanded", "false");
  document.body.classList.remove("no-scroll");
  setMobileDockActive("catalog");
}

function populateMessengerProductSelect() {
  if (!chatProductSelectEl) return;
  var currentVal = chatProductSelectEl.value;
  var html = '<option value="">None (Text message only)</option>';
  var sorted = products.slice().sort(function (a, b) { return a.title.localeCompare(b.title); });
  for (var i = 0; i < sorted.length; i++) {
    var p = sorted[i];
    html += '<option value="' + p.id + '">' + esc(p.title) + ' ($' + p.price.toFixed(0) + ')</option>';
  }
  chatProductSelectEl.innerHTML = html;
  if (currentVal) chatProductSelectEl.value = currentVal;
}

function formatIgHandleForSender(name, role) {
  if (window.VoltboxQR && typeof window.VoltboxQR.formatInstagramHandle === "function") {
    return window.VoltboxQR.formatInstagramHandle(name, role);
  }
  var slug = String(name || "builder").trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") || "builder";
  var roleLower = String(role || "").toLowerCase();
  if (roleLower === "moderator" || roleLower === "staff_architect") {
    return "@" + slug + ".voltbox";
  }
  return "@" + slug;
}

function loadMessengerMessages() {
  api("/api/messages")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data && Array.isArray(data.messages)) {
        chatMessages = data.messages;
      }
      if (data && typeof data.onlineCount === "number" && messengerOnlineEl) {
        messengerOnlineEl.textContent = "Active now · " + Math.max(4, data.onlineCount) + " specialists";
      }
      renderMessengerFeed();
    })
    .catch(function () {});
}

function renderMessengerFeed() {
  if (!messengerFeedEl) return;
  var currentChan = activeChatChannel || "engineering-desk";

  // Sync Instagram Direct Header Handle & Subtitle with active channel pill
  var activeChanBtn = document.querySelector('#messenger-channels .msg-channel-btn[data-channel="' + currentChan + '"]');
  var igTitleEl = document.getElementById("ig-dm-active-title");
  if (activeChanBtn) {
    var handleAttr = activeChanBtn.getAttribute("data-ig-handle");
    var subAttr = activeChanBtn.getAttribute("data-ig-sub");
    if (igTitleEl && handleAttr) igTitleEl.textContent = handleAttr;
    if (messengerOnlineEl && subAttr) messengerOnlineEl.textContent = subAttr;
    if (chatMessageInputEl && handleAttr) {
      chatMessageInputEl.placeholder = "Message @" + handleAttr + "…";
    }
  }

  var filtered = [];
  for (var i = 0; i < chatMessages.length; i++) {
    var m = chatMessages[i];
    var mChan = m.channel || "engineering-desk";
    if (mChan === "general") mChan = "engineering-desk";
    if (mChan === currentChan) {
      filtered.push(m);
    }
  }

  if (filtered.length === 0) {
    messengerFeedEl.innerHTML =
      '<div class="msg-empty ig-dm-empty">' +
        '<p>No direct messages in this thread yet.</p>' +
        '<span>Send a message or tag a hardware part below to start an Instagram Direct consultation.</span>' +
      '</div>';
    return;
  }

  var html = '<div class="ig-dm-timestamp-divider"><span>TODAY · DIRECT ENCRYPTED</span></div>';
  for (var j = 0; j < filtered.length; j++) {
    var msg = filtered[j];
    var isSelf = me && msg.senderEmail === me.email;
    var isVerified = msg.senderRole === "STAFF_ARCHITECT" || msg.senderRole === "moderator" || msg.senderRole === "VERIFIED_BUILDER" || msg.senderRole === "contributor";
    var handleText = msg.senderHandle || formatIgHandleForSender(msg.senderName, msg.senderRole);
    var verifiedTick = isVerified ? '<span class="ig-msg-verified" title="Verified Specialist">✓</span>' : '';

    var when = new Date(msg.createdAt || Date.now());
    var timeLabel = formatTime(when);

    var partCardHtml = "";
    if (msg.productId && msg.productTitle) {
      var liveProd = findProductById(msg.productId);
      var pPrice = typeof msg.productPrice === "number" ? msg.productPrice : (liveProd ? liveProd.price : 0);
      var pSku = msg.productSku || (liveProd ? getSkuFor(liveProd) : ("VB-PRT-" + msg.productId));
      var pImg = (liveProd && liveProd.image) ? liveProd.image : (msg.productImage || tileFor("components"));
      partCardHtml =
        '<div class="msg-part-card ig-product-drop-card" data-testid="messenger-part-card">' +
          '<img class="msg-part-img" src="' + esc(pImg) + '" alt="" onerror="this.onerror=null;this.src=NO_IMAGE" />' +
          '<div class="msg-part-info">' +
            '<span class="msg-part-sku">' + esc(pSku) + '</span>' +
            '<strong class="msg-part-title">' + esc(msg.productTitle) + '</strong>' +
            '<span class="msg-part-price">$' + Number(pPrice).toFixed(2) + '</span>' +
          '</div>' +
          '<div class="msg-part-actions">' +
            '<button type="button" class="msg-part-btn specs" onclick="closeMessenger();openSpecDrawer(' + Number(msg.productId) + ')">View</button>' +
            '<button type="button" class="msg-part-btn add" onclick="inc(' + Number(msg.productId) + ')">+ Bag</button>' +
          '</div>' +
        '</div>';
    }

    var reactions = msg.reactions || { "❤️": 1 };
    var reactionsHtml = '<div class="msg-reactions-row ig-reactions-tray">';
    var emojis = ["❤️", "🔥", "⚡", "🚀"];
    for (var e = 0; e < emojis.length; e++) {
      var em = emojis[e];
      var cnt = reactions[em] || 0;
      reactionsHtml +=
        '<button type="button" class="msg-reaction-pill' + (cnt > 0 ? ' reacted' : '') + '" onclick="toggleMsgReaction(' + msg.id + ', \'' + em + '\')">' +
          em + (cnt > 0 ? (' <span>' + cnt + '</span>') : '') +
        '</button>';
    }
    reactionsHtml += '</div>';

    var seenHtml = isSelf
      ? '<div class="ig-seen-note">' + esc(msg.seenStatus || "Seen just now") + ' · ' + esc(timeLabel) + '</div>'
      : '';

    html +=
      '<article class="msg-card ig-dm-row' + (isSelf ? ' self' : '') + '" data-testid="messenger-msg-card">' +
        (isSelf ? '' : (
          '<div class="ig-msg-avatar-wrap">' +
            '<div class="msg-avatar ig-msg-avatar" style="background:' + esc(msg.senderColor || "#3b82f6") + '">' +
              esc((msg.senderName || "V").charAt(0).toUpperCase()) +
            '</div>' +
          '</div>'
        )) +
        '<div class="msg-body ig-dm-bubble-col">' +
          '<div class="msg-meta ig-dm-meta">' +
            '<span class="msg-author">' + esc(msg.senderName || "Specialist") + '</span>' +
            verifiedTick +
            '<span class="ig-msg-handle">' + esc(handleText) + '</span>' +
            '<span class="msg-time">' + esc(timeLabel) + '</span>' +
          '</div>' +
          '<div class="ig-dm-bubble">' +
            '<div class="msg-text">' + esc(msg.text) + '</div>' +
            partCardHtml +
          '</div>' +
          reactionsHtml +
          seenHtml +
        '</div>' +
      '</article>';
  }

  messengerFeedEl.innerHTML = html;
  if (window.momentumDrawers && window.momentumDrawers.messenger) {
    window.momentumDrawers.messenger.refreshMetrics();
    window.momentumDrawers.messenger.scrollTo(messengerFeedEl.scrollHeight, true);
  } else {
    messengerFeedEl.scrollTop = messengerFeedEl.scrollHeight;
  }
}

window.toggleMsgReaction = function (messageId, emoji) {
  api("/api/messages/" + messageId + "/reactions", {
    method: "POST",
    body: JSON.stringify({ emoji: emoji })
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data && data.message) {
        for (var i = 0; i < chatMessages.length; i++) {
          if (chatMessages[i].id === messageId) {
            chatMessages[i].reactions = data.message.reactions;
            break;
          }
        }
        renderMessengerFeed();
      }
    })
    .catch(function () {});
};

function sendMessengerMessage() {
  if (!chatMessageInputEl) return;
  var text = chatMessageInputEl.value.trim();
  if (!text) return;

  var prodIdVal = chatProductSelectEl && chatProductSelectEl.value ? Number(chatProductSelectEl.value) : null;
  chatSendBtnEl.disabled = true;

  api("/api/messages", {
    method: "POST",
    body: JSON.stringify({
      text: text,
      channel: activeChatChannel,
      productId: prodIdVal
    })
  })
    .then(function (res) {
      return res.json().then(function (data) { return { ok: res.ok, data: data }; });
    })
    .then(function (result) {
      chatSendBtnEl.disabled = false;
      if (result.ok && result.data) {
        chatMessageInputEl.value = "";
        if (chatProductSelectEl) chatProductSelectEl.value = "";
        appendIncomingChatMessage(result.data);
        triggerPerimeterSignalPulse();
      }
    })
    .catch(function () {
      chatSendBtnEl.disabled = false;
    });
}

function appendIncomingChatMessage(msg) {
  if (!msg || !msg.id) return;
  for (var i = 0; i < chatMessages.length; i++) {
    if (chatMessages[i].id === msg.id) return;
  }
  chatMessages.push(msg);
  if (isMessengerOpen) {
    renderMessengerFeed();
  } else {
    unreadChatCount++;
    updateMessengerBadges();
  }
}

window.onChatMessageReceived = function (msg, onlineCount) {
  if (typeof onlineCount === "number" && messengerOnlineEl) {
    messengerOnlineEl.textContent = Math.max(3, onlineCount + 2) + " builders online";
  }
  appendIncomingChatMessage(msg);
};

window.onPresenceUpdate = function (onlineCount) {
  if (typeof onlineCount === "number" && messengerOnlineEl) {
    messengerOnlineEl.textContent = Math.max(3, onlineCount + 2) + " builders online";
  }
};


// ═══════════════════════════════════════════════════════════════════
// PWA SERVICE WORKER, OFFLINE BANNER & INSTALL GUIDE
// ═══════════════════════════════════════════════════════════════════

function initPwaExperience() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () {});
    });
  }

  function syncOnlineBanner() {
    if (!offlineBannerEl) return;
    offlineBannerEl.hidden = navigator.onLine !== false;
  }
  window.addEventListener("online", syncOnlineBanner);
  window.addEventListener("offline", syncOnlineBanner);
  syncOnlineBanner();

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPwaPrompt = e;
    if (pwaNativeTriggerEl) {
      pwaNativeTriggerEl.hidden = false;
    }
  });

  // Preload initial chat count so badge/feed is ready
  setTimeout(loadMessengerMessages, 450);
}

function openPwaInstallModal() {
  if (!pwaInstallOverlayEl) return;
  closeAllSheets();
  pwaInstallOverlayEl.classList.add("open");
  pwaInstallOverlayEl.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
}

function closePwaInstallModal() {
  if (!pwaInstallOverlayEl) return;
  pwaInstallOverlayEl.classList.remove("open");
  pwaInstallOverlayEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}


// ═══════════════════════════════════════════════════════════════════
// SMOOTH MOMENTUM-BASED SCROLLING ENGINE FOR ALL DRAWERS
// (Product Specs #spec-drawer, Rig Builder #rig-drawer, Messenger #messenger-drawer)
// ═══════════════════════════════════════════════════════════════════

function computeTouchVelocityClient(samples, maxVelocity) {
  var cap = Math.max(8, Math.abs(maxVelocity || 72));
  if (!Array.isArray(samples) || samples.length < 2) return 0;

  var last = samples[samples.length - 1];
  var anchor = samples[0];
  for (var i = samples.length - 2; i >= 0; i--) {
    var dt = last.t - samples[i].t;
    if (dt >= 16 && dt <= 130) {
      anchor = samples[i];
      if (dt >= 45) break;
    }
  }

  var totalDt = last.t - anchor.t;
  if (totalDt < 0 || totalDt > 200) return 0;

  var deltaY = anchor.y - last.y;
  if (totalDt < 12 && Math.abs(deltaY) < 8) return 0;

  var effectiveDt = Math.max(24, totalDt);
  var pxPerFrame = (deltaY / effectiveDt) * 16.667;
  if (Math.abs(pxPerFrame) < 0.45) return 0;

  return Math.round(Math.max(-cap, Math.min(cap, pxPerFrame)) * 100) / 100;
}

function computeRubberBandDragClient(deltaY, currentScrollTop, currentOverscroll, maxScroll, maxOverscroll) {
  var safeMax = Math.max(0, Number(maxScroll) || 0);
  var limit = Math.max(24, Number(maxOverscroll) || 84);
  var scrollDelta = -deltaY;
  var virtualOffset = currentScrollTop + currentOverscroll + scrollDelta;

  if (virtualOffset >= 0 && virtualOffset <= safeMax) {
    return {
      scrollTop: Math.round(virtualOffset * 100) / 100,
      overscroll: 0
    };
  }

  var excess = virtualOffset < 0 ? virtualOffset : (virtualOffset - safeMax);
  var clampedTop = virtualOffset < 0 ? 0 : safeMax;
  var absExcess = Math.abs(excess);
  var damped = (1 - 1 / ((absExcess * 0.52) / limit + 1)) * limit;
  var overscroll = Math.round((excess < 0 ? -1 : 1) * damped * 100) / 100;

  return {
    scrollTop: clampedTop,
    overscroll: overscroll
  };
}

function stepMomentumScrollClient(state, dtMs) {
  var maxScroll = Math.max(0, Number(state.maxScroll) || 0);
  var friction = typeof state.friction === "number" ? state.friction : 0.945;
  var springTension = typeof state.springTension === "number" ? state.springTension : 0.22;
  var springDamping = typeof state.springDamping === "number" ? state.springDamping : 0.68;
  var dtRatio = Math.max(0.25, Math.min(2.5, (Number(dtMs) || 16.667) / 16.667));

  var scrollTop = Math.max(0, Math.min(maxScroll, Number(state.scrollTop) || 0));
  var velocity = Number(state.velocity) || 0;
  var overscroll = Number(state.overscroll) || 0;

  if (Math.abs(overscroll) > 0.01) {
    if (overscroll * velocity > 0) {
      overscroll += velocity * 0.32 * dtRatio;
      velocity *= Math.pow(0.55, dtRatio);
      overscroll = Math.max(-90, Math.min(90, overscroll));
    } else {
      velocity = 0;
    }

    overscroll *= Math.pow(1 - springTension, dtRatio);
    velocity *= Math.pow(springDamping, dtRatio);

    if (Math.abs(overscroll) < 0.45 && Math.abs(velocity) < 0.35) {
      return {
        scrollTop: scrollTop,
        velocity: 0,
        overscroll: 0,
        active: false,
        phase: "idle"
      };
    }

    return {
      scrollTop: Math.round(scrollTop * 100) / 100,
      velocity: Math.round(velocity * 100) / 100,
      overscroll: Math.round(overscroll * 100) / 100,
      active: true,
      phase: Math.abs(velocity) > 0.8 ? "overscroll" : "springback"
    };
  }

  velocity *= Math.pow(friction, dtRatio);
  var nextRaw = scrollTop + velocity * dtRatio;

  if (nextRaw < 0) {
    scrollTop = 0;
    overscroll = Math.max(-72, nextRaw * 0.38);
    velocity *= 0.45;
    return {
      scrollTop: 0,
      velocity: Math.round(velocity * 100) / 100,
      overscroll: Math.round(overscroll * 100) / 100,
      active: true,
      phase: "overscroll"
    };
  }

  if (nextRaw > maxScroll) {
    scrollTop = maxScroll;
    overscroll = Math.min(72, (nextRaw - maxScroll) * 0.38);
    velocity *= 0.45;
    return {
      scrollTop: maxScroll,
      velocity: Math.round(velocity * 100) / 100,
      overscroll: Math.round(overscroll * 100) / 100,
      active: true,
      phase: "overscroll"
    };
  }

  scrollTop = nextRaw;
  if (Math.abs(velocity) < 0.22) {
    return {
      scrollTop: Math.round(scrollTop * 100) / 100,
      velocity: 0,
      overscroll: 0,
      active: false,
      phase: "idle"
    };
  }

  return {
    scrollTop: Math.round(scrollTop * 100) / 100,
    velocity: Math.round(velocity * 100) / 100,
    overscroll: 0,
    active: true,
    phase: "coasting"
  };
}

function computeScrollThumbMetricsClient(scrollTop, scrollHeight, clientHeight, overscroll) {
  var safeClient = Math.max(1, Number(clientHeight) || 1);
  var safeScroll = Math.max(safeClient, Number(scrollHeight) || safeClient);
  var maxScroll = Math.max(0, safeScroll - safeClient);
  var scrollable = maxScroll > 2;

  if (!scrollable) {
    return {
      scrollable: false,
      progress: 0,
      thumbHeightPct: 100,
      thumbTopPct: 0,
      overscrollPx: 0
    };
  }

  var clampedTop = Math.max(0, Math.min(maxScroll, Number(scrollTop) || 0));
  var progress = Math.round((clampedTop / maxScroll) * 1000) / 1000;
  var rawThumbPct = (safeClient / safeScroll) * 100;
  var baseThumbHeightPct = Math.max(12, Math.min(82, rawThumbPct));
  var absOver = Math.min(80, Math.abs(Number(overscroll) || 0));
  var compressionPct = (absOver / 80) * Math.min(8, baseThumbHeightPct * 0.35);
  var thumbHeightPct = Math.round(Math.max(8, baseThumbHeightPct - compressionPct) * 100) / 100;

  var availableTrackPct = 100 - thumbHeightPct;
  var thumbTopPct = progress * availableTrackPct;
  if (overscroll < 0) thumbTopPct = 0;
  else if (overscroll > 0) thumbTopPct = availableTrackPct;

  return {
    scrollable: true,
    progress: progress,
    thumbHeightPct: thumbHeightPct,
    thumbTopPct: Math.round(thumbTopPct * 100) / 100,
    overscrollPx: Math.round((Number(overscroll) || 0) * 10) / 10
  };
}

function createMomentumDrawerController(key, drawerEl, scrollEl) {
  if (!drawerEl || !scrollEl) return null;

  // Inject tactile custom scrollbar track + thumb and top/bottom edge bounce glows
  var trackEl = drawerEl.querySelector(".drawer-momentum-track");
  var thumbEl = null;
  if (!trackEl) {
    trackEl = document.createElement("div");
    trackEl.className = "drawer-momentum-track";
    trackEl.setAttribute("aria-hidden", "true");
    trackEl.setAttribute("data-testid", "momentum-scrollbar-" + key);
    thumbEl = document.createElement("div");
    thumbEl.className = "drawer-momentum-thumb";
    trackEl.appendChild(thumbEl);
    drawerEl.appendChild(trackEl);
  } else {
    thumbEl = trackEl.querySelector(".drawer-momentum-thumb");
  }

  var topGlowEl = drawerEl.querySelector(".drawer-overscroll-glow.top");
  var bottomGlowEl = drawerEl.querySelector(".drawer-overscroll-glow.bottom");
  if (!topGlowEl) {
    topGlowEl = document.createElement("div");
    topGlowEl.className = "drawer-overscroll-glow top";
    topGlowEl.setAttribute("aria-hidden", "true");
    drawerEl.appendChild(topGlowEl);
  }
  if (!bottomGlowEl) {
    bottomGlowEl = document.createElement("div");
    bottomGlowEl.className = "drawer-overscroll-glow bottom";
    bottomGlowEl.setAttribute("aria-hidden", "true");
    drawerEl.appendChild(bottomGlowEl);
  }

  var state = {
    key: key,
    scrollTop: 0,
    velocity: 0,
    overscroll: 0,
    maxScroll: 0,
    phase: "idle",
    dragging: false,
    pointerActive: false,
    startX: 0,
    startY: 0,
    lastY: 0,
    samples: [],
    rafId: null,
    lastFrameTime: 0
  };

  function getMaxScroll() {
    return Math.max(0, (scrollEl.scrollHeight || 0) - (scrollEl.clientHeight || 0));
  }

  function syncDomVisuals() {
    state.maxScroll = getMaxScroll();
    var metrics = computeScrollThumbMetricsClient(
      state.scrollTop,
      scrollEl.scrollHeight,
      scrollEl.clientHeight,
      state.overscroll
    );

    drawerEl.setAttribute("data-scroll-phase", state.phase);
    scrollEl.setAttribute("data-scroll-phase", state.phase);
    drawerEl.setAttribute("data-scroll-top", String(Math.round(state.scrollTop)));
    scrollEl.setAttribute("data-scroll-top", String(Math.round(state.scrollTop)));
    drawerEl.setAttribute("data-velocity", String(Math.round(state.velocity * 10) / 10));
    scrollEl.setAttribute("data-velocity", String(Math.round(state.velocity * 10) / 10));

    // Apply elastic rubber-band displacement transform when overscrolling
    var shiftPx = state.overscroll !== 0 ? (-state.overscroll) : 0;
    scrollEl.style.setProperty("--overscroll-shift", shiftPx.toFixed(1) + "px");

    var speedNorm = Math.min(1, Math.abs(state.velocity) / 36);
    drawerEl.style.setProperty("--momentum-speed", speedNorm.toFixed(2));
    drawerEl.style.setProperty("--thumb-top", metrics.thumbTopPct + "%");
    drawerEl.style.setProperty("--thumb-height", metrics.thumbHeightPct + "%");

    var topGlow = state.overscroll < 0 ? Math.min(1, Math.abs(state.overscroll) / 48) : 0;
    var bottomGlow = state.overscroll > 0 ? Math.min(1, Math.abs(state.overscroll) / 48) : 0;
    drawerEl.style.setProperty("--overscroll-top-glow", topGlow.toFixed(2));
    drawerEl.style.setProperty("--overscroll-bottom-glow", bottomGlow.toFixed(2));

    if (trackEl) {
      trackEl.setAttribute("data-scrollable", metrics.scrollable ? "true" : "false");
    }
  }

  function cancelLoop() {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
  }

  function tickFrame(now) {
    var dt = state.lastFrameTime ? (now - state.lastFrameTime) : 16.667;
    state.lastFrameTime = now;
    state.maxScroll = getMaxScroll();

    var next = stepMomentumScrollClient({
      scrollTop: state.scrollTop,
      velocity: state.velocity,
      overscroll: state.overscroll,
      maxScroll: state.maxScroll
    }, dt);

    state.scrollTop = next.scrollTop;
    state.velocity = next.velocity;
    state.overscroll = next.overscroll;
    state.phase = next.phase;

    if (Math.abs(scrollEl.scrollTop - state.scrollTop) >= 0.5) {
      scrollEl.scrollTop = state.scrollTop;
    }
    syncDomVisuals();

    if (next.active) {
      state.rafId = requestAnimationFrame(tickFrame);
    } else {
      state.rafId = null;
      state.phase = "idle";
      syncDomVisuals();
    }
  }

  function startMomentumLoop() {
    if (state.rafId) return;
    state.lastFrameTime = performance.now();
    state.rafId = requestAnimationFrame(tickFrame);
  }

  function isInteractiveTarget(el) {
    if (!el || !el.closest) return false;
    return Boolean(el.closest("input, select, textarea, label"));
  }

  function onGestureStart(clientX, clientY, target) {
    if (isInteractiveTarget(target)) return;
    cancelLoop();
    state.pointerActive = true;
    state.dragging = false;
    state.startX = clientX;
    state.startY = clientY;
    state.lastY = clientY;
    state.scrollTop = scrollEl.scrollTop;
    state.maxScroll = getMaxScroll();
    state.velocity = 0;
    var now = performance.now();
    state.samples = [{ y: clientY, t: now }];
  }

  function onGestureMove(clientX, clientY, ev) {
    if (!state.pointerActive) return;
    var totalDx = clientX - state.startX;
    var totalDy = clientY - state.startY;

    if (!state.dragging) {
      // Require 7px vertical movement before engaging drag so taps on buttons inside drawers never misfire
      if (Math.abs(totalDy) < 7) return;
      if (Math.abs(totalDx) > Math.abs(totalDy) * 1.15) {
        state.pointerActive = false;
        return;
      }
      state.dragging = true;
      state.phase = "dragging";
      state.lastY = clientY;
    }

    if (ev && ev.cancelable) {
      ev.preventDefault();
    }

    var deltaY = clientY - state.lastY;
    state.lastY = clientY;
    state.maxScroll = getMaxScroll();

    var dragStep = computeRubberBandDragClient(
      deltaY,
      state.scrollTop,
      state.overscroll,
      state.maxScroll,
      84
    );

    state.scrollTop = dragStep.scrollTop;
    state.overscroll = dragStep.overscroll;
    state.phase = state.overscroll !== 0 ? "overscroll" : "dragging";
    scrollEl.scrollTop = state.scrollTop;

    var now = performance.now();
    state.samples.push({ y: clientY, t: now });
    if (state.samples.length > 10) {
      state.samples.shift();
    }

    syncDomVisuals();
  }

  function onGestureEnd() {
    if (!state.pointerActive) return;
    var wasDragging = state.dragging;
    state.pointerActive = false;
    state.dragging = false;

    if (!wasDragging && Math.abs(state.overscroll) < 0.5) {
      state.phase = "idle";
      syncDomVisuals();
      return;
    }

    state.samples.push({ y: state.lastY, t: performance.now() });
    var flickVel = computeTouchVelocityClient(state.samples, 72);
    state.velocity = flickVel;

    if (Math.abs(state.velocity) >= 0.45 || Math.abs(state.overscroll) >= 0.45) {
      state.phase = Math.abs(state.overscroll) > 0.45 ? "springback" : "coasting";
      startMomentumLoop();
    } else {
      state.phase = "idle";
      state.overscroll = 0;
      syncDomVisuals();
    }
  }

  // Touch events for iOS / iPadOS / Android touchscreens (bound to drawerEl so swipes on scrollEl or drawer surface both work)
  drawerEl.addEventListener("touchstart", function (e) {
    if (!e.touches || e.touches.length !== 1) return;
    onGestureStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
  }, { passive: true });

  drawerEl.addEventListener("touchmove", function (e) {
    if (!e.touches || e.touches.length !== 1) return;
    onGestureMove(e.touches[0].clientX, e.touches[0].clientY, e);
  }, { passive: false });

  drawerEl.addEventListener("touchend", onGestureEnd, { passive: true });
  drawerEl.addEventListener("touchcancel", onGestureEnd, { passive: true });

  // Pointer / mouse drag support for touch-emulated & desktop dragging
  drawerEl.addEventListener("mousedown", function (e) {
    if (e.button !== 0) return;
    if (e.target && e.target.closest && e.target.closest("button, a, input, select, textarea, label")) {
      return;
    }
    onGestureStart(e.clientX, e.clientY, e.target);
  });

  window.addEventListener("mousemove", function (e) {
    if (!state.pointerActive) return;
    onGestureMove(e.clientX, e.clientY, e);
  });

  window.addEventListener("mouseup", function () {
    if (!state.pointerActive) return;
    onGestureEnd();
  });

  // Smooth Wheel Impulse (converts stepped wheel ticks into smooth momentum coasting)
  drawerEl.addEventListener("wheel", function (e) {
    if (e.ctrlKey) return;
    state.maxScroll = getMaxScroll();
    if (state.maxScroll <= 0) return;

    e.preventDefault();
    var rawDelta = e.deltaMode === 1 ? (e.deltaY * 18) : e.deltaY;
    var impulse = Math.max(-42, Math.min(42, rawDelta * 0.28));

    if (!state.rafId) {
      state.scrollTop = scrollEl.scrollTop;
    }
    state.velocity = Math.max(-68, Math.min(68, state.velocity + impulse));
    state.phase = "coasting";
    startMomentumLoop();
  }, { passive: false });

  // Native scroll fallback synchronization
  scrollEl.addEventListener("scroll", function () {
    if (!state.dragging && !state.rafId) {
      state.scrollTop = scrollEl.scrollTop;
      syncDomVisuals();
    }
  }, { passive: true });

  return {
    key: key,
    drawerEl: drawerEl,
    scrollEl: scrollEl,
    refreshMetrics: function () {
      state.maxScroll = getMaxScroll();
      state.scrollTop = Math.max(0, Math.min(state.maxScroll, scrollEl.scrollTop));
      syncDomVisuals();
    },
    flick: function (velocityPxPerFrame) {
      cancelLoop();
      state.maxScroll = getMaxScroll();
      state.scrollTop = scrollEl.scrollTop;
      state.velocity = Math.max(-72, Math.min(72, Number(velocityPxPerFrame) || 0));
      state.phase = "coasting";
      syncDomVisuals();
      startMomentumLoop();
    },
    scrollTo: function (targetTop, animated) {
      cancelLoop();
      state.maxScroll = getMaxScroll();
      var clamped = Math.max(0, Math.min(state.maxScroll, Number(targetTop) || 0));
      if (!animated) {
        state.scrollTop = clamped;
        state.velocity = 0;
        state.overscroll = 0;
        state.phase = "idle";
        scrollEl.scrollTop = clamped;
        syncDomVisuals();
        return;
      }
      var diff = clamped - scrollEl.scrollTop;
      if (Math.abs(diff) < 2) {
        scrollEl.scrollTop = clamped;
        state.scrollTop = clamped;
        syncDomVisuals();
        return;
      }
      // Launch smooth momentum impulse toward targetTop
      state.scrollTop = scrollEl.scrollTop;
      state.velocity = Math.max(-64, Math.min(64, diff * 0.09));
      state.phase = "coasting";
      startMomentumLoop();
    },
    getState: function () {
      return {
        key: state.key,
        scrollTop: Math.round(scrollEl.scrollTop * 100) / 100,
        maxScroll: getMaxScroll(),
        scrollHeight: scrollEl.scrollHeight,
        clientHeight: scrollEl.clientHeight,
        velocity: state.velocity,
        overscroll: state.overscroll,
        phase: state.phase,
        active: Boolean(state.rafId)
      };
    }
  };
}

function initMomentumDrawers() {
  var specDrawerEl = document.getElementById("spec-drawer");
  var specBodyEl = document.getElementById("spec-drawer-body");
  var rigDrawerEl = document.getElementById("rig-drawer");
  var rigBodyEl = document.getElementById("rig-slots-list");
  var msgDrawerEl = document.getElementById("messenger-drawer");
  var msgBodyEl = document.getElementById("messenger-feed");

  window.momentumDrawers = {
    spec: createMomentumDrawerController("spec", specDrawerEl, specBodyEl),
    rig: createMomentumDrawerController("rig", rigDrawerEl, rigBodyEl),
    messenger: createMomentumDrawerController("messenger", msgDrawerEl, msgBodyEl),
    computeTouchVelocity: computeTouchVelocityClient,
    computeRubberBandDrag: computeRubberBandDragClient,
    stepMomentumScroll: stepMomentumScrollClient,
    computeScrollThumbMetrics: computeScrollThumbMetricsClient
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// REAL-TIME ORDER TRACKING DASHBOARD & PROGRESS TIMELINE CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════

var activeTrackingOrderId = null;
var trackingPollTimer = null;
var activeTrackingData = null;

var orderTrackingOverlayEl = document.getElementById("order-tracking-overlay");
var orderTrackingCardEl    = document.getElementById("order-tracking-card");
var trackingCloseBtnEl     = document.getElementById("tracking-modal-close");
var trackingDoneBtnEl      = document.getElementById("tracking-done-btn");
var trackingAdvanceBtnEl   = document.getElementById("tracking-advance-btn");
var trackingRefreshBtnEl   = document.getElementById("tracking-refresh-btn");
var trackingReceiptBtnEl   = document.getElementById("tracking-view-receipt-btn");
var trackingAwbCopyBtnEl   = document.getElementById("tracking-awb-copy-btn");

function openOrderTrackingDashboard(targetOrderId) {
  if (orderTrackingOverlayEl) {
    orderTrackingOverlayEl.classList.add("open");
    orderTrackingOverlayEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }

  // If specific order given, fetch it; otherwise fetch user orders and take newest
  if (targetOrderId) {
    activeTrackingOrderId = targetOrderId;
    fetchOrderTracking(targetOrderId);
  } else {
    api("/api/orders")
      .then(function(res) { return res.json(); })
      .then(function(orders) {
        if (Array.isArray(orders) && orders.length > 0) {
          activeTrackingOrderId = orders[0].id;
          fetchOrderTracking(activeTrackingOrderId);
        } else {
          renderEmptyTrackingState();
        }
      })
      .catch(function(err) {
        console.error("Failed to load orders for tracking:", err);
        renderEmptyTrackingState();
      });
  }

  // Start real-time polling while dashboard is open (every 3500ms)
  clearInterval(trackingPollTimer);
  trackingPollTimer = setInterval(function() {
    if (activeTrackingOrderId && orderTrackingOverlayEl && orderTrackingOverlayEl.classList.contains("open")) {
      fetchOrderTracking(activeTrackingOrderId, true);
    }
  }, 3500);
}

function closeOrderTrackingDashboard() {
  clearInterval(trackingPollTimer);
  trackingPollTimer = null;
  if (orderTrackingOverlayEl) {
    orderTrackingOverlayEl.classList.remove("open");
    orderTrackingOverlayEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  }
}

function fetchOrderTracking(orderId, isSilent) {
  if (!orderId) return;
  if (!isSilent) {
    var statusBadge = document.getElementById("tracking-status-badge");
    if (statusBadge && !activeTrackingData) statusBadge.textContent = "Loading telemetry…";
  }

  api("/api/orders/" + encodeURIComponent(orderId) + "/tracking")
    .then(function(res) {
      if (!res.ok) throw new Error("Order not found");
      return res.json();
    })
    .then(function(data) {
      if (data && data.timeline) {
        activeTrackingData = data;
        renderOrderTrackingDashboard(data);
      }
    })
    .catch(function(err) {
      console.warn("Could not fetch order tracking for", orderId, err);
      if (!isSilent) {
        var statusBadge = document.getElementById("tracking-status-badge");
        if (statusBadge) statusBadge.textContent = "Unable to connect";
      }
    });
}

function renderOrderTrackingDashboard(data) {
  var t = data.timeline;
  var ord = data.order || {};
  activeTrackingOrderId = t.orderId;

  // Header Elements
  var orderIdEl = document.getElementById("tracking-order-id");
  if (orderIdEl) orderIdEl.textContent = t.orderId;

  var placedDateEl = document.getElementById("tracking-placed-date");
  if (placedDateEl) {
    var pDate = new Date(t.placedAt);
    placedDateEl.textContent = "Placed " + pDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  var itemsCountEl = document.getElementById("tracking-items-count");
  if (itemsCountEl) {
    itemsCountEl.textContent = t.itemCount + (t.itemCount === 1 ? " item" : " items");
  }

  var statusBadgeEl = document.getElementById("tracking-status-badge");
  if (statusBadgeEl) {
    statusBadgeEl.textContent = t.currentStatus;
    statusBadgeEl.className = "tracking-status-badge";
    if (t.currentStageKey === "delivered") {
      statusBadgeEl.classList.add("status-delivered");
    } else if (t.currentStageKey === "processing") {
      statusBadgeEl.classList.add("status-processing");
    }
  }

  // Courier & ETA
  var etaValEl = document.getElementById("tracking-eta-val");
  if (etaValEl) etaValEl.textContent = t.estimatedDelivery;

  var transitNoteEl = document.getElementById("tracking-transit-note");
  if (transitNoteEl) transitNoteEl.textContent = t.carrier.service;

  var carrierNameEl = document.getElementById("tracking-carrier-name");
  if (carrierNameEl) carrierNameEl.textContent = t.carrier.name;

  var awbLabelEl = document.getElementById("tracking-awb-label");
  if (awbLabelEl) awbLabelEl.textContent = t.carrier.trackingNumber;

  var destAddrEl = document.getElementById("tracking-destination-addr");
  if (destAddrEl) destAddrEl.textContent = "Destination: " + (t.destination.address || " Indiranagar, Bengaluru");

  // Progress Bar & Stepper
  var progressPctEl = document.getElementById("tracking-progress-pct");
  if (progressPctEl) progressPctEl.textContent = t.progressPercent + "% Complete";

  var trackFillEl = document.getElementById("tracking-track-fill");
  if (trackFillEl) trackFillEl.style.width = t.progressPercent + "%";

  // 4 Milestone Nodes
  for (var i = 0; i < t.stages.length; i++) {
    var stage = t.stages[i];
    var nodeEl = document.getElementById("step-node-" + stage.key);
    if (nodeEl) {
      nodeEl.className = "timeline-step " + stage.state;
    }
    var timeEl = document.getElementById("step-time-" + stage.key);
    if (timeEl) timeEl.textContent = stage.timestamp;
    var detailEl = document.getElementById("step-detail-" + stage.key);
    if (detailEl) detailEl.textContent = stage.subtitle;
  }

  // Contents
  var totalAmountEl = document.getElementById("tracking-total-amount");
  if (totalAmountEl) totalAmountEl.textContent = "$" + Number(t.total || 0).toFixed(2);

  var itemsListEl = document.getElementById("tracking-items-list");
  if (itemsListEl) {
    var lines = Array.isArray(ord.lines) ? ord.lines : [];
    if (lines.length === 0) {
      itemsListEl.innerHTML = '<p style="color:#64748b;font-size:12px;margin:4px 0;">No items listed.</p>';
    } else {
      var linesHtml = "";
      for (var j = 0; j < lines.length; j++) {
        var ln = lines[j];
        var imgUrl = getProductImageUrl(ln);
        linesHtml +=
          '<div class="tracking-item-row">' +
            '<div class="tracking-item-left">' +
              '<img class="tracking-item-thumb" src="' + esc(imgUrl) + '" alt="' + esc(ln.title || "") + '" onerror="this.onerror=null;this.src=NO_IMAGE" />' +
              '<div>' +
                '<div class="tracking-item-title">' + esc(ln.title || "Hardware Component") + '</div>' +
                '<div class="tracking-item-qty">Qty: ' + (ln.qty || 1) + ' · $' + Number(ln.price || 0).toFixed(2) + ' each</div>' +
              '</div>' +
            '</div>' +
            '<div class="tracking-item-price">$' + (Number(ln.price || 0) * (ln.qty || 1)).toFixed(2) + '</div>' +
          '</div>';
      }
      itemsListEl.innerHTML = linesHtml;
    }
  }

  // Advance Stage button
  var advanceLabelEl = document.getElementById("tracking-advance-label");
  if (trackingAdvanceBtnEl && advanceLabelEl) {
    if (t.canAdvance && t.nextStage) {
      trackingAdvanceBtnEl.disabled = false;
      advanceLabelEl.textContent = "Advance to " + t.nextStage + " (Live Demo)";
    } else {
      trackingAdvanceBtnEl.disabled = false;
      advanceLabelEl.textContent = "Delivered · Restart Demo";
    }
  }

  if (typeof renderIcons === "function") {
    renderIcons(orderTrackingCardEl);
  }
}

function renderEmptyTrackingState() {
  var orderIdEl = document.getElementById("tracking-order-id");
  if (orderIdEl) orderIdEl.textContent = "NO ORDERS YET";
  var statusBadgeEl = document.getElementById("tracking-status-badge");
  if (statusBadgeEl) statusBadgeEl.textContent = "Awaiting Checkout";
  var etaValEl = document.getElementById("tracking-eta-val");
  if (etaValEl) etaValEl.textContent = "Place an order first";
  var itemsListEl = document.getElementById("tracking-items-list");
  if (itemsListEl) {
    itemsListEl.innerHTML =
      '<p style="color:#94a3b8;font-size:12.5px;padding:8px 0;">No active purchases to track. Add components from the catalog and tap "Checkout" to see real-time dispatch telemetry!</p>';
  }
}

function advanceActiveOrderStage() {
  if (!activeTrackingOrderId) return;
  if (!trackingAdvanceBtnEl) return;

  var advanceLabelEl = document.getElementById("tracking-advance-label");
  if (advanceLabelEl) advanceLabelEl.textContent = "Advancing stage…";
  trackingAdvanceBtnEl.disabled = true;

  var isRestart = activeTrackingData && activeTrackingData.timeline && !activeTrackingData.timeline.canAdvance;
  var endpoint = isRestart ? "/api/orders/" + encodeURIComponent(activeTrackingOrderId) + "/status" : "/api/orders/" + encodeURIComponent(activeTrackingOrderId) + "/advance";
  var reqOptions = isRestart
    ? { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Order Placed" }) }
    : { method: "POST" };

  api(endpoint, reqOptions)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data && data.timeline) {
        activeTrackingData = data;
        renderOrderTrackingDashboard(data);
        var msg = "Order #" + activeTrackingOrderId + " is now: " + data.timeline.currentStatus;
        if (typeof showToast === "function") showToast(msg);
      }
    })
    .catch(function(err) {
      console.error("Failed to advance order tracking stage:", err);
      if (advanceLabelEl) advanceLabelEl.textContent = "Advance Stage (Live Demo)";
      trackingAdvanceBtnEl.disabled = false;
    });
}

function refreshActiveOrderTracking() {
  if (!activeTrackingOrderId) return;
  var refreshBtn = document.getElementById("tracking-refresh-btn");
  if (refreshBtn) refreshBtn.classList.add("spinning");
  fetchOrderTracking(activeTrackingOrderId, false);
  setTimeout(function() {
    if (refreshBtn) refreshBtn.classList.remove("spinning");
    if (typeof showToast === "function") showToast("Live dispatch telemetry refreshed.");
  }, 400);
}

function viewReceiptFromTracking() {
  if (activeTrackingData && activeTrackingData.order) {
    closeOrderTrackingDashboard();
    showReceipt(activeTrackingData.order);
  }
}

function copyTrackingAwb() {
  var awbEl = document.getElementById("tracking-awb-label");
  var text = awbEl ? awbEl.textContent.trim() : "VB-TRK-882194";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      if (typeof showToast === "function") showToast("Tracking AWB copied: " + text);
    });
  } else {
    if (typeof showToast === "function") showToast("AWB: " + text);
  }
}

function initOrderTrackingWiring() {
  if (trackingCloseBtnEl) trackingCloseBtnEl.addEventListener("click", closeOrderTrackingDashboard);
  if (trackingDoneBtnEl) trackingDoneBtnEl.addEventListener("click", closeOrderTrackingDashboard);
  if (trackingAdvanceBtnEl) trackingAdvanceBtnEl.addEventListener("click", advanceActiveOrderStage);
  if (trackingRefreshBtnEl) trackingRefreshBtnEl.addEventListener("click", refreshActiveOrderTracking);
  if (trackingReceiptBtnEl) trackingReceiptBtnEl.addEventListener("click", viewReceiptFromTracking);
  if (trackingAwbCopyBtnEl) trackingAwbCopyBtnEl.addEventListener("click", copyTrackingAwb);

  if (orderTrackingOverlayEl) {
    orderTrackingOverlayEl.addEventListener("click", function(e) {
      if (e.target === orderTrackingOverlayEl) closeOrderTrackingDashboard();
    });
  }

  var receiptTrackBtn = document.getElementById("receipt-track-btn");
  if (receiptTrackBtn) {
    receiptTrackBtn.addEventListener("click", function() {
      var ordId = shownOrder ? shownOrder.id : null;
      closeReceipt();
      openOrderTrackingDashboard(ordId);
    });
  }

  var openTrackingBtn = document.getElementById("open-tracking-btn");
  if (openTrackingBtn) {
    openTrackingBtn.addEventListener("click", function() {
      closeAllSheets();
      openOrderTrackingDashboard(null);
    });
  }
}

document.addEventListener("DOMContentLoaded", function() {
  initOrderTrackingWiring();
  initCheckoutPrintSummaryAndAdvancedSettings();
});

window.openOrderTrackingDashboard = openOrderTrackingDashboard;
window.closeOrderTrackingDashboard = closeOrderTrackingDashboard;

// ─────────────────────────────────────────────────────────────────────────
// Checkout Modal 'Print Summary' & Storefront Advanced Settings Controllers
// ─────────────────────────────────────────────────────────────────────────

var ADV_SETTINGS_STORAGE_KEY = "voltbox_advanced_settings_v1";
window.voltboxAdvSettings = {
  audioPingEnabled: true,
  audioPingProfile: "subtle",
  wishlistToastsEnabled: true,
  toastDurationMs: 3800,
  cardParallaxTiltEnabled: true,
  backgroundAnimationEnabled: true,
  gridDensity: "comfortable",
  showDualCurrencyInr: false,
  autoExpandCheckoutSummary: true
};

function buildCurrentCheckoutSummaryData() {
  var totals = computeTotals();
  var cartItems = [];
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var q = cart[p.id] || 0;
    if (q <= 0) continue;
    cartItems.push({
      id: p.id,
      sku: getSkuFor(p),
      title: p.title,
      category: p.category,
      price: p.price,
      quantity: q
    });
  }

  var recipientName = (checkoutNameEl && checkoutNameEl.value.trim()) ? checkoutNameEl.value.trim() : (me ? me.name : "Harish");
  var shippingAddress = (checkoutAddressEl && checkoutAddressEl.value.trim()) ? checkoutAddressEl.value.trim() : "42 Circuit Lane, Silicon Bay";
  var paymentMethodSummary = getFormattedPaymentSummary();

  if (window.VoltboxQR && typeof window.VoltboxQR.buildCheckoutPrintSummary === "function") {
    return window.VoltboxQR.buildCheckoutPrintSummary(cartItems, {
      recipientName: recipientName,
      shippingAddress: shippingAddress,
      paymentMethodSummary: paymentMethodSummary,
      promoCode: activePromoCode || null,
      promoDiscount: totals.promoDiscount || 0,
      rigDiscount: totals.rigDiscount || 0,
      taxRate: TAX_RATE
    });
  }

  return {
    summaryId: "VB-SUM-" + Math.floor(1000 + (Date.now() % 9000)),
    generatedAt: new Date().toLocaleString(),
    recipientName: recipientName,
    shippingAddress: shippingAddress,
    paymentMethodSummary: paymentMethodSummary,
    promoCode: activePromoCode || null,
    items: cartItems.map(function (it) {
      return {
        id: it.id,
        sku: it.sku,
        title: it.title,
        category: it.category,
        unitPrice: it.price,
        quantity: it.quantity,
        lineTotal: round(it.price * it.quantity)
      };
    }),
    totalQuantity: totals.count,
    subtotal: totals.subtotal,
    rigDiscount: totals.rigDiscount || 0,
    promoDiscount: totals.promoDiscount || 0,
    taxRatePercent: 8,
    tax: totals.tax,
    shippingCost: 0,
    totalUsd: totals.total,
    totalInr: Math.round(totals.total * 83.5)
  };
}

function renderCheckoutPrintSummarySheet() {
  var sheetEl = document.getElementById("checkout-print-summary-sheet");
  if (!sheetEl) return null;

  var summary = buildCurrentCheckoutSummaryData();
  var rowsHtml = "";
  for (var i = 0; i < summary.items.length; i++) {
    var item = summary.items[i];
    rowsHtml +=
      '<tr data-testid="print-summary-line">' +
        '<td>' +
          '<strong>' + esc(item.title) + '</strong>' +
          '<span class="ps-sku-tag">SKU: ' + esc(item.sku) + '</span>' +
        '</td>' +
        '<td class="num">' + item.quantity + '</td>' +
        '<td class="num">$' + item.unitPrice.toFixed(2) + '</td>' +
        '<td class="num"><strong>$' + item.lineTotal.toFixed(2) + '</strong></td>' +
      '</tr>';
  }

  var discountRowsHtml = "";
  if (summary.rigDiscount > 0) {
    discountRowsHtml +=
      '<div class="ps-total-row discount">' +
        '<span>Rig Builder 5% Bundle Discount</span>' +
        '<span>-$' + summary.rigDiscount.toFixed(2) + '</span>' +
      '</div>';
  }
  if (summary.promoDiscount > 0) {
    discountRowsHtml +=
      '<div class="ps-total-row discount">' +
        '<span>Promo Discount (' + esc(summary.promoCode || "PROMO") + ')</span>' +
        '<span>-$' + summary.promoDiscount.toFixed(2) + '</span>' +
      '</div>';
  }

  sheetEl.innerHTML =
    '<div class="ps-doc-head">' +
      '<div>' +
        '<div class="ps-brand-title">VOLTBOX ELECTRONICS</div>' +
        '<span class="ps-brand-sub">Pre-Purchase Order Summary &amp; Proforma Hardware Estimate</span>' +
      '</div>' +
      '<div class="ps-doc-meta">' +
        '<strong>Ref: ' + esc(summary.summaryId) + '</strong>' +
        '<span>' + esc(summary.generatedAt) + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="ps-customer-grid">' +
      '<div class="ps-customer-col">' +
        '<span>Prepared For</span>' +
        '<strong>' + esc(summary.recipientName) + '</strong>' +
        '<div>' + esc(summary.shippingAddress) + '</div>' +
      '</div>' +
      '<div class="ps-customer-col">' +
        '<span>Selected Payment &amp; Dispatch</span>' +
        '<strong>' + esc(summary.paymentMethodSummary) + '</strong>' +
        '<div>BlueDart Apex Air Cargo · Free Insured Shipping</div>' +
      '</div>' +
    '</div>' +
    '<table class="ps-items-table" aria-label="Order Summary Items">' +
      '<thead>' +
        '<tr>' +
          '<th>Component</th>' +
          '<th class="num">Qty</th>' +
          '<th class="num">Unit Price</th>' +
          '<th class="num">Line Total</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>' + rowsHtml + '</tbody>' +
    '</table>' +
    '<div class="ps-totals-box">' +
      '<div class="ps-total-row">' +
        '<span>Subtotal (' + summary.totalQuantity + (summary.totalQuantity === 1 ? ' unit' : ' units') + ')</span>' +
        '<span>$' + summary.subtotal.toFixed(2) + '</span>' +
      '</div>' +
      discountRowsHtml +
      '<div class="ps-total-row">' +
        '<span>Estimated Tax (' + summary.taxRatePercent + '%)</span>' +
        '<span>$' + summary.tax.toFixed(2) + '</span>' +
      '</div>' +
      '<div class="ps-total-row">' +
        '<span>Insured Express Shipping</span>' +
        '<span>$0.00 (Free)</span>' +
      '</div>' +
      '<div class="ps-total-row grand" data-testid="print-summary-grand-total">' +
        '<span>Total Payable</span>' +
        '<span>$' + summary.totalUsd.toFixed(2) + '</span>' +
      '</div>' +
      '<div class="ps-total-inr">≈ ₹' + summary.totalInr.toLocaleString("en-IN") + ' INR</div>' +
    '</div>' +
    '<div class="ps-doc-footer">' +
      '<span>ESD Bench-Verified Components · 3-Year Manufacturer Warranty</span>' +
      '<span>voltbox.dev/catalog</span>' +
    '</div>';

  return summary;
}

window.openCheckoutPrintSummary = function () {
  var viewEl = document.getElementById("checkout-print-summary-view");
  var upiEl = document.getElementById("upi-qr-overlay");
  var msgEl = document.getElementById("checkout-print-summary-msg");
  if (!viewEl) return;

  renderCheckoutPrintSummarySheet();
  if (upiEl) upiEl.hidden = true;
  if (checkoutFormEl) checkoutFormEl.hidden = true;
  if (checkoutSuccessEl) checkoutSuccessEl.hidden = true;
  if (msgEl) msgEl.hidden = true;
  viewEl.hidden = false;
  document.body.classList.add("printing-checkout-summary");
};

window.closeCheckoutPrintSummary = function () {
  var viewEl = document.getElementById("checkout-print-summary-view");
  if (viewEl) viewEl.hidden = true;
  if (checkoutFormEl) checkoutFormEl.hidden = false;
  document.body.classList.remove("printing-checkout-summary");
};

function executeCheckoutPrintSummary() {
  var summary = renderCheckoutPrintSummarySheet();
  document.body.classList.add("printing-checkout-summary");
  var msgEl = document.getElementById("checkout-print-summary-msg");
  if (msgEl) {
    msgEl.className = "modal-msg";
    msgEl.textContent = "✓ Printable summary (" + (summary ? summary.summaryId : "VB-SUM") + ") prepared — select 'Save as PDF' or your printer in the print dialog.";
    msgEl.hidden = false;
  }
  showActivityToast("Printable Order Summary (" + (summary ? summary.summaryId : "VB-SUM") + ") ready for PDF / Print");
  try {
    window.print();
  } catch (e) {}
}

function downloadCheckoutSummaryDocument() {
  var sheetEl = document.getElementById("checkout-print-summary-sheet");
  var summary = renderCheckoutPrintSummarySheet();
  if (!sheetEl || !summary) return;

  var docHtml =
    "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Voltbox Order Summary " + esc(summary.summaryId) + "</title>" +
    "<style>body{font-family:sans-serif;padding:32px;color:#0f172a;max-width:760px;margin:0 auto;}" +
    ".ps-doc-head{display:flex;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:16px;}" +
    ".ps-brand-title{font-size:20px;font-weight:800;}.ps-customer-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#f8fafc;padding:12px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:16px;}" +
    "table{width:100%;border-collapse:collapse;margin-bottom:16px;}th,td{padding:8px;border-bottom:1px solid #cbd5e1;text-align:left;}th.num,td.num{text-align:right;}" +
    ".ps-totals-box{margin-left:auto;max-width:300px;}.ps-total-row{display:flex;justify-content:space-between;padding:4px 0;}.ps-total-row.grand{border-top:2px solid #0f172a;font-weight:800;font-size:16px;margin-top:6px;padding-top:8px;}" +
    ".ps-doc-footer{margin-top:20px;padding-top:10px;border-top:1px dashed #94a3b8;display:flex;justify-content:space-between;font-size:12px;color:#64748b;}</style>" +
    "</head><body>" + sheetEl.innerHTML + "</body></html>";

  var blob = new Blob([docHtml], { type: "text/html;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  triggerDownload(url, "voltbox-order-summary-" + summary.summaryId.toLowerCase() + ".html");
  setTimeout(function () { URL.revokeObjectURL(url); }, 2000);

  var msgEl = document.getElementById("checkout-print-summary-msg");
  if (msgEl) {
    msgEl.className = "modal-msg";
    msgEl.textContent = "✓ Downloaded printable order summary (" + summary.summaryId + ".html).";
    msgEl.hidden = false;
  }
  showActivityToast("Downloaded Order Summary (" + summary.summaryId + ")");
}

// ── Advanced Settings Controller ──

function loadAdvancedSettings() {
  try {
    var raw = localStorage.getItem(ADV_SETTINGS_STORAGE_KEY);
    var parsed = raw ? JSON.parse(raw) : null;
    if (window.VoltboxQR && typeof window.VoltboxQR.resolveAdvancedSettings === "function") {
      window.voltboxAdvSettings = window.VoltboxQR.resolveAdvancedSettings(parsed);
    } else if (parsed && typeof parsed === "object") {
      window.voltboxAdvSettings = Object.assign({}, window.voltboxAdvSettings, parsed);
    }
  } catch (e) {}
  applyAdvancedSettingsToDom();
}

function applyAdvancedSettingsToDom() {
  var s = window.voltboxAdvSettings;
  if (!s) return;

  setQrAudioPingEnabled(Boolean(s.audioPingEnabled));
  document.body.setAttribute("data-grid-density", s.gridDensity === "compact" ? "compact" : "comfortable");
  document.body.setAttribute("data-bg-anim", s.backgroundAnimationEnabled === false ? "off" : "on");
  document.body.setAttribute("data-dual-currency", s.showDualCurrencyInr ? "true" : "false");

  var pingToggle = document.getElementById("adv-audio-ping-toggle");
  var profileSelect = document.getElementById("adv-audio-profile-select");
  var wishToastToggle = document.getElementById("adv-wishlist-toast-toggle");
  var toastDurSelect = document.getElementById("adv-toast-duration-select");
  var parallaxToggle = document.getElementById("adv-parallax-toggle");
  var bgAnimToggle = document.getElementById("adv-bg-anim-toggle");
  var densitySelect = document.getElementById("adv-grid-density-select");
  var dualCurrToggle = document.getElementById("adv-dual-currency-toggle");

  if (pingToggle) pingToggle.checked = Boolean(s.audioPingEnabled);
  if (profileSelect) profileSelect.value = s.audioPingProfile || "subtle";
  if (wishToastToggle) wishToastToggle.checked = Boolean(s.wishlistToastsEnabled);
  if (toastDurSelect) toastDurSelect.value = String(s.toastDurationMs || 3800);
  if (parallaxToggle) parallaxToggle.checked = Boolean(s.cardParallaxTiltEnabled);
  if (bgAnimToggle) bgAnimToggle.checked = Boolean(s.backgroundAnimationEnabled);
  if (densitySelect) densitySelect.value = s.gridDensity || "comfortable";
  if (dualCurrToggle) dualCurrToggle.checked = Boolean(s.showDualCurrencyInr);
}

function readAdvancedSettingsFromForm() {
  var pingToggle = document.getElementById("adv-audio-ping-toggle");
  var profileSelect = document.getElementById("adv-audio-profile-select");
  var wishToastToggle = document.getElementById("adv-wishlist-toast-toggle");
  var toastDurSelect = document.getElementById("adv-toast-duration-select");
  var parallaxToggle = document.getElementById("adv-parallax-toggle");
  var bgAnimToggle = document.getElementById("adv-bg-anim-toggle");
  var densitySelect = document.getElementById("adv-grid-density-select");
  var dualCurrToggle = document.getElementById("adv-dual-currency-toggle");

  var candidate = {
    audioPingEnabled: pingToggle ? pingToggle.checked : true,
    audioPingProfile: profileSelect ? profileSelect.value : "subtle",
    wishlistToastsEnabled: wishToastToggle ? wishToastToggle.checked : true,
    toastDurationMs: toastDurSelect ? Number(toastDurSelect.value) : 3800,
    cardParallaxTiltEnabled: parallaxToggle ? parallaxToggle.checked : true,
    backgroundAnimationEnabled: bgAnimToggle ? bgAnimToggle.checked : true,
    gridDensity: densitySelect ? densitySelect.value : "comfortable",
    showDualCurrencyInr: dualCurrToggle ? dualCurrToggle.checked : false,
    autoExpandCheckoutSummary: true
  };

  if (window.VoltboxQR && typeof window.VoltboxQR.resolveAdvancedSettings === "function") {
    window.voltboxAdvSettings = window.VoltboxQR.resolveAdvancedSettings(candidate);
  } else {
    window.voltboxAdvSettings = candidate;
  }

  try {
    localStorage.setItem(ADV_SETTINGS_STORAGE_KEY, JSON.stringify(window.voltboxAdvSettings));
  } catch (e) {}

  applyAdvancedSettingsToDom();
}

function openAdvancedSettingsModal() {
  var overlay = document.getElementById("advanced-settings-overlay");
  if (!overlay) return;
  closeAllSheets();
  applyAdvancedSettingsToDom();
  openModal(overlay);
}

function closeAdvancedSettingsModal() {
  var overlay = document.getElementById("advanced-settings-overlay");
  if (!overlay) return;
  closeModal(overlay);
}

function initCheckoutPrintSummaryAndAdvancedSettings() {
  loadAdvancedSettings();

  // Toast inline buttons (Undo / View Wishlist / Dismiss)
  var toastDismissBtn = document.getElementById("toast-dismiss-btn");
  if (toastDismissBtn) {
    toastDismissBtn.addEventListener("click", dismissActivityToast);
  }

  var toastUndoBtn = document.getElementById("toast-undo-btn");
  if (toastUndoBtn) {
    toastUndoBtn.addEventListener("click", function () {
      var pid = lastWishlistToastProductId;
      dismissActivityToast();
      if (pid) {
        toggleWishlist(null, pid);
      }
    });
  }

  var toastViewWishBtn = document.getElementById("toast-view-wishlist-btn");
  if (toastViewWishBtn) {
    toastViewWishBtn.addEventListener("click", function () {
      dismissActivityToast();
      var wishTab = document.querySelector('.filter-tab[data-filter="wishlist"]');
      if (wishTab) {
        wishTab.click();
      }
    });
  }

  // Checkout Print Summary buttons
  var printSummaryBtn = document.getElementById("checkout-print-summary-btn");
  if (printSummaryBtn) {
    printSummaryBtn.addEventListener("click", window.openCheckoutPrintSummary);
  }

  var printSummaryBackBtn = document.getElementById("checkout-print-summary-back-btn");
  if (printSummaryBackBtn) {
    printSummaryBackBtn.addEventListener("click", window.closeCheckoutPrintSummary);
  }

  var printSummaryBackFooterBtn = document.getElementById("checkout-summary-back-footer-btn");
  if (printSummaryBackFooterBtn) {
    printSummaryBackFooterBtn.addEventListener("click", window.closeCheckoutPrintSummary);
  }

  var printSummaryExecBtn = document.getElementById("checkout-summary-print-exec-btn");
  if (printSummaryExecBtn) {
    printSummaryExecBtn.addEventListener("click", executeCheckoutPrintSummary);
  }

  var printSummaryDownloadBtn = document.getElementById("checkout-summary-download-btn");
  if (printSummaryDownloadBtn) {
    printSummaryDownloadBtn.addEventListener("click", downloadCheckoutSummaryDocument);
  }

  // Advanced Settings buttons
  var topbarSettingsBtn = document.getElementById("topbar-settings-btn");
  if (topbarSettingsBtn) {
    topbarSettingsBtn.addEventListener("click", openAdvancedSettingsModal);
  }

  var profileSettingsBtn = document.getElementById("open-advanced-settings-btn");
  if (profileSettingsBtn) {
    profileSettingsBtn.addEventListener("click", openAdvancedSettingsModal);
  }

  var advCloseBtn = document.getElementById("advanced-settings-close");
  if (advCloseBtn) {
    advCloseBtn.addEventListener("click", closeAdvancedSettingsModal);
  }

  var advOverlay = document.getElementById("advanced-settings-overlay");
  if (advOverlay) {
    advOverlay.addEventListener("click", function (e) {
      if (e.target === advOverlay) closeAdvancedSettingsModal();
    });
  }

  var advDoneBtn = document.getElementById("adv-settings-done-btn");
  if (advDoneBtn) {
    advDoneBtn.addEventListener("click", function () {
      readAdvancedSettingsFromForm();
      closeAdvancedSettingsModal();
      showActivityToast("Advanced storefront settings saved & applied!");
    });
  }

  var advResetBtn = document.getElementById("adv-reset-defaults-btn");
  if (advResetBtn) {
    advResetBtn.addEventListener("click", function () {
      window.voltboxAdvSettings = (window.VoltboxQR && window.VoltboxQR.DEFAULT_ADVANCED_SETTINGS)
        ? Object.assign({}, window.VoltboxQR.DEFAULT_ADVANCED_SETTINGS)
        : {
            audioPingEnabled: true,
            audioPingProfile: "subtle",
            wishlistToastsEnabled: true,
            toastDurationMs: 3800,
            cardParallaxTiltEnabled: true,
            backgroundAnimationEnabled: true,
            gridDensity: "comfortable",
            showDualCurrencyInr: false,
            autoExpandCheckoutSummary: true
          };
      try {
        localStorage.setItem(ADV_SETTINGS_STORAGE_KEY, JSON.stringify(window.voltboxAdvSettings));
      } catch (e) {}
      applyAdvancedSettingsToDom();
      showActivityToast("Advanced settings restored to studio defaults.");
    });
  }

  var advTestPingBtn = document.getElementById("adv-test-ping-btn");
  if (advTestPingBtn) {
    advTestPingBtn.addEventListener("click", function () {
      readAdvancedSettingsFromForm();
      initOrResumeQrAudioContext();
      playScanSuccessChime(true);
      showActivityToast("Previewed '" + (window.voltboxAdvSettings.audioPingProfile || "subtle") + "' acoustic ping!");
    });
  }

  // Live change sync inside Advanced Settings modal
  var advInputs = [
    "adv-audio-ping-toggle",
    "adv-audio-profile-select",
    "adv-wishlist-toast-toggle",
    "adv-toast-duration-select",
    "adv-parallax-toggle",
    "adv-bg-anim-toggle",
    "adv-grid-density-select",
    "adv-dual-currency-toggle"
  ];
  for (var k = 0; k < advInputs.length; k++) {
    var el = document.getElementById(advInputs[k]);
    if (el) {
      el.addEventListener("change", readAdvancedSettingsFromForm);
    }
  }

  // Wire up Full Order History Page controls
  initOrderHistoryPageControls();
  // Wire up Verified Buyer Review & Rating controls inside #spec-drawer
  initProductReviewsControls();
  // Wire up Admin Catalog Grid Batch Edit Mode controls
  initCatalogBatchEditControls();
}

// ============================================================================
// FULL ORDER HISTORY PAGE (PAST PURCHASES, RECEIPTS, STATUS & ITEM BREAKDOWNS)
// ============================================================================

var orderHistoryAllOrders = [];
var orderHistoryFilteredOrders = [];
var orderHistorySummary = null;
var orderHistorySelectedOrderId = null;
var orderHistoryActiveStatus = "all";
var orderHistorySearchQuery = "";
var orderHistorySortBy = "newest";
var isOrderHistoryPageOpen = false;

function normalizeClientOrderForHistory(rawOrder) {
  if (window.VoltboxQR && typeof window.VoltboxQR.enrichOrderForHistory === "function") {
    return window.VoltboxQR.enrichOrderForHistory(rawOrder, products || [], Date.now());
  }
  return rawOrder;
}

function computeClientOrderSummary(ordersList) {
  if (window.VoltboxQR && typeof window.VoltboxQR.computeOrderHistorySummary === "function") {
    return window.VoltboxQR.computeOrderHistorySummary(ordersList);
  }
  var totalSpent = 0;
  var totalItems = 0;
  var totalSavings = 0;
  var counts = { all: ordersList.length, placed: 0, processing: 0, shipped: 0, delivered: 0 };
  for (var i = 0; i < ordersList.length; i++) {
    var o = ordersList[i];
    totalSpent += Number(o.total || 0);
    totalItems += Number(o.count || 0);
    totalSavings += Number(o.discountTotal || 0);
    var sk = o.stageKey || "placed";
    if (sk === "delivered") counts.delivered++;
    else if (sk === "shipped") counts.shipped++;
    else if (sk === "processing") counts.processing++;
    else counts.placed++;
  }
  return {
    totalOrders: ordersList.length,
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalItemsPurchased: totalItems,
    totalSavings: Math.round(totalSavings * 100) / 100,
    averageOrderValue: ordersList.length > 0 ? Math.round((totalSpent / ordersList.length) * 100) / 100 : 0,
    statusCounts: counts
  };
}

function filterClientOrders(ordersList) {
  if (window.VoltboxQR && typeof window.VoltboxQR.filterAndSortOrderHistory === "function") {
    return window.VoltboxQR.filterAndSortOrderHistory(ordersList, {
      statusFilter: orderHistoryActiveStatus,
      searchQuery: orderHistorySearchQuery,
      sortBy: orderHistorySortBy
    });
  }
  return ordersList;
}

window.openOrderHistoryPage = function (focusOrderId) {
  closeAllSheets();
  isOrderHistoryPageOpen = true;

  var pageEl = document.getElementById("order-history-page");
  var studioStripEl = document.getElementById("studio-command-strip");
  var toolbarSectionEl = document.getElementById("catalog-toolbar-section");
  var gridEl = document.getElementById("product-grid");
  var orderBarEl = document.getElementById("order-bar");
  var compareDockEl = document.getElementById("compare-dock");
  var topbarOrdersBtn = document.getElementById("topbar-orders-btn");

  if (studioStripEl) studioStripEl.hidden = true;
  if (toolbarSectionEl) toolbarSectionEl.hidden = true;
  if (gridEl) gridEl.hidden = true;
  if (orderBarEl) orderBarEl.hidden = true;
  if (compareDockEl) compareDockEl.classList.remove("open");

  if (pageEl) {
    pageEl.hidden = false;
  }
  if (topbarOrdersBtn) {
    topbarOrdersBtn.classList.add("active");
    topbarOrdersBtn.setAttribute("aria-pressed", "true");
  }

  if (focusOrderId) {
    orderHistorySelectedOrderId = String(focusOrderId);
  }

  try {
    if (window.location.pathname !== "/orders" && window.location.pathname !== "/order-history") {
      window.history.replaceState({ view: "orders" }, "", "/?view=orders");
    }
  } catch (e) {}

  window.scrollTo({ top: 0, behavior: "smooth" });
  fetchAndRenderOrderHistoryPage(focusOrderId);
};

window.closeOrderHistoryPage = function () {
  isOrderHistoryPageOpen = false;

  var pageEl = document.getElementById("order-history-page");
  var studioStripEl = document.getElementById("studio-command-strip");
  var toolbarSectionEl = document.getElementById("catalog-toolbar-section");
  var gridEl = document.getElementById("product-grid");
  var orderBarEl = document.getElementById("order-bar");
  var topbarOrdersBtn = document.getElementById("topbar-orders-btn");

  if (pageEl) pageEl.hidden = true;
  if (studioStripEl) studioStripEl.hidden = false;
  if (toolbarSectionEl) toolbarSectionEl.hidden = false;
  if (gridEl) gridEl.hidden = false;
  if (orderBarEl) orderBarEl.hidden = false;

  if (topbarOrdersBtn) {
    topbarOrdersBtn.classList.remove("active");
    topbarOrdersBtn.setAttribute("aria-pressed", "false");
  }

  if (typeof updateCompareUI === "function") {
    updateCompareUI();
  }

  try {
    if (window.location.pathname === "/orders" || window.location.pathname === "/order-history" || window.location.search.indexOf("view=orders") !== -1) {
      window.history.replaceState({ view: "catalog" }, "", "/");
    }
  } catch (e) {}
};

function fetchAndRenderOrderHistoryPage(preferredOrderId) {
  var listEl = document.getElementById("oh-orders-list");
  if (listEl && orderHistoryAllOrders.length === 0) {
    listEl.innerHTML =
      '<div class="oh-loading-state">' +
        '<div class="spinner"></div>' +
        '<p>Loading purchase ledger &amp; verified receipts from backend…</p>' +
      '</div>';
  }

  api("/api/orders/history")
    .then(function (res) {
      if (!res.ok) throw new Error("Fallback to /api/orders");
      return res.json();
    })
    .then(function (payload) {
      var rawList = (payload && Array.isArray(payload.allOrders))
        ? payload.allOrders
        : (Array.isArray(payload) ? payload : []);
      orderHistoryAllOrders = rawList.map(normalizeClientOrderForHistory);
      orderHistorySummary = (payload && payload.summary) ? payload.summary : computeClientOrderSummary(orderHistoryAllOrders);
      paintHistoryCount(orderHistoryAllOrders.length);
      if (preferredOrderId) {
        orderHistorySelectedOrderId = String(preferredOrderId);
      }
      refreshOrderHistoryView();
    })
    .catch(function () {
      api("/api/orders")
        .then(function (r) { return r.json(); })
        .then(function (orders) {
          var arr = Array.isArray(orders) ? orders : [];
          orderHistoryAllOrders = arr.map(normalizeClientOrderForHistory);
          orderHistorySummary = computeClientOrderSummary(orderHistoryAllOrders);
          paintHistoryCount(orderHistoryAllOrders.length);
          if (preferredOrderId) {
            orderHistorySelectedOrderId = String(preferredOrderId);
          }
          refreshOrderHistoryView();
        })
        .catch(function () {
          if (listEl) {
            listEl.innerHTML = '<div class="oh-empty-state"><p>Could not load order history from backend.</p></div>';
          }
        });
    });
}

function refreshOrderHistoryView() {
  var summary = computeClientOrderSummary(orderHistoryAllOrders);
  orderHistorySummary = summary;

  // 1. Update Metrics Ribbon
  var ordersEl = document.getElementById("oh-metric-orders");
  var ordersSubEl = document.getElementById("oh-metric-orders-sub");
  var spendEl = document.getElementById("oh-metric-spend");
  var spendSubEl = document.getElementById("oh-metric-spend-sub");
  var itemsEl = document.getElementById("oh-metric-items");
  var itemsSubEl = document.getElementById("oh-metric-items-sub");
  var avgEl = document.getElementById("oh-metric-avg");
  var savedEl = document.getElementById("oh-metric-saved");

  if (ordersEl) ordersEl.textContent = summary.totalOrders + (summary.totalOrders === 1 ? " Order" : " Orders");
  if (ordersSubEl) {
    ordersSubEl.textContent = summary.statusCounts.delivered + " delivered · " +
      (summary.statusCounts.shipped + summary.statusCounts.processing + summary.statusCounts.placed) + " active";
  }
  if (spendEl) spendEl.textContent = "$" + summary.totalSpent.toFixed(2);
  if (spendSubEl) {
    var inrTotal = Math.round(summary.totalSpent * 83.5).toLocaleString("en-IN");
    spendSubEl.textContent = "≈ ₹" + inrTotal + " INR · Verified tax invoices";
  }
  if (itemsEl) itemsEl.textContent = summary.totalItemsPurchased + (summary.totalItemsPurchased === 1 ? " Unit" : " Units");
  if (itemsSubEl) {
    itemsSubEl.textContent = "Across " + summary.totalOrders + " verified studio shipments";
  }
  if (avgEl) avgEl.textContent = "$" + summary.averageOrderValue.toFixed(2) + " avg";
  if (savedEl) {
    savedEl.textContent = summary.totalSavings > 0
      ? ("$" + summary.totalSavings.toFixed(2) + " saved via Rig & Promo discounts")
      : "5% Rig & VOLT10 bundle eligible";
  }

  // 2. Update Status Tab Badges
  var countAllEl = document.getElementById("oh-count-all");
  var countPlacedEl = document.getElementById("oh-count-placed");
  var countProcEl = document.getElementById("oh-count-processing");
  var countShipEl = document.getElementById("oh-count-shipped");
  var countDelivEl = document.getElementById("oh-count-delivered");

  if (countAllEl) countAllEl.textContent = String(summary.statusCounts.all);
  if (countPlacedEl) countPlacedEl.textContent = String(summary.statusCounts.placed);
  if (countProcEl) countProcEl.textContent = String(summary.statusCounts.processing);
  if (countShipEl) countShipEl.textContent = String(summary.statusCounts.shipped);
  if (countDelivEl) countDelivEl.textContent = String(summary.statusCounts.delivered);

  // 3. Filter and Sort Orders
  orderHistoryFilteredOrders = filterClientOrders(orderHistoryAllOrders);

  // Ensure a valid selected order for the Receipt Inspector
  var selectedOrder = null;
  if (orderHistorySelectedOrderId) {
    for (var i = 0; i < orderHistoryFilteredOrders.length; i++) {
      if (orderHistoryFilteredOrders[i].id === orderHistorySelectedOrderId) {
        selectedOrder = orderHistoryFilteredOrders[i];
        break;
      }
    }
  }
  if (!selectedOrder && orderHistoryFilteredOrders.length > 0) {
    selectedOrder = orderHistoryFilteredOrders[0];
    orderHistorySelectedOrderId = selectedOrder.id;
  }

  var metaEl = document.getElementById("oh-results-meta");
  if (metaEl) {
    metaEl.innerHTML =
      'Showing <strong>' + orderHistoryFilteredOrders.length + '</strong> of <strong>' +
      orderHistoryAllOrders.length + '</strong> past purchase' + (orderHistoryAllOrders.length === 1 ? '' : 's') +
      (orderHistoryActiveStatus !== "all" ? ' · Status: <span class="oh-meta-pill">' + esc(orderHistoryActiveStatus.toUpperCase()) + '</span>' : '') +
      (orderHistorySearchQuery ? ' · Search: <span class="oh-meta-pill">"' + esc(orderHistorySearchQuery) + '"</span>' : '');
  }

  renderOrderHistoryCards(orderHistoryFilteredOrders, selectedOrder ? selectedOrder.id : null);
  renderOrderHistoryInspector(selectedOrder);
}

function getOrderStatusBadgeClass(stageKey) {
  if (stageKey === "delivered") return "oh-status-pill status-delivered";
  if (stageKey === "shipped") return "oh-status-pill status-shipped";
  if (stageKey === "processing") return "oh-status-pill status-processing";
  return "oh-status-pill status-placed";
}

function renderOrderHistoryCards(ordersList, activeId) {
  var listEl = document.getElementById("oh-orders-list");
  if (!listEl) return;

  if (!Array.isArray(ordersList) || ordersList.length === 0) {
    listEl.innerHTML =
      '<div class="oh-empty-state" data-testid="oh-empty-state">' +
        '<div class="oh-empty-icon">' + icon("clipboard-check", 28) + '</div>' +
        '<h3>No matching orders found</h3>' +
        '<p>' + (orderHistoryAllOrders.length === 0
          ? 'You haven\'t completed a hardware checkout yet. Add components to your cart and complete checkout to generate your first receipt.'
          : 'No past purchases match your current status filter or search query.') + '</p>' +
        (orderHistoryAllOrders.length > 0
          ? '<button type="button" class="oh-action-btn primary" onclick="resetOrderHistoryFilters()">Reset Order Filters</button>'
          : '<button type="button" class="oh-action-btn primary" onclick="closeOrderHistoryPage()">Browse Hardware Catalog</button>') +
      '</div>';
    return;
  }

  var html = "";
  for (var i = 0; i < ordersList.length; i++) {
    var ord = ordersList[i];
    var isSelected = ord.id === activeId;
    var lines = Array.isArray(ord.lines) ? ord.lines : [];
    var stageKey = ord.stageKey || "placed";
    var stages = (ord.timeline && Array.isArray(ord.timeline.stages)) ? ord.timeline.stages : [];

    // Mini 4-step progress strip
    var stepsHtml = '<div class="oh-mini-steps">';
    var stageLabels = ["Order Placed", "Processing", "Shipped", "Delivered"];
    for (var s = 0; s < 4; s++) {
      var stState = s < ord.stageIndex ? "done" : (s === ord.stageIndex ? "current" : "upcoming");
      var stLabel = stages[s] ? stages[s].label : stageLabels[s];
      stepsHtml +=
        '<div class="oh-mini-step ' + stState + '">' +
          '<span class="oh-mini-dot"></span>' +
          '<span class="oh-mini-label">' + esc(stLabel) + '</span>' +
        '</div>';
    }
    stepsHtml += '</div>';

    // Itemized breakdown rows
    var itemsRowsHtml = "";
    for (var l = 0; l < lines.length; l++) {
      var ln = lines[l];
      var lnImg = getProductImageUrl(ln);
      var lnSku = ln.sku || ("VB-PRT-" + String(ln.productId || 1).padStart(3, "0"));
      var lnSub = typeof ln.lineSubtotal === "number" ? ln.lineSubtotal : (Number(ln.price || 0) * Number(ln.qty || 1));
      itemsRowsHtml +=
        '<div class="oh-line-item" data-testid="oh-line-item">' +
          '<div class="oh-line-left">' +
            '<img class="oh-line-thumb" src="' + esc(lnImg) + '" alt="' + esc(ln.title || "Component") + '" onerror="this.onerror=null;this.src=NO_IMAGE" />' +
            '<div class="oh-line-meta">' +
              '<div class="oh-line-title-row">' +
                '<span class="oh-line-title">' + esc(ln.title || "Hardware Component") + '</span>' +
                '<span class="oh-line-sku">' + esc(lnSku) + '</span>' +
              '</div>' +
              '<div class="oh-line-sub">' +
                '<span>Qty: <strong>' + (ln.qty || 1) + '</strong> &times; $' + Number(ln.price || 0).toFixed(2) + '</span>' +
                '<span class="oh-dot-sep">·</span>' +
                '<span>' + (ln.sharePercent || 100) + '% of order subtotal</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="oh-line-right">' +
            '<strong class="oh-line-total">$' + lnSub.toFixed(2) + '</strong>' +
            '<div class="oh-line-btn-group">' +
              '<button type="button" class="oh-review-part-chip" data-testid="oh-review-part-' + Number(ln.productId || 0) + '" onclick="event.stopPropagation();openSpecDrawerToReviews(' + Number(ln.productId || 0) + ')" title="Rate and review ' + esc(ln.title || "this component") + '">' +
                '<span>&#9733; Review Part</span>' +
              '</button>' +
              '<button type="button" class="oh-buy-again-chip" onclick="event.stopPropagation();buyAgainSingleItem(' + Number(ln.productId || 0) + ')" title="Add ' + esc(ln.title || "item") + ' to cart">' +
                icon("cart", 11) + ' <span>Buy Again</span>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    html +=
      '<article class="oh-order-card' + (isSelected ? ' selected' : '') + '" data-order-id="' + esc(ord.id) + '" data-testid="oh-order-card-' + esc(ord.id) + '" onclick="selectOrderInHistory(\'' + esc(ord.id) + '\')">' +
        '<div class="oh-card-head">' +
          '<div class="oh-card-head-left">' +
            '<div class="oh-order-id-row">' +
              '<span class="oh-order-id" data-testid="oh-card-order-id">#' + esc(ord.id) + '</span>' +
              '<span class="oh-receipt-code" title="Official Receipt Verification Code">' + esc(ord.receiptCode || ("RCPT-" + ord.id)) + '</span>' +
              '<span class="' + getOrderStatusBadgeClass(stageKey) + '" data-testid="oh-card-status">' +
                '<span class="oh-status-dot"></span>' +
                '<span>' + esc(ord.status || "Order Placed") + '</span>' +
              '</span>' +
            '</div>' +
            '<div class="oh-order-meta-row">' +
              '<span>Placed ' + esc(ord.formattedDate || formatDate(new Date(ord.placedAt))) + '</span>' +
              '<span class="oh-dot-sep">·</span>' +
              '<span>' + ord.count + (ord.count === 1 ? ' component' : ' components') + ' (' + lines.length + (lines.length === 1 ? ' SKU' : ' SKUs') + ')</span>' +
              '<span class="oh-dot-sep">·</span>' +
              '<span class="oh-pay-method-tag">' + esc(ord.paymentMethod || "Verified Payment") + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="oh-card-head-right">' +
            '<span class="oh-card-total-label">TOTAL PAID</span>' +
            '<strong class="oh-card-total-val" data-testid="oh-card-total">$' + Number(ord.total || 0).toFixed(2) + '</strong>' +
          '</div>' +
        '</div>' +

        '<div class="oh-card-fulfillment-strip">' +
          '<div class="oh-fulfillment-top">' +
            '<span class="oh-carrier-info">' +
              icon("truck", 13) +
              ' <strong>' + esc(ord.carrierName || "BlueDart Express") + '</strong> · AWB: <code>' + esc(ord.trackingNumber || "VB-TRK-882194") + '</code>' +
            '</span>' +
            '<span class="oh-dest-info">Ship to: <strong>' + esc(ord.shippingName || "Valued Builder") + '</strong> (' + esc(ord.shippingAddress || "Verified Address") + ')</span>' +
          '</div>' +
          stepsHtml +
        '</div>' +

        '<div class="oh-card-items-section">' +
          '<div class="oh-section-kicker">ITEMIZED COMPONENT BREAKDOWN</div>' +
          '<div class="oh-line-items-list">' +
            itemsRowsHtml +
          '</div>' +
        '</div>' +

        '<div class="oh-card-footer">' +
          '<div class="oh-financial-pills">' +
            '<span class="oh-fin-pill">Subtotal: <strong>$' + Number(ord.subtotal || 0).toFixed(2) + '</strong></span>' +
            (ord.discountTotal > 0
              ? '<span class="oh-fin-pill discount">Saved: <strong>−$' + Number(ord.discountTotal).toFixed(2) + '</strong></span>'
              : '') +
            '<span class="oh-fin-pill">Tax (8.25%): <strong>$' + Number(ord.tax || 0).toFixed(2) + '</strong></span>' +
            '<span class="oh-fin-pill total">Receipt Total: <strong>$' + Number(ord.total || 0).toFixed(2) + '</strong></span>' +
          '</div>' +
          '<div class="oh-card-actions">' +
            '<button type="button" class="oh-card-btn inspect' + (isSelected ? ' active' : '') + '" onclick="event.stopPropagation();selectOrderInHistory(\'' + esc(ord.id) + '\')">' +
              icon("clipboard-check", 13) + ' <span>Receipt Details</span>' +
            '</button>' +
            '<button type="button" class="oh-card-btn thermal" data-testid="oh-thermal-btn-' + esc(ord.id) + '" onclick="event.stopPropagation();openHistoryOrderThermalBill(\'' + esc(ord.id) + '\')">' +
              icon("printer", 13) + ' <span>Thermal Bill</span>' +
            '</button>' +
            '<button type="button" class="oh-card-btn track" data-testid="oh-track-btn-' + esc(ord.id) + '" onclick="event.stopPropagation();openOrderTrackingDashboard(\'' + esc(ord.id) + '\')">' +
              icon("truck", 13) + ' <span>Live Track</span>' +
            '</button>' +
            '<button type="button" class="oh-card-btn reorder" data-testid="oh-reorder-btn-' + esc(ord.id) + '" onclick="event.stopPropagation();reorderEntirePastOrder(\'' + esc(ord.id) + '\')">' +
              icon("cart", 13) + ' <span>Reorder All</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  listEl.innerHTML = html;
}

function renderOrderHistoryInspector(ord) {
  var inspectorEl = document.getElementById("oh-receipt-inspector");
  if (!inspectorEl) return;

  if (!ord) {
    inspectorEl.innerHTML =
      '<div class="oh-inspector-card empty">' +
        '<p class="oh-inspector-empty-msg">Select any order on the left to inspect its official tax receipt, itemized SKU breakdown, and live fulfillment timeline.</p>' +
      '</div>';
    return;
  }

  var lines = Array.isArray(ord.lines) ? ord.lines : [];
  var stages = (ord.timeline && Array.isArray(ord.timeline.stages)) ? ord.timeline.stages : [];
  var stageKey = ord.stageKey || "placed";
  var canAdvance = ord.stageIndex < 3;

  var timelineRowsHtml = "";
  for (var s = 0; s < stages.length; s++) {
    var st = stages[s];
    timelineRowsHtml +=
      '<div class="oh-insp-stage ' + esc(st.state) + '">' +
        '<div class="oh-insp-stage-marker">' +
          (st.state === "completed" ? icon("check", 11) : (s + 1)) +
        '</div>' +
        '<div class="oh-insp-stage-body">' +
          '<div class="oh-insp-stage-top">' +
            '<strong>' + esc(st.label) + '</strong>' +
            '<span>' + esc(st.timestamp) + '</span>' +
          '</div>' +
          '<div class="oh-insp-stage-sub">' + esc(st.subtitle) + '</div>' +
        '</div>' +
      '</div>';
  }

  var breakdownRowsHtml = "";
  for (var i = 0; i < lines.length; i++) {
    var ln = lines[i];
    var lnSub = typeof ln.lineSubtotal === "number" ? ln.lineSubtotal : (Number(ln.price || 0) * Number(ln.qty || 1));
    breakdownRowsHtml +=
      '<tr>' +
        '<td>' +
          '<div class="oh-insp-item-name">' + esc(ln.title || "Component") + '</div>' +
          '<div class="oh-insp-item-sku">' + esc(ln.sku || ("VB-PRT-" + ln.productId)) + '</div>' +
        '</td>' +
        '<td class="num">' + (ln.qty || 1) + ' &times; $' + Number(ln.price || 0).toFixed(2) + '</td>' +
        '<td class="num strong">$' + lnSub.toFixed(2) + '</td>' +
      '</tr>';
  }

  var qrSvgHtml = typeof receiptQrSvg === "function" ? receiptQrSvg(ord.id) : "";
  var barcodeHtml = typeof receiptBarcodeSvg === "function" ? receiptBarcodeSvg(ord.id) : "";

  inspectorEl.innerHTML =
    '<div class="oh-inspector-card" data-testid="oh-inspector-card" data-inspected-order="' + esc(ord.id) + '">' +
      '<div class="oh-insp-header">' +
        '<div class="oh-insp-header-top">' +
          '<span class="oh-insp-kicker">OFFICIAL TAX INVOICE &amp; RECEIPT</span>' +
          '<span class="' + getOrderStatusBadgeClass(stageKey) + '" id="oh-inspector-status-badge">' +
            '<span class="oh-status-dot"></span>' +
            '<span>' + esc(ord.status || "Order Placed") + '</span>' +
          '</span>' +
        '</div>' +
        '<h3 class="oh-insp-title" id="oh-inspector-order-id">Order #' + esc(ord.id) + '</h3>' +
        '<div class="oh-insp-submeta">' +
          '<span>Receipt <code>' + esc(ord.receiptCode || ("RCPT-" + ord.id)) + '</code></span>' +
          '<span>·</span>' +
          '<span>' + esc(ord.formattedDate || formatDate(new Date(ord.placedAt))) + '</span>' +
        '</div>' +
      '</div>' +

      '<div class="oh-insp-section">' +
        '<div class="oh-insp-section-head">' +
          '<span>FULFILLMENT STATUS (' + (ord.progressPercent || 0) + '%)</span>' +
          '<button type="button" class="oh-insp-advance-btn" id="oh-inspector-advance-btn" data-testid="oh-inspector-advance-btn" onclick="advanceHistoryOrderStage(\'' + esc(ord.id) + '\')">' +
            icon("bolt", 11) + ' <span>' + (canAdvance ? ("Advance → " + esc(ord.timeline.nextStage || "Next Stage")) : "Reset to Order Placed") + '</span>' +
          '</button>' +
        '</div>' +
        '<div class="oh-insp-timeline">' +
          timelineRowsHtml +
        '</div>' +
      '</div>' +

      '<div class="oh-insp-section">' +
        '<div class="oh-insp-section-head">' +
          '<span>RECEIPT &amp; DELIVERY DETAILS</span>' +
        '</div>' +
        '<div class="oh-insp-kv-grid">' +
          '<div class="oh-insp-kv">' +
            '<span class="k">Recipient</span>' +
            '<strong class="v">' + esc(ord.shippingName || "Valued Builder") + '</strong>' +
          '</div>' +
          '<div class="oh-insp-kv">' +
            '<span class="k">Payment Method</span>' +
            '<strong class="v">' + esc(ord.paymentMethod || "Verified Digital Payment") + '</strong>' +
          '</div>' +
          '<div class="oh-insp-kv full">' +
            '<span class="k">Shipping Destination</span>' +
            '<strong class="v">' + esc(ord.shippingAddress || "42 Circuit Lane, Silicon Bay") + '</strong>' +
          '</div>' +
          '<div class="oh-insp-kv">' +
            '<span class="k">Carrier &amp; AWB</span>' +
            '<strong class="v">' + esc(ord.carrierName || "BlueDart Express") + ' (' + esc(ord.trackingNumber || "VB-TRK") + ')</strong>' +
          '</div>' +
          '<div class="oh-insp-kv">' +
            '<span class="k">Est. Delivery</span>' +
            '<strong class="v">' + esc(ord.estimatedDelivery || "Scheduled") + '</strong>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="oh-insp-section">' +
        '<div class="oh-insp-section-head">' +
          '<span>ITEMIZED COST BREAKDOWN (' + ord.count + (ord.count === 1 ? ' ITEM' : ' ITEMS') + ')</span>' +
        '</div>' +
        '<table class="oh-insp-table" data-testid="oh-inspector-breakdown-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Component / SKU</th>' +
              '<th class="num">Qty &times; Unit</th>' +
              '<th class="num">Total</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' +
            breakdownRowsHtml +
          '</tbody>' +
        '</table>' +

        '<div class="oh-insp-ledger">' +
          '<div class="oh-insp-ledger-row">' +
            '<span>Subtotal (' + ord.count + (ord.count === 1 ? ' unit' : ' units') + ')</span>' +
            '<span>$' + Number(ord.subtotal || 0).toFixed(2) + '</span>' +
          '</div>' +
          (ord.rigDiscount > 0
            ? '<div class="oh-insp-ledger-row discount"><span>Rig Bundle Discount (5%)</span><span>−$' + Number(ord.rigDiscount).toFixed(2) + '</span></div>'
            : '') +
          (ord.promoDiscount > 0
            ? '<div class="oh-insp-ledger-row discount"><span>Promo Code (' + esc(ord.promoCode || "PROMO") + ')</span><span>−$' + Number(ord.promoDiscount).toFixed(2) + '</span></div>'
            : '') +
          '<div class="oh-insp-ledger-row">' +
            '<span>ESD Packaging &amp; Air Shipping</span>' +
            '<span class="free-tag">FREE</span>' +
          '</div>' +
          '<div class="oh-insp-ledger-row">' +
            '<span>Estimated Tax (8.25%)</span>' +
            '<span>$' + Number(ord.tax || 0).toFixed(2) + '</span>' +
          '</div>' +
          '<div class="oh-insp-ledger-row grand-total">' +
            '<span>Total Paid</span>' +
            '<strong id="oh-inspector-grand-total">$' + Number(ord.total || 0).toFixed(2) + '</strong>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="oh-insp-verification">' +
        '<div class="oh-insp-qr-wrap">' + qrSvgHtml + '</div>' +
        '<div class="oh-insp-barcode-wrap">' +
          barcodeHtml +
          '<span class="oh-insp-barcode-caption">VERIFIED RECEIPT · ' + esc(ord.id) + '</span>' +
        '</div>' +
      '</div>' +

      '<div class="oh-insp-actions">' +
        '<button type="button" class="oh-action-btn primary wide" onclick="openHistoryOrderThermalBill(\'' + esc(ord.id) + '\')">' +
          icon("printer", 14) + ' <span>Open Thermal Receipt &amp; Print</span>' +
        '</button>' +
        '<div class="oh-insp-actions-row">' +
          '<button type="button" class="oh-action-btn ghost" onclick="openOrderTrackingDashboard(\'' + esc(ord.id) + '\')">' +
            icon("truck", 13) + ' <span>Live Tracker</span>' +
          '</button>' +
          '<button type="button" class="oh-action-btn ghost" onclick="emailHistoryOrderReceipt(\'' + esc(ord.id) + '\')">' +
            icon("mail", 13) + ' <span>Email Receipt</span>' +
          '</button>' +
          '<button type="button" class="oh-action-btn ghost" onclick="reorderEntirePastOrder(\'' + esc(ord.id) + '\')">' +
            icon("cart", 13) + ' <span>Reorder All</span>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
}

window.selectOrderInHistory = function (orderId) {
  orderHistorySelectedOrderId = String(orderId || "");
  refreshOrderHistoryView();
};

window.resetOrderHistoryFilters = function () {
  orderHistoryActiveStatus = "all";
  orderHistorySearchQuery = "";
  orderHistorySortBy = "newest";

  var searchInput = document.getElementById("oh-search-input");
  var clearBtn = document.getElementById("oh-search-clear-btn");
  var sortSelect = document.getElementById("oh-sort-select");
  if (searchInput) searchInput.value = "";
  if (clearBtn) clearBtn.hidden = true;
  if (sortSelect) sortSelect.value = "newest";

  var tabs = document.querySelectorAll("#oh-status-tabs .oh-status-tab");
  for (var i = 0; i < tabs.length; i++) {
    var isAll = tabs[i].getAttribute("data-oh-status") === "all";
    tabs[i].classList.toggle("active", isAll);
    tabs[i].setAttribute("aria-selected", isAll ? "true" : "false");
  }

  refreshOrderHistoryView();
};

window.openHistoryOrderThermalBill = function (orderId) {
  for (var i = 0; i < orderHistoryAllOrders.length; i++) {
    if (orderHistoryAllOrders[i].id === orderId) {
      showReceipt(orderHistoryAllOrders[i]);
      return;
    }
  }
  openOrderFromHistory(orderId);
};

window.emailHistoryOrderReceipt = function (orderId) {
  if (!orderId) return;
  api("/api/orders/" + encodeURIComponent(orderId) + "/email", { method: "POST" })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (res.ok) {
        showActivityToast("Receipt for Order #" + orderId + " emailed to " + (res.data.sentTo || "your inbox") + "!");
      } else {
        showActivityToast((res.data && res.data.message) || "Could not email receipt.");
      }
    })
    .catch(function () {
      showActivityToast("Unable to reach server to email receipt.");
    });
};

window.advanceHistoryOrderStage = function (orderId) {
  if (!orderId) return;
  var target = null;
  for (var i = 0; i < orderHistoryAllOrders.length; i++) {
    if (orderHistoryAllOrders[i].id === orderId) {
      target = orderHistoryAllOrders[i];
      break;
    }
  }
  var isReset = target && target.stageIndex >= 3;
  var url = isReset
    ? ("/api/orders/" + encodeURIComponent(orderId) + "/status")
    : ("/api/orders/" + encodeURIComponent(orderId) + "/advance");
  var fetchOpts = isReset
    ? { method: "PUT", body: JSON.stringify({ status: "Order Placed" }) }
    : { method: "POST" };

  api(url, fetchOpts)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data && data.order) {
        var updatedEnriched = normalizeClientOrderForHistory(data.order);
        for (var j = 0; j < orderHistoryAllOrders.length; j++) {
          if (orderHistoryAllOrders[j].id === orderId) {
            orderHistoryAllOrders[j] = updatedEnriched;
            break;
          }
        }
        orderHistorySelectedOrderId = orderId;
        refreshOrderHistoryView();
        showActivityToast("Order #" + orderId + " status updated to: " + updatedEnriched.status);
      }
    })
    .catch(function () {
      showActivityToast("Could not update order status.");
    });
};

window.reorderEntirePastOrder = function (orderId) {
  var target = null;
  for (var i = 0; i < orderHistoryAllOrders.length; i++) {
    if (orderHistoryAllOrders[i].id === orderId) {
      target = orderHistoryAllOrders[i];
      break;
    }
  }
  if (!target || !Array.isArray(target.lines) || target.lines.length === 0) return;

  var addedUnits = 0;
  for (var l = 0; l < target.lines.length; l++) {
    var ln = target.lines[l];
    var pid = Number(ln.productId);
    var qty = Math.max(1, Number(ln.qty) || 1);
    if (pid > 0) {
      cart[pid] = (cart[pid] || 0) + qty;
      addedUnits += qty;
      paintCardQty(pid);
    }
  }
  recalcTotals();
  paintRigBuilder();
  scheduleCartSave();
  showActivityToast("Reordered " + addedUnits + (addedUnits === 1 ? " component" : " components") + " from Order #" + orderId + " into your cart!");
};

window.buyAgainSingleItem = function (productId) {
  var pid = Number(productId);
  if (!pid || pid <= 0) return;
  inc(pid);
  var prod = findProduct(pid);
  showActivityToast("Added " + (prod ? prod.title : ("Component #" + pid)) + " to your cart!");
};

window.onOrderTrackingUpdateReceived = function (msg) {
  if (!msg || !msg.orderId) return;
  if (isOrderHistoryPageOpen) {
    fetchAndRenderOrderHistoryPage(orderHistorySelectedOrderId || msg.orderId);
  }
};

function initOrderHistoryPageControls() {
  var topbarOrdersBtn = document.getElementById("topbar-orders-btn");
  if (topbarOrdersBtn) {
    topbarOrdersBtn.addEventListener("click", function () {
      if (isOrderHistoryPageOpen) {
        closeOrderHistoryPage();
      } else {
        openOrderHistoryPage();
      }
    });
  }

  var profileOrdersPageBtn = document.getElementById("open-order-history-page-btn");
  if (profileOrdersPageBtn) {
    profileOrdersPageBtn.addEventListener("click", function () {
      closeAllSheets();
      openOrderHistoryPage();
    });
  }

  var backBtn = document.getElementById("order-history-back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      closeOrderHistoryPage();
    });
  }

  var refreshBtn = document.getElementById("oh-refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      fetchAndRenderOrderHistoryPage(orderHistorySelectedOrderId);
      showActivityToast("Order history synced with backend.");
    });
  }

  var trackLatestBtn = document.getElementById("oh-track-latest-btn");
  if (trackLatestBtn) {
    trackLatestBtn.addEventListener("click", function () {
      var targetId = orderHistorySelectedOrderId || (orderHistoryAllOrders[0] && orderHistoryAllOrders[0].id) || null;
      openOrderTrackingDashboard(targetId);
    });
  }

  var statusTabsEl = document.getElementById("oh-status-tabs");
  if (statusTabsEl) {
    statusTabsEl.addEventListener("click", function (e) {
      var tab = e.target.closest(".oh-status-tab");
      if (!tab) return;
      var statusVal = tab.getAttribute("data-oh-status") || "all";
      orderHistoryActiveStatus = statusVal;

      var allTabs = statusTabsEl.querySelectorAll(".oh-status-tab");
      for (var i = 0; i < allTabs.length; i++) {
        var active = allTabs[i] === tab;
        allTabs[i].classList.toggle("active", active);
        allTabs[i].setAttribute("aria-selected", active ? "true" : "false");
      }
      refreshOrderHistoryView();
    });
  }

  var searchInputEl = document.getElementById("oh-search-input");
  var searchClearBtnEl = document.getElementById("oh-search-clear-btn");
  if (searchInputEl) {
    searchInputEl.addEventListener("input", function () {
      orderHistorySearchQuery = searchInputEl.value.trim();
      if (searchClearBtnEl) {
        searchClearBtnEl.hidden = !orderHistorySearchQuery;
      }
      refreshOrderHistoryView();
    });
  }
  if (searchClearBtnEl) {
    searchClearBtnEl.addEventListener("click", function () {
      orderHistorySearchQuery = "";
      if (searchInputEl) searchInputEl.value = "";
      searchClearBtnEl.hidden = true;
      refreshOrderHistoryView();
    });
  }

  var sortSelectEl = document.getElementById("oh-sort-select");
  if (sortSelectEl) {
    sortSelectEl.addEventListener("change", function () {
      orderHistorySortBy = sortSelectEl.value || "newest";
      refreshOrderHistoryView();
    });
  }

  // Auto-open Full Order History Page if URL path is /orders, /order-history, ?view=orders, or #orders
  var path = window.location.pathname || "";
  var search = window.location.search || "";
  var hash = window.location.hash || "";
  if (
    path === "/orders" ||
    path === "/order-history" ||
    search.indexOf("view=orders") !== -1 ||
    hash === "#orders" ||
    hash === "#order-history"
  ) {
    setTimeout(function () {
      openOrderHistoryPage();
    }, 150);
  }
}

// ============================================================================
// VERIFIED BUYER REVIEW & RATING SYSTEM (DISPLAYED INSIDE #spec-drawer)
// ============================================================================

var productReviewsCache = {};
var activeReviewStarFilter = "all";
var activeReviewSortBy = "newest";
var draftReviewRating = 5;
var draftReviewUseCaseTag = "Gaming Rig";
var isSubmittingProductReview = false;
var lastReviewSuccessMsgByProduct = {};

var STAR_RATING_LABELS = {
  5: "5/5 · Reference-Grade Bench Performance",
  4: "4/5 · Strong Value & Reliable Thermals",
  3: "3/5 · Meets Baseline Spec Sheet",
  2: "2/5 · Below Expected Performance",
  1: "1/5 · Defective or Thermal Issues"
};

function renderStaticStarsText(rating) {
  var r = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)));
  var out = "";
  for (var i = 1; i <= 5; i++) {
    out += i <= r ? "★" : "☆";
  }
  return out;
}

var activeSpecDrawerSectionId = "overview";

function updateSpecDrawerSectionNavUI(activeSectionId, options) {
  if (activeSectionId) {
    activeSpecDrawerSectionId = String(activeSectionId);
  }
  var navEl = document.getElementById("spec-drawer-section-nav");
  if (!navEl) return;
  var opts = options || {};
  var navItems = (window.VoltboxQR && typeof window.VoltboxQR.resolveSpecDrawerSectionNav === "function")
    ? window.VoltboxQR.resolveSpecDrawerSectionNav(activeSpecDrawerSectionId, opts)
    : null;

  var buttons = navEl.querySelectorAll(".spec-sec-nav-btn, .spec-nav-tab");
  for (var i = 0; i < buttons.length; i++) {
    var btn = buttons[i];
    var secId = btn.getAttribute("data-spec-nav") || btn.getAttribute("data-section-id");
    var isAct = secId === activeSpecDrawerSectionId;
    btn.classList.toggle("active", isAct);
    btn.setAttribute("aria-selected", isAct ? "true" : "false");
  }

  if (navItems) {
    for (var j = 0; j < navItems.length; j++) {
      var item = navItems[j];
      if (item.id === "d3-volatility" && item.badgeText) {
        var vBadge = document.getElementById("spec-nav-vol-badge");
        if (vBadge) {
          vBadge.textContent = item.badgeText;
          vBadge.hidden = false;
        }
      }
      if (item.id === "reviews" && item.badgeText) {
        var rBadge = document.getElementById("spec-nav-rev-badge");
        if (rBadge) {
          rBadge.textContent = item.badgeText;
          rBadge.hidden = false;
        }
      }
    }
  }
}

window.scrollSpecDrawerToSection = function (sectionId) {
  var targetMap = {
    "overview": "spec-overview-section",
    "d3-volatility": "spec-advanced-price-trends",
    "tech-specs": "spec-technical-section",
    "reviews": "spec-reviews-section"
  };
  var cleanId = targetMap[sectionId] ? sectionId : "overview";
  updateSpecDrawerSectionNavUI(cleanId);
  var targetEl = document.getElementById(targetMap[cleanId]);
  var bodyEl = document.getElementById("spec-drawer-body");
  if (!targetEl) return;
  if (cleanId === "overview") {
    if (window.momentumDrawers && window.momentumDrawers.spec) {
      window.momentumDrawers.spec.scrollTo(0, true);
    } else if (bodyEl) {
      bodyEl.scrollTo({ top: 0, behavior: "smooth" });
    }
    return;
  }
  if (window.momentumDrawers && window.momentumDrawers.spec && bodyEl) {
    var offset = Math.max(0, targetEl.offsetTop - 52);
    window.momentumDrawers.spec.scrollTo(offset, true);
  } else {
    targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

window.scrollSpecDrawerToReviews = function () {
  window.scrollSpecDrawerToSection("reviews");
};

window.openSpecDrawerToReviews = function (productId) {
  var pid = Number(productId);
  if (!pid || pid <= 0) return;
  openSpecDrawer(pid);
  setTimeout(function () {
    window.scrollSpecDrawerToSection("reviews");
  }, 220);
};

function renderProductReviewsLoading(p) {
  var summaryEl = document.getElementById("spec-reviews-summary-card");
  var listEl = document.getElementById("spec-reviews-list");
  if (summaryEl && !summaryEl.innerHTML) {
    var fallbackRate = Number(p && p.ratingRate) > 0 ? Number(p.ratingRate).toFixed(1) : "4.8";
    summaryEl.innerHTML =
      '<div class="spec-rev-loading">Syncing verified buyer ratings (' + fallbackRate + ' ★) from backend…</div>';
  }
  if (listEl && !listEl.innerHTML) {
    listEl.innerHTML =
      '<div class="spec-rev-loading">Loading verified hardware owner reviews…</div>';
  }
}

function fetchAndRenderProductReviews(productId) {
  var pid = Number(productId);
  if (!pid || pid <= 0) return;

  api("/api/products/" + pid + "/reviews")
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !data.ok) return;
      productReviewsCache[pid] = data;
      if (activeSpecProductId === pid) {
        // Initialize draft form values if shopper has an existing review
        if (data.eligibility && data.eligibility.existingReview) {
          draftReviewRating = Number(data.eligibility.existingReview.rating) || 5;
          draftReviewUseCaseTag = data.eligibility.existingReview.useCaseTag || "Gaming Rig";
        } else {
          draftReviewRating = 5;
          draftReviewUseCaseTag = "Gaming Rig";
        }
        renderProductReviewsSection(pid, data);
        // Update hero rating summary line
        var p = findProductById(pid);
        if (p && data.summary) {
          var ratingSummaryEl = document.getElementById("spec-drawer-rating-summary");
          if (ratingSummaryEl) {
            var rateVal = data.summary.averageRating || p.ratingRate || 4.8;
            var revCount = data.summary.reviewCount;
            ratingSummaryEl.innerHTML =
              '<span class="spec-hero-stars" aria-hidden="true">' + renderStaticStarsText(rateVal) + '</span>' +
              '<strong class="spec-hero-rate-num">' + Number(rateVal).toFixed(1) + '</strong>' +
              '<span class="spec-hero-rate-sep">·</span>' +
              '<button type="button" class="spec-hero-reviews-jump" onclick="scrollSpecDrawerToReviews()">' +
                revCount + (revCount === 1 ? ' Verified Review' : ' Verified Reviews') + ' · Rate / Read &darr;' +
              '</button>';
          }
        }
      }
    })
    .catch(function () {});
}

function renderProductReviewsSection(productId, payload) {
  if (!payload) return;
  var summary = payload.summary || {
    productId: productId,
    reviewCount: 0,
    averageRating: 0,
    recommendPercent: 100,
    starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    starPercentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };
  var allReviews = Array.isArray(payload.allReviews) ? payload.allReviews : (Array.isArray(payload.reviews) ? payload.reviews : []);
  var eligibility = payload.eligibility || { hasPurchased: false, matchingOrders: [], existingReview: null };

  // 1. Update section count note & nav badge
  var countNoteEl = document.getElementById("spec-reviews-count-note");
  if (countNoteEl) {
    countNoteEl.textContent =
      summary.reviewCount +
      " Verified" +
      (summary.reviewCount > 0 ? (" · " + summary.recommendPercent + "% Rec.") : "");
  }
  var revNavBadge = document.getElementById("spec-nav-rev-badge");
  if (revNavBadge && typeof summary.reviewCount === "number") {
    revNavBadge.textContent = String(summary.reviewCount);
    revNavBadge.hidden = false;
  }

  // 2. Render Aggregate Rating Score & 5-Star Distribution Card
  var summaryCardEl = document.getElementById("spec-reviews-summary-card");
  if (summaryCardEl) {
    var avgScore = summary.averageRating > 0 ? Number(summary.averageRating).toFixed(1) : "5.0";
    var distBarsHtml = "";
    for (var star = 5; star >= 1; star--) {
      var cnt = (summary.starCounts && summary.starCounts[star]) || 0;
      var pct = (summary.starPercentages && summary.starPercentages[star]) || 0;
      var isStarActive = String(activeReviewStarFilter) === String(star);
      distBarsHtml +=
        '<button type="button" class="spec-rev-dist-row' + (isStarActive ? ' active' : '') + '" onclick="setSpecReviewStarFilter(\'' + star + '\')" aria-label="Filter by ' + star + ' star reviews (' + cnt + ')">' +
          '<span class="spec-rev-dist-label">' + star + ' ★</span>' +
          '<span class="spec-rev-dist-track"><span class="spec-rev-dist-fill" style="width:' + pct + '%"></span></span>' +
          '<span class="spec-rev-dist-count">' + cnt + ' (' + pct + '%)</span>' +
        '</button>';
    }

    summaryCardEl.innerHTML =
      '<div class="spec-rev-score-left">' +
        '<div class="spec-rev-big-score" data-testid="spec-rev-big-score">' + avgScore + '</div>' +
        '<div class="spec-rev-stars-row" aria-label="Average rating ' + avgScore + ' out of 5 stars">' +
          renderStaticStarsText(avgScore) +
        '</div>' +
        '<div class="spec-rev-score-caption">' +
          'Based on <strong>' + summary.reviewCount + '</strong> verified purchase ' + (summary.reviewCount === 1 ? 'review' : 'reviews') +
        '</div>' +
        '<div class="spec-rev-rec-line">' +
          '<strong>' + summary.recommendPercent + '%</strong> of verified builders recommend this component' +
        '</div>' +
      '</div>' +
      '<div class="spec-rev-dist-right">' +
        distBarsHtml +
      '</div>';
  }

  // 3. Render Verified Purchase Eligibility & Review Submission Composer
  renderSpecReviewComposer(productId, eligibility);

  // 4. Render Filtered & Sorted Reviews List
  renderFilteredSpecReviewsList(productId, allReviews);

  if (window.momentumDrawers && window.momentumDrawers.spec) {
    setTimeout(function () {
      if (window.momentumDrawers && window.momentumDrawers.spec) {
        window.momentumDrawers.spec.refreshMetrics();
      }
    }, 30);
  }
}

function renderSpecReviewComposer(productId, eligibility) {
  var container = document.getElementById("spec-review-composer-container");
  if (!container) return;

  var p = findProductById(productId);
  var prodTitle = p ? p.title : ("Component #" + productId);

  if (!eligibility || !eligibility.hasPurchased) {
    container.innerHTML =
      '<div class="spec-review-locked-banner" id="spec-review-locked-banner" data-testid="spec-review-locked-banner">' +
        '<div class="spec-rev-locked-info">' +
          '<div class="spec-rev-locked-kicker">VERIFIED OWNER FEEDBACK ONLY</div>' +
          '<h4 class="spec-rev-locked-title">Purchase Required to Review ' + esc(prodTitle) + '</h4>' +
          '<p class="spec-rev-locked-desc">To keep Voltbox ratings authentic, only shoppers who have purchased this specific hardware SKU can submit a rating and bench review.</p>' +
        '</div>' +
        '<div class="spec-rev-locked-actions">' +
          '<button type="button" class="spec-rev-unlock-btn" data-testid="spec-rev-add-to-cart-btn" onclick="inc(' + productId + ');showActivityToast(\'Added to cart! Complete checkout to unlock verified review.\');">' +
            icon("cart", 13) + ' <span>Add to Cart to Purchase</span>' +
          '</button>' +
        '</div>' +
      '</div>';
    return;
  }

  var existing = eligibility.existingReview || null;
  var orders = Array.isArray(eligibility.matchingOrders) ? eligibility.matchingOrders : [];
  var latestOrder = orders[0] || { orderId: eligibility.latestOrderId || "VB-VERIFIED", formattedDate: "Recent Order", qty: 1 };

  var starButtonsHtml = "";
  for (var s = 1; s <= 5; s++) {
    var active = s <= draftReviewRating;
    starButtonsHtml +=
      '<button type="button" class="spec-star-pick-btn' + (active ? ' active' : '') + '" ' +
      '        data-star-val="' + s + '" data-testid="spec-star-pick-' + s + '" ' +
      '        role="radio" aria-checked="' + (s === draftReviewRating ? 'true' : 'false') + '" ' +
      '        aria-label="Rate ' + s + ' out of 5 stars" ' +
      '        onclick="selectDraftReviewStar(' + s + ')">' +
        (active ? '★' : '☆') +
      '</button>';
  }

  var useCaseTags = ["Gaming Rig", "AI / Workstation", "Creator Build", "Silent / Thermal", "Drop-In Upgrade"];
  var tagsHtml = "";
  for (var t = 0; t < useCaseTags.length; t++) {
    var tag = useCaseTags[t];
    var isTagSelected = draftReviewUseCaseTag === tag;
    tagsHtml +=
      '<button type="button" class="spec-rev-tag-btn' + (isTagSelected ? ' active' : '') + '" ' +
      '        data-use-case="' + esc(tag) + '" ' +
      '        aria-pressed="' + (isTagSelected ? 'true' : 'false') + '" ' +
      '        onclick="selectDraftReviewUseCase(\'' + esc(tag) + '\')">' +
        esc(tag) +
      '</button>';
  }

  var orderOptionsHtml = "";
  for (var o = 0; o < orders.length; o++) {
    var ordItem = orders[o];
    var sel = existing && existing.orderId === ordItem.orderId ? " selected" : (o === 0 ? " selected" : "");
    orderOptionsHtml +=
      '<option value="' + esc(ordItem.orderId) + '"' + sel + '>' +
        'Order #' + esc(ordItem.orderId) + ' · ' + esc(ordItem.formattedDate) + ' (Qty ' + ordItem.qty + ')' +
      '</option>';
  }

  var defaultHeadline = existing ? existing.title : "";
  var defaultComment = existing ? existing.comment : "";

  container.innerHTML =
    '<form class="spec-review-form" id="spec-review-form" data-testid="spec-review-form" onsubmit="submitVerifiedProductReview(event, ' + productId + ')" novalidate>' +
      '<div class="spec-rev-form-head">' +
        '<div class="spec-rev-form-head-left">' +
          '<span class="spec-rev-verified-kicker">✓ VERIFIED HARDWARE OWNER · ORDER #' + esc(latestOrder.orderId) + '</span>' +
          '<h4 class="spec-rev-form-title">' +
            (existing ? 'Update Your Verified Hardware Review' : ('Rate &amp; Review Your ' + esc(prodTitle))) +
          '</h4>' +
        '</div>' +
        (orders.length > 1
          ? '<div class="spec-rev-order-select-wrap">' +
              '<label for="spec-review-order-select" class="sr-only">Verified Order</label>' +
              '<select id="spec-review-order-select" class="spec-rev-order-select" aria-label="Select verified purchase order">' +
                orderOptionsHtml +
              '</select>' +
            '</div>'
          : '<input type="hidden" id="spec-review-order-select" value="' + esc(latestOrder.orderId) + '" />') +
      '</div>' +

      '<div class="spec-rev-rating-picker-row">' +
        '<span class="spec-rev-field-label">Your Star Rating</span>' +
        '<div class="spec-rev-star-picker" id="spec-review-star-picker" role="radiogroup" aria-label="Choose a star rating from 1 to 5">' +
          starButtonsHtml +
          '<span class="spec-rev-star-meaning" id="spec-review-star-meaning">' +
            esc(STAR_RATING_LABELS[draftReviewRating] || STAR_RATING_LABELS[5]) +
          '</span>' +
        '</div>' +
      '</div>' +

      '<div class="spec-rev-usecase-row">' +
        '<span class="spec-rev-field-label">Primary Build Profile</span>' +
        '<div class="spec-rev-tags-group" id="spec-review-tags-group" role="group" aria-label="Primary build profile">' +
          tagsHtml +
        '</div>' +
      '</div>' +

      '<div class="spec-rev-input-group">' +
        '<label for="spec-review-title-input" class="spec-rev-field-label">Review Headline</label>' +
        '<input type="text" id="spec-review-title-input" data-testid="spec-review-title-input" ' +
        '       class="spec-rev-input" maxlength="120" required ' +
        '       placeholder="Summarize your bench results, thermals, or build experience…" ' +
        '       value="' + esc(defaultHeadline) + '" />' +
      '</div>' +

      '<div class="spec-rev-input-group">' +
        '<label for="spec-review-comment-input" class="spec-rev-field-label">Detailed Hardware &amp; Bench Feedback</label>' +
        '<textarea id="spec-review-comment-input" data-testid="spec-review-comment-input" ' +
        '          class="spec-rev-textarea" rows="3" maxlength="1200" required ' +
        '          placeholder="Share real-world clock speeds, temperatures, acoustic performance, or chassis compatibility notes…">' +
          esc(defaultComment) +
        '</textarea>' +
      '</div>' +

      (lastReviewSuccessMsgByProduct[productId]
        ? '<p class="spec-rev-form-msg success" id="spec-review-form-msg" data-testid="spec-review-form-msg" role="status">' + esc(lastReviewSuccessMsgByProduct[productId]) + '</p>'
        : '<p class="spec-rev-form-msg" id="spec-review-form-msg" data-testid="spec-review-form-msg" role="status" hidden></p>') +

      '<div class="spec-rev-form-actions">' +
        '<span class="spec-rev-form-note">Published with Verified Purchase attribution (' + esc(latestOrder.formattedDate) + ')</span>' +
        '<button type="submit" class="spec-rev-submit-btn" id="spec-review-submit-btn" data-testid="spec-review-submit-btn">' +
          '<span>' + (existing ? 'Update Verified Review' : 'Submit Verified Review') + '</span>' +
        '</button>' +
      '</div>' +
    '</form>';
}

window.selectDraftReviewStar = function (starVal) {
  var s = Math.min(5, Math.max(1, Math.round(Number(starVal) || 5)));
  draftReviewRating = s;
  var pickerEl = document.getElementById("spec-review-star-picker");
  if (pickerEl) {
    var btns = pickerEl.querySelectorAll(".spec-star-pick-btn");
    for (var i = 0; i < btns.length; i++) {
      var bVal = Number(btns[i].getAttribute("data-star-val") || 0);
      var isOn = bVal <= s;
      btns[i].classList.toggle("active", isOn);
      btns[i].setAttribute("aria-checked", bVal === s ? "true" : "false");
      btns[i].textContent = isOn ? "★" : "☆";
    }
  }
  var meaningEl = document.getElementById("spec-review-star-meaning");
  if (meaningEl) {
    meaningEl.textContent = STAR_RATING_LABELS[s] || (s + "/5 Stars");
  }
};

window.selectDraftReviewUseCase = function (tag) {
  draftReviewUseCaseTag = String(tag || "Gaming Rig");
  var groupEl = document.getElementById("spec-review-tags-group");
  if (groupEl) {
    var btns = groupEl.querySelectorAll(".spec-rev-tag-btn");
    for (var i = 0; i < btns.length; i++) {
      var match = btns[i].getAttribute("data-use-case") === draftReviewUseCaseTag;
      btns[i].classList.toggle("active", match);
      btns[i].setAttribute("aria-pressed", match ? "true" : "false");
    }
  }
};

window.setSpecReviewStarFilter = function (starVal) {
  var nextVal = String(starVal || "all");
  if (activeReviewStarFilter === nextVal && nextVal !== "all") {
    activeReviewStarFilter = "all";
  } else {
    activeReviewStarFilter = nextVal;
  }
  var tabsEl = document.getElementById("spec-reviews-star-tabs");
  if (tabsEl) {
    var tabs = tabsEl.querySelectorAll(".spec-rev-star-tab");
    for (var i = 0; i < tabs.length; i++) {
      var isMatch = tabs[i].getAttribute("data-rev-star") === activeReviewStarFilter;
      tabs[i].classList.toggle("active", isMatch);
      tabs[i].setAttribute("aria-selected", isMatch ? "true" : "false");
    }
  }
  if (activeSpecProductId && productReviewsCache[activeSpecProductId]) {
    var payload = productReviewsCache[activeSpecProductId];
    renderFilteredSpecReviewsList(activeSpecProductId, payload.allReviews || payload.reviews || []);
  }
};

function renderFilteredSpecReviewsList(productId, allReviews) {
  var listEl = document.getElementById("spec-reviews-list");
  if (!listEl) return;

  var filtered = [];
  if (window.VoltboxQR && typeof window.VoltboxQR.filterAndSortProductReviews === "function") {
    filtered = window.VoltboxQR.filterAndSortProductReviews(allReviews, {
      starFilter: activeReviewStarFilter,
      sortBy: activeReviewSortBy
    });
  } else {
    filtered = Array.isArray(allReviews) ? allReviews.slice() : [];
  }

  if (filtered.length === 0) {
    listEl.innerHTML =
      '<div class="spec-rev-empty-state" data-testid="spec-rev-empty-state">' +
        '<p>' +
          (activeReviewStarFilter !== "all"
            ? ('No ' + activeReviewStarFilter + '★ reviews found for this component.')
            : 'No verified buyer reviews yet for this component. Be the first verified owner to share bench feedback!') +
        '</p>' +
        (activeReviewStarFilter !== "all"
          ? '<button type="button" class="spec-rev-reset-filter-btn" onclick="setSpecReviewStarFilter(\'all\')">Show All Reviews</button>'
          : '') +
      '</div>';
    return;
  }

  var currentEmail = (me && me.email ? String(me.email).toLowerCase() : "");
  var html = "";
  for (var i = 0; i < filtered.length; i++) {
    var rev = filtered[i];
    var revDate = formatDate(new Date(Number(rev.createdAt) || Date.now()));
    var isMine = currentEmail && String(rev.authorEmail || "").toLowerCase() === currentEmail;
    var voters = Array.isArray(rev.helpfulVoterEmails) ? rev.helpfulVoterEmails : [];
    var hasVotedHelpful = currentEmail && voters.indexOf(currentEmail) !== -1;

    html +=
      '<article class="spec-review-card' + (isMine ? ' mine' : '') + '" data-review-id="' + esc(rev.id) + '" data-testid="spec-review-card">' +
        '<div class="spec-review-card-head">' +
          '<div class="spec-review-author-wrap">' +
            '<span class="spec-review-avatar" style="background:' + esc(rev.authorColor || "#ffd23f") + '">' +
              esc(rev.authorInitial || "V") +
            '</span>' +
            '<div class="spec-review-author-meta">' +
              '<div class="spec-review-author-line">' +
                '<strong class="spec-review-author-name">' + esc(rev.authorName || "Verified Builder") + '</strong>' +
                (isMine ? '<span class="spec-review-mine-text">· Your Review</span>' : '') +
              '</div>' +
              '<div class="spec-review-submeta">' +
                '<span class="spec-review-verified-label">✓ Verified Purchase</span>' +
                (rev.orderId ? ('<span>·</span><span>Order #' + esc(rev.orderId) + '</span>') : '') +
                (rev.useCaseTag ? ('<span>·</span><span>' + esc(rev.useCaseTag) + '</span>') : '') +
                '<span>·</span>' +
                '<span>' + esc(revDate) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="spec-review-rating-box" aria-label="Rated ' + rev.rating + ' out of 5 stars">' +
            '<span class="spec-review-stars">' + renderStaticStarsText(rev.rating) + '</span>' +
            '<strong class="spec-review-rate-num">' + Number(rev.rating).toFixed(1) + '</strong>' +
          '</div>' +
        '</div>' +

        '<h4 class="spec-review-card-title" data-testid="spec-review-card-title">' + esc(rev.title) + '</h4>' +
        '<p class="spec-review-card-body" data-testid="spec-review-card-body">' + esc(rev.comment) + '</p>' +

        '<div class="spec-review-card-foot">' +
          '<span class="spec-review-sku-ref">SKU ' + esc(rev.sku || ("VB-PRT-" + String(productId).padStart(3, "0"))) + '</span>' +
          '<button type="button" class="spec-review-helpful-btn' + (hasVotedHelpful ? ' active' : '') + '" ' +
          '        data-testid="spec-review-helpful-' + esc(rev.id) + '" ' +
          '        onclick="toggleProductReviewHelpful(' + productId + ', \'' + esc(rev.id) + '\')" ' +
          '        aria-label="Mark review as helpful (' + (rev.helpfulCount || 0) + ')">' +
            '<span>Helpful (' + (rev.helpfulCount || 0) + ')</span>' +
          '</button>' +
        '</div>' +
      '</article>';
  }

  listEl.innerHTML = html;
}

window.submitVerifiedProductReview = function (e, productId) {
  if (e && typeof e.preventDefault === "function") e.preventDefault();
  if (isSubmittingProductReview) return;

  var pid = Number(productId || activeSpecProductId);
  if (!pid || pid <= 0) return;

  var titleInput = document.getElementById("spec-review-title-input");
  var commentInput = document.getElementById("spec-review-comment-input");
  var orderSelect = document.getElementById("spec-review-order-select");
  var msgEl = document.getElementById("spec-review-form-msg");
  var submitBtn = document.getElementById("spec-review-submit-btn");

  var titleVal = titleInput ? titleInput.value.trim() : "";
  var commentVal = commentInput ? commentInput.value.trim() : "";
  var orderIdVal = orderSelect ? orderSelect.value.trim() : null;

  function showFormMsg(text, isError) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = isError ? "spec-rev-form-msg error" : "spec-rev-form-msg success";
    msgEl.hidden = false;
  }

  if (titleVal.length < 3) {
    showFormMsg("Please enter a review headline (at least 3 characters).", true);
    if (titleInput) titleInput.focus();
    return;
  }
  if (commentVal.length < 8) {
    showFormMsg("Please share at least 8 characters of feedback about this component.", true);
    if (commentInput) commentInput.focus();
    return;
  }

  isSubmittingProductReview = true;
  if (submitBtn) submitBtn.disabled = true;

  api("/api/products/" + pid + "/reviews", {
    method: "POST",
    body: JSON.stringify({
      productId: pid,
      rating: draftReviewRating,
      title: titleVal,
      comment: commentVal,
      useCaseTag: draftReviewUseCaseTag,
      orderId: orderIdVal
    })
  })
    .then(function (r) {
      return r.json().then(function (d) { return { ok: r.ok, data: d }; });
    })
    .then(function (res) {
      isSubmittingProductReview = false;
      if (submitBtn) submitBtn.disabled = false;

      if (!res.ok || !res.data || !res.data.ok) {
        showFormMsg((res.data && res.data.message) || "Could not submit review.", true);
        return;
      }

      var data = res.data;
      activeReviewStarFilter = "all";
      activeReviewSortBy = "newest";

      // Update local cache and product rating in catalog
      productReviewsCache[pid] = {
        ok: true,
        productId: pid,
        reviews: data.reviews || [],
        allReviews: data.reviews || [],
        summary: data.summary,
        eligibility: data.eligibility
      };

      if (data.product) {
        var normProd = normalizeProductEntity(data.product);
        for (var i = 0; i < products.length; i++) {
          if (products[i].id === normProd.id) {
            products[i] = normProd;
            break;
          }
        }
        refreshCard(normProd.id);
      }

      var successMessage = data.message || "Verified review published!";
      lastReviewSuccessMsgByProduct[pid] = successMessage;

      renderProductReviewsSection(pid, productReviewsCache[pid]);
      var updatedMsgEl = document.getElementById("spec-review-form-msg");
      if (updatedMsgEl) {
        updatedMsgEl.textContent = successMessage;
        updatedMsgEl.className = "spec-rev-form-msg success";
        updatedMsgEl.hidden = false;
      }
      showActivityToast(successMessage);
    })
    .catch(function () {
      isSubmittingProductReview = false;
      if (submitBtn) submitBtn.disabled = false;
      showFormMsg("Network error while submitting your review.", true);
    });
};

window.toggleProductReviewHelpful = function (productId, reviewId) {
  var pid = Number(productId);
  if (!pid || !reviewId) return;

  api("/api/products/" + pid + "/reviews/" + encodeURIComponent(reviewId) + "/helpful", {
    method: "POST"
  })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !data.ok) return;
      if (productReviewsCache[pid]) {
        productReviewsCache[pid].allReviews = data.reviews || productReviewsCache[pid].allReviews;
        productReviewsCache[pid].reviews = data.reviews || productReviewsCache[pid].reviews;
        if (data.summary) productReviewsCache[pid].summary = data.summary;
        if (activeSpecProductId === pid) {
          renderFilteredSpecReviewsList(pid, productReviewsCache[pid].allReviews);
        }
      }
    })
    .catch(function () {});
};

window.onProductReviewSubmitted = function (msg) {
  if (!msg || !msg.productId) return;
  var pid = Number(msg.productId);
  if (msg.product) {
    var normProd = normalizeProductEntity(msg.product);
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === normProd.id) {
        products[i] = normProd;
        break;
      }
    }
    refreshCard(normProd.id);
  }
  if (activeSpecProductId === pid) {
    fetchAndRenderProductReviews(pid);
  }
};

function initProductReviewsControls() {
  var starTabsEl = document.getElementById("spec-reviews-star-tabs");
  if (starTabsEl) {
    starTabsEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".spec-rev-star-tab");
      if (!btn) return;
      var starVal = btn.getAttribute("data-rev-star") || "all";
      setSpecReviewStarFilter(starVal);
    });
  }

  var sortSelectEl = document.getElementById("spec-reviews-sort-select");
  if (sortSelectEl) {
    sortSelectEl.addEventListener("change", function () {
      activeReviewSortBy = sortSelectEl.value || "newest";
      if (activeSpecProductId && productReviewsCache[activeSpecProductId]) {
        var payload = productReviewsCache[activeSpecProductId];
        renderFilteredSpecReviewsList(activeSpecProductId, payload.allReviews || payload.reviews || []);
      }
    });
  }
}

// ============================================================================
// ADMIN CATALOG GRID BATCH EDIT MODE (MULTI-SELECT & BULK TRANSACTION)
// ============================================================================

var catalogBatchEditMode = false;
var catalogBatchSelectedIds = [];
var isSubmittingCatalogBatch = false;

function isProductInCatalogBatchSelection(productId) {
  var pid = Number(productId);
  return catalogBatchSelectedIds.indexOf(pid) !== -1;
}

window.handleCardImageAreaClick = function (e, productId) {
  if (catalogBatchEditMode) {
    if (e && typeof e.stopPropagation === "function") e.stopPropagation();
    window.toggleCatalogBatchProductSelection(productId);
    return;
  }
  openSpecDrawer(productId);
};

window.handleCardTitleAreaClick = function (e, productId) {
  if (catalogBatchEditMode) {
    if (e && typeof e.stopPropagation === "function") e.stopPropagation();
    window.toggleCatalogBatchProductSelection(productId);
    return;
  }
  openSpecDrawer(productId);
};

window.toggleCatalogBatchEditMode = function (forceState) {
  var nextMode = typeof forceState === "boolean" ? forceState : !catalogBatchEditMode;
  catalogBatchEditMode = nextMode;

  var btn = document.getElementById("catalog-batch-edit-btn");
  var panel = document.getElementById("catalog-batch-edit-panel");
  if (btn) {
    btn.hidden = false;
    btn.classList.toggle("active", catalogBatchEditMode);
    btn.setAttribute("aria-pressed", catalogBatchEditMode ? "true" : "false");
  }
  if (panel) {
    panel.hidden = !catalogBatchEditMode;
  }
  if (gridEl) {
    gridEl.classList.toggle("batch-edit-active", catalogBatchEditMode);
  }
  updateCatalogBatchEditUI();
  if (catalogBatchEditMode && panel) {
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
};

window.toggleCatalogBatchProductSelection = function (productId, forceSelected) {
  var pid = Number(productId);
  if (!pid) return;

  if (!catalogBatchEditMode) {
    window.toggleCatalogBatchEditMode(true);
  }

  var action = typeof forceSelected === "boolean" ? (forceSelected ? "add" : "remove") : "toggle";
  if (window.VoltboxQR && typeof window.VoltboxQR.toggleBatchSelectionIds === "function") {
    catalogBatchSelectedIds = window.VoltboxQR.toggleBatchSelectionIds(catalogBatchSelectedIds, pid, action);
  } else {
    var idx = catalogBatchSelectedIds.indexOf(pid);
    var shouldSelect = typeof forceSelected === "boolean" ? forceSelected : idx === -1;
    if (shouldSelect && idx === -1) catalogBatchSelectedIds.push(pid);
    if (!shouldSelect && idx !== -1) catalogBatchSelectedIds.splice(idx, 1);
  }

  updateCatalogBatchEditUI();
};

function getVisibleCatalogProductIds() {
  if (!gridEl) {
    return products.map(function (p) { return Number(p.id); });
  }
  var visibleCards = gridEl.querySelectorAll(".card:not([hidden])");
  var ids = [];
  for (var i = 0; i < visibleCards.length; i++) {
    var pid = Number(visibleCards[i].getAttribute("data-product-id"));
    if (pid > 0) ids.push(pid);
  }
  return ids;
}

window.selectAllVisibleCatalogBatchProducts = function () {
  var visibleIds = getVisibleCatalogProductIds();
  if (window.VoltboxQR && typeof window.VoltboxQR.toggleBatchSelectionIds === "function") {
    catalogBatchSelectedIds = window.VoltboxQR.toggleBatchSelectionIds(catalogBatchSelectedIds, visibleIds, "add");
  } else {
    for (var i = 0; i < visibleIds.length; i++) {
      if (catalogBatchSelectedIds.indexOf(visibleIds[i]) === -1) {
        catalogBatchSelectedIds.push(visibleIds[i]);
      }
    }
  }
  updateCatalogBatchEditUI();
};

window.selectLowStockCatalogBatchProducts = function () {
  var visibleIds = getVisibleCatalogProductIds();
  var lowIds = [];
  for (var i = 0; i < visibleIds.length; i++) {
    var p = findProductById(visibleIds[i]);
    if (p && (isLowStockItem(p) || isBackorderItem(p) || getEffectiveStock(p) <= 5)) {
      lowIds.push(Number(p.id));
    }
  }
  catalogBatchSelectedIds = lowIds;
  updateCatalogBatchEditUI();
};

window.clearCatalogBatchSelection = function () {
  catalogBatchSelectedIds = [];
  updateCatalogBatchEditUI();
};

window.applyCatalogBatchPricePreset = function (mode, val) {
  var modeEl = document.getElementById("catalog-batch-price-mode");
  var valEl = document.getElementById("catalog-batch-price-value");
  if (modeEl) modeEl.value = mode;
  if (valEl) {
    valEl.disabled = mode === "none";
    valEl.value = String(val);
  }
  updateCatalogBatchEditUI();
};

window.applyCatalogBatchStockPreset = function (mode, val) {
  var modeEl = document.getElementById("catalog-batch-stock-mode");
  var valEl = document.getElementById("catalog-batch-stock-value");
  if (modeEl) modeEl.value = mode;
  if (valEl) {
    valEl.disabled = mode === "none";
    valEl.value = String(val);
  }
  updateCatalogBatchEditUI();
};

function getCatalogBatchOperationDraft() {
  var priceModeEl = document.getElementById("catalog-batch-price-mode");
  var priceValEl = document.getElementById("catalog-batch-price-value");
  var stockModeEl = document.getElementById("catalog-batch-stock-mode");
  var stockValEl = document.getElementById("catalog-batch-stock-value");
  var reasonEl = document.getElementById("catalog-batch-reason");

  var priceMode = priceModeEl ? priceModeEl.value : "none";
  var stockMode = stockModeEl ? stockModeEl.value : "none";
  var rawPrice = priceValEl ? parseFloat(priceValEl.value) : NaN;
  var rawStock = stockValEl ? parseFloat(stockValEl.value) : NaN;

  return {
    productIds: catalogBatchSelectedIds.slice(),
    priceMode: priceMode,
    priceValue: Number.isFinite(rawPrice) ? rawPrice : 0,
    PriceHasInput: priceMode !== "none" && priceValEl && priceValEl.value.trim() !== "" && Number.isFinite(rawPrice),
    stockMode: stockMode,
    stockValue: Number.isFinite(rawStock) ? rawStock : 0,
    StockHasInput: stockMode !== "none" && stockValEl && stockValEl.value.trim() !== "" && Number.isFinite(rawStock),
    reason: reasonEl && reasonEl.value ? reasonEl.value.trim() : ""
  };
}

function computeCatalogBatchPreviewPlan() {
  var draft = getCatalogBatchOperationDraft();
  var effectivePriceMode = draft.PriceHasInput ? draft.priceMode : "none";
  var effectiveStockMode = draft.StockHasInput ? draft.stockMode : "none";

  var mappedProducts = products.map(function (p) {
    return {
      id: p.id,
      title: p.title,
      category: p.category,
      price: Number(p.price || 0),
      stock: getEffectiveStock(p)
    };
  });

  if (window.VoltboxQR && typeof window.VoltboxQR.planBatchProductTransaction === "function") {
    return window.VoltboxQR.planBatchProductTransaction(mappedProducts, {
      productIds: draft.productIds,
      priceMode: effectivePriceMode,
      priceValue: draft.priceValue,
      stockMode: effectiveStockMode,
      stockValue: draft.stockValue,
      reason: draft.reason
    });
  }
  return null;
}

function updateCatalogBatchEditUI() {
  var btnCountEl = document.getElementById("catalog-batch-edit-count");
  var countBadgeEl = document.getElementById("catalog-batch-count-badge");
  var selCountStrongEl = document.getElementById("catalog-batch-selected-count");
  var selPillEl = document.getElementById("catalog-batch-selected-pill");
  var submitBtnEl = document.getElementById("catalog-batch-submit-btn");
  var previewStripEl = document.getElementById("catalog-batch-preview-strip");

  var count = catalogBatchSelectedIds.length;
  if (btnCountEl) {
    btnCountEl.textContent = String(count);
  }
  if (countBadgeEl) {
    countBadgeEl.textContent = String(count);
    countBadgeEl.hidden = count === 0;
  }
  if (selCountStrongEl) {
    selCountStrongEl.textContent = String(count);
  }
  if (selPillEl) {
    selPillEl.textContent = count + " selected";
  }

  var plan = computeCatalogBatchPreviewPlan();
  var mutationMap = {};
  if (plan && Array.isArray(plan.mutations)) {
    for (var m = 0; m < plan.mutations.length; m++) {
      mutationMap[plan.mutations[m].productId] = plan.mutations[m];
    }
  }

  // Update each product card's selection visual + live price/stock preview badges
  for (var i = 0; i < products.length; i++) {
    var pid = Number(products[i].id);
    var isSel = isProductInCatalogBatchSelection(pid);
    var cardEl = document.getElementById("card-" + pid);
    var selBtnEl = document.getElementById("card-batch-select-" + pid);
    var pricePrevEl = document.getElementById("card-batch-price-preview-" + pid);
    var stockPrevEl = document.getElementById("card-batch-stock-preview-" + pid);

    if (cardEl) {
      cardEl.classList.toggle("is-batch-selected", isSel);
    }
    if (selBtnEl) {
      selBtnEl.classList.toggle("is-checked", isSel);
      selBtnEl.setAttribute("aria-pressed", isSel ? "true" : "false");
      var boxSpan = selBtnEl.querySelector(".card-batch-check-box");
      var lblSpan = selBtnEl.querySelector(".card-batch-check-label");
      if (boxSpan) boxSpan.textContent = isSel ? "✓" : "";
      if (lblSpan) lblSpan.textContent = isSel ? "Selected" : "Batch Select";
    }

    var mut = isSel ? mutationMap[pid] : null;
    if (pricePrevEl) {
      if (catalogBatchEditMode && mut && mut.priceChanged) {
        pricePrevEl.textContent = "→ $" + Number(mut.nextPrice).toFixed(2);
        pricePrevEl.className = "card-batch-price-preview " + (mut.priceDelta < 0 ? "is-drop" : "is-raise");
        pricePrevEl.hidden = false;
      } else {
        pricePrevEl.hidden = true;
      }
    }
    if (stockPrevEl) {
      if (catalogBatchEditMode && mut && mut.stockChanged) {
        stockPrevEl.textContent = "→ " + mut.nextStock + " units";
        stockPrevEl.className = "card-batch-stock-preview";
        stockPrevEl.hidden = false;
      } else {
        stockPrevEl.hidden = true;
      }
    }
  }

  var draft = getCatalogBatchOperationDraft();
  var hasOp = draft.PriceHasInput || draft.StockHasInput;

  if (previewStripEl) {
    if (count === 0) {
      previewStripEl.innerHTML = "Click checkboxes on product cards below (or click <strong>Select All Visible</strong>) to stage a single-transaction bulk update.";
    } else if (!hasOp) {
      previewStripEl.innerHTML = "<strong>" + count + " product" + (count === 1 ? "" : "s") + " selected.</strong> Choose a Bulk Price Update or Bulk Stock Adjustment above to preview changes.";
    } else if (plan && plan.ok) {
      var parts = [];
      parts.push("<strong>Transaction Ready (" + esc(plan.transactionId) + "):</strong> " + plan.selectedCount + " selected (" + plan.updatedCount + " modified)");
      if (draft.PriceHasInput) {
        var pSign = plan.totalPriceDeltaPerUnit >= 0 ? "+" : "-";
        parts.push("Net unit price delta: <strong>" + pSign + "$" + Math.abs(plan.totalPriceDeltaPerUnit).toFixed(2) + "</strong>");
      }
      if (draft.StockHasInput) {
        var sSign = plan.totalStockUnitsDelta >= 0 ? "+" : "";
        parts.push("Net stock delta: <strong>" + sSign + plan.totalStockUnitsDelta + " units</strong>");
      }
      var sampleList = plan.mutations.slice(0, 3).map(function (item) {
        var tags = [];
        if (item.priceChanged) tags.push("$" + item.previousPrice.toFixed(2) + "→$" + item.nextPrice.toFixed(2));
        if (item.stockChanged) tags.push(item.previousStock + "→" + item.nextStock + " stk");
        return esc(item.title) + (tags.length ? " (" + tags.join(", ") + ")" : "");
      });
      if (sampleList.length) {
        parts.push("Preview: " + sampleList.join(" · ") + (plan.mutations.length > 3 ? " +" + (plan.mutations.length - 3) + " more" : ""));
      }
      previewStripEl.innerHTML = parts.join(" &nbsp;|&nbsp; ");
    } else if (plan && plan.message) {
      previewStripEl.innerHTML = '<span style="color:#fda4af;">' + esc(plan.message) + '</span>';
    }
  }

  if (submitBtnEl) {
    submitBtnEl.innerHTML = '<span>Apply Batch Transaction' + (count > 0 ? (' (' + count + ' SKU' + (count === 1 ? '' : 's') + ')') : '') + '</span>';
    submitBtnEl.disabled = !(count > 0 && hasOp && !isSubmittingCatalogBatch);
  }
}

window.submitCatalogBatchEditTransaction = function (e) {
  if (e && typeof e.preventDefault === "function") e.preventDefault();
  if (isSubmittingCatalogBatch) return;

  var statusEl = document.getElementById("catalog-batch-status-msg");
  var showStatus = function (msg, isError) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = "cbe-status-msg " + (isError ? "error" : "success");
    statusEl.hidden = false;
  };

  var draft = getCatalogBatchOperationDraft();
  if (draft.productIds.length === 0) {
    showStatus("Select at least one product card in the catalog grid first.", true);
    return;
  }
  if (!draft.PriceHasInput && !draft.StockHasInput) {
    showStatus("Specify a bulk price update or bulk stock adjustment value before applying.", true);
    return;
  }

  isSubmittingCatalogBatch = true;
  updateCatalogBatchEditUI();

  api("/api/admin/products/batch-update", {
    method: "POST",
    body: JSON.stringify({
      productIds: draft.productIds,
      priceMode: draft.PriceHasInput ? draft.priceMode : "none",
      priceValue: draft.PriceHasInput ? draft.priceValue : 0,
      stockMode: draft.StockHasInput ? draft.stockMode : "none",
      stockValue: draft.StockHasInput ? draft.stockValue : 0,
      reason: draft.reason
    })
  })
    .then(function (r) {
      return r.json().then(function (d) { return { ok: r.ok, data: d }; });
    })
    .then(function (res) {
      isSubmittingCatalogBatch = false;
      if (!res.ok || !res.data || !res.data.ok) {
        showStatus((res.data && res.data.message) || "Batch update failed.", true);
        updateCatalogBatchEditUI();
        return;
      }

      var data = res.data;
      if (Array.isArray(data.products)) {
        for (var i = 0; i < data.products.length; i++) {
          var norm = normalizeProductEntity(data.products[i]);
          for (var j = 0; j < products.length; j++) {
            if (products[j].id === norm.id) {
              products[j] = norm;
              break;
            }
          }
          refreshCard(norm.id);
        }
      }
      updateFilterTabCounts();
      applyFiltersAndSearch();
      recalc(false);

      // Reset inputs so accidental double-apply doesn't happen, while keeping selection visible
      var priceModeEl = document.getElementById("catalog-batch-price-mode");
      var priceValEl = document.getElementById("catalog-batch-price-value");
      var stockModeEl = document.getElementById("catalog-batch-stock-mode");
      var stockValEl = document.getElementById("catalog-batch-stock-value");
      if (priceModeEl) priceModeEl.value = "none";
      if (priceValEl) { priceValEl.value = ""; priceValEl.disabled = true; }
      if (stockModeEl) stockModeEl.value = "none";
      if (stockValEl) { stockValEl.value = ""; stockValEl.disabled = true; }

      var msg = data.message || ("Updated " + (data.updatedCount || draft.productIds.length) + " products in transaction " + (data.transactionId || ""));
      showStatus(msg, false);
      showActivityToast(msg);
      updateCatalogBatchEditUI();
    })
    .catch(function () {
      isSubmittingCatalogBatch = false;
      showStatus("Network error while committing batch transaction.", true);
      updateCatalogBatchEditUI();
    });
};

window.onProductsBatchUpdated = function (msg) {
  if (!msg || !Array.isArray(msg.products)) return;
  for (var i = 0; i < msg.products.length; i++) {
    var norm = normalizeProductEntity(msg.products[i]);
    for (var j = 0; j < products.length; j++) {
      if (products[j].id === norm.id) {
        products[j] = norm;
        break;
      }
    }
    refreshCard(norm.id);
  }
  updateFilterTabCounts();
  applyFiltersAndSearch();
  recalc(false);
  updateCatalogBatchEditUI();
};

function initCatalogBatchEditControls() {
  var toggleBtnEl = document.getElementById("catalog-batch-edit-btn");
  var selectAllBtnEl = document.getElementById("catalog-batch-select-all-btn");
  var selectLowBtnEl = document.getElementById("catalog-batch-select-low-btn");
  var clearBtnEl = document.getElementById("catalog-batch-clear-btn");
  var closeBtnEl = document.getElementById("catalog-batch-close-btn");

  if (toggleBtnEl) {
    toggleBtnEl.addEventListener("click", function () {
      window.toggleCatalogBatchEditMode();
    });
  }
  if (selectAllBtnEl) {
    selectAllBtnEl.addEventListener("click", function () {
      window.selectAllVisibleCatalogBatchProducts();
    });
  }
  if (selectLowBtnEl) {
    selectLowBtnEl.addEventListener("click", function () {
      window.selectLowStockCatalogBatchProducts();
    });
  }
  if (clearBtnEl) {
    clearBtnEl.addEventListener("click", function () {
      window.clearCatalogBatchSelection();
    });
  }
  if (closeBtnEl) {
    closeBtnEl.addEventListener("click", function () {
      window.toggleCatalogBatchEditMode(false);
    });
  }

  var priceModeEl = document.getElementById("catalog-batch-price-mode");
  var priceValEl = document.getElementById("catalog-batch-price-value");
  var stockModeEl = document.getElementById("catalog-batch-stock-mode");
  var stockValEl = document.getElementById("catalog-batch-stock-value");

  if (priceModeEl) {
    priceModeEl.addEventListener("change", function () {
      var mode = priceModeEl.value;
      if (priceValEl) {
        priceValEl.disabled = mode === "none";
        if (mode !== "none" && !priceValEl.value) {
          priceValEl.value = mode === "percent" ? "-10" : (mode === "delta" ? "-5" : "99.99");
        }
      }
      updateCatalogBatchEditUI();
    });
  }
  if (priceValEl) {
    priceValEl.addEventListener("input", updateCatalogBatchEditUI);
  }
  if (stockModeEl) {
    stockModeEl.addEventListener("change", function () {
      var mode = stockModeEl.value;
      if (stockValEl) {
        stockValEl.disabled = mode === "none";
        if (mode !== "none" && !stockValEl.value) {
          stockValEl.value = mode === "delta" ? "10" : "25";
        }
      }
      updateCatalogBatchEditUI();
    });
  }
  if (stockValEl) {
    stockValEl.addEventListener("input", updateCatalogBatchEditUI);
  }
}

// ── Google Maps Platform Store & Pickup Hub Locator (Maps JS API + Places API New + Advanced Markers) ──
var voltboxGmpMap = null;
var voltboxGmpInfoWindow = null;
var voltboxGmpMarkers = [];
var voltboxGmpPlacesCache = [];
var voltboxGmpLoaderPromise = null;
var voltboxGmpInitialized = false;
var voltboxGmpAutocompleteMounted = false;
var voltboxGmpAttributionId = "gmp_mcp_codeassist_v1_aistudio";

// Tier 1 Global Quota & Auth Listener (Case A Demo Key Defense)
(function setupVoltboxGmpQuotaDefense() {
  window.gm_authFailure = function () {
    window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
  };
  var origConsoleError = console.error;
  console.error = function () {
    origConsoleError.apply(console, arguments);
    var argsArr = Array.prototype.slice.call(arguments);
    var msg = argsArr.map(function (a) { return String(a); }).join(" ");
    if (msg.indexOf("OverQuotaMapError") !== -1 || msg.indexOf("QuotaExceededError") !== -1) {
      window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
    }
  };
  window.addEventListener("gmp-quota-exceeded", function () {
    var bannerEl = document.getElementById("gmp-quota-banner");
    if (bannerEl) {
      bannerEl.removeAttribute("hidden");
    }
  });
})();

function checkAndDispatchGmpQuotaError(err) {
  var isQuota =
    window.VoltboxQR && typeof window.VoltboxQR.isGmpQuotaExceededSignal === "function"
      ? window.VoltboxQR.isGmpQuotaExceededSignal(err)
      : Boolean(
          err &&
            (String(err).indexOf("OverQuotaMapError") !== -1 ||
              String(err).indexOf("QuotaExceededError") !== -1 ||
              String(err).indexOf("OVER_QUERY_LIMIT") !== -1 ||
              String(err).indexOf("RESOURCE_EXHAUSTED") !== -1 ||
              String(err).indexOf("429") !== -1)
        );
  if (isQuota) {
    window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
  }
  return isQuota;
}

function loadVoltboxGoogleMapsBootstrap() {
  if (window.google && window.google.maps && typeof window.google.maps.importLibrary === "function") {
    return Promise.resolve();
  }
  if (voltboxGmpLoaderPromise) {
    return voltboxGmpLoaderPromise;
  }

  voltboxGmpLoaderPromise = fetch("/api/maps/config")
    .then(function (r) {
      if (r.status === 429) {
        window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
      }
      return r.json();
    })
    .then(function (cfg) {
      var apiKey = cfg && cfg.apiKey ? String(cfg.apiKey).trim() : "";
      if (cfg && cfg.attributionId) {
        voltboxGmpAttributionId = String(cfg.attributionId);
      }
      if (!apiKey) {
        throw new Error("Google Maps API key is not configured.");
      }

      // Official Google Maps JavaScript API Dynamic Library Import Bootstrap Loader
      (function (g) {
        var h,
          a,
          k,
          p = "The Google Maps JavaScript API",
          c = "google",
          l = "importLibrary",
          q = "__ib__",
          m = document,
          b = window;
        b = b[c] || (b[c] = {});
        var d = b.maps || (b.maps = {}),
          r = new Set(),
          e = new URLSearchParams(),
          u = function () {
            return (
              h ||
              (h = new Promise(function (f, n) {
                a = m.createElement("script");
                e.set("libraries", Array.from(r) + "");
                for (k in g) {
                  e.set(
                    k.replace(/[A-Z]/g, function (t) {
                      return "_" + t[0].toLowerCase();
                    }),
                    g[k]
                  );
                }
                e.set("callback", c + ".maps." + q);
                a.src = "https://maps." + c + "apis.com/maps/api/js?" + e;
                d[q] = f;
                a.onerror = function () {
                  return (h = n(Error(p + " could not load.")));
                };
                var nonceEl = m.querySelector("script[nonce]");
                a.nonce = (nonceEl && nonceEl.nonce) || "";
                m.head.append(a);
              }))
            );
          };
        if (!d[l]) {
          d[l] = function (f) {
            var rest = Array.prototype.slice.call(arguments, 1);
            r.add(f);
            return u().then(function () {
              return d[l].apply(d, [f].concat(rest));
            });
          };
        }
      })({
        key: apiKey,
        v: "weekly"
      });
    });

  return voltboxGmpLoaderPromise;
}

async function initVoltboxGoogleMap() {
  var mapEl = document.getElementById("voltbox-gmp-map");
  var statusEl = document.getElementById("voltbox-gmp-status-text");
  if (!mapEl) return;

  try {
    await loadVoltboxGoogleMapsBootstrap();

    var libs = await Promise.all([
      window.google.maps.importLibrary("maps"),
      window.google.maps.importLibrary("marker"),
      window.google.maps.importLibrary("places"),
      window.google.maps.importLibrary("core")
    ]);

    var MapClass = libs[0].Map;
    var InfoWindowClass = libs[0].InfoWindow;
    var PlaceAutocompleteElement = libs[2].PlaceAutocompleteElement;

    if (!voltboxGmpMap) {
      voltboxGmpMap = new MapClass(mapEl, {
        center: { lat: 12.9716, lng: 77.5946 },
        zoom: 12,
        mapId: "DEMO_MAP_ID",
        mapTypeControl: false,
        streetViewControl: true,
        fullscreenControl: true,
        gestureHandling: "greedy",
        internalUsageAttributionIds: [voltboxGmpAttributionId]
      });
      mapEl.setAttribute("data-gmp-ready", "true");
      mapEl.setAttribute("data-attribution-id", voltboxGmpAttributionId);
    }

    if (!voltboxGmpInfoWindow) {
      voltboxGmpInfoWindow = new InfoWindowClass();
    }

    // Mount PlaceAutocompleteElement imperatively (CF8 safe)
    var acSlot = document.getElementById("voltbox-gmp-autocomplete-slot");
    if (acSlot && !voltboxGmpAutocompleteMounted && PlaceAutocompleteElement) {
      try {
        var placeAutocomplete = new PlaceAutocompleteElement({});
        placeAutocomplete.setAttribute("internal-usage-attribution-ids", voltboxGmpAttributionId);
        placeAutocomplete.placeholder = "Autocomplete place or address…";
        acSlot.innerHTML = "";
        acSlot.appendChild(placeAutocomplete);
        voltboxGmpAutocompleteMounted = true;

        placeAutocomplete.addEventListener("gmp-select", async function (evt) {
          try {
            var prediction = evt && evt.placePrediction ? evt.placePrediction : null;
            if (!prediction || typeof prediction.toPlace !== "function") return;
            var selectedPlace = prediction.toPlace();
            await selectedPlace.fetchFields({
              fields: [
                "id",
                "displayName",
                "formattedAddress",
                "location",
                "viewport",
                "rating",
                "userRatingCount",
                "businessStatus",
                "googleMapsURI",
                "attributions"
              ]
            });
            var card =
              window.VoltboxQR && typeof window.VoltboxQR.normalizeGmpPlaceResult === "function"
                ? window.VoltboxQR.normalizeGmpPlaceResult(selectedPlace, 0)
                : null;
            if (card) {
              renderVoltboxGmpPlacesOnMap([card], selectedPlace.displayName || "Selected Place");
            }
          } catch (acErr) {
            checkAndDispatchGmpQuotaError(acErr);
          }
        });
      } catch (widgetErr) {
        console.warn("PlaceAutocompleteElement init note:", widgetErr);
      }
    }

    if (!voltboxGmpInitialized) {
      voltboxGmpInitialized = true;
      var queryInput = document.getElementById("voltbox-gmp-query-input");
      var initialQuery =
        queryInput && queryInput.value
          ? queryInput.value
          : "computer hardware electronics store in Bengaluru";
      await searchVoltboxGmpPlaces(initialQuery);
    }

    if (statusEl) {
      statusEl.textContent = "Google Maps Platform Ready · Click any pin or card to inspect live place details";
    }
  } catch (err) {
    checkAndDispatchGmpQuotaError(err);
    var listEl = document.getElementById("voltbox-gmp-places-list");
    if (listEl) {
      listEl.innerHTML =
        '<div class="voltbox-gmp-empty-state">Unable to load Google Maps Platform right now. Please verify network connectivity or API key configuration.</div>';
    }
  }
}

function clearVoltboxGmpMarkers() {
  for (var i = 0; i < voltboxGmpMarkers.length; i++) {
    if (voltboxGmpMarkers[i]) {
      voltboxGmpMarkers[i].map = null;
    }
  }
  voltboxGmpMarkers = [];
}

function openVoltboxGmpInfoWindow(card, markerAnchor) {
  if (!voltboxGmpMap || !voltboxGmpInfoWindow || !card) return;
  var container = document.createElement("div");
  container.className = "voltbox-gmp-infowindow";

  var titleEl = document.createElement("strong");
  titleEl.className = "voltbox-gmp-iw-title";
  titleEl.textContent = card.displayName || "Place Result";
  container.appendChild(titleEl);

  if (card.formattedAddress) {
    var addrEl = document.createElement("div");
    addrEl.className = "voltbox-gmp-iw-addr";
    addrEl.textContent = card.formattedAddress;
    container.appendChild(addrEl);
  }

  if (card.rating !== null) {
    var ratingEl = document.createElement("div");
    ratingEl.className = "voltbox-gmp-iw-meta";
    ratingEl.textContent = "★ " + Number(card.rating).toFixed(1) + " (" + card.userRatingCount + " reviews)";
    container.appendChild(ratingEl);
  }

  if (card.googleMapsURI) {
    var linkEl = document.createElement("a");
    linkEl.className = "voltbox-gmp-iw-link";
    linkEl.href = card.googleMapsURI;
    linkEl.target = "_blank";
    linkEl.rel = "noopener noreferrer";
    linkEl.textContent = "Open in Google Maps →";
    container.appendChild(linkEl);
  }

  voltboxGmpInfoWindow.setContent(container);
  voltboxGmpInfoWindow.open({
    map: voltboxGmpMap,
    anchor: markerAnchor,
    shouldFocus: false
  });
}

async function renderVoltboxGmpPlacesOnMap(placeCards, queryLabel) {
  var listEl = document.getElementById("voltbox-gmp-places-list");
  var countEl = document.getElementById("voltbox-gmp-result-count");
  var statusEl = document.getElementById("voltbox-gmp-status-text");

  voltboxGmpPlacesCache = Array.isArray(placeCards) ? placeCards : [];
  clearVoltboxGmpMarkers();

  if (countEl) {
    countEl.textContent = voltboxGmpPlacesCache.length + " Live Places";
  }

  if (!voltboxGmpPlacesCache.length) {
    if (listEl) {
      listEl.innerHTML =
        '<div class="voltbox-gmp-empty-state">No places matched "' +
        esc(queryLabel || "") +
        '". Try another city or search term.</div>';
    }
    return;
  }

  var markerLib = await window.google.maps.importLibrary("marker");
  var coreLib = await window.google.maps.importLibrary("core");
  var AdvancedMarkerElement = markerLib.AdvancedMarkerElement;
  var PinElement = markerLib.PinElement;
  var LatLngBounds = coreLib.LatLngBounds;
  var bounds = new LatLngBounds();

  var listHtml = "";
  for (var i = 0; i < voltboxGmpPlacesCache.length; i++) {
    var card = voltboxGmpPlacesCache[i];
    if (card.location && voltboxGmpMap) {
      var pin = new PinElement({
        glyphText: card.badgeNumber,
        background: "#0f172a",
        borderColor: "#2dd4bf",
        glyphColor: "#5eead4"
      });
      var marker = new AdvancedMarkerElement({
        map: voltboxGmpMap,
        position: card.location,
        title: card.displayName,
        content: pin
      });
      (function (boundCard, boundMarker) {
        boundMarker.addEventListener("gmp-click", function () {
          focusVoltboxGmpPlaceCard(boundCard.index);
        });
      })(card, marker);
      voltboxGmpMarkers.push(marker);
      bounds.extend(card.location);
    }

    var ratingBadge =
      card.rating !== null
        ? '<span class="voltbox-gmp-card-rating">★ ' +
          Number(card.rating).toFixed(1) +
          ' <small>(' +
          card.userRatingCount +
          ')</small></span>'
        : '<span class="voltbox-gmp-card-rating is-muted">Live Place</span>';

    var attrHtml = "";
    if (Array.isArray(card.attributions) && card.attributions.length > 0) {
      var attrLinks = [];
      for (var a = 0; a < card.attributions.length; a++) {
        var at = card.attributions[a];
        if (at.providerURI) {
          attrLinks.push(
            '<a href="' +
              esc(at.providerURI) +
              '" target="_blank" rel="noopener noreferrer">' +
              esc(at.provider) +
              "</a>"
          );
        } else {
          attrLinks.push(esc(at.provider));
        }
      }
      attrHtml = '<div class="voltbox-gmp-card-attr">Source: ' + attrLinks.join(", ") + "</div>";
    }

    var mapsLinkHtml = card.googleMapsURI
      ? '<a href="' +
        esc(card.googleMapsURI) +
        '" target="_blank" rel="noopener noreferrer" class="voltbox-gmp-card-ext" onclick="event.stopPropagation()">Google Maps ↗</a>'
      : "";

    listHtml +=
      '<div class="voltbox-gmp-place-card' +
      (i === 0 ? " is-active" : "") +
      '" data-testid="voltbox-gmp-place-card-' +
      i +
      '" data-place-index="' +
      i +
      '" onclick="focusVoltboxGmpPlaceCard(' +
      i +
      ')">' +
      '<div class="voltbox-gmp-card-top">' +
      '<span class="voltbox-gmp-card-num">' +
      esc(card.badgeNumber) +
      "</span>" +
      '<strong class="voltbox-gmp-card-title">' +
      esc(card.displayName) +
      "</strong>" +
      ratingBadge +
      "</div>" +
      '<div class="voltbox-gmp-card-addr">' +
      esc(card.formattedAddress) +
      "</div>" +
      '<div class="voltbox-gmp-card-foot">' +
      '<span class="voltbox-gmp-card-coords">' +
      (card.location
        ? card.location.lat.toFixed(4) + ", " + card.location.lng.toFixed(4)
        : "") +
      "</span>" +
      mapsLinkHtml +
      "</div>" +
      attrHtml +
      "</div>";
  }

  if (listEl) {
    listEl.innerHTML = listHtml;
  }

  if (voltboxGmpMap && voltboxGmpMarkers.length > 0) {
    if (voltboxGmpMarkers.length === 1 && voltboxGmpPlacesCache[0].location) {
      voltboxGmpMap.setCenter(voltboxGmpPlacesCache[0].location);
      voltboxGmpMap.setZoom(15);
    } else {
      voltboxGmpMap.fitBounds(bounds);
    }
    openVoltboxGmpInfoWindow(voltboxGmpPlacesCache[0], voltboxGmpMarkers[0]);
  }

  if (statusEl) {
    statusEl.textContent =
      'Showing ' +
      voltboxGmpPlacesCache.length +
      ' live Places API (New) results for "' +
      (queryLabel || "") +
      '"';
  }
}

function focusVoltboxGmpPlaceCard(index) {
  var idx = Number(index);
  var card = voltboxGmpPlacesCache[idx];
  if (!card) return;

  var listEl = document.getElementById("voltbox-gmp-places-list");
  if (listEl) {
    var cards = listEl.querySelectorAll(".voltbox-gmp-place-card");
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.toggle("is-active", Number(cards[i].getAttribute("data-place-index")) === idx);
    }
  }

  if (voltboxGmpMap && card.location) {
    voltboxGmpMap.panTo(card.location);
    if ((voltboxGmpMap.getZoom() || 12) < 14) {
      voltboxGmpMap.setZoom(14);
    }
  }

  if (voltboxGmpMarkers[idx]) {
    openVoltboxGmpInfoWindow(card, voltboxGmpMarkers[idx]);
  }
}
window.focusVoltboxGmpPlaceCard = focusVoltboxGmpPlaceCard;

async function searchVoltboxGmpPlaces(queryInput, centerOverride) {
  var listEl = document.getElementById("voltbox-gmp-places-list");
  var countEl = document.getElementById("voltbox-gmp-result-count");
  if (countEl) countEl.textContent = "Searching…";
  if (listEl) {
    listEl.innerHTML = '<div class="voltbox-gmp-empty-state">Querying live Places API (New)…</div>';
  }

  try {
    await loadVoltboxGoogleMapsBootstrap();
    var placesLib = await window.google.maps.importLibrary("places");
    var Place = placesLib.Place;

    var requestPayload =
      window.VoltboxQR && typeof window.VoltboxQR.buildGmpTextSearchRequest === "function"
        ? window.VoltboxQR.buildGmpTextSearchRequest(queryInput, {
            center: centerOverride || null,
            maxResultCount: 8
          })
        : {
            textQuery: String(queryInput || "computer hardware electronics store in Bengaluru").trim(),
            fields: [
              "id",
              "displayName",
              "formattedAddress",
              "location",
              "rating",
              "userRatingCount",
              "businessStatus",
              "googleMapsURI",
              "attributions"
            ],
            maxResultCount: 8,
            internalUsageAttributionIds: [voltboxGmpAttributionId]
          };

    var res = await Place.searchByText(requestPayload);
    var rawPlaces = res && Array.isArray(res.places) ? res.places : [];
    var cards = [];
    for (var i = 0; i < rawPlaces.length; i++) {
      var normalized =
        window.VoltboxQR && typeof window.VoltboxQR.normalizeGmpPlaceResult === "function"
          ? window.VoltboxQR.normalizeGmpPlaceResult(rawPlaces[i], i)
          : null;
      if (normalized) {
        cards.push(normalized);
      }
    }

    await renderVoltboxGmpPlacesOnMap(cards, requestPayload.textQuery);
  } catch (err) {
    checkAndDispatchGmpQuotaError(err);
    if (countEl) countEl.textContent = "0 Places";
    if (listEl) {
      listEl.innerHTML =
        '<div class="voltbox-gmp-empty-state">Unable to complete Places search. Please check your network or Google Maps API quota.</div>';
    }
  }
}
window.searchVoltboxGmpPlaces = searchVoltboxGmpPlaces;

function submitVoltboxGmpSearch() {
  var inputEl = document.getElementById("voltbox-gmp-query-input");
  var q = inputEl && inputEl.value ? inputEl.value.trim() : "computer hardware electronics store in Bengaluru";
  searchVoltboxGmpPlaces(q);
}
window.submitVoltboxGmpSearch = submitVoltboxGmpSearch;

function runVoltboxGmpPreset(btnEl, queryStr) {
  var chips = document.querySelectorAll(".voltbox-gmp-preset-chip");
  for (var i = 0; i < chips.length; i++) {
    chips[i].classList.toggle("active", chips[i] === btnEl);
  }
  var inputEl = document.getElementById("voltbox-gmp-query-input");
  if (inputEl) {
    inputEl.value = queryStr;
  }
  searchVoltboxGmpPlaces(queryStr);
}
window.runVoltboxGmpPreset = runVoltboxGmpPreset;

function panVoltboxMapToUserLocation() {
  var statusEl = document.getElementById("voltbox-gmp-status-text");
  if (!navigator.geolocation) {
    if (statusEl) statusEl.textContent = "Browser geolocation is not available in this environment.";
    return;
  }
  if (statusEl) statusEl.textContent = "Requesting browser geolocation…";
  navigator.geolocation.getCurrentPosition(
    function (pos) {
      var coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
      if (voltboxGmpMap) {
        voltboxGmpMap.panTo(coords);
        voltboxGmpMap.setZoom(13);
      }
      searchVoltboxGmpPlaces("computer hardware electronics store", coords);
    },
    function () {
      if (statusEl) {
        statusEl.textContent = "Location permission declined or unavailable — showing regional search results.";
      }
    }
  );
}
window.panVoltboxMapToUserLocation = panVoltboxMapToUserLocation;

function openVoltboxMapsModal(initialQuery) {
  var overlay = document.getElementById("voltbox-maps-overlay");
  if (!overlay) return;
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");

  var inputEl = document.getElementById("voltbox-gmp-query-input");
  if (initialQuery && typeof initialQuery === "string" && inputEl) {
    inputEl.value = initialQuery;
    voltboxGmpInitialized = false;
  }

  if (inputEl && !inputEl.getAttribute("data-key-bound")) {
    inputEl.setAttribute("data-key-bound", "true");
    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        submitVoltboxGmpSearch();
      }
    });
  }

  initVoltboxGoogleMap();
}
window.openVoltboxMapsModal = openVoltboxMapsModal;

function closeVoltboxMapsModal() {
  var overlay = document.getElementById("voltbox-maps-overlay");
  if (!overlay) return;
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
}
window.closeVoltboxMapsModal = closeVoltboxMapsModal;

// ── Product Card Floating Context Menu (Right-Click, Long-Press & Quick-Action Button) ──
var activeContextMenuProductId = null;
var activeContextMenuAnchor = { x: 0, y: 0 };
var cardLongPressTimer = null;
var cardLongPressStart = { x: 0, y: 0, productId: null, triggered: false };
var contextMenuGlobalListenersBound = false;

function clearCardLongPressTimer() {
  if (cardLongPressTimer) {
    clearTimeout(cardLongPressTimer);
    cardLongPressTimer = null;
  }
}

function bindCardContextMenuInteractions(cardEl, productId) {
  if (!cardEl || !productId) return;

  // 1. Desktop Right-Click (contextmenu)
  cardEl.addEventListener("contextmenu", function (ev) {
    ev.preventDefault();
    ev.stopPropagation();
    var cx = typeof ev.clientX === "number" && ev.clientX > 0 ? ev.clientX : 0;
    var cy = typeof ev.clientY === "number" && ev.clientY > 0 ? ev.clientY : 0;
    if (!cx && !cy) {
      var r = cardEl.getBoundingClientRect();
      cx = Math.round(r.left + r.width * 0.5);
      cy = Math.round(r.top + r.height * 0.38);
    }
    openProductCardContextMenu(productId, cx, cy, "contextmenu");
  });

  // 2. Touch & Pointer Long-Press (480ms hold)
  cardEl.addEventListener("pointerdown", function (ev) {
    if (ev.button && ev.button !== 0) return;
    if (ev.target && ev.target.closest("button, a, input, select")) return;

    clearCardLongPressTimer();
    cardLongPressStart = {
      x: ev.clientX || 0,
      y: ev.clientY || 0,
      productId: productId,
      triggered: false
    };
    var holdMs = (window.VoltboxQR && window.VoltboxQR.CARD_LONG_PRESS_DURATION_MS) || 480;
    cardLongPressTimer = setTimeout(function () {
      cardLongPressTimer = null;
      cardLongPressStart.triggered = true;
      cardEl.classList.add("is-long-press-active");
      setTimeout(function () {
        cardEl.classList.remove("is-long-press-active");
      }, 240);
      openProductCardContextMenu(productId, cardLongPressStart.x, cardLongPressStart.y, "longpress");
    }, holdMs);
  });

  cardEl.addEventListener("pointermove", function (ev) {
    if (!cardLongPressTimer) return;
    var movedTooFar = (window.VoltboxQR && typeof window.VoltboxQR.shouldCancelLongPressOnMove === "function")
      ? window.VoltboxQR.shouldCancelLongPressOnMove(cardLongPressStart.x, cardLongPressStart.y, ev.clientX || 0, ev.clientY || 0)
      : (Math.hypot((ev.clientX || 0) - cardLongPressStart.x, (ev.clientY || 0) - cardLongPressStart.y) > 10);
    if (movedTooFar) {
      clearCardLongPressTimer();
    }
  });

  cardEl.addEventListener("pointerup", clearCardLongPressTimer);
  cardEl.addEventListener("pointercancel", clearCardLongPressTimer);
  cardEl.addEventListener("pointerleave", clearCardLongPressTimer);
}

function openCardQuickActionsFromButton(ev, productId) {
  if (ev) {
    ev.preventDefault();
    ev.stopPropagation();
  }
  var btnEl = document.getElementById("card-quick-actions-btn-" + productId);
  var cx = ev && ev.clientX ? ev.clientX : 0;
  var cy = ev && ev.clientY ? ev.clientY : 0;
  if (btnEl) {
    var rect = btnEl.getBoundingClientRect();
    cx = Math.round(rect.left);
    cy = Math.round(rect.bottom + 6);
  }
  openProductCardContextMenu(productId, cx, cy, "button");
}
window.openCardQuickActionsFromButton = openCardQuickActionsFromButton;

function copyTextToClipboardWithFallback(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    return navigator.clipboard.writeText(text).catch(function () {
      return fallbackCopyText(text);
    });
  }
  return Promise.resolve(fallbackCopyText(text));
}

function fallbackCopyText(text) {
  try {
    var ta = document.createElement("textarea");
    ta.value = String(text || "");
    ta.setAttribute("readonly", "readonly");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch (_e) {
    return false;
  }
}

function renderContextMenuItemsMarkup(product, items) {
  var sections = [
    { key: "primary", title: "Quick Actions" },
    { key: "clipboard", title: "Clipboard" },
    { key: "inspect", title: "Hardware Telemetry" }
  ];
  var html = "";
  for (var s = 0; s < sections.length; s++) {
    var sec = sections[s];
    var groupItems = items.filter(function (it) { return it.section === sec.key; });
    if (!groupItems.length) continue;
    if (s > 0) {
      html += '<div class="card-ctx-divider" role="separator"></div>';
    }
    html += '<div class="card-ctx-section-label">' + esc(sec.title) + '</div>';
    for (var i = 0; i < groupItems.length; i++) {
      var item = groupItems[i];
      var iconName = item.icon || "bolt";
      var btnClass = "card-ctx-item" + (item.active ? " is-active" : "") + (item.disabled ? " is-disabled" : "");
      html +=
        '<button type="button" class="' + btnClass + '"' +
        '        id="ctx-action-' + esc(item.id) + '"' +
        '        role="menuitem"' +
        '        data-ctx-action="' + esc(item.id) + '"' +
        '        data-testid="ctx-action-' + esc(item.id) + '"' +
        (item.disabled ? ' disabled' : '') +
        '        onclick="executeProductCardContextAction(\'' + esc(item.id) + '\', ' + product.id + ')">' +
          '<span class="card-ctx-item-icon">' + icon(iconName, 14) + '</span>' +
          '<span class="card-ctx-item-body">' +
            '<span class="card-ctx-item-label">' + esc(item.label) + '</span>' +
            (item.sublabel ? '<span class="card-ctx-item-sub">' + esc(item.sublabel) + '</span>' : '') +
          '</span>' +
          '<span class="card-ctx-item-right">' +
            (item.badgeText ? '<span class="card-ctx-item-badge">' + esc(item.badgeText) + '</span>' : '') +
            (item.shortcut ? '<kbd class="card-ctx-kbd">' + esc(item.shortcut) + '</kbd>' : '') +
          '</span>' +
        '</button>';
    }
  }
  return html;
}

function hydrateContextMenuBackendTelemetry(product) {
  var telemetryEl = document.getElementById("card-ctx-telemetry-bar");
  if (!telemetryEl || !product) return;
  var q = cart[product.id] || 0;
  var wish = isProductInWishlist(product.id);
  var comp = isProductInCompare(product.id);
  var alertSub = Boolean(getPriceAlertForProduct(product.id));
  var url = "/api/products/" + product.id + "/quick-actions?cartQty=" + q +
    "&wishlisted=" + wish + "&compared=" + comp + "&hasAlert=" + alertSub;

  fetch(url)
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !data.ok || activeContextMenuProductId !== product.id) return;
      var parts = [];
      if (data.rigBundleEligible) {
        parts.push('<span class="ctx-tele-pill is-teal">5% Rig Bundle Eligible</span>');
      }
      if (typeof data.sixMonthAvgPrice === "number" && data.sixMonthAvgPrice > 0) {
        parts.push('<span class="ctx-tele-stat">6M Avg: <strong>$' + Number(data.sixMonthAvgPrice).toFixed(2) + '</strong></span>');
      }
      if (parts.length > 0) {
        telemetryEl.innerHTML = parts.join('<span class="ctx-tele-sep">·</span>');
        telemetryEl.hidden = false;
      }
    })
    .catch(function () {});
}

function openProductCardContextMenu(productId, clientX, clientY, _source) {
  var pid = Number(productId);
  var p = findProductById(pid);
  var popover = document.getElementById("card-context-menu-popover");
  if (!p || !popover) return;

  activeContextMenuProductId = pid;
  activeContextMenuAnchor = { x: Number(clientX) || 240, y: Number(clientY) || 200 };

  var prevHighlight = document.querySelectorAll(".card.is-context-menu-open");
  for (var h = 0; h < prevHighlight.length; h++) {
    prevHighlight[h].classList.remove("is-context-menu-open");
  }
  var cardEl = document.querySelector('.card[data-product-id="' + pid + '"]');
  if (cardEl) {
    cardEl.classList.add("is-context-menu-open");
  }

  var sku = getSkuFor(p);
  var stockQty = getEffectiveStock(p);
  var lowStock = isLowStockItem(p);
  var q = cart[pid] || 0;
  var isWish = isProductInWishlist(pid);
  var isComp = isProductInCompare(pid);
  var hasAlert = Boolean(getPriceAlertForProduct(pid));

  var thumbEl = document.getElementById("card-ctx-thumb");
  if (thumbEl) {
    var hasRealPhoto = p.image && (p.image.indexOf("http") === 0 || p.image.indexOf("/") === 0);
    thumbEl.src = hasRealPhoto ? p.image : tileFor(p.category);
    thumbEl.alt = p.title;
  }
  var skuEl = document.getElementById("card-ctx-sku");
  if (skuEl) skuEl.textContent = sku;

  var stockEl = document.getElementById("card-ctx-stock");
  if (stockEl) {
    stockEl.textContent = stockQty <= 0 ? "Backorder" : (lowStock ? (stockQty + " left") : (stockQty + " in stock"));
    stockEl.className = "card-ctx-stock" + (stockQty <= 0 ? " is-out" : (lowStock ? " is-low" : ""));
  }

  var titleEl = document.getElementById("card-ctx-title");
  if (titleEl) titleEl.textContent = p.title;

  var items = (window.VoltboxQR && typeof window.VoltboxQR.buildProductContextMenuItems === "function")
    ? window.VoltboxQR.buildProductContextMenuItems({
        productId: pid,
        title: p.title,
        sku: sku,
        price: p.price,
        effectiveStock: stockQty,
        cartQty: q,
        isWishlisted: isWish,
        isCompared: isComp,
        hasPriceAlert: hasAlert
      })
    : [];

  var itemsContainer = document.getElementById("card-ctx-items");
  if (itemsContainer) {
    itemsContainer.innerHTML = renderContextMenuItemsMarkup(p, items);
  }

  var telemetryEl = document.getElementById("card-ctx-telemetry-bar");
  if (telemetryEl) {
    telemetryEl.hidden = true;
    telemetryEl.innerHTML = "";
  }

  popover.hidden = false;
  popover.classList.add("open");

  var menuRect = popover.getBoundingClientRect();
  var menuW = Math.max(256, Math.round(menuRect.width || 268));
  var menuH = Math.max(280, Math.round(menuRect.height || 360));
  var pos = (window.VoltboxQR && typeof window.VoltboxQR.computeProductContextMenuPosition === "function")
    ? window.VoltboxQR.computeProductContextMenuPosition(
        activeContextMenuAnchor.x,
        activeContextMenuAnchor.y,
        menuW,
        menuH,
        window.innerWidth || 1440,
        window.innerHeight || 900,
        12
      )
    : { left: Math.max(12, activeContextMenuAnchor.x), top: Math.max(12, activeContextMenuAnchor.y), transformOrigin: "top left" };

  popover.style.left = pos.left + "px";
  popover.style.top = pos.top + "px";
  popover.style.transformOrigin = pos.transformOrigin;

  hydrateContextMenuBackendTelemetry(p);
  ensureContextMenuGlobalListeners();
}
window.openProductCardContextMenu = openProductCardContextMenu;

function closeProductCardContextMenu() {
  activeContextMenuProductId = null;
  var popover = document.getElementById("card-context-menu-popover");
  if (popover) {
    popover.classList.remove("open");
    popover.hidden = true;
  }
  var highlighted = document.querySelectorAll(".card.is-context-menu-open");
  for (var i = 0; i < highlighted.length; i++) {
    highlighted[i].classList.remove("is-context-menu-open");
  }
}
window.closeProductCardContextMenu = closeProductCardContextMenu;

function executeProductCardContextAction(actionId, productId) {
  var pid = Number(productId || activeContextMenuProductId);
  var p = findProductById(pid);
  if (!p) {
    closeProductCardContextMenu();
    return;
  }
  var sku = getSkuFor(p);

  if (actionId === "add-to-cart") {
    inc(pid);
    if (typeof showWishlistToast === "function") {
      showWishlistToast("Added " + p.title + " ($" + p.price.toFixed(2) + ") to cart", "added");
    }
    closeProductCardContextMenu();
    return;
  }

  if (actionId === "toggle-wishlist") {
    var fakeEv = { stopPropagation: function () {}, preventDefault: function () {} };
    toggleWishlist(fakeEv, pid);
    closeProductCardContextMenu();
    return;
  }

  if (actionId === "toggle-compare") {
    toggleCompareItem(pid);
    closeProductCardContextMenu();
    return;
  }

  if (actionId === "copy-name") {
    var namePayload = (window.VoltboxQR && typeof window.VoltboxQR.formatProductCopyPayload === "function")
      ? window.VoltboxQR.formatProductCopyPayload({ id: p.id, title: p.title, sku: sku, price: p.price }, "name")
      : p.title;
    copyTextToClipboardWithFallback(namePayload).then(function () {
      if (typeof showWishlistToast === "function") {
        showWishlistToast('Copied "' + namePayload + '" to clipboard', "added");
      }
    });
    closeProductCardContextMenu();
    return;
  }

  if (actionId === "copy-sku") {
    var skuPayload = (window.VoltboxQR && typeof window.VoltboxQR.formatProductCopyPayload === "function")
      ? window.VoltboxQR.formatProductCopyPayload({ id: p.id, title: p.title, sku: sku, price: p.price }, "sku-price")
      : (p.title + " (" + sku + ") — $" + p.price.toFixed(2));
    copyTextToClipboardWithFallback(skuPayload).then(function () {
      if (typeof showWishlistToast === "function") {
        showWishlistToast("Copied SKU & price: " + skuPayload, "added");
      }
    });
    closeProductCardContextMenu();
    return;
  }

  if (actionId === "open-specs") {
    closeProductCardContextMenu();
    openSpecDrawer(pid);
    return;
  }

  if (actionId === "open-volatility") {
    closeProductCardContextMenu();
    openSpecDrawer(pid);
    setTimeout(function () {
      if (typeof window.scrollSpecDrawerToSection === "function") {
        window.scrollSpecDrawerToSection("d3-volatility");
      }
    }, 180);
    return;
  }

  if (actionId === "price-alert") {
    closeProductCardContextMenu();
    var alertEv = { stopPropagation: function () {}, preventDefault: function () {} };
    openPriceAlertModal(alertEv, pid);
    return;
  }
}
window.executeProductCardContextAction = executeProductCardContextAction;

function ensureContextMenuGlobalListeners() {
  if (contextMenuGlobalListenersBound) return;
  contextMenuGlobalListenersBound = true;

  document.addEventListener("pointerdown", function (ev) {
    if (!activeContextMenuProductId) return;
    var popover = document.getElementById("card-context-menu-popover");
    if (popover && !popover.hidden && !popover.contains(ev.target)) {
      if (ev.target && ev.target.closest(".card-quick-actions-btn")) return;
      closeProductCardContextMenu();
    }
  });

  window.addEventListener("scroll", function () {
    if (activeContextMenuProductId) {
      closeProductCardContextMenu();
    }
  }, { passive: true });

  window.addEventListener("resize", function () {
    if (activeContextMenuProductId) {
      closeProductCardContextMenu();
    }
  });

  document.addEventListener("keydown", function (ev) {
    if (!activeContextMenuProductId) return;
    if (ev.key === "Escape") {
      ev.preventDefault();
      closeProductCardContextMenu();
      return;
    }
    var popover = document.getElementById("card-context-menu-popover");
    if (!popover || popover.hidden) return;
    var enabledBtns = Array.prototype.slice.call(
      popover.querySelectorAll(".card-ctx-item:not([disabled])")
    );
    if (!enabledBtns.length) return;
    var currentIdx = enabledBtns.indexOf(document.activeElement);
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      var nextIdx = currentIdx < enabledBtns.length - 1 ? currentIdx + 1 : 0;
      enabledBtns[nextIdx].focus();
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      var prevIdx = currentIdx > 0 ? currentIdx - 1 : enabledBtns.length - 1;
      enabledBtns[prevIdx].focus();
    }
  });
}

// ============================================================================
// SERVER-SIDE SEARCH QUERY LOGGING (Posts debounced catalog searches to Java/Node controller)
// ============================================================================
var searchLogDebounceTimer = null;
var lastLoggedSearchSignature = "";

function dispatchServerSearchQueryLog(rawQuery, resultCount, source) {
  var cleaned = String(rawQuery || "").trim();
  if (cleaned.length < 2) return;
  var category = typeof activeCategoryFilter === "string" && activeCategoryFilter ? activeCategoryFilter : "all";
  var safeResults = Math.max(0, Math.floor(Number(resultCount) || 0));
  var sig = cleaned.toLowerCase() + "::" + category + "::" + safeResults + "::" + (source || "catalog-search");
  if (sig === lastLoggedSearchSignature) return;
  lastLoggedSearchSignature = sig;

  var headers = { "Content-Type": "application/json" };
  var tok = localStorage.getItem("voltbox_token");
  if (tok) {
    headers["Authorization"] = "Bearer " + tok;
  }

  fetch("/api/products/search-log", {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      query: cleaned,
      category: category,
      resultCount: safeResults,
      source: source || "catalog-search",
      actorName: localStorage.getItem("voltbox_user") || "guest"
    })
  }).catch(function () {});
}
window.dispatchServerSearchQueryLog = dispatchServerSearchQueryLog;

function scheduleServerSearchQueryLog(rawQuery, resultCount, source) {
  if (searchLogDebounceTimer) {
    clearTimeout(searchLogDebounceTimer);
    searchLogDebounceTimer = null;
  }
  var cleaned = String(rawQuery || "").trim();
  if (cleaned.length < 2) return;
  searchLogDebounceTimer = setTimeout(function () {
    searchLogDebounceTimer = null;
    dispatchServerSearchQueryLog(cleaned, resultCount, source || "catalog-search");
  }, 450);
}
window.scheduleServerSearchQueryLog = scheduleServerSearchQueryLog;

// ============================================================================
// iOS / APPLE HIG LIGHT MODE & DARK MODE CONTROLLER
// ============================================================================
var activeVoltboxColorMode = "dark";

function resolveCurrentColorMode() {
  var saved = localStorage.getItem("voltbox_color_mode");
  if (window.VoltboxQR && typeof window.VoltboxQR.resolveIosColorMode === "function") {
    return window.VoltboxQR.resolveIosColorMode(saved);
  }
  return saved === "light" ? "light" : "dark";
}

function applyVoltboxColorMode(modeInput, persist) {
  var mode = (String(modeInput || "").toLowerCase() === "light") ? "light" : "dark";
  activeVoltboxColorMode = mode;

  document.documentElement.setAttribute("data-color-mode", mode);
  if (document.body) {
    document.body.setAttribute("data-color-mode", mode);
    document.body.classList.toggle("ios-light-mode", mode === "light");
    document.body.classList.toggle("ios-dark-mode", mode === "dark");
  }

  var metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", mode === "light" ? "#F2F2F7" : "#000000");
  }

  if (persist !== false) {
    try {
      localStorage.setItem("voltbox_color_mode", mode);
    } catch (_e) {}
  }

  var btnEl = document.getElementById("topbar-theme-mode-btn");
  var iconEl = document.getElementById("topbar-theme-mode-icon");
  var textEl = document.getElementById("topbar-theme-mode-text");
  if (btnEl) {
    btnEl.setAttribute("data-active-mode", mode);
    btnEl.setAttribute("aria-pressed", mode === "light" ? "true" : "false");
    btnEl.setAttribute(
      "title",
      mode === "light"
        ? "iOS Light Mode active — Click to switch to Dark Mode"
        : "iOS Dark Mode active — Click to switch to Light Mode"
    );
  }
  if (iconEl) {
    iconEl.textContent = mode === "light" ? "☾" : "☀";
  }
  if (textEl) {
    textEl.textContent = mode === "light" ? "Dark" : "Light";
  }
}
window.applyVoltboxColorMode = applyVoltboxColorMode;

function toggleVoltboxColorMode() {
  var nextMode = activeVoltboxColorMode === "light" ? "dark" : "light";
  applyVoltboxColorMode(nextMode, true);
  if (typeof showWishlistToast === "function") {
    showWishlistToast(
      nextMode === "light" ? "Switched to iOS Light Mode" : "Switched to iOS Dark Mode",
      "added"
    );
  }
  return nextMode;
}
window.toggleVoltboxColorMode = toggleVoltboxColorMode;

// Initialize iOS Color Mode on load
(function initVoltboxColorModeOnReady() {
  var initialMode = resolveCurrentColorMode();
  applyVoltboxColorMode(initialMode, false);
  if (searchEl) {
    searchEl.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" && searchEl.value && searchEl.value.trim().length >= 2) {
        var visibleCountEl = document.getElementById("catalog-visible-count");
        var shown = visibleCountEl ? Number(visibleCountEl.textContent || 0) : 0;
        dispatchServerSearchQueryLog(searchEl.value.trim(), shown, "catalog-search-enter");
      }
    });
  }
})();


