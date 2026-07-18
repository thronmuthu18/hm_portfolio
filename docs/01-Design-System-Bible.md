# Portfolio AI Operating System Blueprint
## Volume 1 — Design System Bible
Version 3.0 • Certified Production Standard

---

## Chapter 1 — Design Philosophy

### Mission
Create a timeless, premium design language that behaves like a flagship digital operating system rather than a static portfolio website. The visual engine must feel futuristic, high-end, and executive, prioritising readability and technical precision.

### The Six Pillars of Visual Decisions
1. **Clarity**: Information must be immediately legible. The visitor instantly understands the developer's credentials.
2. **Usability**: Interaction structures must remain predictable. Interactive feedback must occur on all input triggers.
3. **Elegance**: Motion and styling must favor restraint over visual excess. No childish bounces or exaggerated gaming-style effects.
4. **Performance**: GPU compositing and absolute positioning limit layout repaints. Decorative effects must degrade gracefully on lower-powered hardware.
5. **Accessibility**: All interactive targets support keyboard focus rings, WCAG AAA-compliant color contrasts, and screen reader labels.
6. **Consistency**: Layout rhythms, border scales, and easing variables are managed through centralized CSS custom properties.

---

## Chapter 2 — Design Principles

* **Professional Engineering**: The design highlights structure, grids, clear borders, and monospace telemetry.
* **Artificial Intelligence**: Fluid particle streams converge towards active WebGL coordinate centers, representing processing energy.
* **Luxury & Restraint**: Avoid generic colors. Utilize HSL tailored gradients, deep charcoal backdrops, and white glass overlays.
* **No Templates**: Every element is styled from custom components. Zero utility frameworks (Tailwind/Bootstrap) are used.

---

## Chapter 3 — Color System (Design Tokens)

| Token Name | Purpose | Dark Theme Value (Night) | Light Theme Value (Day) | Contrast / A11y Notes |
| :--- | :--- | :--- | :--- | :--- |
| `--bg-base` | Main background color | `#000000` | `#ffffff` | Absolute contrast baseline |
| `--bg-secondary` | Cards & secondary rows | `#0a0a0a` | `#f8fafc` | Subtle grouping background |
| `--accent` | Branding focus indicator | `#ff0033` (Neon Red) | `#0088cc` (Sea Blue) | AAA Compliant contrast |
| `--text-primary` | Main text titles/copy | `#ffffff` | `#0f172a` (Slate 900) | High readability |
| `--text-secondary` | Subtitle descriptions | `#cbd5e1` | `#475569` (Slate 600) | Secondary body contrast |
| `--glass-bg` | Floating glass fill | `rgba(10, 10, 10, 0.65)`| `rgba(255, 255, 255, 0.7)` | Backdrop blur sat filter |
| `--glass-border` | Subtle edge lighting | `rgba(255, 255, 255, 0.1)`| `rgba(15, 23, 42, 0.08)` | Prevents card overlapping |
| `--shadow-glow` | Brand energy shadows | `rgba(255, 0, 51, 0.15)` | `rgba(0, 136, 204, 0.12)` | Subtle radial glow limits |

---

## Chapter 4 — Typography System

* **Monospace Font Family**: `var(--font-family-mono)` (e.g. SF Mono, Fira Code, Consolas) for telemetry and code structures.
* **Sans Font Family**: `var(--font-family-sans)` (e.g. Inter, system-ui) for content cards, body text, and menus.

### Responsive Scale Table
* **Display/Hero**: `2.8rem` (Desktop) / `2.0rem` (Mobile) • Weight: `800` • Line height: `1.1`
* **H1**: `2.2rem` (Desktop) / `1.6rem` (Mobile) • Weight: `700` • Line height: `1.2`
* **H2–H3**: `1.8rem` / `1.4rem` • Weight: `600` • Line height: `1.3`
* **Body Large**: `1.1rem` • Weight: `400` • Line height: `1.6`
* **Body**: `0.95rem` • Weight: `400` • Line height: `1.5`
* **Code / Telemetry**: `0.8rem` • Weight: `500` • Line height: `1.4` • Letter spacing: `0.05em`

---

## Chapter 5 — Spacing System

Centralized linear spacing scale variables mapping layout padding and margin alignments:
* `var(--space-1)`: `4px`
* `var(--space-2)`: `8px`
* `var(--space-3)`: `12px`
* `var(--space-4)`: `16px`
* `var(--space-6)`: `24px`
* `var(--space-8)`: `32px`
* `var(--space-12)`: `48px`
* `var(--space-16)`: `64px`
* `var(--space-24)`: `96px`
* `var(--space-32)`: `128px`

---

## Chapter 6 — Grid System

* **Breakpoints**: 
  * Mobile: `< 576px` (1 column grid, margins: `var(--space-4)`, gutters: `16px`)
  * Tablet: `< 992px` (2 column grid, margins: `var(--space-6)`, gutters: `24px`)
  * Desktop: `< 1200px` (3 column grid, margins: `var(--space-8)`, gutters: `24px`)
  * Wide: `> 1200px` (Max width: `1280px` centered container)

---

## Chapter 7 — Border Radius System

