// Superior Salon site updates after the first seed. Idempotent, and touches nothing else
// (unlike seed-am-barber.ts, it never rewrites pages the owner may have edited).
//
//   npm run am:site
//
// - Theme: writes design/tenants/am-barber when its source changed (type scale etc.).
// - /gallery: heading, a photo grid of every "gallery" photo in the media library, then
//   "On TikTok" with four empty columns: the owner drops a TikTok video item into each
//   from the builder (a video item can't be saved without a link).
// - Home: services two per row (photo on top), and a slider of the same photos just
//   above Opening hours.
// - Media: the salon gallery photos (apps/web/public/am-barber/gallery) are added once; the
//   old barbershop photos are retired from the library.
// - Home: the closing call-to-action and slider heading carry salon copy.
// - About: title "About the Salon", the salon story, "Our philosophy" 50-50 with the logo,
//   "The experience" with a photo, and "Our team" linking to /team.
// - Gallery goes in the menu; the pages are published.
// Re-runs refresh the photo lists and keep everything else as the owner left it.
//
// Storage: like am:seed, run it against a copy of the live object store and copy the
// changed files back (CLAUDE.md "Seeding").
import "@cds/addon-registry/server";
import { ADDON_REGISTRY } from "@cds/addon-registry/server";
import { composeSectionRegistry, CORE_SECTIONS } from "@cds/core/content";
import { importThemeDir } from "@cds/core/theme/import";
import { withSuperuser } from "../src/client";
import { addPageToNav } from "../src/content/chrome/nav";
import { createPage, listPages, updatePage } from "../src/content/pages";
import { recordingInvalidator } from "../src/content/ports";
import { publishPage, type PublishDeps } from "../src/content/publish";
import {
  getContentScanner,
  getSearchPinger,
} from "../src/content/scan-standin";
import {
  deleteSection,
  listSections,
  saveSection,
  setSectionHidden,
} from "../src/content/sections";
import { mintOrgContext, mintSystemContext } from "../src/context";
import { queueDesignWrite } from "../src/theme";
import { listMedia, removeMedia, uploadImage } from "../src/media/assets";
import { readFileSync } from "node:fs";
import { scrubContact } from "./contact-scrub";

const SLUG = "am-barber";
const PUB = "apps/web/public/am-barber";
// Salon gallery photos (AI-generated; gallery/CREDITS.md), keyed by alt text.
const GALLERY = [
  ["balayage.webp", "Finished honey-blonde balayage in soft waves"],
  ["copper.webp", "A freshly cut and blow-dried rich copper style"],
  ["bob.webp", "A sleek, glossy brunette precision bob"],
  ["updo.webp", "A textured braided updo with gold leaf pins"],
  ["interior.webp", "The salon floor: cream chairs and arched brass mirrors"],
  ["nails.webp", "A milky-nude almond manicure with a fine gold line"],
  ["treatment.webp", "The treatment room, ready for a facial"],
  ["products.webp", "The salon's hair and skin care shelf"],
] as const;
// The barbershop's old stock photos (by alt), retired from the library.
const RETIRED_ALTS = new Set([
  "A barber cutting a client's hair with scissors",
  "A barber taking a skin fade down with clippers",
  "A barber trimming a full beard with scissors",
  "A client under a hot towel for a straight-razor shave",
  "A young boy in the barber's chair after his cut",
]);
const STORY = [
  "Superior Salon is a luxury hair and beauty salon on Main Street in Grand Prairie. We built it for people who want to be looked after properly: time to talk, specialists who listen, and results that feel like you on your best day.",
  "Every service has its own expert. Our colorists hand-paint balayage and lived-in color, our stylists cut and finish with precision, and our bridal team creates looks that last from the first photograph to the last dance. Skin, nails, brows, lashes and makeup are done to the same standard, under one roof.",
  "We use professional, gentle products, keep appointments unhurried, and finish every visit with advice you can use at home.",
];
const PHILOSOPHY =
  "<p>Quiet luxury, honest advice and results that grow out beautifully. We would rather tell you what will really suit your hair and skin than sell you something that won't.</p>";
