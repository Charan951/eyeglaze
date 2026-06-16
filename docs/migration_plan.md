# EyeGlaze Migration Plan — Next.js (web) → Express (server) + React/Vite (frontend)

> Companion to `docs/migration_flow.md` (audit, ground truth as of 2026-06-16) and `docs/knowledge_base.md` (spec/backlog).
> Scope decision for this pass: **port what exists today 1:1**. Known gaps (`/api/wishlist`, `/api/profile`, reviews routes,
> admin coupons/prescriptions CRUD, order sub-actions, bulk-import/update) are **out of scope** for this migration and
> remain tracked backlog items — call this out explicitly anywhere it matters below.
>
> `/web` is left untouched and not deleted until the new stack is verified end-to-end (see §5 step 8).

---

## 0. Decisions Locked In (resolving audit's open questions)

| Question raised in audit | Decision |
|---|---|
| Express port | **5000** (`http://localhost:5000`) |
| Vite dev port | **5173** (Vite default) |
| Cookie name | Keep **`eyeglaze_auth`** (unchanged, so nothing else has to change) |
| Cookie `sameSite` | `lax` for local dev (same registrable domain, different port) — revisit before prod deploy if frontend/backend end up on different domains |
| Dual auth (cookie + Bearer) | **Required** — fixes the pre-existing Flutter bug from the audit (§6/§8.2) |
| `/api/products`, `/api/lens-options` mutating routes (POST/PUT/DELETE) unauthenticated today | **Fix during migration**: require `requireAdmin` on these in Express (current Next.js gap is a security hole, not a contract Flutter/React depend on for unauthenticated access) |
| `/api/users` (top-level, separate from `/api/admin/users`) | Port as-is, unauthenticated, exactly matching current behavior (no client is known to depend on tightening it now; flagged as backlog hardening, not blocking) |
| Missing routes per audit §2 (`wishlist`, `profile`, reviews, admin coupons/prescriptions/inventory extras, bulk import) | **Out of scope.** Do not add. Express mirrors the 22 existing handlers only. |
| `lib/validations/` | Confirmed: **does not exist** in the codebase (audit flagged it for verification — verified absent, nothing to port) |
| Static assets (`web/public`) | Audit product image URLs are stored as full strings in MongoDB docs (seed data), not served from `web/public` for product imagery — confirmed no product images live in `web/public`. Any UI-only static assets (favicon, etc.) move to `/frontend/public`. No `express.static` requirement identified for product images in this pass. |

---

## 1. Express Server Architecture

### 1.1 Folder structure

```
/server
├── package.json
├── tsconfig.json
├── .env                          # not committed
├── .env.example
└── src/
    ├── app.ts                    # express app: middleware, routes mounted, no listen()
    ├── server.ts                 # entrypoint: connectDB() then app.listen(PORT)
    ├── models/
    │   ├── User.ts
    │   ├── Product.ts
    │   ├── LensOption.ts
    │   ├── Order.ts
    │   ├── Cart.ts
    │   ├── Prescription.ts
    │   ├── Review.ts
    │   └── Coupon.ts
    ├── lib/
    │   ├── mongodb.ts             # connectDB()
    │   ├── auth.ts                # OTP gen/hash/verify, JWT sign/verify, setAuthCookie/clearAuthCookie
    │   ├── otp-sender.ts          # sendSMSOTP / sendEmailOTP (console.log stubs, ported verbatim)
    │   └── apiResponse.ts         # response-shaping helpers, swapped from NextResponse to plain res.json
    ├── middleware/
    │   ├── requireAuth.ts         # checks Authorization: Bearer <token> OR eyeglaze_auth cookie
    │   ├── requireAdmin.ts        # requireAuth + role in ['admin','store_manager','support_agent']
    │   └── errorHandler.ts        # central error -> JSON response middleware (new, not in old code, low risk addition)
    ├── routes/
    │   ├── auth.routes.ts         # send-otp, verify-otp, logout, me
    │   ├── products.routes.ts     # GET/POST /products, GET/PUT/DELETE /products/:id
    │   ├── lensOptions.routes.ts  # GET/POST /lens-options
    │   ├── users.routes.ts        # GET /users (top-level, unauth, as today)
    │   ├── cart.routes.ts         # GET/POST /cart, PUT/DELETE /cart/:itemId, POST /cart/apply-coupon
    │   ├── orders.routes.ts       # GET/POST /orders, GET /orders/:id
    │   ├── prescriptions.routes.ts# GET/POST /prescriptions
    │   ├── coupons.routes.ts      # POST /coupons/validate
    │   └── admin/
    │       ├── products.routes.ts # GET/POST /admin/products, GET/PUT/DELETE /admin/products/:id
    │       ├── inventory.routes.ts# GET /admin/inventory
    │       ├── users.routes.ts    # GET /admin/users
    │       ├── orders.routes.ts   # GET /admin/orders, GET/PUT /admin/orders/:id
    │       └── stats.routes.ts    # GET /admin/stats
    └── scripts/
        └── seed.ts                # ported from web/src/scripts/seed.ts
```

