import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Grid3x3 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { PlanetGallery } from "../components/PlanetGallery";
import { getAllFeaturedPlanets } from "../data/exoplanets";
import type { FeaturedPlanet } from "../data/exoplanets";

const FILTER_OPTIONS = [
  { id: "all", label: "All dispositions" },
  { id: "confirmed", label: "Confirmed" },
  { id: "candidate", label: "Candidates" }
];

export default function Gallery(): JSX.Element {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("all");

  const planets = useMemo(() => {
    const all = getAllFeaturedPlanets();
    all.sort((a, b) => (b.koiScore ?? 0) - (a.koiScore ?? 0));

    if (filter === "confirmed") {
      return all.filter((planet) => planet.disposition === "CONFIRMED");
    }

    if (filter === "candidate") {
      return all.filter((planet) => planet.disposition === "CANDIDATE");
    }

    return all;
  }, [filter]);

  const handleViewOrbit = (planet: FeaturedPlanet) => {
    navigate(`/orbit?planet=${encodeURIComponent(planet.name)}`);
  };

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
      <header className="space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-slate/40 bg-brand-indigo/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-brand-slate/70">
          Visual Explorer
        </span>
        <h1 className="text-3xl font-semibold text-brand-white sm:text-4xl lg:text-5xl">Planet Gallery</h1>
        <p className="max-w-2xl text-base text-brand-slate/70 sm:text-lg">
          Auto-generated posters mix KOI metadata with a stylised palette so you can storyboard mission briefings, demo decks,
          or enhanced AI classifiers at a glance.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_2fr]">
        <Card title="Filter" description="Refine by disposition">
          <div className="space-y-3 text-sm text-brand-slate/70">
            <p className="flex items-center gap-2 text-brand-white">
              <Filter className="h-4 w-4 text-brand-accent" />
              Toggle the disposition view to focus on validation-ready planets or high-value candidates.
            </p>
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFilter(option.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    filter === option.id
                      ? "border border-brand-accent bg-brand-accent/20 text-brand-accent"
                      : "border border-brand-slate/50 bg-transparent text-brand-white hover:border-brand-accent hover:text-brand-accent"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">
              Showing {planets.length.toLocaleString()} planets
            </p>
          </div>
        </Card>

        <Card title="Poster Grid" description="Select a world to view details or preview the orbit" className="col-span-full lg:col-span-1">
          <div className="mb-4 flex items-center gap-2 text-sm text-brand-slate/60">
            <Grid3x3 className="h-4 w-4" /> Optimised for desktop · Scroll for more
          </div>
          <PlanetGallery planets={planets.slice(0, 24)} onSelectOrbit={handleViewOrbit} />
        </Card>
      </section>
    </main>
  );
}
