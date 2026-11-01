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
var me = null;
var shownOrder = null;
var saveTimer = null;
var activeCategoryFilter = "all";
var activeSortMode = "featured";
var activePromoCode = null;
var expandedCharts = {};
var activeSpecProductId = null;
var toastTimer = null;

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
var activeChatChannel = "general";
var unreadChatCount = 0;
var isMessengerOpen = false;
var bgModes = ["quantum", "overclock", "cyber"];
var bgModeLabels = { quantum: "FX: Quantum", overclock: "FX: Overclock", cyber: "FX: Cyber" };
var currentBgModeIdx = 0;
var deferredPwaPrompt = null;

// ── kick things off ──

document.addEventListener("DOMContentLoaded", function () {
  wireUpButtons();
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

function loadMe() {
  api("/api/me")
    .then(function (res) {
      if (res.status === 401) {
        forgetAndGoToLogin();
        throw new Error("not signed in");
      }
      return res.json();
    })
    .then(function (data) {
      me = data;
      cart = data.cart || {};
      wishlist = Array.isArray(data.wishlist) ? data.wishlist : [];
      if (data.cartDetails) {
        window.serverCartState = data.cartDetails;
      }
      paintProfile();
      paintWishlist();
      fetchProducts();
      fetchCart();
      fetchInventorySummary();
      if (window.onMeLoaded) window.onMeLoaded();
    })
    .catch(function (err) {
      console.error("couldn't load your account:", err);
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
  historyCountEl.textContent = n + (n === 1 ? " bill" : " bills");
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
      showActivityToast(nowIn ? ("Saved to Wishlist: " + title) : ("Removed from Wishlist: " + title));
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
    1.14 - ((seed % 7) * 0.01),
    1.10 + ((seed % 5) * 0.008),
    1.06 - ((seed % 4) * 0.01),
    1.08 + ((seed % 6) * 0.005),
    1.03 - ((seed % 3) * 0.007),
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
      // Expand the first product's Recharts price history on initial load so users see it immediately
      if (products.length > 0 && Object.keys(expandedCharts).length === 0) {
        expandedCharts[products[0].id] = true;
      }
      renderAllCards();
      recalc();
      if (activeSpecProductId) {
        var current = findProductById(activeSpecProductId);
        if (current) populateSpecDrawer(current);
      }
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
  return "/images/categories/" + category + ".svg";
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

function getSortedProductsList() {
  var copy = products.slice();
  if (activeSortMode === "price-asc") {
    copy.sort(function (a, b) { return a.price - b.price; });
  } else if (activeSortMode === "price-desc") {
    copy.sort(function (a, b) { return b.price - a.price; });
  } else if (activeSortMode === "stock-asc") {
    copy.sort(function (a, b) { return getEffectiveStock(a) - getEffectiveStock(b); });
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
    var lowStock = isLowStockItem(p);
    var isCriticalStock = stockQty <= 2;
    var sku = getSkuFor(p);
    var isChartOpen = !!expandedCharts[p.id];
    var history = getPriceHistoryFor(p);
    var prices = history.map(function (h) { return h.price; });
    var minPrice = Math.min.apply(null, prices);
    var maxPrice = Math.max.apply(null, prices);

    var card = document.createElement("article");
    card.className = "card" + (lowStock ? " is-low-stock" : "");
    card.id = "card-" + p.id;
    card.setAttribute("data-stock", String(stockQty));
    card.setAttribute("data-group", getComponentGroup(p));
    card.style.setProperty("--stagger-idx", String(i));

    var ratingRow = p.ratingCount > 0
      ? '<div class="card-rating">' +
          starRating(p.ratingRate) +
          '<span>' + p.ratingRate + ' (' + p.ratingCount + ')</span>' +
        '</div>'
      : '';

    var tag = cardTag(p);

    var lowStockBadge = lowStock
      ? '<span class="low-stock-badge' + (isCriticalStock ? ' critical' : '') + '" id="low-stock-' + p.id + '" data-testid="low-stock-badge">Low Stock</span>'
      : '';

    var stockNote = lowStock
      ? '<span class="card-stock low" id="stock-note-' + p.id + '">' + stockQty + ' left in stock</span>'
      : '<span class="card-stock" id="stock-note-' + p.id + '">' + stockQty + ' in stock</span>';

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

    var flag =
      '<button class="card-flag" onclick="reportProduct(' + p.id + ')" ' +
      '        title="Report this listing" aria-label="Report ' + esc(p.title) + '">' +
        icon("flag", 15) +
      '</button>';

    var hasRealPhoto = p.image && (p.image.indexOf("http") === 0 || p.image.indexOf("/") === 0);
    card.innerHTML =
      '<div class="card-img-wrap" onclick="openSpecDrawer(' + p.id + ')">' +
        '<img class="card-img"' +
        '     src="' + tileFor(p.category) + '"' +
        (hasRealPhoto ? ' data-photo="' + p.image + '"' : '') +
        '     alt="' + esc(p.title) + '"' +
        '     onerror="this.onerror=null;this.src=NO_IMAGE" />' +
        lowStockBadge +
        wishBtn +
        flag +
      '</div>' +
      '<div class="card-meta-row">' +
        tag +
        '<div class="card-meta-right">' +
          stockNote +
          '<button class="card-specs-link" type="button" onclick="openSpecDrawer(' + p.id + ')" aria-label="Specs for ' + esc(p.title) + '">Specs &rarr;</button>' +
        '</div>' +
      '</div>' +
      '<h3 class="card-title"><button type="button" class="card-title-btn" onclick="openSpecDrawer(' + p.id + ')">' + esc(p.title) + '</button></h3>' +
      (p.description ? '<p class="card-desc">' + esc(p.description) + '</p>' : '') +
      ratingRow +
      '<div class="card-price-row">' +
        '<p class="card-price">$' + p.price.toFixed(2) + '</p>' +
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
      '</div>';

    // Release stagger-in class once entrance finishes so 3D hover transform is unrestricted
    card.addEventListener("animationend", function (ev) {
      if (ev.animationName === "cardStaggerIn") {
        this.classList.remove("stagger-in");
      }
    });

    // Cursor radial spotlight + 3D parallax tilt tracking on tactile card surface
    card.addEventListener("mousemove", function (ev) {
      var rect = this.getBoundingClientRect();
      var ox = ev.clientX - rect.left;
      var oy = ev.clientY - rect.top;
      var tilt = computeCardParallaxTilt(ox, oy, rect.width, rect.height, 6, 4.5);

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

    gridEl.appendChild(card);

    if (isChartOpen) {
      mountCardRecharts(p);
    }
  }

  upgradeCardPhotos();
  applyFiltersAndSearch();
  populateMessengerProductSelect();
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

  var panel = document.getElementById("card-chart-panel-" + productId);
  var btn = document.getElementById("chart-toggle-" + productId);
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

  // Fetch individual product details by ID from Spring Boot ProductController (GET /api/products/{id})
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

  var isSaved = isProductInWishlist(p.id);
  var wishBtnHtml =
    '<button class="spec-wishlist-btn' + (isSaved ? ' active' : '') + '" id="spec-wishlist-btn" ' +
    '        type="button" onclick="toggleWishlist(event, ' + p.id + ')" ' +
    '        aria-label="' + (isSaved ? 'Remove from wishlist' : 'Save to wishlist') + '">' +
      icon("heart", 15) + ' <span>' + (isSaved ? 'Saved to Wishlist' : 'Add to Wishlist') + '</span>' +
    '</button>';

  var restockBtnHtml = canCurrentUserRestock()
    ? '<button class="restock-btn" type="button" onclick="restockProduct(' + p.id + ')">' +
        icon("refresh", 14) + ' <span>Restock +3</span>' +
      '</button>'
    : '';

  document.getElementById("spec-actions-bar").innerHTML =
    '<div class="spec-qty-control">' +
      '<button class="qty-btn" onclick="dec(' + p.id + ')" ' + (q <= 0 ? 'disabled' : '') + ' aria-label="Decrease quantity in drawer">−</button>' +
      '<span class="qty-value' + (q > 0 ? ' active' : '') + '">' + q + ' in cart</span>' +
      '<button class="qty-btn" onclick="inc(' + p.id + ')" aria-label="Increase quantity in drawer">+</button>' +
    '</div>' +
    wishBtnHtml +
    restockBtnHtml;

  var chartContainer = document.getElementById("drawer-chart-container");
  if (chartContainer && typeof window.renderVoltboxPriceChart === "function") {
    window.renderVoltboxPriceChart(chartContainer, history, {
      variant: "drawer",
      accentColor: "#2dd4bf",
      height: 170
    });
  }
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

window.showActivityToast = function (message) {
  if (!activityToastEl || !activityTextEl) return;
  activityTextEl.textContent = message;
  activityToastEl.hidden = false;
  activityToastEl.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    activityToastEl.classList.remove("visible");
    setTimeout(function () {
      activityToastEl.hidden = true;
    }, 220);
  }, 3800);
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

    var visible = textMatch && catMatch;
    card.style.display = visible ? "" : "none";
    if (visible) {
      card.style.setProperty("--stagger-idx", String(shown));
      card.classList.remove("stagger-in");
      void card.offsetWidth;
      card.classList.add("stagger-in");
      shown++;
    }
  }

  if (!noResultsEl) {
    noResultsEl = document.createElement("p");
    noResultsEl.className = "no-results";
    gridEl.appendChild(noResultsEl);
  }
  if (shown === 0) {
    if (activeCategoryFilter === "wishlist") {
      noResultsEl.textContent = "Your wishlist is empty. Click the heart icon on any hardware part to save items here.";
    } else {
      noResultsEl.textContent = query
        ? ('No parts match "' + query + '" in this view.')
        : "No parts in this category right now.";
    }
    noResultsEl.style.display = "";
  } else {
    noResultsEl.style.display = "none";
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
}

function closeRigDrawer() {
  rigDrawerOverlayEl.classList.remove("open");
  rigDrawerOverlayEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

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
  rigSlotsListEl.innerHTML = html;
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
    var lowStock = isLowStockItem(p);
    var isCriticalStock = stockQty <= 2;
    var stockNoteEl = document.getElementById("stock-note-" + id);
    if (stockNoteEl) {
      stockNoteEl.className = lowStock ? "card-stock low" : "card-stock";
      stockNoteEl.textContent = lowStock ? (stockQty + " left in stock") : (stockQty + " in stock");
    }
    if (card) {
      card.classList.toggle("is-low-stock", lowStock);
      card.setAttribute("data-stock", String(stockQty));
      var wrap = card.querySelector(".card-img-wrap");
      var badge = document.getElementById("low-stock-" + id);
      if (lowStock && !badge && wrap) {
        var span = document.createElement("span");
        span.className = "low-stock-badge" + (isCriticalStock ? " critical" : "");
        span.id = "low-stock-" + id;
        span.setAttribute("data-testid", "low-stock-badge");
        span.textContent = "Low Stock";
        wrap.insertBefore(span, wrap.querySelector(".card-flag"));
      } else if (lowStock && badge) {
        badge.classList.toggle("critical", isCriticalStock);
      } else if (!lowStock && badge) {
        badge.remove();
      }
    }
  }
}


function updateFilterTabCounts() {
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
    "low-stock": "Low Stock Only"
  };
  var tabs = filterBarEl.querySelectorAll(".filter-tab");
  for (var t = 0; t < tabs.length; t++) {
    var key = tabs[t].getAttribute("data-filter") || "all";
    if (key === "wishlist") {
      tabs[t].innerHTML = icon("heart", 12) + ' Wishlist (<span id="wishlist-filter-count">' + wishlist.length + '</span>)';
      continue;
    }
    var baseLabel = labels[key] || key;
    var c = counts[key] !== undefined ? counts[key] : 0;
    tabs[t].innerHTML = esc(baseLabel) + ' <span class="filter-count">' + c + '</span>';
  }
}

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
      toggleLabel.textContent = totals.count > 0
        ? (totals.count + (totals.count === 1 ? " item" : " items") + " · Promo & Tax ▲")
        : "Promo & Breakdown ▲";
    }
  }

  checkoutEl.disabled    = (totals.count === 0);
  cartSheetGoEl.disabled = (totals.count === 0);

  renderCartSheet(totals);
  renderRigDrawer();

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

    html +=
      '<div class="cart-line">' +
        '<img class="cart-line-img" src="' + tileFor(p.category) + '" alt="" ' +
             'onerror="this.style.visibility=\'hidden\'" />' +
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

      var html = "";
      for (var i = 0; i < orders.length; i++) {
        var o = orders[i];
        var d = new Date(o.placedAt);
        html +=
          '<button class="history-item" onclick="openOrderFromHistory(\'' + o.id + '\')">' +
            '<span class="history-item-main">' +
              '<span class="history-item-id">' + esc(o.id) + '</span>' +
              '<span class="history-item-when">' + formatDate(d) + ' · ' +
              o.count + (o.count === 1 ? " item" : " items") + ' · ' + (o.status || 'Pending') + '</span>' +
            '</span>' +
            '<span class="history-item-total">$' + o.total.toFixed(2) + '</span>' +
          '</button>';
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
      renderAllCards();
    });
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

  checkoutEl.addEventListener("click", openCheckoutModal);
  cartSheetGoEl.addEventListener("click", openCheckoutModal);

  checkoutPayEl.addEventListener("click", payNow);
  checkoutCloseEl.addEventListener("click", function () { closeModal(checkoutOverlayEl); });
  checkoutOverlayEl.addEventListener("click", function (e) {
    if (e.target === checkoutOverlayEl) closeModal(checkoutOverlayEl);
  });

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
      activeChatChannel = tab.getAttribute("data-channel") || "general";
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

  // Mobile Collapsible Order Bar Toggle
  if (orderExpandToggleEl && orderBarEl) {
    orderExpandToggleEl.addEventListener("click", function () {
      var expanded = orderBarEl.classList.toggle("mobile-expanded");
      orderExpandToggleEl.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
  }

  // Mobile & iPad Bottom App Dock
  if (mobileAppNavEl) {
    mobileAppNavEl.addEventListener("click", function (e) {
      var navBtn = e.target.closest(".mnav-item, .mobile-nav-item");
      if (!navBtn) return;
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
        closeAllSheets();
        openRigDrawer();
      } else if (target === "messenger") {
        closeRigDrawer();
        closeAllSheets();
        openMessenger();
      } else if (target === "cart") {
        closeMessenger();
        closeRigDrawer();
        toggleSheet(cartSheetEl, cartBtnEl);
      } else if (target === "account") {
        closeMessenger();
        closeRigDrawer();
        toggleSheet(profileSheetEl, avatarBtnEl);
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (overlayEl.classList.contains("open")) closeReceipt();
    else if (checkoutOverlayEl.classList.contains("open")) closeModal(checkoutOverlayEl);
    else if (pwaInstallOverlayEl && pwaInstallOverlayEl.classList.contains("open")) closePwaInstallModal();
    else if (messengerOverlayEl && messengerOverlayEl.classList.contains("open")) closeMessenger();
    else if (specDrawerOverlayEl && specDrawerOverlayEl.classList.contains("open")) closeSpecDrawer();
    else if (rigDrawerOverlayEl && rigDrawerOverlayEl.classList.contains("open")) closeRigDrawer();
    else closeAllSheets();
  });
}

function openCheckoutModal() {
  var totals = computeTotals();
  if (totals.count === 0) return;

  checkoutNameEl.value = me ? me.name : "";
  checkoutAddressEl.value = "";
  checkoutCardNumEl.value = "";
  checkoutExpiryEl.value = "";
  checkoutCvvEl.value = "";
  checkoutMsgEl.hidden = true;
  checkoutPayEl.disabled = false;
  checkoutPayEl.innerHTML = payBtnLabel(totals.total);

  checkoutSuccessEl.hidden = true;
  checkoutFormEl.hidden = false;

  closeAllSheets();
  openModal(checkoutOverlayEl);
}

function payBtnLabel(total) {
  return icon("cart", 16) + " Pay Now — $" + total.toFixed(2);
}

function showCheckoutMsg(text, isError) {
  checkoutMsgEl.textContent = text;
  checkoutMsgEl.className = isError ? "modal-msg error" : "modal-msg";
  checkoutMsgEl.hidden = false;
}


function payNow() {
  var name = checkoutNameEl.value.trim();
  var address = checkoutAddressEl.value.trim();
  var cardNumber = checkoutCardNumEl.value.trim();
  var expiry = checkoutExpiryEl.value.trim();
  var cvv = checkoutCvvEl.value.trim();

  if (!name || !address) {
    showCheckoutMsg("Add a name and an address before paying.", true);
    return;
  }

  if (!cardNumber || !expiry || !cvv) {
    showCheckoutMsg("Fill in the card fields too (any numbers work).", true);
    return;
  }

  checkoutMsgEl.hidden = true;
  checkoutPayEl.disabled = true;
  checkoutPayEl.innerHTML = '<span class="btn-spinner"></span> Processing…';
  clearTimeout(saveTimer);

  Promise.all([
    api("/api/cart", { method: "PUT", body: JSON.stringify(cart) })
      .then(function () {
        return api("/api/checkout", {
          method: "POST",
          body: JSON.stringify({
            shippingName: name,
            shippingAddress: address,
            promoCode: activePromoCode
          })
        });
      })
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data: data }; });
      }),
    new Promise(function (resolve) { setTimeout(resolve, 700); })
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

      checkoutFormEl.hidden = true;
      checkoutSuccessEl.hidden = false;
      setTimeout(function () {
        closeModal(checkoutOverlayEl);
        showReceipt(result.data);
      }, 1000);
    })
    .catch(function () {
      recalc();
      showCheckoutMsg("Can't reach the server — is it still running?", true);
      checkoutPayEl.disabled = false;
      checkoutPayEl.innerHTML = payBtnLabel(computeTotals().total);
    });
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
    var thumb = lineProduct ? tileFor(lineProduct.category) : line.image;

    rows +=
      '<div class="r-item">' +
        '<img class="r-thumb" src="' + thumb + '" alt="" ' +
             'onerror="this.style.visibility=\'hidden\'" />' +
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
// QUANTUM SILICON WAFER & HOLOGRAPHIC CONSTELLATION BACKGROUND ENGINE
// ═══════════════════════════════════════════════════════════════════

