---
type: plan
status: active
tags: [superior-salon, salon-business, handoff, coolify, pocketbase]
relatedTo: [superior-salon-infra, am-barbershop]
---

# Superior Salon handoff (2026-11-24)

## State

- Live: https://salon.needtobeedgy.com (admin.salon, api.salon). Repo `mpierc31970/salon-business`, `main` is clean and deployed.
- Infra and procedures: see `CLAUDE.md` (Coolify app `uax7hxhhvgo4vpynkcvt7gvs`, `pocketbase-salon` :8097, Wasabi DB backups, seeding/storage steps, `npm run am:logo` for cache-busting logo swaps).
- **Required deploy order** (user rule): PATCH app `health_check_enabled:false` → POST deploy → poll until finished → PATCH `health_check_enabled:true`.
- Done and verified with DevTools: brand (ivory/bronze, current logo), 8 staff, salon photos with corner frames, `/services`, `/team` (`/barbers` 301s), stylist "Add from salon menu", booking header order, per-service durations, light map, reference-site design elements, address `1234 Main St, Grand Prairie, TX 75050` (no phone), `/privacy` + `/terms` published, contact map warning fixed.

## Open

- Logo: user rejected the badge concepts; keep the current logo for now.
- `/gallery` React #418 seen once after a republish; not reproducible (~40 clean loads). If it recurs, run `scratchpad/watch.cjs <url> <minutes>` (session scratchpad; may be gone) during a deploy to capture the HTML.
- Hub owner and stylist flows were tested once by an agent; the user hasn't tried them.

## Rules from the user

- Emails: business/contact → matthew@metaphysicalevents.com (no plus-addressing there); logins and named customers → `pierce1970+<name>@gmail.com`.
- All content pages salon-themed; OpenAI spend is approved for this project.
- Test with Chrome DevTools after building. Don't warn about the Coolify token.
