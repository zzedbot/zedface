---
name: ZedFace
description: "Neural Interface for developer-AI collaboration"
colors:
  primary: "#4ecdc4"
  primary-light: "#7fdcd6"
  primary-dark: "#3ab8b0"
  secondary: "#ff6b6b"
  secondary-light: "#ff8a8a"
  secondary-dark: "#e55555"
  bg-dark: "#0f0c29"
  bg-mid: "#302b63"
  bg-light: "#24243e"
  text-primary: "#e0e0ff"
  text-secondary: "#888888"
  glass-bg: "rgba(255, 255, 255, 0.05)"
  glass-border: "rgba(255, 255, 255, 0.1)"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: 1.1
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.5
  mono:
    fontFamily: "JetBrains Mono, Fira Code, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
  4xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.bg-dark}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-light}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-ghost-hover:
    backgroundColor: "rgba(255, 255, 255, 0.05)"
    textColor: "{colors.primary}"
  input-field:
    backgroundColor: "rgba(0, 0, 0, 0.3)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  glass-panel:
    backgroundColor: "{colors.glass-bg}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: ZedFace

## 1. Overview

**Creative North Star: "Neural Interface"**

ZedFace is not a chatbot wrapper. It is a **neural interface** — a direct cognitive link between developer and AI. The design system reflects this: every element exists to minimize friction in the thought-to-action pipeline. The interface dissolves, leaving only the collaboration.

The system is **precise** — every pixel has purpose, every animation communicates state. It is **immersive** — full-screen, edge-to-edge, eliminating the browser frame to create a dedicated cognitive space. It is **geeky** — unapologetically technical, celebrating the aesthetic of development tools. It is **futuristic** — not science fiction fantasy, but near-future reality, the interface you'd expect in 2030.

**Key Characteristics:**
- Particle system as AI identity (not decoration)
- Glassmorphism for depth, not ornamentation
- Exponential easing for all motion (no bounce, no elastic)
- Cyan-magenta duality: calm intelligence + urgent energy
- Full-screen immersion with floating UI layers

**What This System Rejects:**
- Enterprise admin dashboards (Salesforce, SAP)
- Consumer chat applications (WeChat, Messenger)
- Traditional AI chat interfaces (message list + input)
- Gamified UI with badges and achievements
- Decorative glassmorphism without functional purpose

## 2. Colors: The Neon Abyss Palette

The palette is a **drenched commitment** to the cyberpunk aesthetic. Deep space backgrounds serve as the canvas; cyan and magenta neon cut through the darkness like signals in the void.

### Primary

