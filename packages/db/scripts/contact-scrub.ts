// Salon contact copy: the site has no public phone and uses the placeholder address
// 1234 Main St. Rewrites the template copy the first assembly wrote into section content
// (address lines, phone buttons, "Call us" text). Pure; returns null when nothing changed.
export const SALON_ADDRESS = "1234 Main St, Grand Prairie, TX 75050";
export const SALON_EMAIL = "matthew@metaphysicalevents.com";

const TEXT: readonly [RegExp, string][] = [
  [/2505 S Carrier Pkwy, Grand Prairie(, TX)?( 75052)?/g, SALON_ADDRESS],
  [/Call us at \(214\) 518-6852/g, `Email us at ${SALON_EMAIL}`],
  [/ or call us\./g, " or send us a message."],
];

function walk(v: unknown): unknown {
  if (typeof v === "string") {
    return TEXT.reduce((s, [re, to]) => s.replace(re, to), v);
  }
  if (Array.isArray(v)) {
    return v
      .filter(
        (it) =>
          !(
            it &&
            typeof it === "object" &&
            (it as { kind?: unknown }).kind === "button" &&
            String((it as { link?: unknown }).link).startsWith("tel:")
          ),
      )
      .map(walk);
  }
  if (v && typeof v === "object") {
    const o = Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, walk(x)]),
    );
    // The closing call-to-action's phone button becomes a booking button.
    if (typeof o.button_link === "string" && o.button_link.startsWith("tel:")) {
      o.button_text = "Book now";
      o.button_link = "/team";
    }
    return o;
  }
  return v;
}

export function scrubContact<T>(content: T): T | null {
  const out = walk(content);
  return JSON.stringify(out) === JSON.stringify(content) ? null : (out as T);
}
