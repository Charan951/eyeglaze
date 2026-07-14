# Product Requirements Document (PRD): EyeGlaze Eyewear

## 1. Overview & Value Proposition
EyeGlaze is a premium direct-to-consumer (D2C) e-commerce platform specializing in high-quality eyewear, frames, and prescription lenses. The platform is designed to provide users with a seamless, visually stunning shopping experience that simplifies the complex process of purchasing prescription glasses online. 

By integrating a dynamic lens selection wizard, optical prescription storage (Saved Powers), cashback loyalty programs, custom coupon validations, and a VIP membership tier, EyeGlaze bridges the gap between digital convenience and physical optical retail.

---

## 2. User Personas
* **The Regular Customer (Shopper):** Looking for trendy, high-quality, and reasonably priced frames, requiring a simple way to configure lenses (e.g., blue light filters, anti-glare) and supply their optical prescription without errors.
* **The VIP Member (Loyalist):** Frequent buyer or someone purchasing for a family, leveraging the VIP Gold Membership to access member-only promotions, flat wallet cashbacks, and free shipping.
* **The Store Administrator / Manager:** Needs administrative tools to manage inventory, configure complex discount schemas (coupons/cashback), update homepage media content, resolve customer tickets, and track store sales metrics.

---

## 3. Core Feature Requirements

### 3.1. Authentication & Security
* **Dual Login Flows:** 
  * Traditional Email and Password login/registration.
  * Passwordless verification via Mobile number or Email utilizing a secure 6-digit One-Time Password (OTP).
* **Account Lockout Policy:** 
  * Standard accounts must be locked for 15 minutes after 5 consecutive failed password attempts to mitigate brute-force attacks.
  * System administrators, store managers, and support agents are exempt from login lockouts to ensure uninterrupted store management.
* **Session Management:** Hashed refresh tokens stored in the database map to active user agent sessions, allowing remote logout and session invalidation.

### 3.2. Product Catalog & Customization
* **Dynamic Grid Catalog:** Browse sunglasses, prescription frames, and lenses with multi-layered filtering (price, categories, subcategories, brand, material, color, lens options).
* **Lens Selection Wizard:** A structured multi-step flow allowing users to:
  1. Select lens type (e.g., Single Vision, Bifocal/Progressive, Zero Power).
  2. Select lens materials/coatings (e.g., anti-reflective, scratch-resistant, blue-light blocking, photochromic transitions).
  3. Enter optical prescription details or select a previously saved profile.
* **Saved Powers (Prescriptions):** Users can save and manage prescriptions for spherical power (SPH), cylindrical power (CYL), Axis, Pupil Distance (PD), and Addition (ADD) for both left and right eyes.
* **Interactive Size Finder Tool:** An integrated utility helper inside the Product Detail page assisting shoppers to find their perfect frame size:
  * *Size Chart:* Displays standard measurements for Small, Medium, and Large temple sizes.
  * *Face Scanner (Simulated VTO):* Uses the user's camera to run a face-scanning overlay that measures temple-to-temple width and estimates Pupil Distance (PD).
  * *Specification Calculator:* Lets users input sizing numbers from their current glasses (e.g., 52 [] 18 140) to automatically calculate and apply the matching frame size.

### 3.3. Transaction Flow, Wallet & Loyalty
* **Shopping Cart & Checkout:** Persistent database cart for logged-in accounts, supporting real-time recalculations for items, taxes, shipping fees, and active discounts.
* **Digital Wallet & Transactions:**
  * Every user gets a digital wallet for store credit.
  * Support for cashback campaigns that automatically credit a percentage or flat amount back to the wallet upon successful checkout.
  * Quick checkout capability utilizing wallet balance.
* **VIP Gold Membership:** A paid monthly/yearly loyalty program that immediately unlocks exclusive member perks (free shipping, premium coupons, priority support).

### 3.4. Coupon & Promotion Engine
* **Context-Aware Validations:** Coupons must dynamically validate against:
  * Minimum/maximum cart order values.
  * User-specific limits (e.g., single-use, first-time user).
  * Specific eligible categories, subcategories, or product brands.
  * Required payment/shipping methods and geographical locations (country/state/city).
  * VIP Gold Membership verification.
* **Promo Types:** Flat cash discounts, percentage-based discounts, wallet cashback campaigns, and gift coupons.

### 3.5. Customer Support & Media Engagement
* **Ticketing System:** Customers can file support tickets for orders, refunds, or product inquiries.
* **Real-time Live Chat:** Integrates socket communication so customers can converse with support agents directly within the ticket detail page.
* **Interactive Media (CMS):** Showcase product trends using high-quality background banners, homepage video widgets, and vertical short-form "Reels" similar to social media.

### 3.6. Administrative Back-Office (CMS/OMS)
* **Stats Dashboard:** Live metrics tracking revenue, pending orders, user signups, and support ticket queues.
* **Add Product Wizard:** A step-by-step product creation tool to manage image file uploads, pricing variants (color/size combinations), and warehouse inventory levels.
* **Navigation Menu & Category Tree Builders:** Administrative tools to reorganize store departments and menus dynamically without modifying codebase layouts.

---

## 4. Non-Functional Requirements
* **Aesthetics:** Sleek dark-mode interface utilizing premium gold (`#D4A04D`) branding accents, glassmorphic card overlays, and subtle Framer Motion micro-animations.
* **Responsiveness:** Fluid grid structures optimized for mobile screens (matching Flutter app parameters) and desktop widescreen monitors.
* **Performance:** Swift initial content loads, image-size optimization (using Sharp on server, WebP assets), and fast checkout transaction processing.
* **SEO:** Semantic HTML tags, structured product headings, unique DOM element IDs for automated end-to-end testing, and a dynamically generated XML sitemap `/sitemap.xml` listing all active products.
