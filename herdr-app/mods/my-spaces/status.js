// The one review/merge icon for an open PR. No imports, so it runs in the mod and
// under node (status.test.mjs). First match wins:
//   nothing in merge queue (the #PR chip turns teal instead), ↯ merge conflict, ✓ approved,
//   ※ changes requested or someone else reviewed after your last non-merge commit.
export function prStatus(pr) {
  if (pr.mergeQueueEntry) return "";
  if (pr.mergeable === "CONFLICTING") return "↯";
  if (pr.reviewDecision === "APPROVED") return "✓";
  if (pr.reviewDecision === "CHANGES_REQUESTED") return "※";
  // Same "since" rule as gh reviews
  const me = pr.author?.login;
  const push = pr.commits.nodes.map((c) => c.commit).filter((c) => !/^Merge /.test(c.messageHeadline))
    .map((c) => c.committedDate).sort().pop() ?? "";
  return pr.reviews.nodes.some((v) => v.author?.login !== me && v.submittedAt > push) ? "※" : "";
}

// `color` with a two-hex-digit alpha appended, or null unless it's plain #rrggbb.
export const alpha = (color, aa) => (/^#[0-9a-f]{6}$/i.test(color ?? "") ? color + aa : null);
