import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { FeaturedPlanet } from "../../data/exoplanets";

type OrbitSimulationProps = {
  planet: FeaturedPlanet;
  starTemperatureKOverride?: number | null;
};

type OrbitingPlanetProps = {
  orbitalRadius: number;
  planetRadius: number;
  periodDays: number;
};

type HostStarProps = {
  color: string;
};

const TEMPERATURE_COLOR_STOPS = [
  { temp: 3000, color: "#ff4d4f" },
  { temp: 4000, color: "#ff8f3f" },
  { temp: 6000, color: "#ffe066" },
  { temp: 7000, color: "#fff7a6" },
  { temp: 10000, color: "#c6e5ff" },
  { temp: 20000, color: "#6fb6ff" },
  { temp: 30000, color: "#3a4bff" }
];

function sampleStarColor(temperatureK: number | null | undefined): string {
  const defaultColor = "#ffd166";

  if (temperatureK === null || temperatureK === undefined || temperatureK <= 0) {
    return defaultColor;
  }

  if (temperatureK <= TEMPERATURE_COLOR_STOPS[0].temp) {
    return TEMPERATURE_COLOR_STOPS[0].color;
  }

  const lastStop = TEMPERATURE_COLOR_STOPS[TEMPERATURE_COLOR_STOPS.length - 1];
  if (temperatureK >= lastStop.temp) {
    return lastStop.color;
  }

  for (let i = 0; i < TEMPERATURE_COLOR_STOPS.length - 1; i += 1) {
    const current = TEMPERATURE_COLOR_STOPS[i];
    const next = TEMPERATURE_COLOR_STOPS[i + 1];

    if (temperatureK >= current.temp && temperatureK <= next.temp) {
      const t = (temperatureK - current.temp) / (next.temp - current.temp);
      const startColor = new THREE.Color(current.color);
      const endColor = new THREE.Color(next.color);
      const mixed = startColor.lerp(endColor, t);
      return `#${mixed.getHexString()}`;
    }
  }

  return defaultColor;
}

function HostStar({ color }: HostStarProps): JSX.Element {
  const emissiveColor = useMemo(() => new THREE.Color(color), [color]);

  return (
    <mesh>
      <sphereGeometry args={[1.3, 64, 64]} />
      <meshStandardMaterial emissive={emissiveColor} emissiveIntensity={1.75} color={new THREE.Color("#FEFEFE")} />
    </mesh>
  );
}

function OrbitPath({ radius }: { radius: number }): JSX.Element {
  const points = useMemo(() => {
    const segments = 128;
    const pts = [] as THREE.Vector3[];
    for (let i = 0; i <= segments; i += 1) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#647684" linewidth={1} />
    </line>
  );
}

function OrbitingPlanet({ orbitalRadius, planetRadius, periodDays }: OrbitingPlanetProps): JSX.Element {
  const planetRef = useRef<THREE.Mesh>(null);
  const angleRef = useRef(Math.random() * Math.PI * 2);

  const angularVelocity = useMemo(() => {
    const clampedPeriod = Math.max(periodDays, 0.5);
    return (Math.PI * 2) / clampedPeriod;
  }, [periodDays]);

  useFrame((_, delta) => {
    if (!planetRef.current) {
      return;
    }

    angleRef.current = (angleRef.current + delta * angularVelocity * 0.25) % (Math.PI * 2);
    const x = Math.cos(angleRef.current) * orbitalRadius;
    const z = Math.sin(angleRef.current) * orbitalRadius;
    planetRef.current.position.set(x, 0, z);
  });

  return (
    <mesh ref={planetRef} position={[orbitalRadius, 0, 0]}>
      <sphereGeometry args={[planetRadius, 48, 48]} />
      <meshStandardMaterial color={new THREE.Color("#8fb5ff")} roughness={0.35} metalness={0.1} />
    </mesh>
  );
}

export function OrbitSimulation({ planet, starTemperatureKOverride }: OrbitSimulationProps): JSX.Element {
  const starColor = useMemo(
    () => sampleStarColor(starTemperatureKOverride ?? planet.stellarEffectiveTempK),
    [planet.stellarEffectiveTempK, starTemperatureKOverride]
  );

  const orbitalRadius = useMemo(() => {
    const axis = planet.semiMajorAxisAu;

    if (axis) {
      const scaled = Math.min(Math.max(axis * 1.8, 1.2), 4.5);
      return scaled + 1.2;
    }

    if (planet.periodDays) {
      const normalized = Math.min(Math.max(planet.periodDays / 12, 0.8), 4.5);
      return normalized + 1.4;
    }

    return 2.6;
  }, [planet.periodDays, planet.semiMajorAxisAu]);

  const planetRadius = useMemo(() => {
    if (!planet.planetRadiusEarth) {
      return 0.22;
    }

    const scaled = Math.min(Math.max(planet.planetRadiusEarth / 10, 0.15), 0.6);
    return scaled;
  }, [planet.planetRadiusEarth]);

  const periodDays = planet.periodDays ?? 365;

  return (
    <div className="space-y-4">
      <div className="relative h-[320px] overflow-hidden rounded-2xl border border-brand-slate/30 bg-brand-midnight">
        <Canvas camera={{ position: [5, 3.5, 5], fov: 45 }}>
          <color attach="background" args={["#070612"]} />
          <ambientLight intensity={0.3} />
          <pointLight position={[0, 0, 0]} intensity={1.2} color={new THREE.Color(starColor)} />
          <Suspense fallback={null}>
            <Stars radius={80} depth={40} count={5000} factor={2.5} saturation={0} fade />
            <group rotation={[-Math.PI / 2.8, 0, 0]}>
              <OrbitPath radius={orbitalRadius} />
              <HostStar color={starColor} />
              <OrbitingPlanet
                orbitalRadius={orbitalRadius}
                planetRadius={planetRadius}
                periodDays={periodDays}
              />
            </group>
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              enableDamping
              dampingFactor={0.05}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={(3 * Math.PI) / 4}
            />
          </Suspense>
        </Canvas>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-midnight via-brand-midnight/70 to-transparent p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-slate/60">Transit Preview</p>
          <p className="text-lg font-semibold text-brand-white">{planet.name}</p>
        </div>
      </div>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Orbital Period</dt>
          <dd className="text-lg font-semibold text-brand-white">
            {planet.periodDays !== null && planet.periodDays !== undefined
              ? `${planet.periodDays.toFixed(2)} days`
              : "Unknown"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Planet Radius</dt>
          <dd className="text-lg font-semibold text-brand-white">
            {planet.planetRadiusEarth !== null && planet.planetRadiusEarth !== undefined
              ? `${planet.planetRadiusEarth.toFixed(2)} R⊕`
              : "Unknown"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Equilibrium Temp</dt>
          <dd className="text-lg font-semibold text-brand-white">
            {planet.equilibriumTempK !== null && planet.equilibriumTempK !== undefined
              ? `${Math.round(planet.equilibriumTempK)} K`
              : "Unknown"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">Insolation</dt>
          <dd className="text-lg font-semibold text-brand-white">
            {planet.insolationEarth !== null && planet.insolationEarth !== undefined
              ? `${planet.insolationEarth.toFixed(1)} ⊕`
              : "Unknown"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
