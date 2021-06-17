
// Type guard ensuring an unknown value is a non-null object and has a specific key
// https://stackoverflow.com/a/45390578
export function hasKey<K extends string> (x: unknown, k: K): x is Record<K, unknown> {
  return typeof x === 'object' && x !== null && k in x
}
