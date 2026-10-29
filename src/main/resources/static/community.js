
var adminBtn      = document.getElementById("admin-btn");
var adminSheet    = document.getElementById("admin-sheet");
var adminBody     = document.getElementById("admin-body");
var adminTitle    = document.getElementById("admin-title");
var adminRoleNote = document.getElementById("admin-role-note");
var adminBadge    = document.getElementById("admin-badge");

var donateBtn     = document.getElementById("donate-btn");
var donateOverlay = document.getElementById("donate-overlay");
var donateCard    = document.getElementById("donate-card");
var donateClose   = document.getElementById("donate-close");
var donateLink    = document.getElementById("donate-link");
var donateUpi     = document.getElementById("donate-upi");
var donateUpiId   = document.getElementById("donate-upi-id");
var donateUpiCopy = document.getElementById("donate-upi-copy");
var donateQrImg   = document.getElementById("donate-qr-img");

var reportOverlay = document.getElementById("report-overlay");
var reportCard    = document.getElementById("report-card");
var reportClose   = document.getElementById("report-close");
var reportReason  = document.getElementById("report-reason");
var reportNote    = document.getElementById("report-note");
var reportMsg     = document.getElementById("report-msg");
var reportSubmit  = document.getElementById("report-submit");
var reportWhat    = document.getElementById("report-what");

var ws = null;             
var reportingId = null;    

// ── app.js calls this once it knows who's signed in ──

window.onMeLoaded = function () {
  // let CSS know whether to show the per-card report flags
  document.body.classList.toggle("can-report", canReport());

  wireOnce();
  renderAdminPanel();
  connectSocket();
};

function canReport() {
  return !!me;
}
function canContribute() {
  return me && (me.role === "contributor" || me.role === "moderator");
}
function isModerator() {
  return me && me.role === "moderator";
}


var wired = false;
function wireOnce() {
  if (wired) return;
  wired = true;

  adminBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleSheet(adminSheet, adminBtn);
  });
  adminSheet.addEventListener("click", function (e) { e.stopPropagation(); });

  // donation pop-up
  donateBtn.addEventListener("click", openDonate);
  donateClose.addEventListener("click", closeDonate);
  donateOverlay.addEventListener("click", function (e) {
    if (e.target === donateOverlay) closeDonate();
  });
  donateUpiCopy.addEventListener("click", copyUpiId);

  // report pop-up
  reportClose.addEventListener("click", closeReport);
  reportOverlay.addEventListener("click", function (e) {
    if (e.target === reportOverlay) closeReport();
  });
  reportSubmit.addEventListener("click", sendReport);

  // Esc closes whichever pop-up is open
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (donateOverlay.classList.contains("open")) closeDonate();
    if (reportOverlay.classList.contains("open")) closeReport();
  });
}


function renderAdminPanel() {
  if (me.role === "moderator") {
    adminTitle.textContent = "Moderator";
    adminRoleNote.innerHTML = icon("shield-check", 13) + " Voltbox head";
    renderModeratorPanel();
  } else if (me.role === "contributor") {
    adminTitle.textContent = "Contribute";
    adminRoleNote.innerHTML = icon("award", 13) + " Contributor";
    renderContributorPanel();
    hideBadge();
  } else {
    adminTitle.textContent = "Community";
    adminRoleNote.textContent = "";
    renderMemberPanel();
    hideBadge();
  }
  renderIcons(adminBody);
}


// ── MEMBER: apply to contribute ──

function renderMemberPanel() {
  adminBody.innerHTML = '<p class="sheet-empty">loading…</p>';

  api("/api/applications/mine")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var app = data.application && data.application.status ? data.application : null;

      if (app && app.status === "pending") {
        adminBody.innerHTML = statusCard("clock",
          "Application sent",
          "Harish is reviewing it. You'll get contributor access here the moment it's approved — no need to refresh.");
        return;
      }
      if (app && app.status === "declined") {
        adminBody.innerHTML = statusCard("x",
          "Not approved this time",
          "Your last application wasn't approved. You're welcome to apply again with more detail below.") +
          applyForm();
        wireApplyForm();
        return;
      }
      // never applied (or approved-but-somehow-still-member): show the pitch
      adminBody.innerHTML =
        '<p class="sheet-note">Voltbox is kept accurate by people who work with this ' +
        'gear. If that\'s you, apply to become a <b>contributor</b> and help keep the ' +
        'catalog honest.</p>' + applyForm();
      wireApplyForm();
    });
}

