export interface DiffSegment {
  type: "equal" | "add" | "remove";
  value: string;
}

/** Word-level diff (GitHub PR / suggestion mode style) */
export function diffWords(oldText: string, newText: string): DiffSegment[] {
  const a = tokenize(oldText);
  const b = tokenize(newText);
  const lcs = buildLcsTable(a, b);
  const raw: Array<{ type: "equal" | "add" | "remove"; token: string }> = [];

  let i = a.length;
  let j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      raw.unshift({ type: "equal", token: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      raw.unshift({ type: "add", token: b[j - 1] });
      j--;
    } else {
      raw.unshift({ type: "remove", token: a[i - 1] });
      i--;
    }
  }

  const merged: DiffSegment[] = [];
  for (const item of raw) {
    const last = merged[merged.length - 1];
    if (last && last.type === item.type) {
      last.value += item.token;
    } else {
      merged.push({ type: item.type, value: item.token });
    }
  }
  return merged;
}

function tokenize(text: string): string[] {
  const plain = stripHtml(text);
  if (!plain.trim()) return [];
  return plain.split(/(\s+)/).filter((t) => t.length > 0);
}

function stripHtml(html: string): string {
  if (typeof document !== "undefined") {
    const el = document.createElement("div");
    el.innerHTML = html;
    return (el.textContent || el.innerText || "").replace(/\s+/g, " ").trim();
  }
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildLcsTable(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

export function plainTextFromHtml(html: string): string {
  return stripHtml(html);
}
