# ⚡ voltbox

A little **community price catalog** for IT and electrical parts, built with
**Spring Boot** (Java) on the back and **plain HTML / CSS / JS** on the front.
No React, no build step for the frontend — just files a browser can read.

Here's the idea. Voltbox ships with **18 starter parts** — one per category,
CPUs through tools — each with an honest price, ready for you to swap in
your own photos. People who actually work in IT can apply to become
**contributors** and add their own listings, so the catalog grows from
there. One founding **moderator** (Harish) approves who gets in and takes
down anything dodgy. Everyone else just browses, adds to a cart, and checks
out with a name, a shipping address, a fake "Pay Now" step, and a retro
paper-style **receipt** they can print, save, or have emailed. Your cart and
every bill are kept on the server, so they're still there tomorrow.

So there are three kinds of people here — **members**, **contributors**, and
the **moderator** — and most of this README is about how that fits together.

---

## table of contents

1. [What you need](#what-you-need)
2. [How to run it](#how-to-run-it)
3. [The login](#the-login)
4. [The community: members, contributors, the moderator](#the-community-members-contributors-the-moderator)
5. [The admin panel (what each role sees)](#the-admin-panel-what-each-role-sees)
6. [Setting up Google sign-in (optional)](#setting-up-google-sign-in-optional)
7. [Setting up bill emails (optional)](#setting-up-bill-emails-optional)
8. [Setting up donations (optional)](#setting-up-donations-optional)
9. [Your account: the panels up top](#your-account-the-panels-up-top)
10. [Checking out: shipping + the fake pay step](#checking-out-shipping--the-fake-pay-step)
11. [Where everything is saved](#where-everything-is-saved)
12. [What each part does](#what-each-part-does)
13. [The files — what lives where](#the-files--what-lives-where)
14. [How it all fits together](#how-it-all-fits-together)
15. [Changing things](#changing-things) — products, the catalog, colours, tax, port
16. [Common gotchas](#common-gotchas)
17. [The short version](#the-short-version)

---

## what you need

Just **Java 17 or newer**. Check what you have:

```bash
java -version
```

If it prints `17`, `21`, `25`, anything 17+, you're good. You do **not** need to
install Maven — the `mvnw` file in this folder downloads and runs it for you.

---

## how to run it

From this folder:

```bash
./mvnw spring-boot:run
```

The first run takes a minute (it downloads the dependencies once). After that
it starts in a second or two. When you see a line like
`Started VoltboxApp`, it's ready.

Now open **http://localhost:8080** in your browser.

To stop the server, press **Ctrl + C** in the terminal.

> On Mac/Linux, if you ever get `permission denied`, run `chmod +x mvnw` once,
> then try again.

---

## the login

The shop is behind a sign-in page. Open the site and you land on it first.

There's a demo account already set up:

```
   email:     harish@voltbox.test
   password:  Harish123
```

But you don't have to use it — there's a **Create an account** link on the
sign-in page. Fill in a name, email, and password and you're straight into
the shop, no separate confirmation step.

To leave, click your avatar in the top-right of the shop — **Sign out** is at
the bottom of the panel that drops down.

### how the login actually works (the honest version)

- **Signing up:** `signup.html` collects a name, email, and password (with a
  little "show" button to peek at the password while typing) and sends them
  to the server at `POST /api/signup`.
- **Signing in:** `login.html` collects an email + password and sends them to
  `POST /api/login`.
- `AuthController.java` does the actual work for both, and hands new accounts
  to `Store.java` to be written into `voltbox-data.json`. That check lives
  **on the server**, so a password never sits inside the browser's JavaScript
  where someone could read it.
- If it succeeds, the server invents a **session token** — a long random
  string like `7268c80c-eff0-4a1b-…` — writes down which account it belongs
  to, and hands it back. The browser keeps it in `localStorage` (rather than
  `sessionStorage`, so closing the tab doesn't sign you out) and shows it on
  every later request:

  ```
  Authorization: Bearer 7268c80c-eff0-4a1b-…
  ```

  That's what proves who you are from then on, so your password is only ever
  sent the once. Because the token is random, knowing somebody's email
  doesn't get you anything — ask for their bills without their token and the
  server just says "You're not signed in."
- **Signing out** tells the server to forget the token (`POST /api/logout`)
  *before* clearing it locally, so a copy of it is dead too.
- If the login fails, the card shakes and shows a red error explaining why.

This is still a **demo-level** auth system — good enough for a friendly
project, not for protecting anything real:

- passwords are stored as **plain text**, not hashed
- tokens **never expire** — they last until you sign out
- everything, tokens included, sits in a file anyone with the laptop can open

A real shop would hash the passwords, expire the tokens, and keep them
somewhere safer. Those shortcuts are on purpose: they keep the whole thing
small enough to read start to finish in one sitting. What *is* solid is the
shape — the server never takes the browser's word for who it is.

Accounts and sessions **survive a restart** — see
[where everything is saved](#where-everything-is-saved).

---

## the community: members, contributors, the moderator

Voltbox isn't only a shop — it's a catalog that a small group of trusted
people keep accurate together. Everyone who signs in is one of three things:

| Role | Who they are | What they can do |
|---|---|---|
| **Member** | anyone who signs up | Browse the catalog, add to cart, check out, print/email bills. And **apply** to become a contributor. |
| **Contributor** | a member who applied and got approved | Everything a member can, **plus** add their own listings and flag listings that break the rules. |
| **Moderator** | just **Harish** — the founding "voltbox head" | Everything a contributor can, **plus** approve/decline applications, grant access directly, and take down any listing. |

A few things worth knowing:

- **There's only ever one moderator.** Harish is created as the moderator on
  the very first run, and you can't sign up as one. Everybody else starts as a
  plain member.
- **Every contributor gets a colour.** It's the same colour as their avatar,
  and it shows up as a little dot on every listing they add — so you can see at
  a glance who posted what. The 18 built-in listings are tagged **"Voltbox"**
  in the shop's yellow.
- **Becoming a contributor** means proving you actually work with this gear:
  you fill in where you work in IT and paste a link to a photo of your work
  ID / badge, and Harish reviews it. (That ID link is just stored as text —
  this is a demo, so treat it as demo-level, not real identity checking.)

### how someone becomes a contributor

```
  a member                         Harish (moderator)
  ────────                         ──────────────────
  opens the shield panel,
  fills in the apply form
  (workplace + ID link)
        │
        └── POST /api/applications ──►  it lands in Harish's "Applications"
                                        queue INSTANTLY — no refresh, because
                                        of the live connection (see below)
                                              │
                                        Harish taps Approve or Decline
                                              │
        the applicant's panel  ◄──────────────┘
        flips on the spot: "you're
        a contributor now" — again,
        no refresh needed
```

Harish can also skip all that and **grant access directly** by typing
someone's email into the "Grant" box — handy for people he already trusts.

### the live connection (how "no refresh" works)

The realtime bits use a **websocket** — a connection the browser opens once and
holds open, so the server can push a message down it the moment something
happens. When a member applies, Harish's queue lights up; when Harish approves,
the member's panel unlocks on the spot. The catalog is live too now — add a
listing or take one down in one tab, and every other open tab (running on the
same localhost server) updates on the spot, no refresh needed. The code is
`CommunitySocket.java` on the server and the bottom of `community.js` in the
browser. It's demo-level too (the token rides in the connection URL, no expiry),
same as the rest.

Approval also shows up on a **plain refresh**, not just live — the page always
re-checks who you are with the server on load. (For that to hold, the `/api/...`
responses must never be cached by the browser; `ApiNoCacheFilter.java` makes
sure of it. Without it there was a real bug where a just-approved contributor
would refresh and still see "application pending" — the browser was handing back
a stale copy of who they were.)

### keeping the catalog clean

Any contributor (and the moderator) can **report** a listing they think breaks
the rules — wrong prices, not actually an IT part, spam. There's a little flag
on the top-right of every product card. Reports land in Harish's **Reports**
queue, where he can either **take the listing down** (it vanishes from the
shop) or **dismiss** the report (nothing wrong with it).

---

## the admin panel (what each role sees)

Up in the top-right there's a **shield button** — that's the community panel,
and it shows something different depending on who you are:

- **A member** sees a short pitch and an **application form** (workplace, a
  link to their work ID, an optional note). Once they've applied, it shows their
  status instead, and flips to contributor tools the moment they're approved.
- **A contributor** sees an **"Add a listing"** form (title, price, category,
  an **image link**, description) and a list of **their own uploads**, each with
  a take-down button. Every listing needs a photo — paste an image link (in a
  search, right-click a picture → *Copy image address*).
- **The moderator** (Harish) sees all of that, plus three queues: **Applications**
  (approve/decline, with the applicant's ID link), **Contributors** (the roster,
  plus the grant-by-email box), and **Reports** (take down / dismiss). A little
  red dot on the shield tells him how many things are waiting.

When a contributor adds a listing, it shows up in the shop **immediately**, with
their colour dot and their name.

---

## setting up google sign-in (optional)

There's a **Sign in with Google** button on the login page, but it starts
out hidden — it needs your own Google OAuth client id before it'll show up.
Takes about five minutes, and nothing else breaks if you skip this.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and
   create a new project (the project picker is top-left → **New Project**).
   Any name is fine.
2. In the left sidebar: **APIs & Services → OAuth consent screen**. Choose
   **External**, fill in an app name and your own email in the required
   fields, and click through the rest with the defaults.
3. **Important — add yourself as a test user**, or Google will block the
   sign-in: a brand new consent screen starts in **"Testing"** mode, which
   only lets accounts you've explicitly listed sign in. Everyone else sees
   "Access blocked: app has not completed verification." Go to **Audience**
   (or **OAuth consent screen → Test users** on older layouts) → **Add
   users** → add your own Google account (and anyone else's who should be
   able to try the button). No need to publish the app to production —
   testing mode is fine for a demo shop.
4. Back in **APIs & Services**, go to **Credentials → Create Credentials →
   OAuth client ID**.
   - Application type: **Web application**
   - Authorized JavaScript origins → **Add URI** → `http://localhost:8080`
   - Leave "Authorized redirect URIs" empty, the button doesn't use it.
5. Click **Create**. Google shows you a **Client ID** — a long string
   ending in `.apps.googleusercontent.com`. Copy it.
6. Paste that same client id in **two places**:
   - `login.js` — the `GOOGLE_CLIENT_ID` constant near the top
   - `application.properties` — the `google.client-id=` line
   - (it needs to live in both: the browser uses it to draw the button,
     and the server uses its own copy to double check the sign-in it gets
     back was actually meant for this app and not someone else's)
7. Restart the server (`Ctrl+C`, then `./mvnw spring-boot:run` again) and
   reload the login page. The button appears under an "or" divider, below
   the regular sign-in form.

> The page has to be loaded as **`http://localhost:8080`**, matching the
> authorized origin exactly (not `127.0.0.1`, not a different port) or
> Google's script will refuse to render the button.

### how it works (the honest version)

- Clicking the button pops open Google's own sign-in flow — that part is
  entirely Google's script (`accounts.google.com/gsi/client`); nothing in
  this repo ever sees your Google password.
- Google hands `login.js` back a signed token (your "credential"), which
  gets sent to `POST /api/google-login`.
- `AuthController.java` asks Google's `tokeninfo` endpoint "is this real,
  and who's it for?", checks the answer matches our client id, then either
  signs you into an existing account with that email or creates a new one
  on the spot — same as `/api/signup`, just without a password to type.
- If `GOOGLE_CLIENT_ID` is never set, the button (and its divider) simply
  never render, and the email/password login works exactly as before.

---

## setting up bill emails (optional)

Every bill has an **Email me this bill** button. Until you do this bit, it
just says "Emailing bills isn't set up on this server yet" — everything
else keeps working.

The shop sends every bill from **one** Gmail account (yours), the way a
real shop sends from a "receipts@..." address. So Gmail needs to let this
app sign in to that account.

> This has **nothing to do with the Google Cloud project** from the sign-in
> section above — different feature, different setup. You don't need one for
> the other.

1. The account you're sending from needs **2-Step Verification** turned on.
   Google won't hand out an app password otherwise.
   [myaccount.google.com/security](https://myaccount.google.com/security) →
   **2-Step Verification** → follow the steps.
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
   Give it a name (`voltbox` is fine) and hit **Create**.
3. Google shows a **16-character password** in a yellow box, like
   `abcd efgh ijkl mnop`. Copy it. You only get to see it once.
4. Open **`application.properties`** and fill in the two TODO lines —
   **type the password without the spaces**, and don't leave a stray space
   at the end of the line:
   ```properties
   voltbox.mail.username=your.address@gmail.com
   voltbox.mail.password=abcdefghijklmnop
   ```
5. Restart the server. Check out, hit **Email me this bill**, and it should
   land in your inbox in a few seconds.

**Use an app password, not your real Gmail password.** A normal password
won't work here (Google blocks it), and an app password can be revoked from
that same page later without changing your actual account password.

### where the bill actually goes

Open the **profile panel** (your avatar, top right) and there's a **Bills by
email** box. Whatever address you put in there is where your bills get sent.
Leave it empty and they go to the email you signed in with. It's per-account,
so two people using the shop each get their own.

---

## setting up donations (optional)

Voltbox is a community project, so there's a **Donate** button up in the
top-left. Clicking it opens a little "support the community" card. You decide
where the Donate button on that card actually goes.

Open **`application.properties`** and set one line:

```properties
voltbox.donate-url=https://ko-fi.com/yourname
```

Use whatever you like — Ko-fi, Buy Me a Coffee, PayPal.me, GitHub Sponsors, a
UPI link, anything. Restart the server and the button will open it in a new tab.

**Leave it blank and nothing breaks** — the card still opens with its friendly
message, the button just says "Donation link coming soon" instead of sending
anyone anywhere. (Voltbox never handles any money itself; it only ever points
at a link you set.)

### adding a UPI QR code (optional)

If you'd rather people scan a QR code and pay you directly through UPI
instead of clicking a link, you can add that too — it shows up in the same
donate card, under the Donate button.

1. Open your bank or payments app (Google Pay, PhonePe, Paytm, your bank's
   own app — anything that shows "my QR code" for receiving payments) and
   save that QR code as an image. Most apps have a "Share" or "Save" button
   right on the QR screen.
2. Put that image file in **`src/main/resources/static/images/donate/`**
   (make the `donate` folder if it isn't there yet) — say you save it as
   `upi-qr.png`.
3. Open **`application.properties`** and fill in both lines:
   ```properties
   voltbox.upi-id=yourname@okhdfcbank
   voltbox.donate-qr=upi-qr.png
   ```
4. Restart the server, open the Donate card, and you'll see your UPI id (with
   a little copy button) and the QR code underneath the Donate button.

**Either one on its own is fine** — set just `voltbox.upi-id` for a
copy-able id with no image, or just `voltbox.donate-qr` for the QR with no id
text underneath. Leave both blank and the card looks exactly like it did
before — this is purely additive to the link above, not a replacement for it.

---

## your account: the panels up top

In the middle of the top bar there's a **search box** — type in it and the shop
filters live to matching parts (it looks at the name, description and category,
so "graphics card", "processor", or "raspberry pi" all work). Clear it to see
everything again. On a phone it drops to its own row so nothing gets cramped.

Three round buttons sit in the top-right of the shop. Each drops a small panel
down underneath them; clicking anywhere else closes it.

**🛡 The shield** — the community panel. What's inside depends on your role;
see [the admin panel](#the-admin-panel-what-each-role-sees).

**🛒 The cart** — a running list of what you've picked, with the same
`− 1 +` steppers as the product cards, the total, and a Checkout button. The
little yellow number on the button is how many items you have.

**Your avatar** — the coloured circle with the first letter of your name in
it. Each account gets its own colour the moment it's created (there are 8,
handed out in order), so two people using the same laptop can tell at a
glance who's signed in — and it's the same colour that tags any listings a
contributor adds. The panel underneath holds:

- your name and email
- **Bills by email** — the address your bills get sent to (above)
- **History** — how many bills you've made. Tap the row and it unfolds into
  the list, newest first. Tap any one of them and the paper receipt opens
  again exactly as it printed the first time.
- **Sign out**

---

## checking out: shipping + the fake pay step

Hitting **Checkout** (from the bottom bar or the cart panel) no longer goes
straight to the receipt. A small modal opens first, asking for:

- **Name** — pre-filled with your account name, editable
- **Shipping address** — a plain text box, one line or a few
- **Card number / expiry / CVV** — a dummy card form, purely for show

Then a **Pay Now** button. Tap it and it shows "Processing…" for a beat, then
a green **"Payment successful"** tick replaces the form for a moment, and
then the receipt slides up.

**There is no real payment processor here, and there never will be** — this
is a demo shop. The card fields don't validate anything real (any digits
work) and, more importantly, **they're never sent anywhere** — not to the
server, not saved in `voltbox-data.json`, nothing. `payNow()` in `app.js`
reads them only to check they're not blank, then throws them away; the
`POST /api/checkout` request only ever carries the name and address. The
only way to fail is leaving a field blank. The server stamps the order with
`paymentMethod: "Fake Pay"` and an `amountPaid` equal to the total, and the
receipt and the emailed bill both print that honestly — no fabricated card
number, no "APPROVED" for a charge that never happened. If you want to wire
in a real payment provider later, `AccountController.checkout()` is the one
place that would need it: it currently just trusts whatever the modal sent
and marks the order paid.

The name + address get printed on the receipt (as "SHIP TO") and included in
the emailed bill, and are frozen onto the order forever — same as the price
of each item, changing your name later doesn't rewrite old bills.

---

## where everything is saved

Everything lives in one file: **`voltbox-data.json`**, sitting next to
`pom.xml` in this folder. Accounts, carts, every bill ever made, and who's
currently signed in.

It's created automatically the first time you start the server, and it's
plain readable JSON — open it in any text editor and you can see the whole
shop:

```json
{
  "nextId" : 2,
  "nextProductId" : 161,
  "users" : [ {
    "id" : 1,
    "name" : "Harish",
    "email" : "harish@voltbox.test",
    "password" : "Harish123",
    "avatarColor" : "#ffd23f",
    "role" : "moderator",
    "billEmail" : null,
    "cart" : { "1" : 2 },
    "orders" : [ ]
  } ],
  "sessions" : {
    "7268c80c-eff0-4a1b-9d3e-1f0a2b3c4d5e" : "harish@voltbox.test"
  },
  "products" : [ /* the 18 built-in listings + anything contributors added */ ],
  "applications" : [ /* people waiting to become contributors */ ],
  "reports" : [ /* flagged listings for the moderator */ ]
}
```

The lists, top to bottom:

- **`users`** — every account, now with a `role` (`member` / `contributor` /
  `moderator`).
- **`sessions`** — the signed-in list: each random token and whose it is. It's
  in the file so a restart doesn't kick everyone out mid-shop. Delete a line and
  that browser gets bounced to the login page next time it asks for anything.
- **`products`** — the whole catalog. The 18 built-ins are seeded from
  `seed-products.json` on first run; contributor posts get appended here.
- **`applications`** and **`reports`** — the contributor applications and the
  moderation reports, so nothing's lost on a restart.

`Store.java` is the only file that touches all this. Every change rewrites the
whole file, which would be a terrible idea for a real site with thousands of
orders and is completely fine for this one.

**Want a clean slate?** Stop the server, delete `voltbox-data.json`, start it
again. You get a fresh file: just Harish (the moderator) and the 18 built-in
listings.

Why a JSON file instead of a real database: a database would mean adding a
schema, a driver, and a persistence layer to a project whose whole point is
that you can read it end to end. A file you can open and understand is the
better trade here.

Two things worth knowing about how bills are stored:

- Each bill keeps **its own copy** of every item's name and price. Change a
  product's price tomorrow and old bills still show what you actually paid.
- Prices and tax are worked out **on the server** at checkout, not in the
  browser, so a bill always matches the real product list.

---

## what each part does

| Part | What it is |
|---|---|
| **Login page** | The front door. Sign in with any account, or use the demo one (`harish@voltbox.test` / `Harish123`). |
| **Signup page** | Create a new account with a name, email, and password — drops you straight in as a member. |
| **Shop** | The catalog — 18 built-in parts plus contributor posts, as cards with a photo (a category tile until a real one's set), a description, a rating, a colour tag showing who added it, and a `−  0  +` picker. |
| **Search** | The box in the middle of the top bar. Type and the grid filters live — matches names, descriptions, and category (so "graphics card" finds the GPUs). |
| **Community panel** | The 🛡 shield button top-right. Apply to contribute (member), add listings (contributor), or run the queues (moderator). |
| **Cart panel** | The 🛒 button top-right. Everything you've picked, with steppers and a Checkout button. Saved on the server, so it's still there next time. |
| **Profile panel** | Your coloured avatar top-right — bill email, bill history, sign out. |
| **Donate** | A button top-left that opens a "support the community" card pointing at a link you set — or a UPI id + QR code, if you set those instead. |
| **Live totals** | The bar at the bottom recomputes subtotal, tax, and total on every tap. |
| **Checkout modal** | Hit **Checkout** and a small card asks for a name, shipping address, and a dummy card number — then **Pay Now** shows a "Payment successful" tick. No real processor behind any of it (see [checking out](#checking-out-shipping--the-fake-pay-step)). |
| **Receipt** | Once you pay, a retro thermal-printer style bill slides up — thumbnail, quantity, line price per item, the shipping address, and what was "paid" — that you can **Print / Save** or have **emailed** to you. |
| **History** | Every bill you've made, kept forever. Reopen any of them from the profile panel. |

---

## the files — what lives where

```
voltbox-java/
│
├── pom.xml                          ← project config (like package.json, but for Java)
├── mvnw                             ← runs Maven without installing it
├── README.md                        ← you are here
├── pull-images.py                   ← refreshes the catalog's product photos from Wikimedia
├── voltbox-data.json                ← EVERYTHING: accounts, catalog, applications, reports. made on first run.
│
├── src/main/java/com/voltbox/
│   ├── VoltboxApp.java              ← the on-switch. starts the server.
│   ├── Store.java                   ← reads/writes voltbox-data.json. the only file that touches it.
│   │                                   ★ CHANGE THE DEMO ACCOUNT / AVATAR COLOURS HERE ★
│   ├── BillMailer.java              ← turns a bill into an email and sends it
│   ├── CommunitySocket.java         ← the live connection (realtime application queue)
│   ├── WebSocketConfig.java         ← one line of plumbing: points /ws/community at the socket
│   ├── ApiNoCacheFilter.java        ← tells the browser never to cache the live /api responses
│   ├── model/
│   │   ├── Product.java             ← a listing (title, price, image, + who added it)
│   │   ├── User.java                ← an account (+ role, cart, bills)
│   │   ├── Order.java               ← one finished bill, with a frozen copy of what was bought
│   │   ├── Application.java         ← someone asking to become a contributor
│   │   └── Report.java              ← a flagged listing
│   └── controller/
│       ├── ProductController.java   ← GET the catalog (reads it from the store now)
│       ├── AuthController.java      ← signup + login + sign out (+ google sign-in)
│       ├── AccountController.java   ← your cart, your bills, emailing them, the donate link
│       └── CommunityController.java ← contribute / apply / approve / moderate — the whole community
│
└── src/main/resources/
    ├── application.properties       ← server settings (port, google id, mail login, donate url)
    ├── seed-products.json           ← the 18 built-in listings   ★ CHANGE THE BUILT-IN CATALOG HERE ★
    └── static/                      ← the website (served automatically at /)
        ├── login.html / login.js    ← the sign-in page ★ GOOGLE_CLIENT_ID is in login.js ★
        ├── signup.html / signup.js  ← the create-account page
        ├── index.html               ← the page structure (shop + the three top-right panels + modals)
        ├── style.css                ← ALL the looks (shop + panels + community + modals + receipt + print)
        ├── app.js                   ← the shop brain (products, cart, panels, checkout, receipt)
        ├── community.js             ← the community brain (admin panel, applications, reports, donate, live socket)
        ├── icons.js                 ← the icon set (inlined Lucide SVGs — no download)
        └── images/
            └── categories/          ← one local .svg tile per category (the instant base image)
```

**About the product images — this bit matters.** Every card shows its **local
category tile first** — those `.svg` files live in the project, so they load
instantly, every time, even with the Wi-Fi off. Then, quietly in the
background, the card tries to load the listing's **real photo** and only swaps
it in once the photo has actually arrived. So you always see a clean, matching
image straight away, and it upgrades to a real photo wherever one loads. **A
card is never blank.**

Why it works this way: an earlier version pointed each card straight at a web
photo, and on a slow or picky connection those requests would just hang —
leaving the cards blank. Loading the tile first fixes that for good.

**Where the built-in photos come from.** The 18 starter listings ship with
their `image` field set to a placeholder — literally the string
`"TODO: paste a real image link here"` — in **`seed-products.json`**. That's
on purpose: the catalog got trimmed down to one item per category as a clean
starting point, and rather than guess which exact product photo you'd want,
each one just shows its category tile until you paste a real link in. Any
`https://…` image URL works — right-click a photo in an image search and
choose *Copy image address*. **Contributor listings** work the same way:
whatever image link a contributor pastes through the Add-a-listing form
upgrades the same way, tile first, real photo once it loads.

If you'd rather have real photos pulled in automatically instead of pasting
them by hand, there's a little helper for that: **`pull-images.py`** in the
project root searches **Wikimedia Commons** (a free, open image library, fast
and reliable worldwide) for each product by name and rewrites the `image`
fields in `seed-products.json` for you:

```bash
python3 pull-images.py     # searches Commons for each product, rewrites the links
rm voltbox-data.json       # so the catalog re-seeds with the new links
./mvnw spring-boot:run
```

It searches Commons by each product's name (so "RTX 4070" gets an RTX 4070)
and happily fills in every TODO placeholder with a real photo — including
falling back to a real photo for the category if a specific model isn't on
Commons. It only ever leaves a listing alone if its `image` is already a real
`upload.wikimedia.org` link, so re-running it later won't clobber photos it
(or you, by hand) already picked.

---

## how it all fits together

A quick tour of one full visit, so the flow makes sense:

```
  browser                         Spring Boot server
  ───────                         ──────────────────
  open localhost:8080
      │
      ▼   (index.html sees you're not signed in,
           bounces you to login.html)
  login.html  ──POST /api/login──►  AuthController  ← checks email + password
      │        ◄─ 200 OK + token ──    against the accounts in Store.java
      ▼        (or "Create an account" → signup.html ──POST /api/signup──► same
      │         controller, adds a new account, then signs you in)
      │
      │   the browser keeps that TOKEN in localStorage. every request below
      │   sends it as "Authorization: Bearer <token>" — that's how the server
      │   knows whose cart and bills to hand over. no token, no answer.
      ▼
  index.html loads, app.js runs
      │
      ├──── GET /api/me ──────────►  AccountController ← name, avatar colour,
      │     ◄─ you + your cart ────                       saved cart, bill count
      │
      ├──── GET /api/products ────►  ProductController ← the catalog, from the store
      │     ◄──── JSON list ───────
      ▼
  app.js draws a card per product; community.js builds the shield panel for
  your role and opens a live websocket (/ws/community)
      │
      │   you tap +/− → totals update instantly in the browser…
      ├──── PUT /api/cart ────────►  AccountController ← …and the cart is written
      │                                                   to voltbox-data.json
      ▼
  Checkout
      │   a little modal asks for a name + shipping address, then a
      │   "Pay Now" button — there's no real payment processor, just an
      │   honest fake pay step (see "the checkout modal" below)
      ├──── POST /api/checkout ───►  AccountController ← freezes the cart into a
      │     ◄──── the bill ────────                       bill, empties the cart
      ▼
  app.js prints that bill on paper  →  Print / Save
      │
      ├──── POST /api/orders/{id}/email ──►  BillMailer ← sends it to your inbox

  meanwhile, the community side:
      apply / add a listing / report ──►  CommunityController ← checks your role,
                                                                then updates the store
      new application / report ──────────►  CommunitySocket ── pushes it live to
                                                               the moderator's panel

  Sign out ──POST /api/logout──►  AuthController ← deletes the token, so a
                                                   copy of it stops working
```

The important idea: **the browser is the fast bit, the server is the honest
bit.** Tapping `+` updates the total on screen instantly with no waiting —
but the cart is mirrored to the server a moment later, and the *prices on
the actual bill* are worked out server-side at checkout. Same with the
community side: the server, not the browser, decides whether you're allowed
to add a listing or approve someone. So the shop feels snappy, and nothing
important takes the browser's word for it.

---

## changing things

Everything below is meant to be edited. Save the file, then:
- changed a **Java** file (`.java`)? → restart the server (`Ctrl+C`, run again)
- changed **HTML / CSS / JS** or an **image**? → just refresh the browser

### …add a listing (the easy way — no code)

Sign in as a **contributor** (or as Harish), open the **shield panel**, and use
the **Add a listing** form: title, price, category, an **image link**, and a
description. Hit **Add listing** and it's in the shop straight away. This is how
listings are meant to be added day to day — no files, no restart.

The image link is required — paste a real photo of the part. Easiest way: find
the part in an image search, right-click the picture, and choose *Copy image
address*. Any `https://…` image URL works.

### …the 18 built-in listings

These live in **`src/main/resources/seed-products.json`** — one JSON object per
product:

```json
{
  "title": "AMD Ryzen 5 5600",
  "price": 129.99,
  "description": "6-core AM4 workhorse, still the value pick for a budget build.",
  "category": "cpus",
  "image": "TODO: paste a real image link here",
  "ratingRate": 4.6,
  "ratingCount": 21
}
```

`image` starts out as that TODO placeholder on every one of the 18 starter
listings — the shop just shows the category tile for it until you paste a
real link in, same as any contributor listing without a photo yet. Paste a
direct image URL by hand (right-click a photo in an image search → *Copy
image address*), or run **`pull-images.py`** to have it search **Wikimedia
Commons** (`upload.wikimedia.org` — fast and reliable worldwide) and fill in
every TODO placeholder automatically (see
[the images section](#the-files--what-lives-where)).

Add, edit, or delete entries. The catalog is only **seeded from this file on a
fresh start**, so to see your changes: stop the server, delete
`voltbox-data.json`, and start again. (Everyday additions should go through the
Add-a-listing form above instead — those stick around without a reseed.)

The `category` should match one of the tile names in
`static/images/categories/` (`cpus`, `gpus`, `storage`, `networking`, …) so the
image lines up.

### …the demo account (Harish, the moderator)

The moderator account is created on the first run, in **`Store.java`**:

```java
User harish = add("Harish", "harish@voltbox.test", "Harish123");
harish.setRole("moderator");
```

Change those values there. **This only runs when there's no `voltbox-data.json`
yet** — so to see your change, stop the server, delete that file, and start
again. There's only ever one moderator; everyone else signs up as a member and
gets promoted to contributor by Harish.

### …someone's avatar colour

Also **`Store.java`**, the `COLORS` list near the top. New accounts get the
next colour in the list, cycling round. It's also the colour their listings are
tagged with. Changing the list only affects accounts made *after* the change —
an existing one keeps whatever colour it was given (it's saved in
`voltbox-data.json`, and you can edit it there by hand if you want).

### …the demo account (or adding more built-in accounts)

The demo account is created the first time the server runs, in
**`Store.java`**:

```java
private void seed() {
    users = new ArrayList<>();
    sessions = new LinkedHashMap<>();
    nextId = 1;
    add("Harish", "harish@voltbox.test", "Harish123");
}
```

Change those values, or add more `add(...)` lines. **This only runs when
there's no `voltbox-data.json` yet** — so to see your change, stop the
server, delete that file, and start again.

Already-running shop and you just want another account? Simplest is to sign
up for it from `signup.html`. Accounts made that way stick around now.

### …someone's avatar colour

Also **`Store.java`**, the `COLORS` list near the top. New accounts get the
next colour in the list, cycling round. Changing the list only affects
accounts made *after* the change — an existing one keeps whatever colour it
was given (it's saved in `voltbox-data.json`, and you can edit it there by
hand if you want).

### …the colours / look

Open **`style.css`**. The whole palette lives at the very top as variables —
change a hex code, save, refresh, and it ripples through the entire app:

```css
:root {
  /* the base */
  --bg: #0f1115;              /* page background */
  --card: #181b22;            /* card background */
  --card-hover: #1e2129;      /* card background on hover */
  --line: #262a33;            /* borders and dividers */
  --text: #e7e9ee;            /* main text */
  --muted: #9aa1ad;           /* dimmed text */

  /* the accent — teal running into violet wherever there's a gradient
     (buttons, the logo, the badge) */
  --accent: #2dd4bf;
  --accent-2: #7c6cf6;
  --accent-glow: rgba(45, 212, 191, 0.14);   /* the soft glow on hover */
  --accent-ink: #0b201d;                     /* text drawn ON TOP of the accent */

  /* status colours */
  --danger: #ff6b6b;      /* errors, "take down", declines */
  --danger-light: #ff8787; /* a lighter shade, used on dark report badges */
  --success: #51cf66;     /* approvals */

  /* the donate button/badge gradient — kept as its own pair on purpose, so
     "support the project" reads as a distinct thing from the main accent */
  --donate-1: #ff6b9d;
  --donate-2: #ff922b;
}
```

Every one of these is used somewhere real: the accent shows up on the login
page, hover states, the checkout button, and the receipt; the status colours
drive every error message and the moderator's approve/decline buttons; the
donate pair is only the donate button and card. Changing `--accent` and
`--accent-2` alone gets you a whole new "brand colour" with no other edits
needed — everything else is semantic and usually doesn't need to move with
it. (The receipt paper itself is deliberately its own warm, off-white
thermal-paper look, separate from this dark palette — that one lives inline
in the `.receipt-paper`/`.r-*` rules further down `style.css`, since a
receipt is meant to look like paper, not match the site around it.)

### …the tax rate

This one lives in **three** places and they need to agree, because the
browser shows you a running total while the server works out the real one
for the bill:

```js
// app.js — the total you watch add up as you tap
var TAX_RATE = 0.0825;  // 8.25 %
```
```java
// AccountController.java — what actually gets charged on the bill
private static final double TAX_RATE = 0.0825;
```

Change both numbers, then fix the label in **`index.html`** (search for
`Tax (8.25%)`). Restart the server and refresh.

> Get them out of step and nothing crashes — the bottom bar just quietly
> disagrees with the printed bill, which is a confusing bug to chase. The
> server's number is the one that counts.

### …the shop name on the receipt

Open **`app.js`**, near the top there's a little `STORE` block:

```js
var STORE = {
  name:    "VOLTBOX",
  tagline: "ELECTRONICS & GADGETS",
  address: "42 Circuit Lane, Silicon Bay",
  phone:   "(555) 010-VOLT",
};
```

Edit those strings, save, refresh, and open a receipt to see it.

### …the port

Open **`application.properties`**:

```properties
server.port=8080
```

Change `8080` to anything free (`3000`, `9090`, …), restart, and use that
number in the browser instead.

---

## common gotchas

| problem | fix |
|---|---|
| `./mvnw: permission denied` | run `chmod +x mvnw` once |
| `port 8080 already in use` | stop whatever else is on 8080, or change the port (above) |
| login says "Wrong email or password" | double check the email, or use the demo account — `harish@voltbox.test` / `Harish123` |
| signup says "An account with that email already exists" | that email is already signed up — sign in instead, or use a different email |
| I want to wipe all the accounts and start over | stop the server, delete `voltbox-data.json`, start it again |
| server won't start: "couldn't read voltbox-data.json" | the file got hand-edited into invalid JSON — fix the syntax, or delete the file to start fresh |
| my cart emptied itself | you checked out — that turns the cart into a bill. it's in your History. |
| "You're not signed in", or I keep getting bounced to the login page | your session token isn't recognised — usually because `voltbox-data.json` was deleted or its `sessions` entry was removed. Just sign in again. |
| I want to kick everyone out | stop the server, empty the `"sessions"` block in `voltbox-data.json` to `{}`, start again |
| "Can't reach the server" on the login/signup page | the server isn't running — start it with `./mvnw spring-boot:run` |
| a card shows the category tile for a second before the photo | that's normal — the tile shows instantly and the real photo swaps in a moment later once it's downloaded. On a slow connection a few may stay on the tile, which is fine (never blank). |
| I want to refresh all the product photos | run `python3 pull-images.py`, then delete `voltbox-data.json` and restart so the catalog re-seeds |
| "Add an image link for the listing" | uploads now require a photo — paste an image link (in a search, right-click a picture → *Copy image address*) |
| changed a `.java` file, nothing happened | Java changes need a server **restart**. Only HTML/CSS/JS/images update on a plain refresh. |
| the receipt looks plain when printed | that's expected — printing strips the page down to just the paper on white, which is the point |
| the Google button never shows up on the login page | you haven't set `GOOGLE_CLIENT_ID` in `login.js` yet — see [setting up google sign-in](#setting-up-google-sign-in-optional) |
| Google sign-in says "isn't set up on this server yet" | `login.js` has a client id but `application.properties`' `google.client-id=` is still blank — set both, then restart the server |
| Google sign-in says "wasn't meant for this app" | the client id in `login.js` and `application.properties` don't match each other (or don't match the one Google gave you) |
| Google says "Access blocked: app has not completed verification" | your consent screen is in Testing mode and that account isn't on the test users list — add it under **Audience → Test users** in Google Cloud Console |
| the Google button doesn't render / console shows an origin error | the page must be loaded as `http://localhost:8080` exactly — that's what has to match the "Authorized JavaScript origins" you set up in Google Cloud |
| "Emailing bills isn't set up on this server yet" | the two `voltbox.mail.*` lines in `application.properties` are still blank — see [setting up bill emails](#setting-up-bill-emails-optional) |
| "Couldn't send it — check the mail settings" | usually the wrong password: it has to be a 16-character **app password**, not your normal Gmail one. also check the username is the full address. |
| the bill email never arrives | check spam, and check you're looking at the address in **Bills by email** in the profile panel (it defaults to your login email) |
| the bottom bar total doesn't match the printed bill | the tax rate is out of step between `app.js` and `AccountController.java` — see [the tax rate](#the-tax-rate) |
| the shield panel just shows an apply form | you're a **member** — that's the right view. Apply, and Harish approves you into contributor tools. |
| I approved someone but their screen didn't change | it should update live over the websocket; a plain refresh always catches them up too (the app re-checks their role with the server on every load — the live `/api` data is never cached) |
| a new application didn't pop up for Harish | the live connection dropped — it reconnects on its own after a few seconds, or refresh. Applications are never lost; they're in the queue on next load. |
| "Only contributors can add listings" | you're signed in as a plain member — you need to be approved (or granted) first |
| the Donate button says "coming soon" | you haven't set `voltbox.donate-url` in `application.properties` yet — see [setting up donations](#setting-up-donations-optional) |
| I took a listing down by mistake | it's not deleted — find it in `voltbox-data.json` under `products` and set its `"takenDown"` back to `false` |

---

## the short version

```bash
./mvnw spring-boot:run          # start
# open http://localhost:8080    # sign in, or create an account
# Ctrl + C                      # stop
```

- add a listing day-to-day → the **Add a listing** form in the shield panel (no code)
- edit the 18 built-in listings → **`seed-products.json`** (then delete `voltbox-data.json` to reseed)
- edit the catalog endpoint → **`ProductController.java`**
- edit login / signup / sign out → **`AuthController.java`**
- edit the moderator account, avatar colours, saving → **`Store.java`**
- edit carts, checkout, bill history, the donate link → **`AccountController.java`**
- edit contribute / apply / approve / moderate → **`CommunityController.java`**
- edit the live realtime connection → **`CommunitySocket.java`**
- edit what the bill email looks like → **`BillMailer.java`**
- edit the look → **`style.css`**
- edit the shop (cart, checkout, receipt) → **`app.js`**
- edit the community UI (panels, applications, reports, donate) → **`community.js`**
- edit the icons → **`icons.js`**
- edit page structure → **`index.html`** / **`login.html`** / **`signup.html`**
- turn on Google sign-in → **`login.js`** + **`application.properties`**
- turn on bill emails → **`application.properties`**
- set the donation link → **`application.properties`**
- wipe everything and start over → delete **`voltbox-data.json`**
