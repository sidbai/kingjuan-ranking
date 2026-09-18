import type { RankedHonour, RankedResult } from "./types.js";
/**
 * Why a team sits where it does, in a sentence or two a parent can check
 * against the results — the shape of the analysis the owner asked for:
 * where it plays, its record, the wins that count, the losses and to whom.
 */
export type ReasonInput = {
    level: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number;
    ga: number;
    bestWins: RankedResult[];
    losses: RankedResult[];
    /** Whether the schedule was thin: few games, or all at select level. */
    tieredOpponents: number;
    /** What last season added to the prior, when it had one. */
    carried?: number | null;
};
export declare function reasonFor(i: ReasonInput): string;
/**
 * The same reason as points a page can list — one line each, labelled, so
 * a parent reading a rank box sees where the team plays, what it has done,
 * who it beat and who it lost to, without parsing a paragraph.
 *
 * Read from what the row stores (it carries the cited results), so the
 * page and the API agree; the paragraph above stays for anything that
 * wants one line.
 */
export type ReasonPoint = {
    label: string;
    text: string;
};
export declare function reasonPoints(i: Omit<ReasonInput, "tieredOpponents"> & {
    league?: string | null;
    tieredOpponents?: number;
    honours?: RankedHonour[];
    prior?: number;
    carried?: number | null;
}): ReasonPoint[];
