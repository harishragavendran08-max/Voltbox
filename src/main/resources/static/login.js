var form               = document.getElementById("login-form");
var emailEl            = document.getElementById("email");
var passEl             = document.getElementById("password");
var errEl              = document.getElementById("login-error");
var btnEl              = document.getElementById("login-btn");
var btnLabelEl         = document.getElementById("login-btn-label");
var toggleEl           = document.getElementById("toggle-pw");
var emailTelemetryEl   = document.getElementById("email-telemetry");
var pwTelemetryEl      = document.getElementById("pw-telemetry");
var demoLoginBtnEl     = document.getElementById("demo-login-btn");
var demoFillBtnEl      = document.getElementById("demo-fill-btn");
var demoBoltIconEl     = document.getElementById("demo-bolt-icon");
var demoBtnTitleEl     = document.getElementById("demo-btn-title");
var demoBtnSubEl       = document.getElementById("demo-btn-sub");
var cardsStageEl       = document.getElementById("showcase-cards-stage");

var loginCardEl        = document.getElementById("login-card");
var roleTabUserEl      = document.getElementById("role-tab-user");
var roleTabAdminEl     = document.getElementById("role-tab-admin");
var roleScopeBannerEl  = document.getElementById("role-scope-banner");
var scopePillEl        = document.getElementById("scope-pill");
var scopeTextEl        = document.getElementById("scope-text");
var userSocialSection  = document.getElementById("user-social-section");
var adminDestBarEl     = document.getElementById("admin-dest-bar");
var loginSubEl         = document.getElementById("login-sub");
var emailFieldLabelEl  = document.getElementById("email-field-label");
var pwFieldLabelEl     = document.getElementById("pw-field-label");
var terminalModeCodeEl = document.getElementById("terminal-mode-code");
var terminalFootRoleEl = document.getElementById("terminal-foot-role");
var authSwitchRowEl    = document.getElementById("auth-switch-row");
var compareCardUserEl  = document.getElementById("compare-card-user");
var compareCardAdminEl = document.getElementById("compare-card-admin");

var googleLoginBtnEl   = document.getElementById("google-login-btn");
var appleLoginBtnEl    = document.getElementById("apple-login-btn");

// OAuth Modal elements
var oauthModalOverlay  = document.getElementById("oauth-modal-overlay");
var oauthModalClose    = document.getElementById("oauth-modal-close");
var oauthModalLogo     = document.getElementById("oauth-modal-logo");
var oauthModalKicker   = document.getElementById("oauth-modal-kicker");
var oauthModalTitle    = document.getElementById("oauth-modal-title");
var oauthModalSubtitle = document.getElementById("oauth-modal-subtitle");
var oauthAccountList   = document.getElementById("oauth-account-list");
var appleRelayBox      = document.getElementById("apple-relay-box");
var oauthCustomForm    = document.getElementById("oauth-custom-form");
var oauthCustomName    = document.getElementById("oauth-custom-name");
var oauthCustomEmail   = document.getElementById("oauth-custom-email");
var oauthEmailLabel    = document.getElementById("oauth-custom-email-label");
var oauthCustomSubmit  = document.getElementById("oauth-custom-submit");

var activeLoginMode = "user"; // "user" | "admin"
var activeOAuthProvider = "google"; // "google" | "apple"

var USER_DEMO_EMAIL  = "alex.chen@gmail.com";
var USER_DEMO_PASS   = "Shopper123";
var ADMIN_DEMO_EMAIL = "harish@voltbox.test";
var ADMIN_DEMO_PASS  = "Harish123";

var GOOGLE_PRESET_ACCOUNTS = [
  {
    name: "Alex Chen",
    email: "alex.chen@gmail.com",
    badge: "Google Account · Shopper",
    color: "#4285F4",
    initial: "A"
  },
  {
    name: "Priya Nair",
    email: "priya.nair@gmail.com",
    badge: "Google Workspace · Verified Buyer",
    color: "#34A853",
    initial: "P"
  }
];

