# EyeGlaze Migration Audit — Next.js (web/src) → React (Vite) + Express

> Purpose: ground-truth inventory of what exists TODAY in `web/src`, to be used by the Planner agent
> to scope the migration to a split React (Vite) frontend + standalone Express API backend.
> Flutter mobile (`mobile/`) stays as-is except for its base URL / API contract, which must be replicated exactly by Express.
>
> **Note:** `docs/knowledge_base.md` describes a larger/aspirational API surface (e.g. `/api/wishlist`,
> `/api/reviews`, `/api/admin/coupons`, `/api/admin/prescriptions/verify`, `/api/admin/orders/[id]/tracking`,
> `/api/admin/orders/[id]/refund`, `/api/admin/orders/[id]/notes`). Those routes **do not exist in code**.
> This document reflects only what is actually implemented in `web/src` as of 2026-06-16. Treat the
> knowledge_base.md routes as a backlog/spec, not current reality.

---

## 1. Inventory of Existing Pages (web/src/app)

### Top-level
| File | Route | Notes |
|---|---|---|
| `app/page.tsx` | `/` | Landing/home page |
| `app/login/page.tsx` | `/login` | Mobile/email entry, triggers send-otp |
| `app/login/otp/page.tsx` | `/login/otp` | OTP verification screen |
| `app/layout.tsx` | root layout | — |

### `(user)` route group — `app/(user)/layout.tsx` wraps these
| File | Route | Notes |
|---|---|---|
| `app/(user)/layout.tsx` | — | Layout wrapper (user-facing) |
| `app/(user)/products/page.tsx` | `/products` | Product listing |
| `app/(user)/products/ProductFilters.tsx` | (component, not a route) | Filter UI used on listing page |
| `app/(user)/products/[id]/page.tsx` | `/products/[id]` | Product detail |
| `app/(user)/products/[id]/AddToCartButton.tsx` | (component, not a route) | Add-to-cart button used on detail page |
| `app/(user)/cart/page.tsx` | `/cart` | Cart screen |
| `app/(user)/orders/page.tsx` | `/orders` | User's order list |
| `app/(user)/account/page.tsx` | `/account` | Profile/account screen |

### `(admin)` route group — `app/(admin)/layout.tsx` wraps these
| File | Route | Notes |
|---|---|---|
| `app/(admin)/layout.tsx` | — | Admin layout wrapper |
| `app/(admin)/admin/dashboard/page.tsx` | `/admin/dashboard` | KPI dashboard |
| `app/(admin)/admin/products/page.tsx` | `/admin/products` | Product management |
| `app/(admin)/admin/orders/page.tsx` | `/admin/orders` | Order management |
| `app/(admin)/admin/inventory/page.tsx` | `/admin/inventory` | Inventory/stock view |
| `app/(admin)/admin/users/page.tsx` | `/admin/users` | Customer list |

**Total real pages: 11 routes** (4 user-facing static/dynamic, 5 admin, login + login/otp, plus `/`).

**No** `/admin/login` page exists separately — admin and regular users share `/login` and `/login/otp`; role is determined server-side from the User doc (`role` field), not a separate admin auth screen. This differs from `flow.md` §7.1 which assumes a distinct admin email+password+2FA login — that is **not implemented**; admin login is the same OTP flow as users.

