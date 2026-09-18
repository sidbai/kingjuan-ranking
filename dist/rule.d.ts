/**
 * The ranking rule, in one place and pure.
 *
 * 1. Prior — where the team plays. The best league DIVISION it is entered in
 *    this season sets its starting rating; only a league's top flight carries
 *    the league's level, and for EA and GA the rung depends on the age (see
 *    levelOf). A team in no league starts as "select". Then last season:
 *    half of where the team finished above or below that prior carries over
 *    (CARRY), so a rating fades across seasons rather than resetting.
 * 2. Results — an Elo replay in kickoff order. Margin counts as √margin,
 *    capped at three, and only as far as the result surprised: a blowout
 *    of a side you were expected to beat is worth a 1–0. A league game
 *    counts by its league (leagueWeightOf, ECNL ×1.1 down to Copa ×0.7);
 *    a tournament by the tier of its flight (tier.ts) — a Surf Cup
 *    Best of the Best game a third more than a league game, a rec flight
 *    less; an untiered tournament at 0.6, anything else at 0.6. Then the
 *    trophies: a flight's champion earns a bonus by the flight's tier —
 *    240 for a national top flight, 120 regional, 60 select, 30 rec, and
 *    20 for an untiered cup — once per
 *    event, and the runner-up half. A Surf Cup San Diego title is worth
 *    most of a season on its own.
 * 3. Opponent — the opponent's rating at the time, so beating a higher-level
 *    side pays more. Playing up counts on top, twice: a side a year older is
 *    expected to win by another hundred and fifty points' worth, so beating
 *    it pays more and losing to it costs less; and every game against an
 *    older side earns a credit whatever the result, because it is the
 *    strongest teams that choose to play up. Two years older, twice both.
 * 4. Confidence — three decided games to be ranked at all.
 *
 * This ranks a cohort and starts everyone where their league puts them;
 * the site's fixture forecast is a different model (it starts everyone
 * equal) and is not part of this package.
 */
import { type FlightLevel } from "./tier.js";
/** The home side's expected score, 0–1: the Elo expectation. */
export declare function expected(home: number, away: number): number;
export declare const RULE_VERSION = "2026-09-17p";
/** Where the rule lives, for a page that explains it to say so: anyone can read it, run it on the season's games, and propose a change. */
export declare const RULE_SOURCE = "https://github.com/sidbai/kingjuan-ranking";
export declare const K = 45;
export declare const MARGIN_CAP = 3;
export declare const MIN_GAMES = 3;
/** What a year of age is worth in the expectation, per year the older side has. */
export declare const AGE_GAP = 150;
/** What playing a side a year older earns, win or lose, per game. */
export declare const PLAY_UP_CREDIT = 35;
/** A gap wider than this is a mislabelled team, not a brave one; and the credit stops adding up after a few games. */
export declare const MAX_GAP = 2;
export declare const MAX_CREDIT = 120;
export type Level = {
    label: string;
    prior: number;
};
/**
 * How much of last season a team keeps. Its rating is not thrown away on
 * 1 May: the new season starts from the league prior plus half of what
 * last season put the team above or below that prior — a Surf Cup title
 * worth +240 in July is +120 the next May and +60 the year after. Half,
 * because rosters turn over: what a side proved is evidence, not a title
 * deed (owner, 2026-09-17: continue a team's history, and let the others
 * catch up). A team that was not ranked last season — fewer than three
 * games, or new — starts from its league prior alone.
 */
export declare const CARRY = 0.5;
export declare function carriedPrior(leaguePrior: number, last: {
    rating: number;
    games: number;
} | undefined): number;
export declare const SELECT: Level;
/**
 * The ladder, as the owner ranks it (2026-09-15):
 *
 *   1. ECNL, Pre-ECNL
 *   2. MLS Next; Elite Academy and Girls Academy at U11 and U12, where they
 *      are the top of the boys' and girls' pyramids because nothing above
 *      them fields that age
 *   3. ECNL RL; EA and GA from U13 up
 *   4. RCL Division 1, GA Aspire, WPL Premier — and WW Dev Div. 1, the
 *      top flight of the WPL's U8–U10 league, which has no Premier
 *   5. and on down, division by division: RCL 2 with WPL Classic and Dev
 *      2, RCL 3 with Dev 3, then Copa and Dev 4, then the rest
 *
 * At U10 and younger (2026-09-17) there is no ECNL, EA or GA, and RCL
 * Division 1 is the top of that pyramid — its sides seed the older
 * academy teams — so there RCL 1 takes rung 1, WPL Dev Div. 1 rung 2
 * (with Pre-MLS / EA, seeding players the same way), RCL 2 rung 3, RCL 3
 * and Dev 2 rung 4, Dev 3 rung 5, Dev 4 rung 6.
 *
 * `age` is the U-number the team plays as this season, where it is known;
 * it decides which rung EA and GA sit on. Without it they read as U13+.
 */