### 1.2 Port & startup

- Express listens on **5000** (`process.env.PORT || 5000`).
- `server.ts` calls `connectDB()` once at boot (not per-request lazy-connect), then `app.listen`.

### 1.3 CORS config (`app.ts`)

```ts
import cors from 'cors';
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
```

- Must be an **explicit origin string**, not `'*'` — required for cookies to be accepted cross-origin (audit §6 cross-origin requirement).

### 1.4 Cookie handling

- `cookie-parser` middleware mounted in `app.ts` so `req.cookies.eyeglaze_auth` is populated (mirrors today's `req.cookies.get('eyeglaze_auth')` Next.js API).
- `lib/auth.ts` ports `setAuthCookie(res, token)` / `clearAuthCookie(res)` using `res.cookie('eyeglaze_auth', token, { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'lax', maxAge: 30*24*60*60*1000, path: '/' })` — same options as today.

### 1.5 Dual-mode auth — fixes the Flutter bearer-token bug

`middleware/requireAuth.ts`:

```ts
export function requireAuth(req, res, next) {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  const token = bearer || req.cookies?.eyeglaze_auth;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = verifyJWT(token); // { userId, role }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
```

`middleware/requireAdmin.ts` wraps `requireAuth` then checks `['admin','store_manager','support_agent'].includes(req.user.role)`, else `403`.

This directly fixes audit §6/§8.2: **Bearer header is checked first, falling back to cookie** — Flutter (`Authorization: Bearer <token>`) and React (cookie via `withCredentials`) both work without any contract change.

### 1.6 Route mounting (`app.ts`)

```
app.use('/api/auth', authRoutes);                          // no requireAuth
app.use('/api/products', productsRoutes);                  // GET public; POST/PUT/DELETE gated by requireAdmin inside route file (NEW — closes audit gap §8.4)
app.use('/api/lens-options', lensOptionsRoutes);            // GET public; POST gated by requireAdmin (NEW)
app.use('/api/users', usersRoutes);                         // unauth, as today
app.use('/api/cart', requireAuth, cartRoutes);
app.use('/api/orders', requireAuth, ordersRoutes);
app.use('/api/prescriptions', requireAuth, prescriptionsRoutes);
app.use('/api/coupons', requireAuth, couponsRoutes);
app.use('/api/admin', requireAdmin, adminRoutes);           // mounts products/inventory/users/orders/stats sub-routers
```

This replaces `web/src/middleware.ts`'s path-prefix matcher with literal Express `app.use(prefix, middleware, router)` — same effect, real middleware instead of Next edge middleware. The `/admin/*` **page** redirect-to-login behavior from the old middleware does **not** port here (it's a frontend concern now — see §2 ProtectedRoute).

### 1.7 Models

All 8 Mongoose models (`User`, `Product`, `LensOption`, `Order`, `Cart`, `Prescription`, `Review`, `Coupon`) copied **verbatim** from `web/src/models/*.ts` into `server/src/models/` — no schema changes, confirmed Next.js-agnostic by audit §3.

### 1.8 `lib/mongodb.ts`

Port `connectDB()` as-is; the `global.mongoose` caching pattern still works in a long-running Node process, just called once at server startup instead of per-request.

### 1.9 Seed script

