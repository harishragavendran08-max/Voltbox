
var form     = document.getElementById("signup-form");
var nameEl   = document.getElementById("name");
var emailEl  = document.getElementById("email");
var passEl   = document.getElementById("password");
var errEl    = document.getElementById("signup-error");
var btnEl    = document.getElementById("signup-btn");
var toggleEl = document.getElementById("toggle-pw");


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

  var name     = nameEl.value.trim();
  var email    = emailEl.value.trim();
  var password = passEl.value;

  if (!name || !email || !password) {
    showError("Fill in your name, email, and a password first.");
    return;
  }

  // lock the button so a double-tap can't fire two signups
  setBusy(true);

  fetch("/api/signup", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ name: name, email: email, password: password })
  })
    .then(function (res) {
      // res.ok is true for 200, false for the 400 we send on a bad signup
      return res.json().then(function (data) {
        return { ok: res.ok, data: data };
      });
    })
    .then(function (result) {
      if (result.ok) {
    
        localStorage.setItem("voltbox_token", result.data.token);
        localStorage.setItem("voltbox_user", result.data.name || name);
        // …and head straight into the shop.
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


// ── little helpers ──

function showError(msg) {
  errEl.textContent = msg;
  errEl.hidden = false;
}

function hideError() {
  errEl.hidden = true;
}

function setBusy(busy) {
  btnEl.disabled = busy;
  btnEl.textContent = busy ? "Creating account…" : "Create account";
}

// a quick shake of the card when the signup is rejected — feels responsive
function shake() {
  var card = document.querySelector(".login-card");
  card.classList.remove("shake");
  void card.offsetWidth;           // force reflow so the animation restarts
  card.classList.add("shake");
}
