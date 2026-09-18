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
/**
 * What a game in each tier is worth, against a league game at 1. A
 * premier cup's games count as league games do, a select cup's well
 * under, a rec cup's half (owner, 2026-09-17), and a cup nobody has
 * tiered sits between select and rec.
 */
export const TIER_WEIGHT = { 1: 1.35, 2: 1.15, 3: 1, 4: 0.7, 5: 0.5 };
export const UNTIERED_TOURNAMENT = 0.6;
/**
 * A flight's name, ranked: the order Surf's and the local cups' colours
 * run in, so two flights of one age can be told apart by name alone.
 * Lower is stronger; the number only orders, it is not a tier.
 */
export function flightOrder(division) {
    const d = (division ?? "").toLowerCase();
    // "Silver 1" above "Silver 2": the number after a colour orders within it.
    const sub = Number(/\b(?:gold|silver|bronze|black|white|blue|red|green|grey|gray)\s*(\d)\b/.exec(d)?.[1] ?? 1) - 1;
    return base(d) + sub / 10;
}
function base(d) {
    if (/best of the/.test(d))
        return 0;
    if (/\bsuper\s+black\b/.test(d))
        return 1;
    if (/\bsuper\s+white\b|\bsuper\b/.test(d))
        return 2;
    // Red is a local cup's top flight (Eastside FC Cup, Starfire), where Gold is another's.
    if (/premier|elite|\bgold\b|\bred\b|championship|\b(div(ision)?|flight|tier)\.?\s*(1|i|a)\b|\b1st\b|open/.test(d))
        return 3;
    if (/\bblack\b|silver|select|classic|\b(div(ision)?|flight|tier)\.?\s*(2|ii|b)\b|\b2nd\b/.test(d))
        return 4;
    if (/\bwhite\b|\b(div(ision)?|flight|tier)\.?\s*(3|iii|c)\b|\b3rd\b/.test(d))
        return 5;
    if (/\bblue\b|bronze|copper|\bgreen\b|\b(div(ision)?|flight|tier)\.?\s*([4-9]|iv|d)\b|\b[4-9]th\b/.test(d))
        return 6;
    if (/\bgr[ae]y\b|\brec\b|recreational/.test(d))
        return 7;
    // A name that says nothing about the flight — "U12 Boys" — is the top.
    return 3;
}
/** The flight's place in its tournament, read off the division's name alone: 0 top, 1 second, 2 the rest. */
export function flightStep(division) {
    const d = (division ?? "").toLowerCase();
    if (!d)
        return 0;
    // "Best of the Best", "Premier", "Elite", "Gold", "Championship", "Div 1", "Flight 1"
    if (/best of the|premier|elite|\bgold\b|championship|\b(div(ision)?|flight|tier)\.?\s*(1|i)\b|\b1st\b|open/.test(d))
        return 0;
    // "Super Black" and "Super White" — Surf Cup's second and third flights, below Best of the Best; "Black", "White", "Select", "Silver", "Classic", "Div 2"
    if (/\bsuper\b|\bblack\b|\bwhite\b|select|silver|classic|\b(div(ision)?|flight|tier)\.?\s*(2|ii)\b|\b2nd\b/.test(d))
        return 1;
    // "Blue", "Grey", "Bronze", "Copper", "Rec", "Div 3"
    if (/\bblue\b|\bgr[ae]y\b|bronze|copper|\brec\b|recreational|\b(div(ision)?|flight|tier)\.?\s*([3-9]|iii|iv)\b|\b[3-9](rd|th)\b/.test(d))
        return 2;
    // A name that says nothing about the flight — "U12 Boys" — is the tournament's own tier.
    return 0;
}
export function flightLevel(eventTier, division, override = null, step = null) {
    if (override && override >= 1 && override <= 5)
        return { tier: override, step: 0 };
    if (!eventTier || eventTier < 1 || eventTier > 5)
        return null;
    return { tier: eventTier, step: Math.max(0, step ?? flightStep(division)) };
}
/** The tier a flight plays at — the tournament's, or the division's own word. Null where the event is untiered. */
export function divisionTier(eventTier, division, override = null, step = null) {
    return flightLevel(eventTier, division, override, step)?.tier ?? null;
}
/**
 * What each place below the top flight takes off. A title: a fifth of
 * the top flight's, per place, to a floor of a fifth — Surf Cup's Super
 * Black is worth 192, its Super White 144 (a regional cup's top flight),
 * its Black 96, its White 48. A game: a tenth per place, never below a
 * rec cup's weight.
 */
