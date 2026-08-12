# EyeGlaze — Knowledge Base

Eyeglaze is a full-stack eyewear e-commerce platform: web storefront + admin panel, a REST API backend, and a Flutter mobile app, all sharing the same MongoDB data model.

## Repository layout

```
eyeglaze/
├── frontend/   React 19 + Vite + TypeScript storefront and admin panel
├── server/     Express 5 + Mongoose 9 REST API
├── mobile/     Flutter app (iOS/Android/desktop/web targets)
├── brain/      project notes / scratch docs
├── scratch/    scratch working files
└── jenkins     Jenkins pipeline definition (CI/CD)
```

## Frontend (`frontend/`)

- **Stack**: React 19, React Router 7, Vite 8, TypeScript, Tailwind CSS 4, Zod, React Hook Form, Framer Motion, Axios, Socket.IO client.
- **Layouts**: `src/layouts/UserLayout.tsx` (customer-facing shell), `src/layouts/CustomerLayout.tsx`, `src/layouts/AdminLayout.tsx` (admin panel shell).
- **Customer pages** (`src/pages/`): Landing, Products, ProductDetail, CategoriesPage, LensSelection, Cart, Checkout, Orders/OrderDetail, Wishlist, SavedAddresses, SavedPowers, Membership, Offers, Wallet, Payments, Account/Profile, auth flows (Login, LoginOtp, ForgotPassword, ResetPassword), support (SupportContact, SupportQuestions, Tickets), content pages (About, Blogs, Contact, Privacy, Terms, RateUs).
- **Admin pages** (`src/pages/admin/`): Dashboard, Products, AddProductWizard, Inventory, Orders, Users, Coupons, Banners, HomepageVideos, Reels, Lenses, Tickets, plus nested `categories/` and `shapes/` wizards (tree + wizard UI for hierarchical taxonomy).
- **Shared UI**: `src/components/ui/ProductCard.tsx`, `src/components/ProductFilters.tsx`, `src/components/AddToCartButton.tsx`, `src/components/Footer.tsx`, `src/components/SEO.tsx`, `src/components/BrandIcon.tsx`.
- **Cross-cutting**: `src/context/AuthContext.tsx` (auth/session state), `src/lib/api.ts` (Axios client), `src/lib/loaders.ts` (React Router data loaders), `src/lib/socket.ts` (Socket.IO client for realtime updates, e.g. order/cart sync).

## Backend (`server/`)

- **Stack**: Express 5, Mongoose 9, TypeScript run via `tsx`/`nodemon`, JWT auth (`jsonwebtoken` + `bcryptjs`), Redis-backed caching, Cloudinary/AWS S3 for media, Sharp for image processing, Socket.IO for realtime, Zod for validation.
- **Entry points**: `src/server.ts` boots HTTP server + Socket.IO, falls back to an in-memory MongoDB in development when `MONGODB_URI` is unset, and seeds the database on startup. `src/app.ts` wires up Express middleware and all route modules.
- **Domain models** (`src/models/`): Product family (`Product`, `ProductVariant`, `Brand`, `Category`/`SubCategory`/`SubSubCategory`/`SubSubSubCategory`, `CategoryAttribute`, `CategoryFilter`, `CategorySeo`, `KidsAgeGroup`, `Shape`), lens configuration (`Lens`, `LensOption`, `LensType`), commerce (`Cart`, `Order`, `Prescription`, `Review`, `Wishlist`-related), promotions/loyalty (`Coupon`, `CouponAnalytics`, `CouponUsage`, `CustomerCoupon`, `GiftCoupon`, `ReferralCoupon`, `CashbackCampaign`, `Promotion`, `PromotionRule`, `PromotionHistory`, `WalletTransaction`), content (`Banner`, `HomepageVideo`, `Reel`, `NavigationMenu`), support (`Ticket`), and platform (`User`, `Session`, `AuditLog`, `Warehouse`).
- **Controllers/Routes**: customer-facing controllers/routes live at the top level of `src/controllers` and `src/routes` (auth, products, cart, orders, prescriptions, coupons, wishlist, tickets, cashback campaigns, categories, shapes, lens options, AI assistant). Admin-only variants live under `src/controllers/admin/` and `src/routes/admin/` (products, inventory, users, orders, stats, upload, tickets, categories, homepage videos, banners, lens types, lenses, coupons, reels, shapes).
- **Middleware** (`src/middleware/`): `requireAuth`/`optionalAuth`, `requireAdmin`, `validate` (Zod schema validation), `cache` (Redis response caching).
- **Services** (`src/services/`): `couponEngine.ts` (core discount/coupon evaluation logic, unit-tested via `tests/couponEngine.test.ts` and `tests/membershipBogoVoucher.test.ts`), `ai.service.ts` (AI chat assistant backing `ai.routes.ts`).
- **CORS**: origin allow-list driven by `CLIENT_URL` env var, plus automatic allowances for localhost, the Android emulator loopback (`10.0.2.2`), and all origins in development mode.
- **Config/env** (`server/.env.example`): `PORT`, `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`, `CLIENT_URL` (comma-separated allow-list), `REDIS_URL`.
- **Scripts** (`src/scripts/`): database seeding (`seed.ts`, `seedAdmin.ts`, `seedRealData.ts`, `seedHierarchy.ts`, `seed-shapes.ts`, `seed-homepage-subcategories.ts`) plus a large collection of one-off data-repair/inspection scripts accumulated during development (cart fixes, user lookups, coupon listings, order simulation) — treat these as operational tooling, not part of the steady-state app.

