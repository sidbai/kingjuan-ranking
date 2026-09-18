import { describe, expect, it } from "vitest";

import { ageGapOf, ageGroupOf, bestLevel, cohortLabel, cohortOf, levelOf, MAX_CREDIT, PLAY_UP_CREDIT, replay, SELECT } from "./rule.js";

describe("levelOf", () => {
  it("reads the ladder from a league division", () => {
    expect(levelOf("ECNL League - Northwest Conference BU13 - ECNL")?.label).toBe("ECNL");
    expect(levelOf("ECNL RL League - Northwest Conference BU13 - ECNL Regional League")?.label).toBe("ECNL RL");
    expect(levelOf("Pre-ECNL League - Northwest Conference BU12 - Flight I")?.prior).toBe(1800);
    expect(levelOf("Elite Academy 2026 - PacNW U13 EA PACNW")?.label).toBe("EA");
    expect(levelOf("Girls Academy 2026 - PacNW GU14 Pacific-Northwest")?.label).toBe("GA");
    expect(levelOf("GA ASPIRE 2026 - PacNW GU14 Pacific Northwest")?.prior).toBe(1560);
    expect(levelOf("MLS NEXT Academy Division 2026-27 — Pacific Northwest U13 MLS Next AD")?.prior).toBe(1740);
  });
  it("puts EA and GA a rung higher at U11 and U12, where nothing fields that age above them", () => {
    expect(levelOf("Elite Academy 2026 - PacNW U12 EA PACNW", 12)?.prior).toBe(1740);
    expect(levelOf("Elite Academy 2026 - PacNW U13 EA PACNW", 13)?.prior).toBe(1660);
    expect(levelOf("Girls Academy 2026 - PacNW GU11 Pacific-Northwest", 11)?.prior).toBe(1740);
    expect(levelOf("Girls Academy 2026 - PacNW GU14 Pacific-Northwest", 14)?.prior).toBe(1660);
    // Without an age they read as U13 and up; and the age changes nothing else.
    expect(levelOf("Elite Academy 2026 - PacNW U12 EA PACNW")?.prior).toBe(1660);
    expect(levelOf("ECNL RL League BU12 - ECNL Regional League", 12)?.prior).toBe(1660);
    expect(levelOf("MLS NEXT Academy Division U13 MLS Next AD", 12)?.prior).toBe(1740);
  });
  it("only the top division carries the league's level", () => {
    expect(levelOf("RCL BU13 Div 1")?.prior).toBe(1560);
    // U10 and younger: nothing sits above RCL, so Division 1 is the top rung there.
    expect(levelOf("RCL BU10 Div 1", 10)?.prior).toBe(1800);
    expect(levelOf("RCL BU09 Div 2 North", 9)?.prior).toBe(1660);
    expect(levelOf("RCL BU08 Div 3 South", 8)?.prior).toBe(1560);
    expect(levelOf("RCL BU11 Div 1", 11)?.prior).toBe(1560);
    expect(levelOf("RCL BU13 Div 2 North")?.prior).toBe(1490);
    expect(levelOf("RCL BU13 Div 3 South")?.prior).toBe(1440);
    // WPL Premier is its division 1 and sits with RCL 1; Classic with RCL 2; Dev 1 with RCL 3.
    expect(levelOf("WPL 2026 Fall U11–U14 BU12 Premier 1")?.prior).toBe(1560);
    expect(levelOf("WPL 2026 Fall U11–U14 BU12 Classic 1 West")?.prior).toBe(1490);
    expect(levelOf("WPL 2026 Fall U11–U14 BU12 Copa 2 East")?.prior).toBe(1400);
    // WW Dev is the U8–U10 league: Div. 1 seeds the academies and sits with Pre-MLS / EA; the rest step down.
    expect(levelOf("WPL 2026 Fall WW Dev WPL Dev B Div. 1 Blue")?.prior).toBe(1740);
    expect(levelOf("WPL 2026 Fall WW Dev WPL Dev BU10 Div. 2")?.prior).toBe(1560);
    expect(levelOf("WPL 2026 Fall WW Dev WPL Dev BU10 Div. 3")?.prior).toBe(1490);
    expect(levelOf("WPL 2026 Fall WW Dev WPL Dev BU9 Div. 5")?.prior).toBe(1400);
  });
  it("reads a name too, and says nothing for a plain one", () => {
    expect(levelOf("XF B13/14 ECNL 1")?.label).toBe("ECNL");
    expect(levelOf("XF B16/17 RCL 3")?.label).toBe("RCL 3");
    expect(levelOf("Arctic Wolves")).toBeNull();
    expect(bestLevel([null, levelOf("XF B14/15 RCL 1"), levelOf("Pre-ECNL League BU13 - Flight I")]).label).toBe("Pre-ECNL");
    expect(bestLevel([null])).toBe(SELECT);
  });
});

