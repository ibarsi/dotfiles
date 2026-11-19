// The merge/review icon for an open PR, in its own column from the comments icon
// below so a conflict and outstanding comments can show at once. No imports, so it
// runs in the mod and under node (status.test.mjs). First match wins: nothing in
// merge queue (the #PR chip turns teal instead), ↯ merge conflict, ✓ approved.
export function prStatus(pr) {
  if (pr.mergeQueueEntry) return "";
  if (pr.mergeable === "CONFLICTING") return "↯";
  if (pr.reviewDecision === "APPROVED") return "✓";
  return "";
}

// Whether the comments icon (※) should show: changes requested, or someone else
// reviewed after your last non-merge commit. An overall approval covers this instead.
export function hasComments(pr) {
  if (pr.mergeQueueEntry || pr.reviewDecision === "APPROVED") return false;
  if (pr.reviewDecision === "CHANGES_REQUESTED") return true;
  const me = pr.author?.login;
  const push = pr.commits.nodes.map((c) => c.commit).filter((c) => !/^Merge /.test(c.messageHeadline))
    .map((c) => c.committedDate).sort().pop() ?? "";
  return pr.reviews.nodes.some((v) => v.author?.login !== me && v.submittedAt > push);
}

// `color` with a two-hex-digit alpha appended, or null unless it's plain #rrggbb.
export const alpha = (color, aa) => (/^#[0-9a-f]{6}$/i.test(color ?? "") ? color + aa : null);

// A space's agent statuses, most urgent first, at most 4 (one bar segment each).
const URGENCY = ["blocked", "done", "working", "idle"];
const rank = (s) => (URGENCY.includes(s) ? URGENCY.indexOf(s) : URGENCY.length);
export const segments = (statuses) => [...statuses].sort((a, b) => rank(a) - rank(b)).slice(0, 4);

// Fingerprint of every agent's space and status: the bar repaints when it changes,
// since spaces() only changes with a space's most urgent status.
export const agentKey = (list) => list.map((a) => `${a.space}:${a.status}`).join(",");

// The sidebar space id a core terminal belongs to, or null. Remote space ids carry a
// `machine/` prefix that the terminal's own label omits; terminals name their machine
// only through `address` (omen/t1k), so read it from there.
export function terminalSpace(t) {
  const sp = t.labels?.["herdr.space"];
  if (!sp) return null;
  const m = t.machine ?? (t.address?.includes("/") ? t.address.split("/")[0] : null);
  return m ? `${m}/${sp}` : sp;
}
