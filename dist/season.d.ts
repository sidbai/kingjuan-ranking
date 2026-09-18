/**
 * A season, rated: the priors given, an Elo replay of the games in order,
 * then the trophies. This is the whole arithmetic between "here are the
 * games" and "here are the ratings" — the site does the reading (which
 * league each team is in, which flight is a tournament's top one, who won
 * which final) and hands this the answers, so a change to the rule can be
 * judged on a fixture file with no database in sight.
 */
import { type Game, type Level } from "./rule.js";
import { type FlightLevel } from "./tier.js";
import type { RankedHonour } from "./types.js";
export type SeasonTeam = {
    id: string;
    name: string;
    /** "boys-2013", or null for a team that fits no cohort. */
    cohort: string | null;
    /** The oldest birth year, for the play-up adjustment; null when unknown. */
    year: number | null;
    /** Where it plays: the best league division it is entered in this season, else what its name says, else select. */
    level: Level;
    /** The league entry the level came from — "RCL 2026-27 · Boys U13 Division 1" — for the record. */
    league: string | null;
    /** What last season left it, if it was ranked then. */
    last?: {
        rating: number;
        games: number;
    } | null;
    /** Whether the site lists it — a Washington club's own team. Everyone plays in the replay; only these are ranked. */
    listed: boolean;
};
export type SeasonGame = Game & {
    /** ISO kickoff; the games come in this order. */
    kickoffAt: string;
    /** For the reason: the event's title, with the flight for a tournament. */
    event: string;
};
/** A trophy as the site read it: who placed where in which flight. The bonus is this package's to say. */
export type SeasonHonour = {
    teamId: string;
    place: "champion" | "runner-up";
    /** The event, for the record; `eventId` tells two events with one title apart. */
    event: string;
    eventId?: string;
    division: string | null;
    level: FlightLevel | null;
};
export type SeasonInput = {
    /** The season's first day, ISO — 1 May, the way the site reads a season. */
    from: string;
    teams: SeasonTeam[];
    games: SeasonGame[];
    honours: SeasonHonour[];
};
export type Rated = {
    rating: number;
    games: number;
};
export type SeasonOutput = {
    /** Where each team started: its league prior plus what it carried. */
    prior: Map<string, number>;
    /** Every team's rating after the games and the trophies, and how many it played. */
    rated: Map<string, Rated>;
    /** The trophies, priced. */
    honours: Map<string, RankedHonour[]>;
};
export declare function rateSeason(input: SeasonInput): SeasonOutput;
/**
 * The cohorts' tables: the listed teams with enough games, best first,
 * cut to `top`. What the site's rankings page shows, and what a change
 * to the rule is judged by.
 */
export declare function rankCohorts(input: SeasonInput, out: SeasonOutput, { top, minGames }?: {
    top?: number;
    minGames?: number;
}): Map<string, {
    id: string;
    rating: number;
    games: number;
}[]>;
