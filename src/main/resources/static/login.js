var form             = document.getElementById("login-form");
var emailEl          = document.getElementById("email");
var passEl           = document.getElementById("password");
var errEl            = document.getElementById("login-error");
var btnEl            = document.getElementById("login-btn");
var btnLabelEl       = document.getElementById("login-btn-label");
var toggleEl         = document.getElementById("toggle-pw");
var emailTelemetryEl = document.getElementById("email-telemetry");
var pwTelemetryEl    = document.getElementById("pw-telemetry");
var demoLoginBtnEl   = document.getElementById("demo-login-btn");
var demoFillBtnEl    = document.getElementById("demo-fill-btn");
var cardsStageEl     = document.getElementById("showcase-cards-stage");

var googleDividerEl = document.getElementById("google-divider");
var googleButtonEl  = document.getElementById("google-signin-button");

var DEMO_EMAIL = "harish@voltbox.test";
var DEMO_PASS  = "Harish123";

var GOOGLE_CLIENT_ID = "8853303342-j5l5dnn3okihtcifetfo1d0prg56ugu9.apps.googleusercontent.com";

window.addEventListener("load", function () {
  if (!GOOGLE_CLIENT_ID || !window.google) return;

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback:  handleGoogleCredential
  });
  google.accounts.id.renderButton(googleButtonEl, {
    theme: "filled_black",
    size:  "large",
    shape: "pill",
    width: 316
  });
  googleDividerEl.hidden = false;
  googleButtonEl.hidden = false;
});

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
  emailEl.value = DEMO_EMAIL;
  passEl.value = DEMO_PASS;
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
    submitCredentials(DEMO_EMAIL, DEMO_PASS);
  });
}

function handleGoogleCredential(response) {
  hideError();
  setBusy(true);
  pulseSignalTraces();

  fetch("/api/google-login", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ credential: response.credential })
  })
    .then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, data: data };
      });
    })
    .then(function (result) {
      if (result.ok) {
        rememberUser(result.data);
        window.location.replace("index.html");
      } else {
        setBusy(false);
        showError((result.data && result.data.message) || "Google sign-in didn't work.");
        shake();
      }
    })
    .catch(function () {
      setBusy(false);
      showError("Can't reach the server — is it still running?");
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

function submitCredentials(email, password) {
  setBusy(true);
  pulseSignalTraces();

  fetch("/api/login", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email: email, password: password })
  })
    .then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, data: data };
      });
    })
    .then(function (result) {
      if (result.ok) {
        rememberUser(result.data);
        window.location.replace("index.html");
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

function rememberUser(data) {
  sessionStorage.removeItem("voltbox_signed_out");
  localStorage.setItem("voltbox_token", data.token);
  localStorage.setItem("voltbox_user", data.name);
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
  if (btnLabelEl) {
    btnLabelEl.textContent = busy ? "AUTHENTICATING TERMINAL…" : "Sign in to Bench →";
  } else {
    btnEl.textContent = busy ? "AUTHENTICATING TERMINAL…" : "Sign in to Bench →";
  }
}

function shake() {
  var card = document.querySelector(".login-card");
  if (!card) return;
  card.classList.remove("shake");
  void card.offsetWidth;
  card.classList.add("shake");
}
