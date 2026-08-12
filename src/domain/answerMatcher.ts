/**
 * Lenient matching of a recognized transcript against an animal's accepted answers
 * (FR-013). Tuned to accept a young child's approximate pronunciation (SC-004) while
 * rejecting clearly unrelated words (SC-005). Runs on the on-device transcript only.
 */

/** Collapse runs of the same letter so "muuuuuu" and "muu" compare equal-ish. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ') // drop punctuation/digits
    .replace(/(.)\1+/g, '$1') // collapse repeated letters: muuu -> mu
    .replace(/\s+/g, ' ')
    .trim();
}

/** Classic Levenshtein edit distance. */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

/** True if `token` is within the lenient edit-distance threshold of `target`. */
function fuzzyEquals(token: string, target: string): boolean {
  if (!token || !target) return false;
  if (token === target) return true;
  const distance = editDistance(token, target);
  // Accept small edits; short targets (<=3) allow 1 edit, longer scale ~30%.
  const threshold = Math.max(1, Math.floor(target.length * 0.3));
  return distance <= threshold;
}

/**
 * Returns true if the transcript is a lenient match for any accepted answer.
 * A match occurs when the whole normalized transcript, or any single word in it,
 * fuzzily equals any normalized accepted answer, or the accepted phrase appears
 * as a substring.
 */
export function isAnswerCorrect(transcript: string, acceptedAnswers: string[]): boolean {
  const normTranscript = normalize(transcript);
  if (!normTranscript) return false;
  const words = normTranscript.split(' ');

  for (const raw of acceptedAnswers) {
    const target = normalize(raw);
    if (!target) continue;
    if (normTranscript === target) return true;
    if (normTranscript.includes(target)) return true;
    if (fuzzyEquals(normTranscript, target)) return true;
    for (const word of words) {
      if (fuzzyEquals(word, target)) return true;
    }
  }
  return false;
}
