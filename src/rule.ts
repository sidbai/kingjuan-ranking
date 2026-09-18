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

import { weightOf, type FlightLevel } from "./tier.js";

/** The home side's expected score, 0–1: the Elo expectation. */
export function expected(home: number, away: number): number {
  return 1 / (1 + 10 ** ((away - home) / 400));
}

export const RULE_VERSION = "2026-09-17p";
export const K = 45;
export const MARGIN_CAP = 3;
export const MIN_GAMES = 3;
/** What a year of age is worth in the expectation, per year the older side has. */
export const AGE_GAP = 150;
/** What playing a side a year older earns, win or lose, per game. */
export const PLAY_UP_CREDIT = 35;
/** A gap wider than this is a mislabelled team, not a brave one; and the credit stops adding up after a few games. */
export const MAX_GAP = 2;
export const MAX_CREDIT = 120;

export type Level = { label: string; prior: number };

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
export const CARRY = 0.5;

export function carriedPrior(leaguePrior: number, last: { rating: number; games: number } | undefined): number {
  if (!last || last.games < MIN_GAMES) return leaguePrior;
  return leaguePrior + CARRY * (last.rating - leaguePrior);
}
export const SELECT: Level = { label: "select", prior: 1400 };

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
export const TIER = { one: 1800, two: 1740, three: 1660, four: 1560, five: 1490, six: 1440 } as const;

export function levelOf(text: string, age: number | null = null): Level | null {
  const t = text.toLowerCase();
  const n = (re: RegExp) => { const m = t.match(re); return m ? Number(m[1]) : null; };
  const young = age !== null && age <= 12;
  if (/pre-?ecnl/.test(t)) return /flight\s*ii/.test(t) ? { label: "Pre-ECNL Flight II", prior: 1770 } : { label: "Pre-ECNL", prior: TIER.one };
  if (/ecnl\s*(rl|regional)/.test(t)) return { label: "ECNL RL", prior: TIER.three };
  if (/\becnl\b/.test(t)) return { label: "ECNL", prior: TIER.one };
  if (/aspire/.test(t)) return { label: "GA Aspire", prior: TIER.four };
  if (/girls academy|\bga\b|pre-?ga/.test(t)) return { label: "GA", prior: young ? TIER.two : TIER.three };
  if (/elite academy|\bea\b|pre-?ea/.test(t)) return { label: "EA", prior: young ? TIER.two : TIER.three };
  if (/mls\s*next/.test(t)) return { label: "MLS Next", prior: TIER.two };
  if (/\bwpl\b|washington premier league/.test(t)) {
    // The WW Dev league is U8–U10, where RCL 1 is the top of the pyramid and
    // Dev Div. 1 sits with Pre-MLS / EA at that age — its sides seed the
    // academies too (owner, 2026-09-17); the divisions step down from there.
    if (/\bdev\b/.test(t)) { const d = n(/div\.?\s*(\d)/) ?? 3; return { label: `WPL Dev ${d}`, prior: d === 1 ? TIER.two : d === 2 ? TIER.four : d === 3 ? TIER.five : d === 4 ? TIER.six : 1400 }; }
    if (/premier/.test(t)) return { label: "WPL Premier", prior: TIER.four };
    if (/classic/.test(t)) return { label: "WPL Classic", prior: TIER.five };
    if (/copa/.test(t)) return { label: "WPL Copa", prior: 1400 };
    return { label: "WPL", prior: TIER.five };
  }
  if (/\brcl\b|regional club league/.test(t)) {
    const d = n(/(?:div|rcl)\s*(\d)/) ?? 2;
    // At U10 and younger nothing sits above RCL: Division 1 is the top of
    // the pyramid there — the sides that seed the ECNL and EA teams a year
    // or two later — so it takes the top rung, and the divisions below it
    // step down from there.
    if (age !== null && age <= 10) return { label: `RCL ${d}`, prior: d === 1 ? TIER.one : d === 2 ? TIER.three : TIER.four };
    return { label: `RCL ${d}`, prior: d === 1 ? TIER.four : d === 2 ? TIER.five : TIER.six };
  }
  return null;
}

