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

export async function requestReviewAgain(repo, number, login) {
  const r = await exec("gh", ["api", `repos/${repo}/pulls/${number}/requested_reviewers`, "--method", "POST", "-f", `reviewers[]=${login}`], { timeout: 15000 });
  if (r.code !== 0) throw new Error(r.stderr || "Could not request another review");
}
