import { getPineconeStore } from "@/lib/rag/vectorStore";

const MATCH_LIMIT = 4;
const SCORE_THRESHOLD = 0.3;

export async function getRelevantContext(
  question: string,
  namespace?: string,
): Promise<string> {
  const store = await getPineconeStore(namespace);
  const results = await store.similaritySearchWithScore(question, MATCH_LIMIT);

  return results
    .filter(([, score]) => score > SCORE_THRESHOLD)
    .map(([document]) => document.pageContent.trim())
    .filter(Boolean)
    .join("\n\n");
}
