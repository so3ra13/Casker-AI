# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server at http://localhost:5173
npm run build     # Production build
npm run preview   # Preview production build
```

No test runner is configured.

## Project Overview

**Casker-AI** (ShieldingAI) is a React web platform for MCNP (Monte Carlo N-Particle) nuclear shielding design. It replaces MCNP's 1970s-era text input with a GUI that generates valid MCNP input files, previews 3D geometry, and includes an AI chatbot (backed by a separate FastAPI + Gemini 1.5 Pro backend).

## Architecture

### State Management — Zustand (`src/store/mcnpStore.js`)

Single centralized store for all MCNP entities: cells, surfaces, materials, lattices, tallies, app mode (`shield` vs `crit`), and active tab. Use `useMCNPStore(selector)` in components or `.getState()` for imperative access. Delete actions auto-renumber IDs to maintain sequential order.

### Two-Tab Layout

- **Tab 1 (Design & View):** 3-column grid — MCNP card inputs (Cell/Surface/Data), real-time code preview, 3D viewer + RAG chatbot
- **Tab 2 (Optimization & Validation):** File upload, AI parsing, error detection, reverse-design chatbot

Tab visibility uses styled-components `$show` transient prop on wrappers (conditional CSS `display`) rather than conditional rendering.

### Code Generation (`src/utils/codeGen.js`)

Functions like `getSurfLines()`, `getCellLines()`, `getImpLine()` produce MCNP-formatted text. Column-alignment is strict: 3-space minimum gaps, right-aligned density values, lattice fill blocks indented to match surface column width. This formatting matters — MCNP is column-sensitive.

### Domain Constants (`src/utils/constants.js`)

- `SURF_PARAMS`: 13 surface types (RCC, RPP, SPH, CZ, PZ, …) with their parameter signatures
- `MAT_DB`: 30+ nuclear materials with ZAID isotope arrays and mass densities (e.g., `uo2: { dens: '-10.97', zaid: [[92235.70c, ...]] }`)

These are the authoritative source for all material and surface type data.

### 3D Visualization (`src/components/tab1/ViewerChat.jsx` + `src/utils/buildCaskLayers.js`)

React Three Fiber canvas with OrbitControls. `buildCaskLayers.js` converts the Zustand cell/surface state into Three.js geometries. Changes to surface parameters should be reflected here.

### Styling

Styled-components with a dark theme (`#090c12` background). Theme tokens are in `src/theme.js`; reusable component styles (`Btn`, `Input`, `Select`, `Textarea`) are in `src/components/theme.js`. Use `$`-prefixed transient props to avoid DOM prop warnings. Monospace font for all MCNP code: `theme.mn`.

### Parser (`src/utils/parser.js`)

Handles drag-and-drop `.i` file upload, parses existing MCNP input into store state, and detects syntax errors.

## Conventions

- UI labels are in Korean
- Unicode subscripts in constant labels (`x₀`, `y₀`, `z₀`)
- Vite path alias: `@` → `src/`
