# EyeGlaze Migration Task List

> Generated from `docs/migration_plan.md` and `docs/migration_flow.md`. Tasks are numbered TASK-M01..TASK-MNN
> in dependency order. Each task is self-contained enough for a developer agent to act on using only this
> file + `docs/migration_plan.md` for reference.

---

## TASK-M01: Express project scaffold
- Component: server
- Status: TODO
- Depends: none
- Files: `server/package.json`, `server/tsconfig.json`, `server/.env`, `server/.env.example`, `server/src/app.ts`, `server/src/server.ts`
- Description: Create the `/server` directory with a TypeScript Express project. `package.json` deps: `express`, `mongoose`, `jsonwebtoken`, `bcrypt`, `cors`, `cookie-parser`, `dotenv`; devDeps: `typescript`, `tsx`, `@types/express`, `@types/node`, `@types/cookie-parser`, `@types/jsonwebtoken`, `@types/bcrypt`. Add scripts: `dev` (`tsx watch src/server.ts`), `build` (`tsc`), `start` (`node dist/server.js`), `seed` (`tsx src/scripts/seed.ts`). `tsconfig.json` targets ES2020+, `commonjs` or `esnext` module per tsx compatibility, `outDir: dist`, `rootDir: src`, strict mode on. `src/app.ts` exports an Express `app` (middleware + routes mounted, no `.listen()` call — populated fully in TASK-M07). `src/server.ts` imports `connectDB` from `lib/mongodb.ts` and `app` from `./app`, calls `connectDB().then(() => app.listen(process.env.PORT || 5000, ...))`. Create `.env` and `.env.example` with `PORT=5000`, `MONGODB_URI=mongodb://localhost:27017/eyeglaze`, `JWT_SECRET=<real-random-secret>`, `NODE_ENV=development`, `CLIENT_URL=http://localhost:5173`.

## TASK-M02: DB connection module
- Component: server
- Status: TODO
- Depends: TASK-M01
- Files: `server/src/lib/mongodb.ts`
- Description: Port `connectDB()` from `web/src/lib/mongodb.ts` verbatim into `server/src/lib/mongodb.ts`. Keep the `global.mongoose` caching pattern (works fine in a long-running Node process too). Reads `MONGODB_URI` from `process.env`. Export `connectDB` as the sole export, called once at server startup in `server.ts` (not per-request lazy connect).

## TASK-M03: Port all 8 Mongoose models
- Component: server
- Status: TODO
- Depends: TASK-M01
- Files: `server/src/models/User.ts`, `server/src/models/Product.ts`, `server/src/models/LensOption.ts`, `server/src/models/Order.ts`, `server/src/models/Cart.ts`, `server/src/models/Prescription.ts`, `server/src/models/Review.ts`, `server/src/models/Coupon.ts`
- Description: Copy each model file verbatim from `web/src/models/*.ts` into `server/src/models/*.ts`. No schema changes — these are plain Mongoose schemas with no Next.js-specific code (confirmed by audit). Keep `Review.ts` even though no route currently uses it (matches current reality). Verify each model still compiles standalone (no Next-only imports remain) after copy.

## TASK-M04: Auth lib (OTP gen/hash, JWT sign/verify, cookie helpers)
- Component: server
- Status: TODO
- Depends: TASK-M01
- Files: `server/src/lib/auth.ts`
- Description: Port `web/src/lib/auth.ts` into `server/src/lib/auth.ts`, keeping: `generateOTP()`, OTP bcrypt hash/compare helpers, JWT `signJWT(payload)` / `verifyJWT(token)` (payload shape `{ userId, role }`, 30-day expiry), `JWT_SECRET` read from `process.env.JWT_SECRET` with **no hardcoded fallback** (audit §8.6 — remove the old insecure dev fallback). Add `setAuthCookie(res, token)` using `res.cookie('eyeglaze_auth', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30*24*60*60*1000, path: '/' })` and `clearAuthCookie(res)` using `res.clearCookie('eyeglaze_auth', { path: '/' })`. Do NOT include a `getAuthUser`-style cookie-only reader here — that logic moves into `requireAuth` middleware (TASK-M05) which adds Bearer support.

