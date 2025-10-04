# Exoplanets Finder AI

Interactive dashboard for exploring NASA Exoplanet Archive KOI statistics—"KOI" stands for *Kepler Object of Interest*, a star system where NASA's Kepler telescope spotted something that might be a planet. The front-end is built with Vite, React, and TypeScript; CSV data is parsed with `d3-dsv`, rendered as insight cards, ranked tables, and a 3D orbit preview powered by react-three-fiber.

## Prerequisites
- Node.js 18 or newer (ships with npm 9+). Use [`nvm`](https://github.com/nvm-sh/nvm) or [`fnm`](https://github.com/Schniz/fnm) if you manage multiple versions.
- Git (optional, but recommended for pulling updates and collaborating).

Verify your tooling:
```bash
node --version
npm --version
```

## Install Dependencies
1. Clone or download the repository and open it in your terminal.
2. Install packages (creates `node_modules/` locally):
   ```bash
   npm install
   ```

If you run into permission issues on macOS/Linux, avoid `sudo`; instead, fix your global npm permissions or use a Node version manager.

## Available Scripts
All scripts are defined in `package.json` and run with `npm run <script>`.

| Script | Purpose |
| ------ | ------- |
| `dev` | Starts Vite in development mode with hot reloading on http://localhost:5173 |
| `build` | Produces a production bundle in `dist/` |
| `preview` | Serves the `dist/` bundle locally to validate the production build |
| `lint` | Runs ESLint against the project source |

### Examples
```bash
# Start the dev server
npm run dev

# Build for production
npm run build

# Preview the production bundle locally
npm run preview
```

## Project Structure
```
NASA_HACKTOHON/
├── dataset/
│   └── cumulative_2025.10.04_06.46.42.csv   # NASA Exoplanet Archive KOI release (2025-10-04)
├── index.html                               # Vite entry point
├── package.json                             # Scripts and dependencies
├── postcss.config.js                        # Tailwind/PostCSS config
├── public/                                  # Static assets (favicon, etc.)
├── src/
│   ├── App.tsx                              # Root component
│   ├── main.tsx                             # React entry
│   ├── components/
│   │   ├── orbit/OrbitSimulation.tsx        # react-three-fiber orbit visual
│   │   └── ui/Card.tsx                      # Tailwind-based section wrapper
│   ├── data/
│   │   └── exoplanets.ts                    # Parses CSV + computed aggregates
│   ├── pages/Dashboard.tsx                  # Main screen with cards, tables, and 3D view
│   ├── styles/global.css                    # Tailwind directives + base theming
│   └── vite-env.d.ts                        # Vite module declarations
├── tailwind.config.js                       # Tailwind theme overrides
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Data & Views
- `src/data/exoplanets.ts` ingests the KOI CSV (via Vite `?raw` import) with `d3-dsv`, computes disposition counts (how NASA currently classifies each potential planet), summary statistics, and ranked planet lists.
- The app is split across dedicated views:
  - `/overview` — mission summary, KPI (key performance indicator) cards, and quick links.
  - `/gallery` — poster-style cards with procedurally generated art and navigation to detail pages.
  - `/orbit` — interactive react-three-fiber transit preview; a *transit* is when a planet crosses in front of its star and briefly dims the starlight.
  - `/analytics` — disposition breakdowns and ranking tables showing confirmed worlds and candidates side-by-side.
- Additional highlights:
  - Persistent sidebar navigation (desktop) and responsive top tabs for quick jumps between sections.
  - Metric cards for catalog totals, confirmations (worlds NASA is confident are real), candidates (still being checked), and temperate small worlds (roughly Earth-sized planets in the not-too-hot/not-too-cold zone).
  - A planet gallery that generates poster-style cards with procedurally textured art, key metrics, and orbit shortcuts.
  - A 3D orbit simulation card that animates the leading confirmed KOI using react-three-fiber and drei.
  - Disposition breakdown chips with absolute counts and percentages.
  - Ranked tables for the highest scoring confirmed planets and KOI candidates.
- Each planet card links to a dedicated `/planet/:name` page with a hero orbit preview, stellar context, and recommendations for nearby discoveries.
- Replace the CSV in `dataset/` with a newer download to refresh the interface automatically.

## Astrophysics Terms Explained
- **Exoplanet**: A planet that orbits a star outside our solar system.
- **KOI (Kepler Object of Interest)**: Star system flagged by the Kepler telescope because its light briefly dimmed, hinting that a planet might be passing in front of the star.
- **Disposition**: NASA’s status label for a KOI—"confirmed" means follow-up analysis shows the signal is a real planet, "candidate" means promising but not yet verified, and "false positive" means the signal came from something else (for example, a nearby star).
- **Transit**: The moment an exoplanet moves between its star and the telescope, causing a small, temporary dip in brightness. Measuring these dips reveals planet size and orbit.
- **Habitable/temperate zone**: The range of orbits where a planet could have liquid water on the surface; this depends on the star’s temperature and brightness.
- **Light curve**: A graph of how a star’s brightness changes over time. Repeating dips in the curve often indicate a planet’s orbit.

## Styling Notes
- Tailwind CSS powers the interface (`src/styles/global.css`). Use utility classes for layout tweaks, or extend theme tokens in `tailwind.config.js` for consistent colors and shadows.

## Troubleshooting
- If `npm install` fails due to incompatible Node version, switch to Node 18+ and reinstall.
- When `npm run dev` is already bound to a port, either stop the existing process or run `npm run dev -- --port 5174`.
- For TypeScript or ESLint errors, run `npm run lint` to see details and apply fixes in the referenced files.
- Ensure the browser supports WebGL for the orbit simulation; fallback copy is still shown if the KOI list is empty.

Happy hacking!
