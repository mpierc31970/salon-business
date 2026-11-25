import { describe, expect, it } from "vitest";
import { repointIds } from "./repoint-ids";

describe("repointIds", () => {
  const map = new Map([["kx55nyojqkzre68", "newlogo00000001"]]);

  it("re-points nested asset ids and URLs", () => {
    expect(
      repointIds(
        {
          columns: [{ items: [{ kind: "image", asset: "kx55nyojqkzre68" }] }],
          url: "/_media/kx55nyojqkzre68/web.webp",
        },
        map,
      ),
    ).toEqual({
      columns: [{ items: [{ kind: "image", asset: "newlogo00000001" }] }],
      url: "/_media/newlogo00000001/web.webp",
    });
  });

  it("returns null when no id appears", () => {
    expect(repointIds({ asset: "other" }, map)).toBeNull();
  });
});