var APPLE_PRESET_ACCOUNTS = [
  {
    name: "Maya Lin",
    email: "maya.lin@icloud.com",
    badge: "iCloud Keychain · Passkey Verified",
    color: "#111827",
    initial: "M"
  },
  {
    name: "Liam Brooks",
    email: "liam.brooks@icloud.com",
    badge: "Apple ID · Touch ID / Face ID",
    color: "#334155",
    initial: "L"
  }
];

var GOOGLE_LOGO_SVG =
  '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">' +
  '<path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"/>' +
  '<path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"/>' +
  '<path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.6 6.4C.6 8.4 0 10.6 0 12s.6 3.6 1.6 5.6l3.7-2.8z"/>' +
  '<path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 19.9 7.4 23 12 23z"/>' +
  '</svg>';

var APPLE_LOGO_SVG =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="#f8fafc" aria-hidden="true">' +
  '<path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>' +
  '</svg>';

// ── Role Mode Switching (User Login vs Admin Login) ──
function setLoginMode(mode) {
  activeLoginMode = mode === "admin" ? "admin" : "user";
  var isAdmin = activeLoginMode === "admin";
  hideError();

  if (loginCardEl) {
    loginCardEl.setAttribute("data-auth-mode", activeLoginMode);
  }
  if (roleTabUserEl) {
    roleTabUserEl.classList.toggle("active", !isAdmin);
    roleTabUserEl.setAttribute("aria-selected", !isAdmin ? "true" : "false");
  }
  if (roleTabAdminEl) {
    roleTabAdminEl.classList.toggle("active", isAdmin);
    roleTabAdminEl.setAttribute("aria-selected", isAdmin ? "true" : "false");
  }
  if (compareCardUserEl) compareCardUserEl.classList.toggle("active", !isAdmin);
  if (compareCardAdminEl) compareCardAdminEl.classList.toggle("active", isAdmin);

  if (roleScopeBannerEl) {
    roleScopeBannerEl.setAttribute("data-mode", activeLoginMode);
  }
  if (scopePillEl) {
    scopePillEl.textContent = isAdmin ? "ADMIN PRIVILEGE" : "SHOPPER MODE";
  }
  if (scopeTextEl) {
    scopeTextEl.textContent = isAdmin
      ? "Full access to Storefront Catalog + /admin CRUD Dashboard & Inventory."
      : "Browse products, compare 6M prices & buy (No /admin access).";
  }

  // Show Google & Apple social buttons ONLY for User Login
  if (userSocialSection) {
    userSocialSection.hidden = isAdmin;
  }
  if (adminDestBarEl) {
    adminDestBarEl.hidden = !isAdmin;
  }

  if (loginSubEl) {
    loginSubEl.textContent = isAdmin
      ? "Authenticate as Administrator for Storefront + /admin Console."
      : "Browse products, build PC rigs, and buy.";
  }
  if (terminalModeCodeEl) {
    terminalModeCodeEl.textContent = isAdmin
      ? "SYS.AUTH // ADMIN CONSOLE PORTAL"
      : "SYS.AUTH // USER SHOPPER PORTAL";
  }
  if (terminalFootRoleEl) {
    terminalFootRoleEl.textContent = isAdmin
      ? "ROLE: ADMIN (CATALOG + /ADMIN CRUD)"
      : "ROLE: SHOPPER (BROWSE & BUY)";
  }
  if (emailFieldLabelEl) {
    emailFieldLabelEl.textContent = isAdmin ? "Administrator Email" : "Shopper Email";
  }
  if (pwFieldLabelEl) {
    pwFieldLabelEl.textContent = isAdmin ? "Admin Passkey" : "Password";
  }
  if (emailEl) {
    emailEl.placeholder = isAdmin ? "harish@voltbox.test" : "alex.chen@gmail.com";
  }
  if (demoBoltIconEl) {
    demoBoltIconEl.textContent = isAdmin ? "🛡️" : "🛍️";
  }
  if (demoBtnTitleEl) {
    demoBtnTitleEl.textContent = isAdmin
      ? "Instant Demo Admin Login (Catalog + /admin)"
      : "Instant Demo User Login (Browse & Buy)";
  }
  if (demoBtnSubEl) {
    demoBtnSubEl.textContent = isAdmin
      ? "harish@voltbox.test · Full Storefront + /admin Dashboard"
      : "alex.chen@gmail.com · Shopper Account (Browse & Buy Only)";
  }
  if (btnLabelEl) {
    btnLabelEl.textContent = isAdmin
      ? "Sign in as Administrator →"
      : "Sign in to Browse & Buy →";
  }
  if (authSwitchRowEl) {
    authSwitchRowEl.hidden = isAdmin;
  }

  pulseSignalTraces();
}

