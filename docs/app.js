const content = document.querySelector("#content");
const statsNode = document.querySelector("#stats");
const searchNode = document.querySelector("#search");
const sectionFilterNode = document.querySelector("#section-filter");
const sectionTemplate = document.querySelector("#section-template");
const cardTemplate = document.querySelector("#card-template");

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
  const detailList = card.querySelector(".detail-list");
  const meta = card.querySelector(".meta");

  if (section === "aliases") {
    title.textContent = item.name;
    badge.textContent = item.group || item.source_kind;
    summary.textContent = item.source_kind;
    command.textContent = item.command;
    meta.textContent = `Source: ${item.source}`;
  } else if (section === "functions") {
    title.textContent = item.name;
    badge.textContent = "function";
    summary.textContent = item.summary;
    command.textContent = item.usage || item.name;
    meta.textContent = `Source: ${item.source}`;
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
    meta.textContent = `Source: ${item.source}`;
  } else if (section === "tasks") {
    title.textContent = item.name;
    badge.textContent = "mise task";
    summary.textContent = item.description;
    command.textContent = item.run.join("\n");
    meta.textContent = `Source: ${item.source}`;
  } else if (section === "bootstrap_links") {
    title.textContent = item.target_path;
    badge.textContent = "symlink";
    summary.textContent = item.source_path;
    command.textContent = `${item.source_path} -> ${item.target_path}`;
    meta.textContent = `Source: ${item.source}`;
  }

  if (!detailList.children.length) {
    detailList.remove();
  }
  if (!command.textContent) {
    command.remove();
  }

  return card;
};

const renderStats = () => {
  const entries = [
    `${data.stats.aliases} aliases`,
    `${data.stats.functions} functions`,
    `${data.stats.features} features`,
    `${data.stats.tasks} tasks`,
    `${data.stats.bootstrap_links} managed links`,
    `${data.stats.brews} brews`,
    `${data.stats.casks} casks`,
  ];
  statsNode.textContent = `${entries.join(" • ")} • Source hash ${data.source_hash} • Git ${data.git_revision.slice(0, 12)}`;
};

const renderSection = (section, items) => {
  const node = sectionTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector(".section-kicker").textContent = sectionMeta[section].label;
  node.querySelector("h2").textContent = sectionMeta[section].title;
  node.querySelector(".section-count").textContent = `${items.length} item${items.length === 1 ? "" : "s"}`;
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
  const sectionFilter = sectionFilterNode.value;
  content.replaceChildren();

  Object.keys(sectionMeta).forEach((section) => {
    if (sectionFilter !== "all" && section !== sectionFilter) {
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

renderStats();
render();
searchNode.addEventListener("input", render);
sectionFilterNode.addEventListener("change", render);
