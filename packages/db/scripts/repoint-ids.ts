/**
 * Replace every string equal to (or containing) an old id with its new id, anywhere in a
 * JSON value. Media ids are 15-char random record ids, so a substring match is safe.
 * Returns null when nothing changed.
 */
export function repointIds<T>(
  value: T,
  map: ReadonlyMap<string, string>,
): T | null {
  if (map.size === 0) return null;
  let s = JSON.stringify(value ?? null);
  const before = s;
  for (const [from, to] of map) s = s.split(from).join(to);
  return s === before ? null : (JSON.parse(s) as T);
}
