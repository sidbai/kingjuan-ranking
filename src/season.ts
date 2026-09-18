/**
 * A season, rated: the priors given, an Elo replay of the games in order,
 * then the trophies. This is the whole arithmetic between "here are the
 * games" and "here are the ratings" — the site does the reading (which
 * league each team is in, which flight is a tournament's top one, who won
 * which final) and hands this the answers, so a change to the rule can be
 * judged on a fixture file with no database in sight.
 */

import { carriedPrior, replay, SELECT, type Game, type Level } from "./rule.js";
import { honourBonus, type FlightLevel } from "./tier.js";
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
  last?: { rating: number; games: number } | null;
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

export type Rated = { rating: number; games: number };

export type SeasonOutput = {
  /** Where each team started: its league prior plus what it carried. */
  prior: Map<string, number>;
  /** Every team's rating after the games and the trophies, and how many it played. */
  rated: Map<string, Rated>;
  /** The trophies, priced. */
  honours: Map<string, RankedHonour[]>;
};

export function rateSeason(input: SeasonInput): SeasonOutput {
  const team = new Map(input.teams.map((t) => [t.id, t]));
  const prior = new Map(input.teams.map((t) => [t.id, carriedPrior(t.level.prior, t.last ?? undefined)]));
  const yearOf = (id: string) => team.get(id)?.year ?? null;
  const rated = replay(input.games, (id) => prior.get(id) ?? SELECT.prior, yearOf);

  // One trophy per team per event: the site hands over one, and the first stands.
  const honours = new Map<string, RankedHonour[]>();
  const placedAt = new Set<string>();
  for (const h of input.honours) {
    const at = `${h.teamId}::${h.eventId ?? h.event}`;
    if (placedAt.has(at)) continue;
    placedAt.add(at);
    const bonus = honourBonus(h.place, h.level, h.division);
    const r = rated.get(h.teamId);
    if (r) rated.set(h.teamId, { ...r, rating: r.rating + bonus });
    (honours.get(h.teamId) ?? honours.set(h.teamId, []).get(h.teamId)!).push({ event: h.event, division: h.division, place: h.place, tier: h.level?.tier ?? null, bonus });
  }
  return { prior, rated, honours };
}

/**
 * The cohorts' tables: the listed teams with enough games, best first,
 * cut to `top`. What the site's rankings page shows, and what a change
 * to the rule is judged by.
 */
export function rankCohorts(input: SeasonInput, out: SeasonOutput, { top = 50, minGames = 3 }: { top?: number; minGames?: number } = {}): Map<string, { id: string; rating: number; games: number }[]> {
  const cohorts = new Map<string, { id: string; rating: number; games: number }[]>();
  for (const t of input.teams) {
    const r = out.rated.get(t.id);
    if (!t.listed || !t.cohort || !r || r.games < minGames) continue;
    (cohorts.get(t.cohort) ?? cohorts.set(t.cohort, []).get(t.cohort)!).push({ id: t.id, rating: r.rating, games: r.games });
  }
  for (const [c, rows] of cohorts) cohorts.set(c, rows.sort((a, b) => b.rating - a.rating).slice(0, top));
  return new Map([...cohorts].sort(([a], [b]) => a.localeCompare(b)));
}
