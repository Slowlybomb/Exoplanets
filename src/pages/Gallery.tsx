import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Grid3x3 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { PlanetGallery } from "../components/PlanetGallery";
import { getAllFeaturedPlanets } from "../data/exoplanets";
import type { FeaturedPlanet } from "../data/exoplanets";

type FilterState = {
  disposition: DispositionFilter;
  size: SizeFilter;
  temperature: TempFilter;
  period: PeriodFilter;
  score: ScoreFilter;
  star: StarTempFilter;
  search: string;
  favoritesOnly: boolean;
};

type QuickFilter = {
  id: string;
  label: string;
  description?: string;
  state: Partial<FilterState>;
};

type SavedFilterSet = {
  id: string;
  name: string;
  state: FilterState;
};

type FilterChip = {
  id: string;
  label: string;
  onClear: () => void;
};

const FAVORITES_STORAGE_KEY = "exoplanet-gallery-favorites";
const SAVED_FILTERS_STORAGE_KEY = "exoplanet-gallery-saved-filters";

const DISPOSITION_OPTIONS = [
  { id: "all", label: "All dispositions" },
  { id: "confirmed", label: "Confirmed" },
  { id: "candidate", label: "Candidates" }
] as const;

const SIZE_OPTIONS = [
  { id: "all", label: "All sizes" },
  { id: "sub", label: "Smaller than Earth" },
  { id: "earth", label: "Earth-like (≤1.5 R⊕)" },
  { id: "super", label: "Super-Earth (1.5–6 R⊕)" },
  { id: "giant", label: "Gas giants (>6 R⊕)" }
] as const;

const TEMP_OPTIONS = [
  { id: "all", label: "All temperatures" },
  { id: "cold", label: "Colder than Earth" },
  { id: "temperate", label: "Temperate (260–320 K)" },
  { id: "hot", label: "Hotter than Earth" }
] as const;

const PERIOD_OPTIONS = [
  { id: "all", label: "All periods" },
  { id: "ultra", label: "Ultra-short (<10 d)" },
  { id: "short", label: "Short (10–100 d)" },
  { id: "medium", label: "Medium (100–365 d)" },
  { id: "long", label: "Long (>365 d)" }
] as const;

const SCORE_OPTIONS = [
  { id: "all", label: "All KOI scores" },
  { id: "high", label: "High confidence (≥0.9)" },
  { id: "medium", label: "Reliable (0.6–0.9)" },
  { id: "low", label: "Exploratory (<0.6)" }
] as const;

const STAR_TEMP_OPTIONS = [
  { id: "all", label: "All host stars" },
  { id: "cool", label: "Cool dwarfs (<4000 K)" },
  { id: "solar", label: "Solar-like (4000–6000 K)" },
  { id: "hot", label: "Hot stars (>6000 K)" }
] as const;

type DispositionFilter = (typeof DISPOSITION_OPTIONS)[number]["id"];
type SizeFilter = (typeof SIZE_OPTIONS)[number]["id"];
type TempFilter = (typeof TEMP_OPTIONS)[number]["id"];
type PeriodFilter = (typeof PERIOD_OPTIONS)[number]["id"];
type ScoreFilter = (typeof SCORE_OPTIONS)[number]["id"];
type StarTempFilter = (typeof STAR_TEMP_OPTIONS)[number]["id"];

const sizePredicates: Record<SizeFilter, (radius: number | null) => boolean> = {
  all: () => true,
  sub: (radius) => radius !== null && radius < 1,
  earth: (radius) => radius !== null && radius >= 1 && radius <= 1.5,
  super: (radius) => radius !== null && radius > 1.5 && radius <= 6,
  giant: (radius) => radius !== null && radius > 6
};

const temperaturePredicates: Record<TempFilter, (temp: number | null) => boolean> = {
  all: () => true,
  cold: (temp) => temp !== null && temp < 260,
  temperate: (temp) => temp !== null && temp >= 260 && temp <= 320,
  hot: (temp) => temp !== null && temp > 320
};

