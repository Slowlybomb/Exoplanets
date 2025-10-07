import { useRef, RefObject, useState, useEffect } from "react";
import {loadStarsFromCsv} from "../utils/KeplerCSVParser";
import React from "react";

const spatialScale = 15;
const sizeScale = 100;
const maxZoom= 10;
const minZoom = 0.05;


const DISPOSITION_DESCRIPTIONS = [
    { id: "all", label: "All dispositions" },
    { id: "confirmed", label: "Confirmed" },
    { id: "candidate", label: "Candidates" }
] as const;

const SIZE_DESCRIPTIONS = [
    { id: "sub", label: "small" },
    { id: "earth", label: "Earth-sized" },
    { id: "super", label: "large planet" },
    { id: "giant", label: "gas giant)" }
] as const;

const KOI_TEMP_DESCRIPTIONS = [
    { id: "cold", label: "cold" },
    { id: "temperate", label: "Temperate (260–320 K)" },
    { id: "hot", label: "Hot" }
] as const;

const PERIOD_DESCRIPTIONS = [
    { id: "all", label: "All periods" },
    { id: "ultra", label: "Ultra-short (<10 d)" },
    { id: "short", label: "Short (10–100 d)" },
    { id: "medium", label: "Medium (100–365 d)" },
    { id: "long", label: "Long (>365 d)" }
] as const;

const SCORE_DESCRIPTIONS = [
    { id: "all", label: "A" },
    { id: "high", label: "Most likely a" },
    { id: "medium", label: "Potentially a (0.6–0.9)" },
    { id: "low", label: "Possibly a (<0.6)" }
] as const;






let bounds: { minRA: number; maxRA: number; minDec: number; maxDec: number; };

enum KeplerObjectType {
    CONFIRMED = "CONFIRMED",
    FALSE_POSITIVE = "FALSE_POSITIVE",
    CANDIDATE = "CANDIDATE",
    NOT_DISPOSITIONED = "NOT_DISPOSITIONED"
}

interface Star {
    ra: number; //Right Ascension
    dec: number; //Declination  
    kepmag: number; //Kepmag
    teff: number; //Effective Temperature
    srad: number; //stellar radius
    kepid: string; //Kepler-ID of the star
    keplerObjects: Map<string, KeplerObjectType>;
}

interface GalaxyMapProps {
    stars?: Star[];
}


function normaliseRadius(radius: number, scale = 1) {
    const minRadius = scale;
    const maxRadius = 10 * scale;
    const logScale = (r: number) => {
        // @ts-ignore
        const scaled = Math.log10(r + 0.1) * 3 + 1;
        return Math.min(maxRadius, Math.max(minRadius, scaled));
    };
    return logScale(Math.max(0.1, 300 - radius));
}


function mapCoords(ra: number, dec: number, width: number, height: number, scale: number) {
    return {
        x: (ra / 360) * width * scale,
        y: ((90 - dec) / 180) * height * scale
    };
}

function randomNormal(mean = 0, stdDev = 1): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function generateRandomStars(n: number): Star[] {
    return Array.from({length: n}, (_, i) => {
        const ra = Math.random() * 360; // 0 - 360°
        let dec = randomNormal(0, 30); // cluster around 0°
        dec = Math.max(-90, Math.min(90, dec));

        return {
            ra,
            dec,
            kepmag: Math.random() * 5 + 1,
            teff: Math.random() * 8000 + 3000,
            srad: Math.random() * 250 + 50,
            kepid: `${String(i + 10797460).padStart(7, '0')}`,
            keplerObjects: new Map()
        };
    });
}

const sampleStars: Star[] = generateRandomStars(9000);

function teffToColor(teff: number) {
    // B-V = (5040/Teff) - 0.5
    let bv = (5040 / teff) - 0.5;

    // Convert B-V to RGB using polynomial fit
    let r = 0, g = 0, b = 0;

    if (bv < -0.4) bv = -0.4;
    if (bv > 2.0) bv = 2.0;

    if (bv >= -0.4 && bv < 0.0) {
        r = 0.61 + 0.11 * bv / 0.4;
        g = 0.61 + 0.11 * bv / 0.4;
        b = 0.99 + 0.01 * bv / 0.4;
    } else if (bv >= 0.0 && bv < 0.4) {
        r = 0.83 + 0.17 * bv / 0.4;
        g = 0.83 + 0.17 * bv / 0.4;
        b = 0.91 - 0.25 * bv / 0.4;
    } else if (bv >= 0.4 && bv < 1.6) {
        r = 1.0;
        g = 0.91 - 0.51 * (bv - 0.4) / 1.2;
        b = 0.66 - 0.56 * (bv - 0.4) / 1.2;
    } else {
        r = 1.0;
        g = 0.4 - 0.2 * (bv - 1.6) / 0.4;
        b = 0.1;
    }

    return `rgb(${Math.floor(r * 255)},${Math.floor(g * 255)},${Math.floor(b * 255)})`;
}

