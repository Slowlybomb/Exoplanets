import { csvParse } from "d3-dsv";

export enum KeplerObjectType {
    CONFIRMED = "CONFIRMED",
    FALSE_POSITIVE = "FALSE_POSITIVE",
    CANDIDATE = "CANDIDATE",
    NOT_DISPOSITIONED = "NOT_DISPOSITIONED"
}

export interface Star {
    ra: number;
    dec: number;
    kepmag: number;
    teff: number;
    srad: number;
    kepid: string;
    keplerObjects: Map<string, KeplerObjectType>;
}

function parseDisposition(d?: string): KeplerObjectType {
    if (!d) return KeplerObjectType.NOT_DISPOSITIONED;
    switch (d.toUpperCase()) {
        case "CONFIRMED": return KeplerObjectType.CONFIRMED;
        case "FALSE_POSITIVE": return KeplerObjectType.FALSE_POSITIVE;
        case "CANDIDATE": return KeplerObjectType.CANDIDATE;
        default: return KeplerObjectType.NOT_DISPOSITIONED;
    }
}

/**
 * Load CSV from public folder, parse stars, and aggregate KOIs per star.
 */
export async function loadStarsFromCsv(url: string): Promise<Star[]> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load CSV: ${res.statusText}`);
    const rawCsv = await res.text();

    // Split lines, remove comment lines starting with # and empty lines
    const lines = rawCsv
        .split(/\r?\n/)
        .filter(line => line.trim() !== "" && !line.startsWith("#"));

    if (lines.length === 0) throw new Error("CSV contains no data rows");

    // Join back into string for d3-dsv
    const csvData = lines.join("\n");

    const records = csvParse(csvData);

    const starMap: Map<string, Star> = new Map();

    for (const row of records) {
        const kepid = row["kepid"];
        if (!kepid) continue; // skip malformed rows

        // parse numeric fields safely
        const ra = parseFloat(row["ra"]);
        const dec = parseFloat(row["dec"]);
        if (isNaN(ra) || isNaN(dec)) continue; // skip stars with no coordinates
        const kepmag = parseFloat(row["koi_kepmag"]) || 20;
        const teff = parseFloat(row["koi_steff"]) || 5500;
        const srad = parseFloat(row["koi_srad"]) || 1;


        // parse KOI info
        const koi_name = row["kepoi_name"];
        const koi_disposition = parseDisposition(row["koi_disposition"]);

        if (!starMap.has(kepid)) {
            starMap.set(kepid, {
                kepid,
                ra,
                dec,
                kepmag,
                teff,
                srad,
                keplerObjects: new Map()
            });
        }

        const star = starMap.get(kepid)!;
        star.keplerObjects.set(koi_name, koi_disposition);
    }

    return Array.from(starMap.values());
}
