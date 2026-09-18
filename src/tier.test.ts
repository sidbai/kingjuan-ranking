import { describe, expect, it } from "vitest";

import { divisionTier, flightLevel, flightStep, honourBonus, weightOf } from "./tier.js";

describe("flightStep", () => {
  it("reads Surf Cup's flights", () => {
    expect(flightStep("Boys-U19 - Best of the Best")).toBe(0);
    // Super Black and Super White sit below Best of the Best, not beside it.
    expect(flightStep("Boys-U19 - Super Black")).toBe(1);
    expect(flightStep("Girls-U17 - Super White")).toBe(1);
    expect(flightStep("Girls-U12 - Best of the NW")).toBe(0);
    expect(flightStep("Boys-U19 - Black")).toBe(1);
    expect(flightStep("Girls-U19 - White")).toBe(1);
    expect(flightStep("Boys-U19 - Blue")).toBe(2);
    expect(flightStep("Boys-U19 - Grey")).toBe(2);
  });
  it("reads a local cup's premier / select / bronze, and numbered divisions", () => {
    expect(flightStep("BU12 Premier")).toBe(0);
    expect(flightStep("BU12 Gold")).toBe(0);
    expect(flightStep("BU12 Select")).toBe(1);
    expect(flightStep("BU12 Silver")).toBe(1);
    expect(flightStep("BU12 Bronze")).toBe(2);
    expect(flightStep("GU10 Rec")).toBe(2);
    expect(flightStep("BU13 Div 1")).toBe(0);
    expect(flightStep("BU13 Division 2")).toBe(1);
    expect(flightStep("BU13 Div 3")).toBe(2);
  });
  it("takes a plain name as the top flight", () => {
    expect(flightStep("U12 Boys")).toBe(0);
    expect(flightStep(null)).toBe(0);
  });
});

