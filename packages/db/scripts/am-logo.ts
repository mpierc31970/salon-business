// Superior Salon: put a redrawn apps/web/public/am-barber/logo.png live under NEW media ids.
// Media URLs carry the asset id and are cached for a year, so a file swapped in place keeps
// showing the old logo; a fresh upload gets a fresh URL. The logo, hero and share-card rows
// are uploaded again (same kind and alt), every page block / share image pointing at an old
// id is re-pointed, the changed pages are republished and the old rows retired (a new logo
// or hero retires the old one itself). Same env and storage note as am:site (fresh copy of
// the live volume, copy back the changed files).
//
//   npm run am:logo
import "@cds/addon-registry/server";
import { ADDON_REGISTRY } from "@cds/addon-registry/server";
import { composeSectionRegistry, CORE_SECTIONS } from "@cds/core/content";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { withSuperuser } from "../src/client";
import { listPages, updatePage } from "../src/content/pages";
import { recordingInvalidator } from "../src/content/ports";
import { publishPage, type PublishDeps } from "../src/content/publish";
import {
  getContentScanner,
  getSearchPinger,
} from "../src/content/scan-standin";
import { listSections, saveSection } from "../src/content/sections";
import { mintOrgContext } from "../src/context";
import { listMedia, removeMedia, uploadImage } from "../src/media/assets";
import { repointIds } from "./repoint-ids";

const LOGO = "apps/web/public/am-barber/logo.png";
const SHARE_ALT = "Superior Salon logo on ivory";

/** The share card: the logo centred on ivory, 1200 x 630 (as am:seed builds it). */
async function shareCard(logo: Buffer): Promise<Uint8Array> {
  const fitted = await sharp(logo)
    .resize(900, 500, { fit: "contain", background: "#00000000" })
    .png()
    .toBuffer();
  return new Uint8Array(
    await sharp({
      create: { width: 1200, height: 630, channels: 3, background: "#fbf8f3" },
    })
      .composite([{ input: fitted, gravity: "center" }])
      .jpeg({ quality: 88 })
      .toBuffer(),
  );
}

async function main(): Promise<void> {
  const logo = readFileSync(LOGO);
  const share = await shareCard(logo);
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
    ip: "am-logo",
  });
  const pdeps: PublishDeps = {
    sections: composeSectionRegistry(CORE_SECTIONS, ADDON_REGISTRY.sections()),
    invalidator: recordingInvalidator(),
    scanner: getContentScanner(),
    pinger: getSearchPinger(),
    addons: ADDON_REGISTRY,
  };

  const old = [
    ...(await listMedia(ctx, "logo")).map((m) => ({
      m,
      kind: "logo" as const,
    })),
    ...(await listMedia(ctx, "hero")).map((m) => ({
      m,
      kind: "hero" as const,
    })),
    ...(await listMedia(ctx, "moodboard"))
      .filter((m) => m.alt === SHARE_ALT)
      .map((m) => ({ m, kind: "moodboard" as const })),
  ];
  const map = new Map<string, string>();
  for (const { m, kind } of old) {
    const isShare = kind === "moodboard";
    const { asset } = await uploadImage(
      ctx,
      isShare ? share : new Uint8Array(logo),
      kind,
      {
        alt: m.alt,
        filename: isShare ? "share.jpg" : `${kind}.png`,
        ...(kind === "logo" ? { invalidator: pdeps.invalidator } : {}),
      },
    );
    map.set(m.id, asset.id);
    console.log(`PASS ${kind} ${m.id} -> ${asset.id}`);
  }

  for (const p of await listPages(ctx)) {
    let changed = false;
    for (const s of await listSections(ctx, p.id)) {
      const content = repointIds(s.content, map);
      if (!content) continue;
      await saveSection(ctx, pdeps.sections, {
        id: s.id,
        pageId: p.id,
        section_type: s.section_type,
        row_layout: s.row_layout,
        content,
      });
      changed = true;
    }
    const seo = repointIds(p.seo, map);
    if (seo) {
      await updatePage(ctx, p.id, { seo });
      changed = true;
    }
    if (!changed) continue;
    const r = await publishPage(ctx, p.id, pdeps);
    if (r.status !== "published") throw new Error(`${p.slug} publish held`);
    console.log(`PASS republished ${p.slug}`);
  }
  // Logo and hero retired themselves on upload; the share card is a moodboard row.
  for (const { m, kind } of old) {
    if (kind === "moodboard") await removeMedia(ctx, m.id);
  }
}

main().catch((err: unknown) => {
  console.error(`FAIL ${err instanceof Error ? err.message : "unknown error"}`);
  process.exit(1);
});
