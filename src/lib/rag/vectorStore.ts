import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";

import { getRagEmbeddings } from "@/lib/rag/embeddings";

let pinecone: Pinecone | undefined;

function normalizeNamespace(namespace?: string) {
  const trimmed = namespace?.trim();

  return trimmed ? trimmed : undefined;
}

function getPineconeIndex() {
  pinecone ??= new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

  return pinecone.Index(process.env.PINECONE_INDEX!);
}

export async function getPineconeStore(namespace?: string) {
  return PineconeStore.fromExistingIndex(getRagEmbeddings(), {
    pineconeIndex: getPineconeIndex(),
    namespace: normalizeNamespace(namespace),
    textKey: "text",
  });
}
