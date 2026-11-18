// Reads and writes through `gh` directly — no Go helper, matching every other
// herdr-app mod (deploys/main.js, my-spaces/indicators.js). Auth lives on this
// computer; mutations always run here too, same as a read would.
// Adapted from munza/herdr-mods' branch-pr (Apache-2.0): github/reads.js and
// actions/changes.js, whose actual GitHub calls lived in a Go helper — ported
// from the helper's own gh invocations (helper/main.go) instead of its JSON-RPC shape.
import { exec } from "herdr";
import { QUERY, shapePR } from "./model.js";

async function graphql(args) {
  const r = await exec("gh", ["api", "graphql", ...args], { timeout: 30000 });
  if (r.code !== 0) throw new Error(r.stderr || "Could not reach GitHub");
  return JSON.parse(r.stdout);
}

export async function fetchPR(repo, number) {
  const [owner, name] = repo.split("/");
  const data = await graphql(["-f", `owner=${owner}`, "-f", `name=${name}`, "-F", `number=${number}`, "-f", `query=${QUERY}`]);
  return shapePR(data.data, repo);
}

export async function postComment(repo, number, body) {
  const r = await exec("gh", ["api", `repos/${repo}/issues/${number}/comments`, "--method", "POST", "-f", `body=${body}`], { timeout: 15000 });
  if (r.code !== 0) throw new Error(r.stderr || "Could not post the comment");
}

export async function replyToThread(threadId, body) {
  const query = `mutation($id: ID!, $body: String!) { addPullRequestReviewThreadReply(input: { pullRequestReviewThreadId: $id, body: $body }) { comment { id } } }`;
  const data = await graphql(["-f", `id=${threadId}`, "-f", `body=${body}`, "-f", `query=${query}`]);
  if (data.errors) throw new Error(data.errors[0]?.message || "Could not post the reply");
}

export async function resolveThread(threadId, reopen = false) {
  const mutation = reopen ? "unresolveReviewThread" : "resolveReviewThread";
  const query = `mutation($id: ID!) { ${mutation}(input: { threadId: $id }) { thread { id isResolved } } }`;
  const data = await graphql(["-f", `id=${threadId}`, "-f", `query=${query}`]);
  if (data.errors) throw new Error(data.errors[0]?.message || "Could not update the thread");
}

export async function requestReviewAgain(repo, number, login) {
  const r = await exec("gh", ["api", `repos/${repo}/pulls/${number}/requested_reviewers`, "--method", "POST", "-f", `reviewers[]=${login}`], { timeout: 15000 });
  if (r.code !== 0) throw new Error(r.stderr || "Could not request another review");
}