describe("divisionTier", () => {
  it("reads every flight of a regional cup as regional, each with its place", () => {
    expect(divisionTier(2, "BU12 Premier")).toBe(2);
    expect(divisionTier(2, "BU12 Select")).toBe(2);
    expect(flightLevel(2, "BU12 Bronze")).toEqual({ tier: 2, step: 2 });
  });
  it("keeps every flight at the tournament's tier, with its place from the top; an admin's word is that tier's top flight", () => {
    expect(flightLevel(1, "Boys-U19 - Best of the Best")).toEqual({ tier: 1, step: 0 });
    expect(flightLevel(1, "Boys-U19 - Super Black")).toEqual({ tier: 1, step: 1 });
    expect(flightLevel(1, null, null, 3)).toEqual({ tier: 1, step: 3 });
    expect(flightLevel(2, "BU13 Blue", 4)).toEqual({ tier: 4, step: 0 });
    expect(divisionTier(2, null, null, 3)).toBe(2);
  });
  it("ranks an age's flights by name when the data is thin — Surf's colours in order, a local cup's Gold / Silver / Bronze", async () => {
    const { orderFlights } = await import("./tier.js");
    const surf = orderFlights(["Best of the Best", "Super Black", "Super White", "Black", "White", "Blue", "Grey"].map((n) => ({ id: n, name: `Boys-U13 - ${n}`, priors: [] })));
    expect(["Best of the Best", "Super Black", "Super White", "Black", "White", "Blue", "Grey"].map((n) => surf.get(n)!.step)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    const local = orderFlights(["Gold", "Silver", "Bronze"].map((n) => ({ id: n, name: `Boys U13 ${n}`, priors: [] })));
    expect(["Gold", "Silver", "Bronze"].map((n) => local.get(n)!.step)).toEqual([0, 1, 2]);
    // Two flights sharing a name rank share a place; a gap in the names is not a gap in the places.
    const efc = orderFlights(["Red", "White", "Blue", "Grey"].map((n) => ({ id: n, name: `BU13 - BU13 ${n}`, priors: [] })));
    expect(["Red", "White", "Blue", "Grey"].map((n) => efc.get(n)!.step)).toEqual([0, 1, 2, 3]);
    const two = orderFlights(["Red", "Blue"].map((n) => ({ id: n, name: `BU14 - BU14 ${n}`, priors: [] })));
    expect([two.get("Red")!.step, two.get("Blue")!.step]).toEqual([0, 1]);
    // A Championships division holds the finals and stands outside the order; numbered flights order within a colour.
    const sf = orderFlights(["Black", "White", "Championships"].map((n) => ({ id: n, name: `Boys U13 ${n}`, priors: [] })));
    expect(["Black", "White", "Championships"].map((n) => sf.get(n)!.step)).toEqual([0, 1, 0]);
    const zf = orderFlights(["Silver 1", "Silver 2", "Bronze"].map((n) => ({ id: n, name: `Girls-U13 - ${n}`, priors: [] })));
    expect(["Silver 1", "Silver 2", "Bronze"].map((n) => zf.get(n)!.step)).toEqual([0, 1, 2]);
  });
  it("takes an admin's word for a flight, and nothing for an untiered event", () => {
    expect(divisionTier(4, "BU12 Gold")).toBe(4);
    expect(divisionTier(5, "BU12 Gold")).toBe(5);
    expect(divisionTier(3, "GU10 Rec", 2)).toBe(2);
    expect(divisionTier(3, "GU10 Rec", 5)).toBe(5);
    expect(divisionTier(null, "BU12 Premier")).toBeNull();
    expect(divisionTier(null, "BU12 Premier", 1)).toBe(1);
  });
});

const L = (tier: 1 | 2 | 3 | 4 | 5, step = 0) => ({ tier, step });

describe("weightOf", () => {
  it("puts a strong tournament above a league game and a weak one below, and takes a tenth off per flight down", () => {
    expect(weightOf("tournament", L(1))).toBeGreaterThan(weightOf("league", null));
    expect(weightOf("tournament", L(2))).toBeGreaterThan(weightOf("league", null));
    expect(weightOf("tournament", L(3))).toBe(weightOf("league", null));
    expect(weightOf("tournament", L(4))).toBeLessThan(weightOf("league", null));
    expect(weightOf("tournament", null)).toBe(0.6);
    expect(weightOf("tournament", L(4))).toBeGreaterThan(weightOf("tournament", null));
    expect(weightOf("tournament", null)).toBeGreaterThan(weightOf("tournament", L(5)));
    expect(weightOf("friendly", null)).toBe(0.6);
    expect(weightOf("tournament", L(1, 1))).toBeCloseTo(1.215, 6);
    expect(weightOf("tournament", L(1, 2))).toBeCloseTo(1.08, 6);
    // Never below a rec cup's weight, however far down.
    expect(weightOf("tournament", L(1, 9))).toBe(0.5);
    expect(weightOf("tournament", L(5, 3))).toBe(0.5);
  });
});

describe("honourBonus", () => {
  it("pays a champion by the flight's tier, a fifth less per flight down to a fifth, a runner-up half, an untiered cup as rec", () => {
    expect(honourBonus("champion", L(1))).toBe(240);
    expect(honourBonus("runner-up", L(1))).toBe(120);
    expect(honourBonus("champion", L(2))).toBe(150);
    expect(honourBonus("champion", L(3))).toBe(80);
    expect(honourBonus("champion", L(4))).toBe(40);
    expect(honourBonus("champion", L(5))).toBe(20);
    // Surf Cup's flights: Best of the Best 240, Super Black 192, Super White 144, Black 96, White 48, Blue 48.
    expect([0, 1, 2, 3, 4, 5].map((step) => honourBonus("champion", L(1, step)))).toEqual([240, 192, 144, 96, 48, 48]);
    expect(honourBonus("runner-up", L(1, 1))).toBe(96);
    expect(honourBonus("champion", null)).toBe(20);
    expect(honourBonus("champion", null, "Boys U13 Gold")).toBe(20);
    expect(honourBonus("champion", null, "Boys U13 Bronze")).toBe(10);
    expect(honourBonus("runner-up", null)).toBe(10);
  });
});