if (roleTabUserEl) {
  roleTabUserEl.addEventListener("click", function () {
    setLoginMode("user");
  });
}
if (roleTabAdminEl) {
  roleTabAdminEl.addEventListener("click", function () {
    setLoginMode("admin");
  });
}

if (compareCardUserEl) {
  compareCardUserEl.addEventListener("click", function (e) {
    if (e.target.closest("button")) return;
    setLoginMode("user");
  });
}
if (compareCardAdminEl) {
  compareCardAdminEl.addEventListener("click", function (e) {
    if (e.target.closest("button")) return;
    setLoginMode("admin");
  });
}

var rcUserGoogleBtnEl   = document.getElementById("rc-user-google-btn");
var rcUserAppleBtnEl    = document.getElementById("rc-user-apple-btn");
var rcUserLoginBtnEl    = document.getElementById("rc-user-login-btn");
var rcAdminConsoleBtnEl = document.getElementById("rc-admin-console-btn");
var rcAdminStoreBtnEl   = document.getElementById("rc-admin-store-btn");

if (rcUserGoogleBtnEl) {
  rcUserGoogleBtnEl.addEventListener("click", function (e) {
    e.stopPropagation();
    setLoginMode("user");
    openOAuthModal("google");
  });
}
if (rcUserAppleBtnEl) {
  rcUserAppleBtnEl.addEventListener("click", function (e) {
    e.stopPropagation();
    setLoginMode("user");
    openOAuthModal("apple");
  });
}
if (rcUserLoginBtnEl) {
  rcUserLoginBtnEl.addEventListener("click", function (e) {
    e.stopPropagation();
    setLoginMode("user");
    emailEl.value = USER_DEMO_EMAIL;
    passEl.value = USER_DEMO_PASS;
    updateTelemetry();
    submitCredentials(USER_DEMO_EMAIL, USER_DEMO_PASS);
  });
}
if (rcAdminConsoleBtnEl) {
  rcAdminConsoleBtnEl.addEventListener("click", function (e) {
    e.stopPropagation();
    setLoginMode("admin");
    var destAdminRadio = document.getElementById("dest-admin-console");
    if (destAdminRadio) destAdminRadio.checked = true;
    emailEl.value = ADMIN_DEMO_EMAIL;
    passEl.value = ADMIN_DEMO_PASS;
    updateTelemetry();
    submitCredentials(ADMIN_DEMO_EMAIL, ADMIN_DEMO_PASS);
  });
}
if (rcAdminStoreBtnEl) {
  rcAdminStoreBtnEl.addEventListener("click", function (e) {
    e.stopPropagation();
    setLoginMode("admin");
    var destStoreRadio = document.getElementById("dest-storefront");
    if (destStoreRadio) destStoreRadio.checked = true;
    emailEl.value = ADMIN_DEMO_EMAIL;
    passEl.value = ADMIN_DEMO_PASS;
    updateTelemetry();
    submitCredentials(ADMIN_DEMO_EMAIL, ADMIN_DEMO_PASS);
  });
}

// Check URL query parameter for ?mode=admin or ?mode=user
(function initFromQuery() {
  var params = new URLSearchParams(window.location.search);
  var requestedMode = params.get("mode");
  if (requestedMode === "admin") {
    setLoginMode("admin");
  } else {
    setLoginMode("user");
  }
})();

