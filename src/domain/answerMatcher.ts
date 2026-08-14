/**
 * Lenient matching of a recognized transcript against an animal's accepted answers
 * (FR-013). Tuned to accept a young child's approximate pronunciation (SC-004) while
 * rejecting clearly unrelated words (SC-005). Runs on the on-device transcript only.
 */

/** Collapse runs of the same letter so "muuuuuu" and "muu" compare equal-ish. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ') // drop punctuation/digits, keep any Unicode letter
    .replace(/(.)\1+/gu, '$1') // collapse repeated letters: muuu -> mu, мууу -> му
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
  // A 1-char target is within edit-distance 1 of almost any single letter, so it would
  // accept unrelated sounds ('m' ← 'n'/'a'/…). Require an exact match for such targets.
  if (target.length < 2) return false;
  const distance = editDistance(token, target);
  // Accept small edits; short targets (<=3) allow 1 edit, longer scale ~30%.
  const threshold = Math.max(1, Math.floor(target.length * 0.3));
  return distance <= threshold;
}

/**
 * Reduce a Latin string to a consonant skeleton for cross-lingual phonetic comparison.
 * Used when the English acoustic model transcribes Ukrainian speech as multi-word English
 * approximations (e.g. "cook a rico" ≈ "kukuriku"). Only strips Latin vowels so Cyrillic
 * strings pass through unchanged and cannot false-match Latin transcripts.
 */
function consonantSkeleton(s: string): string {
  return s
    .toLowerCase()
    .replace(/[aeiou]/g, '')  // strip Latin vowels only
    .replace(/[ck]/g, 'k')   // merge velar stops
    .replace(/[fv]/g, 'f')   // merge labiodentals
    .replace(/[sz]/g, 's')   // merge sibilants
    .replace(/\s+/g, '');    // join words into a single frame
}

/** True when the consonant skeleton of the full transcript matches that of target. */
function phoneticMatch(transcript: string, target: string): boolean {
  const skT = consonantSkeleton(transcript);
  const skA = consonantSkeleton(target);
  if (!skT || !skA) return false;
  if (skT === skA) return true;
  // A single-consonant skeleton ('moo'→'m') is one edit from almost any other ('no'→'n'),
  // so require an exact skeleton match when either side is that short. Longer frames keep the
  // lenient ~1-edit tolerance the Ukrainian phonetic approximation relies on ("cook a rico").
  const minLen = Math.min(skT.length, skA.length);
  if (minLen < 2) return false;
  const d = editDistance(skT, skA);
  return d <= Math.max(1, Math.floor(minLen * 0.3));
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
    // Skip substring matching for 1-char targets — 'm' would match any word containing an 'm'.
    if (target.length >= 2 && normTranscript.includes(target)) return true;
    if (fuzzyEquals(normTranscript, target)) return true;
    for (const word of words) {
      if (fuzzyEquals(word, target)) return true;
    }
    if (phoneticMatch(normTranscript, target)) return true;
  }
  return false;
}
