import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { PlanetGallery } from "../components/PlanetGallery";
import { getAllFeaturedPlanets, type FeaturedPlanet } from "../data/exoplanets";

type PredictionResponse = {
  prediction: number;
  features: Record<string, number>;
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

  const handleChange = (key: string, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

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
    }
  };

  const loadSample = async () => {
    setLoading(true);
    setError(null);

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
  };

  const resultPlanet: FeaturedPlanet | undefined = useMemo(() => {
    if (!result || result.prediction !== 1) {
      return undefined;
    }

    const koiScore = result.features.koi_score;
    if (!Number.isFinite(koiScore)) {
      return undefined;
    }

    const nearest = [...allPlanets]
      .map((planet) => {
        const delta = Math.abs((planet.koiScore ?? 0) - koiScore);
        return { planet, delta };
      })
      .sort((a, b) => a.delta - b.delta)[0];

    return nearest?.planet;
  }, [result, allPlanets]);

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
        </Card>

        <Card title="Result" description="Model verdict">
          {loading ? (
            <p className="text-sm text-brand-slate/60">Contacting backend detector...</p>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : result ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Prediction</p>
                <p className={`text-2xl font-semibold ${result.prediction === 1 ? "text-brand-accent" : "text-brand-slate/50"}`}>
                  {result.prediction === 1 ? "Likely planet" : "Likely false positive"}
                </p>
              </div>

              <div className="space-y-2 text-xs uppercase tracking-[0.25em] text-brand-slate/60">
                <p>Input summary</p>
                <pre className="h-48 overflow-auto rounded-2xl border border-brand-slate/30 bg-brand-midnight/60 p-4 text-[11px] text-brand-white/80">
{JSON.stringify(result.features, null, 2)}
                </pre>
              </div>

              {resultPlanet ? (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Closest catalogued match</p>
                  <PlanetGallery
                    planets={[resultPlanet]}
                    selectedPlanetName={resultPlanet.name}
                    onSelectOrbit={(planet) => {
                      navigate(`/planet/${encodeURIComponent(planet.name)}`);
                    }}
                  />
                </div>
              ) : (
                <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">
                  No matching confirmed planet found in the current catalog.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-brand-slate/60">Submit KOI metrics to run the detector.</p>
          )}
        </Card>
      </section>
    </main>
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