/**
 * What a league game is worth, by the league: a game in ECNL counts a
 * tenth more than one in a rung-3 league, one in RCL 1 a tenth less, a
 * Copa or Dev game three tenths less (owner, 2026-09-17: the league's
 * tier weighs its games). Read off the prior, so a new league lands on
 * the ladder once and gets its weight with it.
 */
export function leagueWeightOf(level: Level | null | undefined): number {
  const p = level?.prior ?? SELECT.prior;
  return p >= TIER.one ? 1.1 : p >= TIER.two ? 1.05 : p >= TIER.three ? 1 : p >= TIER.four ? 0.9 : p >= TIER.five ? 0.8 : 0.7;
}

/** The best of several readings — the league division wins over the name. */
export function bestLevel(candidates: (Level | null)[]): Level {
  const real = candidates.filter((l): l is Level => !!l).sort((a, b) => b.prior - a.prior);
  return real[0] ?? SELECT;
}

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
export function ageGapOf(homeYear: number | null, awayYear: number | null): number {
  if (homeYear === null || awayYear === null) return 0;
  return awayYear - homeYear;
}

/**
 * Every team's rating after these games, from the priors given, and how
 * many each played. `yearOf` is the team's oldest birth year, for the
 * play-up adjustment; null for a team with none.
 */
export function replay(games: Game[], prior: (teamId: string) => number, yearOf: (teamId: string) => number | null = () => null): Map<string, { rating: number; games: number }> {
  const out = new Map<string, { rating: number; games: number }>();
  const credited = new Map<string, number>();
  const get = (id: string) => out.get(id) ?? { rating: prior(id), games: 0 };
  const credit = (id: string, amount: number) => {
    const so = credited.get(id) ?? 0;
    const give = Math.min(amount, Math.max(0, MAX_CREDIT - so));
    credited.set(id, so + give);
    return give;
  };
  for (const g of games) {
    const h = get(g.homeTeamId);
    const a = get(g.awayTeamId);
    const w = g.kind === "league" ? (g.leagueWeight ?? 1) : weightOf(g.kind, g.level ?? null);
    // The older side is expected to win by more; the result is judged against that.
    const gap = Math.max(-MAX_GAP, Math.min(MAX_GAP, ageGapOf(yearOf(g.homeTeamId), yearOf(g.awayTeamId))));
    const e = expected(h.rating + Math.max(0, gap) * AGE_GAP, a.rating + Math.max(0, -gap) * AGE_GAP);
    const s = g.homeScore > g.awayScore ? 1 : g.homeScore === g.awayScore ? 0.5 : 0;
    // Margin pays by how surprising the result was: running up the score on a
    // side you were expected to beat is worth a 1–0; a 3–0 as the underdog
    // is worth the full √3. A draw keeps half the margin's say.
    const goals = Math.min(MARGIN_CAP, Math.max(1, Math.abs(g.homeScore - g.awayScore))) ** 0.5;
    const surprise = s === 1 ? 1 - e : s === 0 ? e : 0.5;
    const margin = 1 + (goals - 1) * surprise;
    const delta = K * w * margin * (s - e);
    // The credit for playing up goes to the younger side only; the older side's rating is not docked for it.
    const homeCredit = credit(g.homeTeamId, Math.max(0, -gap) * PLAY_UP_CREDIT * w);
    const awayCredit = credit(g.awayTeamId, Math.max(0, gap) * PLAY_UP_CREDIT * w);
    out.set(g.homeTeamId, { rating: h.rating + delta + homeCredit, games: h.games + 1 });
    out.set(g.awayTeamId, { rating: a.rating - delta + awayCredit, games: a.games + 1 });
  }
  return out;
}

/** "boys-2013" — gender and the oldest birth year; null for a team that fits no cohort. */
export function cohortOf(team: { gender: string | null; birthYears: number[] | null }): string | null {
  const years = (team.birthYears ?? []).filter((y) => y > 2000 && y < 2030);
  if (!years.length) return null;
  if (team.gender !== "boys" && team.gender !== "girls") return null;
  return `${team.gender}-${Math.min(...years)}`;
}

/** "Boys 2013/14" — what the page calls a cohort. */
export function cohortLabel(cohort: string): string {
  const [gender, year] = cohort.split("-");
  const y = Number(year);
  return `${gender === "boys" ? "Boys" : "Girls"} ${y}/${String(y + 1).slice(2)}`;
}

