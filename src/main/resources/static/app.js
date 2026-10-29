
var TAX_RATE = 0.0825; 
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
var me = null;          
var shownOrder = null;  
var saveTimer = null;    

// ── grab DOM elements once ──
var gridEl      = document.getElementById("product-grid");
var loadingEl   = document.getElementById("loading");
var searchEl    = document.getElementById("product-search");
var subEl       = document.getElementById("subtotal");
var taxEl       = document.getElementById("tax");
var totalEl     = document.getElementById("total");
var checkoutEl  = document.getElementById("checkout-btn");

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
var overlayEl      = document.getElementById("receipt-overlay");
var receiptBodyEl  = document.getElementById("receipt-body");
var receiptCloseEl = document.getElementById("receipt-close");
var receiptPrintEl = document.getElementById("receipt-print");
var receiptEmailEl = document.getElementById("receipt-email");
var receiptMsgEl   = document.getElementById("receipt-msg");

// checkout modal (shipping + the fake "Pay Now" step)
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


// ── kick things off ──

document.addEventListener("DOMContentLoaded", function () {
  wireUpButtons();
  watchScroll();
  loadMe();              
});



function myToken() {
  return localStorage.getItem("voltbox_token") || "";
}

// a fetch() with the session token already attached
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
      paintProfile();
      fetchProducts();
      // let community.js build the admin panel now that we know the role
      if (window.onMeLoaded) window.onMeLoaded();
    })
    .catch(function (err) {
      console.error("couldn't load your account:", err);
    });
}

// fill in the avatar and everything inside the profile panel
function paintProfile() {
  avatarEl.textContent = me.initial;
  avatarBigEl.textContent = me.initial;
  avatarEl.style.background = me.color;
  avatarBigEl.style.background = me.color;

  profileNameEl.textContent = me.name;
  profileEmailEl.textContent = me.email;

  billInputEl.value = me.billEmail || "";
  paintHistoryCount(me.orderCount);

  // be upfront when the server can't actually send mail yet
  if (!me.mailReady) {
    billNoteEl.textContent =
      "Emailing bills isn't switched on for this shop yet — you can still " +
      "save an address here for when it is.";
  }
}

function paintHistoryCount(n) {
  historyCountEl.textContent = n + (n === 1 ? " bill" : " bills");
}

function signOut() {
  api("/api/logout", { method: "POST" })
    .catch(function () { /* server's gone? forget the token locally anyway */ })
    .then(forgetAndGoToLogin);
}

function forgetAndGoToLogin() {
  localStorage.removeItem("voltbox_token");
  localStorage.removeItem("voltbox_user");
  window.location.replace("login.html");
}


// ── fetch the product list from our spring boot backend ──

function fetchProducts() {
  fetch("/api/products")
    .then(function (res) {
      if (!res.ok) throw new Error("server returned " + res.status);
      return res.json();
    })
    .then(function (data) {
      products = data;
      renderAllCards();
      recalc();               // the saved cart might already have things in it
    })
    .catch(function (err) {
      console.error("couldn't load products:", err);
      loadingEl.innerHTML =
        '<p style="color:#ff6b6b;">couldn\'t load products — is the server running?</p>';
    });
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
    probe.src = "";            // give up on a hanging photo; the tile stays
  }, 8000);

  probe.onload = function () {
    clearTimeout(timer);
    img.src = url;             // arrived → upgrade the card to the real photo
  };
  probe.src = url;
}

// the local category tile for a product — the always-available base image
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


// ── build the card HTML for every product and drop it in the grid ──