function applyForm() {
  return '' +
    '<div class="admin-form">' +
      field("Where do you work in IT?", '<input id="ap-workplace" type="text" placeholder="e.g. Network engineer at Acme">') +
      field("Link to your work ID / badge", '<input id="ap-idcard" type="url" placeholder="https://… a photo of your ID">') +
      field("Anything else? (optional)", '<textarea id="ap-note" rows="2" placeholder="Tell Harish a bit about you"></textarea>') +
      '<p class="admin-msg" id="ap-msg" hidden></p>' +
      '<button class="sheet-btn solid" id="ap-submit">' + icon("send", 16) + ' Send application</button>' +
    '</div>';
}

function wireApplyForm() {
  document.getElementById("ap-submit").addEventListener("click", submitApplication);
}

function submitApplication() {
  var body = {
    workplace: val("ap-workplace"),
    idCardImage: val("ap-idcard"),
    note: val("ap-note")
  };
  var btn = document.getElementById("ap-submit");
  btn.disabled = true;

  api("/api/applications", { method: "POST", body: JSON.stringify(body) })
    .then(jsonWithOk)
    .then(function (res) {
      if (res.ok) {
        renderMemberPanel();       // flips to the "pending" card
      } else {
        btn.disabled = false;
        adminMsg("ap-msg", res.data.message || "Couldn't send that.", true);
      }
    })
    .catch(function () { btn.disabled = false; adminMsg("ap-msg", "Can't reach the server.", true); });
}


// ── CONTRIBUTOR: add listings + see your uploads ──

function renderContributorPanel() {
  adminBody.innerHTML =
    uploadForm() +
    '<div class="sheet-divider"></div>' +
    '<div class="sheet-section tight">' +
      '<div class="sheet-label">Your uploads</div>' +
      '<div class="admin-list" id="my-uploads"><p class="sheet-empty">loading…</p></div>' +
    '</div>';
  wireUploadForm();
  loadMyUploads();
}

function uploadForm() {
  return '' +
    '<div class="admin-form">' +
      '<div class="sheet-label">Add a listing</div>' +
      field("Title", '<input id="pr-title" type="text" placeholder="e.g. Ubiquiti UniFi U7 Pro">') +
      '<div class="admin-row2">' +
        field("Price (USD)", '<input id="pr-price" type="number" min="0" step="0.01" placeholder="189.00">') +
        field("Category", categorySelect()) +
      '</div>' +
      field("Image link", '<input id="pr-image" type="url" placeholder="https://… paste a photo of the part">') +
      field("Description", '<textarea id="pr-desc" rows="2" placeholder="A short, honest line about it"></textarea>') +
      '<p class="admin-msg" id="pr-msg" hidden></p>' +
      '<button class="sheet-btn solid" id="pr-submit">' + icon("plus", 16) + ' Add listing</button>' +
    '</div>';
}

var CATEGORIES = ["cpus","gpus","memory","storage","motherboards","power","cooling",
  "cases","networking","cables","peripherals","monitors","microcontrollers",
  "components","sensors","tools","connectors","adapters"];

function categorySelect() {
  var opts = "";
  for (var i = 0; i < CATEGORIES.length; i++) {
    opts += '<option value="' + CATEGORIES[i] + '">' + CATEGORIES[i] + '</option>';
  }
  return '<select id="pr-category">' + opts + '</select>';
}

function wireUploadForm() {
  document.getElementById("pr-submit").addEventListener("click", submitProduct);
}

function submitProduct() {
  var body = {
    title: val("pr-title"),
    price: parseFloat(val("pr-price")) || 0,
    category: val("pr-category"),
    image: val("pr-image"),
    description: val("pr-desc")
  };
  if (!body.title) { adminMsg("pr-msg", "Give it a title first.", true); return; }
  if (!body.image) { adminMsg("pr-msg", "Add an image link — a photo of the part.", true); return; }

  var btn = document.getElementById("pr-submit");
  btn.disabled = true;

  api("/api/products", { method: "POST", body: JSON.stringify(body) })
    .then(jsonWithOk)
    .then(function (res) {
      btn.disabled = false;
      if (res.ok) {
        adminMsg("pr-msg", "Added! It's live in the shop now.", false);
        clearFields(["pr-title", "pr-price", "pr-image", "pr-desc"]);
        reloadShop();          // so the new card shows up in the grid
        loadMyUploads();
      } else {
        adminMsg("pr-msg", res.data.message || "Couldn't add that.", true);
      }
    })
    .catch(function () { btn.disabled = false; adminMsg("pr-msg", "Can't reach the server.", true); });
}

