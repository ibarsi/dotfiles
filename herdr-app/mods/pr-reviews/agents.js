// Agents and this PR: who's on it, and starting one to address a review.
// Adapted from munza/herdr-mods' branch-pr (Apache-2.0): actions/agents.js.
import { agents, panes, spaces, terminals, run } from "herdr";
import { agentsOnPR, isBot, who } from "./model.js";

const BOT_ARGV = ["agy", "--dangerously-skip-permissions", "-i"]; // agyyolo; agy takes its first prompt only via -i
const HUMAN_ARGV = ["claude", "--dangerously-skip-permissions", "--model", "opus"]; // ccyolo --model opus; prompt is positional

// pane.split runs argv bare, so the pane (and, if it was the last one, its tab
// and space) closes when the agent exits. Run it in bash, which takes over after.
const sq = (a) => `'${a.replaceAll("'", `'\\''`)}'`;
const inShell = (argv) => ["bash", "-ic", `${argv.map(sq).join(" ")}; exec bash`];
// The shell outlives the agent, so "still running" means an agent is live in it.
const agentIn = (tm) => agents().some((a) => a.address === tm.address);

export const agentName = (agent) => agent?.tab_name || agent?.title || agent?.address || "agent";

// Same as Deploys' own spaceOf (my-spaces/status.js's terminalSpace): a
// terminal's space id, machine-prefixed when remote.
function spaceOf(tm) {
  const sp = tm.labels?.["herdr.space"];
  if (!sp) return null;
  const m = tm.machine ?? (tm.address?.includes("/") ? tm.address.split("/")[0] : null);
  return m ? `${m}/${sp}` : sp;
}

export const agentMethods = {
  prAgents() {
    if (!this.pr) return [];
    return agentsOnPR({ agents: agents(), panes: panes(), pr: this.pr, space: this.sp?.id });
  },

  focusAgent(agent) {
    run("agent.focus", { terminal: agent.address });
  },

  // Like Deploys' investigate icon: splits an agent into the active space's
  // shown tab, no picker, no editing. A human review gets ccyolo --model opus
  // running /review-judge (with the review id `gh pr view --json reviews`
  // shows); a bot's gets agyyolo running /pr-babysit (no argument: it works
  // the whole PR).
  addressReview(entry) {
    const target = this.target();
    const space = spaces().find((s) => s.active);
    if (!target || !space) return;
    const argv = inShell(isBot(who(entry)) ? [...BOT_ARGV, "/pr-babysit"] : [...HUMAN_ARGV, `/review-judge ${entry.id}`]);
    const running = terminals().some((tm) => tm.state === "live" && spaceOf(tm) === space.id && tm.argv?.join("\0") === argv.join("\0") && agentIn(tm));
    if (running) return;
    const tab = space.tabs?.find((tb) => tb.active);
    const tabPanes = panes().filter((p) => p.tab === tab?.id && p.terminal);
    const pane = tabPanes.find((p) => p.cwd === target.cwd) ?? tabPanes[0];
    if (pane) run("pane.split", { direction: "right", pane: pane.pane, argv });
  },
};

