// The /services page groups: the salon menu under the service photo each item maps to.
import type { PublicSeatService } from "@cds/db";

/** Display order; `match` runs in MATCH_ORDER so "Bridal makeup" lands under Makeup. */
const GROUPS = [
  {
    key: "cut",
    title: "Cut and finish",
    photo: "cut-finish",
    match: /cut|blow/i,
  },
  {
    key: "color",
    title: "Color",
    photo: "balayage",
    match: /colou?r|balayage|gloss/i,
  },
  {
    key: "bridal",
    title: "Bridal and occasion",
    photo: "bridal",
    match: /bridal|occasion|trial/i,
  },
  {
    key: "skin",
    title: "Skin",
    photo: "facial",
    match: /facial|dermaplane|glow|skin/i,
  },
  {
    key: "scalp",
    title: "Scalp",
    photo: "scalp-ritual",
    match: /scalp|tricho/i,
  },
  {
    key: "nails",
    title: "Nails",
    photo: "nails",
    match: /nail|manicure|pedicure/i,
  },
  {
    key: "brows",
    title: "Brows and lashes",
    photo: "brows-lashes",
    match: /brow|lash/i,
  },
  { key: "makeup", title: "Makeup", photo: "makeup", match: /makeup/i },
] as const;
const MATCH_ORDER = [
  "makeup",
  "brows",
  "nails",
  "scalp",
  "skin",
  "bridal",
  "color",
  "cut",
];

export type ServiceGroup = {
  key: string;
  title: string;
  photo: string | null;
  services: PublicSeatService[];
};

/** The menu under its photo groups (empty groups dropped; the rest under "More"). */
export function groupServices(
  menu: readonly PublicSeatService[],
): ServiceGroup[] {
  const byKey = new Map<string, PublicSeatService[]>();
  for (const s of menu) {
    const key =
      MATCH_ORDER.find((k) =>
        GROUPS.find((g) => g.key === k)!.match.test(s.name),
      ) ?? "more";
    byKey.set(key, [...(byKey.get(key) ?? []), s]);
  }
  const out: ServiceGroup[] = GROUPS.filter((g) => byKey.has(g.key)).map(
    (g) => ({
      key: g.key,
      title: g.title,
      photo: `/am-barber/services/${g.photo}.webp`,
      services: byKey.get(g.key)!,
    }),
  );
  const more = byKey.get("more");
  if (more)
    out.push({ key: "more", title: "More", photo: null, services: more });
  return out;
}
