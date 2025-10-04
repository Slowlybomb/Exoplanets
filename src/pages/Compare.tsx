import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Card } from "../components/ui/Card";
import { OrbitSimulation } from "../components/orbit/OrbitSimulation";
import {
  getAllFeaturedPlanets,
  getPlanetDetailByName,
  type FeaturedPlanet,
  type PlanetDetail
} from "../data/exoplanets";

const HABITABLE_TEMP_MIN = 180;
const HABITABLE_TEMP_MAX = 320;
const HABITABLE_RADIUS_MAX = 2;

function formatValue(value: number | null | undefined, options?: Intl.NumberFormatOptions, unit?: string): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  const formatted = new Intl.NumberFormat(undefined, options).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

function summarizeHabitability(detail: PlanetDetail | null): { label: string; tone: "positive" | "warning" | "muted"; bullets: string[] } {
  if (!detail) {
    return {
      label: "Unknown",
      tone: "muted",
      bullets: ["No KOI data available for this selection."]
    };
  }

  const radius = detail.planetRadiusEarth;
  const temp = detail.equilibriumTempK;
  const insolation = detail.insolationEarth;

  const radiusOk = radius !== null && radius <= HABITABLE_RADIUS_MAX;
  const tempOk = temp !== null && temp >= HABITABLE_TEMP_MIN && temp <= HABITABLE_TEMP_MAX;
  const insolationOk = insolation !== null && insolation >= 0.25 && insolation <= 2;

  if (radiusOk && tempOk && insolationOk) {
    return {
      label: "Temperate terrestrial candidate",
      tone: "positive",
      bullets: [
        `Radius ${formatValue(radius, { maximumFractionDigits: 1 }, "R⊕")} within rocky range`,
        `Equilibrium temperature ${formatValue(temp, { maximumFractionDigits: 0 }, "K")} sits in the temperate band`,
        `Insolation ${formatValue(insolation, { maximumFractionDigits: 1 }, "⊕")} compatible with surface water`
      ]
    };
  }

  const reasons: string[] = [];
  if (!radiusOk) {
    reasons.push("Radius suggests a non-terrestrial composition.");
  }
  if (!tempOk) {
    reasons.push("Temperature lies outside the temperate window (180–320 K).");
  }
  if (!insolationOk) {
    reasons.push("Stellar flux is unlikely to permit liquid water.");
  }

  return {
    label: "Limited habitability",
    tone: "warning",
    bullets: reasons.length > 0 ? reasons : ["Additional observations required to assess habitability."]
  };
}

const METRICS: Array<{
  id: string;
  label: string;
  accessor: (detail: PlanetDetail | null) => string;
}> = [
  {
    id: "disposition",
    label: "Disposition",
    accessor: (detail) => detail?.disposition ?? "Unknown"
  },
  {
    id: "radius",
    label: "Radius",
    accessor: (detail) => formatValue(detail?.planetRadiusEarth, { maximumFractionDigits: 2 }, "R⊕")
  },
  {
    id: "period",
    label: "Orbital Period",
    accessor: (detail) => formatValue(detail?.periodDays, { maximumFractionDigits: 2 }, "days")
  },
  {
    id: "temperature",
    label: "Equilibrium Temp",
    accessor: (detail) => formatValue(detail?.equilibriumTempK, { maximumFractionDigits: 0 }, "K")
  },
  {
    id: "insolation",
    label: "Insolation",
    accessor: (detail) => formatValue(detail?.insolationEarth, { maximumFractionDigits: 1 }, "⊕")
  },
  {
    id: "semi-major-axis",
    label: "Semi-major Axis",
    accessor: (detail) => formatValue(detail?.semiMajorAxisAu, { maximumFractionDigits: 2 }, "AU")
  },
  {
    id: "star-temp",
    label: "Stellar Temperature",
    accessor: (detail) => formatValue(detail?.stellarEffectiveTempK, { maximumFractionDigits: 0 }, "K")
  },
  {
    id: "star-brightness",
    label: "Star Brightness Index",
    accessor: (detail) => formatValue(detail?.stellarBrightnessIndex, { maximumFractionDigits: 2 })
  }
];