// ── Google & Apple OAuth Modal for User Login ──
function openOAuthModal(provider) {
  activeOAuthProvider = provider === "apple" ? "apple" : "google";
  var isApple = activeOAuthProvider === "apple";
  hideError();

  if (oauthModalLogo) {
    oauthModalLogo.innerHTML = isApple ? APPLE_LOGO_SVG : GOOGLE_LOGO_SVG;
  }
  if (oauthModalKicker) {
    oauthModalKicker.textContent = isApple
      ? "APPLE ID // SHOPPER PASSKEY SSO"
      : "GOOGLE IDENTITY // SHOPPER OAUTH 2.0";
  }
  if (oauthModalTitle) {
    oauthModalTitle.textContent = isApple ? "Sign in with Apple" : "Sign in with Google";
  }
  if (oauthModalSubtitle) {
    oauthModalSubtitle.innerHTML = isApple
      ? 'Sign in with your Apple ID to browse and buy on <strong>Voltbox</strong> (Shopper User Account).'
      : 'Choose a Google account to browse and buy on <strong>Voltbox</strong> (Shopper User Account).';
  }
  if (appleRelayBox) {
    appleRelayBox.hidden = !isApple;
  }
  if (oauthEmailLabel) {
    oauthEmailLabel.textContent = isApple ? "Apple ID Email" : "Google Email";
  }
  if (oauthCustomEmail) {
    oauthCustomEmail.placeholder = isApple ? "you@icloud.com" : "you@gmail.com";
    oauthCustomEmail.value = "";
  }
  if (oauthCustomName) {
    oauthCustomName.placeholder = isApple ? "Maya Lin" : "Alex Chen";
    oauthCustomName.value = "";
  }
  if (oauthCustomSubmit) {
    oauthCustomSubmit.textContent = isApple
      ? "Continue with Apple ID →"
      : "Continue with Google →";
  }

  var accounts = isApple ? APPLE_PRESET_ACCOUNTS : GOOGLE_PRESET_ACCOUNTS;
  var html = "";
  for (var i = 0; i < accounts.length; i++) {
    var acc = accounts[i];
    html +=
      '<button type="button" class="oauth-account-item" data-oauth-idx="' + i + '">' +
        '<span class="oauth-acc-avatar" style="background:' + acc.color + '">' + acc.initial + '</span>' +
        '<span class="oauth-acc-info">' +
          '<strong>' + acc.name + '</strong>' +
          '<small>' + acc.email + ' · ' + acc.badge + '</small>' +
        '</span>' +
        '<span class="oauth-acc-arrow">→</span>' +
      '</button>';
  }
  if (oauthAccountList) {
    oauthAccountList.innerHTML = html;
    var items = oauthAccountList.querySelectorAll(".oauth-account-item");
    for (var j = 0; j < items.length; j++) {
      items[j].addEventListener("click", function () {
        var idx = parseInt(this.getAttribute("data-oauth-idx"), 10);
        var chosen = accounts[idx];
        if (chosen) {
          completeSocialSignIn(activeOAuthProvider, chosen.name, chosen.email);
        }
      });
    }
  }

  if (oauthModalOverlay) {
    oauthModalOverlay.classList.add("open");
    oauthModalOverlay.setAttribute("aria-hidden", "false");
  }
}

function closeOAuthModal() {
  if (!oauthModalOverlay) return;
  oauthModalOverlay.classList.remove("open");
  oauthModalOverlay.setAttribute("aria-hidden", "true");
}

function completeSocialSignIn(provider, name, email) {
  var isApple = provider === "apple";
  var hideEmailInput = document.getElementById("apple-hide-email");
  var hideMyEmail = Boolean(isApple && hideEmailInput && hideEmailInput.checked);
  var endpoint = isApple ? "/api/auth/apple" : "/api/auth/google";

  closeOAuthModal();
  setBusy(true);
  pulseSignalTraces();

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name,
      email: email,
      hideMyEmail: hideMyEmail
    })
  })
    .then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, data: data };
      });
    })
    .then(function (result) {
      if (result.ok) {
        rememberUser(result.data, provider);
        window.location.replace("index.html");
      } else {
        setBusy(false);
        showError((result.data && result.data.message) || "Social sign-in didn't work.");
        shake();
      }
    })
    .catch(function () {
      setBusy(false);
      showError("Can't reach the server — is it still running?");
    });
}

if (googleLoginBtnEl) {
  googleLoginBtnEl.addEventListener("click", function () {
    openOAuthModal("google");
  });
}

