import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card } from "../components/ui/Card";
import { InfoTooltip } from "../components/ui/InfoTooltip";
import { getPlanetDetailByName, getAllFeaturedPlanets, type FeaturedPlanet } from "../data/exoplanets";
import { OrbitSimulation } from "../components/orbit/OrbitSimulation";
import { PlanetGallery } from "../components/PlanetGallery";
import { useMemo, type ReactNode } from "react";

function formatNumber(value: number | null | undefined, options?: Intl.NumberFormatOptions): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Unknown";
  }

  return new Intl.NumberFormat(undefined, options).format(value);
}

function Section({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-brand-white">{title}</h2>
      <div className="rounded-2xl border border-brand-slate/30 bg-brand-indigo/60 p-6 text-sm text-brand-slate/70">
        {children}
      </div>
    </section>
  );
}

export default function PlanetDetail(): JSX.Element {
  const params = useParams<{ name: string }>();
  const navigate = useNavigate();
  const decodedName = params.name ? decodeURIComponent(params.name) : "";
  const planetDetail = getPlanetDetailByName(decodedName);

  const galleryPlanets = useMemo<FeaturedPlanet[]>(() => {
    const all = getAllFeaturedPlanets();
    return all.slice(0, 12);
  }, []);

  if (!planetDetail) {
    return (
      <main className="flex w-full flex-col gap-6 px-6 py-16 sm:px-8 lg:px-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-slate/40 bg-brand-indigo/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-slate/70 transition hover:border-brand-accent/60 hover:text-brand-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <Card title="Planet not found" description="Try selecting another KOI">
          <p>
            We couldn&rsquo;t locate <span className="text-brand-accent">{decodedName}</span> in the NASA KOI dataset. Return to the
            dashboard to browse the latest detections and select another planet.
          </p>
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-accent/60 bg-brand-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent"
          >
            Go to dashboard
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex w-full flex-col gap-10 px-6 py-12 sm:px-8 lg:px-12">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-brand-slate/40 bg-brand-indigo/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-slate/70 transition hover:border-brand-accent/60 hover:text-brand-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-brand-accent/60 bg-brand-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent"
        >
          Overview
        </Link>
      </div>

      <header className="space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-accent/50 bg-brand-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-accent">
          {planetDetail.disposition}
        </span>
        <h1 className="text-4xl font-semibold text-brand-white sm:text-5xl">{planetDetail.name}</h1>
        <p className="max-w-2xl text-base text-brand-slate/70 sm:text-lg">
          Poster-grade rendering, key orbital parameters, and stellar context for NASA KOI {planetDetail.rawKepoiName}.
          Use the orbit preview to understand the transit signature your AI models detected.
        </p>
      </header>

      <Card title="Orbit Preview" description={`Transit simulation for ${planetDetail.name}`} id="orbit">
        <p className="text-sm text-brand-slate/70">
          The animation approximates the orbital scale via Kepler&rsquo;s third law using the period derived from KOI data. Adjust the
          textures or camera controls via react-three-fiber to customize the visualization for demos.
        </p>
        <OrbitSimulation planet={planetDetail} />
      </Card>

      <Section title="Planetary Characteristics">
        <dl className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Orbital Period</dt>
            <dd className="text-lg font-semibold text-brand-white">{formatNumber(planetDetail.periodDays, { maximumFractionDigits: 2 })} days</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Radius</dt>
            <dd className="text-lg font-semibold text-brand-white">{formatNumber(planetDetail.planetRadiusEarth, { maximumFractionDigits: 2 })} R⊕</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Semi-major Axis</dt>
            <dd className="text-lg font-semibold text-brand-white">{formatNumber(planetDetail.semiMajorAxisAu, { maximumFractionDigits: 2 })} AU</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Equilibrium Temperature</dt>
            <dd className="text-lg font-semibold text-brand-white">{formatNumber(planetDetail.equilibriumTempK, { maximumFractionDigits: 0 })} K</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Insolation</dt>
            <dd className="text-lg font-semibold text-brand-white">{formatNumber(planetDetail.insolationEarth, { maximumFractionDigits: 1 })} ⊕</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">KOI Score</dt>
            <dd className="text-lg font-semibold text-brand-white">{formatNumber(planetDetail.koiScore, { maximumFractionDigits: 2 })}</dd>
          </div>
        </dl>
      </Section>

      <Section title="Host Star Insights">
        <dl className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-brand-slate/60">
              Star Brightness Index
              <InfoTooltip label={`What does star brightness index mean for ${planetDetail.name}?`}>
                Ratio of the host star&rsquo;s effective temperature to the Sun (Teff ≈ 5778 K). Values above 1.0 indicate
                hotter, brighter stars.
              </InfoTooltip>
            </dt>
            <dd className="text-lg font-semibold text-brand-white">
              {formatNumber(planetDetail.stellarBrightnessIndex, { maximumFractionDigits: 2 })}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Stellar Effective Temperature</dt>
            <dd className="text-lg font-semibold text-brand-white">{formatNumber(planetDetail.stellarEffectiveTempK, { maximumFractionDigits: 0 })} K</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Stellar Radius</dt>
            <dd className="text-lg font-semibold text-brand-white">{formatNumber(planetDetail.stellarRadiusSun, { maximumFractionDigits: 2 })} R☉</dd>
          </div>
        </dl>
      </Section>

      <Section title="More Worlds to Explore">
        <PlanetGallery
          planets={galleryPlanets}
          selectedPlanetName={planetDetail.name}
          onSelectOrbit={(planet) => {
            const slug = encodeURIComponent(planet.name);
            navigate(`/planet/${slug}`);
          }}
        />
      </Section>
    </main>
  );
}