function renderAllCards() {
  loadingEl.classList.add("gone");

  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var q = cart[p.id] || 0;

    var card = document.createElement("article");
    card.className = "card";
    card.id = "card-" + p.id;

    var ratingRow = p.ratingCount > 0
      ? '<div class="card-rating">' +
          starRating(p.ratingRate) +
          '<span>' + p.ratingRate + ' (' + p.ratingCount + ')</span>' +
        '</div>'
      : '';

    var tag = cardTag(p);

    var flag =
      '<button class="card-flag" onclick="reportProduct(' + p.id + ')" ' +
      '        title="Report this listing" aria-label="Report this listing">' +
        icon("flag", 15) +
      '</button>';

    var hasRealPhoto = p.image && (p.image.indexOf("http") === 0 || p.image.indexOf("/") === 0);
    card.innerHTML =
      '<div class="card-img-wrap">' +
        '<img class="card-img"' +
        '     src="' + tileFor(p.category) + '"' +
        (hasRealPhoto ? ' data-photo="' + p.image + '"' : '') +
        '     alt="' + esc(p.title) + '"' +
        '     onerror="this.onerror=null;this.src=NO_IMAGE" />' +
        flag +
      '</div>' +
      tag +
      '<h3 class="card-title">' + esc(p.title) + '</h3>' +
      (p.description ? '<p class="card-desc">' + esc(p.description) + '</p>' : '') +
      ratingRow +
      '<p class="card-price">$' + p.price.toFixed(2) + '</p>' +
      '<div class="qty">' +
        '<button class="qty-btn" id="dec-' + p.id + '"' +
        '        onclick="dec(' + p.id + ')"' +
        '        ' + (q <= 0 ? 'disabled' : '') +
        '        aria-label="decrease">−</button>' +
        '<span class="qty-value' + (q > 0 ? ' active' : '') + '"' +
        '      id="qty-' + p.id + '">' + q + '</span>' +
        '<button class="qty-btn" id="inc-' + p.id + '"' +
        '        onclick="inc(' + p.id + ')"' +
        '        aria-label="increase">+</button>' +
      '</div>';

    gridEl.appendChild(card);
  }

  // now start upgrading the tiles to real photos as they scroll into view
  upgradeCardPhotos();
}


var noResultsEl = null;   // the "nothing found" message, made once on demand

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
  query = (query || "").trim().toLowerCase();
  var shown = 0;

  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var card = document.getElementById("card-" + p.id);
    if (!card) continue;

    var hay = (p.title + " " + (p.description || "") + " " + p.category + " " +
               (CATEGORY_WORDS[p.category] || "") + " " +
               (p.addedByName || "")).toLowerCase();
    var match = query === "" || hay.indexOf(query) !== -1;

    card.style.display = match ? "" : "none";
    if (match) shown++;
  }

  // show a friendly "nothing matched" line when a search comes up empty
  if (!noResultsEl) {
    noResultsEl = document.createElement("p");
    noResultsEl.className = "no-results";
    gridEl.appendChild(noResultsEl);
  }
  if (shown === 0 && query !== "") {
    noResultsEl.textContent = 'No parts match "' + query + '".';
    noResultsEl.style.display = "";
  } else {
    noResultsEl.style.display = "none";
  }
}


// ── cart operations ──

function inc(id) {
  cart[id] = (cart[id] || 0) + 1;
  refreshCard(id);
  recalc();
  queueCartSave();
}

function dec(id) {
  var now = cart[id] || 0;
  if (now <= 0) return;            // can't go negative
  cart[id] = now - 1;
  if (cart[id] === 0) delete cart[id];
  refreshCard(id);
  recalc();
  queueCartSave();
}

function queueCartSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveCart, 400);
}

