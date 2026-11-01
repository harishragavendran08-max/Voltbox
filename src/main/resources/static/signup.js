var form             = document.getElementById("signup-form");
var nameEl           = document.getElementById("name");
var emailEl          = document.getElementById("email");
var passEl           = document.getElementById("password");
var errEl            = document.getElementById("signup-error");
var btnEl            = document.getElementById("signup-btn");
var btnLabelEl       = document.getElementById("signup-btn-label");
var toggleEl         = document.getElementById("toggle-pw");
var nameTelemetryEl  = document.getElementById("name-telemetry");
var emailTelemetryEl = document.getElementById("email-telemetry");
var pwTelemetryEl    = document.getElementById("pw-telemetry");
var pwMeterEl        = document.getElementById("pw-strength-meter");
var cardsStageEl     = document.getElementById("showcase-cards-stage");

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

// ── Live Field Telemetry & 4-Bar Passkey Strength Meter ──
function updateSignupTelemetry() {
  var nm = (nameEl ? nameEl.value : "").trim();
  var em = (emailEl ? emailEl.value : "").trim();
  var pw = passEl ? passEl.value : "";

  if (nameTelemetryEl) {
    nameTelemetryEl.textContent = nm ? ("HANDLE: " + nm.toUpperCase().slice(0, 10)) : "HANDLE: IDLE";
    nameTelemetryEl.className = nm ? "field-telemetry active" : "field-telemetry";
  }

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

  var len = pw.length;
  var score = 0;
  if (len >= 4) score++;
  if (len >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]|[^A-Za-z0-9]/.test(pw)) score++;
  var clampedScore = len === 0 ? 0 : Math.max(1, Math.min(4, score));
  var labels = ["IDLE", "WEAK", "FAIR", "GOOD", "STRONG"];
  var label = labels[clampedScore];

  if (pwTelemetryEl) {
    var lenStr = len < 10 ? "0" + len : String(len);
    pwTelemetryEl.textContent = "KEY_LEN: " + lenStr + " · " + label;
    pwTelemetryEl.className = clampedScore >= 3 ? "field-telemetry active" : (clampedScore > 0 ? "field-telemetry warn" : "field-telemetry");
  }

  if (pwMeterEl) {
    pwMeterEl.setAttribute("data-score", String(clampedScore));
    var bars = pwMeterEl.querySelectorAll(".pw-bar");
    for (var i = 0; i < bars.length; i++) {
      bars[i].classList.toggle("lit", i < clampedScore);
    }
  }
}

if (nameEl) nameEl.addEventListener("input", updateSignupTelemetry);
if (emailEl) emailEl.addEventListener("input", updateSignupTelemetry);
if (passEl) passEl.addEventListener("input", updateSignupTelemetry);

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

  var name     = nameEl.value.trim();
  var email    = emailEl.value.trim();
  var password = passEl.value;

  if (!name || !email || !password) {
    showError("Fill in your name, email, and a password first.");
    shake();
    return;
  }

  setBusy(true);
  pulseSignalTraces();

  fetch("/api/signup", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ name: name, email: email, password: password })
  })
    .then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, data: data };
      });
    })
    .then(function (result) {
      if (result.ok) {
        sessionStorage.removeItem("voltbox_signed_out");
        localStorage.setItem("voltbox_token", result.data.token);
        localStorage.setItem("voltbox_user", result.data.name || name);
        window.location.replace("index.html");
      } else {
        setBusy(false);
        showError((result.data && result.data.message) || "Couldn't create that account.");
        shake();
      }
    })
    .catch(function () {
      setBusy(false);
      showError("Can't reach the server — is it still running?");
    });
});

function showError(msg) {
  errEl.textContent = msg;
  errEl.hidden = false;
}

function hideError() {
  errEl.hidden = true;
}

function setBusy(busy) {
  btnEl.disabled = busy;
  if (btnLabelEl) {
    btnLabelEl.textContent = busy ? "PROVISIONING OPERATOR…" : "Provision Account →";
  } else {
    btnEl.textContent = busy ? "PROVISIONING OPERATOR…" : "Provision Account →";
  }
}

function shake() {
  var card = document.querySelector(".login-card");
  if (!card) return;
  card.classList.remove("shake");
  void card.offsetWidth;
  card.classList.add("shake");
}

var signupGoogleBtn = document.getElementById("signup-google-btn");
var signupAppleBtn  = document.getElementById("signup-apple-btn");

function socialSignup(provider) {
  hideError();
  setBusy(true);
  pulseSignalTraces();
  var isApple = provider === "apple";
  var nm = (nameEl && nameEl.value.trim()) || (isApple ? "Maya Lin" : "Alex Chen");
  var em = (emailEl && emailEl.value.trim()) || (isApple ? "maya.lin@icloud.com" : "alex.chen@gmail.com");

  fetch(isApple ? "/api/auth/apple" : "/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: nm, email: em })
  })
    .then(function (r) {
      return r.json().then(function (data) { return { ok: r.ok, data: data }; });
    })
    .then(function (res) {
      if (res.ok) {
        sessionStorage.removeItem("voltbox_signed_out");
        localStorage.setItem("voltbox_token", res.data.token);
        localStorage.setItem("voltbox_user", res.data.name || nm);
        localStorage.setItem("voltbox_role", res.data.role || "member");
        localStorage.setItem("voltbox_auth_provider", provider);
        window.location.replace("index.html");
      } else {
        setBusy(false);
        showError((res.data && res.data.message) || "Social sign-in failed.");
      }
    })
    .catch(function () {
      setBusy(false);
      showError("Can't reach the server — is it still running?");
    });
}

if (signupGoogleBtn) {
  signupGoogleBtn.addEventListener("click", function () {
    socialSignup("google");
  });
}

if (signupAppleBtn) {
  signupAppleBtn.addEventListener("click", function () {
    socialSignup("apple");
  });
}