`server/src/scripts/seed.ts` ported from `web/src/scripts/seed.ts`, run via `npx tsx src/scripts/seed.ts` (same invocation style as documented in knowledge_base.md §7). Creates lens options, 6 products, 1 admin user (phone `9999999999`).

---

## 2. React Frontend Architecture

### 2.1 Stack

Vite + TypeScript + Tailwind v4 + React Router v6, dev server on port **5173** (default).

### 2.2 Folder structure

```
/frontend
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── .env                          # VITE_API_URL=http://localhost:5000/api
├── .env.example
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx                   # <BrowserRouter> + route tree
    ├── index.css                 # tailwind directives + theme tokens (from web/src/app/globals.css)
    ├── lib/
    │   └── api.ts                 # axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true })
    ├── context/
    │   └── AuthContext.tsx        # current user state, login/logout, calls /auth/me on mount
    ├── components/
    │   ├── ui/
    │   │   ├── DarkCard.tsx
    │   │   ├── GoldButton.tsx
    │   │   ├── OtpInput.tsx
    │   │   ├── ProductCard.tsx
    │   │   ├── StarRating.tsx
    │   │   └── StatusBadge.tsx
    │   ├── ProductFilters.tsx     # relocated from app/(user)/products/ProductFilters.tsx
    │   └── AddToCartButton.tsx    # relocated from app/(user)/products/[id]/AddToCartButton.tsx
    ├── layouts/
    │   ├── UserLayout.tsx         # replaces app/(user)/layout.tsx
    │   ├── AdminLayout.tsx        # replaces app/(admin)/layout.tsx
    │   └── RootLayout.tsx         # replaces app/layout.tsx (html shell concerns -> index.html + RootLayout wrapper)
    ├── routes/
    │   └── ProtectedRoute.tsx     # auth-gated wrapper; replaces middleware.ts's /admin/* page redirect
    └── pages/
        ├── Landing.tsx
        ├── Login.tsx
        ├── LoginOtp.tsx
        ├── Products.tsx
        ├── ProductDetail.tsx
        ├── Cart.tsx
        ├── Orders.tsx
        ├── Account.tsx
        └── admin/
            ├── Dashboard.tsx
            ├── Products.tsx
            ├── Orders.tsx
            ├── Inventory.tsx
            └── Users.tsx
```

### 2.3 Routing (`App.tsx`)

```
/                      -> Landing
/login                 -> Login
/login/otp             -> LoginOtp
/products              -> UserLayout > Products
/products/:id          -> UserLayout > ProductDetail
/cart                  -> UserLayout > ProtectedRoute > Cart
/orders                -> UserLayout > ProtectedRoute > Orders
/account               -> UserLayout > ProtectedRoute > Account
/admin/dashboard        -> AdminLayout > ProtectedRoute(admin) > Dashboard
/admin/products         -> AdminLayout > ProtectedRoute(admin) > Products
/admin/orders           -> AdminLayout > ProtectedRoute(admin) > Orders
/admin/inventory        -> AdminLayout > ProtectedRoute(admin) > Inventory
/admin/users            -> AdminLayout > ProtectedRoute(admin) > Users
```

`ProtectedRoute` checks `AuthContext`'s current user (populated via `GET /auth/me` on app load); redirects to `/login` if absent, or to `/login` if `requireAdmin` prop set and role doesn't qualify. This explicitly replaces the page-guard half of `web/src/middleware.ts` that disappears once Express stops serving pages (audit §8.1).

### 2.4 API client (`lib/api.ts`)

```ts
import axios from 'axios';
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,   // required for eyeglaze_auth cookie to be sent cross-origin
});
```

### 2.5 Theme

Reuse exact tokens from `web/src/app/globals.css` and knowledge_base.md §1: background `#0D0D0D`, card `#1A1A1A`, gold accent `#C9A84C` (resolve the `#D4922A` discrepancy noted in knowledge_base.md by keeping the value already in code, `#C9A84C`, as the single `goldAccent` token — confirm with design before final lock, not a migration blocker).

### 2.6 Pre-port check (per audit §1, §5 risk item 9)