if (appleLoginBtnEl) {
  appleLoginBtnEl.addEventListener("click", function () {
    openOAuthModal("apple");
  });
}

if (oauthModalClose) {
  oauthModalClose.addEventListener("click", closeOAuthModal);
}

if (oauthModalOverlay) {
  oauthModalOverlay.addEventListener("click", function (e) {
    if (e.target === oauthModalOverlay) closeOAuthModal();
  });
}

if (oauthCustomForm) {
  oauthCustomForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var customName = (oauthCustomName ? oauthCustomName.value : "").trim();
    var customEmail = (oauthCustomEmail ? oauthCustomEmail.value : "").trim();
    if (!customEmail) {
      customEmail = activeOAuthProvider === "apple" ? "maya.lin@icloud.com" : "alex.chen@gmail.com";
    }
    completeSocialSignIn(activeOAuthProvider, customName, customEmail);
  });
}

// ── Interactive Cursor Voltage Spotlight & 3D Card Parallax ──
(function initAmbientMotion() {
  var rafPending = false;
  var mx = window.innerWidth * 0.5;
  var my = window.innerHeight * 0.4;

  window.addEventListener("mousemove", function (e) {
    mx = e.clientX;
    my = e.clientY;
    if (!rafPending) {
      rafPending = true;
      window.requestAnimationFrame(function () {
        document.documentElement.style.setProperty("--mouse-x", mx + "px");
        document.documentElement.style.setProperty("--mouse-y", my + "px");
        if (cardsStageEl) {
          var nx = (mx / Math.max(1, window.innerWidth)) - 0.5;
          var ny = (my / Math.max(1, window.innerHeight)) - 0.5;
          cardsStageEl.style.setProperty("--tilt-x", (nx * 14).toFixed(2) + "px");
          cardsStageEl.style.setProperty("--tilt-y", (ny * 10).toFixed(2) + "px");
        }
        rafPending = false;
      });
    }
  }, { passive: true });

  var canvas = document.getElementById("quantum-bg-canvas");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var w = window.innerWidth, h = window.innerHeight;
    canvas.width = w; canvas.height = h;
    window.addEventListener("resize", function () {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w; canvas.height = h;
    }, { passive: true });
    var pts = [];
    for (var i = 0; i < 26; i++) {
      pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.38, vy: (Math.random() - 0.5) * 0.38 });
    }
    (function loop() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x = (p.x + p.vx + w) % w;
        p.y = (p.y + p.vy + h) % h;
        ctx.fillStyle = "rgba(45, 212, 191, 0.55)";
        ctx.fillRect(p.x - 1, p.y - 1, 2.2, 2.2);
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j];
          var d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 150) {
            ctx.strokeStyle = "rgba(45, 212, 191, " + ((1 - d / 150) * 0.16).toFixed(3) + ")";
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      window.requestAnimationFrame(loop);
    })();
  }
})();

function pulseSignalTraces() {
  if (!document.body) return;
  document.body.classList.remove("signal-burst");
  void document.body.offsetWidth;
  document.body.classList.add("signal-burst");
  setTimeout(function () {
    document.body.classList.remove("signal-burst");
  }, 950);
}

// ── Live Monospace Field Telemetry (KEY_LEN & ID_STATE) ──
function updateFieldTelemetry() {
  var em = (emailEl ? emailEl.value : "").trim();
  var pw = passEl ? passEl.value : "";

  if (emailTelemetryEl) {
    if (!em) {
      emailTelemetryEl.textContent = "ID_STATE: IDLE";
      emailTelemetryEl.className = "field-telemetry";
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      emailTelemetryEl.textContent = "ID_STATE: VALID";
      emailTelemetryEl.className = "field-telemetry active";
    } else {
      emailTelemetryEl.textContent = "ID_STATE: TYPING";
      emailTelemetryEl.className = "field-telemetry warn";
    }
  }

  if (pwTelemetryEl) {
    var len = pw.length;
    var formatted = len < 10 ? "0" + len : String(len);
    pwTelemetryEl.textContent = "KEY_LEN: " + formatted;
    pwTelemetryEl.className = len > 0 ? "field-telemetry active" : "field-telemetry";
  }
}

