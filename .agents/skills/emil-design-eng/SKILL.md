---
name: emil-design-eng
description: >-
  Detail Designer & Design Engineering skill: micro-interactions, Framer Motion spring physics,
  tactile feedback, SVG path animations, layout morphing, and finished details.
---

# Emil Design Engineering - Micro-Interactions & Spring Physics

Use this skill when implementing animations, transitions, gesture responses, and polish.

## 1. Natural Spring Physics (Framer Motion)
Never use harsh linear easing or generic CSS ease-in-out for user interactions. Use realistic springs:
```typescript
// Snappy interactive spring (buttons, toggles, popovers)
transition: { type: "spring", stiffness: 400, damping: 30 }

// Smooth layout transition (cards expanding, tabs sliding)
transition: { type: "spring", stiffness: 300, damping: 25 }

// Gentle modal/dialog entry
transition: { type: "spring", stiffness: 260, damping: 20 }
```

## 2. Shared Layout Transitions (`layoutId`)
- For tab indicators (e.g. bottom navigation bar or segment controls), use Framer Motion's `layoutId="activeIndicator"` so the highlight glides seamlessly between active tabs instead of blinking.
- For list reordering or filtering, always attach `layout` prop to animating items.

## 3. SVG Path Transitions
- When drawing circular progress rings or animated checkmarks:
  - Pre-calculate `circumference = 2 * Math.PI * radius`
  - Animate `strokeDashoffset` with `transition: stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)`
  - Use `strokeLinecap="round"` for smooth modern pill ends.

## 4. Tactile Micro-Interactions
- Button press: `active:scale-[0.98]` with `transition-transform duration-100`.
- Icon toggle: slight rotation (`rotate-12` or `rotate-180` for refresh icons).
- Card hover: `translate-y-[-2px]` with a gentle shadow step (`hover:shadow-md`).
