# Exoplanets Finder AI

Interactive dashboard for exploring exoplanet light curves. The front-end is built with Vite and React, using Recharts for charting and a shadcn-inspired card layout. Replace the mock dataset with real NASA telemetry to power hackathon demos or prototype tooling for your team.

## Prerequisites
- Node.js 18 or newer (includes npm 9+). Use [`nvm`](https://github.com/nvm-sh/nvm) or [`fnm`](https://github.com/Schniz/fnm) if you manage multiple versions.
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

If you run into permission issues on macOS/Linux, avoid `sudo`; instead, fix your global npm permissions or use a node version manager.

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
├── index.html              # Vite entry point
├── package.json            # Scripts and dependencies
├── public/                 # Static assets (favicon, etc.)
└── src/
    ├── App.jsx             # Root component
    ├── main.jsx            # React entry
    ├── components/
    │   ├── LightCurveChart.jsx
    │   └── ui/Card.jsx
    ├── data/mockLightCurves.js
    ├── pages/Dashboard.jsx
    └── styles/
        ├── card.css
        └── global.css
```

## Working With Data
- Replace the mock light curve data in `src/data/mockLightCurves.js` with real mission telemetry.
- Keep timestamps in ISO format if you want the example axis formatter to work out of the box.
- Adjust chart domains and labels inside `src/components/LightCurveChart.jsx` to match your data ranges.

## Troubleshooting
- If `npm install` fails due to incompatible Node version, switch to Node 18+ and reinstall.
- When `npm run dev` is already bound to a port, either stop the existing process or run `npm run dev -- --port 5174`.
- For ESLint errors, run `npm run lint` to see details and apply fixes in the referenced files.

Happy hacking!
