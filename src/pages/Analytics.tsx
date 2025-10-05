import { useMemo, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Card } from "../components/ui/Card";
import { InfoTooltip } from "../components/ui/InfoTooltip";
import {
  dispositionSummary,
  exoplanetSummaryStats,
  leadingCandidates,
  topConfirmedPlanets
} from "../data/exoplanets";

type StatHighlight = {
  id: string;
  title: string;
  value: string;
  detail: string;
  tooltip: string;
};

const statHighlights: StatHighlight[] = [
  {
    id: "catalogued",
    title: "Catalogued Objects",
    value: exoplanetSummaryStats.totalCatalogued.toLocaleString(),
    detail: "KOIs in the 2025-10-04 release",
    tooltip:
      "Total count of Kepler Objects of Interest in this CSV, including confirmed planets, candidates, and signals later marked as false positives."
  },
  {
    id: "confirmed",
    title: "Confirmed Exoplanets",
    value: exoplanetSummaryStats.confirmedCount.toLocaleString(),
    detail: "Archive disposition CONFIRMED",
    tooltip:
      "KOIs that have enough follow-up evidence to be validated as real exoplanets by the NASA archive team."
  },
  {
    id: "candidate",
    title: "Promising Candidates",
    value: exoplanetSummaryStats.candidateCount.toLocaleString(),
    detail: "Awaiting follow-up or validation",
    tooltip:
      "Signals that look planetary but still need more observations before NASA will call them confirmed."
  },
  {
    id: "temperate",
    title: "Temperate Small Worlds",
    value: exoplanetSummaryStats.smallTemperateCount.toLocaleString(),
    detail: "≤2 R⊕ and 180–320 K equilibrium",
    tooltip:
      "Planets that are roughly Earth-sized and fall within a temperature band where surface water could stay liquid."
  },
  {
    id: "median-radius",
    title: "Median Planet Size",
    value:
      exoplanetSummaryStats.medianRadius !== null
        ? `${exoplanetSummaryStats.medianRadius.toFixed(2)} R⊕`
        : "—",
    detail: "Across planets with measured radius",
    tooltip:
      "Half the planets with measured radius are smaller than this value and half are larger—useful when comparing catalog updates."
  },
  {
    id: "brightness-index",
    title: "Star Brightness Index",
    value:
      exoplanetSummaryStats.averageStarBrightnessIndex !== null
        ? exoplanetSummaryStats.averageStarBrightnessIndex.toFixed(2)
        : "—",
    detail: "Average host-star brightness vs Sun (1.0 ≈ Sun)",
    tooltip:
      "Calculated from stellar effective temperature compared with the Sun (Teff ≈ 5778 K). Values above 1.0 indicate hotter, brighter stars; below 1.0 indicates cooler hosts."
  },
  {
    id: "false-positive",
    title: "Flagged False Positives",
    value: exoplanetSummaryStats.falsePositiveCount.toLocaleString(),
    detail: "KOIs no longer considered planetary",
    tooltip:
      "Signals once tagged as KOIs that later turned out to be stellar noise, instrumentation artifacts, or eclipsing binary stars."
  }
];

const quickLinks = [
  {
    title: "Planet Gallery",
    description: "Poster cards, procedurally generated textures, and detail pages for each KOI.",
    href: "/gallery"
  },
  {
    title: "Orbit Lab",
    description: "Interactive 3D transit preview with adjustable perspective for demos.",
    href: "/orbit"
  },
  {
    title: "Detector",
    description: "Upload KOI light-curve features to get real-time model predictions.",
    href: "/detector"
  }
];