**Migration implication for React/Vite:** these become React Router routes. Route groups `(user)` and `(admin)` become layout components (`<UserLayout>`, `<AdminLayout>`) wrapping nested routes — straightforward 1:1 port since no Next-specific data-fetching (no `getServerSideProps`/RSC server components beyond what's visible) blocks the move. Need to verify each `page.tsx` for `"use client"` vs server-only logic during implementation (out of scope for this audit — flag for Planner to check per-file during conversion).

---

## 2. Inventory of Existing API Routes (web/src/app/api) — exact methods

Base path in Next.js: `/api/...`. These must become Express routes (likely same paths, mounted under `/api` in Express, so Flutter/React clients need no path changes — only host/port changes).

| Method | Path | File | Auth (per middleware.ts / in-handler) |
|---|---|---|---|
| POST | `/api/auth/send-otp` | `app/api/auth/send-otp/route.ts` | None |
| POST | `/api/auth/verify-otp` | `app/api/auth/verify-otp/route.ts` | None |
| POST | `/api/auth/logout` | `app/api/auth/logout/route.ts` | None (clears cookie) |
| GET | `/api/auth/me` | `app/api/auth/me/route.ts` | Reads cookie, returns current user or null |
| GET | `/api/products` | `app/api/products/route.ts` | None |
| POST | `/api/products` | `app/api/products/route.ts` | None at middleware level (not under `/api/admin`, not in protected list — **verify in-handler check; likely a gap, see §6**) |
| GET | `/api/products/[id]` | `app/api/products/[id]/route.ts` | None |
| PUT | `/api/products/[id]` | `app/api/products/[id]/route.ts` | Same gap as above — not covered by middleware matcher |
| DELETE | `/api/products/[id]` | `app/api/products/[id]/route.ts` | Same gap |
| GET | `/api/lens-options` | `app/api/lens-options/route.ts` | None |
| POST | `/api/lens-options` | `app/api/lens-options/route.ts` | None (same gap pattern) |
| GET | `/api/users` | `app/api/users/route.ts` | None at middleware level (not `/api/admin/users` — separate top-level route not in protected matcher) |
| GET | `/api/cart` | `app/api/cart/route.ts` | Yes — middleware requires logged-in role |
| POST | `/api/cart` | `app/api/cart/route.ts` | Yes |
| PUT | `/api/cart/[itemId]` | `app/api/cart/[itemId]/route.ts` | Yes |
| DELETE | `/api/cart/[itemId]` | `app/api/cart/[itemId]/route.ts` | Yes |
| POST | `/api/cart/apply-coupon` | `app/api/cart/apply-coupon/route.ts` | Yes (under `/api/cart`) |
| GET | `/api/orders` | `app/api/orders/route.ts` | Yes |
| POST | `/api/orders` | `app/api/orders/route.ts` | Yes |
| GET | `/api/orders/[id]` | `app/api/orders/[id]/route.ts` | Yes |
| POST | `/api/prescriptions` | `app/api/prescriptions/route.ts` | Yes |
| GET | `/api/prescriptions` | `app/api/prescriptions/route.ts` | Yes |
| POST | `/api/coupons/validate` | `app/api/coupons/validate/route.ts` | Yes |
| GET | `/api/admin/products` | `app/api/admin/products/route.ts` | Yes — admin role required |
| POST | `/api/admin/products` | `app/api/admin/products/route.ts` | Yes — admin |
| GET | `/api/admin/products/[id]` | `app/api/admin/products/[id]/route.ts` | Yes — admin |
| PUT | `/api/admin/products/[id]` | `app/api/admin/products/[id]/route.ts` | Yes — admin |
| DELETE | `/api/admin/products/[id]` | `app/api/admin/products/[id]/route.ts` | Yes — admin |
| GET | `/api/admin/inventory` | `app/api/admin/inventory/route.ts` | Yes — admin |
| GET | `/api/admin/users` | `app/api/admin/users/route.ts` | Yes — admin |
| GET | `/api/admin/orders` | `app/api/admin/orders/route.ts` | Yes — admin |
| GET | `/api/admin/orders/[id]` | `app/api/admin/orders/[id]/route.ts` | Yes — admin |
| PUT | `/api/admin/orders/[id]` | `app/api/admin/orders/[id]/route.ts` | Yes — admin (status update, presumably — confirm body schema during implementation) |
| GET | `/api/admin/stats` | `app/api/admin/stats/route.ts` | Yes — admin |

**Total: 22 API route handlers across ~20 files** — matches the "22 API routes" figure in knowledge_base.md §7 build status.

**NOT implemented (despite being documented in knowledge_base.md §3 and flow.md):**
- `/api/wishlist`, `/api/wishlist/[productId]`
- `/api/profile` (GET/PUT) — Flutter's `getProfile()` calls this but it does not exist server-side; will 404
- `/api/products/[id]/reviews` (GET/POST) — `Review.ts` model exists but no route uses it
- `/api/admin/coupons` (CRUD)
- `/api/admin/prescriptions`, `/api/admin/prescriptions/[id]/verify`
- `/api/admin/orders/[id]/status`, `/api/admin/orders/[id]/tracking`, `/api/admin/orders/[id]/refund`, `/api/admin/orders/[id]/notes` (collapsed into single `PUT /api/admin/orders/[id]` in actual code)
- `/api/admin/inventory/[productId]` (PUT), `/api/admin/inventory/bulk-update`
- `/api/admin/products/bulk-import`
- `/api/admin/users/[id]`, `/api/admin/users/[id]/credit`
- `/api/admin/coupons/[id]`

These gaps exist **today**, independent of the migration — Express should replicate exactly what exists now unless the Planner explicitly scopes adding the missing routes as part of this migration.

---

## 3. Inventory of Models (web/src/models) — to become Mongoose models in Express

| Model | File | Lines | Notes |
|---|---|---|---|
| `User` | `models/User.ts` | 78 | phone/email, OTP hash+expiry, addresses[], wishlist[], role/adminRole |
| `Product` | `models/Product.ts` | 131 | sku, frame specs, colors[], price, compatible flags |
| `LensOption` | `models/LensOption.ts` | 40 | lens type/subtype/quality reference data |
| `Order` | `models/Order.ts` | 143 | items[], pricing, status pipeline, address, payment |
| `Cart` | `models/Cart.ts` | 63 | one doc per user, items[] |
| `Prescription` | `models/Prescription.ts` | 41 | RE/LE power, uploadedFile, verification status |
| `Review` | `models/Review.ts` | 30 | product/user/rating/comment (currently unused by any route — see §2) |
| `Coupon` | `models/Coupon.ts` | 41 | code, discount rules, usage limits |

All 8 models are plain Mongoose schemas with no Next.js-specific code — these can be copied into the Express project's `models/` directory **verbatim**, no rewrite needed. Only `lib/mongodb.ts`'s connection caching pattern (using `global.mongoose`) needs a small adaptation for a long-running Express process (no need for the Next.js hot-reload dev cache workaround, but the lazy-connect-once pattern itself is fine to reuse).

---

## 4. Lib Files

| File | Purpose | Express migration notes |
|---|---|---|
| `lib/auth.ts` | OTP generate/hash/verify (bcrypt), JWT sign/verify (jsonwebtoken), **cookie-based** auth (`setAuthCookie`, `clearAuthCookie`, `getAuthUser` reads `req.cookies.get('eyeglaze_auth')`) | Needs `cookie-parser` middleware in Express to populate `req.cookies`. `setAuthCookie`/`clearAuthCookie` logic ports directly to `res.cookie(...)` / `res.clearCookie(...)` with the same options (httpOnly, secure in prod, sameSite, 30-day maxAge). **Cookie name: `eyeglaze_auth`.** |
| `lib/adminAuth.ts` | `requireAdmin()` middleware-like helper checking role against `['admin','store_manager','support_agent']` | Port to a real Express middleware function `requireAdmin(req,res,next)`. |
| `lib/mongodb.ts` | Mongoose connection w/ caching | Port `connectDB()` as-is; call once at Express server startup instead of per-request lazy connect (or keep lazy pattern, both work). |
| `lib/otp-sender.ts` | `sendSMSOTP` / `sendEmailOTP` — both are **dev stubs that just console.log** the OTP; Twilio/SendGrid integration is commented-out TODO | Port verbatim; no external service is actually wired up today. |
| `lib/apiResponse.ts` | (not read in detail — likely response-shaping helpers) | Port as-is; check for any `NextResponse`-specific code that needs swapping to plain Express `res.json()`. |
| `lib/validations/` | (directory, contents not enumerated here) | Planner should list contents and confirm no Next.js-coupled validation logic before porting. |
| `middleware.ts` (web/src root) | **This is the most important file to re-architect.** Next.js edge middleware that gate-keeps: `/api/admin/*` (admin role required), `/api/cart/*`, `/api/orders/*`, `/api/prescriptions/*`, `/api/coupons/*` (any authenticated role), and redirects unauthenticated `/admin/*` page visits to `/login`. | Must become **real Express middleware** mounted via `app.use()` on matching path prefixes, run before the route handlers — NOT a per-route afterthought. The page-redirect behavior (`/admin/*` → `/login`) is a **frontend-only concern** once split: React Router needs its own client-side route guard for `/admin/*`, since Express no longer serves the SPA's pages directly. |

---

## 5. Components (web/src/components/ui)

| Component | Lines | Purpose |
|---|---|---|
| `DarkCard.tsx` | 17 | Themed card wrapper (#1A1A1A bg) |
| `GoldButton.tsx` | 32 | Primary CTA button (gold fill) |
| `OtpInput.tsx` | 52 | Segmented OTP input boxes |
| `ProductCard.tsx` | 67 | Product listing card (image, price, badge) |
| `StarRating.tsx` | 23 | Star rating display |
| `StatusBadge.tsx` | 20 | Order/status pill badge |

All are presentational React components with no Next.js-specific APIs expected (no `next/image`, `next/link` confirmed — **Planner should grep for `next/image` and `next/link` imports across all components and pages before porting**, since those need replacing with `<img>`/React Router `<Link>` in the Vite app).

---

## 6. Auth Flow — OTP + JWT Cookie (current implementation)

1. Client calls `POST /api/auth/send-otp` with `{ phone, countryCode }` or `{ email }`.
2. Server generates 6-digit OTP (`generateOTP()`), hashes it with bcrypt, stores hash + expiry on the `User` doc (upserting by phone/email if not found), and calls `sendSMSOTP`/`sendEmailOTP` (which currently just `console.log`s the OTP in dev — **no real SMS/email is sent**).
3. Client calls `POST /api/auth/verify-otp` with `{ phone, otp }` or `{ email, otp }`.
4. Server compares hash via bcrypt, checks expiry, and on success signs a JWT (`{ userId, role }`, 30-day expiry) using `JWT_SECRET` env var (falls back to a hardcoded dev secret — **must be set properly in Express's env for production**).
5. **Web:** the JWT is set as an **httpOnly cookie** named `eyeglaze_auth` (`secure` in production, `sameSite: 'lax'`, 30-day maxAge, path `/`). The browser automatically attaches this cookie on same-origin requests.
6. **Mobile (Flutter):** does NOT use cookies. `ApiService` sends `Authorization: Bearer <token>` headers, with the token persisted via `flutter_secure_storage`. **However, the current `getAuthUser()` in `lib/auth.ts` only reads `req.cookies.get('eyeglaze_auth')` — it does NOT check the `Authorization` header at all.** This means **Flutter's bearer-token auth does not actually work against the current Next.js API today** for any protected route (cart, orders, prescriptions, coupons/validate). This is a pre-existing bug/gap, not something introduced by the migration — but Express MUST support both: httpOnly cookie (for the new React frontend) AND Bearer header (for Flutter) in its auth middleware, or Flutter will continue to silently fail on every protected call.
7. `GET /api/auth/me` and `POST /api/auth/logout` round out the flow (check current session / clear cookie).

### Cross-origin requirement once split
- Today web frontend and API are same-origin (`localhost:3000`), so the cookie "just works."
- Once React (Vite, e.g. `localhost:5173`) and Express (e.g. `localhost:4000` or similar) are on different ports/origins, the httpOnly cookie will only be sent if:
  - Express sets `Access-Control-Allow-Origin: <exact Vite origin>` (not `*`) **and** `Access-Control-Allow-Credentials: true`.
  - React's fetch/axios calls must set `credentials: 'include'` on every request.
  - Cookie's `sameSite` must be `'lax'` or `'none'` (if `'none'`, `secure: true` is mandatory, requiring HTTPS even in some dev setups — `'lax'` is fine for same-site-different-port localhost dev in most browsers but **may break in production if frontend and backend end up on different registrable domains** — Planner should decide final domain topology before locking this in).
  - `cors` npm package must be configured with explicit origin + `credentials: true`; cookie-parser must be added so `req.cookies` exists in Express (mirrors `req.cookies.get()` used today).

---

## 7. What Flutter Currently Calls (api_service.dart + app_config.dart)

**Base URL:** `lib/core/app_config.dart`
- Android emulator: `http://10.0.2.2:3000/api`
- iOS / default: `http://localhost:3000/api`
- **This must be updated to point at the new Express server's host:port** once split (e.g. `http://localhost:4000/api` or whatever port Express runs on) — currently hardcoded to port `3000` which is the Next.js dev server port.

**Endpoints called by `ApiService` (lib/services/api_service.dart):**
| Method | Endpoint | Exists server-side? |
|---|---|---|
| POST | `/auth/send-otp` | Yes |
| POST | `/auth/verify-otp` | Yes |
| GET | `/products` (query: category, search, sort, page, limit) | Yes |
| GET | `/products/:id` | Yes |
| GET | `/lens-options` | Yes |
| GET | `/cart` | Yes (but auth currently broken for Flutter — see §6) |
| POST | `/cart` | Yes (same auth caveat) |
| DELETE | `/cart/:itemId` | Yes (same auth caveat) |
| PUT | `/cart/:itemId` | Yes (same auth caveat) |
| POST | `/orders` | Yes (same auth caveat) |
| GET | `/orders` | Yes (same auth caveat) |
| GET | `/orders/:id` | Yes (same auth caveat) |
| POST | `/coupons/validate` | Yes (same auth caveat) |
| GET | `/profile` | **No — route does not exist.** Will 404 against current backend. |

All requests send `Content-Type: application/json` and (when a token is stored) `Authorization: Bearer <token>`. Auth headers are attached via `_getHeaders()` for every call except the two `/auth/*` calls.

Express must, at minimum:
1. Mount all the above paths at the same relative paths under `/api`.
2. Accept `Authorization: Bearer <token>` for protected routes (Flutter) AND `eyeglaze_auth` httpOnly cookie (React) — dual-mode auth middleware.
3. Either implement `GET /api/profile` (to actually fix the pre-existing Flutter gap) or confirm with Planner/stakeholder that it stays out of scope.

---

## 8. Gaps & Risks for the Migration

1. **Middleware re-architecture (highest risk).** `web/src/middleware.ts` is Next.js edge middleware matched by path prefix (`/api/admin/:path*`, `/api/cart/:path*`, etc.) plus a page-route guard for `/admin/*`. In Express this splits into two different things:
   - API-side: real Express middleware (`app.use('/api/admin', requireAdmin)`, etc.) — straightforward port.
   - Page-side (`/admin/*` redirect to `/login` for unauthenticated users): this protection **disappears** once pages are served by a separate static SPA build — Express has no visibility into client-side routing. React Router must implement its own auth-gated route wrapper (e.g. `<ProtectedRoute>` checking `/auth/me` or local auth state) to replicate this UX. Relying on the API call failing alone is not equivalent UX to a redirect.

2. **Auth dual-mode requirement.** As detailed in §6, Flutter sends Bearer tokens; current code only reads cookies. This is a **pre-existing bug** that must be fixed in Express's auth middleware (check `Authorization` header first, fall back to cookie) — otherwise the entire Flutter app's authenticated flows (cart, orders, prescriptions, coupons) remain broken post-migration too.

3. **CORS + credentials.** New cross-origin setup (React on one port, Express on another) requires careful `cors` configuration with explicit origin allow-list and `credentials: true`, plus `credentials: 'include'` on every authenticated fetch from React. Get this wrong and the cookie silently never arrives — login will appear to succeed but every subsequent "am I logged in" check will fail.

4. **`/api/products` and `/api/lens-options` POST/PUT/DELETE appear unauthenticated at the middleware level today** (they're not under `/api/admin/*`, `/api/cart/*`, `/api/orders/*`, `/api/prescriptions/*`, or `/api/coupons/*` matchers). Need to check each route handler's source for an in-handler `requireAdmin`/role check before assuming this is intentionally open — if there's no in-handler check, this is a **pre-existing security hole** (anyone could create/edit/delete products or lens options without auth) that the Planner should decide whether to fix during migration or carry forward as-is (not recommended to carry forward).

5. **Missing routes vs. documented spec.** `/api/wishlist`, `/api/profile`, `/api/products/[id]/reviews`, full admin CRUD for coupons/prescriptions/inventory-per-product, and order sub-actions (status/tracking/refund/notes as separate endpoints) are documented in `knowledge_base.md` but not implemented. Decide explicitly whether migration scope is "port what exists" (recommended first pass) vs. "port + fill gaps" — mixing the two without a clear boundary risks scope creep mid-migration.

6. **`JWT_SECRET` fallback to a hardcoded dev string** (`lib/auth.ts` line 5) — must ensure Express's deployment sets a real secret via env var; don't silently inherit the insecure default.

7. **OTP delivery is currently a no-op stub** (console.log only) for both SMS and email — this is **not a migration blocker** (Express should port the same stub behavior) but the Planner/stakeholder should be aware that "send OTP" in any newly split environment still won't deliver real SMS/email until Twilio/SendGrid are wired up — a separate, already-tracked "What's Next" item in knowledge_base.md §7.

8. **Static assets / image hosting.** If any product images, swatch images, or 360° assets are currently served from `web/public/` via Next.js, confirm where these move — they can't be served by Express's API process in the same way Next.js serves `/public`; likely need a dedicated static file server, CDN, or to keep `public/` assets in the new Vite frontend's `public/` dir if they're purely build-time assets, or in Express with `express.static` if they're admin-uploaded.

9. **`app/(user)/products/ProductFilters.tsx` and `app/(user)/products/[id]/AddToCartButton.tsx`** are co-located component files inside route folders (a Next.js App Router convention) — these are not routes themselves but need to be relocated to a conventional `components/` directory in the Vite app structure, not treated as pages during the route inventory mapping.

10. **No separate `/admin/login` page exists**, contradicting `flow.md §7.1`'s assumption of email+password+2FA for admins — current reality is admins log in through the same OTP flow as regular users, differentiated only by the `role`/`adminRole` field on their `User` doc. Planner should confirm whether introducing a real separate admin auth flow is in scope for this migration or a future enhancement.

---

## 9. Summary Counts (ground truth from code, for Planner sizing)

- **Pages to port to React Router:** 11 (`/`, `/login`, `/login/otp`, `/products`, `/products/[id]`, `/cart`, `/orders`, `/account`, `/admin/dashboard`, `/admin/products`, `/admin/orders`, `/admin/inventory`, `/admin/users`) — *recount: 13 listed routes total including admin group; treat the table in §1 as authoritative.*
- **API route files to port to Express:** ~20 files / 22 HTTP method handlers.
- **Mongoose models to copy verbatim:** 8 (`User`, `Product`, `LensOption`, `Order`, `Cart`, `Prescription`, `Review`, `Coupon`).
- **Lib/auth files needing Express-specific rewrite:** `middleware.ts` (full rearchitecture), `lib/auth.ts` (extend to support Bearer header), `lib/adminAuth.ts` (convert to real middleware). `lib/mongodb.ts`, `lib/otp-sender.ts`, `lib/apiResponse.ts` port mostly as-is.
- **Shared UI components to port:** 6 (`DarkCard`, `GoldButton`, `OtpInput`, `ProductCard`, `StarRating`, `StatusBadge`).
- **Flutter changes required:** only `lib/core/app_config.dart` base URL (point at new Express host:port) — assuming Express replicates the exact same `/api/...` paths and fixes the Bearer-token auth gap from §6.