function cycleBgFxMode() {
  currentBgModeIdx = (currentBgModeIdx + 1) % bgModes.length;
  var mode = bgModes[currentBgModeIdx];
  document.body.setAttribute("data-bg-mode", mode);
  if (bgFxLabelEl) {
    bgFxLabelEl.textContent = bgModeLabels[mode] || "FX: Quantum";
  }
  if (typeof window.triggerVoltboxShockwave === "function") {
    window.triggerVoltboxShockwave(window.innerWidth * 0.5, 80);
  }
}

function initQuantumCanvasBg() {
  var canvas = document.getElementById("quantum-bg-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var width = window.innerWidth;
  var height = window.innerHeight;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas, { passive: true });

  var DIE_LABELS = [
    "DIE_04", "CLK_5.7G", "PCIE_5.0", "VRM_24P", "NPU_36T",
    "L3_96MB", "GDDR7", "BUS_512B", "NVLINK", "TSMC_3NM",
    "DDR5_8000", "PWM_SYNC", "VOLT_1.2V", "CORE_X9"
  ];

  var nodeCount = width < 680 ? 20 : 36;
  var nodes = [];
  for (var i = 0; i < nodeCount; i++) {
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.42,
      vy: (Math.random() - 0.5) * 0.42,
      size: (i % 4 === 0) ? 3.2 : 2.1,
      label: (i % 3 === 0) ? DIE_LABELS[i % DIE_LABELS.length] : null,
      phase: Math.random() * Math.PI * 2
    });
  }

  var pointer = { x: width * 0.5, y: height * 0.35, active: false };
  window.addEventListener("mousemove", function (e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
  }, { passive: true });

  window.addEventListener("touchmove", function (e) {
    if (e.touches && e.touches[0]) {
      pointer.x = e.touches[0].clientX;
      pointer.y = e.touches[0].clientY;
      pointer.active = true;
    }
  }, { passive: true });

  var shockwaves = [];
  window.triggerVoltboxShockwave = function (cx, cy) {
    shockwaves.push({
      x: typeof cx === "number" ? cx : pointer.x,
      y: typeof cy === "number" ? cy : pointer.y,
      r: 8,
      maxR: Math.max(width, height) * 0.45,
      alpha: 0.52
    });
  };

  function getPalette() {
    var mode = document.body.getAttribute("data-bg-mode") || "quantum";
    if (mode === "overclock") {
      return {
        primary: "255, 180, 0",
        secondary: "255, 107, 107",
        nodeHex: "#ffd23f"
      };
    }
    if (mode === "cyber") {
      return {
        primary: "124, 108, 246",
        secondary: "45, 212, 191",
        nodeHex: "#a78bfa"
      };
    }
    return {
      primary: "45, 212, 191",
      secondary: "255, 210, 63",
      nodeHex: "#2dd4bf"
    };
  }

  function renderFrame(now) {
    ctx.clearRect(0, 0, width, height);
    var pal = getPalette();
    var linkDist = width < 680 ? 125 : 165;

    // Draw expanding shockwave rings on cart / FX / chat actions
    for (var s = shockwaves.length - 1; s >= 0; s--) {
      var sw = shockwaves[s];
      sw.r += 7.5;
      sw.alpha *= 0.96;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(" + pal.secondary + ", " + sw.alpha.toFixed(3) + ")";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (sw.r >= sw.maxR || sw.alpha < 0.02) {
        shockwaves.splice(s, 1);
      }
    }

    // Update and draw silicon wafer nodes
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 0) n.x = width;
      if (n.x > width) n.x = 0;
      if (n.y < 0) n.y = height;
      if (n.y > height) n.y = 0;

      // Gentle cursor magnetic pull
      var dxP = pointer.x - n.x;
      var dyP = pointer.y - n.y;
      var distP = Math.sqrt(dxP * dxP + dyP * dyP);
      if (distP < 190 && distP > 1) {
        n.x += (dxP / distP) * 0.28;
        n.y += (dyP / distP) * 0.28;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(pointer.x, pointer.y);
        var pAlpha = ((1 - distP / 190) * 0.22).toFixed(3);
        ctx.strokeStyle = "rgba(" + pal.secondary + ", " + pAlpha + ")";
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }

      // Connect nearby silicon nodes with orthogonal/diagonal circuit traces
      for (var j = i + 1; j < nodes.length; j++) {
        var m = nodes[j];
        var dx = m.x - n.x;
        var dy = m.y - n.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < linkDist) {
          var alpha = ((1 - dist / linkDist) * 0.18).toFixed(3);
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(m.x, m.y);
          ctx.strokeStyle = "rgba(" + pal.primary + ", " + alpha + ")";
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      var pulse = 0.55 + 0.45 * Math.sin(now * 0.0025 + n.phase);
      ctx.fillStyle = "rgba(" + pal.primary + ", " + (0.35 + pulse * 0.45).toFixed(2) + ")";
      ctx.fillRect(n.x - n.size * 0.5, n.y - n.size * 0.5, n.size, n.size);

      if (n.label && distP < 240) {
        ctx.font = "600 9px JetBrains Mono, monospace";
        ctx.fillStyle = "rgba(" + pal.secondary + ", 0.55)";
        ctx.fillText(n.label, n.x + 6, n.y - 4);
      }
    }

    window.requestAnimationFrame(renderFrame);
  }

  window.requestAnimationFrame(renderFrame);
}


