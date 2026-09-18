/**
 * How strong a tournament flight is, 1–5, and what that is worth.
 *
 * The owner's ladder (2026-09-16): tier 1 is Surf Cup San Diego, Premier
 * SuperCopa, Club América Cup; tier 2 the strong regional cups — Surf Cup
 * NW, EFC Cup, Rainier Challenge; tier 3 premier — the other A2E cups;
 * tier 4 select — the local cups, Starfire's; tier 5 rec — Candy Cane,
 * King Juan Cup (2026-09-17). A tournament
 * carries one tier; its flights all play at that tier, and what a flight
 * is worth — a game's weight, a title's points — comes down a fixed step
 * for each place below the top (owner, 2026-09-17: the points descend
 * linearly, not the tier). Which flight is which comes from the teams
 * entered (orderFlights), else the name.
 *
 * A result in a strong flight moves a rating more than a league game; a
 * weak flight, less. It does not move where a team starts — that stays
 * the league's to say (rule.ts).
 *
 * Pure, so the admin page, the ranking and the API read one rule.
 */
export type Tier = 1 | 2 | 3 | 4 | 5;
/**
 * What a game in each tier is worth, against a league game at 1. A
 * premier cup's games count as league games do, a select cup's well
 * under, a rec cup's half (owner, 2026-09-17), and a cup nobody has
 * tiered sits between select and rec.
 */
export declare const TIER_WEIGHT: Record<Tier, number>;
export declare const UNTIERED_TOURNAMENT = 0.6;
/**
 * A flight's name, ranked: the order Surf's and the local cups' colours
 * run in, so two flights of one age can be told apart by name alone.
 * Lower is stronger; the number only orders, it is not a tier.
 */
export declare function flightOrder(division: string | null | undefined): number;
/** The flight's place in its tournament, read off the division's name alone: 0 top, 1 second, 2 the rest. */
export declare function flightStep(division: string | null | undefined): 0 | 1 | 2;
/**
 * Where a flight plays: its tournament's tier and its place from the
 * top — the step the teams gave it (orderFlights) where there is one,
 * else the name's. A division's own tier, set by an admin, is taken as
 * that tier's top flight. Null where the event is untiered.
 */
export type FlightLevel = {
    tier: Tier;
    step: number;
};
export declare function flightLevel(eventTier: number | null | undefined, division: string | null | undefined, override?: number | null | undefined, step?: number | null): FlightLevel | null;
/** The tier a flight plays at — the tournament's, or the division's own word. Null where the event is untiered. */
export declare function divisionTier(eventTier: number | null | undefined, division: string | null | undefined, override?: number | null | undefined, step?: number | null): Tier | null;
/**
 * What each place below the top flight takes off. A title: a fifth of
 * the top flight's, per place, to a floor of a fifth — Surf Cup's Super
 * Black is worth 192, its Super White 144 (a regional cup's top flight),
 * its Black 96, its White 48. A game: a tenth per place, never below a
 * rec cup's weight.
 */
export declare const FLIGHT_BONUS_STEP = 0.2;
export declare const FLIGHT_BONUS_FLOOR = 0.2;
export declare const FLIGHT_WEIGHT_STEP = 0.1;
/**
 * Which flight is which, from the teams in it rather than its name.
 *
 * Organisers do not agree on colours: Surf Cup NW's top flight is "Best
 * of the NW" and its Gold is second; Starfire's Black is the top. So a
 * tournament's flights are ordered, within each age and gender, by the
 * median league level of the teams entered — the same prior the ranking
 * starts them from — and the strongest is the top flight, the next the
 * second, and so on down. The median, so one ECNL side slumming in Silver
 * does not lift it; only teams of known level count, since a side in no
 * league here (an Oregon club, a league not yet imported) says nothing
 * about the flight; and a tie is broken by the name.
 *
 * Thin data does not overrule a clear name: a flight with fewer than
 * MIN_FLIGHT_TEAMS teams of known level, or an age with fewer than two
 * such flights, takes its place from its name, ranked among the age's
 * flights (flightOrder) so Gold, Silver and Bronze read 0, 1, 2. Pure.
 */
export declare const MIN_FLIGHT_TEAMS = 3;
/** `step` is the flight's place from the top, 0 up: the tier steps down one per place. */
export type FlightRead = {
    step: number;
    by: "teams" | "name";
    strength: number | null;
    teams: number;
};
/** "girls-13" — the age and gender a flight's name says, so flights are only compared with their own. */
export declare function flightGroup(name: string | null | undefined): string;
export declare function orderFlights(flights: {
    id: string;
    name: string | null;
    priors: number[];
}[]): Map<string, FlightRead>;
/** How much a result counts, by what it was played in: the tier's weight, less a tenth per flight below the top. */
export declare function weightOf(kind: string, level: FlightLevel | null): number;
export declare const TIER_LABELS: Record<Tier, string>;
/**
 * A trophy means a lot — and a national one means most. Surf Cup San
 * Diego's Best of the Best is the hardest flight a side here will play
 * all year, and its champion is, near enough, the best team in the
 * cohort: that title on its own is worth as much as most of a season
 * (owner, 2026-09-17: "this achievement itself should have almost enough
 * weight to put them on top"): 240. A regional cup's title 150, a
 * premier cup's 80 (Zipfizz), a select cup's 40 (Starfire's), a rec
 * cup's 20; the runner-up half of each.
 *
 * A tournament nobody has tiered is an unknown one, and pays as a rec
 * cup would — 20 for its top flights, 10 for its bottom ones — until
 * somebody places it. Once per team per event, after the replay,
 * the way the team page reads it (teams/honours.ts): the final where
 * there is one, the table where there is not — never both.
 */
export declare const CHAMPION_BONUS: Record<Tier, number>;
/** What an untiered tournament's champion earns: its top flights, and its bottom ones. */
export declare const UNTIERED_BONUS: {
    top: number;
    bottom: number;
};
export declare function honourBonus(place: "champion" | "runner-up", level: FlightLevel | null, division?: string | null | undefined): number;