export const FLIGHT_BONUS_STEP = 0.2;
export const FLIGHT_BONUS_FLOOR = 0.2;
export const FLIGHT_WEIGHT_STEP = 0.1;
function flightShare(step, per, floor) {
    return Math.max(floor, 1 - per * step);
}
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
export const MIN_FLIGHT_TEAMS = 3;
/** "girls-13" — the age and gender a flight's name says, so flights are only compared with their own. */
export function flightGroup(name) {
    const n = (name ?? "").toLowerCase();
    const gender = /girls|(?<![a-z])g(?=u-?\d)/.test(n) ? "girls" : /boys|(?<![a-z])b(?=u-?\d)/.test(n) ? "boys" : "any";
    const age = /(?<![a-z])[bg]?u-?(\d{1,2})(?![0-9])/.exec(n)?.[1] ?? "?";
    return `${gender}-${age}`;
}
function median(xs) {
    const s = [...xs].sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
export function orderFlights(flights) {
    const out = new Map();
    const groups = new Map();
    for (const f of flights) {
        // A "Championships" division holds every flight's final and nobody is entered in it: a game there takes its teams' flight (compute.ts).
        if (/championship/i.test(f.name ?? "")) {
            out.set(f.id, { step: 0, by: "name", strength: null, teams: 0 });
            continue;
        }
        groups.set(flightGroup(f.name), [...(groups.get(flightGroup(f.name)) ?? []), f]);
    }
    for (const group of groups.values()) {
        // By name: the age's flights in name order, same names sharing a place.
        const ranks = [...new Set(group.map((f) => flightOrder(f.name)))].sort((a, b) => a - b);
        const byName = (f) => ({ step: ranks.indexOf(flightOrder(f.name)), by: "name", strength: f.priors.length ? median(f.priors) : null, teams: f.priors.length });
        const known = group.filter((f) => f.priors.length >= MIN_FLIGHT_TEAMS);
        if (known.length < 2) {
            for (const f of group)
                out.set(f.id, byName(f));
            continue;
        }
        const ordered = known
            .map((f) => ({ f, m: median(f.priors) }))
            .sort((a, b) => b.m - a.m || flightOrder(a.f.name) - flightOrder(b.f.name));
        ordered.forEach(({ f, m }, i) => out.set(f.id, { step: i, by: "teams", strength: m, teams: f.priors.length }));
        for (const f of group)
            if (!out.has(f.id))
                out.set(f.id, byName(f));
    }
    return out;
}
/** How much a result counts, by what it was played in: the tier's weight, less a tenth per flight below the top. */
export function weightOf(kind, level) {
    if (kind === "league")
        return 1;
    if (kind === "tournament")
        return level ? TIER_WEIGHT[level.tier] * flightShare(level.step, FLIGHT_WEIGHT_STEP, TIER_WEIGHT[5] / TIER_WEIGHT[level.tier]) : UNTIERED_TOURNAMENT;
    return 0.6;
}
export const TIER_LABELS = { 1: "Tier 1 — national", 2: "Tier 2 — regional", 3: "Tier 3 — premier", 4: "Tier 4 — select", 5: "Tier 5 — rec" };
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
export const CHAMPION_BONUS = { 1: 240, 2: 150, 3: 80, 4: 40, 5: 20 };
/** What an untiered tournament's champion earns: its top flights, and its bottom ones. */
export const UNTIERED_BONUS = { top: 20, bottom: 10 };
export function honourBonus(place, level, division = null) {
    const full = level
        ? CHAMPION_BONUS[level.tier] * flightShare(level.step, FLIGHT_BONUS_STEP, FLIGHT_BONUS_FLOOR)
        : flightStep(division) === 2 ? UNTIERED_BONUS.bottom : UNTIERED_BONUS.top;
    return Math.round(place === "champion" ? full : full / 2);
}
