import { CARRY } from "./rule.js";
const cite = (r) => `${r.score} ${r.opponent} (${r.level})`;
export function reasonFor(i) {
    const parts = [];
    const record = `${i.won}-${i.drawn}-${i.lost}, ${i.gf}–${i.ga} in ${i.played} game${i.played === 1 ? "" : "s"}`;
    parts.push(i.level === "select" ? `No tiered league this season; ${record}.` : `${i.level} level; ${record}.`);
    if (i.carried)
        parts.push(`${i.carried > 0 ? "+" : "−"}${Math.abs(Math.round(i.carried))} carried from last season.`);
    if (i.bestWins.length) {
        parts.push(`Best: ${i.bestWins.slice(0, 3).map(cite).join("; ")}.`);
    }
    if (i.lost === 0) {
        parts.push("Unbeaten.");
    }
    else {
        parts.push(`Lost ${i.losses.slice(0, 3).map(cite).join("; ")}.`);
    }
    if (i.played < 5) {
        parts.push(`Only ${i.played} games — provisional.`);
    }
    else if (i.tieredOpponents === 0) {
        parts.push("Every opponent so far was select-level, so the rating rests on volume rather than on a tiered win.");
    }
    return parts.join(" ");
}
export function reasonPoints(i) {
    const out = [];
    out.push({
        label: "Level",
        text: i.level === "select" ? "No tiered league this season" : i.league ? `${i.level} · ${i.league}` : i.level,
    });
    // What last season left: half of where the team finished above or below its league prior (rule.ts CARRY).
    if (i.carried && i.prior !== undefined) {
        const finished = Math.round(i.prior + i.carried / CARRY);
        out.push({
            label: "Last season",
            text: `${i.carried > 0 ? "+" : "−"}${Math.abs(Math.round(i.carried))} carried in — finished last season at ${finished}, half of the gap to the league prior (${Math.round(i.prior)}) comes along`,
        });
    }
    out.push({
        label: "Record",
        text: `${i.won}-${i.drawn}-${i.lost} · ${i.gf}–${i.ga} in ${i.played} game${i.played === 1 ? "" : "s"}`,
    });
    if (i.honours?.length) {
        out.push({
            label: "Honours",
            text: i.honours.map((h) => `${h.place === "champion" ? "Champion" : "Runner-up"}, ${h.event}${h.division ? ` ${h.division}` : ""}${h.tier ? ` (tier ${h.tier}, +${h.bonus})` : ` (+${h.bonus})`}`).join(" · "),
        });
    }
    if (i.bestWins.length)
        out.push({ label: "Best wins", text: i.bestWins.slice(0, 3).map(cite).join(" · ") });
    out.push({ label: "Losses", text: i.lost === 0 ? "Unbeaten" : i.losses.slice(0, 3).map(cite).join(" · ") });
    if (i.played < 5)
        out.push({ label: "Note", text: `Only ${i.played} game${i.played === 1 ? "" : "s"} — provisional` });
    else if (i.tieredOpponents === 0)
        out.push({ label: "Note", text: "Every opponent so far was select-level; the rating rests on volume rather than a tiered win" });
    return out;
}
