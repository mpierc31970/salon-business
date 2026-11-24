// /hub/studio-booking/services: one barber's services and prices (Salon fork: its own tab,
// after Bookings). A barber edits their own; the owner picks a barber (?seat=) or edits the
// salon menu (?seat=menu, the default: the master list on the public /services page).
// Stylists add menu items to their own seat, then set their own price and time.
import { listMenu } from "@cds/db";
import { Button, Select, TextField } from "@cds/ui/hub";
import type { Metadata } from "next";
import {
  adoptServiceAction,
  removeServiceAction,
  saveServiceAction,
} from "../../../../actions/studio";
import { requireHubSession } from "../../../../../lib/session";
import { duration, money, priceField } from "../../../../../lib/studio";
import { menuForTab, SeatTabFrame, seatForTab } from "../SeatTabFrame";

export const metadata: Metadata = { title: "Services & Pricing" };
export const dynamic = "force-dynamic";

const CARD =
  "flex flex-col gap-4 rounded border border-hub-border bg-hub-surface p-4";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ServicesPage({ searchParams }: Props) {
  const menuTab = await menuForTab(searchParams);
  const { seat, manager, seats } = menuTab ?? (await seatForTab(searchParams));
  // Menu items this seat doesn't offer yet (by name).
  const offered = new Set(seat.services.map((s) => s.name.toLowerCase()));
  const adoptable = menuTab
    ? []
    : (await listMenu((await requireHubSession()).ctx)).filter(
        (m) => !offered.has(m.name.toLowerCase()),
      );
  return (
    <SeatTabFrame
      title="Services & Pricing"
      tab="services"
      path="/services"
      seat={seat}
      manager={manager}
      seats={seats}
    >
      {menuTab ? (
        <p className="text-sm text-hub-ink-muted">
          The salon menu shows on the public Services page. Stylists add these
          to their own menu and set their own price and time.
        </p>
      ) : adoptable.length > 0 ? (
        <form
          action={adoptServiceAction}
          aria-label="Add from the salon menu"
          className={`${CARD} sm:flex-row sm:items-end`}
        >
          <input type="hidden" name="seatId" value={seat.id} />
          <div className="sm:flex-1">
            <Select
              id="menu-pick"
              name="menuId"
              label="Add from the salon menu"
              options={adoptable.map((m) => ({
                value: m.id,
                label: `${m.name} · ${duration(m.durationMinutes)} · ${money(m.priceCents)}`,
              }))}
            />
          </div>
          <Button type="submit" size="sm" variant="primary">
            Add to my services
          </Button>
        </form>
      ) : null}
      <section aria-label="Services" className="flex flex-col gap-3">
        {seat.services.map((s) => (
          <form
            key={s.id}
            action={saveServiceAction}
            className={`${CARD} sm:grid sm:grid-cols-[2fr_1fr_1fr]`}
          >
            <input type="hidden" name="seatId" value={seat.id} />
            <input type="hidden" name="serviceId" value={s.id} />
            <TextField
              id={`n-${s.id}`}
              name="name"
              label="Service"
              defaultValue={s.name}
              required
              maxLength={80}
            />
            <TextField
              id={`d-${s.id}`}
              name="duration"
              label="Minutes"
              type="number"
              min={5}
              max={480}
              step={5}
              defaultValue={s.durationMinutes}
              required
            />
            <TextField
              id={`p-${s.id}`}
              name="price"
              label="Price ($)"
              inputMode="decimal"
              defaultValue={priceField(s.priceCents)}
              helper="Blank: ask for a price"
            />
            <div className="sm:col-span-3">
              <TextField
                id={`x-${s.id}`}
                name="description"
                label="Description"
                defaultValue={s.description}
                maxLength={300}
              />
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <Button type="submit" size="sm">
                Save
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                formAction={removeServiceAction}
              >
                Remove
              </Button>
              <span className="self-center text-sm text-hub-ink-muted">
                {duration(s.durationMinutes)} · {money(s.priceCents)}
              </span>
            </div>
          </form>
        ))}
        <form
          action={saveServiceAction}
          className={`${CARD} sm:grid sm:grid-cols-[2fr_1fr_1fr]`}
        >
          <input type="hidden" name="seatId" value={seat.id} />
          <TextField
            id="n-new"
            name="name"
            label="New service"
            required
            maxLength={80}
          />
          <TextField
            id="d-new"
            name="duration"
            label="Minutes"
            type="number"
            min={5}
            max={480}
            step={5}
            defaultValue={30}
            required
          />
          <TextField
            id="p-new"
            name="price"
            label="Price ($)"
            inputMode="decimal"
            helper="Blank: ask for a price"
          />
          <div className="sm:col-span-3">
            <TextField
              id="x-new"
              name="description"
              label="Description"
              maxLength={300}
            />
          </div>
          <div>
            <Button type="submit" size="sm" variant="primary">
              Add service
            </Button>
          </div>
        </form>
      </section>
    </SeatTabFrame>
  );
}
