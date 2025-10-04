import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { FeaturedPlanet } from "../data/exoplanets";

type PlanetGalleryProps = {
  planets: FeaturedPlanet[];
  selectedPlanetName?: string;
  onSelectOrbit?: (planet: FeaturedPlanet) => void;
};

function createPosterTexture(planet: FeaturedPlanet): string {
  const score = planet.koiScore ?? 0;
  const radius = planet.planetRadiusEarth ?? 1;
  const hue = (score * 47 + radius * 23) % 360;
  const accentHue = (hue + 45) % 360;

  return `radial-gradient(circle at 35% 30%, hsla(${accentHue}, 85%, 70%, 0.7), transparent 60%),
          radial-gradient(circle at 70% 65%, hsla(${hue}, 70%, 65%, 0.5), transparent 55%),
          linear-gradient(160deg, rgba(237, 131, 53, 0.4), rgba(18, 11, 64, 0.75))`;
}

function formatValue(value: number | null | undefined, unit: string, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Unknown";
  }

  const formatted = value.toFixed(digits);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function PlanetGallery({ planets, selectedPlanetName, onSelectOrbit }: PlanetGalleryProps): JSX.Element {
  const posters = useMemo(
    () =>
      planets.map((planet) => {
        const texture = createPosterTexture(planet);
        const distanceAu = planet.semiMajorAxisAu ?? null;
        const lightMinutes = distanceAu ? distanceAu * 8.317 : null;

        return {
          planet,
          texture,
          periodLabel: formatValue(planet.periodDays, "days"),
          radiusLabel: formatValue(planet.planetRadiusEarth, "R⊕"),
          distanceLabel:
            distanceAu !== null && lightMinutes !== null
              ? `${distanceAu.toFixed(2)} AU · ${lightMinutes.toFixed(1)} light-min`
              : "Distance unavailable"
        };
      }),
    [planets]
  );

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {posters.map(({ planet, texture, periodLabel, radiusLabel, distanceLabel }) => {
        const isSelected = planet.name === selectedPlanetName;

        return (
          <article
            key={planet.name}
            className="group relative overflow-hidden rounded-3xl border border-brand-slate/35 bg-brand-midnight shadow-card-glow transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div
              className="h-48 w-full transition duration-700 group-hover:scale-105"
              style={{ backgroundImage: texture, backgroundSize: "cover", backgroundPosition: "center" }}
            />
            <div className="space-y-4 p-6">
              <header className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-slate/60">
                  {planet.disposition}
                </p>
                <h3 className="text-2xl font-semibold text-brand-white">{planet.name}</h3>
                <p className="text-sm text-brand-slate/70">
                  Procedurally generated texture inspired by KOI parameters.
                </p>
              </header>

              <dl className="grid grid-cols-2 gap-4 text-sm text-brand-white/90">
                <div>
                  <dt className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Period</dt>
                  <dd className="font-semibold">{periodLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Radius</dt>
                  <dd className="font-semibold">{radiusLabel}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Estimated Distance</dt>
                  <dd className="font-semibold">{distanceLabel}</dd>
                </div>
              </dl>

              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">
                  Transit depth proxy · KOI score {formatValue(planet.koiScore, "", 2)}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/planet/${encodeURIComponent(planet.name)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-brand-slate/50 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-white transition hover:border-brand-accent hover:text-brand-accent"
                  >
                    Details
                  </Link>
                  {onSelectOrbit ? (
                    <button
                      type="button"
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                        isSelected
                          ? "border-brand-accent bg-brand-accent/20 text-brand-accent"
                          : "border-brand-slate/50 bg-transparent text-brand-white hover:border-brand-accent hover:text-brand-accent"
                      }`}
                      onClick={() => {
                        onSelectOrbit(planet);
                        const target = document.querySelector<HTMLElement>("#orbit");
                        if (target) {
                          target.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      }}
                    >
                      View orbit
                    </button>
                  ) : (
                    <Link
                      to={`/orbit?planet=${encodeURIComponent(planet.name)}`}
                      className="inline-flex items-center gap-2 rounded-full border border-brand-slate/50 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-white transition hover:border-brand-accent hover:text-brand-accent"
                    >
                      View orbit
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
