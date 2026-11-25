import { describe, expect, it } from "vitest";
import { numericGetsSafe } from "./LocationMap";

const MAX = Number.MAX_SAFE_INTEGER;

describe("numericGetsSafe", () => {
  it("coalesces a compared property so a missing value stays false without a warning", () => {
    // Positron's road shield filter, the source of "Expected value to be of type number".
    const f = [
      "all",
      ["<=", ["get", "ref_length"], 6],
      ["match", ["get", "network"], ["us-highway"], true, false],
    ];
    expect(numericGetsSafe(f)).toEqual([
      "all",
      ["<=", ["coalesce", ["get", "ref_length"], MAX], 6],
      ["match", ["get", "network"], ["us-highway"], true, false],
    ]);
  });

  it("picks the fallback that fails the comparison on either side", () => {
    expect(numericGetsSafe([">=", ["get", "rank"], 3])).toEqual([
      ">=",
      ["coalesce", ["get", "rank"], -MAX],
      3,
    ]);
    expect(numericGetsSafe(["<", 3, ["get", "rank"]])).toEqual([
      "<",
      3,
      ["coalesce", ["get", "rank"], -MAX],
    ]);
  });

  it("leaves equality and non-arrays alone", () => {
    const eq = ["==", ["get", "rank"], 1];
    expect(numericGetsSafe(eq)).toEqual(eq);
    expect(numericGetsSafe("x")).toBe("x");
  });
});
