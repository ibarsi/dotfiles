const content = document.querySelector("#content");
const statsNode = document.querySelector("#stats");
const searchNode = document.querySelector("#search");
const tabContainer = document.querySelector("#section-filter");
const sectionTemplate = document.querySelector("#section-template");
const cardTemplate = document.querySelector("#card-template");
const footerHash = document.querySelector("#footer-hash");

const STORAGE_KEY = "dotfiles-docs-section";
const filters = ["all", "aliases", "functions", "git", "features", "tasks", "bootstrap_links"];

const sectionMeta = {
  aliases: {
    label: "Shell surface",
    title: "Aliases",
    empty: "No aliases matched this search.",
    layout: "commands",
  },
  functions: {
    label: "Shell surface",
    title: "Functions",
    empty: "No functions matched this search.",
    layout: "commands",
  },
  git: {
    label: "Version control",
    title: "Git shortcuts",
    empty: "No git shortcuts matched this search.",
    layout: "commands",
  },
  features: {
    label: "Repo capabilities",
    title: "Features",
    empty: "No repo features matched this search.",
    layout: "cards",
  },
  tasks: {
    label: "Automation",
    title: "Mise tasks",
    empty: "No mise tasks matched this search.",
    layout: "tasks",
  },
  bootstrap_links: {
    label: "Bootstrap",
    title: "Managed links",
    empty: "No bootstrap links matched this search.",
    layout: "links",
  },
};

const safeLocalStorage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Local files and strict browser settings can block storage.
    }
  },
};

const initialFilter = () => {
  const hash = window.location.hash.replace("#", "");
  if (filters.includes(hash)) return hash;

  const stored = safeLocalStorage.get(STORAGE_KEY);
  if (filters.includes(stored)) return stored;

  return "all";
};

let activeFilter = initialFilter();
let data;

const make = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
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