const educationalCallouts = [
  {
    id: "detection",
    title: "Detection Pipeline",
    summary: "How the mission turns tiny dips in starlight into Kepler Objects of Interest (KOIs).",
    points: [
      "Kepler collects light curves—brightness measurements for more than 150,000 stars.",
      "Automated transit search algorithms flag repeating dips that match the shape of a planet eclipse.",
      "The science team vets the signal quality and publishes promising targets as KOIs in the archive."
    ]
  },
  {
    id: "habitability",
    title: "Habitability Criteria",
    summary: "Rules of thumb for spotting potentially temperate, Earth-sized worlds.",
    points: [
      "Radius near or below two Earth radii suggests a rocky composition instead of a gas giant.",
      "Equilibrium temperature between roughly 180–320 K keeps a planet in the not-too-hot/not-too-cold zone.",
      "Stable orbits around quieter, Sun-like stars make follow-up climate studies more practical."
    ]
  },
  {
    id: "follow-up",
    title: "Follow-up Workflow",
    summary: "What happens after a KOI looks convincing enough to chase down.",
    points: [
      "Ground-based telescopes confirm the signal and rule out background stars or eclipsing binaries.",
      "Spectroscopic measurements estimate the host star’s properties, refining the planet’s size and orbit.",
      "Validated planets graduate to CONFIRMED status and become prime candidates for atmospheric study."
    ]
  }
];

const dispositionColors: Record<string, string> = {
  CONFIRMED: "#2dd4bf",
  CANDIDATE: "#a855f7",
  "FALSE POSITIVE": "#f97316",
  OTHER: "#4b5563"
};

const dispositionDetails: Record<
  string,
  {
    title: string;
    description: string;
    callToAction: string;
  }