Before porting each page/component, grep for `next/image` and `next/link` imports and replace with plain `<img>` and React Router `<Link>` respectively. Also check each `page.tsx` for `"use client"` directives / any server-only logic that needs to move into `useEffect`/data-fetching hooks.

---

## 3. Flutter Changes

### 3.1 Base URL (`mobile/lib/core/app_config.dart`)

Current:
```dart
class AppConfig {
  static String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3000/api';
    }
    return 'http://localhost:3000/api';
  }
}
```

Change to:
```dart
class AppConfig {
  static String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000/api';
    }
    return 'http://localhost:5000/api';
  }
}
```

Only the port changes (3000 → 5000); path structure (`/api/...`) is unchanged since Express mounts routes at identical paths.

### 3.2 Auth header bug

No Flutter code change needed — `mobile/lib/services/api_service.dart`'s `_getHeaders()` already sends `Authorization: Bearer $token` correctly (verified at line ~18). The bug was entirely server-side (old `getAuthUser()` only read the cookie). Fixed by Express's `requireAuth` middleware (§1.5) checking the Bearer header first. **Action item: smoke-test cart/orders/prescriptions/coupons calls from the Flutter app against the new Express server to confirm this previously-broken path now works** (see §5 step 8).

### 3.3 Known pre-existing gap carried forward (not fixed by this migration)

`api_service.dart`'s `getProfile()` calls `GET /profile`, which does not exist in Next.js today and will **not** be added in Express either per the scope decision in §0. This 404 is pre-existing and out of scope; flag to stakeholders separately if it needs fixing.

---

## 4. Environment Variables

### `/server/.env`
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eyeglaze   # or Atlas URI
JWT_SECRET=<real-random-secret>                  # audit §8.6: do NOT inherit the old hardcoded dev fallback
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### `/frontend/.env`
```
VITE_API_URL=http://localhost:5000/api
```

### `/mobile`
No `.env` file — `baseUrl` remains a compile-time constant in `lib/core/app_config.dart` (§3.1). No change to this pattern.

---

## 5. Migration Order (strict dependency sequence)

1. **Express foundation**: `models/` (verbatim copy of all 8), `lib/mongodb.ts`, `lib/auth.ts` (extended for Bearer support), `lib/otp-sender.ts`, `lib/apiResponse.ts`, `middleware/requireAuth.ts`, `middleware/requireAdmin.ts`.
2. **Express routes**: all 9 route files + 5 admin sub-route files (22 handlers total), mounted in `app.ts` per §1.6, including the new `requireAdmin` gating added to `products`/`lens-options` mutating routes (closing audit gap §8.4).
3. **Express seed script**: port `scripts/seed.ts`, run once against local Mongo, confirm 6 products + lens options + 1 admin user (`9999999999`) seed successfully.
4. **React scaffold**: Vite init, Tailwind v4 config, theme tokens, `lib/api.ts`, `AuthContext.tsx`, `ProtectedRoute.tsx`, layouts.
5. **React pages**: port all 11 pages + 6 shared UI components + 2 relocated components (`ProductFilters`, `AddToCartButton`), replacing `next/image`/`next/link` usages found during the pre-port grep (§2.6).
6. **Flutter**: update `app_config.dart` port 3000→5000; manually verify (no code change expected) that Bearer auth now succeeds against Express for cart/orders/prescriptions/coupons.
7. **Testing**:
   - Server: unit tests for `requireAuth`/`requireAdmin` (cookie-only, bearer-only, both-missing cases), integration smoke test per route group (auth, products, cart, orders, admin).
   - Frontend: `npm run build` (Vite/TS compiles clean), manual click-through of all 11 routes.
   - Mobile: `flutter analyze` (0 errors, matching current baseline per knowledge_base.md §7).
8. **Flow verification** (end-to-end against the new stack, both clients):
   - Admin: log in (OTP), add a product via `/admin/products` (React), confirm it appears in `GET /products`.
   - User (web): browse products, add to cart, buy with lens flow, place order, view in `/orders`.
   - User (mobile): repeat the same buy-with-lens flow on Flutter against the new Express base URL, specifically confirming cart/orders calls that were previously silently failing (audit §6) now succeed.
   - Only after this passes end-to-end on both clients does `/web` become safe to archive/remove (not part of this migration — explicitly deferred).

