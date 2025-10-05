import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { getAllFeaturedPlanets, type FeaturedPlanet } from "../data/exoplanets";

type PredictionResponse = {
  prediction: number;
  features: Record<string, number>;
  probability?: number;
  error?: string;
};

type BatchPrediction = {
  index: number;
  prediction?: number;
  probability?: number;
  features?: Record<string, number>;
  error?: string;
};

type FormState = Record<string, string>;

const API_URL = "http://localhost:5000/exoplanet";
const FEATURE_FIELDS: Array<{ key: string; label: string; help?: string }> = [
  { key: "koi_period", label: "Orbital Period (days)" },
  { key: "koi_period_err1", label: "Period +σ" },
  { key: "koi_period_err2", label: "Period −σ" },
  { key: "koi_time0bk", label: "Transit Epoch" },
  { key: "koi_time0bk_err1", label: "Epoch +σ" },
  { key: "koi_time0bk_err2", label: "Epoch −σ" },
  { key: "koi_impact", label: "Impact Parameter" },
  { key: "koi_impact_err1", label: "Impact +σ" },
  { key: "koi_impact_err2", label: "Impact −σ" },
  { key: "koi_duration", label: "Transit Duration (hrs)" },
  { key: "koi_duration_err1", label: "Duration +σ" },
  { key: "koi_duration_err2", label: "Duration −σ" },
  { key: "koi_depth", label: "Transit Depth (ppm)" },
  { key: "koi_depth_err1", label: "Depth +σ" },
  { key: "koi_depth_err2", label: "Depth −σ" },
  { key: "koi_prad", label: "Planet Radius (R⊕)" },
  { key: "koi_prad_err1", label: "Radius +σ" },
  { key: "koi_prad_err2", label: "Radius −σ" },
  { key: "koi_teq", label: "Equilibrium Temperature (K)" },
  { key: "koi_insol", label: "Insolation (S⊕)" },
  { key: "koi_insol_err1", label: "Insolation +σ" },
  { key: "koi_insol_err2", label: "Insolation −σ" },
  { key: "koi_model_snr", label: "Model SNR" },
  { key: "koi_tce_plnt_num", label: "Planet Number" },
  { key: "koi_steff", label: "Stellar Teff (K)" },
  { key: "koi_steff_err1", label: "Teff +σ" },
  { key: "koi_steff_err2", label: "Teff −σ" },
  { key: "koi_slogg", label: "Stellar log g" },
  { key: "koi_slogg_err1", label: "log g +σ" },
  { key: "koi_slogg_err2", label: "log g −σ" },
  { key: "koi_srad_err1", label: "Stellar Radius +σ" },
  { key: "koi_srad_err2", label: "Stellar Radius −σ" },
  { key: "ra", label: "Right Ascension" }
];