function saveCart() {
  api("/api/cart", { method: "PUT", body: JSON.stringify(cart) })
    .catch(function (err) {
      console.error("couldn't save the cart:", err);
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
}



function recalc() {
  var totals = computeTotals();

  subEl.textContent   = totals.sub.toFixed(2);
  taxEl.textContent   = totals.tax.toFixed(2);
  totalEl.textContent = totals.total.toFixed(2);

  // the badge on the cart button
  cartBadgeEl.textContent = totals.count;
  cartBadgeEl.hidden = (totals.count === 0);

  // you can only check out with something in the cart
  checkoutEl.disabled    = (totals.count === 0);
  cartSheetGoEl.disabled = (totals.count === 0);

  renderCartSheet(totals);

  // little bounce on the cart button so it feels alive
  cartBtnEl.classList.remove("pop");
  void cartBtnEl.offsetWidth;          
  cartBtnEl.classList.add("pop");
}

function computeTotals() {
  var count = 0, sub = 0;
  for (var i = 0; i < products.length; i++) {
    var q = cart[products[i].id] || 0;
    count += q;
    sub   += products[i].price * q;
  }
  var tax = round(sub * TAX_RATE);
  return { count: count, sub: round(sub), tax: tax, total: round(sub + tax) };
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

// fold the history back up. we do this after a checkout so the list can't
// sit there showing yesterday's bills — next time it's opened it refetches.
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

// tapping an old bill re-opens the exact same paper receipt
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

  // catch a tab close/switch/navigate-away with a cart save still queued
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flushCartSave();
  });
  window.addEventListener("pagehide", flushCartSave);

  // the search box filters the grid on every keystroke
  searchEl.addEventListener("input", function () { filterProducts(searchEl.value); });

  // the two top-right panels
  cartBtnEl.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleSheet(cartSheetEl, cartBtnEl);
  });
  avatarBtnEl.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleSheet(profileSheetEl, avatarBtnEl);
  });

  // clicking inside a panel shouldn't close it
  cartSheetEl.addEventListener("click", function (e) { e.stopPropagation(); });
  profileSheetEl.addEventListener("click", function (e) { e.stopPropagation(); });

  // ...but clicking anywhere else should
  document.addEventListener("click", closeAllSheets);

  // profile panel bits
  billSaveEl.addEventListener("click", saveBillEmail);
  historyToggleEl.addEventListener("click", toggleHistory);

  // checkout — from the bottom bar or from inside the cart panel — opens
  // the shipping/pay modal; payNow() in there does the actual checkout call
  checkoutEl.addEventListener("click", openCheckoutModal);
  cartSheetGoEl.addEventListener("click", openCheckoutModal);

  checkoutPayEl.addEventListener("click", payNow);
  checkoutCloseEl.addEventListener("click", function () { closeModal(checkoutOverlayEl); });
  checkoutOverlayEl.addEventListener("click", function (e) {
    if (e.target === checkoutOverlayEl) closeModal(checkoutOverlayEl);
  });

  // receipt buttons
  receiptCloseEl.addEventListener("click", closeReceipt);
  receiptPrintEl.addEventListener("click", function () { window.print(); });
  receiptEmailEl.addEventListener("click", emailCurrentBill);

  // click the dark backdrop (but not the paper) to close
  overlayEl.addEventListener("click", function (e) {
    if (e.target === overlayEl) closeReceipt();
  });
  // Esc closes the receipt, then the checkout modal, then the panels
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (overlayEl.classList.contains("open")) closeReceipt();
    else if (checkoutOverlayEl.classList.contains("open")) closeModal(checkoutOverlayEl);
    else closeAllSheets();
  });
}

