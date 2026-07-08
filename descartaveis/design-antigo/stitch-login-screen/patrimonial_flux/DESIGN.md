# Design System Specification

## 1. Overview & Creative North Star
This design system is built to transform complex enterprise resource planning into a high-end, editorial experience. In a market often saturated with cluttered, "utilitarian-only" interfaces, this system prioritizes clarity through sophisticated layering and authoritative spatial logic.

**Creative North Star: "The Architectural Ledger"**
The system is inspired by modern Brazilian institutional architecture—clean lines, monumental proportions, and a focus on "pockets of light" within structured environments. It moves beyond the "standard dashboard" by treating data as editorial content. We use intentional white space and tonal depth to guide the eye, ensuring that high-density inventory lists and analytics feel breathable yet powerful.

---

## 2. Colors
Our palette is anchored in deep Navy and crystalline Whites, providing an atmosphere of absolute reliability and institutional trust.

### Color Tones
*   **Primary Foundation:** Use `primary` (#153a6b) for the sidebar and main navigation nodes to establish a "grounding" anchor on the left.
*   **Action & Emphasis:** `primary_container` (#315183) should be used for hover states and active indicators to provide a soft transition rather than a jarring high-contrast shift.
*   **Utility & Success:** Use `tertiary` (#00440d) and its variants for positive status indicators (e.g., "Ativo"). Its deep forest tone conveys stability rather than the "neon-green" of consumer apps.

### The "No-Line" Rule
To achieve a premium, custom feel, **1px solid borders for sectioning are strictly prohibited.** Do not use lines to separate the sidebar from the main content or to divide large page sections. Boundaries must be defined through background color shifts:
*   Place a `surface_container_lowest` (#ffffff) card against a `surface` (#f7f9fb) background.
*   Use `surface_container_low` (#f2f4f6) for secondary filter panels to create a "recessed" effect.

### Glass & Texture
For floating modals or pop-overs, utilize **Glassmorphism**. Apply `surface_container_highest` (#e0e3e5) at 80% opacity with a `20px` backdrop-blur. For main CTAs, apply a subtle linear gradient from `primary` to `primary_container` (top-left to bottom-right) to give buttons a "milled" metallic sheen.

---

## 3. Typography
We utilize **Inter** for its neutral, high-legibility letterforms. The hierarchy is designed to feel like a financial report—clear, rhythmic, and commanding.

*   **Display & Headlines:** Use `headline-lg` (2rem) for page titles (e.g., "Categorias"). Ensure a tracking of `-0.02em` to give titles an editorial, tight-knit feel.
*   **Titles & Labels:** `title-sm` (1rem) is the workhorse for table headers and section names. Bold weight is encouraged here for visual hierarchy.
*   **Data Density:** Use `body-sm` (0.75rem) for supplementary metadata. This keeps data-heavy inventory lists from feeling overwhelming while maintaining "at-a-glance" readability.

---

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering** and physics-based ambient lighting.

*   **The Layering Principle:** Treat the UI as stacked sheets of fine paper. 
    *   **Layer 0 (Base):** `surface` (#f7f9fb)
    *   **Layer 1 (Cards):** `surface_container_lowest` (#ffffff) 
    *   **Layer 2 (Filters/Side Panels):** `surface_container_low` (#f2f4f6)
*   **Ambient Shadows:** Use shadows sparingly. When a "floating" element (like a dropdown) is used, apply a shadow with a blur of `16px`, spread of `-4px`, and color `on_surface` (#191c1e) at **6% opacity**. This mimics natural, soft environmental light.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility in input fields, use `outline_variant` (#c3c6d0) at **20% opacity**. Never use a 100% opaque border.

---

## 5. Components

### Buttons
*   **Primary:** Gradient of `primary` to `primary_container`. Corner radius: `md` (0.375rem). Use `on_primary` (#ffffff) text.
*   **Tertiary (Ghost):** No background. `primary` text color. Used for low-priority actions like "Limpar".

### Input Fields
*   **Styling:** Background of `surface_container_lowest`. 
*   **State:** On focus, transition the background to `surface_container_high` (#e6e8ea) rather than just changing the border color. This provides a tactile "pressed-in" feel.

### Cards & Tables
*   **Forbid Divider Lines:** In lists/tables, do not use horizontal lines. Separate rows using `1.5` (0.3rem) vertical spacing and a alternating `surface_container_lowest` to `surface_container_low` background (zebra striping) at very low contrast.
*   **Header:** Table headers use `label-md` in `on_surface_variant` (#43474f) with all-caps styling to define the "data-field" authority.

### Data Chips
*   **Status Chips:** Use a pill shape (`full` radius). For "Ativo", use `tertiary_container` (#035e17) background with `on_tertiary_container` (#84d67f) text. This tonal-on-tonal approach is more sophisticated than white-on-color.

---

## 6. Do's and Don'ts

### Do
*   **Do** use the Spacing Scale `10` (2.25rem) for page margins to give the content "breathing room" typical of high-end editorial layouts.
*   **Do** use `inverse_surface` (#2d3133) for tooltips to provide a sharp, clear contrast against the light UI.
*   **Do** leverage `surface_bright` for interactive "clickable" card states to indicate hover.

### Don't
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#191c1e) to keep the contrast high but the "vibe" sophisticated.
*   **Don't** use standard `0.25rem` radius for everything. Use `xl` (0.75rem) for large containers and `md` (0.375rem) for internal components to create a hierarchical "softness" nested within "sharpness."
*   **Don't** use "Drop Shadows" on buttons. Use color shifts or slight vertical offsets (0.1rem) to indicate elevation.

---
*Document Ends.*