import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const uploadSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 0,
});

export async function splitUploadDocuments(
  documents: Document[],
): Promise<Document[]> {
  const chunks = await uploadSplitter.splitDocuments(documents);

  return chunks
    .map(
      (document) =>
        new Document({
          pageContent: document.pageContent.trim(),
          metadata: document.metadata,
        }),
    )
    .filter((document) => document.pageContent.length > 0);
}