* **Small (`--radius-sm`)**: `4px` (Used on tags, telemetry icons, badges)
* **Medium (`--radius-md`)**: `12px` (Used on featured project cards, code mockups, modals)
* **Large (`--radius-lg`)**: `20px` (Used on hero wrappers)
* **Full (`--radius-full`)**: `9999px` (Used on buttons, sliders, speech toggles)

---

## Chapter 8 — Elevation System

* **Level 0 (Flat)**: No shadow. Used on inline text containers.
* **Level 1 (Card Default)**: `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15)`
* **Level 2 (Active Hover state)**: `box-shadow: var(--shadow-glow), 0 12px 30px rgba(0, 0, 0, 0.3)`
* **Level 3 (Modal / Console Overlay)**: `box-shadow: var(--shadow-glow), 0 24px 60px rgba(0, 0, 0, 0.5)`

---

## Chapter 9 — Glass System

All components utilize hardware-accelerated filters:
* **Backdrop Filter**: `blur(20px) saturate(180%)`
* **Card Glass**: `background-color: var(--glass-bg); border: var(--metallic-border);`
* **Navbar Glass**: Solid backdrop sat filter. Top border none, bottom boundary `1px solid var(--glass-border)`.
* **Modal Glass**: Higher depth blur saturate (`blur(25px)`), border color mapped to `rgba(var(--accent-rgb), 0.3)` to isolate the window.

---

## Chapter 10 — Iconography

* **Family**: Feather / Lucide clean vector SVG layouts.
* **Stroke Width**: `2` (Default) / `1.5` (For large visual illustrations).
* **Hover State**: Pulls towards cursor coordinates using the proximity magnetic engine, transition curves set to standard fast.

---

## Chapter 11 — Component Library

### 1. Button (`.btn`)
* **States**: Default, Hover (lifts -3px, scale 1.02, glows brand colors), Pressed (compresses scale to 0.96 with zero-snap recovery), Disabled (opacity 0.4, cursor not-allowed).
* **Variants**: `.btn-primary` (solid linear accent gradient), `.btn-secondary` (semi-translucent glass overlay).
* **A11y**: Enforced outline rings (`outline-offset: 4px`) mapping to active theme colors on keyboard focus states.

### 2. Input / Textarea
* **States**: Glass-fill base, active focus state (borders transition to brand colors, minor elevation shadow glow triggers).
* **A11y**: Placeholders use high-contrast slate colors to support legibility.

### 3. AI Assistant Console Modal
* **States**: Inactive (`opacity:0; visibility:hidden`), Active (`Ctrl+K` toggle, pops up via scale variables, typing input focus grabbed).
* **A11y**: Support arrow keys selection navigation, Enter key activates click callbacks, Escape key closes console.

---

## Chapter 12 — Theme Engine

* **MutationObserver Configuration**: Watches body tag classes.
* **Day Theme (Light)**: Converts background base to pure white, text to Slate 900, brand highlights to Sea Blue (`#0088cc`). Pink styling is explicitly banned.
* **Night Theme (Dark)**: Deep Black variables, Neon Red brand highlights.
* **Adapting Layers**: WebGL Three.js materials watch theme variables to change emissive and particle cloud colors dynamically without render interruptions.

---

## Chapter 13 — Layout Patterns

* **Parallax Backdrop**: Multi-layered background consisting of SVG noise filters, orbiting Aurora light elements, floating particle cards, and mouse proximity light sweeps.
* **Section Transitions**: All section headers contain subtitle labels, grid dividers, and reveal keyframes.

---

## Chapter 14 — Motion Tokens

Centralized easing properties inside stylesheet `:root` variables:
* **Fast**: `0.2s cubic-bezier(0.16, 1, 0.3, 1)` (Used on toggles, focus states, badge highlights)
* **Normal**: `0.4s cubic-bezier(0.16, 1, 0.3, 1)` (Used on card shifts, panel expansions)
* **Spring Curve**: `var(--ease-spring) = cubic-bezier(0.175, 0.885, 0.32, 1.275)` (Used on custom custom cursor morphs, modal scale pops, and primary card hovering lifts).

---

## Chapter 15 — Accessibility Standards

* **Color Contrast**: All text nodes preserve `4.5:1` minimum ratio. Monospace tags maintain high background contrast.
* **Touch Targets**: All mobile menus and button selectors feature a minimum tap bounds boundary of `44x44px`.
* **Reduced Motion**: Disables particle loop calculations, Three.js render ticks, canvas repulsions, and large blur filters globally.

---

## Chapter 16 — Responsive Rules

* **Overlaps & clipping**: Absolute width variables are avoided; layout columns use flexbox wraps and grid auto-fits.
* **Horizontal Scroll**: Blocked globally on body and HTML tags (`overflow-x: hidden`).
* **Holographic elements**: Decoupled decoration panels hide on mobile viewports to prevent layout cluttering.

---

## Chapter 17 — Visual Quality Checklist

* Spacing alignments respect the linear spacing tokens scale.
* Corner radii follow the Small/Medium/Large scale values.
* Focus states are visible and conform to active branding colors.
* Text selections do not clip or hide descriptions.
* Hover transforms utilize the custom spring curve easing property.
* WebGL loops degrade safely under memory constraints.
