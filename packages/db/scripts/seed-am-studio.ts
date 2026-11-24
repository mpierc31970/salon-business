// Superior Salon: Studio Booking seed (idempotent). Installs the add-on (no charge: the
// salon owns this fork), adds the eight placeholder team seats with their AI placeholder
// portraits and their own service menus, and puts "Our Team" (the /team route) in the
// site menu.
//
//   npm run am:studio-seed
//
// Same storage note as am:seed: photos go to CDS_STORAGE_DIR, so for production run with a
// temp storage dir and copy it into the app's /data volume (CLAUDE.md "Seeding").
//
// TODO(owner): every seat below is a PLACEHOLDER: real names, emails, bios, photos and prices.
import "@cds/addon-registry/server";
import { ADDON_REGISTRY } from "@cds/addon-registry/server";
import { composeSectionRegistry, CORE_SECTIONS } from "@cds/core/content";
import { readFileSync } from "node:fs";
import { withSuperuser } from "../src/client";
import { getNav, saveNav } from "../src/content/chrome/nav";
import { recordingInvalidator } from "../src/content/ports";
import {
  getContentScanner,
  getSearchPinger,
} from "../src/content/scan-standin";
import { mintOrgContext } from "../src/context";
import { newRecordId } from "../src/repository";
import {
  createSeat,
  getSchedule,
  listSeats,
  saveHours,
  saveSeatService,
  updateSeat,
  uploadSeatPhoto,
} from "../src/studio";

const HOST = (process.env.AM_HOST || "salon.needtobeedgy.com").toLowerCase();
const PLACEHOLDER_BIO =
  "Placeholder profile. This team member's real name, photo and bio are coming soon.";

// TODO(owner): real prices; 0 shows "Ask" on the site. [name, minutes, dollars, description]
const MENU = {
  cut: [
    "Signature cut and finish",
    75,
    125,
    "Consultation, precision cut, wash and a polished blow-dry.",
  ],
  blowout: [
    "Blow-dry and style",
    45,
    75,
    "Smooth, bouncy or undone: a finish that lasts for days.",
  ],
  color: [
    "Creative color",
    120,
    225,
    "All-over color, designed for your skin tone and lifestyle.",
  ],
  balayage: [
    "Balayage and lived-in color",
    180,
    325,
    "Hand-painted brightness that grows out softly. Includes gloss and finish.",
  ],
  gloss: [
    "Gloss and tone",
    45,
    90,
    "Shine, depth and a refreshed tone between color visits.",
  ],
  bridal: [
    "Bridal and occasion styling",
    90,
    250,
    "Polished updos and soft waves for the day itself.",
  ],
  trial: [
    "Bridal trial",
    60,
    150,
    "Plan and test your wedding-day look in advance.",
  ],
  facial: [
    "Signature facial",
    75,
    195,
    "Cleanse, exfoliate, extract and a sculpting massage with a custom mask.",
  ],
  glow: [
    "Dermaplane and glow",
    60,
    165,
    "Gentle resurfacing for smooth, luminous skin.",
  ],
  scalp: [
    "Scalp ritual",
    60,
    145,
    "Detox, exfoliation and a deep scalp massage for healthier growth.",
  ],
  trichology: [
    "Trichology consultation",
    45,
    120,
    "A close look at scalp and hair health, with a plan to follow.",
  ],
  manicure: [
    "Gel manicure",
    60,
    65,
    "Shaping, cuticle care and a long-wear gel finish.",
  ],
  nailart: [
    "Structured gel and nail art",
    90,
    110,
    "Strengthening overlay with hand-painted detail.",
  ],
  pedicure: ["Spa pedicure", 75, 95, "Soak, exfoliation, massage and polish."],
  brows: [
    "Brow lamination and tint",
    60,
    95,
    "Lifted, shaped and tinted brows that stay put.",
  ],
  lashes: [
    "Lash lift and tint",
    60,
    110,
    "Curled, darkened natural lashes for six to eight weeks.",
  ],
  makeup: [
    "Makeup application",
    75,
    175,
    "Soft glam or editorial, for events and photographs.",
  ],
  bridalMakeup: [
    "Bridal makeup",
    120,
    295,
    "Long-wear bridal makeup, including lashes.",
  ],
} as const satisfies Record<string, readonly [string, number, number, string]>;
type MenuKey = keyof typeof MENU;

// TODO(owner): placeholder team. [name, headline, portrait, services]
const SEATS: readonly (readonly [
  string,
  string,
  string,
  readonly MenuKey[],
])[] = [
  [
    "Isabelle Laurent",
    "Creative Director and master colorist",
    "barber-1.webp",
    ["cut", "color", "gloss", "blowout"],
  ],
  [
    "Sofia Marquez",
    "Balayage and lived-in color specialist",
    "barber-2.webp",
    ["balayage", "gloss", "color", "blowout"],
  ],
  [
    "Ava Chen",
    "Bridal and editorial stylist",
    "barber-3.webp",
    ["bridal", "trial", "blowout", "cut"],
  ],
  [
    "Naomi Brooks",
    "Esthetician and skin therapist",
    "barber-4.webp",
    ["facial", "glow"],
  ],
  [
    "Priya Raman",
    "Nail artist",
    "barber-5.webp",
    ["manicure", "nailart", "pedicure"],
  ],
  [
    "Lucia Romano",
    "Brow and lash artist",
    "barber-6.webp",
    ["brows", "lashes"],
  ],
  [
    "Julian Hayes",
    "Scalp and trichology specialist",
    "barber-7.webp",
    ["scalp", "trichology", "cut"],
  ],
  [
    "Zara Okafor",
    "Makeup artist",
    "barber-8.webp",
    ["makeup", "bridalMakeup", "brows"],
  ],
];