function loadMyUploads() {
  var box = document.getElementById("my-uploads");
  if (!box) return;
  api("/api/my-products")
    .then(function (r) { return r.json(); })
    .then(function (list) {
      if (!list.length) { box.innerHTML = '<p class="sheet-empty">Nothing yet — add your first listing above.</p>'; return; }
      var html = "";
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        var down = p.takenDown;
        html +=
          '<div class="admin-item' + (down ? " dim" : "") + '">' +
            '<div class="admin-item-main">' +
              '<div class="admin-item-title">' + esc(p.title) + (down ? ' <span class="pill">taken down</span>' : '') + '</div>' +
              '<div class="admin-item-sub">$' + Number(p.price).toFixed(2) + ' · ' + esc(p.category) + '</div>' +
            '</div>' +
            (down ? '' : '<button class="icon-mini danger" title="Take down" onclick="takeDownProduct(' + p.id + ')">' + icon("trash", 15) + '</button>') +
          '</div>';
      }
      box.innerHTML = html;
      renderIcons(box);
    });
}

function takeDownProduct(id) {
  api("/api/products/" + id, { method: "DELETE" })
    .then(jsonWithOk)
    .then(function (res) {
      if (res.ok) { reloadShop(); loadMyUploads(); }
    });
}


// ── MODERATOR: everything, plus the queues ──

function renderModeratorPanel() {
  adminBody.innerHTML =
    // add listings (moderators contribute too)
    uploadForm() +

    '<div class="sheet-divider"></div>' +
    '<div class="sheet-section tight">' +
      '<div class="sheet-label">' + icon("inbox", 13) + ' Applications <span class="count-pill" id="apps-count"></span></div>' +
      '<div class="admin-list" id="apps-list"><p class="sheet-empty">loading…</p></div>' +
    '</div>' +

    '<div class="sheet-divider"></div>' +
    '<div class="sheet-section tight">' +
      '<div class="sheet-label">' + icon("users", 13) + ' Contributors</div>' +
      '<div class="admin-list" id="contrib-list"><p class="sheet-empty">loading…</p></div>' +
      '<div class="link-row" style="margin-top:8px">' +
        '<input id="grant-email" type="email" placeholder="grant access by email">' +
        '<button class="sheet-btn small" id="grant-btn">Grant</button>' +
      '</div>' +
      '<p class="admin-msg" id="grant-msg" hidden></p>' +
    '</div>' +

    '<div class="sheet-divider"></div>' +
    '<div class="sheet-section tight">' +
      '<div class="sheet-label">' + icon("alert", 13) + ' Reports <span class="count-pill" id="reports-count"></span></div>' +
      '<div class="admin-list" id="reports-list"><p class="sheet-empty">loading…</p></div>' +
    '</div>' +

    '<div class="sheet-divider"></div>' +
    uploadFormMyUploads() +


  wireUploadForm();
  document.getElementById("grant-btn").addEventListener("click", grantAccess);
  loadMyUploads();
  loadApplications();
  loadContributors();
  loadReports();
}

// the moderator also gets an "your uploads" section, same as a contributor
function uploadFormMyUploads() {
  return '<div class="sheet-section tight">' +
    '<div class="sheet-label">Your uploads</div>' +
    '<div class="admin-list" id="my-uploads"><p class="sheet-empty">loading…</p></div>' +
  '</div>';
}

function loadApplications() {
  var box = document.getElementById("apps-list");
  if (!box) return;
  api("/api/applications")
    .then(function (r) { return r.json(); })
    .then(function (list) {
      setCount("apps-count", list.length);
      updateBadge();
      if (!list.length) { box.innerHTML = '<p class="sheet-empty">No applications waiting.</p>'; return; }
      var html = "";
      for (var i = 0; i < list.length; i++) {
        var a = list[i];
        html +=
          '<div class="admin-item column">' +
            '<div class="admin-item-title">' + esc(a.applicantName) + '</div>' +
            '<div class="admin-item-sub">' + icon("briefcase", 12) + ' ' + esc(a.workplace) + '</div>' +
            (a.note ? '<div class="admin-item-sub">“' + esc(a.note) + '”</div>' : '') +
            '<a class="admin-item-link" href="' + encodeURI(a.idCardImage) + '" target="_blank" rel="noopener">' +
              icon("id-card", 12) + ' view ID</a>' +
            '<div class="admin-actions">' +
              '<button class="mini-btn approve" onclick="decideApp(' + a.id + ',true)">' + icon("check", 14) + ' Approve</button>' +
              '<button class="mini-btn decline" onclick="decideApp(' + a.id + ',false)">' + icon("x", 14) + ' Decline</button>' +
            '</div>' +
          '</div>';
      }
      box.innerHTML = html;
      renderIcons(box);
    });
}

