import { Link } from "react-router-dom";
import { ArrowUpRight, Compass } from "lucide-react";
import { Card } from "../components/ui/Card";
import {
  dispositionSummary,
  exoplanetSummaryStats,
  leadingCandidates,
  topConfirmedPlanets
} from "../data/exoplanets";

const statHighlights = [
  {
    id: "catalogued",
    title: "Catalogued Objects",
    value: exoplanetSummaryStats.totalCatalogued.toLocaleString(),
    detail: "KOIs in the 2025-10-04 release"
  },
  {
    id: "confirmed",
    title: "Confirmed Exoplanets",
    value: exoplanetSummaryStats.confirmedCount.toLocaleString(),
    detail: "Archive disposition CONFIRMED"
  },
  {
    id: "candidate",
    title: "Promising Candidates",
    value: exoplanetSummaryStats.candidateCount.toLocaleString(),
    detail: "Awaiting follow-up or validation"
  },
  {
    id: "temperate",
    title: "Temperate Small Worlds",
    value: exoplanetSummaryStats.smallTemperateCount.toLocaleString(),
    detail: "≤2 R⊕ and 180–320 K equilibrium"
  },
  {
    id: "median-radius",
    title: "Median Planet Size",
    value:
      exoplanetSummaryStats.medianRadius !== null
        ? `${exoplanetSummaryStats.medianRadius.toFixed(2)} R⊕`
        : "—",
    detail: "Across planets with measured radius"
  },
  {
    id: "false-positive",
    title: "Flagged False Positives",
    value: exoplanetSummaryStats.falsePositiveCount.toLocaleString(),
    detail: "KOIs no longer considered planetary"
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

export default function Overview(): JSX.Element {
  const topPlanet = topConfirmedPlanets[0];
  const leadingCandidate = leadingCandidates[0];
  const confirmedFraction = ((exoplanetSummaryStats.confirmedCount / exoplanetSummaryStats.totalCatalogued) * 100).toFixed(1);
  const candidateFraction = ((exoplanetSummaryStats.candidateCount / exoplanetSummaryStats.totalCatalogued) * 100).toFixed(1);

  return (
    <main className="flex w-full flex-col gap-10 px-6 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
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
        <div className="flex flex-col items-start gap-2 rounded-2xl border border-brand-accent/40 bg-brand-accent/10 px-4 py-3 text-sm text-brand-accent sm:flex-row sm:items-center">
          <Compass className="h-4 w-4" />
          <span>Built for rapid triage of new KOIs · Updated 4 Oct 2025</span>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statHighlights.map((stat) => (
          <Card key={stat.id} title={stat.title} description={stat.value}>
            <p>{stat.detail}</p>
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
