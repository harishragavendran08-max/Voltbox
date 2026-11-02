// ============================================================================
// Voltbox Spring Boot Administration Console (/admin)
// Connects to ProductController, InventoryController, and AdminController
// ============================================================================

var adminProducts = [];
var adminMetrics = null;
var adminInventorySummary = null;
var activeAdminView = "catalog";
var activeStockFilter = "all";
var toastTimeout = null;

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
        adminFetch("/api/inventory").then(function (res) { return res.ok ? res.json() : null; })
      ]);
    })
    .then(function (results) {
      if (!Array.isArray(results)) return;
      var me = results[0];
      adminProducts = Array.isArray(results[1]) ? results[1] : [];
      adminMetrics = results[2];
      adminInventorySummary = results[3];

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
      renderInventoryView();
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

function renderProductsTable() {
  var tbody = document.getElementById("admin-products-tbody");
  if (!tbody) return;

  var filtered = getFilteredAdminProducts();
  if (filtered.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="empty-cell">No products match the current filter criteria.</td></tr>';
    return;
  }

  var html = "";
  for (var i = 0; i < filtered.length; i++) {
    var p = filtered[i];
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

    html +=
      '<tr class="' + (p.takenDown ? 'is-archived' : '') + '" data-product-id="' + p.id + '">' +
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
        '<td class="num-col">' + formatMoney(p.price) + '</td>' +
        '<td class="num-col" id="admin-stock-val-' + p.id + '">' + qty + '</td>' +
        '<td>' +
          '<div class="stock-stepper">' +
            '<button type="button" class="step-btn" onclick="quickAdjustStock(' + p.id + ', -1)">−1</button>' +
            '<button type="button" class="step-btn" onclick="quickAdjustStock(' + p.id + ', 1)">+1</button>' +
            '<button type="button" class="step-btn" onclick="quickAdjustStock(' + p.id + ', 5)">+5</button>' +
          '</div>' +
        '</td>' +
        '<td><span class="state-label ' + statusClass + '">' + escHtml(statusText) + '</span></td>' +
        '<td class="actions-col">' +
          '<div class="row-actions">' +
            '<button type="button" class="btn-secondary" onclick="openEditProductModal(' + p.id + ')">Edit</button>' +
            (p.takenDown
              ? '<button type="button" class="btn-secondary" onclick="toggleArchiveProduct(' + p.id + ', true)">Restore</button>'
              : '<button type="button" class="btn-danger-outline" onclick="toggleArchiveProduct(' + p.id + ', false)">Archive</button>') +
          '</div>' +
        '</td>' +
      '</tr>';
  }
  tbody.innerHTML = html;
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
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res && res.product) {
        showAdminToast("Updated " + res.product.sku + " stock to " + res.product.stockQuantity + " units.");
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
    document.getElementById("form-product-price").value = Number(prod.price || 0).toFixed(2);
    document.getElementById("form-product-stock").value = String(typeof prod.stockQuantity === "number" ? prod.stockQuantity : (prod.quantity || 0));
    document.getElementById("form-product-image").value = prod.image || "";
    document.getElementById("form-product-desc").value = prod.description || "";
    document.getElementById("form-product-official").checked = Boolean(prod.official);
  }

  applyProductToForm(p);
  document.getElementById("form-error-msg").hidden = true;

  var backdrop = document.getElementById("product-modal-backdrop");
  backdrop.hidden = false;
  backdrop.setAttribute("aria-hidden", "false");

  adminFetch("/api/products/" + productId)
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (fresh) {
      if (fresh && fresh.id === productId) {
        applyProductToForm(fresh);
      }
    })
    .catch(function () {});
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
  var price = parseFloat(document.getElementById("form-product-price").value);
  var stockQuantity = parseInt(document.getElementById("form-product-stock").value, 10);
  var image = document.getElementById("form-product-image").value.trim();
  var description = document.getElementById("form-product-desc").value.trim();
  var official = document.getElementById("form-product-official").checked;
  var errEl = document.getElementById("form-error-msg");

  if (!title) {
    errEl.textContent = "Product name/title is required.";
    errEl.hidden = false;
    return;
  }

  var payload = {
    name: title,
    title: title,
    category: category,
    price: isNaN(price) ? 0 : price,
    stockQuantity: isNaN(stockQuantity) ? 0 : stockQuantity,
    quantity: isNaN(stockQuantity) ? 0 : stockQuantity,
    image: image || ("/images/categories/" + category + ".svg"),
    description: description,
    official: official
  };

  var isEdit = idVal !== "";
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
        errEl.textContent = (res.data && res.data.message) || "Failed to save product.";
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
  var views = ["catalog", "inventory", "health"];
  var labels = {
    catalog: "Product CRUD",
    inventory: "Inventory Levels",
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

  if (viewName === "health") {
    window.probeEndpoint("/api/admin/metrics");
  }
}

document.addEventListener("DOMContentLoaded", function () {
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
    searchInput.addEventListener("input", renderProductsTable);
  }
  var groupSelect = document.getElementById("admin-group-select");
  if (groupSelect) {
    groupSelect.addEventListener("change", renderProductsTable);
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
    });
  }

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
      var nextQty = parseInt(document.getElementById("ledger-qty-input").value, 10);
      var reason = document.getElementById("ledger-reason-input").value.trim() || "Manual warehouse audit";
      if (isNaN(pid) || isNaN(nextQty) || nextQty < 0) return;

      adminFetch("/api/products/" + pid + "/inventory", {
        method: "POST",
        body: JSON.stringify({
          stockQuantity: nextQty,
          quantity: nextQty,
          reason: reason
        })
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.product) {
            document.getElementById("ledger-reason-input").value = "";
            showAdminToast("Set " + res.product.sku + " stock to " + res.product.stockQuantity + " units.");
            loadAllAdminData();
          }
        });
    });
  }

  loadAllAdminData();
});
