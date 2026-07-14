# Coding Standards & Development Rules: EyeGlaze

To maintain code quality, security, and developer alignment across the EyeGlaze monorepo, all developers and automated tools must adhere to the following rules when modifying or extending this codebase.

---

## 1. General Principles
* **Language Consistency:** Both `/frontend` and `/server` are written in **TypeScript**. Always maintain strict typing. Avoid using `any` unless absolutely necessary for external library interfaces.
* **Separation of Concerns:** 
  * The frontend must not contain business logic or query databases directly.
  * The server is a stateless REST and WebSocket API. It must only communicate via JSON responses.
* **Monorepo Boundaries:** Keep dependencies isolated. Do not import modules directly from `/frontend` into `/server` or vice-versa. Shared contracts should be established via types or DTO declarations.

---

## 2. Backend (Server) Rules
* **Directory Structure:**
  * Route endpoints must be registered under `src/routes/` and delegate logic to controllers.
  * Controllers must reside in `src/controllers/` and execute service/db operations.
  * Reusable database models must be in `src/models/`.
  * External utilities (AWS S3, SMS OTP, database connect) must be inside `src/lib/`.
* **Database Modeling (Mongoose):**
  * Always use proper schema definitions with TypeScript interfaces (`mongoose.Document`).
  * Ensure indexes are defined on fields that are frequently queried (e.g., `userId`, `phone`, `email`).
  * Ensure every query uses `lean()` when performing read-only queries to improve execution speed.
* **Request Validation & Error Handling:**
  * Validate all API request bodies and query parameters using **Zod** schemas before executing controller actions.
  * Wrap controller actions in `try-catch` blocks and pass exceptions to Express error handling middleware. Never let the Express thread crash due to unhandled promise rejections.
* **Security & Authentication:**
  * Expose sensitive routes under the `requireAuth` or `requireAdmin` middlewares.
  * Pass and access JWT tokens via secure, `httpOnly`, `sameSite: strict` cookies rather than local storage.
  * Maintain the user lockout policy for regular customer accounts (5 failed attempts locks for 15 minutes), but ensure admin/support agent roles bypass this logic to prevent denial-of-service lockouts.

---

## 3. Frontend Rules
* **Vite & React 19 Standards:**
  * Component declarations should reside in `src/components/`, layout scaffolding in `src/layouts/`, and route-level components in `src/pages/`.
  * Use React Hook Form + Zod resolvers to manage and validate form inputs.
* **Styling & CSS (Tailwind v4):**
  * Do not create or edit `tailwind.config.js`. EyeGlaze utilizes **Tailwind CSS v4.0** with CSS-first configuration.
  * Custom theme modifications (colors, transitions, keyframes) must be defined inside the `@theme` block in `src/index.css`.
  * Favor local Tailwind utility classes. Do not define ad-hoc style files or CSS overrides unless dealing with global scrollbar rules.
* **State Management:**
  * Place global contexts (like auth state, cart sync) in `src/context/`.
  * Keep components localized. Do not lift state globally unless multiple independent views require the same state.
* **DOM Structure & Accessibility:**
  * Ensure all interactive components have unique, descriptive `id` or `data-testid` attributes. This facilitates robust end-to-end browser testing.
  * Respect HTML5 semantic landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`).

---

## 4. Git & Deployment Operations
* **Sensitive Configuration:**
  * Never commit `.env` or configuration secrets. Always template configurations inside `.env.example`.
* **CI/CD Integration:**
  * All deployments to the EC2 production instance must trigger through the **Jenkins pipeline**.
  * The pipeline utilizes AWS scaling CLI commands to dynamically swap instance types to optimize server hosting costs. Never bypass this pipeline by performing manual git updates on the host.
  * Always verify PM2 starts successfully (`pm2 list`) and check Nginx configuration (`nginx -t`) before re-routing traffic.
