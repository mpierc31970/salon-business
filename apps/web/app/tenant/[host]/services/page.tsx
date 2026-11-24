// /services on tenant hosts: the salon menu (the owner's master list in Studio Booking ›
// Services & Pricing › Salon menu), grouped under the service photos it maps to. Reads only
// listPublicMenu; a failed read renders the empty state, never a 500. "services" is a
// reserved slug.
import { listPublicMenu, type PublicSeatService } from "@cds/db";
import { PageTitleHeader, siteButtonClasses } from "@cds/ui/site";
import type { Metadata } from "next";
import { siteForRequest } from "../../../../lib/tenant";
import { MUTED, minutes, money } from "../team/BarberViews";
import { groupServices } from "./groups";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Cuts, color, bridal, skin, nails, brows, lashes and makeup: the Superior Salon menu.",
};

type Props = { params: Promise<{ host: string }> };

export default async function ServicesPage({ params }: Props) {
  const { host } = await params;
  const site = await siteForRequest(host);
  let menu: PublicSeatService[] = [];
  try {
    menu = await listPublicMenu(site);
  } catch {
    console.error("[services] menu read failed");
  }
  const groups = groupServices(menu);
  return (
    <main
      id="content"
      tabIndex={-1}
      className="outline-none"
      data-services-page=""
    >
      <PageTitleHeader title="Services" />
      <div className="mx-auto flex max-w-[1120px] flex-col gap-16 px-6 pb-16 md:px-8">
        {groups.length === 0 ? (
          <p className={MUTED}>
            Our menu will be listed here soon. Call us to book.
          </p>
        ) : (
          groups.map((g, i) => (
            <section
              key={g.key}
              aria-labelledby={`svc-${g.key}`}
              className="grid items-center gap-8 md:grid-cols-2 md:gap-14"
            >
              {g.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={g.photo}
                  alt=""
                  width={1200}
                  height={800}
                  loading={i < 2 ? "eager" : "lazy"}
                  className={`aspect-[3/2] w-full object-cover ${i % 2 ? "md:order-last" : ""}`}
                />
              ) : null}
              <div
                className={`flex min-w-0 flex-col gap-4 ${g.photo ? "" : "md:col-span-2"}`}
              >
                <h2
                  id={`svc-${g.key}`}
                  className="text-[length:var(--site-text-h2)] leading-tight"
                >
                  {g.title}
                </h2>
                <ul className="flex flex-col divide-y divide-site-border border-y border-site-border">
                  {g.services.map((s) => (
                    <li key={s.id} className="flex flex-col gap-1 py-4">
                      <div className="flex items-baseline gap-4">
                        <span className="min-w-0 flex-1 font-semibold">
                          {s.name}
                        </span>
                        <span className={`whitespace-nowrap text-sm ${MUTED}`}>
                          {minutes(s.durationMinutes)}
                        </span>
                        <span className="whitespace-nowrap font-semibold tabular-nums">
                          {money(s.priceCents)}
                        </span>
                      </div>
                      {s.description ? (
                        <p className={`text-sm ${MUTED}`}>{s.description}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))
        )}
        <div className="flex flex-col items-center gap-4 text-center">
          <p className={MUTED}>
            Prices start from the menu above; each stylist sets their own.
          </p>
          <a href="/team" className={siteButtonClasses("primary")}>
            Book with a stylist
          </a>
        </div>
      </div>
    </main>
  );
}
