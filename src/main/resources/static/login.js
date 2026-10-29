
var form     = document.getElementById("login-form");
var emailEl  = document.getElementById("email");
var passEl   = document.getElementById("password");
var errEl    = document.getElementById("login-error");
var btnEl    = document.getElementById("login-btn");
var toggleEl = document.getElementById("toggle-pw");

var googleDividerEl = document.getElementById("google-divider");
var googleButtonEl  = document.getElementById("google-signin-button");


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

function handleGoogleCredential(response) {
  hideError();
  setBusy(true);

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
  event.preventDefault();          // don't let the browser reload the page
  hideError();

  var email    = emailEl.value.trim();
  var password = passEl.value;

  if (!email || !password) {
    showError("Type an email and a password first.");
    return;
  }

  // lock the button so a double-tap can't fire two logins
  setBusy(true);

  fetch("/api/login", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email: email, password: password })
  })
    .then(function (res) {
      // res.ok is true for 200, false for the 401 we send on a bad password
      return res.json().then(function (data) {
        return { ok: res.ok, data: data };
      });
    })
    .then(function (result) {
      if (result.ok) {
        // success! the server gave us a session token — that's the important
        // bit, it's what the shop shows on every later request to prove who
        // it is. localStorage, so closing the tab doesn't sign you out.
        rememberUser(result.data);
        // …and head to the shop.
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
});


function rememberUser(data) {
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
  btnEl.textContent = busy ? "Signing in…" : "Sign in";
}

// a quick shake of the card when the login is wrong — feels responsive
function shake() {
  var card = document.querySelector(".login-card");
  card.classList.remove("shake");
  void card.offsetWidth;           // force reflow so the animation restarts
  card.classList.add("shake");
}
