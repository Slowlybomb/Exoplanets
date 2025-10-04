import { Card } from "../components/ui/Card";
import {
  dispositionSummary,
  exoplanetSummaryStats,
  leadingCandidates,
  topConfirmedPlanets
} from "../data/exoplanets";

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
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
      <header className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-slate/40 bg-brand-indigo/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-brand-slate/70">
          Archive Analytics
        </span>
        <h1 className="text-3xl font-semibold text-brand-white sm:text-4xl lg:text-5xl">Disposition Dashboard</h1>
        <p className="max-w-2xl text-base text-brand-slate/70 sm:text-lg">
          Track the distribution of archive labels, surface planets most likely to be real, and shortlist the strongest candidates for
          your AI-assisted vetting workflow.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card
          title="Disposition Breakdown"
          description={`How ${exoplanetSummaryStats.totalCatalogued.toLocaleString()} KOIs are labeled`}
        >
          <div className="flex flex-wrap gap-4">
            {dispositionSummary.map((item) => (
              <div
                key={item.disposition}
                className="flex min-w-[180px] flex-1 items-center justify-between rounded-xl border border-brand-slate/35 bg-brand-indigo/60 px-4 py-3"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-slate/70">{item.disposition}</p>
                  <p className="text-lg font-semibold text-brand-white">{item.count.toLocaleString()}</p>
                </div>
                <span className="text-sm font-medium text-brand-accent">
                  {((item.count / exoplanetSummaryStats.totalCatalogued) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Key Ratios" description="Signal health at a glance">
          <ul className="space-y-4 text-sm text-brand-slate/70">
            <li className="flex items-center justify-between rounded-2xl border border-brand-slate/30 bg-brand-indigo/50 px-4 py-3">
              <span className="font-semibold text-brand-white">Confirmation rate</span>
              <span className="text-brand-accent">
                {((exoplanetSummaryStats.confirmedCount / exoplanetSummaryStats.totalCatalogued) * 100).toFixed(1)}%
              </span>
            </li>
            <li className="flex items-center justify-between rounded-2xl border border-brand-slate/30 bg-brand-indigo/50 px-4 py-3">
              <span className="font-semibold text-brand-white">Candidate share</span>
              <span className="text-brand-accent">
                {((exoplanetSummaryStats.candidateCount / exoplanetSummaryStats.totalCatalogued) * 100).toFixed(1)}%
              </span>
            </li>
            <li className="flex items-center justify-between rounded-2xl border border-brand-slate/30 bg-brand-indigo/50 px-4 py-3">
              <span className="font-semibold text-brand-white">False positives</span>
              <span className="text-brand-accent">
                {((exoplanetSummaryStats.falsePositiveCount / exoplanetSummaryStats.totalCatalogued) * 100).toFixed(1)}%
              </span>
            </li>
          </ul>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <PlanetTable title="Top Confirmed Exoplanets" rows={topConfirmedPlanets} />
        <PlanetTable title="Leading KOI Candidates" rows={leadingCandidates} />
      </section>
    </main>
  );
}
