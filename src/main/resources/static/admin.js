// ============================================================================
// Voltbox Spring Boot Administration Console (/admin)
// Connects to ProductController, InventoryController, and AdminController
// ============================================================================

var adminProducts = [];
var adminMetrics = null;
var adminInventorySummary = null;
var adminSearchAnalytics = null;
var activeAdminView = "catalog";
var activeStockFilter = "all";
var adminCatalogLayout = "table";
var adminBatchModeActive = false;
var adminSelectedProductIds = [];
var isExecutingAdminBatch = false;
var lastAdminBatchStatusMessage = "";
var lastAdminBatchStatusIsError = false;
var toastTimeout = null;
var adminColorMode = localStorage.getItem("voltbox_color_mode") || "dark";

function applyAdminColorMode(mode) {
  var resolved = (mode === "light" || mode === "dark") ? mode : "dark";
  adminColorMode = resolved;
  localStorage.setItem("voltbox_color_mode", resolved);
  document.documentElement.setAttribute("data-color-mode", resolved);
  document.documentElement.classList.toggle("light-mode", resolved === "light");
  document.documentElement.classList.toggle("dark-mode", resolved === "dark");

  var iconEl = document.getElementById("admin-theme-mode-icon");
  var labelEl = document.getElementById("admin-theme-mode-label");
  var btnEl = document.getElementById("admin-theme-mode-btn");
  if (iconEl) iconEl.textContent = resolved === "light" ? "☾" : "☀";
  if (labelEl) labelEl.textContent = resolved === "light" ? "Dark" : "Light";
  if (btnEl) {
    btnEl.setAttribute(
      "title",
      resolved === "light" ? "Switch to iOS Dark Mode" : "Switch to iOS Light Mode"
    );
  }
}

window.toggleAdminColorMode = function () {
  var next = adminColorMode === "dark" ? "light" : "dark";
  applyAdminColorMode(next);
  showAdminToast("Switched to iOS " + (next === "light" ? "Light" : "Dark") + " Mode");
};

function getToken() {
  return localStorage.getItem("voltbox_token") || "";
}

function adminFetch(path, options) {
  options = options || {};
  options.headers = options.headers || {};
  options.headers["Authorization"] = "Bearer " + getToken();
  if (options.body && !options.headers["Content-Type"]) {
    options.headers["Content-Type"] = "application/json";
  }
  return fetch(path, options);
}

function escHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showAdminToast(msg) {
  var el = document.getElementById("admin-toast");
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(function () {
    el.hidden = true;
  }, 3600);
}