function decideApp(id, approve) {
  api("/api/applications/" + id + "/" + (approve ? "approve" : "decline"), { method: "POST" })
    .then(jsonWithOk)
    .then(function (res) { if (res.ok) loadApplications(); if (res.ok && approve) loadContributors(); });
}

function loadContributors() {
  var box = document.getElementById("contrib-list");
  if (!box) return;
  api("/api/contributors")
    .then(function (r) { return r.json(); })
    .then(function (list) {
      var html = "";
      for (var i = 0; i < list.length; i++) {
        var u = list[i];
        html +=
          '<div class="admin-item">' +
            '<span class="mini-avatar" style="background:' + u.color + '">' + firstLetter(u.name) + '</span>' +
            '<div class="admin-item-main">' +
              '<div class="admin-item-title">' + esc(u.name) +
                (u.role === "moderator" ? ' <span class="pill mod">mod</span>' : '') + '</div>' +
              '<div class="admin-item-sub">' + esc(u.email) + '</div>' +
            '</div>' +
          '</div>';
      }
      box.innerHTML = html || '<p class="sheet-empty">Just you so far.</p>';
    });
}

function grantAccess() {
  var email = val("grant-email");
  if (!email) { adminMsg("grant-msg", "Whose email?", true); return; }
  var btn = document.getElementById("grant-btn");
  btn.disabled = true;
  api("/api/contributors/grant", { method: "POST", body: JSON.stringify({ email: email }) })
    .then(jsonWithOk)
    .then(function (res) {
      btn.disabled = false;
      if (res.ok) {
        adminMsg("grant-msg", res.data.name + " is now a contributor.", false);
        clearFields(["grant-email"]);
        loadContributors();
      } else {
        adminMsg("grant-msg", res.data.message || "Couldn't do that.", true);
      }
    })
    .catch(function () { btn.disabled = false; adminMsg("grant-msg", "Can't reach the server.", true); });
}

function loadReports() {
  var box = document.getElementById("reports-list");
  if (!box) return;
  api("/api/reports")
    .then(function (r) { return r.json(); })
    .then(function (list) {
      setCount("reports-count", list.length);
      updateBadge();
      if (!list.length) { box.innerHTML = '<p class="sheet-empty">No open reports. Nice.</p>'; return; }
      var html = "";
      for (var i = 0; i < list.length; i++) {
        var r = list[i];
        html +=
          '<div class="admin-item column">' +
            '<div class="admin-item-title">' + esc(r.productTitle) + '</div>' +
            '<div class="admin-item-sub">' + esc(r.reason) + (r.note ? ' — “' + esc(r.note) + '”' : '') + '</div>' +
            '<div class="admin-item-sub dim">reported by ' + esc(r.reporterName) + '</div>' +
            '<div class="admin-actions">' +
              '<button class="mini-btn decline" onclick="resolveReport(' + r.id + ',true)">' + icon("trash", 14) + ' Take down</button>' +
              '<button class="mini-btn" onclick="resolveReport(' + r.id + ',false)">' + icon("check", 14) + ' Dismiss</button>' +
            '</div>' +
          '</div>';
      }
      box.innerHTML = html;
      renderIcons(box);
    });
}

function resolveReport(id, takedown) {
  api("/api/reports/" + id + "/resolve", { method: "POST", body: JSON.stringify({ action: takedown ? "takedown" : "dismiss" }) })
    .then(jsonWithOk)
    .then(function (res) { if (res.ok) { loadReports(); if (takedown) reloadShop(); } });
}


  el.className = 'admin-toast' + (isError? ' error':'');
  el.textContent = text;
  adminBody.insertBefore(el, adminBody.firstChild);
  setTimeout(function () { el.classList.add('fade'); setTimeout(function () { el.remove(); }, 400); }, 2500);
}