## TASK-M05: requireAuth + requireAdmin middleware
- Component: server
- Status: TODO
- Depends: TASK-M04
- Files: `server/src/middleware/requireAuth.ts`, `server/src/middleware/requireAdmin.ts`, `server/src/middleware/errorHandler.ts`
- Description: `requireAuth.ts`: Express middleware `(req, res, next)` that reads `Authorization: Bearer <token>` header first; if absent, falls back to `req.cookies?.eyeglaze_auth`. If neither present, return `401 { error: 'Unauthorized' }`. Otherwise call `verifyJWT(token)` from `lib/auth.ts`; on success set `req.user = payload` (`{ userId, role }`) and `next()`; on failure return `401`. This fixes the pre-existing Flutter Bearer-auth bug (audit §6/§8.2) — bearer checked before cookie. `requireAdmin.ts`: wraps `requireAuth` then checks `['admin','store_manager','support_agent'].includes(req.user.role)`; if not, `403 { error: 'Forbidden' }`. `errorHandler.ts`: central Express error-handling middleware `(err, req, res, next)` returning `500 { error: err.message || 'Internal Server Error' }` (new addition, low risk, not in old code) — to be mounted last in `app.ts` (TASK-M07).

## TASK-M06: apiResponse and otp-sender lib ports
- Component: server
- Status: TODO
- Depends: TASK-M01
- Files: `server/src/lib/apiResponse.ts`, `server/src/lib/otp-sender.ts`
- Description: Port `web/src/lib/apiResponse.ts` into `server/src/lib/apiResponse.ts`, swapping any `NextResponse`-based helpers for plain functions that shape a JSON body to be passed to `res.json()` (helpers should now just return plain objects, not call `res` themselves, so route handlers stay in control of status codes). Port `web/src/lib/otp-sender.ts` into `server/src/lib/otp-sender.ts` verbatim — `sendSMSOTP`/`sendEmailOTP` remain console.log stubs (no real Twilio/SendGrid wiring, out of scope).

## TASK-M07: app.ts — CORS, cookie-parser, route mounting
- Component: server
- Status: TODO
- Depends: TASK-M05, TASK-M06
- Files: `server/src/app.ts`
- Description: In `app.ts`, mount in order: `express.json()`, `cookie-parser()` (so `req.cookies.eyeglaze_auth` is populated), then `cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true })` (explicit origin string, NOT `'*'`, required for cookies cross-origin per audit §6). Then mount routers (routers themselves created in TASK-M08–M15, this task wires the mounting code and can be revisited/finalized once those exist):
  ```
  app.use('/api/auth', authRoutes);                          // no requireAuth
  app.use('/api/products', productsRoutes);                  // GET public; POST/PUT/DELETE gated by requireAdmin inside route file
  app.use('/api/lens-options', lensOptionsRoutes);            // GET public; POST gated by requireAdmin inside route file
  app.use('/api/users', usersRoutes);                         // unauth, as today
  app.use('/api/cart', requireAuth, cartRoutes);
  app.use('/api/orders', requireAuth, ordersRoutes);
  app.use('/api/prescriptions', requireAuth, prescriptionsRoutes);
  app.use('/api/coupons', requireAuth, couponsRoutes);
  app.use('/api/admin', requireAdmin, adminRoutes);           // mounts products/inventory/users/orders/stats sub-routers
  ```
  Mount `errorHandler` middleware last (after all routes). Export the configured `app` (no `.listen()` here).

## TASK-M08: Auth routes (send-otp, verify-otp, me, logout)
- Component: server
- Status: TODO
- Depends: TASK-M04, TASK-M03
- Files: `server/src/routes/auth.routes.ts`
- Description: Port from `web/src/app/api/auth/send-otp/route.ts`, `verify-otp/route.ts`, `logout/route.ts`, `me/route.ts`. Create an Express `Router` with: `POST /send-otp` — accepts `{ phone, countryCode }` or `{ email }`, generates OTP via `generateOTP()`, bcrypt-hashes it, upserts onto `User` doc by phone/email, calls `sendSMSOTP`/`sendEmailOTP` stub. `POST /verify-otp` — accepts `{ phone, otp }` or `{ email, otp }`, bcrypt-compares hash, checks expiry, on success signs JWT via `signJWT({ userId, role })` and calls `setAuthCookie(res, token)`, returns `{ user, token }` in body (token in body needed for Flutter to store via `flutter_secure_storage`). `GET /me` — uses `requireAuth`-equivalent inline (reads cookie/bearer same dual-mode logic, OR mount with `requireAuth` middleware optionally — must still work when unauthenticated by returning `{ user: null }` rather than 401, matching old "reads cookie, returns current user or null" behavior) — implement as: try to extract token (bearer or cookie) without erroring if missing; if present and valid, fetch and return user; else return `{ user: null }`. `POST /logout` — calls `clearAuthCookie(res)`, returns `{ success: true }`. No `requireAuth` gate at the router-mount level for this whole router (matches plan §1.6).