---

## 6. File-by-File Mapping Table

### Pages → React Router pages

| Old (`web/src/app/...`) | New (`frontend/src/...`) |
|---|---|
| `app/page.tsx` | `pages/Landing.tsx` |
| `app/login/page.tsx` | `pages/Login.tsx` |
| `app/login/otp/page.tsx` | `pages/LoginOtp.tsx` |
| `app/layout.tsx` | `layouts/RootLayout.tsx` + `index.html` |
| `app/(user)/layout.tsx` | `layouts/UserLayout.tsx` |
| `app/(user)/products/page.tsx` | `pages/Products.tsx` |
| `app/(user)/products/ProductFilters.tsx` | `components/ProductFilters.tsx` |
| `app/(user)/products/[id]/page.tsx` | `pages/ProductDetail.tsx` |
| `app/(user)/products/[id]/AddToCartButton.tsx` | `components/AddToCartButton.tsx` |
| `app/(user)/cart/page.tsx` | `pages/Cart.tsx` |
| `app/(user)/orders/page.tsx` | `pages/Orders.tsx` |
| `app/(user)/account/page.tsx` | `pages/Account.tsx` |
| `app/(admin)/layout.tsx` | `layouts/AdminLayout.tsx` |
| `app/(admin)/admin/dashboard/page.tsx` | `pages/admin/Dashboard.tsx` |
| `app/(admin)/admin/products/page.tsx` | `pages/admin/Products.tsx` |
| `app/(admin)/admin/orders/page.tsx` | `pages/admin/Orders.tsx` |
| `app/(admin)/admin/inventory/page.tsx` | `pages/admin/Inventory.tsx` |
| `app/(admin)/admin/users/page.tsx` | `pages/admin/Users.tsx` |
| `app/globals.css` | `index.css` |
| `app/favicon.ico` | `frontend/public/favicon.ico` |

### API routes → Express routes

| Old (`web/src/app/api/...`) | New (`server/src/routes/...`) |
|---|---|
| `api/auth/send-otp/route.ts` | `routes/auth.routes.ts` (`POST /send-otp`) |
| `api/auth/verify-otp/route.ts` | `routes/auth.routes.ts` (`POST /verify-otp`) |
| `api/auth/logout/route.ts` | `routes/auth.routes.ts` (`POST /logout`) |
| `api/auth/me/route.ts` | `routes/auth.routes.ts` (`GET /me`) |
| `api/products/route.ts` | `routes/products.routes.ts` (`GET /`, `POST /` — now `requireAdmin`-gated) |
| `api/products/[id]/route.ts` | `routes/products.routes.ts` (`GET/PUT/DELETE /:id` — PUT/DELETE now `requireAdmin`-gated) |
| `api/lens-options/route.ts` | `routes/lensOptions.routes.ts` (`GET /`, `POST /` — now `requireAdmin`-gated) |
| `api/users/route.ts` | `routes/users.routes.ts` (`GET /`, unauth as today) |
| `api/cart/route.ts` | `routes/cart.routes.ts` (`GET /`, `POST /`) |
| `api/cart/[itemId]/route.ts` | `routes/cart.routes.ts` (`PUT/DELETE /:itemId`) |
| `api/cart/apply-coupon/route.ts` | `routes/cart.routes.ts` (`POST /apply-coupon`) |
| `api/orders/route.ts` | `routes/orders.routes.ts` (`GET /`, `POST /`) |
| `api/orders/[id]/route.ts` | `routes/orders.routes.ts` (`GET /:id`) |
| `api/prescriptions/route.ts` | `routes/prescriptions.routes.ts` (`GET /`, `POST /`) |
| `api/coupons/validate/route.ts` | `routes/coupons.routes.ts` (`POST /validate`) |
| `api/admin/products/route.ts` | `routes/admin/products.routes.ts` (`GET /`, `POST /`) |
| `api/admin/products/[id]/route.ts` | `routes/admin/products.routes.ts` (`GET/PUT/DELETE /:id`) |
| `api/admin/inventory/route.ts` | `routes/admin/inventory.routes.ts` (`GET /`) |
| `api/admin/users/route.ts` | `routes/admin/users.routes.ts` (`GET /`) |
| `api/admin/orders/route.ts` | `routes/admin/orders.routes.ts` (`GET /`) |
| `api/admin/orders/[id]/route.ts` | `routes/admin/orders.routes.ts` (`GET/PUT /:id`) |
| `api/admin/stats/route.ts` | `routes/admin/stats.routes.ts` (`GET /`) |

