/**
 * Pure, zero-dependency cross-lingual & typo-tolerant search engine for InstantMenu.
 * Supports Unicode normalization, Macedonian/Cyrillic <-> Latin transliteration,
 * phonetic consonant folding, Damerau-Levenshtein fuzzy matching, and weighted scoring.
 */

export interface IndexedField {
  norm: string;
  normCollapsed: string;
  normTokens: string[];
  canonical: string;
  canonicalCollapsed: string;
  canonicalTokens: string[];
  phonetic: string;
  phoneticCollapsed: string;
  phoneticTokens: string[];
}

export interface PreparedQueryToken {
  raw: string;
  norm: string;
  canonical: string;
  phonetic: string;
  hasDigits: boolean;
}

export interface IndexedItemFields {
  primaryFields: IndexedField[];
  categoryFields: IndexedField[];
  descriptionFields: IndexedField[];
  localeSearchBlobs: Record<string, { spaced: string; collapsed: string }>;
}

export interface TokenScoreResult {
  score: number;
  matchedPrimaryExactOrSub: boolean;
}

const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
  // Macedonian & standard Cyrillic single characters
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  з: 'z',
  и: 'i',
  ј: 'j',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  // Macedonian & Slavic digraphs / specials
  ѓ: 'gj',
  ѕ: 'dz',
  љ: 'lj',
  њ: 'nj',
  ќ: 'kj',
  ч: 'ch',
  џ: 'dz',
  ш: 'sh',
  ж: 'zh',
  щ: 'sht',
  ю: 'yu',
  я: 'ya',
  // Additional Cyrillic keyboard fallbacks
  й: 'j',
  ё: 'e',
  ы: 'i',
  э: 'e',
  ъ: '',
  ь: '',
  і: 'i',
  ї: 'ji',
  є: 'je',
  // South-Slavic Latin stroke letter not decomposed by NFD
  đ: 'dj',
};

/**
 * A. Text & Punctuation Normalization
 * - Lowercases input.
 * - Strips diacritics via Unicode NFD on non-Cyrillic characters while preserving
 *   precomposed Cyrillic letters (ѓ, ќ, й, ё) so transliteration stays accurate.
 * - Strips internal apostrophes ("Broker's" -> "brokers") and replaces hyphens,
 *   underscores, slashes, and punctuation with single spaces ("Coca-Cola" -> "coca cola").
 */
