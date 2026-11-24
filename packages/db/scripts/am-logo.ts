// Superior Salon: put a redrawn apps/web/public/am-barber/logo.png into the live media in
// place. The logo, hero and share-card assets keep their ids (pages, the header and the
// share card point at them); only their stored files and sizes change, then the site icons
// are regenerated. Same env and storage note as am:site (fresh copy of the live volume).
//
//   npm run am:logo
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { withSuperuser } from "../src/client";
import { regenerateSiteIcons } from "../src/content/seo/site-icons";
import { storeImageObjects } from "../src/media/assets";
import { originalFile, processImage } from "../src/media/pipeline";
import { getObjectStore } from "../src/storage";

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
  const store = getObjectStore();
  const orgId = await withSuperuser(async (pb) => {
    const org = await pb
      .collection("organizations")
      .getFirstListItem(pb.filter("slug = 'am-barber'"));
    const rows = await pb.collection("media_assets").getFullList({
      filter: pb.filter(
        "organization = {:o} && removed_at = '' && deleted_at = '' && (kind = 'logo' || kind = 'hero' || alt = {:share})",
        { o: org.id, share: SHARE_ALT },
      ),
    });
    for (const row of rows) {
      const bytes = row.alt === SHARE_ALT ? share : new Uint8Array(logo);
      const img = await processImage(bytes);
      const { ext, mime } = originalFile(img.format);
      if (ext !== row.original_ext) {
        throw new Error(`${row.id}: ${ext} is not ${row.original_ext}`);
      }
      const stored = await storeImageObjects(
        store,
        org.id,
        row.id,
        img,
        ext,
        mime,
      );
      await pb.collection("media_assets").update(row.id, {
        width: img.width,
        height: img.height,
        web_width: img.web.width,
        web_height: img.web.height,
        bytes: stored.footprint,
      });
      console.log(`PASS ${row.kind} ${row.id} ${img.width}x${img.height}`);
    }
    return org.id;
  });
  const icons = await regenerateSiteIcons(orgId, { force: true });
  console.log(icons.ok ? "PASS site icons" : "FAIL site icons");
}

main().catch((err: unknown) => {
  console.error(`FAIL ${err instanceof Error ? err.message : "unknown error"}`);
  process.exit(1);
});