## TASK-M09: Products routes
- Component: server
- Status: TODO
- Depends: TASK-M03, TASK-M05
- Files: `server/src/routes/products.routes.ts`
- Description: Port from `web/src/app/api/products/route.ts` and `web/src/app/api/products/[id]/route.ts`. `GET /` — list products (support query filters/pagination matching old handler, e.g. category/search/sort/page/limit per audit §7 Flutter usage), public. `POST /` — create product, **gate with `requireAdmin` middleware inline on this route** (closes audit gap §8.4 — was unauthenticated in Next.js). `GET /:id` — get by id, public. `PUT /:id` — update by id, **gate with `requireAdmin`**. `DELETE /:id` — delete by id, **gate with `requireAdmin`**. Import `requireAdmin` from `../middleware/requireAdmin`.

## TASK-M10: Lens-options routes
- Component: server
- Status: TODO
- Depends: TASK-M03, TASK-M05
- Files: `server/src/routes/lensOptions.routes.ts`
- Description: Port from `web/src/app/api/lens-options/route.ts`. `GET /` — list lens options, public. `POST /` — create lens option, **gate with `requireAdmin` middleware inline** (closes audit gap §8.4, was unauthenticated before).

## TASK-M11: Users routes (top-level, unauth)
- Component: server
- Status: TODO
- Depends: TASK-M03
- Files: `server/src/routes/users.routes.ts`
- Description: Port from `web/src/app/api/users/route.ts`. `GET /` — list users, **unauthenticated, exactly matching current behavior** (plan §0 — port as-is, flagged as backlog hardening only, not fixed in this migration). Distinct from `/api/admin/users` (TASK-M19).

## TASK-M12: Cart routes
- Component: server
- Status: TODO
- Depends: TASK-M03, TASK-M05
- Files: `server/src/routes/cart.routes.ts`
- Description: Port from `web/src/app/api/cart/route.ts`, `web/src/app/api/cart/[itemId]/route.ts`, `web/src/app/api/cart/apply-coupon/route.ts`. Router mounted under `requireAuth` at the `app.ts` level (TASK-M07), so `req.user` is always populated here. `GET /` — get current user's cart (one doc per user via `Cart` model). `POST /` — add item to cart. `PUT /:itemId` — update cart item (e.g. quantity/lens selection). `DELETE /:itemId` — remove cart item. `POST /apply-coupon` — validates and applies a coupon code to the cart (uses `Coupon` model).

## TASK-M13: Orders routes
- Component: server
- Status: TODO
- Depends: TASK-M03, TASK-M05
- Files: `server/src/routes/orders.routes.ts`
- Description: Port from `web/src/app/api/orders/route.ts` and `web/src/app/api/orders/[id]/route.ts`. Mounted under `requireAuth`. `GET /` — list current user's orders. `POST /` — create order from cart (pricing, address, payment per `Order` model `items[]`/status pipeline). `GET /:id` — get single order by id, scoped to the requesting user (verify ownership, return 403/404 if not owner unless admin).

## TASK-M14: Prescriptions routes
- Component: server
- Status: TODO
- Depends: TASK-M03, TASK-M05
- Files: `server/src/routes/prescriptions.routes.ts`
- Description: Port from `web/src/app/api/prescriptions/route.ts`. Mounted under `requireAuth`. `GET /` — list current user's prescriptions. `POST /` — create prescription (RE/LE power, uploadedFile, verification status per `Prescription` model).

## TASK-M15: Coupons routes
- Component: server
- Status: TODO
- Depends: TASK-M03, TASK-M05
- Files: `server/src/routes/coupons.routes.ts`
- Description: Port from `web/src/app/api/coupons/validate/route.ts`. Mounted under `requireAuth`. `POST /validate` — validates a coupon code against `Coupon` model rules (discount rules, usage limits) and returns the discount details or an error if invalid/expired/exhausted.