function reportProduct(id) {
  reportingId = id;
  var p = findProductById(id);
  reportWhat.textContent = p ? ('Flag "' + p.title + '" for the moderator.') : "Flag this listing for the moderator.";
  reportMsg.hidden = true;
  reportReason.selectedIndex = 0;
  reportNote.value = "";
  openModal(reportOverlay);
}

function sendReport() {
  if (reportingId == null) return;
  reportSubmit.disabled = true;
  var body = { productId: reportingId, reason: reportReason.value, note: reportNote.value.trim() };
  api("/api/reports", { method: "POST", body: JSON.stringify(body) })
    .then(jsonWithOk)
    .then(function (res) {
      reportSubmit.disabled = false;
      if (res.ok) {
        modalMsg(reportMsg, "Thanks — sent to the moderator.", false);
        setTimeout(closeReport, 900);
      } else {
        modalMsg(reportMsg, res.data.message || "Couldn't send it.", true);
      }
    })
    .catch(function () { reportSubmit.disabled = false; modalMsg(reportMsg, "Can't reach the server.", true); });
}

function closeReport() { closeModal(reportOverlay); reportingId = null; }



function openDonate() {
  var url = me && me.donateUrl ? me.donateUrl : "";
  if (url) {
    donateLink.href = url;
    donateLink.classList.remove("disabled");
    donateLink.innerHTML = icon("heart", 16) + " Donate " + icon("external", 15);
  } else {
    // no link set yet — keep the card friendly.
    donateLink.href = "#";
    donateLink.classList.add("disabled");
    donateLink.innerHTML = icon("heart", 16) + " Donation link coming soon";
  }

  // UPI id and QR handling
  var upiId = me && me.upiId ? me.upiId : "";
  var qr = me && me.donateQr ? me.donateQr : "";
  donateUpi.hidden = !upiId && !qr;
  donateUpiId.textContent = upiId;
  donateUpiId.parentElement.hidden = !upiId;

  // populate a small photo strip using either provided images or fallbacks
  try {
    var photosEl = document.getElementById("donate-photos");
    if (photosEl) {
      var provided = me && me.donateImages && me.donateImages.length ? me.donateImages : null;
      var fallbacks = ["/images/donate/original-poor-kids.jpg","/images/donate/poor-children.jpg","/images/donate/poor-children.svg","/images/donate/child1.svg","/images/donate/child2.svg","/images/donate/child3.svg"];
      var list = provided || fallbacks;
      // show up to 4 thumbnails
      var show = list.slice(0, 4);
      var html = "";
      for (var i = 0; i < show.length; i++) {
        var src = show[i];
        // ensure absolute-ish path (if someone provided just a filename assume /images/donate/)
        if (src && !src.match(/^https?:|^\/|^data:/)) src = "/images/donate/" + src;
        html += '<img src="' + esc(src) + '" alt="poor kids donation photo">';
      }
      photosEl.innerHTML = html;
      photosEl.hidden = show.length === 0;
    }
  } catch (e) {
    // harmless if DOM not exactly as expected
    console.warn('donate photos render failed', e);
  }

  // QR image: use provided QR if present; otherwise show a small fake QR (inline SVG)
  if (qr) {
    donateQrImg.src = "/images/donate/" + qr;
    donateQrImg.hidden = false;
  } else {
    // small fake QR-like SVG (non-functional placeholder)
    var svg = '' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="400" height="400">' +
        '<rect width="120" height="120" fill="#fff"/>' +
        '<rect x="6" y="6" width="30" height="30" fill="#000"/>' +
        '<rect x="84" y="6" width="30" height="30" fill="#000"/>' +
        '<rect x="6" y="84" width="30" height="30" fill="#000"/>' +
        // a few small blocks to make it feel QR-like
        '<rect x="48" y="20" width="8" height="8" fill="#000" />' +
        '<rect x="64" y="20" width="8" height="8" fill="#000" />' +
        '<rect x="48" y="36" width="8" height="8" fill="#000" />' +
        '<rect x="64" y="36" width="8" height="8" fill="#000" />' +
        '<rect x="30" y="60" width="12" height="12" fill="#000" />' +
        '<rect x="72" y="60" width="10" height="10" fill="#000" />' +
      '</svg>';
    donateQrImg.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    donateQrImg.hidden = false;
  }

  openModal(donateOverlay);
}
function closeDonate() { closeModal(donateOverlay); }

function copyUpiId() {
  var text = donateUpiId.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(
    function () { flashCopyButton(true); },
    function () { selectText(donateUpiId); flashCopyButton(false); }
  );
}

