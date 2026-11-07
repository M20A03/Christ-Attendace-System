---
name: ui-ux-pro-max
description: >-
  UX Lead skill: enforces real spacing, intentional hierarchy, states (hover, focus, active, loading, disabled),
  mobile touch target ergonomics (44x44px min), and clean interaction flows.
---

# UI/UX Pro Max - Elite Design & UX Standards

Use this skill whenever designing, building, or reviewing user interfaces.

## 1. Ergonomics & Mobile-First Hierarchy
- **Touch Targets**: Minimum 44×44pt tappable area for mobile touchpoints (buttons, nav items, icons).
- **Safe Areas**: Respect notch and home indicator (`pt-safe`, `pb-safe`, `env(safe-area-inset-*)`).
- **Thumb-Zone Navigation**: Place primary actions (bottom bar, key CTAs) within natural one-handed thumb reach.

## 2. Spacing & The 8pt Grid System
- Use consistent multiples of 4 and 8:
  - Micro spacing: `4px` (`gap-1`), `8px` (`gap-2`)
  - Component padding: `12px` (`p-3`), `16px` (`p-4`), `20px` (`p-5`), `24px` (`p-6`)
  - Section gaps: `24px` (`space-y-6`), `32px` (`space-y-8`), `48px` (`space-y-12`)
- Avoid arbitrary margins. Container margins must be intentional and proportional.

## 3. Interactive States (The 5 States of Every Element)
Every interactive element must explicitly define:
1. **Default**: Crisp border, balanced typography, subtle elevation.
2. **Hover**: Smooth transition (`duration-150`), subtle background tint or border glow.
3. **Active/Pressed**: Slight scale down (`active:scale-[0.98]`) for tactile feedback.
4. **Focused**: Clear focus ring with high-contrast offset (`focus-visible:ring-2 focus-visible:ring-offset-2`).
5. **Disabled/Loading**: Reduced opacity (`opacity-50 pointer-events-none`), spinner or pulse replacement.

## 4. Typography Scale & Contrast
- Use a single primary font family with strictly hierarchy:
  - Hero Display: 32px – 48px, font-black / extra-bold, tight tracking (`tracking-tight`)
  - Section Headings: 18px – 20px, font-bold
  - Card Titles: 14px – 16px, font-semibold
  - Body & Labels: 12px – 14px, font-normal / medium
  - Caption & Metadata: 11px, font-mono / font-medium, muted contrast
- Keep high WCAG AA contrast (minimum 4.5:1 for normal text, 3:1 for large text).
