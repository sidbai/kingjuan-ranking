# Changing the rule

A change to the rule is a change to who is ranked where, and that is what a
pull request here has to show.

1. Say what is wrong, with a team. "Team X sits at #12 and should be in the
   top five because …" is a claim the games can settle; "the play-up credit
   feels low" is not, yet. Look at `pnpm evaluate --cohort=…` first.
2. Make the change in `src/`. Keep the rule pure — no fetching, no dates read
   off the clock, nothing that is not in the season file. Add or adjust a unit
   test for the piece you touched.
3. Run `pnpm evaluate --diff`. That is the before-and-after over every cohort.
   Read it: the rows you meant to move, and the ones you did not. Then
   `pnpm evaluate --write` to record the new tables, and commit
   `fixtures/*.expected.json` with the change.
4. In the pull request, paste the part of the diff that matters and say why
   each notable move is right. A change that moves a hundred rows to fix one
   is usually the wrong change.
5. Bump `RULE_VERSION` in `src/rule.ts` (the date and a letter) when the
   numbers move at all. The site stamps every run with it.

Things that are decisions rather than code, and are welcome as their own
small pull requests with a one-line reason each:

- **The league ladder** — `levelOf` in `src/rule.ts`: which leagues and
  divisions sit on which rung, and at which ages.
- **Tournament tiers** — the site sets a tournament's tier (1 national … 5
  rec) by hand; the weights and bonuses per tier are `TIER_WEIGHT` and
  `CHAMPION_BONUS` in `src/tier.ts`.
- **Flight names** — `flightOrder` and `flightStep` in `src/tier.ts`: what
  "Super White" or "Flight B" means when the teams entered cannot say.

What this repository does not take: anything about a person. The season file
is teams, games and events; keep it that way.