const periodPredicates: Record<PeriodFilter, (period: number | null) => boolean> = {
  all: () => true,
  ultra: (period) => period !== null && period < 10,
  short: (period) => period !== null && period >= 10 && period <= 100,
  medium: (period) => period !== null && period > 100 && period <= 365,
  long: (period) => period !== null && period > 365
};

const scorePredicates: Record<ScoreFilter, (score: number | null) => boolean> = {
  all: () => true,
  high: (score) => score !== null && score >= 0.9,
  medium: (score) => score !== null && score >= 0.6 && score < 0.9,
  low: (score) => score !== null && score < 0.6
};

const starPredicates: Record<StarTempFilter, (temp: number | null) => boolean> = {
  all: () => true,
  cool: (temp) => temp !== null && temp < 4000,
  solar: (temp) => temp !== null && temp >= 4000 && temp <= 6000,
  hot: (temp) => temp !== null && temp > 6000
};

const DEFAULT_FILTER_STATE: FilterState = {
  disposition: "all",
  size: "all",
  temperature: "all",
  period: "all",
  score: "all",
  star: "all",
  search: "",
  favoritesOnly: false
};

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: "habitable",
    label: "Habitable candidates",
    description: "Confirmed, Earth-sized, temperate, reliable KOI.",
    state: {
      disposition: "confirmed",
      size: "earth",
      temperature: "temperate",
      period: "medium",
      score: "high",
      star: "solar"
    }
  },
  {
    id: "compact",
    label: "Compact systems",
    description: "Ultra-short orbits with small hot worlds.",
    state: {
      period: "ultra",
      size: "sub",
      temperature: "hot"
    }
  },
  {
    id: "cool-giants",
    label: "Cool-star giants",
    description: "Gas giants orbiting cool dwarfs on long periods.",
    state: {
      size: "giant",
      star: "cool",
      period: "long"
    }
  }
];

type FilterSectionProps<T extends string> = {
  label: string;
  options: ReadonlyArray<{ id: T; label: string }>;
  active: T;
  onSelect: (value: T) => void;
};

