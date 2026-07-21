# CLAUDE.md — SafeSteps

## Project Overview

SafeSteps is a trauma-informed daily support web app (PWA) for survivors of human
trafficking, domestic violence, and abduction. It helps users understand their trauma
responses, track patterns, and build self-awareness — without stigma, pressure, or
clinical formality.

## Tech Stack

- **Framework:** React 19 + Vite 8 + TypeScript
- **Routing:** React Router v7
- **Styling:** CSS custom properties (design tokens) + inline styles
- **Auth & Data:** Firebase Auth (email/password, anonymous fallback) + Firestore
- **PWA:** vite-plugin-pwa (offline support, installable)
- **Package manager:** Bun
- **Linter:** Oxlint

## Project Structure

```
src/
  components/    — shared UI components (BottomNav, etc.)
  hooks/         — custom React hooks
  lib/           — firebase.ts (init + exports)
  pages/         — route-level page components
  styles/        — global.css, design-tokens.css
  main.tsx       — entry point (BrowserRouter + App)
```

## Design Token Usage

All colors, spacing, typography, shadows, and transitions come from
`src/styles/design-tokens.css`. Reference tokens by var() name, never hardcode values.

Key tokens:
- Backgrounds: `--color-bg-primary` (cream-50), `--color-bg-card` (white)
- Text: `--color-text-primary`, `--color-text-secondary`
- Tool buttons: pink (Help), blue (Understand), sage (Triggers), cream (Check-In)
- Radius: `--radius-button` (24px), `--radius-card` (16px)
- Touch: `--touch-min` (48px), `--touch-comfortable` (56px)

## Trauma-Informed Design Principles

1. **Warm hug, not clinic.** Cream backgrounds, rounded everything, soft shadows.
2. **Mobile-first.** Design at 375px; larger breakpoints adapt from that.
3. **No harsh colors.** No bright reds, no pure black, no neon. Use the token palette.
4. **Large touch targets.** Minimum 48×48px. Generous spacing between tappable items.
5. **No urgency.** Avoid countdowns, red badges, exclamation marks. "When you're ready."
6. **Always provide escape.** Every screen needs a clear way back/out.
7. **"Help Me Right Now"** must always be one tap away.
8. **Respect motion preferences.** All animations disabled for `prefers-reduced-motion`.
9. **Readable text.** Body minimum 16px, preferred 18px. Generous line heights.
10. **Empowering copy.** Never "you should" — always "you might try" / "some people find".

## Development

```bash
bun install        # install dependencies
bun run dev        # start dev server (port 3000)
bun run build      # production build
bun run preview    # preview production build
```

## Environment Variables

Copy `.env.example` to `.env` and fill in Firebase config values.
All Vite env vars must be prefixed with `VITE_`.