## TASK-M16: Admin products routes
- Component: server
- Status: TODO
- Depends: TASK-M03, TASK-M05
- Files: `server/src/routes/admin/products.routes.ts`
- Description: Port from `web/src/app/api/admin/products/route.ts` and `web/src/app/api/admin/products/[id]/route.ts`. Mounted under parent `/api/admin` which already has `requireAdmin` applied at `app.ts` level (TASK-M07) — no need to re-gate here. `GET /` — list all products (admin view, may include more fields than public listing). `POST /` — create product. `GET /:id` — get product by id (admin view). `PUT /:id` — update product. `DELETE /:id` — delete product.

## TASK-M17: Admin inventory routes
- Component: server
- Status: TODO
- Depends: TASK-M03, TASK-M05
- Files: `server/src/routes/admin/inventory.routes.ts`
- Description: Port from `web/src/app/api/admin/inventory/route.ts`. `GET /` — return inventory/stock view across products (admin-only, gated by parent mount).

## TASK-M18: Admin orders routes
- Component: server
- Status: TODO
- Depends: TASK-M03, TASK-M05
- Files: `server/src/routes/admin/orders.routes.ts`
- Description: Port from `web/src/app/api/admin/orders/route.ts` and `web/src/app/api/admin/orders/[id]/route.ts`. `GET /` — list all orders (admin view). `GET /:id` — get single order by id (admin view, no ownership restriction). `PUT /:id` — update order (status update and any other fields the old handler supported — confirm body schema against the original `route.ts` source during implementation; all the old separate sub-action endpoints like tracking/refund/notes are collapsed into this single PUT per plan §0/§7, do not add separate routes for them).

## TASK-M19: Admin users routes
- Component: server
- Status: TODO
- Depends: TASK-M03, TASK-M05
- Files: `server/src/routes/admin/users.routes.ts`
- Description: Port from `web/src/app/api/admin/users/route.ts`. `GET /` — list all users (admin view), gated by parent `/api/admin` `requireAdmin` mount. Distinct from the unauthenticated top-level `/api/users` (TASK-M11) — do not merge these.

