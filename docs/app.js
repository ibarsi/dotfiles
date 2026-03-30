const content = document.querySelector("#content");
const statsNode = document.querySelector("#stats");
const searchNode = document.querySelector("#search");
const tabContainer = document.querySelector("#section-filter");
const sectionTemplate = document.querySelector("#section-template");
const cardTemplate = document.querySelector("#card-template");
const footerHash = document.querySelector("#footer-hash");

let activeFilter = "all";

const sectionMeta = {
  aliases: {
    label: "Shell surface",
    title: "Aliases",
    empty: "No aliases matched the current filter.",
  },
  functions: {
    label: "Shell surface",
    title: "Functions",
    empty: "No functions matched the current filter.",
  },
  git: {
    label: "Version control",
    title: "Git shortcuts",
    empty: "No git shortcuts matched the current filter.",
  },
  features: {
    label: "Repo capabilities",
    title: "Features",
    empty: "No features matched the current filter.",
  },
  tasks: {
    label: "Automation",
    title: "Mise tasks",
    empty: "No tasks matched the current filter.",
  },
  bootstrap_links: {
    label: "Bootstrap",
    title: "Managed links",
    empty: "No bootstrap links matched the current filter.",
  },
};

const loadData = async () => {
  if (window.DOTFILES_DOCS_DATA) {
    return window.DOTFILES_DOCS_DATA;
  }

  const response = await fetch("./site-data.json");
  if (!response.ok) {
    throw new Error(`Failed to load docs data: ${response.status}`);
  }
  return response.json();
};

const data = await loadData();

const buildSearchText = (item, section) => {
  switch (section) {
    case "aliases":
      return [item.name, item.command, item.group, item.source].join(" ").toLowerCase();
    case "functions":
      return [item.name, item.summary, item.usage, item.source].join(" ").toLowerCase();
    case "git":
      return [item.name, item.command, item.summary, item.kind, item.source].join(" ").toLowerCase();
    case "features":
      return [item.title, item.summary, item.details.join(" "), item.source].join(" ").toLowerCase();
    case "tasks":
      return [item.name, item.description, item.run.join(" "), item.source].join(" ").toLowerCase();
    case "bootstrap_links":
      return [item.source_path, item.target_path, item.source].join(" ").toLowerCase();
    default:
      return "";
  }
};

const cardForItem = (item, section) => {
  const card = cardTemplate.content.firstElementChild.cloneNode(true);
  const title = card.querySelector("h3");
  const badge = card.querySelector(".badge");
  const summary = card.querySelector(".summary");
  const command = card.querySelector(".command");
  const code = command.querySelector("code");
  const detailList = card.querySelector(".detail-list");
  const meta = card.querySelector(".meta");

  if (section === "aliases") {
    title.textContent = item.name;
    badge.textContent = item.group || item.source_kind;
    summary.textContent = item.source_kind;
    code.textContent = item.command;
    meta.textContent = item.source;
  } else if (section === "functions") {
    title.textContent = item.name;
    badge.textContent = "function";
    summary.textContent = item.summary;
    code.textContent = item.usage || item.name;
    meta.textContent = item.source;
  } else if (section === "git") {
    title.textContent = item.name;
    badge.textContent = item.kind;
    summary.textContent = item.summary;
    code.textContent = item.command;
    meta.textContent = item.source;
  } else if (section === "features") {
    title.textContent = item.title;
    badge.textContent = "feature";
    summary.textContent = item.summary;
    command.remove();
    item.details.forEach((detail) => {
      const li = document.createElement("li");
      li.textContent = detail;
      detailList.append(li);
    });
    meta.textContent = item.source;
  } else if (section === "tasks") {
    title.textContent = item.name;
    badge.textContent = "mise task";
    summary.textContent = item.description;
    code.textContent = item.run.join("\n");
    meta.textContent = item.source;
  } else if (section === "bootstrap_links") {
    title.textContent = item.target_path;
    badge.textContent = "symlink";
    summary.textContent = item.source_path;
    code.textContent = `${item.source_path} → ${item.target_path}`;
    meta.textContent = item.source;
  }

  if (!detailList.children.length) {
    detailList.remove();
  }
  if (command.parentNode && !code?.textContent) {
    command.remove();
  }

  return card;
};

const renderStats = () => {
  const pairs = [
    [data.stats.aliases, "aliases"],
    [data.stats.functions, "functions"],
    [data.stats.git, "git"],
    [data.stats.features, "features"],
    [data.stats.tasks, "tasks"],
    [data.stats.bootstrap_links, "links"],
    [data.stats.brews, "brews"],
    [data.stats.casks, "casks"],
  ];
  statsNode.textContent = pairs.map(([n, l]) => `${n} ${l}`).join(" · ");
  if (footerHash) {
    footerHash.textContent = `${data.source_hash} · ${data.git_revision.slice(0, 8)}`;
  }
};

const renderSection = (section, items) => {
  const node = sectionTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector(".section-kicker").textContent = sectionMeta[section].label;
  node.querySelector("h2").textContent = sectionMeta[section].title;
  node.querySelector(".section-count").textContent = `(${items.length})`;
  const cards = node.querySelector(".cards");

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = sectionMeta[section].empty;
    cards.append(empty);
    return node;
  }

  items.forEach((item) => cards.append(cardForItem(item, section)));
  return node;
};

const render = () => {
  const query = searchNode.value.trim().toLowerCase();
  content.replaceChildren();

  Object.keys(sectionMeta).forEach((section) => {
    if (activeFilter !== "all" && section !== activeFilter) {
      return;
    }
    const items = data[section].filter((item) => {
      if (!query) {
        return true;
      }
      return buildSearchText(item, section).includes(query);
    });
    content.append(renderSection(section, items));
  });
};

/* ── tab navigation ──────────────────────────────── */
tabContainer.addEventListener("click", (e) => {
  const tab = e.target.closest(".tab");
  if (!tab) return;

  tabContainer.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");
  activeFilter = tab.dataset.value;
  render();
});

/* ── ⌘K shortcut ──────────────────────────────────── */
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    searchNode.focus();
    searchNode.select();
  }
});

renderStats();
render();
searchNode.addEventListener("input", render);
