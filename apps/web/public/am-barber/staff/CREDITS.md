# Staff photos: AI-generated placeholders

TODO(owner): replace every photo here with a real photo of each team member (upload it on
their seat in the hub: Team > the stylist > Photos). Then these files can be deleted.

- `barber-1.webp` to `barber-8.webp`: generated 2026-11-24 with OpenAI `gpt-image-1.5`
  (text to image, quality medium, 1024x1536), converted to WebP. They are not real people
  and not real staff of Superior Salon.
- The studio seed (`npm run am:studio-seed`) uploads them as the eight placeholder seats'
  portraits, in `SEATS` order (`packages/db/scripts/seed-am-studio.ts`).
- File names keep the inherited `barber-N` pattern on purpose (code paths stay unchanged).