- **Neural Cyan** (#4ecdc4 / oklch(0.75 0.15 180)): The AI's signature. Used for primary actions, active states, links, and Zed's particle identity. This is the color of calm intelligence, of data flowing cleanly through neural pathways. Applied at ≤10% of any surface for maximum impact. Lighter variants (#7fdcd6) for hover states, darker (#3ab8b0) for active/pressed.

### Secondary

- **Pulse Magenta** (#ff6b6b / oklch(0.65 0.25 10)): Energy and urgency. Reserved for warnings, destructive actions, error states, and emphasis. The counterpart to cyan — where cyan is thought, magenta is action. Used sparingly to maintain its signal strength.

### Neutral

- **Deep Space Void** (#0f0c29 / oklch(0.15 0.05 270)): The abyss. Full-screen background, the foundation of immersion. Never used for surfaces or containers.
- **Nebula Mid** (#302b63 / oklch(0.25 0.08 280)): Background gradient middle tone. Creates depth in the full-screen backdrop.
- **Cosmic Light** (#24243e / oklch(0.20 0.06 275)): Background gradient end tone. Subtle variation prevents flatness.
- **Starlight Primary** (#e0e0ff / oklch(0.92 0.02 270)): Main text color. Slight purple tint maintains warmth against cool backgrounds.
- **Dust Secondary** (#888888 / oklch(0.55 0.02 270)): Labels, metadata, disabled states. Pure gray avoids competing with brand colors.

### Named Rules

**The Signal Clarity Rule.** Primary cyan appears on ≤10% of any given screen. Its rarity is the point. When everything is highlighted, nothing is.

**The Duality Doctrine.** Cyan and magenta are never mixed decoratively. Cyan = thought/interface. Magenta = action/urgency. They coexist, but never blur.

## 3. Typography

**Display Font:** Inter (with system fallbacks)
**Body Font:** Inter (with system fallbacks)
**Mono Font:** JetBrains Mono (with Fira Code, Consolas fallbacks)

**Character:** Inter's technical precision matches the developer audience. JetBrains Mono for code creates visual distinction between prose and technical content. The pairing is modern, readable, and unpretentious.

### Hierarchy

- **Display** (700, 48px, 1.1): Hero headings. Rare — used only for the "Zed" logotype and major section titles. Letter-spacing: 2px for the logotype creates breathing room.
- **Headline** (700, 36px, 1.2): Page titles. Establishes hierarchy without overwhelming.
- **Title** (600, 22px, 1.4): Subsection headings, card titles. Semi-bold provides weight without shouting.
- **Body** (400, 14px, 1.6): Default text. Line height 1.6 ensures readability. Max line length: 65-75ch via `max-width: 65ch`.
- **Label** (500, 12px, 1.5): Metadata, timestamps, UI labels. Medium weight for legibility at small sizes.
- **Mono** (400, 13px, 1.5): Code snippets, technical content, logs. Monospace creates clear visual separation from prose.

### Named Rules

**The Prose Boundary Rule.** Body text never exceeds 75 characters per line. Controlled via `max-width: 65ch`. Long lines fatigue the eye; short lines waste space. 65-75ch is the sweet spot.

**The Mono Isolation Rule.** Technical content (code, logs, data) uses JetBrains Mono. Never mix monospace and sans-serif in the same semantic unit. The visual break signals "this is machine-generated."

## 4. Elevation

ZedFace uses **glassmorphism as its primary elevation system**, but with discipline. Glass is not decoration — it is structural. Floating panels exist above the particle background; the blur creates depth without hard borders.

### Shadow Vocabulary

- **Ambient Glass** (`box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)`): Standard glass panel. The outer shadow grounds the element; the inner highlight catches light. Used for floating windows, modals, control panels.
- **Neon Glow Primary** (`box-shadow: 0 0 20px rgba(78, 205, 196, 0.2)`): Accent glass. Cyan glow signals interactivity. Used for primary action containers, focused inputs, active panels.
- **Neon Glow Secondary** (`box-shadow: 0 0 20px rgba(255, 107, 107, 0.2)`): Warning glow. Magenta for destructive or urgent actions. Rare — overuse kills the signal.

### Glass Variants

**Standard Glass:** `background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;`

**Subtle Glass** (low emphasis): `background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.08);`

**Strong Glass** (high emphasis): `background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.15);`

**Accent Glass** (primary actions): `background: rgba(78, 205, 196, 0.08); border: 1px solid rgba(78, 205, 196, 0.3); box-shadow: 0 0 20px rgba(78, 205, 196, 0.2);`

### Named Rules

**The Functional Glass Rule.** Glassmorphism is structural, not decorative. Use it for floating panels, modals, overlays — elements that exist above the particle background. Never use it for static cards, list items, or form fields. If the element doesn't float, it doesn't need glass.

**The Blur Budget Rule.** Standard blur is 10px. Subtle is 8px. Strong is 12px. Never exceed 12px — too much blur destroys legibility and kills performance. The background should be discernible, not obliterated.

## 5. Components

### Buttons

**Character:** Tactile and responsive. Subtle glass backgrounds with cyan accents. Hover states are immediate (200ms) and clear.

- **Shape:** Gently curved edges (8px radius). Not pill-shaped (too playful), not sharp (too aggressive).
- **Primary:** Cyan background (`bg-primary/20`), cyan border (`border-primary/50`), cyan text. Padding: 8px 16px. Hover: `bg-primary/30`. Transition: 200ms.
- **Ghost:** Transparent background, gray text (`text-text-secondary`). Hover: `text-primary`, `bg-white/5`. For secondary actions, less emphasis.
- **Destructive:** Magenta accents. Background `bg-secondary/20`, border `border-secondary/50`, text `text-secondary`. Reserved for dangerous actions (delete, reset).

### Input Fields

**Character:** Dark wells that recede, not compete. Cyan border appears on focus.

- **Style:** Dark background (`bg-black/30`), cyan border on focus (`border-primary/50`), rounded-lg (8px). Padding: 8px 16px.
- **Focus:** Border brightens to `border-primary/50`. No glow — the border shift is enough. Transition: 200ms.
- **Placeholder:** `text-text-secondary/50`. Faint but legible.
- **Error:** Border shifts to `border-secondary/50`. Text remains white for contrast.

### Glass Panels

**Character:** Floating islands of content above the particle sea. Structural glass, not decorative.

- **Corner Style:** Rounded-lg (12px). Consistent across all glass elements.
- **Background:** Standard glass (see Elevation section).
- **Shadow Strategy:** Ambient Glass shadow. Outer shadow for grounding, inner highlight for light catch.
- **Border:** 1px solid rgba(255, 255, 255, 0.1). Subtle but present.
- **Internal Padding:** 16px for standard panels, 24px for major sections.

### Floating Windows

**Character:** Draggable, resizable glass containers. The signature component of ZedFace.

- **Structure:** Title bar (40px height) + content area + resize handle (16px × 16px, bottom-right).
- **Title Bar:** Glass background, bottom border (`border-b border-white/10`). Contains title (left), control buttons (right: minimize, maximize, close).
- **Control Buttons:** Ghost button style. Hover: cyan for minimize/maximize, magenta for close. Icons: SVG, 12px × 12px.
- **Grid Snapping:** All positions and sizes snap to a 12×8 grid. Visual feedback: grid overlay appears during drag/resize.
- **Minimized State:** Pill-shaped indicator on left edge. Glass background, cyan border, circular icon + window title.

### Particle System (Signature Component)

**Character:** Zed's visual identity. Not a decoration — the AI itself.

- **Particle Count:** 6000. Dense enough for smooth forms, sparse enough for performance.
- **Behavior:** State-driven. Idle: gentle breathing sphere. Listening: focused contraction with pulse. Thinking: chaotic swirl. Speaking: flowing waves. Error: sharp spikes.
- **Color:** Cyan primary, magenta secondary. States blend colors to signal transitions.
- **Interaction:** Reacts to audio input (mic, TTS). Mouse drag rotates the sphere (with inertia).

## 6. Do's and Don'ts

### Do:

- **Do** use glassmorphism for floating panels and overlays — elements that exist above the particle background.
- **Do** maintain cyan as the primary signal color, used on ≤10% of any surface. Its rarity is its power.
- **Do** use exponential easing (ease-out-expo, ease-in-out-expo) for all transitions. No bounce, no elastic. Motion should feel physical, not playful.
- **Do** keep body text line length at 65-75 characters. Use `max-width: 65ch` on content containers.
- **Do** use JetBrains Mono for all technical content (code, logs, data). The visual break signals "machine-generated."
- **Do** provide `prefers-reduced-motion` alternatives. Do not simply remove animations — replace them with instant state changes.
- **Do** maintain WCAG 2.1 AA contrast ratios: 4.5:1 for text, 3:1 for large text and UI components.

### Don't:

- **Don't** use glassmorphism decoratively. If the element doesn't float above the background, it doesn't need glass. Static cards should use solid surfaces.
- **Don't** use border-left or border-right greater than 1px as a colored accent on cards, list items, or alerts. This is the "side-stripe border" anti-pattern. Rewrite with full borders or background tints.
- **Don't** use gradient text (`background-clip: text` with gradient background). This is decorative, never meaningful. Use a single solid color. Emphasis via weight or size.
- **Don't** create enterprise admin dashboard layouts (Salesforce, SAP style). ZedFace is a neural interface, not a form-filling tool.
- **Don't** use consumer chat application patterns (WeChat, Messenger style). Message list + input box is not immersive collaboration.
- **Don't** overuse magenta. It signals urgency and danger. If everything is magenta, nothing is. Reserve it for warnings, errors, and destructive actions.
- **Don't** use bounce or elastic easing. Motion should feel physical and precise, not cartoonish. Exponential curves only.
- **Don't** create identical card grids with icon + heading + text repeated endlessly. Vary the layout. Use asymmetry for rhythm.
- **Don't** reduce or remove animations for accessibility without providing alternatives. Use `prefers-reduced-motion` to swap animations for instant state changes, not to eliminate feedback.
- **Don't** use `#000` or `#fff`. Tint every neutral toward the brand hue. Pure black is dead; pure white is harsh. Our darkest is #0f0c29, our lightest is #e0e0ff.

---

**Document Version**: v2.0 (Stitch-compliant)
**Last Updated**: 2026-06-16
**Maintained by**: ZedFace Development Team
