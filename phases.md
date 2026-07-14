# Project Roadmap & Phases: EyeGlaze

The development of the EyeGlaze platform is structured into five distinct phases, moving from basic system configurations and standard core components to highly specialized optical wizards, loyalty marketing modules, administration suites, and optimized CI/CD scaling pipelines.

---

## Phase 1: Foundation & Core Services (MVP)
* **Goal:** Set up base projects, establish DB schemas, and enable secure user authentication.
* **Key Tasks:**
  * Scaffold `/frontend` with Vite + React + Tailwind v4 and `/server` with Express + TypeScript.
  * Initialize the MongoDB data models (`User`, `Session`, `Brand`, `Category`).
  * Implement base authentication APIs supporting standard password login/signup and passwordless verification using 6-digit OTP codes sent via SMS/Email.
  * Develop the front-end router layout containing user-facing routes, basic navigation bars, and basic page mockups.
  * Configure session middleware tracking refresh tokens inside a session collection to enable multi-device logging and lockout mechanisms.

---

## Phase 2: E-Commerce Funnel & Custom Lens Selection
* **Goal:** Implement the full e-commerce customer buying cycle, specifically tailoring the platform to purchase custom prescription lenses.
* **Key Tasks:**
  * Design a fully reactive Product Catalog grid equipped with faceted filtering options (price, brand, frame size, shape, material, gender).
  * Build the **Lens Selection Wizard**: A step-by-step UI workflow guiding users to choose lens types (e.g. single vision vs. zero power) and lens coatings (e.g. anti-glare, blue cut, transitions).
  * Design the **Saved Powers** interface, enabling users to input and store optical prescriptions (Spherical, Cylindrical, Axis, Pupil Distance, Addition) for quick access during lens configuration.
  * Develop the **Interactive Size Finder** tool, integrating a client-side camera scanner (WebRTC), card calibration guidelines for PD estimation, and a spec matcher to find standard frame fits.
  * Establish the local & database-backed shopping cart synchronization logic and checkout pages.

---

## Phase 3: Engagement, Loyalty & Promotion Systems
* **Goal:** Increase customer retention and lifetime value by introducing digital wallet services, cashback rules, and a promotion engine.
* **Key Tasks:**
  * Build the **Digital Wallet** sub-system, permitting transactions, refunds, and direct payments using store credit.
  * Create the **Cashback Campaigns** engine, which evaluates and rewards order cashbacks directly to the customer's wallet upon placing an order.
  * Construct the **Coupon Engine**: A highly robust validation service checking constraints such as geographical delivery location, payment methods, user history, and item categories before applying discount totals.
  * Create the **VIP Gold Membership** program, offering subscriber perks such as free shipping and VIP-only coupons.

---

## Phase 4: Admin Workspace & Content Management (CMS)
* **Goal:** Build the back-office dashboard to empower managers to control store catalog options, video contents, support inquiries, and inventory.
* **Key Tasks:**
  * Build the Admin Dashboard displaying core KPIs (total sales volume, signups, tickets, pending orders).
  * Create the **Add Product Wizard**: A multi-step form to upload images and configure frame sizes, variations, stock limits, and prices.
  * Design the **Category Tree View** and dynamic **Navigation Menu Builder** allowing administrators to reorganize store headers on the fly.
  * Implement the real-time **Support Ticket Center** enabling live agent-customer chat via Socket.io.
  * Add uploader workflows for home page promotional videos, banner ads, and vertical product demonstration "Reels".

---

## Phase 5: Production Optimization & Deployment Scaling
* **Goal:** Perform performance profiling, configure production environments, and automate the CI/CD pipeline.
* **Key Tasks:**
  * Setup a **Redis** caching/session invalidation layer to boost server performance and security.
  * Optimize Vite configurations (splitting chunks, asset compression, lazy loading) to maximize Lighthouse page performance.
  * Configure production-grade **Nginx** reverse proxies to route API and WebSocket traffic and serve static files directly.
  * Set up **PM2** on the target EC2 host to manage process threading, clustering, and auto-restart rules.
  * Implement the custom **Jenkins Deployment Pipeline**: An automated routine using AWS CLI to scale the host instance up to a `c7i-flex.large` during code compiles and builds, subsequently scaling down to a `t3.micro` to maintain low cost operations.