### Models → Mongoose models (verbatim copy, no changes)

| Old (`web/src/models/...`) | New (`server/src/models/...`) |
|---|---|
| `User.ts` | `User.ts` |
| `Product.ts` | `Product.ts` |
| `LensOption.ts` | `LensOption.ts` |
| `Order.ts` | `Order.ts` |
| `Cart.ts` | `Cart.ts` |
| `Prescription.ts` | `Prescription.ts` |
| `Review.ts` | `Review.ts` (kept though still unused by any route, matching current reality) |
| `Coupon.ts` | `Coupon.ts` |

### Lib files

| Old (`web/src/lib/...`) | New (`server/src/lib/...`) | Change |
|---|---|---|
| `auth.ts` | `lib/auth.ts` | Extended: `getAuthUser` equivalent moves into `middleware/requireAuth.ts` and now checks Bearer header before cookie |
| `adminAuth.ts` | `middleware/requireAdmin.ts` | Converted from helper function to real Express middleware |
| `mongodb.ts` | `lib/mongodb.ts` | Ported as-is, called once at startup |
| `otp-sender.ts` | `lib/otp-sender.ts` | Ported verbatim (still console.log stub) |
| `apiResponse.ts` | `lib/apiResponse.ts` | Ported as-is; any `NextResponse` usage swapped for plain `res.json()` |
| `web/src/middleware.ts` | `server/src/app.ts` (route mounting with middleware) + `frontend/src/routes/ProtectedRoute.tsx` | Split in two: API gating becomes Express `app.use(prefix, requireAuth/requireAdmin, router)`; page-redirect gating becomes client-side `ProtectedRoute` |

### Components

| Old (`web/src/components/ui/...`) | New (`frontend/src/components/ui/...`) |
|---|---|
| `DarkCard.tsx` | `DarkCard.tsx` |
| `GoldButton.tsx` | `GoldButton.tsx` |
| `OtpInput.tsx` | `OtpInput.tsx` |
| `ProductCard.tsx` | `ProductCard.tsx` |
| `StarRating.tsx` | `StarRating.tsx` |
| `StatusBadge.tsx` | `StatusBadge.tsx` |

### Scripts

| Old | New |
|---|---|
| `web/src/scripts/seed.ts` | `server/src/scripts/seed.ts` |

### Mobile (no relocation, in-place edit)

| File | Change |
|---|---|
| `mobile/lib/core/app_config.dart` | `baseUrl` port `3000` → `5000` (both Android emulator and iOS/default branches) |
| `mobile/lib/services/api_service.dart` | No change — already sends `Authorization: Bearer` correctly; bug was server-side only |

---

## 7. Explicitly Out of Scope (carried forward, not fixed)

- `/api/profile`, `/api/wishlist`, `/api/wishlist/[productId]`
- `/api/products/[id]/reviews` (GET/POST)
- `/api/admin/coupons` CRUD, `/api/admin/prescriptions` + verify endpoint
- `/api/admin/orders/[id]/tracking`, `/refund`, `/notes`, separate `/status` (all collapsed into existing `PUT /api/admin/orders/[id]`)
- `/api/admin/inventory/[productId]` (PUT), `/api/admin/inventory/bulk-update`
- `/api/admin/products/bulk-import`
- `/api/admin/users/[id]`, `/api/admin/users/[id]/credit`
- Separate `/admin/login` (email+password+2FA) — admins continue using the same OTP flow as regular users, differentiated by `role`/`adminRole`
- Real SMS/email OTP delivery (Twilio/SendGrid) — stub behavior ported as-is
- Payment gateway integration, push notifications, 360° try-on, AI chat — unrelated to this migration, already tracked in knowledge_base.md §7 "What's Next"
