import { describe, expect, it } from "vitest";

import { reasonFor } from "./reason.js";

const win = { score: "3–1", opponent: "Columbia Premier", opponentSlug: "cp", level: "ECNL", rating: 1650, event: "Cup" };
const loss = { score: "2–3", opponent: "Wenatchee FA", opponentSlug: "w", level: "ECNL RL", rating: 1686, event: "Cup" };

describe("reasonFor", () => {
  it("says the level, the record, the wins that count and the losses", () => {
    const r = reasonFor({ level: "ECNL", played: 10, won: 7, drawn: 1, lost: 2, gf: 31, ga: 14, bestWins: [win], losses: [loss], tieredOpponents: 8 });
    expect(r).toBe("ECNL level; 7-1-2, 31–14 in 10 games. Best: 3–1 Columbia Premier (ECNL). Lost 2–3 Wenatchee FA (ECNL RL).");
  });
  it("flags a thin schedule", () => {
    expect(reasonFor({ level: "select", played: 3, won: 3, drawn: 0, lost: 0, gf: 9, ga: 1, bestWins: [win], losses: [], tieredOpponents: 0 })).toMatch(/Unbeaten\. Only 3 games — provisional\./);
    expect(reasonFor({ level: "select", played: 7, won: 7, drawn: 0, lost: 0, gf: 45, ga: 3, bestWins: [win], losses: [], tieredOpponents: 0 })).toMatch(/rests on volume/);
  });
});