describe("replay", () => {
  it("weights a tournament less than a league and caps a rout", () => {
    const prior = () => 1500;
    const league = replay([{ homeTeamId: "a", awayTeamId: "b", homeScore: 5, awayScore: 0, kind: "league" }], prior);
    const cup = replay([{ homeTeamId: "a", awayTeamId: "b", homeScore: 5, awayScore: 0, kind: "tournament" }], prior);
    const rout = replay([{ homeTeamId: "a", awayTeamId: "b", homeScore: 11, awayScore: 0, kind: "league" }], prior);
    expect(league.get("a")!.rating).toBeGreaterThan(cup.get("a")!.rating);
    expect(rout.get("a")!.rating).toBeCloseTo(league.get("a")!.rating, 6);
    expect(league.get("a")!.games).toBe(1);
  });
  it("pays more for beating a higher-rated side", () => {
    const strong = replay([{ homeTeamId: "a", awayTeamId: "b", homeScore: 1, awayScore: 0, kind: "league" }], (id) => (id === "b" ? 1700 : 1500));
    const weak = replay([{ homeTeamId: "a", awayTeamId: "b", homeScore: 1, awayScore: 0, kind: "league" }], (id) => (id === "b" ? 1300 : 1500));
    expect(strong.get("a")!.rating).toBeGreaterThan(weak.get("a")!.rating);
  });
});

describe("playing up", () => {
  const game = { homeTeamId: "young", awayTeamId: "old", homeScore: 0, awayScore: 1, kind: "league" };
  const prior = () => 1500;
  it("costs less to lose to an older side, and pays more to beat one", () => {
    const flat = replay([game], prior);
    const up = replay([game], prior, (id) => (id === "young" ? 2014 : 2013));
    expect(up.get("young")!.rating).toBeGreaterThan(flat.get("young")!.rating);
    const winFlat = replay([{ ...game, homeScore: 2, awayScore: 0 }], prior);
    const winUp = replay([{ ...game, homeScore: 2, awayScore: 0 }], prior, (id) => (id === "young" ? 2014 : 2013));
    expect(winUp.get("young")!.rating).toBeGreaterThan(winFlat.get("young")!.rating);
  });
  const draw = { homeTeamId: "young", awayTeamId: "old", homeScore: 1, awayScore: 1, kind: "league" };
  it("credits the younger side for the game itself, and not the older one", () => {
    const flat = replay([draw], prior);
    const up = replay([draw], prior, (id) => (id === "young" ? 2014 : 2013));
    expect(up.get("young")!.rating - flat.get("young")!.rating).toBeGreaterThan(10);
    // The older side gains nothing from the credit; its change is the expectation's alone.
    expect(up.get("old")!.rating + up.get("young")!.rating - 3000).toBeCloseTo(PLAY_UP_CREDIT, 6);
  });
  it("stops the credit adding up past a few games, and reads a wide gap as a label error", () => {
    const many = Array.from({ length: 10 }, () => draw);
    const up = replay(many, prior, (id) => (id === "young" ? 2014 : 2013));
    expect(up.get("old")!.rating + up.get("young")!.rating - 3000).toBeCloseTo(MAX_CREDIT, 6);
    const wide = replay([draw], prior, (id) => (id === "young" ? 2016 : 2010));
    const two = replay([draw], prior, (id) => (id === "young" ? 2015 : 2013));
    expect(wide.get("young")!.rating).toBeCloseTo(two.get("young")!.rating, 6);
  });
  it("reads the gap from birth years, either way round", () => {
    expect(ageGapOf(2013, 2014)).toBe(1);
    expect(ageGapOf(2014, 2013)).toBe(-1);
    expect(ageGapOf(null, 2013)).toBe(0);
  });
});

