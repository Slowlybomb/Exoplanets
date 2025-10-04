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
    tooltip: "Total count of Kepler Objects of Interest in this CSV, including confirmed planets, candidates, and signals later marked as false positives."
  },
  {
    id: "confirmed",
    title: "Confirmed Exoplanets",
    value: exoplanetSummaryStats.confirmedCount.toLocaleString(),
    detail: "Archive disposition CONFIRMED",
    tooltip: "KOIs that have enough follow-up evidence to be validated as real exoplanets by the NASA archive team."
  },
  {
    id: "candidate",
    title: "Promising Candidates",
    value: exoplanetSummaryStats.candidateCount.toLocaleString(),
    detail: "Awaiting follow-up or validation",
    tooltip: "Signals that look planetary but still need more observations before NASA will call them confirmed."
  },
  {
    id: "temperate",
    title: "Temperate Small Worlds",
    value: exoplanetSummaryStats.smallTemperateCount.toLocaleString(),
    detail: "≤2 R⊕ and 180–320 K equilibrium",
    tooltip: "Planets that are roughly Earth-sized and fall within a temperature band where surface water could stay liquid."
  },
  {
    id: "median-radius",
    title: "Median Planet Size",
    value:
      exoplanetSummaryStats.medianRadius !== null
        ? `${exoplanetSummaryStats.medianRadius.toFixed(2)} R⊕`
        : "—",
    detail: "Across planets with measured radius",
    tooltip: "Half the planets with measured radius are smaller than this value and half are larger—useful when comparing catalog updates."
  },
  {
    id: "brightness-index",
    title: "Star Brightness Index",
    value:
      exoplanetSummaryStats.averageStarBrightnessIndex !== null
        ? exoplanetSummaryStats.averageStarBrightnessIndex.toFixed(2)
        : "—",
    detail: "Average host-star brightness vs Sun (1.0 ≈ Sun)",
    tooltip: "Calculated from stellar effective temperature compared with the Sun (Teff ≈ 5778 K). Values above 1.0 indicate hotter, brighter stars; below 1.0 indicates cooler hosts."
  },
  {
    id: "false-positive",
    title: "Flagged False Positives",
    value: exoplanetSummaryStats.falsePositiveCount.toLocaleString(),
    detail: "KOIs no longer considered planetary",
    tooltip: "Signals once tagged as KOIs that later turned out to be stellar noise, instrumentation artifacts, or eclipsing binary stars."
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
    title: "Archive Analytics",
    description: "Disposition breakdowns, candidate rankings, and follow-up priorities.",
    href: "/analytics"
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

export default function Overview(): JSX.Element {
  const topPlanet = topConfirmedPlanets[0];
  const leadingCandidate = leadingCandidates[0];
  const confirmedFraction = ((exoplanetSummaryStats.confirmedCount / exoplanetSummaryStats.totalCatalogued) * 100).toFixed(1);
  const candidateFraction = ((exoplanetSummaryStats.candidateCount / exoplanetSummaryStats.totalCatalogued) * 100).toFixed(1);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-slate/40 bg-brand-indigo/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-brand-slate/70">
            NASA Exoplanet Archive
          </span>
          <h1 className="text-4xl font-semibold text-brand-white sm:text-5xl">
            Exoplanet Signal Observatory
          </h1>
          <p className="max-w-2xl text-base text-brand-slate/70 sm:text-lg">
            Surface the latest Kepler Objects of Interest (KOIs), explore poster-grade renderings,
            and analyse archive dispositions to accelerate your hackathon AI experiments.
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

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
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
                  KOI score {leadingCandidate.koiScore?.toFixed(2) ?? "—"} · Period {leadingCandidate.periodDays?.toFixed(2) ?? "—"} days ·
                  Radius {leadingCandidate.planetRadiusEarth?.toFixed(2) ?? "—"} R⊕
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

        <Card title="Disposition Snapshot" description={`${confirmedFraction}% confirmed · ${candidateFraction}% candidates`}>
          <ul className="space-y-3 text-sm text-brand-slate/70">
            {dispositionSummary.slice(0, 4).map((item) => (
              <li key={item.disposition} className="flex items-center justify-between">
                <span className="font-semibold text-brand-white">{item.disposition}</span>
                <span>
                  {item.count.toLocaleString()} · {((item.count / exoplanetSummaryStats.totalCatalogued) * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
          <Link
            to="/analytics"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-accent"
          >
            View full analytics <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </section>

      <Card title="Mission Primer" description="Key context for demos and stakeholder briefings">
        <div className="space-y-3">
          {educationalCallouts.map((callout) => (
            <details
              key={callout.id}
              className="rounded-2xl border border-brand-slate/30 bg-brand-indigo/40 p-4"
            >
              <summary className="cursor-pointer text-sm font-semibold text-brand-white">
                {callout.title}
              </summary>
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
            <Link
              to={link.href}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent"
            >
              Jump in <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        ))}
      </section>
    </main>
  );
}
