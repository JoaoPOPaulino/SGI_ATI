# Design System Specification: The Architectural Minimalist

## 1. Overview & Creative North Star
The "Creative North Star" for this design system is **"The Architectural Minimalist."** 

In the world of enterprise logistics and operational movement, "minimalism" often defaults to "empty." We are moving beyond that. This system is designed to feel like a high-end architectural firm: structural, authoritative, and impeccably organized. We reject the "template" look of standard enterprise apps by replacing rigid 1px dividers with **Tonal Depth** and **Intentional Asymmetry**. 

The goal is to create a sense of "Operational Calm"—where the user feels in total control of complex data because the UI stays out of the way, appearing only as a series of sophisticated, layered surfaces.

---

## 2. Colors & Surface Philosophy
The palette is anchored by the deep, authoritative `primary` (#00236f) and supported by a sophisticated range of blues and slates that provide depth without clutter.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off content. Boundaries must be defined solely through background color shifts or tonal transitions.
- Use `surface_container_low` for the main page background.
- Use `surface_container_lowest` (Pure White) for interactive cards to create a "lifted" effect.
- Use `surface_dim` for non-interactive background elements to create a "recessed" feel.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
- **Base Layer:** `surface` (#f8f9ff)
- **Content Blocks:** `surface_container` (#e6eeff)
- **Interactive Elements:** `surface_container_lowest` (#ffffff)
- **Status Zones:** Use `primary_container` (#1e3a8a) for high-importance summary headers to create a "Deep Sea" anchor point at the top of the visual hierarchy.

### The "Glass & Gradient" Rule
To prevent the app from feeling "flat" or "cheap," use Glassmorphism for floating action buttons or sticky headers:
- **Material:** `surface_container_low` at 80% opacity with a 16px backdrop-blur.
- **CTAs:** Apply a subtle linear gradient from `primary` to `primary_container` (135° angle) to give buttons a tactile, high-end "machined" finish.

---

## 3. Typography: The Editorial Scale
We use **Inter** exclusively for its neutral, high-legibility "Swiss" character. Our hierarchy prioritizes dramatic contrast between massive Display styles and tight, functional Labels.

*   **Display (lg/md/sm):** Used for large numerical data (e.g., "42 Active Moves"). Set with `-0.02em` letter spacing to feel "tight" and premium.
*   **Headline (lg/md/sm):** Used for section titles. Always `on_surface`.
*   **Title (lg/md/sm):** Semi-bold weight. Used for card headers.
*   **Body (lg/md):** The workhorse. Use `on_surface_variant` (#444651) for secondary descriptions to maintain a clear visual hierarchy against primary titles.
*   **Label (md/sm):** All-caps for status badges with `0.05em` letter spacing to ensure readability at small scales.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are a last resort. We communicate hierarchy through light and material density.

*   **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` background. This "White on Soft Blue" creates a natural, sophisticated lift.
*   **Ambient Shadows:** For floating elements (Modals/Sheets), use a multi-layered shadow:
    *   `0px 4px 20px rgba(13, 28, 46, 0.06)` — tinted with the `on_surface` color for a natural "ambient light" look.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility in forms, use `outline_variant` (#c5c5d3) at **20% opacity**. It should be felt, not seen.
*   **Glassmorphism:** Use `surface_bright` with 70% opacity and a `20px` blur for persistent navigation bars, allowing the "movement" of the app to be glimpsed underneath.

---

## 5. Components: Operational Sophistication

### Buttons
- **Primary:** Gradient (`primary` to `primary_container`), `xl` (1.5rem) rounded corners. Text is `on_primary` (White).
- **Secondary:** `surface_container_high` background with `primary` text. No border.
- **Tertiary:** Pure text with `primary` color. Used for "Cancel" or low-priority actions.

### Cards & Lists
- **Forbid dividers.** To separate two list items, use a `spacing.4` (0.9rem) vertical gap or a subtle background shift from `surface_container_lowest` to `surface_container_low`.
- **The "Data Strip":** Use a 4px vertical accent of `primary` on the left edge of cards to indicate an "Active" or "Selected" state.

### Form Fields
- **Container:** `surface_container_low`. 
- **States:** On focus, the container shifts to `surface_container_lowest` with a "Ghost Border" of `primary` at 40% opacity.
- **Typography:** Labels use `label-md` floating above the field.

### Status Badges (Chips)
- **Success:** `on_tertiary_container` background with `on_tertiary_fixed_variant` text.
- **Warning:** Amber backgrounds must be desaturated to maintain the "Professional Enterprise" look; use tonal variants rather than "Safety Orange."

### Signature Component: The "Timeline Pulse"
For an operational app, create a custom Vertical Progress component using `primary_fixed` lines and `primary` nodes. The "Active" node should have a 10% opacity `primary` glow (8px radius) to simulate a digital heartbeat of the operation.

---

## 6. Do’s and Don’ts

### Do
- **Do** use `spacing.8` and `spacing.10` to create vast "Editorial" margins at the top of screens.
- **Do** use `surface_container_highest` for "Read Only" data to make it feel heavy and unchangeable.
- **Do** leverage `display-lg` for single, impactful data points.

### Don’t
- **Don’t** use a 1px #CCCCCC border. Ever.
- **Don’t** use pure black (#000000) for text. Use `on_surface` (#0d1c2e) to maintain the "Deep Blue" DNA.
- **Don’t** crowd the screen. If you think you need a divider, you probably just need more `spacing.4`.
- **Don’t** use default Material shadows. They are too "heavy" for this high-end aesthetic. Use Tonal Layering.