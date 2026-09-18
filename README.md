# kingjuan-ranking

The rule behind the rankings on [kingjuansoccer.com](https://kingjuansoccer.com/rankings):
how youth soccer teams around Seattle are rated from the league they play in,
their results, and the trophies they win — and how leagues and tournament
flights are tiered so that a Surf Cup final and a rec-league Tuesday do not
count the same.

It is a pure TypeScript library with no database: the site reads its games and
hands them in; this decides what they are worth. The whole point of keeping it
here, in the open, is that a parent, a coach or a club who thinks the rule is
wrong about something can show it — on the same games the site ranks — and
change it.

## The rule in one paragraph

Every team starts where its league puts it (`levelOf`: ECNL and Pre-ECNL at the
top, then MLS Next, ECNL RL, EA and GA, RCL and WPL by division), plus half of
where it finished last season above or below that (`carriedPrior`). Then every
decided game of the season, in kickoff order, moves both sides by how
surprising the result was — an Elo replay (`replay`) where margin counts as
√goals capped at three and only as far as the result surprised, league games
count by their league, tournament games by the tier and flight they were
played in (`weightOf`), and playing a side a year older pays on top. A flight's
champion and runner-up earn a bonus by the flight's tier (`honourBonus`): a
national cup's top flight 240 points, a rec cup's 20. Three decided games to
be ranked at all. `RULE_STEPS` says the same thing at length, as the site does.

Two things are read from the games rather than declared: which flight of a
tournament is its top one (`orderFlights` — by the league level of the teams
entered, since one cup's Gold is another's second flight), and who won it
(the site's business; it arrives in the season file as `honours`).

## Run it

```
pnpm install
pnpm test                 # the rule's unit tests
pnpm evaluate             # rate the season on file, print the top 10 of every cohort
pnpm evaluate --top=50 --cohort=boys-2013
pnpm evaluate --diff      # what moved against the recorded tables
```

`fixtures/2026-27.json` is this season as the site read it on the date in the
file: every team with its league level, every decided game with what it was
played in, every trophy with its flight's tier. It is public schedule data —
team names, scores, event titles — and nothing about any person.
`fixtures/2026-27.expected.json` is the tables the current rule produces from
it; CI fails if they move. See [CONTRIBUTING](CONTRIBUTING.md) for how a
change to the rule is made and judged.

## Use it

```ts
import { rateSeason, rankCohorts, type SeasonInput } from "kingjuan-ranking";

const input: SeasonInput = JSON.parse(readFileSync("fixtures/2026-27.json", "utf8"));
const out = rateSeason(input);          // prior, rated, honours — per team id
const tables = rankCohorts(input, out); // cohort → the top 50, best first
```

The site pins a tagged version and stamps every ranking run with
`RULE_VERSION`, so a run always says which rule produced it.

## Layout

| file | what |
|---|---|
| `src/rule.ts` | the league ladder and priors, the Elo replay, cohorts, the rule's own description |
| `src/tier.ts` | tournament tiers 1–5, flight order and steps, game weights, trophy bonuses |
| `src/season.ts` | `rateSeason` / `rankCohorts`: a season file in, ratings and tables out |
| `src/reason.ts` | the sentence and the points that explain a team's place |
| `scripts/evaluate.ts` | the evaluation the tables are judged by |

MIT.