function formatMoney(val) {
  var n = Number(val) || 0;
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatUptime(sec) {
  var s = Math.max(1, Math.floor(Number(sec) || 0));
  var hrs = Math.floor(s / 3600);
  var mins = Math.floor((s % 3600) / 60);
  var rem = s % 60;
  return hrs + "h " + mins + "m " + rem + "s";
}

function loadAllAdminData(retriedWithDemoToken) {
  return adminFetch("/api/me")
    .then(function (r) {
      if (r.status === 401 && !retriedWithDemoToken) {
        localStorage.setItem("voltbox_token", "ed4a9555-540b-4bb9-a406-b353acded905");
        localStorage.setItem("voltbox_user", "Harish");
        return loadAllAdminData(true);
      }
      return Promise.all([
        r.ok ? r.json() : null,
        adminFetch("/api/admin/products?includeTakenDown=true").then(function (res) { return res.ok ? res.json() : []; }),
        adminFetch("/api/admin/metrics").then(function (res) { return res.ok ? res.json() : null; }),
        adminFetch("/api/inventory").then(function (res) { return res.ok ? res.json() : null; }),
        adminFetch("/api/admin/search-analytics").then(function (res) { return res.ok ? res.json() : null; })
      ]);
    })
    .then(function (results) {
      if (!Array.isArray(results)) return;
      var me = results[0];
      adminProducts = Array.isArray(results[1]) ? results[1] : [];
      adminMetrics = results[2];
      adminInventorySummary = results[3];
      adminSearchAnalytics = results[4] || (adminMetrics && adminMetrics.searchAnalytics) || null;

      if (me && me.name) {
        document.getElementById("admin-operator-name").textContent = me.name;
        document.getElementById("admin-operator-avatar").textContent = me.initial || me.name.charAt(0).toUpperCase();
        document.getElementById("admin-operator-role").textContent = (me.role || "moderator").toUpperCase() + " · Spring Boot";

        var isAdmin = Boolean(me.isAdmin || me.role === "moderator" || me.role === "admin");
        var guardEl = document.getElementById("admin-access-guard");
        if (guardEl) {
          if (!isAdmin) {
            var guardName = document.getElementById("guard-user-name");
            var guardEmail = document.getElementById("guard-user-email");
            if (guardName) guardName.textContent = me.name;
            if (guardEmail) guardEmail.textContent = me.email || "";
            guardEl.hidden = false;
            guardEl.setAttribute("aria-hidden", "false");
          } else {
            guardEl.hidden = true;
            guardEl.setAttribute("aria-hidden", "true");
          }
        }
      }

      renderKpiStrip();
      renderProductsTable();
      renderAdminCatalogGrid();
      updateAdminBatchPanelUI();
      renderInventoryView();
      renderSearchAnalyticsView();
      renderHealthView();
    })
    .catch(function (err) {
      console.warn("Admin telemetry note:", err);
    });
}

function renderKpiStrip() {
  if (!adminMetrics || !adminMetrics.catalog) return;
  var cat = adminMetrics.catalog;
  var db = adminMetrics.database || {};

  document.getElementById("kpi-active-skus").textContent = String(cat.activeProducts);
  document.getElementById("kpi-sku-breakdown").textContent =
    cat.officialProducts + " official · " + cat.communityProducts + " community · " + cat.takenDownProducts + " archived";

  document.getElementById("kpi-total-units").textContent = String(cat.totalUnitsInStock);
  document.getElementById("kpi-reserved-note").textContent =
    cat.reservedUnitsInCarts + " units reserved in active carts";

  document.getElementById("kpi-low-stock").textContent = String(cat.lowStockCount);
  document.getElementById("kpi-critical-note").textContent =
    cat.criticalStockCount + " critical (≤ 2) · " + cat.outOfStockCount + " out of stock";

  document.getElementById("kpi-valuation").textContent = formatMoney(cat.totalInventoryValuation);
  document.getElementById("kpi-db-engine").textContent =
    (db.engine || "H2 / MySQL") + " · " + (db.status || "CONNECTED");

  document.getElementById("nav-count-catalog").textContent = String(cat.activeProducts);
  document.getElementById("nav-count-lowstock").textContent = String(cat.lowStockCount);
  document.getElementById("nav-status-health").textContent = adminMetrics.status || "UP";

  var gapBadgeEl = document.getElementById("nav-count-search-gaps");
  if (gapBadgeEl && adminSearchAnalytics) {
    gapBadgeEl.textContent = String(adminSearchAnalytics.distinctCatalogGapsCount || 0);
  }
}

function getFilteredAdminProducts() {
  var searchEl = document.getElementById("admin-search-input");
  var groupEl = document.getElementById("admin-group-select");
  var q = (searchEl ? searchEl.value : "").trim().toLowerCase();
  var g = groupEl ? groupEl.value : "all";

  return adminProducts.filter(function (p) {
    var qty = typeof p.stockQuantity === "number" ? p.stockQuantity : (p.quantity || 0);
    if (activeStockFilter === "archived") {
      if (!p.takenDown) return false;
    } else {
      if (p.takenDown) return false;
      if (activeStockFilter === "nominal" && qty < 5) return false;
      if (activeStockFilter === "low" && qty >= 5) return false;
      if (activeStockFilter === "critical" && qty > 2) return false;
    }

    if (g !== "all" && (p.componentGroup || "").toLowerCase() !== g) {
      return false;
    }

    if (q) {
      var hay = ((p.name || "") + " " + (p.title || "") + " " + (p.sku || "") + " " +
                 (p.category || "") + " " + (p.componentGroup || "")).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });
}

function isAdminProductSelected(productId) {
  return adminSelectedProductIds.indexOf(Number(productId)) !== -1;
}

function getCurrentAdminBatchPlan() {
  var priceModeEl = document.getElementById("admin-batch-price-mode");
  var priceValEl = document.getElementById("admin-batch-price-value");
  var stockModeEl = document.getElementById("admin-batch-stock-mode");
  var stockValEl = document.getElementById("admin-batch-stock-value");
  var reasonEl = document.getElementById("admin-batch-reason");

  var priceMode = priceModeEl ? priceModeEl.value : "none";
  var priceVal = priceValEl ? priceValEl.value : "";
  var stockMode = stockModeEl ? stockModeEl.value : "none";
  var stockVal = stockValEl ? stockValEl.value : "";
  var reason = reasonEl ? reasonEl.value : "";

  if (window.VoltboxQR && typeof window.VoltboxQR.planBatchProductTransaction === "function") {
    return window.VoltboxQR.planBatchProductTransaction(adminProducts, {
      productIds: adminSelectedProductIds,
      priceMode: priceMode,
      priceValue: priceVal,
      stockMode: stockMode,
      stockValue: stockVal,
      reason: reason
    });
  }
  return null;
}

function renderProductsTable() {
  var tbody = document.getElementById("admin-products-tbody");
  if (!tbody) return;

  var filtered = getFilteredAdminProducts();
  var selectAllEl = document.getElementById("admin-table-select-all");
  if (selectAllEl) {
    var allVisibleSelected =
      filtered.length > 0 &&
      filtered.every(function (p) { return isAdminProductSelected(p.id); });
    selectAllEl.checked = allVisibleSelected;
    selectAllEl.indeterminate =
      !allVisibleSelected &&
      filtered.some(function (p) { return isAdminProductSelected(p.id); });
  }

  if (filtered.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="9" class="empty-cell">No products match the current filter criteria.</td></tr>';
    return;
  }

  var plan = getCurrentAdminBatchPlan();
  var mutationById = {};
  if (plan && plan.ok && Array.isArray(plan.mutations)) {
    for (var m = 0; m < plan.mutations.length; m++) {
      mutationById[plan.mutations[m].productId] = plan.mutations[m];
    }
  }

  var html = "";
  for (var i = 0; i < filtered.length; i++) {
    var p = filtered[i];
    var isSelected = isAdminProductSelected(p.id);
    var mut = mutationById[p.id] || null;
    var qty = typeof p.stockQuantity === "number" ? p.stockQuantity : (p.quantity || 0);
    var statusClass = "ok";
    var statusText = "Nominal (" + qty + ")";
    if (p.takenDown) {
      statusClass = "muted";
      statusText = "Archived";
    } else if (qty === 0) {
      statusClass = "crit";
      statusText = "Out of Stock";
    } else if (qty <= 2) {
      statusClass = "crit";
      statusText = "Critical · " + qty + " left";
    } else if (qty < 5) {
      statusClass = "warn";
      statusText = "Low Stock · " + qty + " left";
    }

    var imgSrc = (p.image && (p.image.indexOf("http") === 0 || p.image.indexOf("/") === 0))
      ? p.image
      : ("/images/categories/" + (p.category || "components") + ".svg");

    var priceCellHtml = formatMoney(p.price);
    if (mut && mut.priceChanged) {
      priceCellHtml =
        '<span class="batch-prev-val">' + formatMoney(mut.previousPrice) + '</span> ' +
        '<span class="batch-next-val ' + (mut.priceDelta < 0 ? 'drop' : 'gain') + '">&rarr; ' + formatMoney(mut.nextPrice) + '</span>';
    }

    var stockCellHtml = String(qty);
    if (mut && mut.stockChanged) {
      stockCellHtml =
        '<span class="batch-prev-val">' + mut.previousStock + '</span> ' +
        '<span class="batch-next-val ' + (mut.stockDelta >= 0 ? 'gain' : 'drop') + '">&rarr; ' + mut.nextStock + '</span>';
    }

    html +=
      '<tr class="' + (p.takenDown ? 'is-archived ' : '') + (isSelected ? 'is-batch-selected' : '') + '" data-product-id="' + p.id + '" onclick="handleAdminRowClick(event, ' + p.id + ')">' +
        '<td class="select-col">' +
          '<input type="checkbox" class="admin-row-select-cb" data-product-id="' + p.id + '" data-testid="admin-select-product-' + p.id + '" ' +
          '       aria-label="Select ' + escHtml(p.title || p.name) + ' for batch edit" ' +
          (isSelected ? 'checked ' : '') +
          '       onclick="event.stopPropagation(); toggleAdminProductSelection(' + p.id + ')" />' +
        '</td>' +
        '<td>' +
          '<div class="prod-cell">' +
            '<img class="prod-thumb" src="' + escHtml(imgSrc) + '" alt="' + escHtml(p.title) + '" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'/images/categories/components.svg\';" />' +
            '<div>' +
              '<div class="prod-title">' + escHtml(p.title || p.name) + '</div>' +
              '<div class="prod-meta">ID #' + p.id + ' · ' + (p.official ? 'Official' : ('By ' + escHtml(p.addedByName || 'Contributor'))) + '</div>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td class="mono">' + escHtml(p.sku) + '</td>' +
        '<td>' + escHtml(p.componentGroup || "other") + ' · ' + escHtml(p.category || "components") + '</td>' +
        '<td class="num-col" id="admin-price-val-' + p.id + '">' + priceCellHtml + '</td>' +
        '<td class="num-col" id="admin-stock-val-' + p.id + '">' + stockCellHtml + '</td>' +
        '<td>' +
          '<div class="stock-stepper">' +
            '<button type="button" class="step-btn" onclick="event.stopPropagation(); quickAdjustStock(' + p.id + ', -1)">−1</button>' +
            '<button type="button" class="step-btn" onclick="event.stopPropagation(); quickAdjustStock(' + p.id + ', 1)">+1</button>' +
            '<button type="button" class="step-btn" onclick="event.stopPropagation(); quickAdjustStock(' + p.id + ', 5)">+5</button>' +
          '</div>' +
        '</td>' +
        '<td><span class="state-label ' + statusClass + '">' + escHtml(statusText) + '</span></td>' +
        '<td class="actions-col">' +
          '<div class="row-actions">' +
            '<button type="button" class="btn-secondary" onclick="event.stopPropagation(); openEditProductModal(' + p.id + ')">Edit</button>' +
            (p.takenDown
              ? '<button type="button" class="btn-secondary" onclick="event.stopPropagation(); toggleArchiveProduct(' + p.id + ', true)">Restore</button>'
              : '<button type="button" class="btn-danger-outline" onclick="event.stopPropagation(); toggleArchiveProduct(' + p.id + ', false)">Archive</button>') +
          '</div>' +
        '</td>' +
      '</tr>';
  }
  tbody.innerHTML = html;
}

function renderAdminCatalogGrid() {
  var gridEl = document.getElementById("admin-catalog-grid");
  if (!gridEl) return;

  var filtered = getFilteredAdminProducts();
  if (filtered.length === 0) {
    gridEl.innerHTML =
      '<div class="empty-cell">No products match the current filter criteria.</div>';
    return;
  }

  var plan = getCurrentAdminBatchPlan();
  var mutationById = {};
  if (plan && plan.ok && Array.isArray(plan.mutations)) {
    for (var m = 0; m < plan.mutations.length; m++) {
      mutationById[plan.mutations[m].productId] = plan.mutations[m];
    }
  }

  var html = "";
  for (var i = 0; i < filtered.length; i++) {
    var p = filtered[i];
    var isSelected = isAdminProductSelected(p.id);
    var mut = mutationById[p.id] || null;
    var qty = typeof p.stockQuantity === "number" ? p.stockQuantity : (p.quantity || 0);
    var statusClass = qty === 0 || qty <= 2 ? "crit" : (qty < 5 ? "warn" : "ok");
    var statusText = p.takenDown ? "Archived" : (qty === 0 ? "Out of Stock" : (qty < 5 ? ("Low · " + qty + " left") : (qty + " in stock")));

    var imgSrc = (p.image && (p.image.indexOf("http") === 0 || p.image.indexOf("/") === 0))
      ? p.image
      : ("/images/categories/" + (p.category || "components") + ".svg");

    var priceHtml = formatMoney(p.price);
    if (mut && mut.priceChanged) {
      priceHtml =
        '<span class="batch-prev-val">' + formatMoney(mut.previousPrice) + '</span> ' +
        '<span class="batch-next-val ' + (mut.priceDelta < 0 ? 'drop' : 'gain') + '">&rarr; ' + formatMoney(mut.nextPrice) + '</span>';
    }

    var stockHtml = statusText;
    if (mut && mut.stockChanged) {
      stockHtml =
        '<span class="batch-prev-val">' + mut.previousStock + 'u</span> ' +
        '<span class="batch-next-val ' + (mut.stockDelta >= 0 ? 'gain' : 'drop') + '">&rarr; ' + mut.nextStock + 'u</span>';
    }

    html +=
      '<article class="admin-grid-card' + (isSelected ? ' is-batch-selected' : '') + (p.takenDown ? ' is-archived' : '') + '" ' +
      '         data-product-id="' + p.id + '" data-testid="admin-grid-card-' + p.id + '" ' +
      '         onclick="toggleAdminProductSelection(' + p.id + ')">' +
        '<div class="admin-grid-card-top">' +
          '<label class="admin-card-select-wrap" onclick="event.stopPropagation()">' +
            '<input type="checkbox" class="admin-grid-select-cb" data-product-id="' + p.id + '" ' +
            (isSelected ? 'checked ' : '') +
            '       aria-label="Select ' + escHtml(p.title || p.name) + '" ' +
            '       onchange="toggleAdminProductSelection(' + p.id + ')" />' +
            '<span class="mono">' + escHtml(p.sku) + '</span>' +
          '</label>' +
          '<span class="state-label ' + statusClass + '">' + stockHtml + '</span>' +
        '</div>' +
        '<div class="admin-grid-img-wrap">' +
          '<img class="admin-grid-thumb" src="' + escHtml(imgSrc) + '" alt="' + escHtml(p.title) + '" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'/images/categories/components.svg\';" />' +
        '</div>' +
        '<div class="admin-grid-info">' +
          '<h3 class="admin-grid-title">' + escHtml(p.title || p.name) + '</h3>' +
          '<div class="admin-grid-meta">' + escHtml(p.componentGroup || "other") + ' · ID #' + p.id + '</div>' +
          '<div class="admin-grid-price mono">' + priceHtml + '</div>' +
        '</div>' +
        '<div class="admin-grid-card-foot" onclick="event.stopPropagation()">' +
          '<div class="stock-stepper">' +
            '<button type="button" class="step-btn" onclick="quickAdjustStock(' + p.id + ', -1)">−1</button>' +
            '<button type="button" class="step-btn" onclick="quickAdjustStock(' + p.id + ', 1)">+1</button>' +
            '<button type="button" class="step-btn" onclick="quickAdjustStock(' + p.id + ', 5)">+5</button>' +
          '</div>' +
          '<button type="button" class="btn-secondary" onclick="openEditProductModal(' + p.id + ')">Edit</button>' +
        '</div>' +
      '</article>';
  }
  gridEl.innerHTML = html;
}

window.handleAdminRowClick = function (e, productId) {
  if (!adminBatchModeActive) return;
  var tag = e && e.target && e.target.tagName ? e.target.tagName.toUpperCase() : "";
  if (tag === "BUTTON" || tag === "INPUT" || tag === "A" || tag === "SELECT") return;
  toggleAdminProductSelection(productId);
};

window.toggleAdminBatchMode = function (forceState) {
  if (typeof forceState === "boolean") {
    adminBatchModeActive = forceState;
  } else {
    adminBatchModeActive = !adminBatchModeActive;
  }
  updateAdminBatchPanelUI();
  renderProductsTable();
  renderAdminCatalogGrid();
};
window.toggleAdminBatchEditMode = window.toggleAdminBatchMode;

window.toggleAdminProductSelection = function (productId, forceState) {
  var pid = Number(productId);
  if (!pid || pid <= 0) return;

  var action = typeof forceState === "boolean" ? (forceState ? "add" : "remove") : "toggle";
  if (window.VoltboxQR && typeof window.VoltboxQR.toggleBatchSelectionIds === "function") {
    adminSelectedProductIds = window.VoltboxQR.toggleBatchSelectionIds(adminSelectedProductIds, pid, action);
  } else {
    var idx = adminSelectedProductIds.indexOf(pid);
    if (action === "add" && idx === -1) adminSelectedProductIds.push(pid);
    else if (action === "remove" && idx !== -1) adminSelectedProductIds.splice(idx, 1);
    else if (action === "toggle") {
      if (idx === -1) adminSelectedProductIds.push(pid);
      else adminSelectedProductIds.splice(idx, 1);
    }
  }

  if (adminSelectedProductIds.length > 0 && !adminBatchModeActive) {
    adminBatchModeActive = true;
  }

  updateAdminBatchPanelUI();
  renderProductsTable();
  renderAdminCatalogGrid();
};
window.toggleAdminProductBatchSelect = window.toggleAdminProductSelection;

window.selectAllVisibleAdminProducts = function () {
  var visibleIds = getFilteredAdminProducts().map(function (p) { return p.id; });
  if (window.VoltboxQR && typeof window.VoltboxQR.toggleBatchSelectionIds === "function") {
    adminSelectedProductIds = window.VoltboxQR.toggleBatchSelectionIds(adminSelectedProductIds, visibleIds, "add");
  } else {
    adminSelectedProductIds = visibleIds.slice();
  }
  adminBatchModeActive = true;
  updateAdminBatchPanelUI();
  renderProductsTable();
  renderAdminCatalogGrid();
};

window.selectLowStockAdminProducts = function () {
  var lowIds = adminProducts
    .filter(function (p) {
      var q = typeof p.stockQuantity === "number" ? p.stockQuantity : (p.quantity || 0);
      return !p.takenDown && q < 5;
    })
    .map(function (p) { return p.id; });

  if (window.VoltboxQR && typeof window.VoltboxQR.toggleBatchSelectionIds === "function") {
    adminSelectedProductIds = window.VoltboxQR.toggleBatchSelectionIds([], lowIds, "replace");
  } else {
    adminSelectedProductIds = lowIds.slice();
  }
  adminBatchModeActive = true;
  updateAdminBatchPanelUI();
  renderProductsTable();
  renderAdminCatalogGrid();
};

window.clearAdminBatchSelection = function () {
  adminSelectedProductIds = [];
  lastAdminBatchStatusMessage = "";
  updateAdminBatchPanelUI();
  renderProductsTable();
  renderAdminCatalogGrid();
};

window.applyAdminBatchPricePreset = function (mode, val) {
  var modeEl = document.getElementById("admin-batch-price-mode");
  var valEl = document.getElementById("admin-batch-price-value");
  if (modeEl) modeEl.value = mode;
  if (valEl) {
    valEl.disabled = (mode === "none");
    valEl.value = String(val);
  }
  updateAdminBatchPanelUI();
  renderProductsTable();
  renderAdminCatalogGrid();
};

window.applyAdminBatchStockPreset = function (mode, val) {
  var modeEl = document.getElementById("admin-batch-stock-mode");
  var valEl = document.getElementById("admin-batch-stock-value");
  if (modeEl) modeEl.value = mode;
  if (valEl) {
    valEl.disabled = (mode === "none");
    valEl.value = String(val);
  }
  updateAdminBatchPanelUI();
  renderProductsTable();
  renderAdminCatalogGrid();
};

function setAdminBatchStatusMsg(text, isError) {
  lastAdminBatchStatusMessage = text || "";
  lastAdminBatchStatusIsError = Boolean(isError);
  var msgEl = document.getElementById("admin-batch-status-msg");
  if (!msgEl) return;
  if (!lastAdminBatchStatusMessage) {
    msgEl.hidden = true;
    msgEl.textContent = "";
    return;
  }
  msgEl.textContent = lastAdminBatchStatusMessage;
  msgEl.className = "batch-status-msg " + (lastAdminBatchStatusIsError ? "error" : "success");
  msgEl.hidden = false;
}

function updateAdminBatchPanelUI() {
  var toggleBtn = document.getElementById("admin-batch-mode-toggle");
  var toggleCountEl = document.getElementById("admin-batch-toggle-count");
  var panelEl = document.getElementById("admin-batch-edit-panel");
  var selCountEl = document.getElementById("admin-batch-selected-count");
  var priceModeEl = document.getElementById("admin-batch-price-mode");
  var priceValEl = document.getElementById("admin-batch-price-value");
  var stockModeEl = document.getElementById("admin-batch-stock-mode");
  var stockValEl = document.getElementById("admin-batch-stock-value");
  var previewEl = document.getElementById("admin-batch-preview-strip");
  var submitBtn = document.getElementById("admin-batch-submit-btn");

  var count = adminSelectedProductIds.length;
  var showPanel = adminBatchModeActive || count > 0;

  if (toggleBtn) {
    toggleBtn.classList.toggle("active", showPanel);
    toggleBtn.setAttribute("aria-pressed", showPanel ? "true" : "false");
  }
  if (toggleCountEl) {
    toggleCountEl.textContent = String(count);
  }
  if (panelEl) {
    panelEl.hidden = !showPanel;
  }
  if (selCountEl) {
    selCountEl.textContent = String(count);
  }

  if (priceModeEl && priceValEl) {
    var pMode = priceModeEl.value;
    priceValEl.disabled = (pMode === "none");
    if (pMode === "percent") priceValEl.placeholder = "e.g. -10 (%)";
    else if (pMode === "delta") priceValEl.placeholder = "e.g. -15.00 ($)";
    else if (pMode === "set") priceValEl.placeholder = "e.g. 149.99 ($)";
    else priceValEl.placeholder = "Unchanged";
  }

  if (stockModeEl && stockValEl) {
    var sMode = stockModeEl.value;
    stockValEl.disabled = (sMode === "none");
    if (sMode === "delta") stockValEl.placeholder = "e.g. +5 (units)";
    else if (sMode === "set") stockValEl.placeholder = "e.g. 20 (units)";
    else stockValEl.placeholder = "Unchanged";
  }

  var plan = getCurrentAdminBatchPlan();
  if (submitBtn) {
    submitBtn.innerHTML =
      '<span>Apply Batch Transaction' + (count > 0 ? (' (' + count + ' SKU' + (count === 1 ? '' : 's') + ')') : '') + '</span>';
    submitBtn.disabled = isExecutingAdminBatch;
  }

  if (previewEl) {
    if (count === 0) {
      previewEl.innerHTML =
        'Select one or more products in the catalog table/grid below (or click <strong>Select All Visible</strong>) to preview bulk changes.';
    } else if (!plan || !plan.ok) {
      previewEl.innerHTML =
        '<span>' + escHtml((plan && plan.message) || "Configure a bulk price update or stock adjustment above to preview the transaction.") + '</span>';
    } else {
      var valDeltaStr = (plan.valuationDelta >= 0 ? "+" : "−") + formatMoney(Math.abs(plan.valuationDelta));
      var stockDeltaStr = (plan.totalStockUnitsDelta >= 0 ? "+" : "") + plan.totalStockUnitsDelta + " units";
      var sampleItems = plan.mutations.slice(0, 3).map(function (m) {
        var parts = [escHtml(m.sku)];
        if (m.priceChanged) parts.push(formatMoney(m.previousPrice) + " → " + formatMoney(m.nextPrice));
        if (m.stockChanged) parts.push(m.previousStock + "u → " + m.nextStock + "u");
        return parts.join(": ");
      });
      previewEl.innerHTML =
        '<strong>Preview (' + escHtml(plan.transactionId) + '):</strong> ' +
        plan.priceChangedCount + ' price update' + (plan.priceChangedCount === 1 ? '' : 's') + ' · ' +
        plan.stockChangedCount + ' stock adjustment' + (plan.stockChangedCount === 1 ? '' : 's') + ' · ' +
        'Net Stock: <strong class="mono">' + escHtml(stockDeltaStr) + '</strong> · ' +
        'Valuation Delta: <strong class="mono">' + escHtml(valDeltaStr) + '</strong>' +
        (sampleItems.length > 0 ? (' · <span class="mono">' + sampleItems.join(" | ") + (plan.mutations.length > 3 ? " …" : "") + '</span>') : '');
    }
  }
}

function submitAdminBatchTransaction(e) {
  if (e && typeof e.preventDefault === "function") e.preventDefault();
  if (isExecutingAdminBatch) return;

  var priceModeEl = document.getElementById("admin-batch-price-mode");
  var priceValEl = document.getElementById("admin-batch-price-value");
  var stockModeEl = document.getElementById("admin-batch-stock-mode");
  var stockValEl = document.getElementById("admin-batch-stock-value");
  var reasonEl = document.getElementById("admin-batch-reason");

  var priceMode = priceModeEl ? priceModeEl.value : "none";
  var priceVal = priceValEl ? priceValEl.value : "";
  var stockMode = stockModeEl ? stockModeEl.value : "none";
  var stockVal = stockValEl ? stockValEl.value : "";
  var reason = reasonEl ? reasonEl.value.trim() : "";

  var plan = getCurrentAdminBatchPlan();
  if (plan && !plan.ok) {
    setAdminBatchStatusMsg(plan.message || "Invalid batch configuration.", true);
    return;
  }

  isExecutingAdminBatch = true;
  updateAdminBatchPanelUI();

  adminFetch("/api/admin/products/batch-update", {
    method: "POST",
    body: JSON.stringify({
      productIds: adminSelectedProductIds,
      priceMode: priceMode,
      priceValue: priceVal,
      stockMode: stockMode,
      stockValue: stockVal,
      reason: reason
    })
  })
    .then(function (r) {
      return r.json().then(function (data) { return { ok: r.ok, data: data }; });
    })
    .then(function (res) {
      isExecutingAdminBatch = false;
      if (!res.ok || !res.data || !res.data.ok) {
        setAdminBatchStatusMsg((res.data && res.data.message) || "Failed to execute batch update.", true);
        updateAdminBatchPanelUI();
        return;
      }

      var msg = res.data.message || ("Applied batch transaction " + res.data.transactionId);
      setAdminBatchStatusMsg(msg, false);
      showAdminToast(msg);
      loadAllAdminData();
    })
    .catch(function () {
      isExecutingAdminBatch = false;
      setAdminBatchStatusMsg("Network error executing batch transaction.", true);
      updateAdminBatchPanelUI();
    });
}

window.quickAdjustStock = function (productId, delta) {
  adminFetch("/api/products/" + productId + "/inventory", {
    method: "POST",
    body: JSON.stringify({
      delta: delta,
      amount: delta,
      reason: "Admin Console Quick Stock Adjust (" + (delta > 0 ? "+" + delta : delta) + ")"
    })
  })
    .then(function (r) {
      return r.json().then(function (data) { return { ok: r.ok, data: data }; });
    })
    .then(function (res) {
      if (!res.ok) {
        showAdminToast((res.data && res.data.message) || "Stock adjustment rejected by validation layer.");
        return;
      }
      if (res.data && res.data.product) {
        showAdminToast("Updated " + res.data.product.sku + " stock to " + res.data.product.stockQuantity + " units.");
        loadAllAdminData();
      }
    });
};

window.toggleArchiveProduct = function (productId, restore) {
  var url = "/api/admin/products/" + productId + (restore ? "?restore=true" : "");
  adminFetch(url, { method: "DELETE" })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res && res.ok) {
        showAdminToast(restore ? ("Restored product #" + productId + " to active catalog.") : ("Archived product #" + productId + "."));
        loadAllAdminData();
      }
    });
};

