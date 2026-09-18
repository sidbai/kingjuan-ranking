/**
 * What a ranking row cites, the shape the site stores and the app reads.
 * Kept here so the reason (reason.ts) and the site agree on it.
 */

/** A result the reason cites: the score, who it was against and at what level, their rating, where it was played. */
export type RankedResult = { score: string; opponent: string; opponentSlug: string | null; level: string; rating: number; event: string };

/** A trophy this season and what it was worth. */
export type RankedHonour = { event: string; division: string | null; place: "champion" | "runner-up"; tier: number | null; bonus: number };
