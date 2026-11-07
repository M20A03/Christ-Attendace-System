---
name: taste-skill
description: >-
  Taste Maker skill: eliminates generic, samey AI templates and elevates interfaces to bespoke,
  premium product standards (Linear, Apple, Vercel aesthetic).
---

# Taste Maker - Killing Generic AI UI

Use this skill to elevate any interface from looking "AI-generated" to feeling crafted, bespoke, and intentional.

## 1. Eliminate Generic AI Tropes
- **No Purple-Blue Neon Blobs Everywhere**: Replace clichéd neon radial gradients with subtle ambient light falloffs, muted slate tones, and purposeful accent highlights.
- **No Over-Rounded Giant Pills**: Use balanced border radiuses (`rounded-2xl` or `rounded-3xl` for cards, `rounded-xl` for buttons, `rounded-lg` for badges).
- **No Meaningless Emojis**: Replace raw emojis in headers with clean, monoline SVG icons (Lucide/Heroicons).
- **No Fake Metric Counters Without Context**: Every metric must answer a student or user question directly (e.g. "Can skip 3 classes" instead of just a raw number).

## 2. Refined Color Harmony
- **Neutral Foundation**: Use nuanced slates (`#090d16` for dark mode, `#f8fafc` for light mode). Pure `#000000` or `#ffffff` should only be used for maximum contrast highlights.
- **Accent Restraint**: Pick one primary accent (e.g. emerald `#10b981`) and use secondary colors strictly for semantic meaning (amber for warning, rose for danger).
- **Backdrop Blur & Glassmorphism**: When using glassmorphism, pair `backdrop-blur-md` with a subtle 1px border (`border-slate-200/80` or `border-slate-800/80`) to define depth without clutter.

## 3. Human Microcopy
- Make system text sound authentic, respectful, and helpful.
- Avoid robotic status messages:
  - ❌ *"Attendance calculation algorithm returned code 0."*
  - ✅ *"You're 2 classes ahead of your 85% goal. Safe to skip."*
- State clear next steps whenever an error or warning appears.