const EXPERIENCE =
  "<p>Your visit starts with a consultation and a drink of your choice. We look at your hair, skin and routine, agree the plan together, and talk you through every step.</p><p>You leave with a finish you love and the know-how to keep it.</p>";
const TEAM =
  "<p>Colorists, stylists, a bridal specialist, an esthetician, a nail artist, a brow and lash artist, a trichologist and a makeup artist: meet the people behind every appointment.</p>";
const IP = "am-site";
const ID = (n: number) =>
  `a3b00000-0000-4000-9000-0000000000${String(n).padStart(2, "0")}`;

function log(line: string): void {
  console.log(line);
}

async function main(): Promise<void> {
  for (const k of ["PB_URL", "PB_SUPERUSER_EMAIL", "PB_SUPERUSER_PASSWORD"]) {
    if (!process.env[k]) throw new Error(`${k} is not set`);
  }
  const { orgId, ownerId } = await withSuperuser(async (pb) => {
    const org = await pb
      .collection("organizations")
      .getFirstListItem(pb.filter("slug = {:s}", { s: SLUG }));
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
    ip: IP,
  });
  const sections = composeSectionRegistry(
    CORE_SECTIONS,
    ADDON_REGISTRY.sections(),
  );
  const pdeps: PublishDeps = {
    sections,
    invalidator: recordingInvalidator(),
    scanner: getContentScanner(),
    pinger: getSearchPinger(),
    addons: ADDON_REGISTRY,
  };

  const library = await listMedia(ctx, "gallery");
  for (const [file, alt] of GALLERY) {
    if (library.some((m) => m.alt === alt)) continue;
    await uploadImage(
      ctx,
      new Uint8Array(readFileSync(`${PUB}/gallery/${file}`)),
      "gallery",
      { alt, filename: file },
    );
  }
  for (const m of library) {
    if (RETIRED_ALTS.has(m.alt)) await removeMedia(ctx, m.id);
  }
  log("PASS salon gallery photos in the library");
  const photos = await listMedia(ctx, "gallery");
  if (photos.length === 0) throw new Error("no gallery photos in the library");
  const images = photos.map((m, i) => ({
    id: ID(50 + i),
    asset: m.id,
    alt: "",
    alt_reviewed: true,
    caption: "",
  }));
  const galleryContent = (display: "grid" | "slider", heading: string) => ({
    heading,
    display,
    columns: 3,
    per_page: 24,
    show_captions: false,
    lightbox: true,
    images,
  });

  // ---- Theme (only when the authored source changed)
  const theme = importThemeDir("design/tenants/am-barber", {
    root: process.cwd(),
  });
  await withSuperuser(async (pb) => {
    const org = await pb.collection("organizations").getOne(orgId);
    const stored = org.design as { sourceHash?: string } | null;
    if (stored?.sourceHash === theme.design.sourceHash) {
      log("PASS theme unchanged");
      return;
    }
    const batch = pb.createBatch();
    queueDesignWrite(
      batch,
      mintSystemContext({ job: "am-site" }),
      orgId,
      org.design,
      theme.design,
      "import",
    );
    await batch.send();
    log(`PASS theme ${theme.report.hash8} written`);
  });

  // ---- Gallery page
  const pages = await listPages(ctx);
  const page =
    pages.find((p) => p.slug === "gallery") ??
    (await createPage(ctx, { title: "Gallery", slug: "gallery" }));
  const have = await listSections(ctx, page.id);
  const intro = have.find(
    (s) =>
      s.section_type === "text-only" &&
      !JSON.stringify(s.content).includes("TikTok"),
  );
  // The page title is already the h1 "Gallery"; the intro carries no second heading.
  const introContent = intro
    ? {
        ...(intro.content as Record<string, unknown>),
        ...((intro.content as { heading?: string }).heading === "Gallery"
          ? { heading: "" }
          : {}),
      }
    : null;
  const introRow = await saveSection(ctx, sections, {
    ...(intro ? { id: intro.id } : {}),
    pageId: page.id,
    section_type: "text-only",
    row_layout: "full",
    content: {
      ...(introContent ?? {}),
      heading: "",
      text: "<p>Color, cuts, bridal looks, skin and nails, and the salon itself at 1234 Main St, Grand Prairie.</p>",
    },
  });
  const grid = have.find((s) => s.section_type === "gallery");
  const gridRow = await saveSection(ctx, sections, {
    ...(grid ? { id: grid.id } : { afterId: introRow.id }),
    pageId: page.id,
    section_type: "gallery",
    row_layout: "full",
    content: {
      ...galleryContent("grid", ""),
      ...(grid
        ? { columns: (grid.content as { columns?: number }).columns ?? 3 }
        : {}),
    },
  });
  const tiktokHead = have.find(
    (s) =>
      s.section_type === "text-only" &&
      JSON.stringify(s.content).includes("TikTok"),
  );
  const headRow = tiktokHead
    ? tiktokHead
    : await saveSection(ctx, sections, {
        afterId: gridRow.id,
        pageId: page.id,
        section_type: "text-only",
        row_layout: "full",
        content: {
          heading: "On TikTok",
          text: "<p>Our latest videos.</p>",
        },
      });
  const tiktokRow =
    have.find((s) => s.section_type === "columns") ??
    (await saveSection(ctx, sections, {
      afterId: headRow.id,
      pageId: page.id,
      section_type: "columns",
      row_layout: "25-25-25-25",
      content: {
        columns: [1, 2, 3, 4].map((n) => ({ id: ID(n), items: [] })),
      },
    }));
  // "On TikTok" stays hidden until the row holds a video; the owner shows both blocks in
  // the builder (or re-runs this) once they add one.
  const noVideos = !JSON.stringify(tiktokRow.content).includes(
    '"kind":"video"',
  );
  await setSectionHidden(ctx, headRow.id, noVideos);
  await setSectionHidden(ctx, tiktokRow.id, noVideos);
  await updatePage(ctx, page.id, {
    seo: {
      meta_title: "Gallery | Superior Salon, Grand Prairie, TX",
      meta_description:
        "Balayage, precision cuts, bridal styling and the salon at Superior Salon, 1234 Main St, Grand Prairie, TX.",
    },
  });
  const gRes = await publishPage(ctx, page.id, pdeps);
  if (gRes.status !== "published") throw new Error("Gallery publish held");
  await addPageToNav(ctx, pdeps, page.id);
  log(
    `PASS gallery page: ${photos.length} photos, 4 TikTok slots, in the menu`,
  );

  // ---- Home slider, just above Opening hours
  const home = pages.find((p) => p.slug === "home");
  if (!home) throw new Error("no Home page");

  // ---- Home services: two per row (photo on top, text under it), not one 40-60 row each.
  // Rows are found by the seed's fixed column ids; each service keeps its own items, so the
  // owner's edits survive. Already paired (a 50-50 row) = nothing to do.
  const svcCol = (n: number) =>
    `a3b00000-0000-4000-8100-0000000000${String(n).padStart(2, "0")}`;
  const before0 = await listSections(ctx, home.id);
  type Col = { id: string; items: { kind?: string }[] };
  const rowOf = (n: number) =>
    before0.find(
      (s) =>
        s.section_type === "columns" &&
        JSON.stringify(s.content).includes(svcCol(n)),
    );
  const svcRows = [0, 1, 2, 3, 4].map(rowOf);
  if (svcRows.every(Boolean) && svcRows[0]!.row_layout !== "50-50") {
    const itemsOf = (n: number) => {
      const cols = (svcRows[n]!.content as { columns: Col[] }).columns;
      const items = cols.flatMap((c) => c.items);
      return [
        ...items.filter((i) => i.kind === "image"),
        ...items.filter((i) => i.kind !== "image"),
      ];
    };
    for (const [a, b] of [
      [0, 1],
      [2, 3],
      [4, -1],
    ] as const) {
      await saveSection(ctx, sections, {
        id: svcRows[a]!.id,
        pageId: home.id,
        section_type: "columns",
        row_layout: "50-50",
        content: {
          columns: [
            { id: svcCol(a), items: itemsOf(a) },
            b >= 0
              ? { id: svcCol(b), items: itemsOf(b) }
              : { id: ID(9), items: [] },
          ],
        },
      });
    }
    await deleteSection(ctx, svcRows[1]!.id);
    await deleteSection(ctx, svcRows[3]!.id);
    log("PASS home services: two per row");
  }

  const homeSections = await listSections(ctx, home.id);
  // Home "Book Now" (the intro row) goes to /team, not a tel: link or the old /barbers.
  for (const s of homeSections) {
    if (s.section_type !== "columns") continue;
    const c = s.content as { columns: { items: Record<string, unknown>[] }[] };
    const btn = c.columns
      .flatMap((col) => col.items)
      .find(
        (it) =>
          it.kind === "button" &&
          /^book now$/i.test(String(it.text)) &&
          (String(it.link).startsWith("tel:") ||
            String(it.link) === "/barbers"),
      );
    if (!btn) continue;
    btn.link = "/team";
    await saveSection(ctx, sections, {
      id: s.id,
      pageId: home.id,
      section_type: "columns",
      row_layout: s.row_layout,
      content: c,
    });
    log("PASS home Book Now -> /team");
  }
  const slider = homeSections.find((s) => s.section_type === "gallery");
  const hoursAt = homeSections.findIndex((s) => s.section_type === "hours");
  const before =
    homeSections[(hoursAt > 0 ? hoursAt : homeSections.length) - 1];
  await saveSection(ctx, sections, {
    ...(slider ? { id: slider.id } : { afterId: before!.id }),
    pageId: home.id,
    section_type: "gallery",
    row_layout: "full",
    content: galleryContent(
      "slider",
      slider
        ? String((slider.content as { heading?: string }).heading ?? "")
        : "From the salon",
    ),
  });
  // Closing call-to-action: salon copy (the phone button is kept).
  const cta = homeSections.find((s) => s.section_type === "cta-banner");
  if (cta) {
    await saveSection(ctx, sections, {
      id: cta.id,
      pageId: home.id,
      section_type: "cta-banner",
      row_layout: cta.row_layout,
      content: {
        ...(cta.content as Record<string, unknown>),
        heading: "Your appointment, your way",
        description:
          "Book online with your stylist or send us a message. We'll find the right specialist and the right time.",
      },
    });
  }
  const hRes = await publishPage(ctx, home.id, pdeps);
  if (hRes.status !== "published") throw new Error("Home publish held");
  log("PASS home slider above Opening hours");

  // ---- About: title, the salon story, then three 50-50 rows found again by fixed column
  // ids: philosophy (logo left), the experience (photo right), our team (photo left).
  const about = pages.find((p) => p.slug === "about");
  if (about) {
    await updatePage(ctx, about.id, {
      title: "About the Salon",
      seo: {
        meta_title: "About the Salon | Superior Salon, Grand Prairie, TX",
        meta_description:
          "The story, philosophy and team behind Superior Salon, a luxury hair and beauty salon in Grand Prairie, TX.",
      },
    });
    const have = await listSections(ctx, about.id);
    const story = have.find(
      (s) =>
        s.section_type === "text-only" &&
        !(s.content as { heading?: string }).heading,
    );
    const storyRow = await saveSection(ctx, sections, {
      ...(story ? { id: story.id } : {}),
      pageId: about.id,
      section_type: "text-only",
      row_layout: "full",
      content: {
        ...((story?.content as Record<string, unknown>) ?? {}),
        heading: "",
        text: STORY.map((p) => `<p>${p}</p>`).join(""),
      },
    });
    // The template's plain "Our mission" block becomes the philosophy row below.
    const oldMission = have.find(
      (s) =>
        s.section_type === "text-only" &&
        (s.content as { heading?: string }).heading === "Our mission",
    );
    if (oldMission) await deleteSection(ctx, oldMission.id);

    const aboutPhoto = async (file: string, alt: string) =>
      (await listMedia(ctx, "gallery")).find((m) => m.alt === alt)?.id ??
      (
        await uploadImage(
          ctx,
          new Uint8Array(readFileSync(`${PUB}/about/${file}`)),
          "gallery",
          { alt, filename: file },
        )
      ).asset.id;
    const logo = (await listMedia(ctx, "logo"))[0];
    const image = (n: number, asset: string, alt: string) => ({
      id: ID(n),
      kind: "image",
      url: "",
      alt,
      asset,
    });
    const words = (n: number, heading: string, html: string) => [
      { id: ID(n), kind: "heading", text: heading, level: 2 },
      { id: ID(n + 1), kind: "text", html },
    ];
    const rows = [
      [
        {
          id: ID(20),
          items: logo ? [image(21, logo.id, "Superior Salon logo")] : [],
        },
        { id: ID(22), items: words(23, "Our philosophy", PHILOSOPHY) },
      ],
      [
        { id: ID(30), items: words(31, "The experience", EXPERIENCE) },
        {
          id: ID(33),
          items: [
            image(
              34,
              await aboutPhoto(
                "consultation.webp",
                "A stylist and client planning color together",
              ),
              "A stylist and client planning color together",
            ),
          ],
        },
      ],
      [
        {
          id: ID(40),
          items: [
            image(
              41,
              await aboutPhoto(
                "salon.webp",
                "A styling chair before an arched brass mirror",
              ),
              "A styling chair before an arched brass mirror",
            ),
          ],
        },
        {
          id: ID(42),
          items: [
            ...words(43, "Our team", TEAM),
            {
              id: ID(45),
              kind: "button",
              action: "link",
              text: "Meet the team",
              link: "/team",
              style: "primary",
              popup_id: "",
            },
          ],
        },
      ],
    ];
    let after = storyRow.id;
    for (const columns of rows) {
      const existing = have.find(
        (s) =>
          s.section_type === "columns" &&
          JSON.stringify(s.content).includes(columns[0]!.id),
      );
      const row = await saveSection(ctx, sections, {
        ...(existing ? { id: existing.id } : { afterId: after }),
        pageId: about.id,
        section_type: "columns",
        row_layout: "50-50",
        content: { columns },
      });
      after = row.id;
    }
    log("PASS about: story, philosophy, experience, team");
    const aRes = await publishPage(ctx, about.id, pdeps);
    if (aRes.status !== "published") throw new Error("About publish held");
    log("PASS about: title About the Salon");
  }

  // Contact copy: no phone, the placeholder address (contact-scrub.ts), on every page.
  for (const p of await listPages(ctx)) {
    let changed = 0;
    for (const s of await listSections(ctx, p.id)) {
      const content = scrubContact(s.content);
      if (!content) continue;
      await saveSection(ctx, sections, {
        id: s.id,
        pageId: p.id,
        section_type: s.section_type,
        row_layout: s.row_layout,
        content,
      });
      changed++;
    }
    if (changed === 0) continue;
    const r = await publishPage(ctx, p.id, pdeps);
    if (r.status !== "published") throw new Error(`${p.slug} publish held`);
    log(`PASS contact copy: ${p.slug} (${changed} sections)`);
  }
}

main().catch((err: unknown) => {
  console.error(
    `FAIL ${err instanceof Error ? `${err.name}: ${err.message}` : "unknown error"}`,
  );
  if (err && typeof err === "object" && "data" in err) {
    console.error(
      JSON.stringify((err as { data: unknown }).data).slice(0, 800),
    );
  }
  process.exit(1);
});
