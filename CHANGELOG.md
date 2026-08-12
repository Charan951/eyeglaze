# Changelog

Reconstructed from git history and diffs (most existing commit messages, e.g. "fix", "hi", "yhjb", carry no information — entries below summarize what actually changed in each date's commits).

## 2026-08-05
- Reworked the category admin experience: `admin/categories/Wizard.tsx`, `index.tsx`, `tree.tsx` plus `categories.controller.ts` (customer + admin) and the `SubCategory`/`SubSubCategory`/`SubSubSubCategory` models, backed by a new `seedHierarchy.ts` script.
- Admin/user layout and `Products.tsx` adjustments to match the updated category hierarchy.

## 2026-08-03
- Product detail and lens-selection flow fixes (`ProductDetail.tsx`, `LensSelection.tsx`).

## 2026-07-30
- Added frame **shapes** as a browsable/filterable dimension: new `Shape` model, `shapes.controller.ts`/`shapes.routes.ts` (customer + admin), admin shapes wizard, and shape artwork (aviator, cat-eye, clubmaster, geometric, rectangle, round) served from both `frontend/public` and `server/public`.
- Added **kids age group** taxonomy (`KidsAgeGroup` model + admin controller, kids category imagery, `seed-homepage-subcategories.ts`).
- Broad product/category model updates (`Product`, `Category`, `CategoryAttribute`, `CategoryFilter`, `CategorySeo`, `Lens`, `LensType`, `Order`, `Cart`) alongside matching admin controllers.
- Mobile app updates for cart, checkout, home, order details, and products screens, plus new widget/model tests (`cart_item_model_test.dart`, `home_features_widget_test.dart`, `product_model_test.dart`).
- Coupon validation adjustments (`coupon.validation.ts`, `admin/coupons.controller.ts`).

## 2026-07-16
- Added `server/src/lib/regex.ts` and applied it across `admin/categories`, `admin/coupons`, `admin/products`, `admin/users`, and `products.controller.ts` (shared regex/sanitization helper, likely for safe search/filter queries).
- Large coupon/cart/checkout consistency pass: `couponEngine.ts`, `coupons.controller.ts` (customer + admin), `cart.controller.ts`, `orders.controller.ts`, `cashbackCampaigns.controller.ts`, with new tests `couponEngine.test.ts` and `membershipBogoVoucher.test.ts` (membership BOGO voucher behavior).
- Added Redis-backed caching: `config/redis.ts`, `middleware/cache.ts`.
- Added a batch of one-off operational scripts for inspecting/repairing specific users' carts and orders (`add_vikas_to_naga_cart.ts`, `fix_naga_order.ts`, `fix_user_likki.ts`, `simulate_order.ts`, `migrate_addresses.ts`, and various `list_*`/`check_*` scripts).
- Housekeeping planning docs added/edited at repo root (`architecture.md`, `design.md`, `phases.md`, `prd.md`, `rules.md`).
- Deploy fix: run `npm install --include=dev` in the Jenkins pipeline so TypeScript/build devDependencies are installed on the deploy target.

## 2026-07-15
- Cart/product model changes (`Cart.ts`, `Product.ts`) plus corresponding `cart.controller.ts`/`products.controller.ts`/`orders.controller.ts`/`admin/orders.controller.ts`/`admin/users.controller.ts` updates.
- Added `ai.service.ts` and `ai.routes.ts` — AI chat assistant backend, paired with the mobile `ai_chat_sheet.dart` widget.
- Sizeable mobile app pass: account screens (blogs, rate us, sessions, support, ticket detail), auth/login, cart/checkout, home/reels viewer, lens power, product detail, splash, plus `api_service.dart` and `cart_provider.dart` updates.
- Added membership hero artwork and `Membership.tsx` updates.
- Several cart-debugging scripts and JSON dumps added under `server/` (`check-cart-output.json`, `check-cart-utf8.json`, `test-cart-calc.ts`, `test-membership.ts`, `test-membership-api.ts`) — operational/debug tooling, not app code.

## 2026-07-14
- Admin controller/route wiring for banners, categories, homepage videos, lens options, products, and reels, plus `redis.ts` caching config.
- Checkout/cart/lens-selection/product-detail page fixes; `AddProductWizard.tsx` updates.
- Added `EyeGlaze_Color_Palette_Guide.pdf` and planning docs (`architecture.md`, `design.md`, `phases.md`, `prd.md`, `rules.md`).
- `Cart`/`Order` model updates and `seed.ts`/`seedRealData.ts` script changes.

## 2026-07-13
- Auth/session refresh: `AuthContext.tsx`, `auth.controller.ts`, `User.ts`, `Session`-adjacent flows.
- Added admin stats and upload controllers (`admin/stats.controller.ts`, `admin/upload.controller.ts`) and wired `admin/users.routes.ts`.
- Coupon validation and `Order`/`Product` model tweaks; lens type/lens checks via new `check-lenstypes.ts`/`check-vikas.ts` scripts.
- `Banner` model and `admin/banner.controller.ts` introduced/refined; `upload.controller.ts` for media uploads.
- Frontend admin pages broadly touched (Banners, Coupons, Dashboard, Inventory, Orders, Products, Tickets, Users) alongside package upgrades (`frontend/package.json`, `server/package.json`).
- Mobile membership screen added (`membership_screen.dart`).

## 2026-07-10
- Cart and landing page fixes.

## 2026-07-09
- Banner CRUD introduced end-to-end (`Banner` model, `banner.controller.ts`, `admin/banner.controller.ts`, `banners.routes.ts`, `admin/banners.routes.ts`) plus an integration test (`apiIntegration.test.ts`).
- AdminLayout/Landing/AuthContext updates.

## 2026-07-06
- Major coupons & promotions build-out: `Coupon`, `CouponAnalytics`, `CouponUsage`, `CustomerCoupon`, `GiftCoupon`, `ReferralCoupon`, `Promotion`, `PromotionRule`, `PromotionHistory`, `WalletTransaction`, `NavigationMenu` models; `couponEngine.ts` service and `couponEngine.test.ts`; coupon controllers/routes (customer + admin).
- Reels feature added (`Reel` model, `reel.controller.ts`/`admin/reel.controller.ts`, `reels.routes.ts`/`admin/reels.routes.ts`), homepage video admin controller, order admin controller.
- Lens types/lenses admin controllers and `Lens.ts` model refined; checkout/lens-selection page updates.
- Frontend pages broadly updated for the new coupon/lens/reel features (Checkout, Landing, LensSelection, Offers, OrderDetail, Orders, ProductDetail, admin Coupons/HomepageVideos/Lenses/Orders/Reels); mobile home, lens-type, and orders screens updated to match.

## 2026-06-27
- Homepage video controller split into customer/admin variants; upload controller updates.
- Auth/login/OTP flow work (`AuthContext.tsx`, `Login.tsx`, `LoginOtp.tsx`) and `auth.controller.ts`/`inventory.controller.ts` changes.
- Mobile app rebrand: new Android/iOS app icons and launcher assets, `main.dart`, and a large batch of new/updated screens (prescriptions, lens checkout/power/quality, orders, products, wishlist, splash) plus `api_service.dart`/`cart_provider.dart`.

## 2026-06-25
- Category hierarchy and lens-type work: `LensType.ts`, `Product.ts`, `User.ts` models; `categories.controller.ts` (customer + admin), admin categories Wizard/index/tree pages; product listing/filter fixes (`ProductFilters.tsx`, `Products.tsx`, `products.controller.ts`); data-repair scripts (`fix_genders.ts`, `check_cats.ts`, `check_prods.ts`, `seed-new-categories.ts`, `update_brands.ts`).
- Mobile: prescriptions, saved addresses, support, checkout, home, and lens screens (power/quality/type) plus new lens wizard widgets (`lens_step_bar.dart`, `lens_wizard_state.dart`) and `socket_service.dart`.

## 2026-06-24
- Coupons introduced on the customer side (`Coupon.ts`, `coupons.controller.ts`/`admin/coupons.controller.ts`, `coupons.routes.ts`/`admin/coupons.routes.ts`, `seedCoupons.ts`) alongside `Order.ts` updates.
- Storefront visual pass: Footer, ProductCard, index.css, AdminLayout/CustomerLayout/UserLayout, and most customer-facing pages (Cart, Checkout, Landing, LensSelection, Offers, OrderDetail, Payments, ProductDetail, Products, Profile, SavedPowers) plus a new `AboutEyeglaze.tsx` page and promotions hero art.
- Matching mobile screens added for account (contact, offers, support, wallet), auth (forgot/reset password, login), cart/checkout, home, and products.

## 2026-06-23
- Auth system built out: `Session` model, `lib/auth.ts`, `requireAuth` middleware, `auth.controller.ts`/`auth.routes.ts`, plus Login/LoginOtp/ForgotPassword/ResetPassword/Profile pages.
- Prescriptions feature added (`Prescription` model, `prescriptions.controller.ts`/`routes.ts`).
- Category/lens data model iteration, including short-lived `ChildCategory`/`Collection` models (superseded later by the Sub/SubSub/SubSubSub category hierarchy) and `CategoryAttribute`/`CategoryFilter`/`CategorySeo`.
- Dynamic product imagery and `seedDynamicProducts.ts`/`seedRealData.ts` seeding scripts added.
- Numerous verification/debug scripts added (`verifyCategoryApi.ts`, `verifyDb.ts`, `verifyWizardApi.ts`, `client-fetch.ts`, `db-check.ts`, `test-save.ts`, `test-update-api.ts`).

## 2026-06-22
- Category admin tooling expanded with a menu builder (`admin/categories/menu-builder.tsx`).
- Checkout/payments/wallet pages and admin inventory/products pages updated.
- Mobile design references added under `mobile/.stitch/` (design specs and reference screenshots for home and product-detail screens) — design source material, not shipped app code.

## 2026-06-20 and earlier
- `feat: redesign product detail page for mobile and web frontend` (6508e61) — cross-platform product detail redesign.
- `chore: untrack build and tool directories and add root gitignore` (ac1b5c8) — repo hygiene, stopped tracking build artifacts.
- Jenkins/CI: SSH host update and Rocket.Chat deployment notifications added to the Jenkins pipeline (d199c3c, f6fae89, 2d81316).
- Initial mobile app scaffold committed (9f8270a and prior history).

---
**Note on process**: recent commit messages in this repo (`fix`, `hi`, `g8`, `yhjb`, date-only strings, etc.) do not describe their changes. For this file to stay useful going forward, please write commit messages that name the actual change (e.g. `fix(coupons): apply BOGO discount before tax` rather than `fix`).
