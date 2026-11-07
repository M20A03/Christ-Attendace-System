---
name: impeccable
description: >-
  Style Guardian skill: enforces one unified design language across your setup, design token integrity,
  border radius harmony, and layout consistency.
---

# Impeccable - Style Guardian & Design Token Harmony

Use this skill to maintain rigorous aesthetic consistency across all components and screens.

## 1. Border Radius Harmony
Keep border radiuses strictly nested and proportional:
- Screen / Modal Containers: `rounded-3xl` (24px)
- Cards & Content Blocks: `rounded-2xl` (16px)
- Buttons, Inputs & List Items: `rounded-xl` (12px)
- Badges & Pills: `rounded-lg` (8px) or `rounded-full` (for circular indicators)

## 2. Elevation & Border Consistency
- In light mode: use `border border-slate-200/80` paired with soft multi-layered shadows (`shadow-sm` or `shadow-md shadow-slate-950/5`).
- In dark mode: use `border border-slate-800/80` with dark ambient shadows (`shadow-black/40`).
- Never mix harsh solid borders with delicate low-contrast borders in the same container.

## 3. Empty & Error State Dignity
- Empty states must never feel like bugs or broken code.
- Always include an illustrated icon, a clear non-accusatory explanation, and a high-contrast recovery button.