export function normalizeText(input: string): string {
  if (!input) return '';

  const lowered = input.toLowerCase();

  // Strip combining marks on non-Cyrillic segments so "Jägermeister" -> "jagermeister",
  // "Piña" -> "pina", "Tikveš" -> "tikves", while preserving Cyrillic "ѓ" & "ќ".
  const strippedDiacritics = lowered.replace(/[^\u0400-\u04ff]+/g, (segment) =>
    segment.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  );

  // Join internal apostrophes inside words ("Jack Daniel's" -> "jack daniels")
  const joinedApostrophes = strippedDiacritics.replace(
    /([\p{L}\p{N}])['’ʼ`´]([\p{L}\p{N}])/gu,
    '$1$2'
  );

  // Replace hyphens, underscores, slashes, and all remaining non-alphanumeric punctuation with spaces
  return joinedApostrophes
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Generates collapsed no-space variant ("coca cola" -> "cocacola").
 */
export function toCollapsed(normalizedText: string): string {
  return normalizedText.replace(/\s+/g, '');
}

/**
 * B1. Cyrillic <-> Latin Transliteration
 * Maps Macedonian & standard Cyrillic characters to canonical Latin equivalents.
 */
export function toCanonicalLatin(input: string): string {
  const norm = normalizeText(input);
  if (!norm) return '';

  let out = '';
  for (let i = 0; i < norm.length; i++) {
    const ch = norm[i];
    const mapped = CYRILLIC_TO_LATIN_MAP[ch];
    out += mapped !== undefined ? mapped : ch;
  }

  return out.replace(/\s+/g, ' ').trim();
}

/**
 * B2. Phonetic Folding
 * Collapses common cross-language consonant variations to a shared root:
 * - Double consonants collapsed (ss->s, pp->p, tt->t, ll->l, cc->c)
 * - sht->st, sh->s, ch->c, zh->z, ph->f, wh->v, x->ks, q->k, w->v, y->i
 * - c -> k except before e/i ("coca cola" -> "koka kola", "cappuccino" -> "kapucino")
 */
export function toPhonetic(input: string): string {
  const canonical = toCanonicalLatin(input);
  if (!canonical) return '';

  let folded = canonical
    // 1. Collapse initial double consonants ("cappuccino" -> "capucino", "espresso" -> "espreso")
    .replace(/([bcdfghjklmnpqrstvwxz])\1+/g, '$1')
    // 2. Normalize common cross-language digraphs & letter variants
    .replace(/sht/g, 'st')
    .replace(/sh/g, 's')
    .replace(/ch/g, 'c')
    .replace(/zh/g, 'z')
    .replace(/ph/g, 'f')
    .replace(/wh/g, 'v')
    .replace(/gj/g, 'g')
    .replace(/kj/g, 'k')
    .replace(/lj/g, 'l')
    .replace(/nj/g, 'n')
    .replace(/dz/g, 'z')
    .replace(/x/g, 'ks')
    .replace(/q/g, 'k')
    .replace(/w/g, 'v')
    .replace(/y/g, 'i')
    // 3. Fold c -> k except before e or i
    .replace(/c(?![ei])/g, 'k')
    // 4. Collapse any newly adjacent duplicate consonants ("ck" -> "kk" -> "k")
    .replace(/([bcdfghjklmnpqrstvwxz])\1+/g, '$1');

  return folded.replace(/\s+/g, ' ').trim();
}

/**
 * C1. Length-scaled maximum edit distance thresholds:
 * - Length 1-2: 0 (exact or prefix match only)
 * - Length 3-4: 1
 * - Length 5-7: 2
 * - Length 8+:  2
 */
export function getMaxEditDistance(tokenLength: number): number {
  if (tokenLength <= 2) return 0;
  if (tokenLength <= 4) return 1;
  return 2;
}

// Reusable row buffers for zero-allocation Damerau-Levenshtein evaluation
let dlRowPrev2 = new Int16Array(64);
let dlRowPrev1 = new Int16Array(64);
let dlRowCurr = new Int16Array(64);

/**
 * C2. Damerau-Levenshtein Distance (Optimal String Alignment)
 * Counts insertions, deletions, substitutions, and adjacent transpositions as cost 1.
 */
export function damerauLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const lenA = a.length;
  const lenB = b.length;
  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  if (lenB + 1 > dlRowCurr.length) {
    const size = Math.max(lenB + 1, dlRowCurr.length * 2);
    dlRowPrev2 = new Int16Array(size);
    dlRowPrev1 = new Int16Array(size);
    dlRowCurr = new Int16Array(size);
  }

  for (let j = 0; j <= lenB; j++) {
    dlRowPrev1[j] = j;
  }

  for (let i = 1; i <= lenA; i++) {
    dlRowCurr[0] = i;
    const charA1 = a.charCodeAt(i - 1);
    const charA2 = i > 1 ? a.charCodeAt(i - 2) : -1;

    for (let j = 1; j <= lenB; j++) {
      const charB1 = b.charCodeAt(j - 1);
      const cost = charA1 === charB1 ? 0 : 1;

      const del = dlRowPrev1[j] + 1;
      const ins = dlRowCurr[j - 1] + 1;
      const sub = dlRowPrev1[j - 1] + cost;
      let best = del < ins ? (del < sub ? del : sub) : ins < sub ? ins : sub;

      if (i > 1 && j > 1 && charA1 === b.charCodeAt(j - 2) && charA2 === charB1) {
        const trans = dlRowPrev2[j - 2] + 1;
        if (trans < best) best = trans;
      }

      dlRowCurr[j] = best;
    }

    const temp = dlRowPrev2;
    dlRowPrev2 = dlRowPrev1;
    dlRowPrev1 = dlRowCurr;
    dlRowCurr = temp;
  }

  return dlRowPrev1[lenB];
}

/**
 * Builds precomputed normalized, canonical-Latin, phonetic, collapsed, and tokenized representations.
 */
export function buildIndexedField(text: string): IndexedField {
  const norm = normalizeText(text);
  const canonical = toCanonicalLatin(norm);
  const phonetic = toPhonetic(canonical);

  return {
    norm,
    normCollapsed: toCollapsed(norm),
    normTokens: norm ? norm.split(' ') : [],
    canonical,
    canonicalCollapsed: toCollapsed(canonical),
    canonicalTokens: canonical ? canonical.split(' ') : [],
    phonetic,
    phoneticCollapsed: toCollapsed(phonetic),
    phoneticTokens: phonetic ? phonetic.split(' ') : [],
  };
}

/**
 * Tokenizes and pre-folds a raw search query into PreparedQueryToken objects.
 */
export function prepareQueryTokens(rawQuery: string): PreparedQueryToken[] {
  const norm = normalizeText(rawQuery);
  if (!norm) return [];

  return norm.split(' ').map((rawToken) => {
    const canonical = toCanonicalLatin(rawToken);
    const phonetic = toPhonetic(canonical);
    return {
      raw: rawToken,
      norm: rawToken,
      canonical,
      phonetic,
      hasDigits: /\d/.test(rawToken),
    };
  });
}

/**
 * Computes best fuzzy edit distance (including mid-word prefix fuzzy matching)
 * between a query token and a list of target tokens. Returns null if no match within threshold.
 */
function findBestFuzzyDistance(
  queryStr: string,
  targetTokens: string[],
  hasDigits: boolean,
  maxDistanceOverride?: number
): number | null {
  if (!queryStr || hasDigits) return null;

  const qLen = queryStr.length;
  const allowedMax =
    maxDistanceOverride !== undefined ? maxDistanceOverride : getMaxEditDistance(qLen);
  if (allowedMax <= 0) return null;

  let bestDistance: number | null = null;

  for (const target of targetTokens) {
    // Avoid noisy fuzzy matches against 1-2 character stopwords or digit tokens
    if (target.length < 3 || /\d/.test(target)) continue;

    const effectiveMax = Math.min(allowedMax, getMaxEditDistance(target.length));
    if (effectiveMax <= 0) continue;

    // Full token fuzzy comparison when lengths are compatible
    if (Math.abs(target.length - qLen) <= effectiveMax) {
      const dist = damerauLevenshtein(queryStr, target);
      if (dist <= effectiveMax && (bestDistance === null || dist < bestDistance)) {
        bestDistance = dist;
        if (bestDistance === 1) return 1;
      }
    }

    // Prefix fuzzy matching when user is mid-typing a longer word (e.g. "espres" -> "espresso")
    if (target.length > qLen && qLen >= 3) {
      const prefixSlice = target.slice(0, qLen);
      const prefixDist = damerauLevenshtein(queryStr, prefixSlice);
      if (prefixDist <= effectiveMax && (bestDistance === null || prefixDist < bestDistance)) {
        bestDistance = prefixDist;
        if (bestDistance === 1) return 1;
      }
    }
  }

  return bestDistance;
}

/**
 * Scores a single query token against a primary field (item name or alias):
 * - Exact normalized match: +100
 * - Prefix match: +85
 * - Substring match: +70
 * - Canonical-Latin / phonetic match: +65
 * - Fuzzy token match: +(50 - editDistance * 12)
 */
function scorePrimaryField(q: PreparedQueryToken, field: IndexedField): number {
  if (!field.norm) return 0;

  // 1. Exact normalized token or collapsed match (+100)
  if (field.normTokens.includes(q.norm) || field.normCollapsed === q.norm) {
    return 100;
  }

  // 2. Normalized prefix match (+85)
  if (
    field.normTokens.some((t) => t.startsWith(q.norm)) ||
    field.normCollapsed.startsWith(q.norm)
  ) {
    return 85;
  }

  // 3. Normalized substring match (+70)
  if (q.norm.length >= 2 && (field.norm.includes(q.norm) || field.normCollapsed.includes(q.norm))) {
    return 70;
  }

  // 4. Canonical-Latin or Phonetic match (+65)
  if (q.canonical) {
    const canonicalHit =
      field.canonicalTokens.some((t) => t === q.canonical || t.startsWith(q.canonical)) ||
      field.canonicalCollapsed === q.canonical ||
      field.canonicalCollapsed.startsWith(q.canonical) ||
      (q.canonical.length >= 3 && field.canonicalCollapsed.includes(q.canonical));
    if (canonicalHit) return 65;
  }

  if (q.phonetic) {
    const phoneticHit =
      field.phoneticTokens.some((t) => t === q.phonetic || t.startsWith(q.phonetic)) ||
      field.phoneticCollapsed === q.phonetic ||
      field.phoneticCollapsed.startsWith(q.phonetic) ||
      (q.phonetic.length >= 3 && field.phoneticCollapsed.includes(q.phonetic));
    if (phoneticHit) return 65;
  }

  // 5. Damerau-Levenshtein Fuzzy Token Match: +(50 - editDistance * 12)
  const canonicalDist = findBestFuzzyDistance(q.canonical, field.canonicalTokens, q.hasDigits);
  const phoneticDist = findBestFuzzyDistance(q.phonetic, field.phoneticTokens, q.hasDigits);

  let bestDist: number | null = null;
  if (canonicalDist !== null && phoneticDist !== null) {
    bestDist = Math.min(canonicalDist, phoneticDist);
  } else {
    bestDist = canonicalDist ?? phoneticDist;
  }

  if (bestDist !== null && bestDist > 0) {
    return Math.max(10, 50 - bestDist * 12);
  }

  return 0;
}

/**
 * Scores a single query token against a category / sub-category / tag field (+40).
 */
function scoreCategoryField(q: PreparedQueryToken, field: IndexedField): number {
  if (!field.norm) return 0;

  if (
    field.normTokens.some((t) => t === q.norm || t.startsWith(q.norm)) ||
    field.normCollapsed === q.norm ||
    (q.norm.length >= 3 && field.norm.includes(q.norm))
  ) {
    return 40;
  }

  if (
    q.canonical &&
    (field.canonicalTokens.some((t) => t === q.canonical || t.startsWith(q.canonical)) ||
      field.canonicalCollapsed === q.canonical)
  ) {
    return 40;
  }

  if (
    q.phonetic &&
    (field.phoneticTokens.some((t) => t === q.phonetic || t.startsWith(q.phonetic)) ||
      field.phoneticCollapsed === q.phonetic)
  ) {
    return 40;
  }

  const canonicalDist = findBestFuzzyDistance(q.canonical, field.canonicalTokens, q.hasDigits);
  const phoneticDist = findBestFuzzyDistance(q.phonetic, field.phoneticTokens, q.hasDigits);
  if (canonicalDist !== null || phoneticDist !== null) {
    return 40;
  }

  return 0;
}

/**
 * Scores a single query token against an item description field (+20).
 */
function scoreDescriptionField(q: PreparedQueryToken, field: IndexedField): number {
  if (!field.norm) return 0;

  if (
    field.normTokens.some((t) => t === q.norm || t.startsWith(q.norm)) ||
    (q.norm.length >= 3 && field.norm.includes(q.norm))
  ) {
    return 20;
  }

  if (
    q.canonical &&
    (field.canonicalTokens.some((t) => t === q.canonical || t.startsWith(q.canonical)) ||
      (q.canonical.length >= 4 && field.canonical.includes(q.canonical)))
  ) {
    return 20;
  }

  if (
    q.phonetic &&
    (field.phoneticTokens.some((t) => t === q.phonetic || t.startsWith(q.phonetic)) ||
      (q.phonetic.length >= 4 && field.phonetic.includes(q.phonetic)))
  ) {
    return 20;
  }

  // Tight 1-edit fuzzy match on longer description words (5+ chars)
  if (q.canonical.length >= 5) {
    const dist =
      findBestFuzzyDistance(q.canonical, field.canonicalTokens, q.hasDigits, 1) ??
      findBestFuzzyDistance(q.phonetic, field.phoneticTokens, q.hasDigits, 1);
    if (dist !== null) {
      return 20;
    }
  }

  return 0;
}

export interface ItemScoreEvaluation {
  score: number;
  directActiveLocaleMatch: boolean;
}

/**
 * Evaluates all query tokens (AND logic across tokens) against a pre-indexed menu item.
 * Sums each token's best field score and checks whether the item also matched via direct
 * normalized substring in the active locale.
 */
export function evaluateIndexedItem(
  queryTokens: PreparedQueryToken[],
  itemFields: IndexedItemFields,
  activeLocale: string
): ItemScoreEvaluation | null {
  if (queryTokens.length === 0) return null;

  let totalScore = 0;

  for (const qToken of queryTokens) {
    let bestTokenScore = 0;

    for (const pf of itemFields.primaryFields) {
      const s = scorePrimaryField(qToken, pf);
      if (s > bestTokenScore) bestTokenScore = s;
      if (bestTokenScore === 100) break;
    }

    if (bestTokenScore < 40) {
      for (const cf of itemFields.categoryFields) {
        const s = scoreCategoryField(qToken, cf);
        if (s > bestTokenScore) bestTokenScore = s;
        if (bestTokenScore >= 40) break;
      }
    }

    if (bestTokenScore < 20) {
      for (const df of itemFields.descriptionFields) {
        const s = scoreDescriptionField(qToken, df);
        if (s > bestTokenScore) bestTokenScore = s;
        if (bestTokenScore >= 20) break;
      }
    }

    // AND rule: every query token must match at least one indexed field on the item
    if (bestTokenScore === 0) {
      return null;
    }

    totalScore += bestTokenScore;
  }

  // Small full-phrase tie-breaker bonus (+3) within the same scoring tier
  const fullCanonical = queryTokens.map((t) => t.canonical).join(' ');
  const fullPhonetic = queryTokens.map((t) => t.phonetic).join(' ');
  const isFullNameHit = itemFields.primaryFields.some(
    (pf) =>
      (fullCanonical && pf.canonical === fullCanonical) ||
      (fullPhonetic && pf.phonetic === fullPhonetic)
  );
  if (isFullNameHit) {
    totalScore += 3;
  }

  // Determine whether the active locale had a direct normalized substring match
  const activeBlob = itemFields.localeSearchBlobs[activeLocale];
  let directActiveLocaleMatch = false;
  if (activeBlob) {
    directActiveLocaleMatch = queryTokens.every(
      (t) => activeBlob.spaced.includes(t.norm) || activeBlob.collapsed.includes(t.norm)
    );
  }

  return {
    score: totalScore,
    directActiveLocaleMatch,
  };
}