if (emailEl) emailEl.addEventListener("input", updateFieldTelemetry);
if (passEl) passEl.addEventListener("input", updateFieldTelemetry);

// ── One-Click Demo Account Quick-Fill & Sign-In ──
function fillDemoCredentials() {
  hideError();
  var isAdmin = activeLoginMode === "admin";
  emailEl.value = isAdmin ? ADMIN_DEMO_EMAIL : USER_DEMO_EMAIL;
  passEl.value = isAdmin ? ADMIN_DEMO_PASS : USER_DEMO_PASS;
  updateFieldTelemetry();
  pulseSignalTraces();
}

if (demoFillBtnEl) {
  demoFillBtnEl.addEventListener("click", function () {
    fillDemoCredentials();
    passEl.focus();
  });
}

if (demoLoginBtnEl) {
  demoLoginBtnEl.addEventListener("click", function () {
    fillDemoCredentials();
    var isAdmin = activeLoginMode === "admin";
    submitCredentials(
      isAdmin ? ADMIN_DEMO_EMAIL : USER_DEMO_EMAIL,
      isAdmin ? ADMIN_DEMO_PASS : USER_DEMO_PASS
    );
  });
}

// ── the eyeball: flip the password field between hidden and readable ──
toggleEl.addEventListener("click", function () {
  var hidden = passEl.type === "password";
  passEl.type = hidden ? "text" : "password";
  toggleEl.textContent = hidden ? "hide" : "show";
  passEl.focus();
});

// ── when the form is submitted ──
form.addEventListener("submit", function (event) {
  event.preventDefault();
  hideError();

  var email    = emailEl.value.trim();
  var password = passEl.value;

  if (!email || !password) {
    showError("Type an email and a password first.");
    shake();
    return;
  }

  submitCredentials(email, password);
});

function getAdminRedirectDestination() {
  var adminConsoleRadio = document.getElementById("dest-admin-console");
  if (activeLoginMode === "admin" && adminConsoleRadio && adminConsoleRadio.checked) {
    return "/admin";
  }
  return "index.html";
}

function submitCredentials(email, password) {
  setBusy(true);
  pulseSignalTraces();

  fetch("/api/login", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      email: email,
      password: password,
      loginType: activeLoginMode
    })
  })
    .then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, data: data };
      });
    })
    .then(function (result) {
      if (result.ok) {
        rememberUser(result.data, "password");
        window.location.replace(getAdminRedirectDestination());
      } else {
        setBusy(false);
        showError((result.data && result.data.message) || "Wrong email or password.");
        shake();
      }
    })
    .catch(function () {
      setBusy(false);
      showError("Can't reach the server — is it still running?");
    });
}

function rememberUser(data, provider) {
  sessionStorage.removeItem("voltbox_signed_out");
  localStorage.setItem("voltbox_token", data.token);
  localStorage.setItem("voltbox_user", data.name);
  localStorage.setItem("voltbox_role", data.role || "member");
  localStorage.setItem("voltbox_auth_provider", data.authProvider || provider || "password");
}

function showError(msg) {
  errEl.textContent = msg;
  errEl.hidden = false;
}

function hideError() {
  errEl.hidden = true;
}

function setBusy(busy) {
  btnEl.disabled = busy;
  if (demoLoginBtnEl) demoLoginBtnEl.disabled = busy;
  if (googleLoginBtnEl) googleLoginBtnEl.disabled = busy;
  if (appleLoginBtnEl) appleLoginBtnEl.disabled = busy;
  var defaultLabel = activeLoginMode === "admin"
    ? "Sign in as Administrator →"
    : "Sign in to Browse & Buy →";
  if (btnLabelEl) {
    btnLabelEl.textContent = busy ? "AUTHENTICATING TERMINAL…" : defaultLabel;
  } else {
    btnEl.textContent = busy ? "AUTHENTICATING TERMINAL…" : defaultLabel;
  }
}

function shake() {
  var card = document.querySelector(".login-card");
  if (!card) return;
  card.classList.remove("shake");
  void card.offsetWidth;
  card.classList.add("shake");
}
