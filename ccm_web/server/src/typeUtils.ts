
// Type guard ensuring an unknown value is a non-null object and has all the specified keys
// https://stackoverflow.com/a/45390578
export function hasKeys<K extends string> (x: unknown, keys: K[]): x is Record<K, unknown> {
  if (!(typeof x === 'object' && x !== null)) return false
  return keys.every(k => k in x)
}