describe("cohorts", () => {
  it("is the gender and the oldest birth year", () => {
    expect(cohortOf({ gender: "boys", birthYears: [2014, 2013] })).toBe("boys-2013");
    expect(cohortOf({ gender: "coed", birthYears: [2013] })).toBeNull();
    expect(cohortOf({ gender: "girls", birthYears: [] })).toBeNull();
    expect(cohortLabel("boys-2013")).toBe("Boys 2013/14");
    expect(ageGroupOf("boys-2013", 2026)).toBe("U13");
    expect(ageGroupOf("girls-2016", 2026)).toBe("U10");
  });
});

describe("carriedPrior", () => {
  it("keeps half of last season's gap, and nothing from a season too short to rank", async () => {
    const { carriedPrior } = await import("./rule.js");
    expect(carriedPrior(1680, { rating: 2240, games: 20 })).toBe(1960);
    expect(carriedPrior(1680, { rating: 1480, games: 8 })).toBe(1580);
    expect(carriedPrior(1680, { rating: 2240, games: 2 })).toBe(1680);
    expect(carriedPrior(1680, undefined)).toBe(1680);
  });
});

describe("the replay's margin and the league's weight", () => {
  it("pays a blowout only as far as it surprised, and weighs a league game by its league", async () => {
    const { replay, leagueWeightOf, levelOf, K } = await import("./rule.js");
    const one = (home: number, away: number, score: [number, number], leagueWeight = 1) =>
      replay([{ homeTeamId: "h", awayTeamId: "a", homeScore: score[0], awayScore: score[1], kind: "league", leagueWeight }], (id) => (id === "h" ? home : away)).get("h")!.rating - home;
    // Equal sides: a 3–0 pays more than a 1–0, but less than √3 times.
    expect(one(1600, 1600, [1, 0])).toBeCloseTo(K * 0.5, 6);
    expect(one(1600, 1600, [3, 0])).toBeCloseTo(K * 0.5 * (1 + (Math.sqrt(3) - 1) * 0.5), 6);
    // A heavy favourite's 7–1 is worth about its 1–0: the margin is capped at three and the surprise is small.
    expect(one(1900, 1400, [7, 1]) / one(1900, 1400, [1, 0])).toBeLessThan(1.1);
    // The underdog's 3–0 keeps the whole margin.
    expect(one(1400, 1900, [3, 0]) / one(1400, 1900, [1, 0])).toBeGreaterThan(1.6);
    // The league's weight scales the game.
    expect(one(1600, 1600, [1, 0], 0.7)).toBeCloseTo(K * 0.5 * 0.7, 6);
    expect(leagueWeightOf(levelOf("ECNL League BU13 - ECNL"))).toBe(1.1);
    expect(leagueWeightOf(levelOf("RCL BU13 Div 1"))).toBe(0.9);
    expect(leagueWeightOf(levelOf("WPL 2026 Fall U11–U14 BU12 Copa 2 East"))).toBe(0.7);
    expect(leagueWeightOf(null)).toBe(0.7);
  });
});
