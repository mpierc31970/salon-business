// /services (the salon menu) and the /book header order for a chosen stylist.
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  listPublicMenu: vi.fn(),
  listPublicSeats: vi.fn(),
  publicAvailability: vi.fn(),
}));
vi.mock("@cds/db", () => db);
vi.mock("../lib/tenant", () => ({
  siteForRequest: async () => ({ orgId: "org1" }),
}));

const { default: ServicesPage } =
  await import("../app/tenant/[host]/services/page");
const { groupServices } = await import("../app/tenant/[host]/services/groups");
const { default: BookPage } = await import("../app/tenant/[host]/book/page");

const svc = (id: string, name: string) => ({
  id,
  name,
  description: "",
  durationMinutes: 60,
  priceCents: 10000,
});
const params = Promise.resolve({ host: "salon.test" });

describe("/services", () => {
  beforeEach(() => vi.clearAllMocks());

  it("groups the menu under its photos; bridal makeup is makeup", () => {
    const groups = groupServices([
      svc("a", "Signature cut and finish"),
      svc("b", "Bridal makeup"),
      svc("c", "Bridal trial"),
      svc("d", "Mystery treatment"),
    ]);
    expect(groups.map((g) => [g.key, g.services.map((s) => s.id)])).toEqual([
      ["cut", ["a"]],
      ["bridal", ["c"]],
      ["makeup", ["b"]],
      ["more", ["d"]],
    ]);
    expect(groups[0]!.photo).toBe("/am-barber/services/cut-finish.webp");
    expect(groups[3]!.photo).toBeNull();
  });

  it("renders the owner's menu with prices and a booking link", async () => {
    db.listPublicMenu.mockResolvedValue([svc("a", "Creative color")]);
    const html = renderToStaticMarkup(
      (await ServicesPage({ params })) as ReactElement,
    );
    expect(html).toContain("Creative color");
    expect(html).toContain("$100");
    expect(html).toContain("/am-barber/services/balayage.webp");
    expect(html).toContain('href="/team"');
  });

  it("a failed read is the empty state, not a 500", async () => {
    db.listPublicMenu.mockRejectedValue(new Error("down"));
    const html = renderToStaticMarkup(
      (await ServicesPage({ params })) as ReactElement,
    );
    expect(html).toContain("Our menu will be listed here soon");
  });
});

describe("/book header with a chosen stylist", () => {
  it("Back to list, Book with, 1. Your stylist, then avatar + View profile", async () => {
    db.listPublicSeats.mockResolvedValue([
      {
        id: "s1",
        slug: "ava",
        name: "Ava",
        headline: "",
        bio: "",
        photo: "phaaaaaaaaaaaaa",
        services: [],
      },
    ]);
    const html = renderToStaticMarkup(
      (await BookPage({
        params,
        searchParams: Promise.resolve({ barber: "ava" }),
      })) as ReactElement,
    );
    const at = (s: string) => {
      const i = html.indexOf(s);
      expect(i, s).toBeGreaterThan(-1);
      return i;
    };
    const order = [
      at("Back to list"),
      at("Book with Ava"),
      at("1. Your stylist"),
      at("data-avatar"),
      at("View profile"),
    ];
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain('href="/team/ava"');
    expect(html).toMatch(/<img[^>]*rounded-full/);
  });
});
