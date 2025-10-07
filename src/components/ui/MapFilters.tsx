//options and filters for map
//TODO
// - search
// - filter by disposition, size, temperature, period, score, star, favorites
// - filter by orbital period

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




export default function MapFilters() {
    return(
        <div className="flex flex-col gap-2">
            <
        </div>
    )
}

