import { csvParse } from "d3-dsv";
import rawCsv from "../../dataset/cumulative_2025.10.04_06.46.42.csv?raw";

type CsvRow = Record<string, string>;

function toNumber(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed === "" || trimmed.toLowerCase() === "nan") {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function sanitizeCsv(input: string): string {
  return input
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .join("\n");
}

const sanitizedCsv = sanitizeCsv(rawCsv);

const parsed = csvParse(sanitizedCsv) as CsvRow[];

export type ExoplanetRecord = {
  kepoiName: string;
  keplerName: string | null;
  disposition: string;
  periodDays: number | null;
  planetRadiusEarth: number | null;
  equilibriumTempK: number | null;
  insolationEarth: number | null;
  stellarEffectiveTempK: number | null;
  stellarRadiusSun: number | null;
  koiScore: number | null;
};

export const exoplanetRecords: ExoplanetRecord[] = parsed.map((row) => ({
  kepoiName: row.kepoi_name ?? "Unknown",
  keplerName: row.kepler_name && row.kepler_name !== "" ? row.kepler_name : null,
  disposition: row.koi_disposition ?? "Unknown",
  periodDays: toNumber(row.koi_period),
  planetRadiusEarth: toNumber(row.koi_prad),
  equilibriumTempK: toNumber(row.koi_teq),
  insolationEarth: toNumber(row.koi_insol),
  stellarEffectiveTempK: toNumber(row.koi_steff),
  stellarRadiusSun: toNumber(row.koi_srad),
  koiScore: toNumber(row.koi_score)
}));

export type DispositionDatum = {
  disposition: string;
  count: number;
};

export const dispositionSummary: DispositionDatum[] = Array.from(
  exoplanetRecords.reduce<Map<string, number>>((acc, record) => {
    const key = record.disposition || "Unknown";
    acc.set(key, (acc.get(key) ?? 0) + 1);
    return acc;
  }, new Map())
)
  .map(([disposition, count]) => ({ disposition, count }))
  .sort((a, b) => b.count - a.count);

function getCountForDisposition(disposition: string): number {
  return dispositionSummary.find((item) => item.disposition === disposition)?.count ?? 0;
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

const SOLAR_EFFECTIVE_TEMP_K = 5778;

function computeBrightnessIndex(temperatureK: number | null): number | null {
    if (temperatureK === null || temperatureK <= 0) {
        return null;
    }

    const ratio = temperatureK / SOLAR_EFFECTIVE_TEMP_K;
    return Number.isFinite(ratio) ? ratio : null;
}

const radiusValues = exoplanetRecords
    .map((record) => record.planetRadiusEarth)
    .filter((value): value is number => value !== null);

const stellarTempValues = exoplanetRecords
    .map((record) => record.stellarEffectiveTempK)
    .filter((value): value is number => value !== null);

const brightnessIndexValues = stellarTempValues
    .map((value) => computeBrightnessIndex(value))
    .filter((value): value is number => value !== null && Number.isFinite(value));

export const exoplanetSummaryStats = {
  totalCatalogued: exoplanetRecords.length,
  confirmedCount: getCountForDisposition("CONFIRMED"),
  candidateCount: getCountForDisposition("CANDIDATE"),
  falsePositiveCount: getCountForDisposition("FALSE POSITIVE"),
  smallTemperateCount: exoplanetRecords.filter((record) => {
    if (record.planetRadiusEarth === null || record.equilibriumTempK === null) {
      return false;
    }

    return record.planetRadiusEarth <= 2 && record.equilibriumTempK >= 180 && record.equilibriumTempK <= 320;
  }).length,
  medianRadius: median(radiusValues),
  averageStarBrightnessIndex:
    brightnessIndexValues.length > 0
      ? brightnessIndexValues.reduce((acc, value) => acc + value, 0) / brightnessIndexValues.length
      : null
};



export type FeaturedPlanet = {
  name: string;
  disposition: string;
  koiScore: number | null;
  periodDays: number | null;
  planetRadiusEarth: number | null;
  equilibriumTempK: number | null;
  insolationEarth: number | null;
  semiMajorAxisAu: number | null;
  stellarEffectiveTempK: number | null;
  stellarBrightnessIndex: number | null;
};





function estimateSemiMajorAxisAu(periodDays: number | null): number | null {
  if (!periodDays || periodDays <= 0) {
    return null;
  }

  const periodYears = periodDays / 365.25;
  const axis = Math.pow(periodYears, 2 / 3);

  return Number.isFinite(axis) ? axis : null;
}

export function toFeaturedPlanet(record: ExoplanetRecord): FeaturedPlanet {
  return {
    name: record.keplerName ?? record.kepoiName,
    disposition: record.disposition,
    koiScore: record.koiScore,
    periodDays: record.periodDays,
    planetRadiusEarth: record.planetRadiusEarth,
    equilibriumTempK: record.equilibriumTempK,
    insolationEarth: record.insolationEarth,
    semiMajorAxisAu: estimateSemiMajorAxisAu(record.periodDays),
    stellarEffectiveTempK: record.stellarEffectiveTempK,
    stellarBrightnessIndex: computeBrightnessIndex(record.stellarEffectiveTempK)
  };
}

export const topConfirmedPlanets: FeaturedPlanet[] = exoplanetRecords
  .filter((record) => record.disposition === "CONFIRMED")
  .sort((a, b) => (b.koiScore ?? 0) - (a.koiScore ?? 0))
  .slice(0, 12)
  .map(toFeaturedPlanet);

export const leadingCandidates: FeaturedPlanet[] = exoplanetRecords
  .filter((record) => record.disposition === "CANDIDATE")
  .sort((a, b) => (b.koiScore ?? 0) - (a.koiScore ?? 0))
  .slice(0, 12)
  .map(toFeaturedPlanet);

function matchesName(record: ExoplanetRecord, target: string): boolean {
  const normalized = target.trim().toLowerCase();
  return [record.keplerName, record.kepoiName]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase() === normalized);
}

export type PlanetDetail = FeaturedPlanet & {
  stellarRadiusSun: number | null;
  rawKepoiName: string;
};

export function getPlanetDetailByName(name: string): PlanetDetail | null {
  if (!name) {
    return null;
  }

  const record = exoplanetRecords.find((entry) => matchesName(entry, name));

  if (!record) {
    return null;
  }

  const featured = toFeaturedPlanet(record);

  return {
    ...featured,
    stellarRadiusSun: record.stellarRadiusSun,
    rawKepoiName: record.kepoiName
  };
}

export function getAllFeaturedPlanets(): FeaturedPlanet[] {
  return exoplanetRecords.map(toFeaturedPlanet);
}