const buildSearchText = (item, section) => {
  switch (section) {
    case "aliases":
      return [item.name, item.command, item.group, item.source, item.source_kind].join(" ").toLowerCase();
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

const commandTextFor = (item, section) => {
  if (section === "aliases" || section === "git") return item.command;
  if (section === "functions") return item.usage || item.name;
  if (section === "tasks") return item.run.join("\n");
  if (section === "bootstrap_links") return `${item.source_path} -> ${item.target_path}`;
  return "";
};

const copyButton = (value) => {
  const button = make("button", "copy-button", "Copy");
  button.type = "button";
  button.addEventListener("click", async () => {
    if (!navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(value);
      button.textContent = "Copied";
      button.classList.add("is-copied");
      window.setTimeout(() => {
        button.textContent = "Copy";
        button.classList.remove("is-copied");
      }, 1400);
    } catch {
      button.textContent = "Blocked";
      window.setTimeout(() => {
        button.textContent = "Copy";
      }, 1400);
    }
  });
  return button;
};

const commandRow = (item, section) => {
  const row = make("article", "command-row");
  const main = make("div", "command-row-main");
  const title = make("h3", "command-title", item.name);
  const summary = make(
    "p",
    "command-summary",
    section === "aliases" ? item.group || item.source_kind : item.summary || item.kind,
  );
  const command = make("code", "command-code", commandTextFor(item, section));
  const meta = make("p", "meta", item.source);

  main.append(title, summary, meta);
  row.append(main, command, copyButton(command.textContent));
  return row;
};

const featureCard = (item) => {
  const card = cardTemplate.content.firstElementChild.cloneNode(true);
  const title = card.querySelector("h3");
  const badge = card.querySelector(".badge");
  const summary = card.querySelector(".summary");
  const command = card.querySelector(".command");
  const detailList = card.querySelector(".detail-list");
  const meta = card.querySelector(".meta");

  title.textContent = item.title;
  badge.textContent = "feature";
  summary.textContent = item.summary;
  command.remove();
  item.details.forEach((detail) => {
    detailList.append(make("li", "", detail));
  });
  meta.textContent = item.source;

  return card;
};

const taskRow = (item) => {
  const row = make("article", "task-row");
  const main = make("div", "task-row-main");
  const title = make("h3", "task-title", item.name);
  const summary = make("p", "task-summary", item.description);
  const meta = make("p", "meta", item.source);
  const command = make("code", "task-command", item.run.join("\n"));

  main.append(title, summary, meta);
  row.append(main, command, copyButton(command.textContent));
  return row;
};

const linkRow = (item) => {
  const row = make("article", "link-row");
  const source = make("div", "link-row-main");
  const target = make("div", "link-row-main");
  const sourceTitle = make("h3", "link-title", item.source_path);
  const targetTitle = make("h3", "link-title", item.target_path);
  const sourceMeta = make("p", "link-summary", item.source);
  const targetMeta = make("code", "link-code", `${item.source_path} -> ${item.target_path}`);

  source.append(sourceTitle, sourceMeta);
  target.append(targetTitle, targetMeta);
  row.append(source, make("span", "link-arrow", "->"), target);
  return row;
};

const emptyState = (message) => {
  const empty = make("div", "empty");
  empty.append(make("strong", "", "No matches"), make("p", "", message));
  return empty;
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

  statsNode.replaceChildren(
    ...pairs.map(([value, label]) => {
      const stat = make("div", "stat");
      stat.append(make("span", "stat-value", value), make("span", "stat-label", label));
      return stat;
    }),
  );

  if (footerHash) {
    footerHash.textContent = `${data.source_hash} / ${data.git_revision.slice(0, 8)}`;
  }
};

const renderItems = (section, items) => {
  const layout = sectionMeta[section].layout;
  const body = make("div", layout === "cards" ? "cards" : `${layout.slice(0, -1)}-list`);

  if (!items.length) {
    body.append(emptyState(sectionMeta[section].empty));
    return body;
  }

  items.forEach((item) => {
    if (layout === "commands") body.append(commandRow(item, section));
    if (layout === "cards") body.append(featureCard(item));
    if (layout === "tasks") body.append(taskRow(item));
    if (layout === "links") body.append(linkRow(item));
  });

  return body;
};

const renderSection = (section, items) => {
  const node = sectionTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector(".section-kicker").textContent = sectionMeta[section].label;
  node.querySelector("h2").textContent = sectionMeta[section].title;
  node.querySelector(".section-count").textContent = items.length;

  const body = node.querySelector(".section-body");
  body.replaceChildren(renderItems(section, items));
  return node;
};

const matchingItems = (section, query) => {
  return data[section].filter((item) => {
    if (!query) return true;
    return buildSearchText(item, section).includes(query);
  });
};

const render = () => {
  const query = searchNode.value.trim().toLowerCase();
  const sections = Object.keys(sectionMeta).filter((section) => activeFilter === "all" || activeFilter === section);

  content.replaceChildren(...sections.map((section) => renderSection(section, matchingItems(section, query))));
};

const syncTabs = () => {
  tabContainer.querySelectorAll(".tab").forEach((tab) => {
    const isActive = tab.dataset.value === activeFilter;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });
};

const setActiveFilter = (value, { replaceHash = false } = {}) => {
  if (!filters.includes(value)) return;

  activeFilter = value;
  safeLocalStorage.set(STORAGE_KEY, activeFilter);
  syncTabs();
  render();

  const nextHash = value === "all" ? window.location.pathname : `#${value}`;
  try {
    if (replaceHash) {
      window.history.replaceState(null, "", nextHash);
    } else {
      window.history.pushState(null, "", nextHash);
    }
  } catch {
    // History mutations can be blocked when the file is opened directly.
  }
};

tabContainer.addEventListener("click", (event) => {
  const tab = event.target.closest(".tab");
  if (!tab) return;
  setActiveFilter(tab.dataset.value);
});

tabContainer.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

  event.preventDefault();
  const tabs = [...tabContainer.querySelectorAll(".tab")];
  const currentIndex = tabs.findIndex((tab) => tab.dataset.value === activeFilter);
  let nextIndex = currentIndex;

  if (event.key === "ArrowLeft") nextIndex = Math.max(0, currentIndex - 1);
  if (event.key === "ArrowRight") nextIndex = Math.min(tabs.length - 1, currentIndex + 1);
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = tabs.length - 1;

  tabs[nextIndex].focus();
  setActiveFilter(tabs[nextIndex].dataset.value);
});

window.addEventListener("popstate", () => {
  activeFilter = initialFilter();
  syncTabs();
  render();
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchNode.focus();
    searchNode.select();
  }
});

const showError = (error) => {
  const errorState = make("div", "error-state");
  errorState.append(
    make("strong", "", "Docs data failed to load"),
    make("p", "", `${error.message}. Regenerate the site data or serve the docs from the repo root.`),
  );
  content.replaceChildren(errorState);
};

try {
  data = await loadData();
  renderStats();
  syncTabs();
  render();
  setActiveFilter(activeFilter, { replaceHash: true });
  searchNode.addEventListener("input", render);
} catch (error) {
  showError(error);
}