export default function Gallery(): JSX.Element {
  const navigate = useNavigate();
  const [dispositionFilter, setDispositionFilter] = useState<DispositionFilter>(DEFAULT_FILTER_STATE.disposition);
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>(DEFAULT_FILTER_STATE.size);
  const [temperatureFilter, setTemperatureFilter] = useState<TempFilter>(DEFAULT_FILTER_STATE.temperature);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(DEFAULT_FILTER_STATE.period);
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>(DEFAULT_FILTER_STATE.score);
  const [starFilter, setStarFilter] = useState<StarTempFilter>(DEFAULT_FILTER_STATE.star);
  const [searchTerm, setSearchTerm] = useState<string>(DEFAULT_FILTER_STATE.search);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(DEFAULT_FILTER_STATE.favoritesOnly);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => loadStringArray(FAVORITES_STORAGE_KEY));
  const [savedSets, setSavedSets] = useState<SavedFilterSet[]>(() => loadSavedSets());

  useEffect(() => {
    persistStringArray(FAVORITES_STORAGE_KEY, favoriteIds);
  }, [favoriteIds]);

  useEffect(() => {
    persistSavedSets(savedSets);
  }, [savedSets]);

  const allPlanets = useMemo(() => {
    const list = getAllFeaturedPlanets().slice();
    list.sort((a, b) => (b.koiScore ?? 0) - (a.koiScore ?? 0));
    return list;
  }, []);

  const planetMap = useMemo(() => {
    const map = new Map<string, FeaturedPlanet>();
    allPlanets.forEach((planet) => map.set(planet.catalogId, planet));
    return map;
  }, [allPlanets]);

  const currentFilterState = useMemo<FilterState>(
    () => ({
      disposition: dispositionFilter,
      size: sizeFilter,
      temperature: temperatureFilter,
      period: periodFilter,
      score: scoreFilter,
      star: starFilter,
      search: searchTerm,
      favoritesOnly: showFavoritesOnly
    }),
    [dispositionFilter, sizeFilter, temperatureFilter, periodFilter, scoreFilter, starFilter, searchTerm, showFavoritesOnly]
  );

  const applyFilterState = (state: FilterState) => {
    setDispositionFilter(state.disposition);
    setSizeFilter(state.size);
    setTemperatureFilter(state.temperature);
    setPeriodFilter(state.period);
    setScoreFilter(state.score);
    setStarFilter(state.star);
    setSearchTerm(state.search);
    setShowFavoritesOnly(state.favoritesOnly);
  };

  const planets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const sizeMatch = sizePredicates[sizeFilter];
    const tempMatch = temperaturePredicates[temperatureFilter];
    const periodMatch = periodPredicates[periodFilter];
    const scoreMatch = scorePredicates[scoreFilter];
    const starMatch = starPredicates[starFilter];

    return allPlanets.filter((planet) => {
      if (dispositionFilter === "confirmed" && planet.disposition !== "CONFIRMED") {
        return false;
      }
      if (dispositionFilter === "candidate" && planet.disposition !== "CANDIDATE") {
        return false;
      }
      if (!sizeMatch(planet.planetRadiusEarth ?? null)) {
        return false;
      }
      if (!tempMatch(planet.equilibriumTempK ?? null)) {
        return false;
      }
      if (!periodMatch(planet.periodDays ?? null)) {
        return false;
      }
      if (!scoreMatch(planet.koiScore ?? null)) {
        return false;
      }
      if (!starMatch(planet.stellarEffectiveTempK ?? null)) {
        return false;
      }
      if (showFavoritesOnly && !favoriteIds.includes(planet.catalogId)) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      return (
        planet.name.toLowerCase().includes(normalizedSearch) ||
        planet.catalogId.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [
    allPlanets,
    dispositionFilter,
    sizeFilter,
    temperatureFilter,
    periodFilter,
    scoreFilter,
    starFilter,
    showFavoritesOnly,
    favoriteIds,
    searchTerm
  ]);

  const toggleFavorite = (planet: FeaturedPlanet) => {
    setFavoriteIds((prev) =>
      prev.includes(planet.catalogId)
        ? prev.filter((id) => id !== planet.catalogId)
        : [...prev, planet.catalogId]
    );
  };

  const handleViewOrbit = (planet: FeaturedPlanet) => {
    navigate(`/orbit?planet=${encodeURIComponent(planet.name)}`);
  };

  const resetAllFilters = () => {
    applyFilterState(DEFAULT_FILTER_STATE);
  };

  const saveCurrentFilters = () => {
    if (typeof window === "undefined") {
      return;
    }
    const name = window.prompt("Save filter set as:", "My filters");
    if (!name) {
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const newSet: SavedFilterSet = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmed,
      state: currentFilterState
    };
    setSavedSets((prev) => {
      const others = prev.filter((set) => set.name !== trimmed);
      return [...others, newSet];
    });
  };

  const applySavedSet = (set: SavedFilterSet) => {
    applyFilterState(set.state);
  };

  const deleteSavedSet = (id: string) => {
    setSavedSets((prev) => prev.filter((set) => set.id !== id));
  };

  const applyQuickFilter = (quickFilter: QuickFilter) => {
    const merged: FilterState = { ...DEFAULT_FILTER_STATE, ...quickFilter.state };
    applyFilterState(merged);
  };

  const activeQuickFilterId = useMemo(() => {
    return QUICK_FILTERS.find((quick) => {
      const target: FilterState = { ...DEFAULT_FILTER_STATE, ...quick.state };
      return isSameFilterState(currentFilterState, target);
    })?.id;
  }, [currentFilterState]);

  const filterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];

    if (searchTerm.trim()) {
      chips.push({
        id: "search",
        label: `Search: ${searchTerm.trim()}`,
        onClear: () => setSearchTerm("")
      });
    }

    if (showFavoritesOnly) {
      chips.push({
        id: "favorites",
        label: "Favorites only",
        onClear: () => setShowFavoritesOnly(false)
      });
    }

    const pushOption = <T extends string>(value: T, options: ReadonlyArray<{ id: T; label: string }>, reset: (next: T) => void, id: string) => {
      if (value === "all") {
        return;
      }
      const option = options.find((opt) => opt.id === value);
      if (option) {
        chips.push({
          id,
          label: option.label,
          onClear: () => reset("all" as T)
        });
      }
    };

    pushOption(dispositionFilter, DISPOSITION_OPTIONS, setDispositionFilter, "disposition");
    pushOption(sizeFilter, SIZE_OPTIONS, setSizeFilter, "size");
    pushOption(temperatureFilter, TEMP_OPTIONS, setTemperatureFilter, "temperature");
    pushOption(periodFilter, PERIOD_OPTIONS, setPeriodFilter, "period");
    pushOption(scoreFilter, SCORE_OPTIONS, setScoreFilter, "score");
    pushOption(starFilter, STAR_TEMP_OPTIONS, setStarFilter, "star");

    return chips;
  }, [
    dispositionFilter,
    sizeFilter,
    temperatureFilter,
    periodFilter,
    scoreFilter,
    starFilter,
    searchTerm,
    showFavoritesOnly
  ]);

  const summaryLine = useMemo(() => {
    const parts = new Set<string>();
    parts.add(`${planets.length.toLocaleString()} planets`);
    if (activeQuickFilterId) {
      const quick = QUICK_FILTERS.find((preset) => preset.id === activeQuickFilterId);
      if (quick) {
        parts.add(quick.label);
      }
    }
    filterChips.forEach((chip) => parts.add(chip.label));
    return Array.from(parts).join(" · ");
  }, [planets.length, activeQuickFilterId, filterChips]);

  const savedSetsSummary = useMemo(() => [...savedSets].sort((a, b) => a.name.localeCompare(b.name)), [savedSets]);

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

      <div className="rounded-3xl border border-brand-slate/30 bg-brand-indigo/40 px-5 py-4 text-xs uppercase tracking-[0.25em] text-brand-slate/60">
        {summaryLine}
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_2fr]">
        <Card title="Filter" description="Refine the catalog">
          <div className="space-y-6 text-sm text-brand-slate/70">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-brand-white">
                <Filter className="h-4 w-4 text-brand-accent" />
                Search or filter the KOI collection to zero in on relevant targets.
              </label>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Search catalog ID</p>
                <input
                  type="search"
                  placeholder="e.g. KOI-701.03 or Kepler-62f"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-xl border border-brand-slate/50 bg-brand-midnight/70 px-4 py-3 text-sm text-brand-white placeholder:text-brand-slate/50 focus:border-brand-accent focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowFavoritesOnly((prev) => !prev)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    showFavoritesOnly
                      ? "border border-brand-accent bg-brand-accent/20 text-brand-accent"
                      : "border border-brand-slate/50 bg-transparent text-brand-white hover:border-brand-accent hover:text-brand-accent"
                  }`}
                >
                  {showFavoritesOnly ? "Showing favorites" : "Favorites only"}
                </button>
              </div>

              {filterChips.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-brand-slate/30 bg-brand-indigo/40 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-brand-accent">
                  {filterChips.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={chip.onClear}
                      className="flex items-center gap-1 rounded-full border border-brand-accent/40 bg-brand-accent/10 px-3 py-1 text-brand-accent transition hover:border-brand-accent hover:bg-brand-accent/20"
                    >
                      <span>{chip.label}</span>
                      <span aria-hidden="true">×</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="ml-auto rounded-full border border-brand-slate/40 bg-transparent px-3 py-1 text-[10px] text-brand-slate/60 transition hover:border-brand-accent hover:text-brand-accent"
                  >
                    Clear all
                  </button>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Quick presets</p>
                {activeQuickFilterId ? (
                  <span className="text-[10px] uppercase tracking-[0.3em] text-brand-accent">Active</span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_FILTERS.map((preset) => {
                  const isActive = activeQuickFilterId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyQuickFilter(preset)}
                      title={preset.description}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                        isActive
                          ? "border border-brand-accent bg-brand-accent/20 text-brand-accent"
                          : "border border-brand-slate/50 bg-transparent text-brand-white hover:border-brand-accent hover:text-brand-accent"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
                {activeQuickFilterId ? (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="rounded-full border border-brand-slate/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-white transition hover:border-brand-accent hover:text-brand-accent"
                  >
                    Reset presets
                  </button>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Saved filter sets</p>
                <button
                  type="button"
                  onClick={saveCurrentFilters}
                  className="rounded-full border border-brand-slate/50 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-brand-white transition hover:border-brand-accent hover:text-brand-accent"
                >
                  Save current
                </button>
              </div>
              {savedSetsSummary.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {savedSetsSummary.map((set) => (
                    <div
                      key={set.id}
                      className="flex items-center gap-2 rounded-full border border-brand-slate/40 bg-brand-indigo/40 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-brand-slate/70"
                    >
                      <button
                        type="button"
                        onClick={() => applySavedSet(set)}
                        className="text-brand-white transition hover:text-brand-accent"
                      >
                        {set.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSavedSet(set.id)}
                        className="text-brand-slate/60 transition hover:text-brand-accent"
                        aria-label={`Delete filter set ${set.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] uppercase tracking-[0.3em] text-brand-slate/50">
                  No saved sets yet. Capture your go-to combinations above.
                </p>
              )}
            </div>

            <FilterSection
              label="Disposition"
              options={DISPOSITION_OPTIONS}
              active={dispositionFilter}
              onSelect={setDispositionFilter}
            />

            <FilterSection label="Planet size" options={SIZE_OPTIONS} active={sizeFilter} onSelect={setSizeFilter} />

            <FilterSection
              label="Equilibrium temperature"
              options={TEMP_OPTIONS}
              active={temperatureFilter}
              onSelect={setTemperatureFilter}
            />

            <FilterSection
              label="Orbital period"
              options={PERIOD_OPTIONS}
              active={periodFilter}
              onSelect={setPeriodFilter}
            />

            <FilterSection label="KOI score" options={SCORE_OPTIONS} active={scoreFilter} onSelect={setScoreFilter} />

            <FilterSection label="Host star" options={STAR_TEMP_OPTIONS} active={starFilter} onSelect={setStarFilter} />

            <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">
              Showing {planets.length.toLocaleString()} planets
            </p>
          </div>
        </Card>

        <Card title="Poster Grid" description="Select a world to view details or preview the orbit" className="col-span-full lg:col-span-1">
          <div className="mb-4 flex items-center gap-2 text-sm text-brand-slate/60">
            <Grid3x3 className="h-4 w-4" /> Optimised for desktop · Scroll for more
          </div>
          <PlanetGallery
            planets={planets.slice(0, 24)}
            onSelectOrbit={handleViewOrbit}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
          />
        </Card>
      </section>
    </main>
  );
}

