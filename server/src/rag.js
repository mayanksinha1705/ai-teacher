// A dependency-free, no-database knowledge-grounding layer.
// We chunk uploaded material and retrieve the most relevant chunks for a
// given query using TF-IDF cosine similarity. This keeps the "no database"
// constraint while still giving the LLM grounded context instead of letting
// it hallucinate about the uploaded material.

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "to",
  "of", "in", "on", "for", "and", "or", "but", "with", "as", "by", "at",
  "from", "that", "this", "it", "its", "into", "than", "then", "so", "such",
  "can", "could", "should", "would", "will", "shall", "may", "might", "we",
  "you", "they", "he", "she", "i", "not", "do", "does", "did", "if", "which",
]);

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9']+/g) || []).filter(
    (w) => w.length > 2 && !STOPWORDS.has(w)
  );
}

export function chunkText(rawText, chunkSize = 900, overlap = 150) {
  const cleaned = rawText.replace(/\s+/g, " ").trim();
  const chunks = [];
  let start = 0;
  let id = 0;
  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    const text = cleaned.slice(start, end).trim();
    if (text) {
      chunks.push({ id: id++, text });
    }
    if (end === cleaned.length) break;
    start = end - overlap;
  }
  return chunks;
}

/**
 * Build TF-IDF vectors for every chunk so we can score them against queries.
 */
export function buildIndex(chunks) {
  const df = new Map(); // document frequency per term
  const tokenizedChunks = chunks.map((c) => tokenize(c.text));

  tokenizedChunks.forEach((tokens) => {
    new Set(tokens).forEach((term) => {
      df.set(term, (df.get(term) || 0) + 1);
    });
  });

  const N = chunks.length || 1;
  const vectors = tokenizedChunks.map((tokens) => {
    const tf = new Map();
    tokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
    const vec = new Map();
    tf.forEach((count, term) => {
      const idf = Math.log(1 + N / (df.get(term) || 1));
      vec.set(term, count * idf);
    });
    return vec;
  });

  return chunks.map((c, i) => ({ ...c, vector: vectors[i], df }));
}

function cosineSim(vecA, vecB) {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  vecA.forEach((val, term) => {
    magA += val * val;
    if (vecB.has(term)) dot += val * vecB.get(term);
  });
  vecB.forEach((val) => {
    magB += val * val;
  });
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Retrieve the top-K most relevant chunks for a query string.
 */
export function retrieveTopChunks(indexedChunks, query, k = 4) {
  if (!indexedChunks.length) return [];
  const N = indexedChunks.length;
  const df = indexedChunks[0].df;

  const queryTokens = tokenize(query);
  const tf = new Map();
  queryTokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
  const queryVec = new Map();
  tf.forEach((count, term) => {
    const idf = Math.log(1 + N / (df.get(term) || 1));
    queryVec.set(term, count * idf);
  });

  const scored = indexedChunks.map((c) => ({
    chunk: c,
    score: cosineSim(queryVec, c.vector),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored
    .slice(0, k)
    .filter((s) => s.score > 0)
    .map((s) => s.chunk.text);
}