function getBounds(stars: Star[]) {
    const raValues = stars.map(s => s.ra);
    const decValues = stars.map(s => s.dec);

    const minRA = Math.min(...raValues);
    const maxRA = Math.max(...raValues);
    const minDec = Math.min(...decValues);
    const maxDec = Math.max(...decValues);

    return { minRA, maxRA, minDec, maxDec };
}


function mapCoordsDynamic(star: Star, bounds: {minRA: number, maxRA: number, minDec: number, maxDec: number}, width: number, height: number, scale = 1) {
    const { minRA, maxRA, minDec, maxDec } = bounds;

    const x = ((star.ra - minRA) / (maxRA - minRA)) * width * scale;
    const y = ((maxDec - star.dec) / (maxDec - minDec)) * height * scale; // flip Dec for canvas y

    return { x, y };
}



export default function StarMap({}: GalaxyMapProps) {
    const canvasRef: RefObject<HTMLCanvasElement> = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 600 });
    const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
    const [pan, setPan] = useState({ x: canvasSize.width/16, y: canvasSize.height/16 });
    const [zoom, setZoom] = useState(0.06);
    const [isDragging, setIsDragging] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
    const [currentPosition, setCurrentPosition] = useState<{ ra: number, dec: number } | null>(null);
    const [stars, setStars] = useState<Star[]>([]);

    let needsRedraw = true;

    useEffect(() => {
        loadStarsFromCsv("/kepler_data.csv")
            .then((data) => {
                console.log(`Loaded ${data.length} unique stars`);
                console.log("First star:", data[0]);
                setStars(data);
                bounds = getBounds(data)
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setCanvasSize({ width, height });
            }
        });
        observer.observe(container);

        return () => {
            observer.disconnect();
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;

        const drawStars = () => {
            ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
            ctx.save();
            ctx.translate(pan.x, pan.y);
            ctx.scale(zoom, zoom);

            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1 / zoom;

            const raStep = 30;
            const decStep = 15;

            const leftRA = 0;
            const rightRA = 360;
            const bottomDec = -90;
            const topDec = 90;



            for (let ra = 0; ra <= 360; ra += raStep) {
                const { x } = mapCoords(ra, 0, canvasSize.width, canvasSize.height, spatialScale);
                ctx.beginPath();
                ctx.moveTo(x, mapCoords(0, topDec, canvasSize.width, canvasSize.height, spatialScale).y);
                ctx.lineTo(x, mapCoords(0, bottomDec, canvasSize.width, canvasSize.height, spatialScale).y);
                ctx.stroke();
            }

            for (let dec = -90; dec <= 90 ; dec += decStep) {
                const { y } = mapCoords(0, dec, canvasSize.width, canvasSize.height, spatialScale);
                ctx.beginPath();
                ctx.moveTo(mapCoords(leftRA,0 , canvasSize.width, canvasSize.height, spatialScale).x, y);
                ctx.lineTo(mapCoords(rightRA, 0, canvasSize.width, canvasSize.height, spatialScale).x, y);
                ctx.stroke();
            }


            stars.forEach(star => {
                const { x, y } = mapCoordsDynamic(star, bounds, canvasSize.width, canvasSize.height, spatialScale);

                const radius = normaliseRadius(star.srad, sizeScale);
                const color = teffToColor(star.teff);
                const brightness = Math.max(0.1, 1 - (Math.min(Math.max(star.kepmag, 6), 16) - 6) / 10);

                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius/2);
                gradient.addColorStop(0, color);
                gradient.addColorStop(0.4, color);
                gradient.addColorStop(1, 'transparent');

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, radius * brightness, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.restore();
        };


        const render = () => {
            if (!needsRedraw) return;
            drawStars();
            needsRedraw = false;
            animationFrameId = requestAnimationFrame(render);

        };


        const wheelHandler = (e: WheelEvent) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const scaleFactor = e.deltaY > 0 ? 0.98 : 1.02;
            setZoom(prevZoom => {
                const newZoom = Math.min(maxZoom, Math.max(minZoom, prevZoom * scaleFactor));
                const actualScale = newZoom / prevZoom;

                setPan(prevPan => ({
                    x: mouseX - (mouseX - prevPan.x) * actualScale,
                    y: mouseY - (mouseY - prevPan.y) * actualScale
                }));

                return newZoom;
            });
        };


        render();


        canvas.addEventListener('wheel', wheelHandler, { passive: false });

        return () => {
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener('wheel', wheelHandler);
        }
    }, [stars, canvasSize.width, canvasSize.height, pan, zoom]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDragging(true);
        setLastPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        if (isDragging) {
            const dx = e.clientX - lastPos.x;
            const dy = e.clientY - lastPos.y;
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastPos({ x: e.clientX, y: e.clientY });
            return;
        }

        // Calculate the scale factor between canvas internal size and displayed size
        const scaleX = canvasSize.width / rect.width;
        const scaleY = canvasSize.height / rect.height;

        // Get mouse position in canvas coordinates (accounting for CSS scaling)
        const canvasMouseX = (e.clientX - rect.left) * scaleX;
        const canvasMouseY = (e.clientY - rect.top) * scaleY;

        const mouseX = (canvasMouseX - pan.x) / zoom;
        const mouseY = (canvasMouseY - pan.y) / zoom;

        const ra = (mouseX / canvasSize.width) * 360;
        const dec = 90 - ((mouseY / canvasSize.height) * 180);
        setCurrentPosition({ ra, dec });

        const hoverStar = stars.find(star => {
            const { x, y } = mapCoordsDynamic(star, bounds, canvasSize.width, canvasSize.height, spatialScale);
            const radius = normaliseRadius(star.srad, sizeScale);
            return Math.hypot(mouseX - x, mouseY - y) <= radius;
        });

        setHoveredStar(hoverStar || null);
    };

    return (
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
            <header className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-slate/40 bg-brand-indigo/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-brand-slate/70">
                    Mapped Representation
                </span>
                <h1 className="text-3xl font-semibold text-brand-white sm:text-4xl lg:text-5xl">Star Map</h1>
                <p className="max-w-2xl text-base text-brand-slate/70 sm:text-lg">
                    Explore all the known stars found by the Kepler Mission in the KOI Database
                </p>
            </header>
            <div

                ref={containerRef}
                style={{
                position: "relative",
                width: "100%",
                height: "72vh",
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",

            }}>
                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    style={{
                        border: "2px solid",
                        backgroundColor: "black",
                        cursor: isDragging ? "grabbing" : "grab",
                        width: "100%",
                        height: "100%"
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => {
                        setHoveredStar(null);
                        setIsDragging(false);
                        setCurrentPosition(null);
                    }}
                />

                {hoveredStar && (

                    <div
                        style={{
                            position: "absolute",
                            top: bounds ? mapCoordsDynamic(hoveredStar, bounds, canvasSize.width, canvasSize.height, spatialScale).y * zoom + pan.y : 0,
                            left: bounds ? mapCoordsDynamic(hoveredStar, bounds, canvasSize.width, canvasSize.height, spatialScale).x * zoom + pan.x : 0,
                            background: "rgba(0,0,0,0.7)",
                            color: "white",
                            font: "12px monospace",
                            padding: "5px 10px",
                            borderRadius: "3px",
                            transform: "translate(-50%, -100%)",
                            pointerEvents: "none"
                        }}
                    >
                        <h1 style={{textAlign: 'center', width: "100%", fontWeight: "bold"}}>Star {hoveredStar.kepid}</h1>
                        <div
                            style={{
                            top: 10,
                                right: 10,
                                background: "rgba(0,0,0,0.7)",
                                color: "white",
                                font: "12px monospace",
                                padding: "5px 10px",
                                borderRadius: "3px",
                                display: 'grid',
                                gridTemplateColumns: '120px 80px',
                                gap: '0px',
                                textAlign: 'right'
                            }}
                        >
                            <span>Declination:</span>
                            <span>{hoveredStar.dec.toFixed(2)}°</span>
                            <span>Right Ascension:</span>
                            <span>{hoveredStar.ra.toFixed(2)}°</span>
                            <span>Kepler-Band:</span>
                            <span>{hoveredStar.kepmag.toFixed(2)} mag</span>
                            <span>Temperature:</span>
                            <span>{hoveredStar.teff.toFixed(0)}K</span>
                        </div>
                        <div>
                            <b>KOIs:</b>
                            <div
                                style={{
                                    top: 10,
                                    right: 10,
                                    background: "rgba(0,0,0,0.7)",
                                    color: "white",
                                    font: "12px monospace",
                                    padding: "5px 10px",
                                    borderRadius: "3px",
                                    display: 'grid',
                                    gridTemplateColumns: '90px 110px',
                                    gap: '0px',
                                    textAlign: 'right'
                                }}
                            >
                                {Array.from(hoveredStar.keplerObjects.entries()).map(([koiId, type]) => (
                                    <React.Fragment key={koiId}>
                                        <span>{koiId}</span>
                                        <span style={{
                                            color: type === KeplerObjectType.CONFIRMED ? '#4ade80' :
                                                type === KeplerObjectType.CANDIDATE ? '#fbbf24' :
                                                    type === KeplerObjectType.FALSE_POSITIVE ? '#ef4444' : '#94a3b8'
                                        }}>
                                            {type.replace('_', ' ')}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </main>
    );
}