function FilterSection<T extends string>({ label, options, active, onSelect }: FilterSectionProps<T>): JSX.Element {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              active === option.id
                ? "border border-brand-accent bg-brand-accent/20 text-brand-accent"
                : "border border-brand-slate/50 bg-transparent text-brand-white hover:border-brand-accent hover:text-brand-accent"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
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

function persistStringArray(key: string, values: string[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(values));
  } catch (error) {
    console.warn(`Unable to persist localStorage key ${key}`, error);
  }
}

function loadSavedSets(): SavedFilterSet[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(SAVED_FILTERS_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const { id, name, state } = item as SavedFilterSet;
        if (typeof id !== "string" || typeof name !== "string" || typeof state !== "object") {
          return null;
        }
        const normalizedState: FilterState = {
          ...DEFAULT_FILTER_STATE,
          ...state
        };
        return { id, name, state: normalizedState };
      })
      .filter((item): item is SavedFilterSet => Boolean(item));
  } catch (error) {
    console.warn("Unable to parse saved filter sets", error);
    return [];
  }
}

function persistSavedSets(sets: SavedFilterSet[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(SAVED_FILTERS_STORAGE_KEY, JSON.stringify(sets));
  } catch (error) {
    console.warn("Unable to persist saved filter sets", error);
  }
}

function isSameFilterState(a: FilterState, b: FilterState): boolean {
  return (
    a.disposition === b.disposition &&
    a.size === b.size &&
    a.temperature === b.temperature &&
    a.period === b.period &&
    a.score === b.score &&
    a.star === b.star &&
    a.search === b.search &&
    a.favoritesOnly === b.favoritesOnly
  );
}
