// Matching core for the search popup (main.js). No imports, plain substring
// matching only (never a RegExp built from user input, so "a.b(" matches
// literally instead of throwing or matching as a pattern). Tested with
// node --test herdr-app/mods/search/search.test.mjs

// Rank order: a hit's field is the weakest-matching word's field, so a name
// match always outranks a screen match, which always outranks scrollback.
// FIELDS is checked in this order, so a word present in both "screen" and
// "scrollback" (hc read --lines includes the screen in its history) is
// reported as "screen", never double-counted as "scrollback".
export const FIELDS = ["name", "cwd", "screen", "scrollback"];

export function words(query) {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

// First (lowest-rank) field of `entry` containing `word`, case-insensitive.
function bestField(entry, word) {
  for (let rank = 0; rank < FIELDS.length; rank++) {
    const text = entry[FIELDS[rank]] ?? "";
    const at = text.toLowerCase().indexOf(word);
    if (at !== -1) return { field: FIELDS[rank], rank, at };
  }
  return null;
}

// The first line of `text` containing `word`, trimmed to `width` chars
// centered on the hit so a 10k-char minified line doesn't become one giant row.
export function snippet(text, word, width = 120) {
  if (!text) return null;
  const w = word.toLowerCase();
  for (const line of text.split("\n")) {
    const at = line.toLowerCase().indexOf(w);
    if (at !== -1) return clip(line, at, word.length, width);
  }
  return null;
}

function clip(line, at, len, width) {
  if (line.length <= width) return { line, at, len };
  const half = Math.floor((width - len) / 2);
  let start = Math.max(0, at - half);
  const end = Math.min(line.length, start + width);
  start = Math.max(0, end - width);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < line.length ? "…" : "";
  return { line: prefix + line.slice(start, end) + suffix, at: at - start + prefix.length, len };
}

// Every word in `query` must appear somewhere in `entry`; the hit's field and
// rank come from the weakest word (the one found in the worst field), and its
// snippet highlights that word.
export function match(entry, query) {
  const ws = words(query);
  if (ws.length === 0) return null;
  let worst = null;
  let worstWord = null;
  for (const w of ws) {
    const found = bestField(entry, w);
    if (!found) return null;
    if (!worst || found.rank > worst.rank) {
      worst = found;
      worstWord = w;
    }
  }
  const text = entry[worst.field] ?? "";
  const snip = snippet(text, worstWord) ?? { line: text.slice(0, 120), at: 0, len: 0 };
  return { address: entry.address, field: worst.field, rank: worst.rank, line: snip.line, at: snip.at, len: snip.len };
}

// Hits sorted by rank (name first, scrollback last), input order within a rank.
// An empty/whitespace-only query lists every entry, by name, in input order.
export function search(entries, query) {
  if (words(query).length === 0) {
    return entries.map((e) => ({ address: e.address, field: FIELDS[0], rank: 0, line: e.name, at: 0, len: 0 }));
  }
  return entries.map((e) => match(e, query)).filter(Boolean).sort((a, b) => a.rank - b.rank);
}

// hc read strips ANSI entirely (no escape codes survive, and the mod API has
// no per-cell color), so the preview panel can't reproduce real terminal
// colors. This is a readability heuristic over the plain text instead: shapes
// common in shell output, not real syntax highlighting. Order matters — a
// diff line always wins over an incidental "error"/"ok" substring in it.
export function lineKind(line) {
  const s = line.trim();
  if (/^\+(?!\+\+)/.test(s)) return "add";
  if (/^-(?!--)/.test(s)) return "remove";
  if (s.startsWith("➜") || /^[$#]\s/.test(s)) return "prompt";
  if (/error|fail|✗|✖/i.test(s)) return "error";
  if (/^ok\b|success|✓/i.test(s)) return "ok";
  return null;
}
