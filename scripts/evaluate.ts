/**
 * Rate a season file and show the tables — what a change to the rule is
 * judged by.
 *
 *   pnpm evaluate                       # every fixture: the top 10 of each cohort
 *   pnpm evaluate --top=50 --cohort=boys-2013
 *   pnpm evaluate --write               # record the tables as fixtures/<season>.expected.json
 *   pnpm evaluate --check               # fail if the tables have moved from what was recorded (CI)
 *   pnpm evaluate --diff                # what moved, team by team, against what was recorded
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { cohortLabel, rankCohorts, rateSeason, type SeasonInput } from "../src/index.js";

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const TOP = Number(opt("top") ?? 10);
const dir = join(import.meta.dirname, "..", "fixtures");

type Table = Record<string, { id: string; name: string; rating: number; games: number }[]>;

function tables(input: SeasonInput): Table {
  const out = rateSeason(input);
  const names = new Map(input.teams.map((t) => [t.id, t.name]));
  const t: Table = {};
  for (const [cohort, rows] of rankCohorts(input, out)) t[cohort] = rows.map((r) => ({ id: r.id, name: names.get(r.id) ?? "?", rating: Math.round(r.rating), games: r.games }));
  return t;
}

let failed = false;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && !f.endsWith(".expected.json")).sort()) {
  const input = JSON.parse(readFileSync(join(dir, file), "utf8")) as SeasonInput;
  const got = tables(input);
  const expectedPath = join(dir, file.replace(/\.json$/, ".expected.json"));
  console.log(`\n# ${file} — ${input.teams.length} teams, ${input.games.length} games, ${input.honours.length} trophies`);
  if (flag("write")) {
    writeFileSync(expectedPath, JSON.stringify(got, null, 1) + "\n");
    console.log(`  recorded → ${expectedPath}`);
    continue;
  }
  if (flag("check") || flag("diff")) {
    let expected: Table;
    try { expected = JSON.parse(readFileSync(expectedPath, "utf8")); } catch { console.log("  no recorded tables — run with --write"); failed = true; continue; }
    let moved = 0;
    for (const cohort of new Set([...Object.keys(expected), ...Object.keys(got)])) {
      const was = expected[cohort] ?? [], now = got[cohort] ?? [];
      const wasAt = new Map(was.map((r, i) => [r.id, { i, r }]));
      const nowAt = new Map(now.map((r, i) => [r.id, { i, r }]));
      for (const id of new Set([...wasAt.keys(), ...nowAt.keys()])) {
        const a = wasAt.get(id), b = nowAt.get(id);
        if (a && b && a.i === b.i && a.r.rating === b.r.rating) continue;
        moved++;
        if (flag("diff")) {
          const name = (b ?? a)!.r.name;
          console.log(`  ${cohortLabel(cohort)}  ${name}: ${a ? `#${a.i + 1} ${a.r.rating}` : "—"} → ${b ? `#${b.i + 1} ${b.r.rating}` : "—"}`);
        }
      }
    }
    console.log(moved === 0 ? "  unchanged from what was recorded" : `  ${moved} row(s) moved from what was recorded${flag("diff") ? "" : " — run with --diff to see them"}`);
    if (moved > 0) failed = true;
    continue;
  }
  for (const [cohort, rows] of Object.entries(got)) {
    if (opt("cohort") && cohort !== opt("cohort")) continue;
    console.log(`\n## ${cohortLabel(cohort)} (${rows.length} ranked)`);
    rows.slice(0, TOP).forEach((r, i) => console.log(`  ${String(i + 1).padStart(2)}. ${r.name.padEnd(48)} ${String(r.rating).padStart(5)}  ${r.games} games`));
  }
}
if (failed) process.exit(1);
