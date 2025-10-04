import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { OrbitSimulation } from "../components/orbit/OrbitSimulation";
import {
  getAllFeaturedPlanets,
  getPlanetDetailByName,
  type FeaturedPlanet
} from "../data/exoplanets";

function usePlanetFromQuery(): FeaturedPlanet | null {
  const location = useLocation();

  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    const queryName = params.get("planet");
    if (!queryName) {
      return null;
    }

    return getPlanetDetailByName(queryName);
  }, [location.search]);
}

export default function OrbitLab(): JSX.Element {
  const navigate = useNavigate();
  const seededPlanet = usePlanetFromQuery();
  const planets = useMemo(() => {
    const all = getAllFeaturedPlanets();
    all.sort((a, b) => (b.koiScore ?? 0) - (a.koiScore ?? 0));
    return all.slice(0, 20);
  }, []);

  const initialPlanet = seededPlanet ?? planets[0] ?? null;
  const [selectedPlanet, setSelectedPlanet] = useState<FeaturedPlanet | null>(() => initialPlanet);
  const [starTemperatureK, setStarTemperatureK] = useState<number>(() => initialPlanet?.stellarEffectiveTempK ?? 5778);

  useEffect(() => {
    if (seededPlanet) {
      setSelectedPlanet(seededPlanet);
    }
  }, [seededPlanet]);

  useEffect(() => {
    if (selectedPlanet) {
      setStarTemperatureK(selectedPlanet.stellarEffectiveTempK ?? 5778);
    }
  }, [selectedPlanet]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
      <header className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-slate/40 bg-brand-indigo/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-brand-slate/70">
          Interactive Lab
        </span>
        <h1 className="text-3xl font-semibold text-brand-white sm:text-4xl lg:text-5xl">Orbit Simulation Studio</h1>
        <p className="max-w-2xl text-base text-brand-slate/70 sm:text-lg">
          Preview transits and adjust demo narratives using the react-three-fiber scene. Choose a planet to drive the animation or
          open the full detail page for more telemetry.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card
          title={selectedPlanet ? selectedPlanet.name : "No planet selected"}
          description={selectedPlanet ? `Transit preview for ${selectedPlanet.name}` : "Choose a planet from the list"}
          id="orbit"
        >
          {selectedPlanet ? (
            <>
              <p className="text-sm text-brand-slate/70">
                Orbital speed reflects the KOI period. Use this visualization during demos or integrate the component to showcase AI
                detections.
              </p>
              <div className="mt-4 space-y-3 rounded-2xl border border-brand-slate/30 bg-brand-indigo/40 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Star Temperature Control</p>
                  <span className="text-sm font-semibold text-brand-white">{Math.round(starTemperatureK)} K</span>
                </div>
                <input
                  type="range"
                  min={3000}
                  max={30000}
                  step={100}
                  value={starTemperatureK}
                  onChange={(event) => setStarTemperatureK(Number(event.target.value))}
                  className="w-full accent-brand-accent"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-brand-slate/60">
                  <span>3,000 K</span>
                  <button
                    type="button"
                    className="rounded-full border border-brand-slate/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-slate/70 transition hover:border-brand-accent hover:text-brand-accent"
                    onClick={() => setStarTemperatureK(selectedPlanet.stellarEffectiveTempK ?? 5778)}
                  >
                    Reset to host
                  </button>
                  <span>30,000 K</span>
                </div>
              </div>
              <OrbitSimulation planet={selectedPlanet} starTemperatureKOverride={starTemperatureK} />
            </>
          ) : (
            <p>Select a planet from the list to preview its orbit.</p>
          )}
        </Card>

        <Card title="Select a world" description="Top KOIs by score" className="space-y-4">
          <div className="max-h-80 overflow-y-auto pr-1">
            <ul className="space-y-3 text-sm text-brand-slate/70">
              {planets.map((planet) => {
                const isActive = selectedPlanet?.name === planet.name;
                return (
                  <li key={planet.name}>
                    <button
                    type="button"
                    onClick={() => setSelectedPlanet(planet)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-brand-accent bg-brand-accent/15 text-brand-white"
                        : "border-brand-slate/40 bg-brand-indigo/40 text-brand-slate/70 hover:border-brand-accent/50 hover:text-brand-accent"
                    }`}
                  >
                    <span className="font-semibold">{planet.name}</span>
                    <span className="text-xs uppercase tracking-[0.3em]">
                      {planet.periodDays?.toFixed(1) ?? "—"} d · {planet.planetRadiusEarth?.toFixed(1) ?? "—"} R⊕
                    </span>
                  </button>
                  </li>
                );
              })}
            </ul>
          </div>
          {selectedPlanet ? (
            <button
              type="button"
              onClick={() => navigate(`/planet/${encodeURIComponent(selectedPlanet.name)}`)}
              className="inline-flex items-center gap-2 rounded-full border border-brand-slate/50 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-white transition hover:border-brand-accent hover:text-brand-accent"
            >
              Open detail page
            </button>
          ) : null}
        </Card>
      </section>
    </main>
  );
}