> = {
  CONFIRMED: {
    title: "Confirmed planets",
    description: "Validated by follow-up observations and listed as real exoplanets in the archive.",
    callToAction: "Use them as benchmarks for your classifier output."
  },
  CANDIDATE: {
    title: "KOI candidates",
    description: "Signals that resemble planets but still need additional observing time.",
    callToAction: "Prioritise these targets for follow-up or AI-assisted vetting."
  },
  "FALSE POSITIVE": {
    title: "False positives",
    description: "Signals later traced back to stellar binaries, instrument noise, or other artefacts.",
    callToAction: "Train rejection models or build counter-examples for demo scenarios."
  }
};

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function DispositionExplorer(): JSX.Element {
  const total = exoplanetSummaryStats.totalCatalogued;
  const slices = useMemo(
    () =>
      dispositionSummary.map((item) => {
        const percent = total > 0 ? (item.count / total) * 100 : 0;
        const color = dispositionColors[item.disposition] ?? dispositionColors.OTHER;
        return { ...item, percent, color };
      }),
    [total]
  );

  const [activeDisposition, setActiveDisposition] = useState<string>(slices[0]?.disposition ?? "");

  const activeSlice = useMemo(() => slices.find((slice) => slice.disposition === activeDisposition), [activeDisposition, slices]);

  const detail = dispositionDetails[activeSlice?.disposition ?? ""] ?? {
    title: "Archive disposition",
    description: "Select a disposition type to explore how many KOIs fall inside the label.",
    callToAction: "Use the counts to scope your analytics or classifier demos."
  };

  const matchingPlanets = useMemo(() => {
    const shortlist = [...topConfirmedPlanets, ...leadingCandidates];
    if (!activeSlice) {
      return shortlist.slice(0, 3);
    }

    const filtered = shortlist.filter((planet) => planet.disposition === activeSlice.disposition);
    return (filtered.length > 0 ? filtered : shortlist).slice(0, 3);
  }, [activeSlice, leadingCandidates, topConfirmedPlanets]);

  return (
    <div className="space-y-6">
      <div className="flex h-6 w-full overflow-hidden rounded-full border border-brand-slate/25 bg-brand-indigo/40">
        {slices.map((slice) => (
          <button
            key={slice.disposition}
            type="button"
            className="h-full"
            style={{ width: `${slice.percent}%`, backgroundColor: slice.color }}
            title={`${slice.disposition}: ${slice.percent.toFixed(1)}%`}
            onClick={() => setActiveDisposition(slice.disposition)}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {slices.map((slice) => {
          const isActive = slice.disposition === activeDisposition;
          return (
            <button
              key={slice.disposition}
              type="button"
              onClick={() => setActiveDisposition(slice.disposition)}
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition ${
                isActive ? "bg-brand-accent/20 text-brand-accent" : "bg-brand-indigo/40 text-brand-slate/70 hover:bg-brand-indigo/60"
              }`}
            >
              {slice.disposition}
            </button>
          );
        })}
      </div>

      <div className="space-y-3 rounded-2xl border border-brand-slate/25 bg-brand-indigo/40 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-brand-slate/60">{detail.title}</p>
            <h3 className="mt-1 text-2xl font-semibold text-brand-white">
              {activeSlice ? activeSlice.count.toLocaleString() : exoplanetSummaryStats.totalCatalogued.toLocaleString()}
            </h3>
            <p className="text-sm text-brand-slate/70">
              {activeSlice ? formatPercent(activeSlice.percent) : "Explore each disposition to view its share."}
            </p>
          </div>
        </div>
        <p className="text-sm text-brand-slate/70">{detail.description}</p>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-accent">{detail.callToAction}</p>

        <ul className="mt-2 grid gap-2 text-sm text-brand-slate/70 sm:grid-cols-3">
          {matchingPlanets.map((planet) => (
            <li key={planet.name} className="rounded-xl border border-brand-slate/25 bg-brand-midnight/40 px-3 py-2">
              <p className="text-sm font-semibold text-brand-white">{planet.name}</p>
              <p className="text-xs text-brand-slate/60">
                Period {planet.periodDays !== null ? `${planet.periodDays.toFixed(1)} d` : "—"} · Radius {planet.planetRadiusEarth !== null ? `${
                  planet.planetRadiusEarth.toFixed(2)
                } R⊕` : "—"}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

type SparklineProps = {
  values: number[];
  color: string;
};

function Sparkline({ values, color }: SparklineProps): JSX.Element {
  if (values.length === 0) {
    return <div className="h-16 w-full bg-brand-indigo/30" />;
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const horizontalStep = values.length > 1 ? 100 / (values.length - 1) : 100;
  const points = values
    .map((value, index) => {
      const x = index * horizontalStep;
      const y = 36 - ((value - min) / range) * 32;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 40" className="h-16 w-full">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
      {values.map((value, index) => {
        const x = index * horizontalStep;
        const y = 36 - ((value - min) / range) * 32;
        return <circle key={index} cx={x} cy={y} r={1.8} fill={color} opacity={0.75} />;
      })}
    </svg>
  );
}

type CandidateScoreBarsProps = {
  count: number;
};

function CandidateScoreBars({ count }: CandidateScoreBarsProps): JSX.Element {
  const scores = leadingCandidates.slice(0, count).map((candidate) => ({
    name: candidate.name,
    score: candidate.koiScore ?? 0
  }));
  const maxScore = scores.reduce((acc, item) => Math.max(acc, item.score), 0) || 1;

  return (
    <div className="flex items-end justify-between gap-3">
      {scores.map((item) => {
        const heightPercent = (item.score / maxScore) * 100;
        return (
          <div key={item.name} className="flex w-full flex-col items-center gap-2">
            <div className="flex h-24 w-full items-end">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-brand-accent/40 via-brand-accent/70 to-brand-accent"
                style={{ height: `${Math.max(heightPercent, 6)}%` }}
                title={`${item.name}: ${item.score.toFixed(2)}`}
              />
            </div>
            <p className="text-center text-[11px] font-medium text-brand-slate/60">
              {item.name.replace(/^KOI-/, "")}
            </p>
            <p className="text-xs font-semibold text-brand-white">{item.score.toFixed(2)}</p>
          </div>
        );
      })}
    </div>
  );
}

type MetricPreset = {
  key: string;
  label: string;
  description: string;
  color: string;
  values: number[];
  formatter: (value: number) => string;
};

type MetricPlaygroundProps = {
  presets: MetricPreset[];
};

function formatBasicStats(values: number[], formatter: (value: number) => string): Array<{ label: string; value: string }> {
  if (values.length === 0) {
    return [
      { label: "Min", value: "—" },
      { label: "Median", value: "—" },
      { label: "Max", value: "—" }
    ];
  }

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = sorted[Math.floor(sorted.length / 2)];

  return [
    { label: "Min", value: formatter(min) },
    { label: "Median", value: formatter(median) },
    { label: "Max", value: formatter(max) }
  ];
}

function MetricPlayground({ presets }: MetricPlaygroundProps): JSX.Element {
  const [activeKey, setActiveKey] = useState<string>(presets[0]?.key ?? "");
  const activePreset = useMemo(() => presets.find((preset) => preset.key === activeKey) ?? presets[0], [activeKey, presets]);
  const stats = useMemo(() => formatBasicStats(activePreset?.values ?? [], activePreset?.formatter ?? ((value) => value.toFixed(2))), [activePreset]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const isActive = preset.key === activePreset?.key;
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => setActiveKey(preset.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition ${
                isActive ? "bg-brand-accent/20 text-brand-accent" : "bg-brand-indigo/40 text-brand-slate/70 hover:bg-brand-indigo/60"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {activePreset ? (
        <>
          <Sparkline values={activePreset.values} color={activePreset.color} />
          <p className="text-sm text-brand-slate/70">{activePreset.description}</p>
          <dl className="grid gap-3 text-sm text-brand-slate/70 sm:grid-cols-3">
            {stats.map((entry) => (
              <div key={entry.label} className="rounded-xl border border-brand-slate/25 bg-brand-indigo/40 px-3 py-2">
                <dt className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">{entry.label}</dt>
                <dd className="text-lg font-semibold text-brand-white">{entry.value}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : null}
    </div>
  );
}

function CandidateLeaderboard(): JSX.Element {
  const maxCount = Math.max(1, Math.min(leadingCandidates.length, 10));
  const minCount = Math.min(3, maxCount);
  const [count, setCount] = useState<number>(Math.max(minCount, 1));

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    setCount(Number.isFinite(next) ? next : Math.max(minCount, 1));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="candidate-slider" className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-slate/60">
          Top {count} KOIs
        </label>
        <input
          id="candidate-slider"
          type="range"
          min={Math.max(minCount, 1)}
          max={maxCount}
          value={count}
          onChange={handleChange}
          className="h-1 w-40 cursor-pointer appearance-none rounded bg-brand-slate/30 accent-brand-accent"
        />
      </div>
      <CandidateScoreBars count={count} />
      <p className="text-sm text-brand-slate/70">
        Drag the slider to compare how many strong candidates you want to showcase. Scores close to 1.0 are most planet-like.
      </p>
    </div>
  );
}

function ThermalProfileCard(): JSX.Element {
  const options = useMemo(
    () => ({
      candidates: {
        key: "candidates",
        label: "Candidates",
        color: "#f97316",
        values: leadingCandidates
          .map((planet) => planet.equilibriumTempK ?? 0)
          .filter((value) => Number.isFinite(value) && value > 0)
          .slice(0, 20),
        description: "Temperatures pulled from spotlight KOI candidates. Use them to target habitable-zone vetting.",
        formatter: (value: number) => `${Math.round(value)} K`
      },
      confirmed: {
        key: "confirmed",
        label: "Confirmed",
        color: "#38bdf8",
        values: topConfirmedPlanets
          .map((planet) => planet.equilibriumTempK ?? 0)
          .filter((value) => Number.isFinite(value) && value > 0)
          .slice(0, 20),
        description: "Validated planets with measured equilibrium temperatures—great for climate comparisons.",
        formatter: (value: number) => `${Math.round(value)} K`
      }
    }),
    []
  );

  const [dataset, setDataset] = useState<"candidates" | "confirmed">("candidates");
  const active = options[dataset];
  const stats = useMemo(() => formatBasicStats(active.values, active.formatter), [active]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Object.values(options).map((option) => {
          const isActive = option.key === dataset;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setDataset(option.key as typeof dataset)}
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition ${
                isActive ? "bg-brand-accent/20 text-brand-accent" : "bg-brand-indigo/40 text-brand-slate/70 hover:bg-brand-indigo/60"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <Sparkline values={active.values} color={active.color} />
      <p className="text-sm text-brand-slate/70">{active.description}</p>
      <dl className="grid gap-3 text-sm text-brand-slate/70 sm:grid-cols-3">
        {stats.map((entry) => (
          <div key={entry.label} className="rounded-xl border border-brand-slate/25 bg-brand-indigo/40 px-3 py-2">
            <dt className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">{entry.label}</dt>
            <dd className="text-lg font-semibold text-brand-white">{entry.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}




function PlanetTable({
  title,
  rows
}: {
  title: string;
  rows: typeof topConfirmedPlanets;
}): JSX.Element {
  return (
    <Card title={title} description={`${rows.length} highlighted worlds`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-slate/25 text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-brand-slate/70">
            <tr>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 px-4">Disp.</th>
              <th className="py-2 px-4">KOI Score</th>
              <th className="py-2 px-4">Period (days)</th>
              <th className="py-2 px-4">Radius (R⊕)</th>
              <th className="py-2 px-4">Teq (K)</th>
              <th className="py-2 px-4">Flux (⊕)</th>
              <th className="py-2 px-4">Star Brightness</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-slate/20 text-brand-white/90">
            {rows.map((planet) => (
              <tr key={planet.name} className="transition hover:bg-brand-indigo/60">
                <td className="py-3 pr-4 font-medium text-brand-white">{planet.name}</td>
                <td className="py-3 px-4">{planet.disposition}</td>
                <td className="py-3 px-4">{planet.koiScore !== null ? planet.koiScore.toFixed(2) : "—"}</td>
                <td className="py-3 px-4">{planet.periodDays !== null ? planet.periodDays.toFixed(2) : "—"}</td>
                <td className="py-3 px-4">{planet.planetRadiusEarth !== null ? planet.planetRadiusEarth.toFixed(2) : "—"}</td>
                <td className="py-3 px-4">{planet.equilibriumTempK !== null ? Math.round(planet.equilibriumTempK) : "—"}</td>
                <td className="py-3 px-4">{planet.insolationEarth !== null ? planet.insolationEarth.toFixed(1) : "—"}</td>
                <td className="py-3 px-4">
                  {planet.stellarBrightnessIndex !== null ? planet.stellarBrightnessIndex.toFixed(2) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function Analytics(): JSX.Element {
  const topPlanet = topConfirmedPlanets[0];
  const leadingCandidate = leadingCandidates[0];

  const confirmedFraction = useMemo(() => {
    if (exoplanetSummaryStats.totalCatalogued === 0) {
      return 0;
    }

    return (exoplanetSummaryStats.confirmedCount / exoplanetSummaryStats.totalCatalogued) * 100;
  }, []);

  const candidateFraction = useMemo(() => {
    if (exoplanetSummaryStats.totalCatalogued === 0) {
      return 0;
    }

    return (exoplanetSummaryStats.candidateCount / exoplanetSummaryStats.totalCatalogued) * 100;
  }, []);

  const periodValues = useMemo(
    () =>
      topConfirmedPlanets
        .map((planet) => planet.periodDays ?? 0)
        .filter((value) => Number.isFinite(value) && value > 0)
        .slice(0, 20),
    []
  );

  const temperatureValues = useMemo(
    () =>
      leadingCandidates
        .map((planet) => planet.equilibriumTempK ?? 0)
        .filter((value) => Number.isFinite(value) && value > 0)
        .slice(0, 12),
    []
  );

  const radiusValues = useMemo(
    () =>
      topConfirmedPlanets
        .map((planet) => planet.planetRadiusEarth ?? 0)
        .filter((value) => Number.isFinite(value) && value > 0)
        .slice(0, 20),
    []
  );

  const fluxValues = useMemo(
    () =>
      topConfirmedPlanets
        .map((planet) => planet.insolationEarth ?? 0)
        .filter((value) => Number.isFinite(value) && value > 0)
        .slice(0, 20),
    []
  );

  const metricPresets = useMemo<MetricPreset[]>(
    () => [
      {
        key: "period",
        label: "Orbital Period",
        description: "Days between transits for top confirmed worlds. Longer periods often need more observation time.",
        color: "#38bdf8",
        values: periodValues,
        formatter: (value: number) => `${value.toFixed(1)} d`
      },
      {
        key: "radius",
        label: "Planet Radius",
        description: "Earth radii for the highlighted confirmations—helpful for sizing up habitable candidates.",
        color: "#34d399",
        values: radiusValues,
        formatter: (value: number) => `${value.toFixed(2)} R⊕`
      },
      {
        key: "flux",
        label: "Stellar Flux",
        description: "Relative stellar flux (⊕) that each confirmed planet receives from its star.",
        color: "#facc15",
        values: fluxValues,
        formatter: (value: number) => `${value.toFixed(1)} ⊕`
      },
      {
        key: "temperature",
        label: "Equilibrium Temp",
        description: "Modeled equilibrium temperatures across leading KOI candidates.",
        color: "#f97316",
        values: temperatureValues,
        formatter: (value: number) => `${Math.round(value)} K`
      }
    ],
    [fluxValues, periodValues, radiusValues, temperatureValues]
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-slate/40 bg-brand-indigo/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-brand-slate/70">
            NASA Exoplanet Archive
          </span>
          <h1 className="text-4xl font-semibold text-brand-white sm:text-5xl">Mission Analytics Hub</h1>
          <p className="max-w-2xl text-base text-brand-slate/70 sm:text-lg">
            Unite archive dispositions, mission metrics, and discovery stories in one dashboard. Surface the KOIs worth watching and
            brief stakeholders with ready-made visuals.
          </p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statHighlights.map((stat) => (
          <Card key={stat.id} title={stat.title} description={stat.value}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-brand-slate/70">{stat.detail}</p>
              {stat.tooltip ? (
                <InfoTooltip label={`What does ${stat.title} mean?`}>
                  {stat.tooltip}
                </InfoTooltip>
              ) : null}
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card title="Disposition Breakdown" description={`How ${exoplanetSummaryStats.totalCatalogued.toLocaleString()} KOIs are labeled`}>
          <DispositionExplorer />
        </Card>

        <Card title="Signal Health" description="Quick ratios from the archive">
          <ul className="space-y-4 text-sm text-brand-slate/70">
            <li className="flex items-center justify-between rounded-2xl border border-brand-slate/30 bg-brand-indigo/50 px-4 py-3">
              <span className="font-semibold text-brand-white">Confirmation rate</span>
              <span className="text-brand-accent">{formatPercent(confirmedFraction)}</span>
            </li>
            <li className="flex items-center justify-between rounded-2xl border border-brand-slate/30 bg-brand-indigo/50 px-4 py-3">
              <span className="font-semibold text-brand-white">Candidate share</span>
              <span className="text-brand-accent">{formatPercent(candidateFraction)}</span>
            </li>
            <li className="flex items-center justify-between rounded-2xl border border-brand-slate/30 bg-brand-indigo/50 px-4 py-3">
              <span className="font-semibold text-brand-white">False positives</span>
              <span className="text-brand-accent">
                {formatPercent(
                  exoplanetSummaryStats.totalCatalogued > 0
                    ? (exoplanetSummaryStats.falsePositiveCount / exoplanetSummaryStats.totalCatalogued) * 100
                    : 0
                )}
              </span>
            </li>
          </ul>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Card title="Signals To Watch" description="High-confidence exoplanets and inspiring candidates">
          <div className="grid gap-4 md:grid-cols-2">
            {topPlanet ? (
              <div className="rounded-2xl border border-brand-slate/30 bg-brand-indigo/50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Confirmed Highlight</p>
                <h3 className="mt-2 text-xl font-semibold text-brand-white">{topPlanet.name}</h3>
                <p className="mt-2 text-sm text-brand-slate/60">
                  KOI score {topPlanet.koiScore?.toFixed(2) ?? "—"} · Period {topPlanet.periodDays?.toFixed(2) ?? "—"} days · Radius {" "}
                  {topPlanet.planetRadiusEarth?.toFixed(2) ?? "—"} R⊕
                </p>
                <Link
                  to={`/planet/${encodeURIComponent(topPlanet.name)}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-accent"
                >
                  Open detail <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : null}

            {leadingCandidate ? (
              <div className="rounded-2xl border border-brand-slate/30 bg-brand-indigo/50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Candidate Spotlight</p>
                <h3 className="mt-2 text-xl font-semibold text-brand-white">{leadingCandidate.name}</h3>
                <p className="mt-2 text-sm text-brand-slate/60">
                  KOI score {leadingCandidate.koiScore?.toFixed(2) ?? "—"} · Period {leadingCandidate.periodDays?.toFixed(2) ?? "—"} days · Radius
                  {" "}
                  {leadingCandidate.planetRadiusEarth?.toFixed(2) ?? "—"} R⊕
                </p>
                <Link
                  to={`/planet/${encodeURIComponent(leadingCandidate.name)}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-accent"
                >
                  Investigate <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : null}
          </div>
        </Card>

        <Card title="Mission Brief" description="Snapshots to add to your deck">
          <ul className="space-y-3 text-sm text-brand-slate/70">
            <li className="rounded-xl border border-brand-slate/30 bg-brand-indigo/45 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Confirmed world share</p>
              <p className="mt-2 text-2xl font-semibold text-brand-white">{formatPercent(confirmedFraction)}</p>
              <p>Portion of KOIs that NASA has validated as real exoplanets.</p>
            </li>
            <li className="rounded-xl border border-brand-slate/30 bg-brand-indigo/45 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Temperate targets</p>
              <p className="mt-2 text-2xl font-semibold text-brand-white">
                {exoplanetSummaryStats.smallTemperateCount.toLocaleString()} planets
              </p>
              <p>Earth-sized worlds that sit in the temperate zone for follow-up habitability checks.</p>
            </li>
          </ul>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card title="Metric Playground" description="Toggle between mission metrics to explore sample distributions">
          <MetricPlayground presets={metricPresets} />
        </Card>
        <Card title="Candidate Signal Lab" description="Adjust how many KOIs to compare">
          <CandidateLeaderboard />
        </Card>
        <Card title="Thermal Profile" description="Switch between confirmed planets and KOI candidates">
          <ThermalProfileCard />
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <PlanetTable title="Top Confirmed Exoplanets" rows={topConfirmedPlanets} />
        <PlanetTable title="Leading KOI Candidates" rows={leadingCandidates} />
      </section>

      <Card title="Mission Primer" description="Key context for demos and stakeholder briefings">
        <div className="space-y-3">
          {educationalCallouts.map((callout) => (
            <details key={callout.id} className="rounded-2xl border border-brand-slate/30 bg-brand-indigo/40 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-brand-white">{callout.title}</summary>
              <p className="mt-2 text-sm text-brand-slate/70">{callout.summary}</p>
              <ul className="mt-3 space-y-2 text-sm text-brand-slate/70">
                {callout.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {quickLinks.map((link) => (
          <Card key={link.href} title={link.title}>
            <p className="text-sm text-brand-slate/70">{link.description}</p>
            <Link to={link.href} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent">
              Jump in <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        ))}
      </section>
    </main>
  );
}