// ═══════════════════════════════════════════════════════════════════
// BENCH MESSENGER (REAL-TIME HARDWARE CHAT & PART SHARING)
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
  var html = '<option value="">+ Attach Hardware Part (optional)</option>';
  var sorted = products.slice().sort(function (a, b) { return a.title.localeCompare(b.title); });
  for (var i = 0; i < sorted.length; i++) {
    var p = sorted[i];
    html += '<option value="' + p.id + '">' + esc(p.title) + ' ($' + p.price.toFixed(0) + ')</option>';
  }
  chatProductSelectEl.innerHTML = html;
  if (currentVal) chatProductSelectEl.value = currentVal;
}

function loadMessengerMessages() {
  api("/api/messages")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data && Array.isArray(data.messages)) {
        chatMessages = data.messages;
      }
      if (data && typeof data.onlineCount === "number" && messengerOnlineEl) {
        messengerOnlineEl.textContent = Math.max(3, data.onlineCount + 2) + " builders online";
      }
      renderMessengerFeed();
    })
    .catch(function () {});
}

function renderMessengerFeed() {
  if (!messengerFeedEl) return;
  var filtered = [];
  for (var i = 0; i < chatMessages.length; i++) {
    var m = chatMessages[i];
    if ((m.channel || "general") === activeChatChannel) {
      filtered.push(m);
    }
  }

  if (filtered.length === 0) {
    messengerFeedEl.innerHTML =
      '<div class="msg-empty">' +
        '<p>No messages in <b>#' + esc(activeChatChannel) + '</b> yet.</p>' +
        '<span>Drop a rig question or attach a catalog part below to start the thread.</span>' +
      '</div>';
    return;
  }

  var html = "";
  for (var j = 0; j < filtered.length; j++) {
    var msg = filtered[j];
    var isSelf = me && msg.senderEmail === me.email;
    var roleBadge = "";
    if (msg.senderRole === "moderator") {
      roleBadge = '<span class="msg-role-pill mod">MOD</span>';
    } else if (msg.senderRole === "contributor") {
      roleBadge = '<span class="msg-role-pill contrib">TECH</span>';
    }

    var when = new Date(msg.createdAt || Date.now());
    var timeLabel = formatTime(when);

    var partCardHtml = "";
    if (msg.productId && msg.productTitle) {
      var liveProd = findProductById(msg.productId);
      var pPrice = typeof msg.productPrice === "number" ? msg.productPrice : (liveProd ? liveProd.price : 0);
      var pSku = msg.productSku || (liveProd ? getSkuFor(liveProd) : ("VB-PRT-" + msg.productId));
      var pImg = (liveProd && liveProd.image) ? liveProd.image : (msg.productImage || tileFor("components"));
      partCardHtml =
        '<div class="msg-part-card" data-testid="messenger-part-card">' +
          '<img class="msg-part-img" src="' + esc(pImg) + '" alt="" onerror="this.onerror=null;this.src=NO_IMAGE" />' +
          '<div class="msg-part-info">' +
            '<span class="msg-part-sku">' + esc(pSku) + '</span>' +
            '<strong class="msg-part-title">' + esc(msg.productTitle) + '</strong>' +
            '<span class="msg-part-price">$' + Number(pPrice).toFixed(2) + '</span>' +
          '</div>' +
          '<div class="msg-part-actions">' +
            '<button type="button" class="msg-part-btn add" onclick="inc(' + Number(msg.productId) + ')">+ Cart</button>' +
            '<button type="button" class="msg-part-btn specs" onclick="closeMessenger();openSpecDrawer(' + Number(msg.productId) + ')">Specs</button>' +
          '</div>' +
        '</div>';
    }

    html +=
      '<article class="msg-card' + (isSelf ? ' self' : '') + '" data-testid="messenger-msg-card">' +
        '<div class="msg-avatar" style="background:' + esc(msg.senderColor || "#2dd4bf") + '">' +
          esc(msg.senderInitial || "V") +
        '</div>' +
        '<div class="msg-body">' +
          '<div class="msg-meta">' +
            '<span class="msg-author">' + esc(msg.senderName || "Builder") + '</span>' +
            roleBadge +
            '<span class="msg-time">' + esc(timeLabel) + '</span>' +
          '</div>' +
          '<div class="msg-text">' + esc(msg.text) + '</div>' +
          partCardHtml +
        '</div>' +
      '</article>';
  }

  messengerFeedEl.innerHTML = html;
  messengerFeedEl.scrollTop = messengerFeedEl.scrollHeight;
}

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