## Mobile (`mobile/`)

- Flutter app mirroring the storefront: screens for home, products, product detail, cart, checkout, orders, lens power selection, account (profile, sessions, membership, blogs, rate us, support/tickets), auth, splash, and an AI chat sheet widget.
- `lib/services/api_service.dart` talks to the same Express backend; `lib/services/cart_provider.dart` manages cart state; `lib/core/app_config.dart` holds environment/config.
- Widget/unit tests live in `mobile/test/` (e.g. `cart_item_model_test.dart`, `product_model_test.dart`, `home_features_widget_test.dart`).

## Domain concepts worth knowing

- **Product taxonomy** is a 4-level hierarchy: Category → SubCategory → SubSubCategory → SubSubSubCategory, each with its own attributes/filters/SEO metadata, managed via an admin "wizard" + "tree" UI (`frontend/src/pages/admin/categories/`).
- **Frame shapes** (aviator, cat-eye, clubmaster, geometric, rectangle, round) are a first-class filterable/browsable dimension with dedicated images (`public/images/shapes/`) and admin CRUD (`Shape` model, `shapes.controller.ts`, admin shapes wizard).
- **Lens configuration** is decoupled from products: `Lens`, `LensType`, `LensOption` models let customers pick lens type/options during `LensSelection.tsx` / checkout.
- **Coupons & promotions** are a significant subsystem: generic coupons, gift coupons, referral coupons, cashback campaigns, membership BOGO vouchers, and a rules engine (`PromotionRule`/`PromotionHistory`) all funnel through `couponEngine.ts`.
- **Membership** (`Membership.tsx`, gold membership assets) grants perks such as BOGO vouchers, tested explicitly in `membershipBogoVoucher.test.ts`.
- **Realtime**: Socket.IO (`lib/socket.ts` on both client and server) is used to push live updates (e.g., cart/order state) to connected clients.

## Deployment / CI

- A Jenkins pipeline (`jenkins` file at repo root) builds and deploys the app, notifying a Rocket.Chat channel on deployment status. `npm install --include=dev` is required in the deploy step so TypeScript/build devDependencies are present.
- `server/tsconfig.tsbuildinfo` is a committed TypeScript incremental build cache (churns frequently in diffs — not meaningful signal for review).

## Working notes / gotchas

- Root-level `image copy*.png` files and stray docs (`architecture.md`/`archecture.md`, `design.md`, `phases.md`, `prd.md`, `rules.md`) appear to be ad hoc planning artifacts rather than maintained documentation — verify currency before relying on them.
- `NODE_ENV=development` without `MONGODB_URI` boots an ephemeral in-memory MongoDB (`config/inMemoryMongo.ts`) — data does not persist across restarts in that mode.
