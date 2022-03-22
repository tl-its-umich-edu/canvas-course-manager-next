// General type guards for checking the shape of unknown data

export function isRecord (x: unknown): x is Record<string | number | symbol, unknown> {
  return (typeof x === 'object' && x !== null)
}

// Type guard ensuring an unknown value is a non-null object and has all the specified keys
// https://stackoverflow.com/a/45390578
export function hasKeys<K extends string> (x: unknown, keys: K[]): x is Record<K, unknown> {
  if (!isRecord(x)) return false
  return keys.every(k => k in x)
}
