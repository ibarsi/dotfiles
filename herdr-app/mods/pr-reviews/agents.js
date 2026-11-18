// Handing work to agents: who is on this PR, and what to send them. Delivery
// goes through `hc`, the same primitive Herdr's own agent commands use, so a
// busy agent's session gets the message even while it's mid-turn.
// Adapted from munza/herdr-mods' branch-pr (Apache-2.0): actions/agents.js,
// trimmed to this panel's scope (no worktree-aware work folder yet).
import { h_flex } from "gpui-base";
import { agents, panes, spaces, terminals, hc, knownAgents, run } from "herdr";
import { agentsOnPR, commentMessage, isBot, unresolvedMessage, who } from "./model.js";
import { SmallButton, MenuButton } from "./ui.js";

const SPAWN = "spawn:";
const AGENT_ARGV = ["agy", "--dangerously-skip-permissions"]; // agyyolo

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

  // Those on the PR first, then the rest of this space, who may well be free.
  agentChoices() {
    const on = this.prAgents();
    const others = agents().filter((a) => a.space === this.sp?.id && !on.some((b) => b.address === a.address));
    return [...on, ...others];
  },

  focusAgent(agent) {
    run("agent.focus", { terminal: agent.address });
  },

  // Installed agents on this space's machine, for starting a new one.
  loadNewAgents(sp, cx) {
    const machine = sp?.machine ?? null;
    cx.spawn(async (cx) => {
      try {
        const known = await knownAgents({ on: machine });
        if ((this.sp?.machine ?? null) === machine) this.newAgents = known.filter((a) => a.installed);
      } catch {
        this.newAgents = [];
      }
      cx.notify();
    });
  },

  newAgentChoices() {
    return (this.newAgents ?? []).map((a) => ({ address: `new:${a.key}`, isNew: true, run: a.run, tab_name: `new ${a.name}` }));
  },

  // Who a choice means: someone running, or one to start.
  agentAt(address) {
    if (address?.startsWith(SPAWN)) {
      const parent = agents().find((a) => a.address === address.slice(SPAWN.length));
      const command = parent && this.spawnRun(parent);
      return command ? { ...parent, address, parentAddress: parent.address, spawn: true, run: command, parentName: agentName(parent), tab_name: `${agentName(parent)} (spawn)` } : null;
    }
    return agents().find((a) => a.address === address) ?? this.newAgentChoices().find((a) => a.address === address) ?? null;
  },

  // A sub-agent has to be the parent's own kind, so an agent we can't match has none.
  spawnRun(parent) {
    return (this.newAgents ?? []).find((a) => a.key === parent.program?.key)?.run ?? null;
  },

  // What `hc` is asked to do. A sub-agent is started here, not by asking its parent: no
  // shell sees the message, which can hold other people's text, and a busy parent is no wait.
  hcArgs(agent, message) {
    if (!agent.spawn) return ["send", agent.address, message];
    const machine = this.sp?.machine;
    return ["run", "--bg", "--json", "--parent", agent.parentAddress, ...(machine ? ["--on", machine] : []), ...(this.sp?.folder ? ["--cwd", this.sp.folder] : []), ...agent.run, message.startsWith("-") ? ` ${message}` : message];
  },

  // A new agent gets its own tab, in this space's folder, with the message as its first prompt.
  startAgent(agent, message) {
    run("tab.new", { space: this.sp?.id, folder: this.sp?.folder, argv: agent.run, task: message });
    this.notice = `Started ${agentName(agent)} in a new tab.`;
  },

  // A dropdown of who can take this: agents on the PR first, then the rest of this space,
  // then a new one of each installed kind. `send(agent, cx)` does the work.
  agentButton({ id, label, send }) {
    const running = this.agentChoices();
    const fresh = this.newAgentChoices();
    if (this.mutating || !(running.length + fresh.length)) return SmallButton({ id, label: this.mutating ? label : `${label} (no agent)`, disabled: true, onClick: () => {} });
    const chooser = this.chooser({
      id,
      accessibilityLabel: `${label}: choose an agent`,
      width: 260,
      trigger: MenuButton({ id: `${id}-trigger`, label }),
      choices: [
        ...running.flatMap((a) => [{ id: a.address, label: agentName(a), detail: a.status }, ...(this.spawnRun(a) ? [{ id: `${SPAWN}${a.address}`, label: `${agentName(a)} (spawn)` }] : [])]),
        ...fresh.map((a, i) => ({ id: a.address, label: `Start ${agentName(a)}`, divided: i === 0 && running.length > 0 })),
      ],
      onChoose: (address, cx) => send(this.agentAt(address), cx),
    });
    return h_flex().id(`${id}-group`).flex_none().items_center().on_click((_e, cx) => cx.stop_propagation()).child(chooser);
  },

  // Delivery goes through `hc`, which reaches a busy agent's session too.
  deliver(agent, message, cx, done) {
    if (!agent || this.mutating) return;
    if (agent.isNew) { this.startAgent(agent, message); done?.(); cx.notify(); return; }
    const key = this.spaceKey;
    this.mutating = true;
    this.error = null;
    cx.notify();
    cx.spawn(async (cx) => {
      try {
        const result = await hc(this.hcArgs(agent, message));
        if (result.code !== 0) throw new Error(result.stderr || "Agent delivery failed");
        if (key === this.spaceKey) {
          this.notice = agent.spawn ? `Started a sub-agent under ${agent.parentName}.` : `Sent to ${agentName(agent)}.`;
          done?.();
        }
      } catch (e) {
        if (key === this.spaceKey) this.error = e.message;
      } finally {
        this.mutating = false;
        cx.notify();
      }
    });
  },

  sendUnresolved(agent, cx) {
    this.deliver(agent, unresolvedMessage(this.pr), cx);
  },

  // Like Deploys' investigate icon: splits an agyyolo agent into the active
  // space's shown tab, no picker, no editing — just the skill for a human
  // review vs. a bot's, with the review id `gh pr view --json reviews` shows.
  addressReview(entry) {
    const target = this.target();
    const space = spaces().find((s) => s.active);
    if (!target || !space) return;
    const command = isBot(who(entry)) ? "/pr-babysit" : "/pr-review-response";
    const argv = [...AGENT_ARGV, `${command} ${entry.id}`];
    const running = terminals().some((tm) => tm.state === "live" && spaceOf(tm) === space.id && tm.argv?.join("\0") === argv.join("\0"));
    if (running) return;
    const tab = space.tabs?.find((tb) => tb.active);
    const tabPanes = panes().filter((p) => p.tab === tab?.id && p.terminal);
    const pane = tabPanes.find((p) => p.cwd === target.cwd) ?? tabPanes[0];
    if (pane) run("pane.split", { direction: "right", pane: pane.pane, argv });
  },

  sendAgent(cx) {
    const composer = this.composer;
    const agent = this.agentAt(this.agentTarget);
    const message = commentMessage(this.pr, this.pr.repository, composer, this.editor.value());
    this.deliver(agent, message, cx, () => {
      if (this.composer !== composer) return;
      this.composer = null;
    });
  },
};
