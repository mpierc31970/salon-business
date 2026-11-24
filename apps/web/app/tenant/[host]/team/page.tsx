// /team on tenant hosts: every published stylist (Studio Booking). Server-rendered under
// the site chrome; reads only listPublicSeats (published seats, allowlisted fields). A failed
// read renders an empty state, never a 500. A static route: "team" is a reserved slug.
import { listPublicSeats, type PublicSeat } from "@cds/db";
import { PageTitleHeader } from "@cds/ui/site";
import type { Metadata } from "next";
import { siteForRequest } from "../../../../lib/tenant";
import { BarberCard, MUTED } from "./BarberViews";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our team",
  description:
    "Meet our stylists and specialists, and book with the one you want.",
};

type Props = { params: Promise<{ host: string }> };

export default async function BarbersPage({ params }: Props) {
  const { host } = await params;
  const site = await siteForRequest(host);
  let seats: PublicSeat[] = [];
  try {
    seats = await listPublicSeats(site);
  } catch {
    console.error("[barbers] list failed");
  }
  return (
    <main
      id="content"
      tabIndex={-1}
      className="outline-none"
      data-barbers-page=""
    >
      <PageTitleHeader title="Our team" />
      <div className="mx-auto max-w-[1120px] px-6 pb-16 md:px-8">
        {seats.length === 0 ? (
          <p className={MUTED}>
            Our team will be listed here soon. Call us to book.
          </p>
        ) : (
          <ul className="flex flex-wrap justify-center gap-8">
            {seats.map((s) => (
              <BarberCard key={s.id} seat={s} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
