import path from "node:path";

import { Document } from "@langchain/core/documents";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

const SUPPORTED_EXTENSIONS = new Set([".docx", ".pdf"]);

function getExtension(filename: string) {
  return path.extname(filename).toLowerCase();
}

export function isSupportedUpload(filename: string) {
  return SUPPORTED_EXTENSIONS.has(getExtension(filename));
}

export async function loadUploadDocument(
  filePath: string,
  filename: string,
): Promise<Document[]> {
  const extension = getExtension(filename);

  const loader =
    extension === ".pdf"
      ? new PDFLoader(filePath, { splitPages: false })
      : new DocxLoader(filePath, { type: "docx" });

  const documents = await loader.load();

  return documents
    .map(
      (document) =>
        new Document({
          pageContent: document.pageContent.trim(),
          metadata: {
            ...document.metadata,
            source: filename,
          },
        }),
    )
    .filter((document) => document.pageContent.length > 0);
}