/**
 * Widened 2026-09-17: a rung was 40–50 points, one good weekend, and the
 * league order did not hold. Now a rung at the top is 60–100 points —
 * Pre-ECNL sits 240 above RCL 1 — so a season in a lower league has to
 * be dominant, not merely good, to reach the league above.
 */
export declare const TIER: {
    readonly one: 1800;
    readonly two: 1740;
    readonly three: 1660;
    readonly four: 1560;
    readonly five: 1490;
    readonly six: 1440;
};
export declare function levelOf(text: string, age?: number | null): Level | null;
/**
 * What a league game is worth, by the league: a game in ECNL counts a
 * tenth more than one in a rung-3 league, one in RCL 1 a tenth less, a
 * Copa or Dev game three tenths less (owner, 2026-09-17: the league's
 * tier weighs its games). Read off the prior, so a new league lands on
 * the ladder once and gets its weight with it.
 */
export declare function leagueWeightOf(level: Level | null | undefined): number;
/** The best of several readings — the league division wins over the name. */
export declare function bestLevel(candidates: (Level | null)[]): Level;
export type Game = {
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
    /** "league", "tournament", … — with the flight's level (tournaments) or the league's weight, sets the weight. */
    kind: string;
    level?: FlightLevel | null;
    /** A league game's weight, by the league (leagueWeightOf); 1 when not given. */
    leagueWeight?: number | null;
};
/** How much older the home side is than the away side, in years; 0 when either has no birth year. */
export declare function ageGapOf(homeYear: number | null, awayYear: number | null): number;
/**
 * Every team's rating after these games, from the priors given, and how
 * many each played. `yearOf` is the team's oldest birth year, for the
 * play-up adjustment; null for a team with none.
 */
export declare function replay(games: Game[], prior: (teamId: string) => number, yearOf?: (teamId: string) => number | null): Map<string, {
    rating: number;
    games: number;
}>;
/** "boys-2013" — gender and the oldest birth year; null for a team that fits no cohort. */
export declare function cohortOf(team: {
    gender: string | null;
    birthYears: number[] | null;
}): string | null;
/** "Boys 2013/14" — what the page calls a cohort. */
export declare function cohortLabel(cohort: string): string;
/**
 * The age group the cohort plays as, the way the leagues here label it: a
 * "B13/14" side plays BU13 in the season that starts in 2026, so U-N is the
 * season's starting year less the oldest birth year.
 */
export declare function ageGroupOf(cohort: string, seasonStart: number): string;
/**
 * The rule as the page says it — one text for the site and the app, so
 * the two never explain the same numbers differently.
 */
export declare const RULE_STEPS: {
    title: string;
    detail: string;
}[];
/**
 * The rule in a breath — what the site and the app show, with a link to
 * this repository for the rest. RULE_STEPS is the long form.
 */
export declare const RULE_SUMMARY = "Every team starts where its league puts it \u2014 ECNL at the top, then MLS Next, ECNL RL, EA and GA, RCL and WPL division by division \u2014 plus half of what it earned last season. Every decided game since May then moves both sides by how surprising the result was: tournament games count by the strength of the flight, a trophy adds a bonus by its tier, and playing up pays extra. Three decided games to be ranked; only Washington clubs\u2019 own teams are listed.";
export declare const RULE_NOTE = "A cohort is a gender and the oldest birth year on the team, so a \u201CB13/14\u201D side ranks with the 2013s \u2014 U13 this season, the way the leagues label it. Only Washington clubs\u2019 own teams are listed \u2014 not a training group or a travel side put together for one cup, and not an appearance nobody has linked to a club team yet; games against all of them still count.";
