/** Simulated network latency for mock services. */
export function delay(ms = 400 + Math.random() * 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Deterministic PRNG so mock data is stable between reloads. */
export function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