function selectText(el) {
  var range = document.createRange();
  range.selectNodeContents(el);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function flashCopyButton(copied) {
  donateUpiCopy.innerHTML = icon(copied ? "check" : "copy", 15);
  donateUpiCopy.title = copied ? "Copied!" : "Selected — press Ctrl+C / Cmd+C to copy";
  setTimeout(function () {
    donateUpiCopy.innerHTML = '<span data-icon="copy" data-icon-size="15"></span>';
    donateUpiCopy.removeAttribute("title");
    renderIcons(donateUpiCopy);
  }, 1400);
}



function connectSocket() {
  if (ws) return;
  var token = localStorage.getItem("voltbox_token");
  if (!token) return;

  var proto = location.protocol === "https:" ? "wss://" : "ws://";
  ws = new WebSocket(proto + location.host + "/ws/community?token=" + token);

  ws.onmessage = function (event) {
    var msg;
    try { msg = JSON.parse(event.data); } catch (e) { return; }
    handleLiveEvent(msg);
  };

  ws.onclose = function () {
    ws = null;
    setTimeout(function () { if (me) connectSocket(); }, 4000);
  };
}

function handleLiveEvent(msg) {
  if (msg.type === "application-new") {
    // a new application arrived — refresh the moderator's queue live
    if (isModerator()) loadApplications();
  } else if (msg.type === "report-new") {
    if (isModerator()) loadReports();
  } else if (msg.type === "application-decided") {
   
    if (msg.status === "approved") refreshRole();
    else renderMemberPanel();
  } else if (msg.type === "role-changed") {
    // the moderator granted access directly
    refreshRole();
  } else if (msg.type === "product-added" || msg.type === "product-taken-down") {
    reloadShop();
  }
}

// re-fetch who we are (our role may have just changed) and repaint the panel
function refreshRole() {
  api("/api/me")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data || !data.role) return;
      me = data;
      document.body.classList.toggle("can-report", canReport());
      renderAdminPanel();
      reloadShop();     // so the report flags appear on cards now
    });
}


function updateBadge() {
  if (!isModerator()) { hideBadge(); return; }
  var apps = countText("apps-count");
  var reps = countText("reports-count");
  var total = apps + reps;
  if (total > 0) { adminBadge.textContent = total; adminBadge.hidden = false; }
  else hideBadge();
}
function hideBadge() { adminBadge.hidden = true; }
function countText(id) { var el = document.getElementById(id); return el ? (parseInt(el.textContent, 10) || 0) : 0; }
function setCount(id, n) { var el = document.getElementById(id); if (el) el.textContent = n ? n : ""; }

// a small titled field wrapper used all over the forms
function field(label, control) {
  return '<label class="field"><span class="field-label">' + label + '</span>' + control + '</label>';
}

// a status card (icon + title + text), used for the member's application state
function statusCard(ic, title, text) {
  return '<div class="status-card">' +
    '<div class="status-icon">' + icon(ic, 20) + '</div>' +
    '<div class="status-title">' + esc(title) + '</div>' +
    '<div class="status-text">' + esc(text) + '</div>' +
  '</div>';
}

function openModal(overlay) {
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
}
function closeModal(overlay) {
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

function adminMsg(id, text, isError) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = isError ? "admin-msg error" : "admin-msg";
  el.hidden = false;
}
function modalMsg(el, text, isError) {
  el.textContent = text;
  el.className = isError ? "modal-msg error" : "modal-msg";
  el.hidden = false;
}

function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }
function clearFields(ids) { for (var i = 0; i < ids.length; i++) { var el = document.getElementById(ids[i]); if (el) el.value = ""; } }
function firstLetter(s) { return (s && s.length) ? s.charAt(0).toUpperCase() : "?"; }

// find a product in app.js's already-loaded list (for the report modal title)
function findProductById(id) {
  for (var i = 0; i < products.length; i++) if (products[i].id === id) return products[i];
  return null;
}

// re-fetch the catalog and redraw the grid (after adding/taking down a listing)
function reloadShop() {
  gridEl.innerHTML = '<div class="loading" id="loading"><div class="spinner"></div><p>updating…</p></div>';
  loadingEl = document.getElementById("loading");
  fetchProducts();
}

// unwrap a fetch into { ok, data } the way app.js does everywhere
function jsonWithOk(res) {
  return res.json().then(function (data) { return { ok: res.ok, data: data }; });
}
