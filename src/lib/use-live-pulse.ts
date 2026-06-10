import { useEffect, useState } from "react";

// Single shared tick across the app — drives all "live" movement.
const listeners = new Set<() => void>();
let tick = 0;
let started = false;

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  setInterval(() => {
    tick++;
    listeners.forEach((l) => l());
  }, 2400);
}

export function useTick(): number {
  const [, setT] = useState(tick);
  useEffect(() => {
    start();
    const l = () => setT(tick);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return tick;
}

// Deterministic pseudo-random in [-1, 1] from seed + tick
export function jitter(seed: string, t: number, range = 1) {
  let h = 2166136261;
  const s = `${seed}:${t}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const n = ((h >>> 0) % 10000) / 10000; // 0..1
  return (n * 2 - 1) * range;
}

export function driftedValue(seed: string, base: number, range = 2, decimals = 1) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const t = useTick();
  // Smooth drift across two consecutive ticks
  const a = jitter(seed, Math.floor(t / 1), range);
  const b = jitter(seed, Math.floor(t / 1) + 1, range);
  const v = base + (a + b) / 2;
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}

export function rotatingIndex(length: number, intervalTicks = 1, offset = 0) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const t = useTick();
  return (((Math.floor(t / intervalTicks) + offset) % length) + length) % length;
}
