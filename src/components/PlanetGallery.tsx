import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { FeaturedPlanet } from "../data/exoplanets";
import { InfoTooltip } from "./ui/InfoTooltip";

type PlanetGalleryProps = {
  planets: FeaturedPlanet[];
  favoriteIds?: string[];
  onToggleFavorite?: (planet: FeaturedPlanet) => void;
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

export function PlanetGallery({ planets, favoriteIds, onToggleFavorite, onSelectOrbit }: PlanetGalleryProps): JSX.Element {
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
              : "Distance unavailable",
          brightnessLabel:
            planet.stellarBrightnessIndex !== null ? planet.stellarBrightnessIndex.toFixed(2) : "Unknown"
        };
      }),
    [planets]
  );

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {posters.map(({ planet, texture, periodLabel, radiusLabel, distanceLabel, brightnessLabel }) => {
        const isFavorited = favoriteIds?.includes(planet.catalogId) ?? false;

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
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-slate/50">
                  {planet.catalogId}
                </p>
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
                <div className="col-span-2">
                  <dt className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-brand-slate/60">
                    Star Brightness Index
                    <InfoTooltip label={`What does Star Brightness Index mean for ${planet.name}?`}>
                      Ratio of the host star's effective temperature to the Sun (Teff ≈ 5778 K). Hotter stars land above 1.0,
                      cooler stars fall below.
                    </InfoTooltip>
                  </dt>
                  <dd className="font-semibold">{brightnessLabel}</dd>
                </div>
              </dl>

              <div className="flex flex-col gap-3">
                <span className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">
                  Transit depth proxy · KOI score {formatValue(planet.koiScore, "", 2)}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {onToggleFavorite ? (
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(planet)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                        isFavorited
                          ? "border border-brand-accent bg-brand-accent/20 text-brand-accent"
                          : "border border-brand-slate/50 bg-transparent text-brand-white hover:border-brand-accent hover:text-brand-accent"
                      }`}
                    >
                      {isFavorited ? "Favorited" : "Favorite"}
                    </button>
                  ) : null}
                  <Link
                    to={`/planet/${encodeURIComponent(planet.name)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-brand-slate/50 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-white transition hover:border-brand-accent hover:text-brand-accent"
                  >
                    Details
                  </Link>
                  {onSelectOrbit ? (
                    <button
                      type="button"
                      onClick={() => onSelectOrbit(planet)}
                      className="inline-flex items-center gap-2 rounded-full border border-brand-slate/50 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-white transition hover:border-brand-accent hover:text-brand-accent"
                    >
                      View orbit
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