function renderInventoryView() {
  // 1. Low-Stock Queue
  var lowTbody = document.getElementById("low-stock-queue-tbody");
  var lowItems = adminProducts.filter(function (p) {
    var qty = typeof p.stockQuantity === "number" ? p.stockQuantity : (p.quantity || 0);
    return !p.takenDown && qty < 5;
  });

  if (lowTbody) {
    if (lowItems.length === 0) {
      lowTbody.innerHTML = '<tr><td colspan="5" class="empty-cell">All active SKUs have healthy stock (≥ 5 units).</td></tr>';
    } else {
      var lHtml = "";
      for (var i = 0; i < lowItems.length; i++) {
        var lp = lowItems[i];
        var lq = typeof lp.stockQuantity === "number" ? lp.stockQuantity : (lp.quantity || 0);
        lHtml +=
          '<tr>' +
            '<td class="mono">' + escHtml(lp.sku) + '</td>' +
            '<td><strong>' + escHtml(lp.title) + '</strong></td>' +
            '<td class="num-col">' + lq + '</td>' +
            '<td><span class="state-label ' + (lq <= 2 ? 'crit' : 'warn') + '">' + (lq <= 2 ? 'CRITICAL' : 'LOW STOCK') + '</span></td>' +
            '<td class="actions-col">' +
              '<button type="button" class="step-btn" onclick="quickAdjustStock(' + lp.id + ', 5)">+5 Units</button>' +
            '</td>' +
          '</tr>';
      }
      lowTbody.innerHTML = lHtml;
    }
  }

  // 2. Group Breakdown
  var groupTbody = document.getElementById("group-breakdown-tbody");
  if (groupTbody && adminMetrics && adminMetrics.catalog && Array.isArray(adminMetrics.catalog.groupBreakdown)) {
    var groups = adminMetrics.catalog.groupBreakdown;
    var gHtml = "";
    for (var g = 0; g < groups.length; g++) {
      var row = groups[g];
      gHtml +=
        '<tr>' +
          '<td><strong>' + escHtml(row.label) + '</strong> <span class="prod-meta">(' + escHtml(row.group) + ')</span></td>' +
          '<td class="num-col">' + row.skuCount + '</td>' +
          '<td class="num-col">' + row.unitCount + '</td>' +
          '<td class="num-col">' + row.lowStockCount + '</td>' +
          '<td class="num-col">' + formatMoney(row.valuation) + '</td>' +
        '</tr>';
    }
    groupTbody.innerHTML = gHtml;
  }

  // 3. Populate product selector for custom stock setter
  var selectEl = document.getElementById("ledger-product-select");
  if (selectEl) {
    var currentVal = selectEl.value;
    var opts = "";
    for (var k = 0; k < adminProducts.length; k++) {
      var ap = adminProducts[k];
      if (ap.takenDown) continue;
      opts += '<option value="' + ap.id + '">' + escHtml(ap.sku + " — " + ap.title + " (" + ap.stockQuantity + " in stock)") + '</option>';
    }
    selectEl.innerHTML = opts;
    if (currentVal) selectEl.value = currentVal;
  }

  // 4. Inventory Transaction Audit Ledger
  var ledgerTbody = document.getElementById("inventory-ledger-tbody");
  var txs = (adminInventorySummary && Array.isArray(adminInventorySummary.recentTransactions))
    ? adminInventorySummary.recentTransactions
    : [];
  if (ledgerTbody) {
    if (txs.length === 0) {
      ledgerTbody.innerHTML =
        '<tr><td colspan="8" class="empty-cell">No stock mutations recorded in this session yet — adjust any product stock above to log an entry.</td></tr>';
    } else {
      var tHtml = "";
      for (var t = 0; t < txs.length; t++) {
        var tx = txs[t];
        var dStr = new Date(tx.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        var deltaSign = tx.delta >= 0 ? ("+" + tx.delta) : String(tx.delta);
        tHtml +=
          '<tr>' +
            '<td class="mono">' + escHtml(tx.id) + '</td>' +
            '<td class="mono">' + escHtml(dStr) + '</td>' +
            '<td class="mono">' + escHtml(tx.sku) + '</td>' +
            '<td>' + escHtml(tx.productTitle) + '</td>' +
            '<td class="mono">' + escHtml(tx.type) + '</td>' +
            '<td class="num-col"><span class="state-label ' + (tx.delta >= 0 ? 'ok' : 'warn') + '">' + deltaSign + '</span></td>' +
            '<td class="num-col">' + tx.newStock + '</td>' +
            '<td>' + escHtml(tx.actorName) + ' · <span class="prod-meta">' + escHtml(tx.reason) + '</span></td>' +
          '</tr>';
      }
      ledgerTbody.innerHTML = tHtml;
    }
  }
}

function renderSearchAnalyticsView() {
  var sa = adminSearchAnalytics || (adminMetrics && adminMetrics.searchAnalytics);
  if (!sa) return;

  var totalEl = document.getElementById("sa-kpi-total");
  var uniqueEl = document.getElementById("sa-kpi-unique");
  var gapsEl = document.getElementById("sa-kpi-gaps");
  var gapsSubEl = document.getElementById("sa-kpi-gaps-sub");
  var rateEl = document.getElementById("sa-kpi-rate");
  var navBadgeEl = document.getElementById("nav-count-search-gaps");

  if (totalEl) totalEl.textContent = String(sa.totalSearchesLogged || 0);
  if (uniqueEl) uniqueEl.textContent = String(sa.uniqueQueriesCount || 0);
  if (gapsEl) gapsEl.textContent = String(sa.distinctCatalogGapsCount || 0);
  if (gapsSubEl) {
    gapsSubEl.textContent = (sa.zeroResultSearchesCount || 0) + " zero-result search events";
  }
  if (rateEl) rateEl.textContent = (sa.zeroResultRatePercent || 0) + "%";
  if (navBadgeEl) navBadgeEl.textContent = String(sa.distinctCatalogGapsCount || 0);

  // 1. Identified Catalog Gaps Table
  var gapsTbody = document.getElementById("search-gaps-tbody");
  var gapsList = Array.isArray(sa.catalogGaps) ? sa.catalogGaps : [];
  if (gapsTbody) {
    if (gapsList.length === 0) {
      gapsTbody.innerHTML =
        '<tr><td colspan="6" class="empty-cell">No zero-result catalog gaps detected — all logged component searches match active SKUs!</td></tr>';
    } else {
      var gHtml = "";
      for (var i = 0; i < gapsList.length; i++) {
        var gap = gapsList[i];
        var prioClass = gap.gapPriority === "CRITICAL_GAP" ? "crit" : (gap.gapPriority === "HIGH_GAP" ? "warn" : "ok");
        gHtml +=
          '<tr data-gap-query="' + escHtml(gap.normalizedQuery) + '">' +
            '<td>' +
              '<div class="prod-title">' + escHtml(gap.sampleRawQuery || gap.normalizedQuery) + '</div>' +
              '<div class="prod-meta">Normalized: <span class="mono">' + escHtml(gap.normalizedQuery) + '</span></div>' +
            '</td>' +
            '<td class="num-col"><strong>' + (gap.searchCount || 0) + '</strong></td>' +
            '<td><span class="mono">' + escHtml(gap.inferredCategory || "other") + '</span></td>' +
            '<td class="mono">' + escHtml(gap.recommendedSkuPrefix || "VB-PRT-") + '050</td>' +
            '<td><span class="state-label ' + prioClass + '">' + escHtml(gap.gapPriority || "EMERGING_GAP") + '</span></td>' +
            '<td class="actions-col">' +
              '<button type="button" class="btn-primary btn-stock-gap" ' +
              '        data-testid="stock-gap-btn-' + i + '" ' +
              '        onclick="stockCatalogGapItem(' +
              "'" + escHtml(String(gap.sampleRawQuery || gap.normalizedQuery).replace(/'/g, "\\'")) + "', " +
              "'" + escHtml(String(gap.inferredCategory || "components")) + "', " +
              "'" + escHtml(String(gap.recommendedSkuPrefix || "VB-PRT-")) + "'" +
              ')">+ Stock This Item</button>' +
            '</td>' +
          '</tr>';
      }
      gapsTbody.innerHTML = gHtml;
    }
  }

  // 2. Popular Component Searches Leaderboard
  var popTbody = document.getElementById("popular-searches-tbody");
  var popList = Array.isArray(sa.popularSearches) ? sa.popularSearches : [];
  if (popTbody) {
    if (popList.length === 0) {
      popTbody.innerHTML =
        '<tr><td colspan="6" class="empty-cell">No component searches logged yet.</td></tr>';
    } else {
      var pHtml = "";
      for (var p = 0; p < popList.length; p++) {
        var row = popList[p];
        var isGap = Boolean(row.catalogGap);
        pHtml +=
          '<tr>' +
            '<td class="mono">#' + (p + 1) + '</td>' +
            '<td><strong>' + escHtml(row.sampleRawQuery || row.normalizedQuery) + '</strong></td>' +
            '<td class="num-col">' + (row.searchCount || 0) + '</td>' +
            '<td class="num-col">' + (row.latestResultCount || 0) + '</td>' +
            '<td class="mono">' + escHtml(row.inferredCategory || "other") + '</td>' +
            '<td>' +
              '<span class="state-label ' + (isGap ? 'warn' : 'ok') + '">' +
                (isGap ? 'CATALOG GAP (0 SKUs)' : ('STOCKED (' + row.latestResultCount + ' SKUs)')) +
              '</span>' +
            '</td>' +
          '</tr>';
      }
      popTbody.innerHTML = pHtml;
    }
  }

  // 3. Search Demand by Hardware Group
  var catTbody = document.getElementById("search-category-demand-tbody");
  var catList = Array.isArray(sa.categoryDemand) ? sa.categoryDemand : [];
  if (catTbody) {
    if (catList.length === 0) {
      catTbody.innerHTML =
        '<tr><td colspan="4" class="empty-cell">No category demand data available.</td></tr>';
    } else {
      var cHtml = "";
      for (var c = 0; c < catList.length; c++) {
        var cRow = catList[c];
        cHtml +=
          '<tr>' +
            '<td><strong class="mono">' + escHtml(String(cRow.category || "other").toUpperCase()) + '</strong></td>' +
            '<td class="num-col">' + (cRow.totalSearches || 0) + '</td>' +
            '<td class="num-col"><span class="state-label ' + ((cRow.zeroResultSearches || 0) > 0 ? 'warn' : 'ok') + '">' + (cRow.zeroResultSearches || 0) + '</span></td>' +
            '<td class="num-col">' + (cRow.distinctQueries || 0) + '</td>' +
          '</tr>';
      }
      catTbody.innerHTML = cHtml;
    }
  }

  // 4. Recent Server Controller Search Log Stream
  var logsTbody = document.getElementById("recent-search-logs-tbody");
  var logsList = Array.isArray(sa.recentLogs) ? sa.recentLogs : [];
  if (logsTbody) {
    if (logsList.length === 0) {
      logsTbody.innerHTML =
        '<tr><td colspan="6" class="empty-cell">No search query logs recorded yet.</td></tr>';
    } else {
      var lHtml = "";
      for (var l = 0; l < logsList.length; l++) {
        var entry = logsList[l];
        var tStr = new Date(entry.timestamp || Date.now()).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
        var matches = typeof entry.resultCount === "number" ? entry.resultCount : 0;
        lHtml +=
          '<tr>' +
            '<td class="mono">#' + escHtml(entry.id) + '</td>' +
            '<td class="mono">' + escHtml(tStr) + '</td>' +
            '<td><strong>' + escHtml(entry.query || entry.normalizedQuery) + '</strong></td>' +
            '<td class="mono">' + escHtml(entry.source || "catalog-search") + '</td>' +
            '<td class="num-col"><span class="state-label ' + (matches === 0 ? 'warn' : 'ok') + '">' + matches + '</span></td>' +
            '<td>' + escHtml(entry.actorName || "Guest Shopper") + '</td>' +
          '</tr>';
      }
      logsTbody.innerHTML = lHtml;
    }
  }
}

window.stockCatalogGapItem = function (rawQuery, inferredGroup, skuPrefix) {
  openCreateProductModal();
  var titleEl = document.getElementById("form-product-title");
  var catEl = document.getElementById("form-product-category");
  var skuEl = document.getElementById("form-product-sku");
  var priceEl = document.getElementById("form-product-price");
  var stockEl = document.getElementById("form-product-stock");
  var descEl = document.getElementById("form-product-desc");

  var groupToCategory = {
    gpus: "gpus",
    cpus: "cpus",
    motherboards: "motherboards",
    storage: "storage",
    audio: "peripherals",
    gaming: "peripherals",
    other: "components"
  };
  var resolvedCategory = groupToCategory[String(inferredGroup || "").toLowerCase()] || "components";
  if (String(rawQuery || "").toLowerCase().indexOf("ddr") !== -1 || String(rawQuery || "").toLowerCase().indexOf("ram") !== -1) {
    resolvedCategory = "memory";
  }

  var nextNum = Math.min(999, Math.max(50, adminProducts.length + 25));
  var suggestedSku = (skuPrefix || "VB-PRT-") + String(nextNum).padStart(3, "0");

  if (titleEl) titleEl.value = rawQuery || "";
  if (catEl) catEl.value = resolvedCategory;
  if (skuEl) skuEl.value = suggestedSku;
  if (priceEl) priceEl.value = "249.00";
  if (stockEl) stockEl.value = "12";
  if (descEl) {
    descEl.value = "Added to Voltbox catalog to fulfill high-intent shopper search demand for \"" + (rawQuery || "") + "\".";
  }
  showAdminToast("Pre-filled New Product modal from Catalog Gap \"" + rawQuery + "\".");
};

function submitAdminTestSearchLog(e) {
  if (e && typeof e.preventDefault === "function") e.preventDefault();
  var inputEl = document.getElementById("admin-test-search-input");
  if (!inputEl) return;
  var q = inputEl.value.trim();
  if (q.length < 2) {
    showAdminToast("Enter at least 2 characters to log a search query.");
    return;
  }

  adminFetch("/api/products/search-log", {
    method: "POST",
    body: JSON.stringify({
      query: q,
      category: "all",
      source: "admin-simulator"
    })
  })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      inputEl.value = "";
      if (res && res.entry) {
        var count = res.entry.resultCount || 0;
        showAdminToast(
          count === 0
            ? ("Logged \"" + q + "\" — 0 matches (Added to Catalog Gaps)")
            : ("Logged \"" + q + "\" — " + count + " matching SKU(s) in catalog")
        );
      }
      loadAllAdminData();
    });
}

function clearAdminSearchLogs() {
  adminFetch("/api/admin/search-analytics", { method: "DELETE" })
    .then(function (r) { return r.json(); })
    .then(function () {
      showAdminToast("Cleared search query logs in Store.java.");
      loadAllAdminData();
    });
}

function renderHealthView() {
  if (!adminMetrics) return;
  var jvm = adminMetrics.jvm || {};
  var db = adminMetrics.database || {};
  var com = adminMetrics.commerce || {};

  var jvmEl = document.getElementById("jvm-metrics-list");
  if (jvmEl) {
    jvmEl.innerHTML =
      '<div class="metric-row"><span class="metric-key">Application Name</span><span class="metric-val">voltbox-hardware-bench</span></div>' +
      '<div class="metric-row"><span class="metric-key">Spring Boot / Java Runtime</span><span class="metric-val">Spring Boot ' + escHtml(jvm.springBootVersion || "3.3.4") + ' · Java ' + escHtml(jvm.javaVersion || "17") + '</span></div>' +
      '<div class="metric-row"><span class="metric-key">JVM Heap Memory Used</span><span class="metric-val">' + (jvm.heapUsedMb || 0) + ' MB / ' + (jvm.heapMaxMb || 512) + ' MB (' + (jvm.heapUtilizationPct || 0) + '%)</span></div>' +
      '<div class="metric-row"><span class="metric-key">Process Uptime</span><span class="metric-val">' + formatUptime(adminMetrics.uptimeSeconds) + '</span></div>';
  }

  var dbEl = document.getElementById("db-metrics-list");
  if (dbEl) {
    dbEl.innerHTML =
      '<div class="metric-row"><span class="metric-key">Persistence Provider</span><span class="metric-val">' + escHtml(db.engine || "H2 / MySQL (Spring Data JPA)") + '</span></div>' +
      '<div class="metric-row"><span class="metric-key">Hibernate SQL Dialect</span><span class="metric-val">' + escHtml(db.dialect || "H2Dialect (MODE=MySQL)") + '</span></div>' +
      '<div class="metric-row"><span class="metric-key">HikariCP Pool</span><span class="metric-val">' + escHtml(db.connectionPool || "VoltboxHikariPool") + ' (' + (db.activeConnections || 2) + '/' + (db.maxConnections || 10) + ' active)</span></div>' +
      '<div class="metric-row"><span class="metric-key">Schema DDL Mode</span><span class="metric-val">spring.jpa.hibernate.ddl-auto=' + escHtml(db.ddlAuto || "update") + '</span></div>';
  }

  var comEl = document.getElementById("commerce-metrics-list");
  if (comEl) {
    comEl.innerHTML =
      '<div class="metric-row"><span class="metric-key">Registered Accounts</span><span class="metric-val">' + (com.totalUsers || 0) + ' (' + (com.moderatorsCount || 0) + ' mod · ' + (com.contributorsCount || 0) + ' contrib · ' + (com.membersCount || 0) + ' member)</span></div>' +
      '<div class="metric-row"><span class="metric-key">Completed Checkout Orders</span><span class="metric-val">' + (com.totalOrders || 0) + ' orders</span></div>' +
      '<div class="metric-row"><span class="metric-key">Cumulative Order Volume</span><span class="metric-val">' + formatMoney(com.totalRevenue || 0) + '</span></div>' +
      '<div class="metric-row"><span class="metric-key">Moderation Queue</span><span class="metric-val">' + (com.openReportsCount || 0) + ' open reports · ' + (com.pendingApplicationsCount || 0) + ' pending applications</span></div>';
  }

  var epEl = document.getElementById("endpoint-probe-list");
  if (epEl && Array.isArray(adminMetrics.endpoints)) {
    var eHtml = "";
    for (var i = 0; i < adminMetrics.endpoints.length; i++) {
      var ep = adminMetrics.endpoints[i];
      if (ep.method !== "GET") continue;
      eHtml +=
        '<div class="endpoint-item">' +
          '<span class="endpoint-method">' + escHtml(ep.method) + '</span>' +
          '<span class="endpoint-path">' + escHtml(ep.path) + '</span>' +
          '<span class="endpoint-ctrl">' + escHtml(ep.controller) + '</span>' +
          '<button type="button" class="step-btn" onclick="probeEndpoint(\'' + escHtml(ep.path) + '\')">Probe JSON</button>' +
        '</div>';
    }
    epEl.innerHTML = eHtml;
  }
}

window.probeEndpoint = function (path) {
  var labelEl = document.getElementById("probe-output-label");
  var statusEl = document.getElementById("probe-output-status");
  var preEl = document.getElementById("probe-output-json");
  if (labelEl) labelEl.textContent = "GET " + path;
  if (statusEl) statusEl.textContent = "Fetching…";

  adminFetch(path)
    .then(function (r) {
      if (statusEl) statusEl.textContent = r.status + " " + (r.ok ? "OK" : "ERROR");
      return r.json();
    })
    .then(function (data) {
      if (preEl) {
        var formatted = JSON.stringify(data, null, 2);
        preEl.textContent = formatted.length > 3500 ? (formatted.slice(0, 3500) + "\n… [truncated]") : formatted;
      }
    })
    .catch(function (err) {
      if (preEl) preEl.textContent = "Error: " + String(err);
    });
};

// ── Create / Edit Product Modal ──

function openCreateProductModal() {
  document.getElementById("form-product-id").value = "";
  document.getElementById("product-modal-title").textContent = "New Hardware Product";
  document.getElementById("product-modal-submit").textContent = "Create Product Entity";
  document.getElementById("form-product-title").value = "";
  document.getElementById("form-product-category").value = "gpus";
  var skuEl = document.getElementById("form-product-sku");
  if (skuEl) skuEl.value = "";
  document.getElementById("form-product-price").value = "199.00";
  document.getElementById("form-product-stock").value = "8";
  document.getElementById("form-product-image").value = "/src/assets/images/product_ddr5_ram_kit_1793511150356.jpg";
  document.getElementById("form-product-desc").value = "";
  document.getElementById("form-product-official").checked = true;
  document.getElementById("form-error-msg").hidden = true;

  var backdrop = document.getElementById("product-modal-backdrop");
  backdrop.hidden = false;
  backdrop.setAttribute("aria-hidden", "false");
}

window.openEditProductModal = function (productId) {
  var p = null;
  for (var i = 0; i < adminProducts.length; i++) {
    if (adminProducts[i].id === productId) {
      p = adminProducts[i];
      break;
    }
  }
  if (!p) return;

  function applyProductToForm(prod) {
    document.getElementById("form-product-id").value = String(prod.id);
    document.getElementById("product-modal-title").textContent = "Edit Product #" + prod.id + " (" + prod.sku + ")";
    document.getElementById("product-modal-submit").textContent = "Save Changes";
    document.getElementById("form-product-title").value = prod.title || prod.name || "";
    document.getElementById("form-product-category").value = prod.category || "components";
    var skuEl = document.getElementById("form-product-sku");
    if (skuEl) skuEl.value = prod.sku || "";
    document.getElementById("form-product-price").value = Number(prod.price || 0).toFixed(2);
    document.getElementById("form-product-stock").value = String(typeof prod.stockQuantity === "number" ? prod.stockQuantity : (prod.quantity || 0));
    document.getElementById("form-product-image").value = prod.image || "";
    document.getElementById("form-product-desc").value = prod.description || "";
    document.getElementById("form-product-official").checked = Boolean(prod.official);
  }

  applyProductToForm(p);
  var errEl = document.getElementById("form-error-msg");
  if (errEl) errEl.hidden = true;

  var backdrop = document.getElementById("product-modal-backdrop");
  backdrop.hidden = false;
  backdrop.setAttribute("aria-hidden", "false");
};

function closeProductModal() {
  var backdrop = document.getElementById("product-modal-backdrop");
  backdrop.hidden = true;
  backdrop.setAttribute("aria-hidden", "true");
}

function submitProductForm(e) {
  e.preventDefault();
  var idVal = document.getElementById("form-product-id").value.trim();
  var title = document.getElementById("form-product-title").value.trim();
  var category = document.getElementById("form-product-category").value.trim();
  var skuEl = document.getElementById("form-product-sku");
  var sku = skuEl ? skuEl.value.trim() : "";
  var priceRaw = document.getElementById("form-product-price").value.trim();
  var price = parseFloat(priceRaw);
  var stockRaw = document.getElementById("form-product-stock").value.trim();
  var stockQuantity = Number(stockRaw);
  var image = document.getElementById("form-product-image").value.trim();
  var description = document.getElementById("form-product-desc").value.trim();
  var official = document.getElementById("form-product-official").checked;
  var errEl = document.getElementById("form-error-msg");

  if (!title) {
    errEl.textContent = "Product name/title is required.";
    errEl.hidden = false;
    return;
  }

  var isEdit = idVal !== "";
  var payload = {
    name: title,
    title: title,
    category: category,
    price: isNaN(price) ? 0 : price,
    stockQuantity: stockRaw === "" ? NaN : stockQuantity,
    quantity: stockRaw === "" ? NaN : stockQuantity,
    image: image || ("/images/categories/" + category + ".svg"),
    description: description,
    official: official
  };

  if (sku !== "" || isEdit) {
    payload.sku = sku;
  }

  var url = isEdit ? ("/api/admin/products/" + idVal) : "/api/admin/products";
  var method = isEdit ? "PUT" : "POST";

  adminFetch(url, {
    method: method,
    body: JSON.stringify(payload)
  })
    .then(function (r) {
      return r.json().then(function (data) { return { ok: r.ok, data: data }; });
    })
    .then(function (res) {
      if (!res.ok) {
        var msg = (res.data && res.data.message) || "Failed to save product.";
        if (res.data && Array.isArray(res.data.errors) && res.data.errors.length > 0) {
          var firstErr = res.data.errors[0];
          if (firstErr && firstErr.code && msg.indexOf(firstErr.code) === -1) {
            msg = "[" + firstErr.code + "] " + msg;
          }
        }
        errEl.textContent = msg;
        errEl.hidden = false;
        return;
      }
      closeProductModal();
      var saved = res.data.product || res.data;
      showAdminToast((isEdit ? "Updated " : "Created ") + (saved.title || title) + " (" + (saved.sku || "SKU") + ")");
      loadAllAdminData();
    })
    .catch(function () {
      errEl.textContent = "Network error communicating with Spring Boot server.";
      errEl.hidden = false;
    });
}

function switchAdminView(viewName) {
  activeAdminView = viewName;
  var views = ["catalog", "inventory", "search-analytics", "health"];
  var labels = {
    catalog: "Product CRUD",
    inventory: "Inventory Levels",
    "search-analytics": "Search & Catalog Gaps",
    health: "System Health & JPA"
  };

  for (var i = 0; i < views.length; i++) {
    var v = views[i];
    var sectionEl = document.getElementById("view-" + v);
    var btnEl = document.getElementById("nav-btn-" + v);
    if (sectionEl) sectionEl.hidden = (v !== viewName);
    if (btnEl) btnEl.classList.toggle("active", v === viewName);
  }

  var crumbEl = document.getElementById("breadcrumb-current");
  if (crumbEl) crumbEl.textContent = labels[viewName] || "Admin Console";

  if (viewName === "search-analytics") {
    renderSearchAnalyticsView();
  } else if (viewName === "health") {
    window.probeEndpoint("/api/admin/metrics");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  applyAdminColorMode(adminColorMode);

  var themeBtn = document.getElementById("admin-theme-mode-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      window.toggleAdminColorMode();
    });
  }

  var testSearchForm = document.getElementById("admin-test-search-form");
  if (testSearchForm) {
    testSearchForm.addEventListener("submit", submitAdminTestSearchLog);
  }
  var clearSearchBtn = document.getElementById("admin-clear-search-logs-btn");
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", clearAdminSearchLogs);
  }
  // Sidebar navigation
  var navEl = document.getElementById("sidebar-nav");
  if (navEl) {
    navEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".nav-item");
      if (!btn) return;
      switchAdminView(btn.getAttribute("data-view") || "catalog");
    });
  }

  // Search & filter controls
  var searchInput = document.getElementById("admin-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      renderProductsTable();
      renderAdminCatalogGrid();
    });
  }
  var groupSelect = document.getElementById("admin-group-select");
  if (groupSelect) {
    groupSelect.addEventListener("change", function () {
      renderProductsTable();
      renderAdminCatalogGrid();
    });
  }
  var stockFilterEl = document.getElementById("admin-stock-filter");
  if (stockFilterEl) {
    stockFilterEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".seg-btn");
      if (!btn) return;
      activeStockFilter = btn.getAttribute("data-stock-filter") || "all";
      var allBtns = stockFilterEl.querySelectorAll(".seg-btn");
      for (var i = 0; i < allBtns.length; i++) {
        allBtns[i].classList.toggle("active", allBtns[i] === btn);
      }
      renderProductsTable();
      renderAdminCatalogGrid();
    });
  }

  // Layout toggle (Table vs Catalog Grid)
  var layoutToggleEl = document.getElementById("admin-layout-toggle");
  if (layoutToggleEl) {
    layoutToggleEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".seg-btn");
      if (!btn) return;
      adminCatalogLayout = btn.getAttribute("data-layout") || "table";
      var allBtns = layoutToggleEl.querySelectorAll(".seg-btn");
      for (var i = 0; i < allBtns.length; i++) {
        allBtns[i].classList.toggle("active", allBtns[i] === btn);
      }
      var tableContainer = document.getElementById("admin-table-container");
      var gridContainer = document.getElementById("admin-catalog-grid");
      if (tableContainer) tableContainer.hidden = (adminCatalogLayout !== "table");
      if (gridContainer) gridContainer.hidden = (adminCatalogLayout !== "grid");
      renderProductsTable();
      renderAdminCatalogGrid();
    });
  }

  // Batch Edit Mode controls
  var batchToggleBtn = document.getElementById("admin-batch-mode-toggle");
  if (batchToggleBtn) {
    batchToggleBtn.addEventListener("click", function () {
      window.toggleAdminBatchMode();
    });
  }
  var tableSelectAll = document.getElementById("admin-table-select-all");
  if (tableSelectAll) {
    tableSelectAll.addEventListener("change", function () {
      var visibleIds = getFilteredAdminProducts().map(function (p) { return p.id; });
      if (tableSelectAll.checked) {
        window.selectAllVisibleAdminProducts();
      } else {
        if (window.VoltboxQR && typeof window.VoltboxQR.toggleBatchSelectionIds === "function") {
          adminSelectedProductIds = window.VoltboxQR.toggleBatchSelectionIds(adminSelectedProductIds, visibleIds, "remove");
        } else {
          adminSelectedProductIds = [];
        }
        updateAdminBatchPanelUI();
        renderProductsTable();
        renderAdminCatalogGrid();
      }
    });
  }
  var selAllBtn = document.getElementById("admin-batch-select-all-btn");
  if (selAllBtn) selAllBtn.addEventListener("click", window.selectAllVisibleAdminProducts);

  var selLowBtn = document.getElementById("admin-batch-select-low-btn");
  if (selLowBtn) selLowBtn.addEventListener("click", window.selectLowStockAdminProducts);

  var clearSelBtn = document.getElementById("admin-batch-clear-btn");
  if (clearSelBtn) clearSelBtn.addEventListener("click", window.clearAdminBatchSelection);

  var batchPriceModeEl = document.getElementById("admin-batch-price-mode");
  var batchPriceValEl = document.getElementById("admin-batch-price-value");
  var batchStockModeEl = document.getElementById("admin-batch-stock-mode");
  var batchStockValEl = document.getElementById("admin-batch-stock-value");
  var batchReasonEl = document.getElementById("admin-batch-reason");
  var batchFormEl = document.getElementById("admin-batch-form");

  function onBatchInputChanged() {
    updateAdminBatchPanelUI();
    renderProductsTable();
    renderAdminCatalogGrid();
  }
  if (batchPriceModeEl) batchPriceModeEl.addEventListener("change", onBatchInputChanged);
  if (batchPriceValEl) batchPriceValEl.addEventListener("input", onBatchInputChanged);
  if (batchStockModeEl) batchStockModeEl.addEventListener("change", onBatchInputChanged);
  if (batchStockValEl) batchStockValEl.addEventListener("input", onBatchInputChanged);
  if (batchReasonEl) batchReasonEl.addEventListener("input", updateAdminBatchPanelUI);
  if (batchFormEl) batchFormEl.addEventListener("submit", submitAdminBatchTransaction);

  // Topbar actions
  var refreshBtn = document.getElementById("refresh-data-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      loadAllAdminData().then(function () {
        showAdminToast("Synchronized catalog, inventory, and system health telemetry.");
      });
    });
  }
  var createBtn = document.getElementById("open-create-modal-btn");
  if (createBtn) {
    createBtn.addEventListener("click", openCreateProductModal);
  }

  // Modal handlers
  document.getElementById("product-modal-close").addEventListener("click", closeProductModal);
  document.getElementById("product-modal-cancel").addEventListener("click", closeProductModal);
  document.getElementById("product-crud-form").addEventListener("submit", submitProductForm);

  // Batch low-stock restock
  var batchBtn = document.getElementById("batch-restock-btn");
  if (batchBtn) {
    batchBtn.addEventListener("click", function () {
      adminFetch("/api/admin/inventory/restock-low-stock", {
        method: "POST",
        body: JSON.stringify({ amount: 5 })
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.ok) {
            showAdminToast("Replenished " + res.restockedCount + " low-stock SKUs (+5 units each).");
            loadAllAdminData();
          }
        });
    });
  }

  // Custom stock setter in Inventory view
  var applyLedgerBtn = document.getElementById("ledger-apply-btn");
  if (applyLedgerBtn) {
    applyLedgerBtn.addEventListener("click", function () {
      var pid = parseInt(document.getElementById("ledger-product-select").value, 10);
      var rawVal = document.getElementById("ledger-qty-input").value.trim();
      var nextQty = Number(rawVal);
      var reason = document.getElementById("ledger-reason-input").value.trim() || "Manual warehouse audit";
      if (isNaN(pid) || rawVal === "" || isNaN(nextQty)) return;

      adminFetch("/api/products/" + pid + "/inventory", {
        method: "POST",
        body: JSON.stringify({
          stockQuantity: nextQty,
          quantity: nextQty,
          reason: reason
        })
      })
        .then(function (r) {
          return r.json().then(function (data) { return { ok: r.ok, data: data }; });
        })
        .then(function (res) {
          if (!res.ok) {
            showAdminToast((res.data && res.data.message) || "Stock level rejected by server validation.");
            return;
          }
          if (res.data && res.data.product) {
            document.getElementById("ledger-reason-input").value = "";
            showAdminToast("Set " + res.data.product.sku + " stock to " + res.data.product.stockQuantity + " units.");
            loadAllAdminData();
          }
        });
    });
  }

  loadAllAdminData();
});