export default function Detector(): JSX.Element {
  const navigate = useNavigate();
  const allPlanets = useMemo(() => getAllFeaturedPlanets(), []);

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
      }),
    []
  );

  const [formState, setFormState] = useState<FormState>(() => {
    const defaults: FormState = {};
    FEATURE_FIELDS.forEach(({ key }) => {
      defaults[key] = "";
    });
    return defaults;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [batchResults, setBatchResults] = useState<BatchPrediction[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeOperation, setActiveOperation] = useState<"single" | "batch" | null>(null);

  const handleChange = (key: string, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setBatchResults([]);
    setError(null);
    if (file) {
      setResult(null);
    }
    // Allow re-selecting the same file without requiring manual clearing.
    event.target.value = "";
  };

  const runBatchDetection = async () => {
    if (!selectedFile) {
      setError("Select a JSON or CSV file before running batch detection.");
      return;
    }

    setLoading(true);
    setActiveOperation("batch");
    setError(null);
    setResult(null);
    setBatchResults([]);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as { results?: BatchPrediction[]; error?: string };

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Batch detection failed");
      }

      setBatchResults(Array.isArray(payload.results) ? payload.results : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch detection failed");
      setBatchResults([]);
    } finally {
      setLoading(false);
      setActiveOperation(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setActiveOperation("single");
    setError(null);
    setBatchResults([]);
    setResult(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState)
      });

      const payload = (await response.json()) as PredictionResponse;

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Model rejected the payload");
      }

      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setResult(null);
    } finally {
      setLoading(false);
      setActiveOperation(null);
    }
  };

  const loadSample = async () => {
    setLoading(true);
    setError(null);
    setActiveOperation("single");
    setBatchResults([]);
    setResult(null);

    try {
      const response = await fetch(API_URL);
      const payload = (await response.json()) as PredictionResponse;

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Sample request failed");
      }

      setFormState(
        Object.fromEntries(FEATURE_FIELDS.map(({ key }) => [key, String(payload.features[key] ?? "")]))
      );
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sample data");
      setResult(null);
    } finally {
      setLoading(false);
      setActiveOperation(null);
    }
  };

  const resetForm = () => {
    setFormState(() => {
      const defaults: FormState = {};
      FEATURE_FIELDS.forEach(({ key }) => {
        defaults[key] = "";
      });
      return defaults;
    });
    setResult(null);
    setError(null);
    setBatchResults([]);
    setSelectedFile(null);
  };

  const resultMatch = useMemo(() => {
    if (!result || result.prediction !== 1) {
      return undefined;
    }

    const targetRadius = result.features.koi_prad;
    if (typeof targetRadius !== "number" || !Number.isFinite(targetRadius)) {
      return undefined;
    }

    const targetPeriod = result.features.koi_period;
    const targetInsolation = result.features.koi_insol;

    const nearest = [...allPlanets]
      .map((planet) => {
        const radius = planet.planetRadiusEarth;
        const radiusDelta = radius !== null && Number.isFinite(radius) ? Math.abs(radius - targetRadius) : null;

        const period = planet.periodDays;
        const periodDelta =
          period !== null && Number.isFinite(period) && typeof targetPeriod === "number"
            ? Math.abs(period - targetPeriod)
            : null;

        const insolation = planet.insolationEarth;
        const insolationDelta =
          insolation !== null && Number.isFinite(insolation) && typeof targetInsolation === "number"
            ? Math.abs(insolation - targetInsolation)
            : null;

        return {
          planet,
          delta: radiusDelta ?? Number.POSITIVE_INFINITY,
          radiusDelta,
          periodDelta,
          insolationDelta
        };
      })
      .sort((a, b) => a.delta - b.delta)[0];

    if (!nearest || !Number.isFinite(nearest.delta)) {
      return undefined;
    }

    return {
      planet: nearest.planet,
      radiusDelta: nearest.radiusDelta ?? null,
      periodDelta: nearest.periodDelta ?? null,
      insolationDelta: nearest.insolationDelta ?? null
    };
  }, [result, allPlanets]);

  const batchSuccessCount = useMemo(
    () => batchResults.reduce((count, entry) => (entry.error ? count : count + 1), 0),
    [batchResults]
  );
  const batchFailureCount = batchResults.length - batchSuccessCount;
  const hasBatchResults = batchResults.length > 0;
  const successfulBatchEntries = useMemo(
    () => batchResults.filter((entry): entry is BatchPrediction & { prediction: number; probability: number; features: Record<string, number> } => {
      return !entry.error && typeof entry.prediction === "number" && typeof entry.probability === "number" && entry.features != null;
    }),
    [batchResults]
  );
  const batchProbabilities = useMemo(
    () => successfulBatchEntries.map((entry) => entry.probability).filter((value) => Number.isFinite(value)),
    [successfulBatchEntries]
  );
  const batchScatterPoints = useMemo(
    () =>
      successfulBatchEntries
        .map((entry) => {
          const period = entry.features?.koi_period;
          const radius = entry.features?.koi_prad;
          return typeof period === "number" && Number.isFinite(period) && typeof radius === "number" && Number.isFinite(radius)
            ? { period, radius, probability: entry.probability }
            : null;
        })
        .filter((point): point is { period: number; radius: number; probability: number } => point !== null),
    [successfulBatchEntries]
  );

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
      <header className="space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-slate/40 bg-brand-indigo/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-brand-slate/70">
          KOI Classifier
        </span>
        <h1 className="text-3xl font-semibold text-brand-white sm:text-4xl lg:text-5xl">Candidate Detector</h1>
        <p className="max-w-2xl text-base text-brand-slate/70 sm:text-lg">
          Paste Kepler Object of Interest measurements, send them to the backend model, and review whether the candidate is
          likely to be a real exoplanet.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card
          title="Input"
          description="Paste KOI metrics"
          action={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={loadSample}
                className="rounded-full border border-brand-slate/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-brand-white transition hover:border-brand-accent hover:text-brand-accent"
                disabled={loading}
              >
                Load sample
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-brand-slate/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-brand-slate/60 transition hover:border-brand-accent hover:text-brand-accent"
                disabled={loading}
              >
                Reset
              </button>
            </div>
          }
        >
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {FEATURE_FIELDS.map(({ key, label }) => (
                <label key={key} className="space-y-2 text-xs uppercase tracking-[0.3em] text-brand-slate/60">
                  {label}
                  <input
                    type="number"
                    step="any"
                    value={formState[key] ?? ""}
                    onChange={(event) => handleChange(key, event.target.value)}
                    className="w-full rounded-xl border border-brand-slate/40 bg-brand-indigo/50 px-3 py-2 text-sm text-brand-white placeholder:text-brand-slate/50 focus:border-brand-accent focus:outline-none"
                    required
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-full border border-brand-accent bg-brand-accent/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-accent transition hover:bg-brand-accent/20"
                disabled={loading}
              >
                {loading ? "Detecting..." : "Run detector"}
              </button>
            </div>
          </form>

          <section className="mt-6 space-y-3 rounded-2xl border border-brand-slate/35 bg-brand-indigo/30 p-4">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-white/90">Batch detection</h3>
                <p className="text-[11px] uppercase tracking-[0.2em] text-brand-slate/60">Upload JSON or CSV data pack</p>
              </div>
              {selectedFile && (
                <span className="truncate text-[11px] uppercase tracking-[0.2em] text-brand-accent">{selectedFile.name}</span>
              )}
            </header>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-brand-slate/40 bg-brand-midnight/40 px-4 py-3 text-xs uppercase tracking-[0.3em] text-brand-slate/70 transition hover:border-brand-accent hover:text-brand-accent">
                <input
                  type="file"
                  accept=".json,.csv,application/json,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                Select file
              </label>

              <button
                type="button"
                onClick={runBatchDetection}
                className="rounded-full border border-brand-accent bg-brand-accent/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-accent transition hover:bg-brand-accent/20 disabled:opacity-40"
                disabled={loading || !selectedFile}
              >
                {activeOperation === "batch" ? "Uploading..." : "Run batch"}
              </button>
            </div>

            <p className="text-[11px] uppercase tracking-[0.2em] text-brand-slate/50">
              Provide multiple KOI records at once. JSON arrays and CSV headers must match the detector feature keys.
            </p>
          </section>
        </Card>

        <Card title="Result" description="Model verdict">
          {loading ? (
            <p className="text-sm text-brand-slate/60">
              {activeOperation === "batch" ? "Uploading data pack to the detector..." : "Contacting backend detector..."}
            </p>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : hasBatchResults ? (
            <div className="space-y-5">
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <span className="rounded-full border border-brand-accent/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-accent">
                    Batch predictions
                  </span>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-brand-slate/60">
                    {batchSuccessCount} successes / {batchFailureCount} errors
                  </p>
                </div>
                <span className="text-[11px] uppercase tracking-[0.25em] text-brand-slate/60">
                  {batchResults.length} records processed
                </span>
              </header>

              <div className="max-h-80 space-y-3 overflow-auto pr-1">
                {batchResults.map((entry) => {
                  const isPlanet = entry.prediction === 1;
                  const statusLabel = entry.error
                    ? "Error"
                    : isPlanet
                      ? "Likely planet"
                      : "Likely false positive";
                  const statusClass = entry.error
                    ? "text-red-400"
                    : isPlanet
                      ? "text-brand-accent"
                      : "text-brand-slate/40";
                  const radius = entry.features?.koi_prad;
                  const period = entry.features?.koi_period;
                  const radiusDisplay =
                    typeof radius === "number" && Number.isFinite(radius)
                      ? `${numberFormatter.format(radius)} R⊕`
                      : "Unknown";
                  const periodDisplay =
                    typeof period === "number" && Number.isFinite(period)
                      ? `${numberFormatter.format(period)} days`
                      : "Unknown";

                  return (
                    <article
                      key={entry.index}
                      className="space-y-3 rounded-2xl border border-brand-slate/35 bg-brand-indigo/40 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] uppercase tracking-[0.3em] text-brand-slate/60">
                          Row #{entry.index + 1}
                        </span>
                        <span className={`text-xs font-semibold uppercase tracking-[0.3em] ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {entry.error ? (
                        <p className="text-sm text-red-300">{entry.error}</p>
                      ) : (
                        <div className="space-y-3 text-sm text-brand-white/80">
                          {typeof entry.probability === "number" && (
                            <ConfidencePill probability={entry.probability} />
                          )}

                          <div className="grid grid-cols-1 gap-2 text-[11px] uppercase tracking-[0.25em] text-brand-slate/60 sm:grid-cols-2">
                            <span>Radius: {radiusDisplay}</span>
                            <span>Period: {periodDisplay}</span>
                          </div>

                          <pre className="max-h-40 overflow-auto rounded-xl border border-brand-slate/30 bg-brand-midnight/40 p-3 text-[11px] leading-relaxed text-brand-white/70">
{JSON.stringify(entry.features ?? {}, null, 2)}
                          </pre>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              <BatchInsights
                totalRecords={batchResults.length}
                successfulCount={batchSuccessCount}
                probabilities={batchProbabilities}
                scatterPoints={batchScatterPoints}
              />
            </div>
          ) : result ? (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4 rounded-3xl border border-brand-slate/35 bg-brand-indigo/40 p-6 shadow-card-glow">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-brand-accent/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-accent">
                      Prediction
                    </span>
                    {typeof result.probability === "number" && (
                      <ConfidencePill probability={result.probability} />
                    )}
                  </div>

                  <div className="space-y-3">
                    <h2 className={`text-3xl font-semibold ${result.prediction === 1 ? "text-brand-accent" : "text-brand-slate/30"}`}>
                      {result.prediction === 1 ? "Likely planet" : "Likely false positive"}
                    </h2>
                    <p className="text-sm text-brand-slate/60">
                      The classifier analyses transit depth, orbital period, star properties, and other KOI metrics to estimate whether the
                      candidate represents a real exoplanet.
                    </p>
                  </div>

                  <ul className="grid gap-3 text-xs uppercase tracking-[0.25em] text-brand-slate/60 md:grid-cols-2">
                    <MetricBadge
                      label="Radius"
                      value={`${numberFormatter.format(result.features.koi_prad)} R⊕`}
                    />
                    <MetricBadge
                      label="Orbital period"
                      value={`${numberFormatter.format(result.features.koi_period)} days`}
                    />
                    <MetricBadge
                      label="Equilibrium temp"
                      value={`${numberFormatter.format(result.features.koi_teq)} K`}
                    />
                    <MetricBadge
                      label="Stellar Teff"
                      value={`${numberFormatter.format(result.features.koi_steff)} K`}
                    />
                  </ul>
                </div>

                <div className="rounded-3xl border border-brand-slate/35 bg-brand-midnight/60 p-6 text-xs uppercase tracking-[0.25em] text-brand-slate/60">
                  <p className="mb-3 font-semibold">Input summary</p>
                  <pre className="h-60 overflow-auto rounded-2xl border border-brand-slate/30 bg-brand-indigo/40 p-4 text-[11px] text-brand-white/80">
{JSON.stringify(result.features, null, 2)}
                  </pre>
                </div>
              </div>

              {resultMatch ? (
                <ClosestMatchPanel
                  match={resultMatch}
                  numberFormatter={numberFormatter}
                  onViewDetails={() => {
                    navigate(`/planet/${encodeURIComponent(resultMatch.planet.name)}`);
                  }}
                />
              ) : (
                <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">
                  No matching confirmed planet found in the current catalog.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-brand-slate/60">
              Submit KOI metrics or upload a file to run the detector.
            </p>
          )}
        </Card>
      </section>
    </main>
  );
}

type ClosestMatch = {
  planet: FeaturedPlanet;
  radiusDelta: number | null;
  periodDelta: number | null;
  insolationDelta: number | null;
};

type ClosestMatchPanelProps = {
  match: ClosestMatch;
  numberFormatter: Intl.NumberFormat;
  onViewDetails: () => void;
};

type BatchInsightsProps = {
  totalRecords: number;
  successfulCount: number;
  probabilities: number[];
  scatterPoints: Array<{ period: number; radius: number; probability: number }>;
};

function ClosestMatchPanel({ match, numberFormatter, onViewDetails }: ClosestMatchPanelProps): JSX.Element {
  const { planet, radiusDelta, periodDelta, insolationDelta } = match;

  const formatDelta = (value: number | null, unit: string): string => {
    if (value === null || !Number.isFinite(value)) {
      return "No data";
    }
    return `${numberFormatter.format(value)} ${unit}`;
  };

  const formatValue = (value: number | null, unit: string): string => {
    if (value === null || !Number.isFinite(value)) {
      return "Unknown";
    }
    return `${numberFormatter.format(value)}${unit}`;
  };

  return (
    <section className="space-y-4 rounded-3xl border border-brand-slate/35 bg-brand-indigo/40 p-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Closest catalogued match</p>
          <h3 className="text-2xl font-semibold text-brand-white">{planet.name}</h3>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-slate/50">{planet.catalogId}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-brand-slate/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-slate/60">
            {planet.disposition}
          </span>
          <button
            type="button"
            onClick={onViewDetails}
            className="rounded-full border border-brand-accent/60 bg-brand-accent/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-accent transition hover:bg-brand-accent/20"
          >
            View planet page
          </button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <MatchMetric
          title="Radius"
          value={formatValue(planet.planetRadiusEarth, " R⊕")}
          delta={formatDelta(radiusDelta, "R⊕ difference")}
        />
        <MatchMetric
          title="Orbital period"
          value={formatValue(planet.periodDays, " days")}
          delta={formatDelta(periodDelta, "days difference")}
        />
        <MatchMetric
          title="Insolation"
          value={formatValue(planet.insolationEarth, " S⊕")}
          delta={formatDelta(insolationDelta, "S⊕ difference")}
        />
      </div>

      <p className="text-sm text-brand-slate/60">
        Differences highlight how closely the detected candidate aligns with the best match in NASA's public KOI catalogue. Explore the
        planet page to dive into orbital characteristics, discovery method, and additional literature links.
      </p>
    </section>
  );
}

type MatchMetricProps = {
  title: string;
  value: string;
  delta: string;
};

function MatchMetric({ title, value, delta }: MatchMetricProps): JSX.Element {
  return (
    <article className="space-y-2 rounded-2xl border border-brand-slate/30 bg-brand-midnight/40 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">{title}</p>
      <p className="text-lg font-semibold text-brand-white">{value}</p>
      <p className="text-[11px] uppercase tracking-[0.25em] text-brand-slate/50">Δ {delta}</p>
    </article>
  );
}

type MetricBadgeProps = {
  label: string;
  value: string;
};

function MetricBadge({ label, value }: MetricBadgeProps): JSX.Element {
  return (
    <li className="rounded-2xl border border-brand-slate/30 bg-brand-midnight/40 p-3 text-brand-white/80">
      <span className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-slate/60">{label}</span>
      <span className="text-sm font-semibold text-brand-white">{value}</span>
    </li>
  );
}

type ConfidencePillProps = {
  probability: number;
};

function ConfidencePill({ probability }: ConfidencePillProps): JSX.Element {
  const clamped = Math.max(0, Math.min(1, probability));
  const percentage = clamped * 100;

  let label = "Moderate confidence";
  if (percentage >= 80) {
    label = "High confidence";
  } else if (percentage <= 40) {
    label = "Low confidence";
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand-slate/40 bg-brand-midnight/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-white/80">
      {label}
      <span className="rounded-full bg-brand-accent/70 px-2 py-[2px] text-[10px] font-semibold text-brand-midnight">
        {percentage.toFixed(0)}%
      </span>
    </span>
  );
}

function BatchInsights({ totalRecords, successfulCount, probabilities, scatterPoints }: BatchInsightsProps): JSX.Element {
  const successRate = totalRecords > 0 ? (successfulCount / totalRecords) * 100 : 0;
  const averageProbability = probabilities.length > 0 ? probabilities.reduce((sum, value) => sum + value, 0) / probabilities.length : null;
  const confirmedShare = probabilities.length > 0 ? probabilities.filter((value) => value >= 0.5).length / probabilities.length : 0;

  return (
    <section className="space-y-5 rounded-3xl border border-brand-slate/35 bg-brand-midnight/50 p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Batch insights</p>
          <h3 className="text-xl font-semibold text-brand-white">Classifier signal overview</h3>
        </div>
        <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.25em] text-brand-slate/50">
          <span>Processed: {totalRecords}</span>
          <span>Accepted: {successfulCount}</span>
          <span>Success rate: {successRate.toFixed(1)}%</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-brand-slate/35 bg-brand-indigo/40 p-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-white/90">Probability distribution</h4>
            {probabilities.length > 0 ? (
              <ProbabilityHistogram values={probabilities} />
            ) : (
              <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">No successful predictions with probability data.</p>
            )}
          </div>

          <ul className="grid gap-3 text-xs uppercase tracking-[0.25em] text-brand-slate/60 sm:grid-cols-3">
            <li className="rounded-xl border border-brand-slate/30 bg-brand-midnight/40 p-3 text-brand-white/80">
              <p className="text-[10px] font-semibold text-brand-slate/50">Average prob.</p>
              <p className="text-lg font-semibold text-brand-white">
                {averageProbability !== null ? `${(averageProbability * 100).toFixed(1)}%` : "n/a"}
              </p>
            </li>
            <li className="rounded-xl border border-brand-slate/30 bg-brand-midnight/40 p-3 text-brand-white/80">
              <p className="text-[10px] font-semibold text-brand-slate/50">High-confidence share</p>
              <p className="text-lg font-semibold text-brand-white">{(confirmedShare * 100).toFixed(1)}%</p>
            </li>
            <li className="rounded-xl border border-brand-slate/30 bg-brand-midnight/40 p-3 text-brand-white/80">
              <p className="text-[10px] font-semibold text-brand-slate/50">Points plotted</p>
              <p className="text-lg font-semibold text-brand-white">{scatterPoints.length}</p>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-brand-slate/35 bg-brand-indigo/40 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-white/90">Radius vs orbital period</h4>
          {scatterPoints.length > 0 ? (
            <RadiusPeriodScatter points={scatterPoints} />
          ) : (
            <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Insufficient radius/period data for scatter plot.</p>
          )}
        </div>
      </div>
    </section>
  );
}

type ProbabilityHistogramProps = {
  values: number[];
};

function ProbabilityHistogram({ values }: ProbabilityHistogramProps): JSX.Element {
  const binCount = 12;
  const bins = new Array(binCount).fill(0);
  values.forEach((value) => {
    if (!Number.isFinite(value)) {
      return;
    }
    const clamped = Math.max(0, Math.min(0.9999, value));
    const index = Math.min(binCount - 1, Math.floor(clamped * binCount));
    bins[index] += 1;
  });

  const width = 320;
  const height = 140;
  const padding = 20;
  const barWidth = (width - padding * 2) / binCount;
  const maxCount = Math.max(...bins, 0);
  const scale = maxCount > 0 ? (height - padding * 2) / maxCount : 0;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Probability histogram">
      <rect x={0} y={0} width={width} height={height} fill="transparent" />
      {bins.map((count, index) => {
        const barHeight = count * scale;
        const x = padding + index * barWidth;
        const y = height - padding - barHeight;
        return (
          <g key={index}>
            <rect
              x={x + 2}
              y={y}
              width={barWidth - 4}
              height={barHeight}
              rx={3}
              fill="rgba(136, 196, 255, 0.7)"
            />
          </g>
        );
      })}
      <line x1={padding} y1={height - padding} x2={width - padding / 2} y2={height - padding} stroke="rgba(180, 198, 228, 0.4)" strokeWidth={1} />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(180, 198, 228, 0.4)" strokeWidth={1} />
      <text x={padding} y={padding - 6} fontSize={10} fill="rgba(223, 233, 255, 0.8)">
        Count
      </text>
      <text x={width - padding * 2} y={height - padding / 2} fontSize={10} fill="rgba(223, 233, 255, 0.8)">
        Probability →
      </text>
    </svg>
  );
}

type RadiusPeriodScatterProps = {
  points: Array<{ period: number; radius: number; probability: number }>;
};

function RadiusPeriodScatter({ points }: RadiusPeriodScatterProps): JSX.Element {
  const width = 320;
  const height = 200;
  const margin = 28;

  const periods = points.map((point) => point.period);
  const radii = points.map((point) => point.radius);

  const minPeriod = Math.min(...periods);
  const maxPeriod = Math.max(...periods);
  const minRadius = Math.min(...radii);
  const maxRadius = Math.max(...radii);

  const periodRange = maxPeriod - minPeriod || 1;
  const radiusRange = maxRadius - minRadius || 1;

  const scaleX = (value: number) => margin + ((value - minPeriod) / periodRange) * (width - margin * 2);
  const scaleY = (value: number) => height - margin - ((value - minRadius) / radiusRange) * (height - margin * 2);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Radius versus orbital period">
      <rect x={0} y={0} width={width} height={height} fill="transparent" />
      <line x1={margin} y1={height - margin} x2={width - margin / 2} y2={height - margin} stroke="rgba(180, 198, 228, 0.4)" strokeWidth={1} />
      <line x1={margin} y1={margin / 2} x2={margin} y2={height - margin} stroke="rgba(180, 198, 228, 0.4)" strokeWidth={1} />
      {points.map((point, index) => {
        const x = scaleX(point.period);
        const y = scaleY(point.radius);
        const size = 4 + point.probability * 4;
        const color = point.probability >= 0.5 ? "rgba(255, 164, 96, 0.9)" : "rgba(136, 196, 255, 0.7)";
        return <circle key={index} cx={x} cy={y} r={size} fill={color} stroke="rgba(15, 24, 47, 0.8)" strokeWidth={0.8} />;
      })}
      <text x={margin} y={margin - 10} fontSize={10} fill="rgba(223, 233, 255, 0.8)">
        Radius (R⊕)
      </text>
      <text x={width - margin * 2} y={height - margin / 2 + 12} fontSize={10} fill="rgba(223, 233, 255, 0.8)">
        Period (days)
      </text>
    </svg>
  );
}

function loadStringArray(key: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch (error) {
    console.warn(`Unable to parse localStorage key ${key}`, error);
    return [];
  }
}