/**
 * The age group the cohort plays as, the way the leagues here label it: a
 * "B13/14" side plays BU13 in the season that starts in 2026, so U-N is the
 * season's starting year less the oldest birth year.
 */
export function ageGroupOf(cohort: string, seasonStart: number): string {
  return `U${seasonStart - Number(cohort.split("-")[1])}`;
}

/**
 * The rule as the page says it — one text for the site and the app, so
 * the two never explain the same numbers differently.
 */
/* Trophies — a flight's champion and runner-up earn a bonus by its tier on top of the games; see tier.ts and compute.ts. */
export const RULE_STEPS: { title: string; detail: string }[] = [
  {
    title: "Where the team plays.",
    detail:
      "The best league division it is entered in this season sets its starting point — only a league's top division carries the league's level: ECNL and Pre-ECNL; then MLS Next, and Elite Academy and Girls Academy at U11–U12; then ECNL RL, and EA and GA from U13 up; then RCL Division 1, GA Aspire and WPL Premier (and, for U8–U10, WPL Dev Div. 1); then on down division by division — RCL 2 with WPL Classic and Dev 2, RCL 3 with Dev 3. At U10 and younger, where no academy league exists, RCL Division 1 is the top of the pyramid and starts where ECNL does, and WPL Dev Div. 1 starts where Pre-MLS and EA do. A team in no league starts as select.",
  },
  {
    title: "Last season.",
    detail:
      "A rating is not thrown away on 1 May. The new season starts from that league prior plus half of where the team finished last season above or below it — a Surf Cup title worth 240 points in July is 120 the next May and 60 the year after. Half, because rosters change: what a side proved is evidence, not a title deed. A team with no ranked last season starts from its league prior alone.",
  },
  {
    title: "Results.",
    detail:
      "Every decided game this season — from May, when clubs move up to the new age groups, so the summer cups count — in order, moves both sides' ratings by how surprising the result was and by the margin — capped at three goals, and counted only as far as the result surprised, so running up the score on a side you were expected to beat is worth a 1–0. League games count by the league: ECNL and Pre-ECNL a tenth more than a game at the ECNL RL / EA / GA level, RCL 1 and WPL Premier a tenth less, RCL 2 and Classic a fifth less, RCL 3, Copa and the Dev divisions three tenths less. Tournaments count by the strength of the flight: the top flights of Surf Cup San Diego, Premier SuperCopa and Club América Cup a third more than a league game; the top flights of the strong regional cups a sixth more; premier cups as much as a league game; select cups ×0.7; rec cups half; a cup nobody has tiered ×0.6 — and each flight below a tournament's top one counts a tenth less than the top. Which flight is a tournament's top one is read from the teams entered — within an age, the flight whose teams' league levels are strongest — not from its colour, since one cup's Gold is another's second flight. A trophy means a lot, and a national one most: a flight's champion earns a bonus on top of the games — 240 points for the top flight of a national cup, 150 for a regional cup's, 80 for a premier cup's, 40 for a select cup's, 20 for a rec cup's, and 20 for a cup nobody has tiered (10 for its bottom flights); each flight below the top earns a fifth less of that, down to a fifth — Surf Cup's Super Black 192, its Super White 144, its Black 96 — and the runner-up half. One trophy per event: the final where there is one, the table where there is not.",
  },
  {
    title: "Who it was against.",
    detail:
      "Beating a higher-rated side pays more. Playing up counts on top, twice: a side a year older is expected to win by another hundred and fifty points' worth, so beating it pays more and losing to it costs less; and every game against an older side earns a credit whatever the result, because it is the strongest teams that choose to play up.",
  },
  {
    title: "Enough games.",
    detail: "Three decided games to be ranked at all; a team with fewer than five is marked provisional.",
  },
];

export const RULE_NOTE =
  "A cohort is a gender and the oldest birth year on the team, so a \u201cB13/14\u201d side ranks with the 2013s \u2014 U13 this season, the way the leagues label it. Only Washington clubs\u2019 own teams are listed \u2014 not a training group or a travel side put together for one cup, and not an appearance nobody has linked to a club team yet; games against all of them still count.";
