# UI/UX & Design System Document: EyeGlaze

This document establishes the UI/UX foundations, styling rules, typography, motion design, and layout guidelines for the EyeGlaze platform. It translates the premium, luxury eyewear brand identity into technical tokens and design principles implemented in the frontend.

---

## 1. Brand Identity & Visual Style
EyeGlaze positions itself as a premium, sleek, and high-fashion D2C brand. The design system rejects generic bright colors and instead uses a dark-mode-first aesthetic with rich matte gold and deep obsidian tones. This palette creates a sense of luxury and focuses the user's attention on the product imagery.

* **Obsidian Base:** The interface utilizes deep charcoal and black backgrounds, which reduces eye strain and provides a high-contrast backdrop for glass frames and lens reflections.
* **Gold Accent (VIP Gold):** Matte gold serves as the focal color for calls-to-action, active statuses, VIP features, and promotional highlight items.
* **Glassmorphism:** Subtly applied to cards, headers, and modal overlays to create depth and a modern glass-like structure.

---

## 2. Color System Tokens (Tailwind v4)
All styling colors are registered in `frontend/src/index.css` inside the `@theme` block. Developers must use these specific tokens to maintain visual consistency:

| Theme Variable | HEX Value | CSS Variable | Use Case |
| :--- | :--- | :--- | :--- |
| `eyeglaze-bg` | `#0B0B0C` | `--bg` | Application-wide body background |
| `eyeglaze-card` | `#131314` | `--card` | Product grids, form sections, and dashboard cards |
| `eyeglaze-border` | `#2A2A2D` | `--border` | Dividers, inputs, and container outlines |
| `eyeglaze-gold` | `#D4A04D` | `--gold` | Active buttons, premium labels, and logo elements |
| `eyeglaze-gold-hover` | `#C8923E` | `--gold-hover` | Hover states for primary controls |
| `eyeglaze-white` | `#F2F2F2` | `--white` | Primary heading and body typography |
| `eyeglaze-muted` | `#A7A7A7` | `--muted` | Sub-headings, placeholders, and label descriptors |
| `eyeglaze-error` | `#FF4444` | N/A | Validation warnings, blocked states, delete buttons |
| `eyeglaze-success` | `#4CAF50` | N/A | Successful coupon application, paid statuses |

---

## 3. Typography
EyeGlaze relies on high-performance system fonts to ensure fast page load times and consistent rendering across devices.

* **Primary Font Family:** `system-ui, -apple-system, sans-serif` (interoperable across Windows, macOS, Android, and iOS).
* **Text Hierarchy Principles:**
  * **Hero/Main Headings:** Use light weights (`font-light` or `font-thin`) and uppercase styling to create an elegant, high-end editorial feel.
  * **Actions & CTAs:** Use bold, semi-spaced typography (`tracking-wider font-semibold uppercase`).
  * **Descriptions & Labels:** Muted silver (`text-eyeglaze-muted`) with small sizing (`text-sm`) to keep layout forms clean and focused.

---

## 4. Motion & Micro-Animations
Static interfaces feel dead. EyeGlaze integrates hardware-accelerated micro-animations to guide user attention and improve visual polish.

### 4.1. Core Animation Tokens
* **Fade-In:** Used for lazy-loaded images, banner slides, and async state changes.
  * Token: `--animate-fade-in` (`0.25s` ease-out).
* **Slide-Up:** Applied when loading content grids, product listings, or route page changes.
  * Token: `--animate-slide-up` (`0.35s` cubic-bezier easing).
* **Slide-In:** Used for overlay sidebars (e.g., shopping cart drawer, administrative menus).
  * Token: `--animate-slide-in` (`0.35s` ease-in-out).
* **Scale-Up:** Triggered during modal popups and confirmation dialogues.
  * Token: `--animate-scale-up` (`0.3s` spring-like bounce).

---

## 5. UI Components & Layout Guidelines

### 5.1. Global Scrolling Control
* The viewport hides native scrollbars globally (`::-webkit-scrollbar { display: none; }`) for a cleaner, full-screen canvas layout. Content should be scrollable without visible scroll tracks.

### 5.2. Product & Frame Details Layout
* **Visual Gallery:** Half-screen product showcase displaying high-definition images, featuring zoom-on-hover overlays.
* **Variant Selectors:** Rounded, borders-only circles for frame colors and clean buttons for sizes. Avoid dropdown select elements for variants.

### 5.3. Custom Lens Wizard UI
* **Step-Indicator Progress Bar:** A thin gold timeline showing the current step (1: Lens Type -> 2: Lens Coatings -> 3: Prescription Input -> 4: Review).
* **Selection Cards:** Large, border-reactive options displaying option names, features, and price adjustments (e.g., `+ ₹999`). Clicking a card plays a subtle scale-down and scale-up click micro-animation.

### 5.4. Saved Powers Form Grid
* Configured in a symmetrical grid matching Left Eye (OS) and Right Eye (OD) columns.
* Input fields use deep card backgrounds (`#131314`) and show thin gold outlines when focused.

### 5.5. Admin Wizards
* Heavy form dashboards (like the Add Product wizard) are broken down into logical tabbed panels (e.g., General Info, Pricing/Variants, Inventory, Images) to prevent form fatigue.

### 5.6. Interactive Size Finder Modal
* **Tabbed Interface:** Follows clean, borderless tab triggers with active gold accent underlines (`border-b-2 border-[#D4A04D]`) and muted grey inactive states.
* **Camera Overlay Layout:** Captures the camera stream inside a rounded video tag. Renders a dashed gold oval template (`border-[#D4A04D]`) centered in the stream to guide face placement.
* **Scanning Micro-Motions:** When active, a pulsing gold horizontal scanning line runs vertically through the face template overlay to simulate dimensions assessment.
* **Results Visuals:** Completion results are highlighted in card-based blocks using success greens (`#4CAF50`) and bold gold highlights (`#D4A04D`) to instill precision and trust.