// checkout button (either one) opens the shipping/pay modal instead of
// ringing things up straight away — see payNow() for the actual charge.
function openCheckoutModal() {
  var totals = computeTotals();
  if (totals.count === 0) return;          // nothing to ring up

  checkoutNameEl.value = me ? me.name : "";
  checkoutAddressEl.value = "";
  // card fields never get saved anywhere (not even sent to the server —
  // see payNow()), so there's nothing to prefill; always start blank
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
  clearTimeout(saveTimer);                 // don't let a queued save race us

  // save the cart first, so the server rings up exactly what's on screen.
  // Promise.all with a short delay so "processing" shows for a beat even
  // when the server answers instantly (it's on localhost, after all).
  Promise.all([
    api("/api/cart", { method: "PUT", body: JSON.stringify(cart) })
      .then(function () {
        return api("/api/checkout", {
          method: "POST",
          body: JSON.stringify({ shippingName: name, shippingAddress: address })
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

      // the bill is made and the cart is spent — match that on screen
      cart = {};
      for (var i = 0; i < products.length; i++) refreshCard(products[i].id);
      recalc();

      me.orderCount++;
      paintHistoryCount(me.orderCount);
      collapseHistory();          // so it reloads with the new bill in it

      // swap the form for a "Payment successful" tick for a beat, then
      // move on to the receipt — the dummy card details never get sent
      // to the server or read again; they're forgotten the moment the
      // modal closes.
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

// send whichever bill is currently on screen
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
        receiptEmailEl.disabled = true;             // no need to send it twice
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

// the mail button's normal label (icon + text), reused after every state change
function emailBtnLabel() {
  return icon("mail", 16) + " Email me this bill";
}

function showReceiptMsg(text, isError) {
  receiptMsgEl.textContent = text;
  receiptMsgEl.className = isError ? "receipt-msg error" : "receipt-msg";
  receiptMsgEl.hidden = false;
}

// assemble the actual paper from a saved bill. one row per item, then the
// totals block, then a barcode.
function buildReceiptHTML(order) {
  var when = new Date(order.placedAt);

  var rows = "";
  for (var i = 0; i < order.lines.length; i++) {
    var line = order.lines[i];
    var lineTotal = round(line.price * line.qty);

    // use the product's category tile for the thumbnail (always loads),
    // falling back to a hidden thumb only if we can't work out the category
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

  return '' +
    // ── header ──
    '<div class="r-head">' +
      '<div class="r-bolt"><svg width="26" height="26" viewBox="0 0 24 24"><path fill="#1c1a17" d="M13 2 3 14h7l-1 8 10-12h-7z"/></svg></div>' +
      '<div class="r-store">' + STORE.name + '</div>' +
      '<div class="r-tagline">' + STORE.tagline + '</div>' +
      '<div class="r-meta">' + STORE.address + '</div>' +
      '<div class="r-meta">' + STORE.phone + '</div>' +
    '</div>' +

    '<div class="r-rule"></div>' +

    // ── order + date line ──
    '<div class="r-info">' +
      '<span>ORDER ' + esc(order.id) + '</span>' +
      '<span>' + formatDate(when) + '</span>' +
    '</div>' +
    '<div class="r-info">' +
      '<span>CASHIER: ' + esc(me ? me.name : "SELF") + '</span>' +
      '<span>' + formatTime(when) + '</span>' +
    '</div>' +

    // show the current order status (may be undefined for legacy orders)

    // bills placed before the shipping/pay step shipped won't have this —
    // still shows fine, just skips the line
    (order.shippingName
      ? '<div class="r-ship">SHIP TO: ' + esc(order.shippingName) + ' — ' + esc(order.shippingAddress) + '</div>'
      : '') +

    '<div class="r-rule dashed"></div>' +

    // ── the items ──
    rows +

    '<div class="r-rule dashed"></div>' +

    // ── totals ──
    '<div class="r-tot"><span>SUBTOTAL</span><span>$' + order.subtotal.toFixed(2) + '</span></div>' +
    '<div class="r-tot"><span>TAX (8.25%)</span><span>$' + order.tax.toFixed(2) + '</span></div>' +
    '<div class="r-tot grand"><span>TOTAL</span><span>$' + order.total.toFixed(2) + '</span></div>' +
    '<div class="r-tot small"><span>ITEMS</span><span>' + order.count + '</span></div>' +
    '<div class="r-tot small"><span>PAID $' + (order.amountPaid || order.total).toFixed(2) +
      ' — ' + esc((order.paymentMethod || "Fake Pay").toUpperCase()) + '</span><span>APPROVED</span></div>' +

    '<div class="r-rule dashed"></div>' +

    // ── footer ──
    '<div class="r-foot">' +
      '<div class="r-thanks">*** THANK YOU ***</div>' +
      '<div class="r-meta">You saved 0 electrons today.</div>' +
      '<div class="r-barcode">' + barcode() + '</div>' +
      '<div class="r-meta">' + esc(order.id) + '</div>' +
    '</div>';
}


// ── receipt helpers ──

// a fake barcode, drawn as proper black bars of varying width. purely
// decorative — it doesn't encode anything, it just makes the paper look real.
function barcode() {
  var widths = [2,1,3,1,2,4,1,2,1,3,2,1,4,1,2,1,3,1,2,2,1,3,1,4,1,2,1,2,3,1,2,1,3,2,1,2,4,1,2,1];
  var x = 0, bars = "";
  for (var i = 0; i < widths.length; i++) {
    var w = widths[i] * 3;
    if (i % 2 === 0) {                      // every other stripe is a black bar
      bars += '<rect x="' + x + '" y="0" width="' + w + '" height="44" />';
    }
    x += w;
  }
  return '<svg class="barcode-svg" viewBox="0 0 ' + x + ' 44" width="100%" height="44" ' +
         'preserveAspectRatio="none"><g fill="#1c1a17">' + bars + '</g></svg>';
}

// 16 Jul 2026
function formatDate(d) {
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
}

// 09:41 PM
function formatTime(d) {
  var h = d.getHours(), m = d.getMinutes();
  var ampm = h >= 12 ? "PM" : "AM";
  h = h % 12; if (h === 0) h = 12;
  if (m < 10) m = "0" + m;
  return (h < 10 ? "0" + h : h) + ":" + m + " " + ampm;
}


// ── general helpers ──

// keep numbers to two decimal places so they don't drift
function round(n) {
  return Math.round(n * 100) / 100;
}

// basic XSS protection for product titles
function esc(str) {
  var d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// the star rating, drawn as real star icons instead of ★ glyphs.
//
// it's two rows of five stars stacked on top of each other: a muted outline
// row underneath, and a filled yellow row on top clipped to the exact rating
// width. that gives precise part-stars (4.6 → 4.6 stars) with no half-glyph.
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

// show a subtle border on the topbar once you scroll down a bit
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