function PlanetSelect({
  planets,
  label,
  value,
  onChange
}: {
  planets: FeaturedPlanet[];
  label: string;
  value: string;
  onChange: (value: string) => void;
}): JSX.Element {
  return (
    <label className="flex flex-col gap-2 text-sm text-brand-slate/70">
      <span className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">{label}</span>
      <select
        className="rounded-xl border border-brand-slate/40 bg-brand-indigo/40 px-3 py-2 text-sm font-semibold text-brand-white focus:border-brand-accent focus:outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {planets.map((planet) => (
          <option key={planet.name} value={planet.name}>
            {planet.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function MetricsTable({ left, right }: { left: PlanetDetail | null; right: PlanetDetail | null }): JSX.Element {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-brand-slate/30 text-sm">
        <thead className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">
          <tr>
            <th className="py-3 pr-4 text-left">Metric</th>
            <th className="py-3 px-4 text-left text-brand-white">Planet A</th>
            <th className="py-3 px-4 text-left text-brand-white">Planet B</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-slate/25 text-brand-white/90">
          {METRICS.map((metric) => (
            <tr key={metric.id}>
              <td className="py-3 pr-4 text-brand-slate/60">{metric.label}</td>
              <td className="py-3 px-4">{metric.accessor(left)}</td>
              <td className="py-3 px-4">{metric.accessor(right)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HabitabilityCard({ title, detail }: { title: string; detail: PlanetDetail | null }): JSX.Element {
  const summary = summarizeHabitability(detail);
  const toneClass =
    summary.tone === "positive"
      ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-200"
      : summary.tone === "warning"
      ? "border-amber-400/60 bg-amber-400/10 text-amber-200"
      : "border-brand-slate/40 bg-brand-indigo/40 text-brand-slate/60";

  return (
    <Card title={title} description={summary.label}>
      <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClass}`}>
        <ul className="space-y-2">
          {summary.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export default function Compare(): JSX.Element {
  const planets = useMemo(() => {
    const all = getAllFeaturedPlanets();
    all.sort((a, b) => (b.koiScore ?? 0) - (a.koiScore ?? 0));
    return all;
  }, []);

  const defaultLeft = planets[0]?.name ?? "";
  const defaultRight = planets[1]?.name ?? planets[0]?.name ?? "";

  const [leftPlanetName, setLeftPlanetName] = useState<string>(defaultLeft);
  const [rightPlanetName, setRightPlanetName] = useState<string>(defaultRight);

  const leftDetail = useMemo<PlanetDetail | null>(() => (leftPlanetName ? getPlanetDetailByName(leftPlanetName) : null), [leftPlanetName]);
  const rightDetail = useMemo<PlanetDetail | null>(() => (rightPlanetName ? getPlanetDetailByName(rightPlanetName) : null), [rightPlanetName]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
      <header className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-slate/40 bg-brand-indigo/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-brand-slate/70">
          Comparative Lab
        </span>
        <h1 className="text-3xl font-semibold text-brand-white sm:text-4xl lg:text-5xl">Planet-to-Planet Comparison</h1>
        <p className="max-w-3xl text-base text-brand-slate/70 sm:text-lg">
          Select any two Kepler Objects of Interest to inspect their stellar context, orbital characteristics, and habitability cues
          side by side. Perfect for building prioritisation decks or explaining trade-offs to stakeholders.
        </p>
      </header>

      <Card title="Choose planets" description="Align two KOIs for comparison" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <PlanetSelect planets={planets} label="Planet A" value={leftPlanetName} onChange={setLeftPlanetName} />
          <button
            type="button"
            onClick={() => {
              setLeftPlanetName(rightPlanetName);
              setRightPlanetName(leftPlanetName);
            }}
            className="mt-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-slate/40 bg-brand-indigo/40 text-brand-slate/70 transition hover:border-brand-accent hover:text-brand-accent md:mt-0"
            aria-label="Swap planets"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <PlanetSelect planets={planets} label="Planet B" value={rightPlanetName} onChange={setRightPlanetName} />
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title={leftPlanetName || "Planet A"} description="Orbit snapshot">
          {leftDetail ? (
            <OrbitSimulation planet={leftDetail} />
          ) : (
            <p className="text-sm text-brand-slate/70">Select a planet to render its orbit preview.</p>
          )}
        </Card>
        <Card title={rightPlanetName || "Planet B"} description="Orbit snapshot">
          {rightDetail ? (
            <OrbitSimulation planet={rightDetail} />
          ) : (
            <p className="text-sm text-brand-slate/70">Select a planet to render its orbit preview.</p>
          )}
        </Card>
      </section>

      <Card title="Key metrics" description="Compare orbital and stellar parameters">
        <MetricsTable left={leftDetail} right={rightDetail} />
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <HabitabilityCard title={leftPlanetName || "Planet A"} detail={leftDetail} />
        <HabitabilityCard title={rightPlanetName || "Planet B"} detail={rightDetail} />
      </section>
    </main>
  );
}
