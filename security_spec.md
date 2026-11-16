# Voltbox Firestore Security Specification

## 1. Data Invariants
1. **Default-Deny Catch-All**: Every undefined collection/document path is explicitly rejected (`allow read, write: if false;`).
2. **PII Isolation**: User email addresses, billing email addresses, carts, wishlists, and orders live strictly under `/users/{userId}/private/state` and `/users/{userId}/orders/{orderId}`, readable and writable **only** by the authenticated, email-verified owner (`request.auth.uid == userId`) or an administrator. Public display metadata lives separately under `/users/{userId}/public/profile`.
3. **Immutable Ownership & Timestamps**: All created documents bind `ownerId` / `authorId` / `uid` to `request.auth.uid` and require `createdAt == request.time`. Subsequent updates must preserve `createdAt` and `ownerId`/`authorId`/`uid` unchanged and set `updatedAt == request.time`.
4. **Terminal Order Locking**: Once an order reaches `status == 'Delivered'`, non-admin edits are rejected permanently.
5. **Catalog & RBAC Protection**: Only verified administrators (`exists(/databases/$(database)/documents/admins/$(request.auth.uid))` or verified bootstrap admin `harishragavendran56@gmail.com`) may mutate `/products/{productId}` or `/admins/{adminUid}`. Standard shoppers cannot escalate roles or inject ghost fields (`hasOnly` + `hasAll`).
6. **Parent Reference & String Bounds**: Every document ID passes `isValidId()` (`^[a-zA-Z0-9_\-]+$`, `<= 128` chars), and every string/list field enforces strict `.size()` bounds.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Unauthenticated Private Read**: `GET /users/uidA/private/state` with `auth == null` -> **DENIED**.
2. **Cross-User PII Snooping**: `GET /users/uidB/private/state` signed in as `uidA` (non-admin) -> **DENIED**.
3. **Email Spoofing Admin Bypass**: `WRITE /products/prod1` with `auth.token.email == 'harishragavendran56@gmail.com'` and `auth.token.email_verified == false` -> **DENIED**.
4. **Shadow/Ghost Field Injection**: `CREATE /users/uidA/private/state` with `{ ownerId: 'uidA', ..., role: 'admin', isVerified: true }` -> **DENIED** by strict `keys().hasOnly(...)`.
5. **Identity Spoofing on Order Create**: `CREATE /users/uidA/orders/ord1` with `ownerId: 'uidB'` while signed in as `uidA` -> **DENIED**.
6. **Terminal State Mutation**: `UPDATE /users/uidA/orders/ord1` changing `status` from `'Delivered'` back to `'Processing'` as non-admin -> **DENIED**.
7. **Timestamp Forgery**: `CREATE /messages/msg1` with backdated client `createdAt` (`createdAt != request.time`) -> **DENIED**.
8. **ID Poisoning**: `CREATE /users/uidA/orders/..%2F..%2Fadmin..` or 500-char ID -> **DENIED** by `isValidId(orderId)`.
9. **Denial-of-Wallet Oversized Text**: `CREATE /messages/msg1` with 250KB `text` string -> **DENIED** by `text.size() <= 1000`.
10. **Unbounded Array Injection**: `CREATE /users/uidA/private/state` with 500 wishlist entries -> **DENIED** by `wishlist.size() <= 50`.
11. **Orphan Review Creation**: `CREATE /reviews/rev1` referencing a non-existent `productId` (`!exists(/databases/$(database)/documents/products/$(productId))`) -> **DENIED**.
12. **Blanket Collection Scraping**: Unbounded `LIST /users/uidB/orders` signed in as `uidA` -> **DENIED** (`resource.data.ownerId == request.auth.uid`).
