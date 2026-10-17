# Project Guidelines & Preferences

## Design Rules
- **No Neon Effects**: Do NOT add neon, glow, or colored drop-shadow effects (e.g. `shadow-[0_0_..._#a8dadc]`, `shadow-[...rgba(168,218,220,...)]`, `drop-shadow`) anywhere in the application UI (buttons, tab indicators, borders, cards, search bars, inputs, etc.). Use solid colors and clean borders only.
- **Logo Exception**: The ONLY element permitted to have a glow / neon effect is the BEACON logo in `components/ui/Logo.tsx`.

## Coding Rules
- **No Comments**: Strictly do NOT add comments (`//` or `/*`) in the code. Maintain a zero-comments policy across all code modifications.
- **Dev Server**: Do NOT execute `npm run dev`. The developer runs and controls the development server manually.