function log(line: string): void {
  console.log(line);
}

async function main(): Promise<void> {
  const { orgId, ownerId } = await withSuperuser(async (pb) => {
    const org = await pb
      .collection("organizations")
      .getFirstListItem(pb.filter("slug = 'am-barber'"));
    const m = await pb
      .collection("memberships")
      .getFirstListItem(
        pb.filter("organization = {:o} && role = 'owner'", { o: org.id }),
      );
    return { orgId: org.id, ownerId: String(m.user) };
  });
  const ctx = mintOrgContext({
    orgId,
    actor: ownerId,
    role: "owner",
    grants: [],
    ip: "am-seed",
  });
  const deps = {
    sections: composeSectionRegistry(CORE_SECTIONS, ADDON_REGISTRY.sections()),
    invalidator: recordingInvalidator(),
    scanner: getContentScanner(),
    pinger: getSearchPinger(),
    addons: ADDON_REGISTRY,
  };

  // Private add-on (not in the catalog): the shop's entitlement row is written directly,
  // as staff would (installing seeds nothing, invariant 3).
  await withSuperuser(async (pb) => {
    const rows = await pb.collection("org_addons").getFullList({
      filter: pb.filter("organization = {:o} && addon = 'studio-booking'", {
        o: orgId,
      }),
    });
    if (rows[0]?.status === "active") return;
    if (rows[0])
      await pb
        .collection("org_addons")
        .update(rows[0].id, { status: "active" });
    else {
      await pb.collection("org_addons").create({
        organization: orgId,
        addon: "studio-booking",
        status: "active",
        source: "staff",
        seeded: {},
      });
    }
  });
  log("PASS studio-booking active");

  const existing = await listSeats(ctx);
  for (const [name, headline, file, services] of SEATS) {
    if (existing.some((s) => s.name === name)) continue;
    const { id } = await createSeat(ctx, { name, email: "", kind: "renter" });
    await updateSeat(ctx, id, {
      headline,
      bio: PLACEHOLDER_BIO,
      isPublished: true,
    });
    await uploadSeatPhoto(
      ctx,
      id,
      new Uint8Array(readFileSync(`apps/web/public/am-barber/staff/${file}`)),
      "photo",
      { filename: file },
    );
    for (const key of services) {
      const [svc, min, dollars, desc] = MENU[key];
      await saveSeatService(ctx, id, {
        name: svc,
        description: desc,
        durationMinutes: min,
        priceCents: dollars * 100,
      });
    }
    log(`PASS seat ${name} (placeholder)`);
  }

  // Step 2: every seat without hours gets the shop's opening hours (TODO(owner): each
  // stylist's own hours), so the placeholder seats can be booked.
  const shopHours = await withSuperuser(async (pb) => {
    const p = await pb
      .collection("business_profile")
      .getFirstListItem(pb.filter("organization = {:o}", { o: orgId }), {
        fields: "hours",
      })
      .catch(() => null);
    return p?.hours ?? null;
  });
  const fallback = Object.fromEntries(
    ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => [
      d,
      d === "sun" || d === "mon"
        ? { open: false, ranges: [] }
        : { open: true, ranges: [{ start: "10:00", end: "19:00" }] },
    ]),
  );
  for (const seat of await listSeats(ctx)) {
    const schedule = await getSchedule(ctx, seat.id);
    if (schedule.hours) continue;
    try {
      const anyOpen =
        shopHours !== null &&
        typeof shopHours === "object" &&
        Object.values(shopHours as Record<string, { open?: boolean }>).some(
          (d) => d?.open === true,
        );
      await saveHours(ctx, seat.id, anyOpen ? shopHours : fallback);
    } catch {
      await saveHours(ctx, seat.id, fallback);
    }
    log(`PASS hours for ${seat.name}`);
  }

  // The team pages live at /team; an older "Barbers" item pointing at /barbers is renamed.
  const url = `https://${HOST}/team`;
  const old = `https://${HOST}/barbers`;
  const nav = await getNav(ctx);
  if (nav && !nav.items.some((i) => i.target === url)) {
    const item = {
      id: newRecordId(),
      label: "Our Team",
      target: url,
      new_tab: false,
      children: [],
    };
    const items = nav.items.some((i) => i.target === old)
      ? nav.items.map((i) =>
          i.target === old ? { ...i, label: "Our Team", target: url } : i,
        )
      : [...nav.items, item];
    await saveNav(ctx, deps, { ...nav, items });
  }
  log("PASS Our Team in the site menu");
}

main().catch((err: unknown) => {
  console.error(
    `FAIL ${err instanceof Error ? `${err.name}: ${err.message}` : "unknown error"}`,
  );
  process.exit(1);
});
