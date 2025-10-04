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

  const [selectedPlanet, setSelectedPlanet] = useState<FeaturedPlanet | null>(() => seededPlanet ?? planets[0] ?? null);

  useEffect(() => {
    if (seededPlanet) {
      setSelectedPlanet(seededPlanet);
    }
  }, [seededPlanet]);

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
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
              <OrbitSimulation planet={selectedPlanet} />
            </>
          ) : (
            <p>Select a planet from the list to preview its orbit.</p>
          )}
        </Card>

        <Card title="Select a world" description="Top KOIs by score" className="space-y-4">
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
