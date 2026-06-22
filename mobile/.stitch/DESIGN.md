# Design System: EyeGlaze Mobile
**Project ID:** 3181050102536854073

## 1. Visual Theme & Atmosphere

**Mood:** Luxurious noir with warm metallic accents — the visual equivalent of walking into a premium eyewear boutique at night. The interface feels dense yet breathable, pairing an ink-black canvas with glowing antique-gold highlights that draw the eye to key actions.

**Density:** Medium-high. Content-rich screens with controlled whitespace to maintain a premium, curated feel without feeling cramped.

**Aesthetic Philosophy:** Dark luxury e-commerce — think premium watch brands meet high-end optical stores. Every surface whispers exclusivity through restrained contrast and metallic warmth.

## 2. Color Palette & Roles

| Color | Hex | Role |
|-------|-----|------|
| **Ink Noir** | `#0D0D0D` | Primary background — the deepest canvas for all screens |
| **Charcoal Slate** | `#1A1A1A` | Card surfaces, elevated containers, bottom sheets |
| **Antique Gold** | `#C9A84C` | Primary accent — CTAs, active states, badges, pricing highlights, branding |
| **Pure White** | `#FFFFFF` | Primary text, headings, product names |
| **Smoke Grey** | `#888888` | Muted text, secondary labels, inactive states |
| **Obsidian Edge** | `#2A2A2A` | Borders, dividers, subtle card outlines |
| **Crimson Alert** | `#FF4444` | Error states, destructive actions, delete buttons |
| **Forest Affirm** | `#4CAF50` | Success states, order confirmations, verified badges |
| **Gold Whisper** | `rgba(201,168,76,0.15)` | Gold tinted backgrounds for discount badges and highlights |
| **Ghost White** | `rgba(255,255,255,0.5)` | Subdued labels, helper text, descriptions |

## 3. Typography Rules

**Font Family:** System default (Inter-style sans-serif) — clean, geometric, highly legible at small sizes.

**Weight Hierarchy:**
- **w900 (Black):** Section headings, brand name "EYEGLAZE", CTA labels, bottom nav labels. Always uppercase with `letterSpacing: 0.5–1.5`
- **w800 (ExtraBold):** Product names, prices, form section titles
- **w700 (Bold):** Card titles, feature labels, tab indicators
- **w600 (SemiBold):** Secondary text, gold accent links
- **w500 (Medium):** Helper text, descriptions
- **w400 (Regular):** Body text, muted labels

**Size Scale:**
- Hero titles: 19–28px
- Section headings: 13–14px (uppercase, tracked)
- Product names: 12–14px
- Body/descriptions: 10–12px
- Micro labels (badges, nav): 6.5–9px

**Character:** All section headers are UPPERCASE with generous letter-spacing (0.5–1.5px). Gold-colored subtitles precede white headings for hierarchy. Tight line heights (1.15–1.3) for dense, editorial feel.

## 4. Component Stylings

### Buttons
- **Primary (Gold CTA):** Filled `#C9A84C` background, black text, generously rounded corners (12px radius), full-width, 52px minimum height. Text is uppercase, extra-bold, tracked.
- **Secondary (Outlined):** Transparent background with 1.5px `#C9A84C` border, white text, same rounded corners and sizing.
- **Ghost (Text links):** Gold-colored text with underline decoration, no background.

### Cards & Containers
- **Product Cards:** `#1A1A1A` background, 12–14px rounded corners, thin 1px `#2A2A2A` border. Image fills top portion with gradient overlay fading to black at bottom.
- **Info Cards:** Same dark surface, 8–12px rounded corners, subtle border. Internal padding 10–16px.
- **Bottom Sheets:** `#000000` or `#0D0D0D` background with 20px top-rounded corners.

### Inputs & Forms
- **Text Fields:** `#1A1A1A` filled background, 12px rounded corners, `#2A2A2A` border at rest, `#C9A84C` gold border when focused. Muted grey label text.

### Navigation
- **Bottom Nav Bar:** `#0A0A0A` background with top 1px `#2A2A2A` border. 5 items: Home, Wishlist, Gold CTA (center, special treatment), Orders, Wallet.
- **Center "GET GOLD" button:** Special gradient container (`#1C160E` → `#0A0A0A`) with gold border, star icon, and gold badge floating above.
- **Active tab:** Gold icon + gold label. Inactive: `#888888` grey.
- **App Bar:** Transparent/`#0D0D0D`, centered logo, profile avatar left, search + notifications right.

### Badges & Tags
- **Discount badges:** Gold-whisper background (`rgba(201,168,76,0.15)`) with gold border and gold text.
- **Bestseller tag:** Solid gold background, white text, 4px rounded.
- **Notification dot:** Gold circle with white count text.

## 5. Layout Principles

**Spacing System:**
- Screen padding: 16px horizontal
- Section spacing: 20–24px vertical
- Card internal padding: 10–16px
- Grid gaps: 8–12px
- Micro spacing: 4–8px between related elements

**Grid:**
- Category grids: 4 columns with 3:4.2 aspect ratio
- Product grids: 2 columns with 0.62 aspect ratio
- Feature grids: 2 columns with 12px gap

**Elevation Strategy:** Flat design with layered depth through background color shifts (`#0D0D0D` → `#1A1A1A`). No drop shadows. Borders provide subtle edge definition. Gradient overlays on images create natural text-over-image readability.

**Transitions:** Smooth page transitions via `MaterialPageRoute`. Bottom sheets slide up with rounded top corners. No complex animations — elegance through restraint.

## 6. Design System Notes for Stitch Generation

When generating screens for EyeGlaze, always include these specifications in the prompt:

**DESIGN SYSTEM (REQUIRED):**
- Dark luxury e-commerce theme with ink-black background (#0D0D0D) and charcoal card surfaces (#1A1A1A)
- Antique gold (#C9A84C) as the primary accent for all CTAs, active states, and brand highlights
- Pure white (#FFFFFF) for primary text, smoke grey (#888888) for secondary/muted text
- Thin obsidian (#2A2A2A) borders on all cards and containers
- Generously rounded corners (12px) on buttons, cards, and inputs
- UPPERCASE section headings with letter-spacing, using extra-bold weight
- Full-width gold-filled primary buttons with black text
- Content-rich layouts with 16px screen padding
- No shadows — flat design with color-layered depth
- Premium eyewear e-commerce aesthetic — think luxury optical boutique
- Mobile-first design at 390px width
- Inter or system sans-serif typography
