// Builds the GraphQL query for a PR's reviews and shapes the response into
// a source-neutral list a panel can render:
//   [{ id, author, isBot, state, submittedAt, commitsSince, resolved, comments }]
//   comments (unresolved only): [{ id, path, line, body }]
// GitHub's REST API has no "thread resolved" concept, so this is GraphQL-only.
// No imports, so it runs in the mod and under `node --test`.

const BOT_LOGINS = new Set(["gemini-code-assist", "maximus-ci-app"]);
export const isBot = (login) => BOT_LOGINS.has(login.replace(/\[bot\]$/, ""));

export const QUERY = `query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      reviews(first: 100) { nodes { databaseId state submittedAt body author { login } } }
      reviewThreads(first: 100) { nodes { isResolved comments(first: 50) { nodes { databaseId path line body pullRequestReview { databaseId } } } } }
      commits(last: 100) { nodes { commit { committedDate } } }
    }
  }
  viewer { login }
}`;

export function shapeReviews(data) {
  const pr = data?.repository?.pullRequest ?? {};
  const reviews = pr.reviews?.nodes ?? [];
  const threads = pr.reviewThreads?.nodes ?? [];
  const commits = pr.commits?.nodes ?? [];
  const viewerLogin = data?.viewer?.login;

  return reviews
    .filter((r) => r.author?.login !== viewerLogin)
    .map((r) => {
      const ownThreads = threads.filter((th) => th.comments.nodes.some((c) => c.pullRequestReview?.databaseId === r.databaseId));
      const allResolved = ownThreads.every((th) => th.isResolved);
      const commitsSince = commits.filter((c) => new Date(c.commit.committedDate) > new Date(r.submittedAt)).length;
      const resolved = r.state === "DISMISSED" ? true : allResolved && commitsSince > 0;
      const comments = ownThreads
        .filter((th) => !th.isResolved)
        .flatMap((th) => th.comments.nodes.filter((c) => c.pullRequestReview?.databaseId === r.databaseId))
        .map((c) => ({ id: c.databaseId, path: c.path, line: c.line, body: c.body }));
      return { id: r.databaseId, author: r.author?.login, isBot: isBot(r.author?.login ?? ""), state: r.state, submittedAt: r.submittedAt, commitsSince, resolved, comments };
    })
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
}
