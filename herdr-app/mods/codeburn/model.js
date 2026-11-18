// Pure data shaping for the Code Burn panel: no imports, no gpui, no exec.
// Takes codeburn's menubar-json/export output and turns it into what the
// panel renders. Tested standalone with `node --test model.test.mjs`.

// First match wins; device is a regex on the codeburn device name. Everything
// not matched here is work (Vertex). See codeburn/README.md for the pricing
// override policy this mirrors.
export const PERSONAL = [{ device: /MacBook/i, provider: "codex" }];

export const RANGES = [
  { label: "Today", period: "today" },
  { label: "7 days", period: "week" },
  { label: "30 days", period: "30days" },
  { label: "Month", period: "month" },
  { label: "All", period: "all" },
];

export function isPersonal(deviceName, provider) {
  return PERSONAL.some((p) => p.device.test(deviceName ?? "") && p.provider === provider);
}

export function providerOfModel(name) {
  const n = name ?? "";
  if (/gemini/i.test(n)) return "gemini";
  if (/grok/i.test(n)) return "grok";
  if (/opus|sonnet|haiku|fable|claude/i.test(n)) return "claude";
  if (/gpt|codex|o\d/i.test(n)) return "codex";
  return "other";
}

export function splitSpend(combinedDevices) {
  let work = 0;
  let personal = 0;
  const providers = new Set();
  for (const device of combinedDevices ?? []) {
    for (const pd of device.payload?.current?.providerDetails ?? []) {
      if (isPersonal(device.name, pd.id)) personal += pd.cost;
      else work += pd.cost;
      if (pd.cost > 0) providers.add(pd.id);
    }
  }
  return { work, personal, providers };
}

function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

export function dailyWork(combinedDevices, days = 30, today = new Date()) {
  const series = new Array(days).fill(0);
  const indexByDate = new Map();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    indexByDate.set(dateKey(d), i);
  }
  let unclassified = 0;
  for (const device of combinedDevices ?? []) {
    for (const day of device.payload?.history?.daily ?? []) {
      const idx = indexByDate.get(day.date);
      if (idx === undefined) continue;
      let classifiedCost = 0;
      for (const m of day.topModels ?? []) {
        classifiedCost += m.cost;
        if (!isPersonal(device.name, providerOfModel(m.name))) series[idx] += m.cost;
      }
      const remainder = day.cost - classifiedCost;
      if (remainder > 0.005) {
        series[idx] += remainder;
        unclassified += remainder;
      }
    }
  }
  return { series, unclassified };
}

export function projectMonth(mtd, now = new Date()) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  // Rounded to the nearest whole day: a raw ms difference drifts by the DST
  // hour on any month that crosses a transition (e.g. Nov 1, 2026 in the US).
  const elapsedDays = Math.max(1, Math.round((now - monthStart) / 86400000));
  return (mtd / elapsedDays) * daysInMonth;
}

export function money(n) {
  return `$${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function tokens(n) {
  const v = n ?? 0;
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return `${v}`;
}

export function ago(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
