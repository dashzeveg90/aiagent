import { Document } from "@langchain/core/documents";
import { getRagEmbeddings } from "@/lib/rag/embeddings";
import { getPineconeStore } from "@/lib/rag/vectorStore";

export function buildUploadChunkIds(filename: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${filename}-${index}`);
}

export async function indexUploadDocuments({
  documents,
  ids,
  namespace,
}: {
  documents: Document[];
  ids: string[];
  namespace: string;
}) {
  const rootStore = await getPineconeStore();
  const namespacedStore = await getPineconeStore(namespace);

  const vectors = await getRagEmbeddings().embedDocuments(
    documents.map((document) => document.pageContent),
  );

  await rootStore.addVectors(vectors, documents, { ids });
  await namespacedStore.addVectors(vectors, documents, { ids });
}
