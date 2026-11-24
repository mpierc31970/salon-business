import { describe, expect, it } from "vitest";
import { SALON_ADDRESS, scrubContact } from "./contact-scrub";

describe("scrubContact", () => {
  it("replaces the old address, drops phone buttons, rebooks the CTA", () => {
    const out = scrubContact({
      columns: [
        {
          items: [
            { kind: "text", html: "<p>2505 S Carrier Pkwy, Grand Prairie</p>" },
            { kind: "button", text: "(214) 518-6852", link: "tel:2145186852" },
            { kind: "button", text: "Email", link: "mailto:a@b.c" },
          ],
        },
      ],
      faq: "<p>Call us at (214) 518-6852, or send a message.</p>",
      button_text: "Call (214) 518-6852",
      button_link: "tel:2145186852",
    });
    expect(out).toEqual({
      columns: [
        {
          items: [
            { kind: "text", html: `<p>${SALON_ADDRESS}</p>` },
            { kind: "button", text: "Email", link: "mailto:a@b.c" },
          ],
        },
      ],
      faq: "<p>Email us at matthew@metaphysicalevents.com, or send a message.</p>",
      button_text: "Book now",
      button_link: "/team",
    });
    expect(JSON.stringify(out)).not.toMatch(/Carrier|6852|tel:/);
  });

  it("returns null when nothing changes", () => {
    expect(scrubContact({ heading: "Hours", items: [] })).toBeNull();
  });
});