## TASK-M20: Admin stats routes
- Component: server
- Status: TODO
- Depends: TASK-M03, TASK-M05
- Files: `server/src/routes/admin/stats.routes.ts`
- Description: Port from `web/src/app/api/admin/stats/route.ts`. `GET /` — return dashboard KPI stats (aggregate counts/sums across `Order`, `User`, `Product` etc. matching the original handler's aggregation logic).

## TASK-M21: Admin router index (mounts all admin sub-routers)
- Component: server
- Status: TODO
- Depends: TASK-M16, TASK-M17, TASK-M18, TASK-M19, TASK-M20
- Files: `server/src/routes/admin/index.ts`
- Description: Create an Express `Router` in `server/src/routes/admin/index.ts` that mounts: `router.use('/products', productsRoutes)`, `router.use('/inventory', inventoryRoutes)`, `router.use('/orders', ordersRoutes)`, `router.use('/users', usersRoutes)`, `router.use('/stats', statsRoutes)`. Export this combined router as the `adminRoutes` imported by `app.ts` (update TASK-M07's `app.ts` import target to this index file if not already pointed there).

## TASK-M22: Seed script port
- Component: server
- Status: TODO
- Depends: TASK-M03, TASK-M02
- Files: `server/src/scripts/seed.ts`
- Description: Port `web/src/scripts/seed.ts` verbatim into `server/src/scripts/seed.ts`, importing models from `../models/*` (new relative paths) and `connectDB` from `../lib/mongodb`. Script connects to Mongo, creates lens options, 6 products, and 1 admin user (phone `9999999999`). Runnable via `npx tsx src/scripts/seed.ts` from `/server` (matches `npm run seed` script defined in TASK-M01's `package.json`).

## TASK-M23: Frontend Vite scaffold + Tailwind + theme tokens
- Component: frontend
- Status: TODO
- Depends: none
- Files: `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/tailwind.config.ts`, `frontend/.env`, `frontend/.env.example`, `frontend/index.html`, `frontend/src/main.tsx`, `frontend/src/index.css`
- Description: Scaffold a Vite + TypeScript + React project at `/frontend`. Deps: `react`, `react-dom`, `react-router-dom`, `axios`; devDeps: `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss` (v4), `@types/react`, `@types/react-dom`. `frontend/.env` sets `VITE_API_URL=http://localhost:5000/api`. `index.css` ports tailwind directives + theme tokens from `web/src/app/globals.css`: background `#0D0D0D`, card `#1A1A1A`, gold accent token `goldAccent: #C9A84C` (keep the value already in code, do not switch to `#D4922A` per plan §2.5 — flagged for design confirmation but not a migration blocker). `main.tsx` renders `<App />` into `#root` from `index.html`.

## TASK-M24: Axios API client
- Component: frontend
- Status: TODO
- Depends: TASK-M23
- Files: `frontend/src/lib/api.ts`
- Description: Create `frontend/src/lib/api.ts`:
  ```ts
  import axios from 'axios';
  export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,   // required so eyeglaze_auth cookie is sent cross-origin
  });
  ```
  All page/component data-fetching (TASK-M30+) must import and use this `api` instance rather than calling `axios` or `fetch` directly, so cookies are consistently attached.

## TASK-M25: AuthContext + ProtectedRoute
- Component: frontend
- Status: TODO
- Depends: TASK-M24
- Files: `frontend/src/context/AuthContext.tsx`, `frontend/src/routes/ProtectedRoute.tsx`
- Description: `AuthContext.tsx` — React context providing `{ user, loading, login(user), logout() }`. On mount, calls `GET /auth/me` via the `api` client from TASK-M24 to populate `user` (or `null`). Exposes a `useAuth()` hook. `ProtectedRoute.tsx` — wrapper component accepting children and an optional `requireAdmin` prop; reads `useAuth()`; while `loading`, render a loading state; if no `user`, redirect to `/login` (`<Navigate to="/login" />`); if `requireAdmin` is true and `user.role` is not in `['admin','store_manager','support_agent']`, redirect to `/login`. This explicitly replaces the page-guard half of `web/src/middleware.ts` that disappears once Express stops serving pages (audit §8.1, plan §2.3).

## TASK-M26: React Router setup (App.tsx with all routes)
- Component: frontend
- Status: TODO
- Depends: TASK-M25
- Files: `frontend/src/App.tsx`
- Description: Create `App.tsx` wrapping the route tree in `<BrowserRouter>` and `<AuthProvider>` (from TASK-M25). Define routes exactly per plan §2.3:
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
  Pages and layouts referenced here are created in TASK-M27–M40; this task can use placeholder imports that get filled in as those tasks land, but the routing structure itself must be complete and correct now.

## TASK-M27: Shared UI components ported (GoldButton, DarkCard, OtpInput, ProductCard, StarRating, StatusBadge)
- Component: frontend
- Status: TODO
- Depends: TASK-M23
- Files: `frontend/src/components/ui/DarkCard.tsx`, `frontend/src/components/ui/GoldButton.tsx`, `frontend/src/components/ui/OtpInput.tsx`, `frontend/src/components/ui/ProductCard.tsx`, `frontend/src/components/ui/StarRating.tsx`, `frontend/src/components/ui/StatusBadge.tsx`
- Description: Port each component verbatim from `web/src/components/ui/*.tsx` into `frontend/src/components/ui/*.tsx`. Per plan §2.6 pre-port check: grep each file for `next/image` and `next/link` imports and replace with plain `<img>` and React Router `<Link>` respectively (confirmed by audit §5 that none currently use these, but re-verify during the actual port). Also check for any `"use client"` directives and strip them (no-op in Vite).

## TASK-M28: Relocated components (ProductFilters, AddToCartButton)
- Component: frontend
- Status: TODO
- Depends: TASK-M23, TASK-M24
- Files: `frontend/src/components/ProductFilters.tsx`, `frontend/src/components/AddToCartButton.tsx`
- Description: Port `web/src/app/(user)/products/ProductFilters.tsx` to `frontend/src/components/ProductFilters.tsx` and `web/src/app/(user)/products/[id]/AddToCartButton.tsx` to `frontend/src/components/AddToCartButton.tsx` (audit §8.9 — these were co-located route-folder components in Next.js App Router convention, not actual routes; relocate to a conventional `components/` directory). Replace any `next/image`/`next/link` usage and update API calls to use the `api` client from TASK-M24.

## TASK-M29: Layouts (RootLayout, UserLayout, AdminLayout)
- Component: frontend
- Status: TODO
- Depends: TASK-M25
- Files: `frontend/src/layouts/RootLayout.tsx`, `frontend/src/layouts/UserLayout.tsx`, `frontend/src/layouts/AdminLayout.tsx`
- Description: `RootLayout.tsx` replaces `web/src/app/layout.tsx`'s html-shell concerns (now mostly handled by `index.html` + this wrapper for any shared chrome). `UserLayout.tsx` replaces `web/src/app/(user)/layout.tsx` (user-facing nav/header/footer wrapper, renders `<Outlet />` for nested routes). `AdminLayout.tsx` replaces `web/src/app/(admin)/layout.tsx` (admin sidebar/nav wrapper, renders `<Outlet />`). Port styling/structure verbatim from the corresponding Next.js layout files, removing any Next-specific APIs.

## TASK-M30: Landing page
- Component: frontend
- Status: TODO
- Depends: TASK-M27, TASK-M29
- Files: `frontend/src/pages/Landing.tsx`
- Description: Port `web/src/app/page.tsx` to `frontend/src/pages/Landing.tsx`. Replace `next/image`/`next/link` if present, strip `"use client"`, move any server-only data fetching into a `useEffect` using the `api` client (TASK-M24).

## TASK-M31: Login page
- Component: frontend
- Status: TODO
- Depends: TASK-M24, TASK-M27
- Files: `frontend/src/pages/Login.tsx`
- Description: Port `web/src/app/login/page.tsx` to `frontend/src/pages/Login.tsx`. Form collects phone/countryCode or email, calls `POST /auth/send-otp` via the `api` client, then navigates to `/login/otp` (passing identifying info via route state or query param as the original page did).

## TASK-M32: LoginOtp page
- Component: frontend
- Status: TODO
- Depends: TASK-M24, TASK-M25, TASK-M27
- Files: `frontend/src/pages/LoginOtp.tsx`
- Description: Port `web/src/app/login/otp/page.tsx` to `frontend/src/pages/LoginOtp.tsx`. Uses `OtpInput` component (TASK-M27), calls `POST /auth/verify-otp`, on success updates `AuthContext` (TASK-M25) with returned user and navigates to `/` or `/account`. For Flutter parity reasoning this is web-only but should store any token similarly if the web flow needs it (web relies on the httpOnly cookie set server-side; no manual token storage needed client-side for web).

## TASK-M33: Products listing page
- Component: frontend
- Status: TODO
- Depends: TASK-M24, TASK-M27, TASK-M28, TASK-M29
- Files: `frontend/src/pages/Products.tsx`
- Description: Port `web/src/app/(user)/products/page.tsx` to `frontend/src/pages/Products.tsx`. Fetches `GET /products` with query filters (category/search/sort/page/limit) via `api` client, renders `ProductCard` (TASK-M27) grid and `ProductFilters` (TASK-M28).

## TASK-M34: ProductDetail page
- Component: frontend
- Status: TODO
- Depends: TASK-M24, TASK-M27, TASK-M28, TASK-M29
- Files: `frontend/src/pages/ProductDetail.tsx`
- Description: Port `web/src/app/(user)/products/[id]/page.tsx` to `frontend/src/pages/ProductDetail.tsx`. Uses `useParams()` for `:id`, fetches `GET /products/:id` and `GET /lens-options` via `api` client, renders `AddToCartButton` (TASK-M28) and `StarRating` (TASK-M27).

## TASK-M35: Cart page
- Component: frontend
- Status: TODO
- Depends: TASK-M24, TASK-M25, TASK-M27, TASK-M29
- Files: `frontend/src/pages/Cart.tsx`
- Description: Port `web/src/app/(user)/cart/page.tsx` to `frontend/src/pages/Cart.tsx`. Fetches `GET /cart`, supports updating quantity (`PUT /cart/:itemId`), removing items (`DELETE /cart/:itemId`), and applying coupons (`POST /cart/apply-coupon`) via `api` client. Wrapped by `ProtectedRoute` at the router level (TASK-M26), not internally.

## TASK-M36: Orders page (user)
- Component: frontend
- Status: TODO
- Depends: TASK-M24, TASK-M25, TASK-M27, TASK-M29
- Files: `frontend/src/pages/Orders.tsx`
- Description: Port `web/src/app/(user)/orders/page.tsx` to `frontend/src/pages/Orders.tsx`. Fetches `GET /orders` for current user's order list, renders `StatusBadge` (TASK-M27) per order.

## TASK-M37: Account page
- Component: frontend
- Status: TODO
- Depends: TASK-M24, TASK-M25, TASK-M29
- Files: `frontend/src/pages/Account.tsx`
- Description: Port `web/src/app/(user)/account/page.tsx` to `frontend/src/pages/Account.tsx`. Displays current user info from `AuthContext` (TASK-M25), any profile fields the old page rendered. Note known gap: do NOT call `/profile` — that route does not exist server-side and is out of scope (plan §3.3) — if the old page called it, drop/stub that specific data fetch and rely only on `/auth/me` data already in context.

## TASK-M38: Admin Dashboard page
- Component: frontend
- Status: TODO
- Depends: TASK-M24, TASK-M25, TASK-M29
- Files: `frontend/src/pages/admin/Dashboard.tsx`
- Description: Port `web/src/app/(admin)/admin/dashboard/page.tsx` to `frontend/src/pages/admin/Dashboard.tsx`. Fetches `GET /admin/stats` via `api` client (cookie sent automatically due to `withCredentials`), renders KPI cards.

## TASK-M39: Admin Products page
- Component: frontend
- Status: TODO
- Depends: TASK-M24, TASK-M25, TASK-M27, TASK-M29
- Files: `frontend/src/pages/admin/Products.tsx`
- Description: Port `web/src/app/(admin)/admin/products/page.tsx` to `frontend/src/pages/admin/Products.tsx`. Lists products via `GET /admin/products`, supports create (`POST /admin/products`), update (`PUT /admin/products/:id`), delete (`DELETE /admin/products/:id`) via `api` client. This is the page used for the "Admin add-product flow E2E" verification task (TASK-M48).

## TASK-M40: Admin Orders page
- Component: frontend
- Status: TODO
- Depends: TASK-M24, TASK-M25, TASK-M27, TASK-M29
- Files: `frontend/src/pages/admin/Orders.tsx`
- Description: Port `web/src/app/(admin)/admin/orders/page.tsx` to `frontend/src/pages/admin/Orders.tsx`. Lists orders via `GET /admin/orders`, view detail via `GET /admin/orders/:id`, update status/fields via `PUT /admin/orders/:id`, renders `StatusBadge` (TASK-M27).

## TASK-M41: Admin Inventory page
- Component: frontend
- Status: TODO
- Depends: TASK-M24, TASK-M25, TASK-M29
- Files: `frontend/src/pages/admin/Inventory.tsx`
- Description: Port `web/src/app/(admin)/admin/inventory/page.tsx` to `frontend/src/pages/admin/Inventory.tsx`. Fetches `GET /admin/inventory` via `api` client, renders stock view table.

## TASK-M42: Admin Users page
- Component: frontend
- Status: TODO
- Depends: TASK-M24, TASK-M25, TASK-M29
- Files: `frontend/src/pages/admin/Users.tsx`
- Description: Port `web/src/app/(admin)/admin/users/page.tsx` to `frontend/src/pages/admin/Users.tsx`. Fetches `GET /admin/users` via `api` client, renders customer list table.

## TASK-M43: Mobile — update app_config.dart base URL to port 5000
- Component: mobile
- Status: TODO
- Depends: none
- Files: `mobile/lib/core/app_config.dart`
- Description: Change `AppConfig.baseUrl` getter: Android emulator branch from `http://10.0.2.2:3000/api` to `http://10.0.2.2:5000/api`; iOS/default branch from `http://localhost:3000/api` to `http://localhost:5000/api`. Only the port changes (3000 → 5000); path structure (`/api/...`) stays identical since Express mounts routes at the same paths.

## TASK-M44: Mobile — verify auth header flow against new Express server
- Component: mobile
- Status: TODO
- Depends: TASK-M43, TASK-M05, TASK-M08
- Files: `mobile/lib/services/api_service.dart` (verification only, no code change expected)
- Description: Confirm `_getHeaders()` in `api_service.dart` already sends `Authorization: Bearer $token` correctly (verified at ~line 18 per audit). No code change is expected here — the bug was entirely server-side (old `getAuthUser()` only read the cookie). This task is a verification step: run the Flutter app against the now-updated `baseUrl` (TASK-M43) and the new Express `requireAuth` middleware (TASK-M05, checks Bearer header first) and confirm protected calls (cart, orders, prescriptions, coupons) succeed where they previously silently failed (audit §6). Document pass/fail per endpoint.

## TASK-M45: Server smoke tests (all routes respond correctly)
- Component: server
- Status: TODO
- Depends: TASK-M07, TASK-M08, TASK-M09, TASK-M10, TASK-M11, TASK-M12, TASK-M13, TASK-M14, TASK-M15, TASK-M21, TASK-M22
- Files: `server/src/__tests__/` (or equivalent test directory per chosen test runner), all route files under `server/src/routes/`
- Description: Write and run smoke/integration tests covering: `requireAuth`/`requireAdmin` middleware (cookie-only, bearer-only, both-missing cases — expect 401/403 appropriately), and one happy-path request per route group (auth: send-otp/verify-otp/me/logout; products: GET list + GET by id + admin-gated POST/PUT/DELETE; lens-options: GET + admin-gated POST; users: GET unauth; cart: GET/POST/PUT/DELETE/apply-coupon under requireAuth; orders: GET/POST/GET-by-id under requireAuth; prescriptions: GET/POST under requireAuth; coupons: POST validate under requireAuth; admin/products, admin/inventory, admin/orders, admin/users, admin/stats — all under requireAdmin). Run against a seeded local Mongo (TASK-M22) or a test DB. All routes must return correct status codes and response shapes matching the old Next.js handlers' contracts (audit §2 table).

## TASK-M46: Frontend build verification
- Component: frontend
- Status: TODO
- Depends: TASK-M26, TASK-M30, TASK-M31, TASK-M32, TASK-M33, TASK-M34, TASK-M35, TASK-M36, TASK-M37, TASK-M38, TASK-M39, TASK-M40, TASK-M41, TASK-M42
- Files: `frontend/` (whole project)
- Description: Run `npm run build` (Vite + TypeScript compile) in `/frontend` and confirm it completes with zero TypeScript errors and zero Vite build errors. Fix any compile errors surfaced (missing imports, type mismatches from the porting process, leftover `next/image`/`next/link` references). Also manually click through all routes listed in TASK-M26 against the dev server (`npm run dev`) to confirm no runtime console errors on initial render of each page.

## TASK-M47: Flutter analyze
- Component: mobile
- Status: TODO
- Depends: TASK-M43
- Files: `mobile/` (whole project)
- Description: Run `flutter analyze` from `/mobile` and confirm 0 errors, matching the current baseline (per project knowledge base). Fix any analyzer issues introduced by the `app_config.dart` edit in TASK-M43 (should be none, but verify).

## TASK-M48: Connect Flutter to Express — manual flow test
- Component: mobile
- Status: TODO
- Depends: TASK-M44, TASK-M45
- Files: none (manual verification task)
- Description: With the Express server running on port 5000 (seeded per TASK-M22) and the Flutter app pointed at it (TASK-M43), manually run the Flutter app against an emulator/device and confirm: app launches, login OTP flow works end-to-end (`/auth/send-otp` + `/auth/verify-otp`), products list/detail load (`/products`, `/products/:id`, `/lens-options`), and previously-broken authenticated calls (cart, orders, prescriptions, coupons) now succeed using the Bearer token (confirms the fix from TASK-M05/M44 actually works in the full app, not just isolated header checks).

## TASK-M49: Admin add-product flow E2E
- Component: frontend
- Status: TODO
- Depends: TASK-M39, TASK-M45, TASK-M46
- Files: none (manual/E2E verification task)
- Description: With Express (port 5000) and the React frontend (port 5173) both running, log in as the seeded admin user (phone `9999999999`, OTP flow via `/login` + `/login/otp`), navigate to `/admin/products`, add a new product through the UI, and confirm: (a) the product is created via `POST /admin/products`, (b) it then appears in the public `GET /products` listing (verify via `/products` page or direct API call). This is the end-to-end flow check called out in plan §5 step 8.

## TASK-M50: User buy-with-lens flow E2E
- Component: frontend
- Status: TODO
- Depends: TASK-M33, TASK-M34, TASK-M35, TASK-M36, TASK-M45, TASK-M46
- Files: none (manual/E2E verification task)
- Description: With Express and React frontend running, as a regular (non-admin) user: log in via OTP, browse `/products`, open a product detail page, select lens options and add to cart (`AddToCartButton`, `POST /cart`), go to `/cart`, optionally apply a coupon (`POST /cart/apply-coupon`), place the order (`POST /orders`), and confirm it appears in `/orders` (`GET /orders`). This is the "buy with lens" end-to-end check called out in plan §5 step 8. Only after this AND TASK-M49 AND TASK-M48 all pass does `/web` become safe to archive/remove (explicitly deferred, not part of this migration per plan).
</content>
