import path from "node:path";
import { readFile } from "node:fs/promises";

import { Document } from "@langchain/core/documents";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

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
  const fileBuffer = await readFile(filePath);

  const text =
    extension === ".pdf"
      ? await extractPdfText(fileBuffer)
      : (await mammoth.extractRawText({ buffer: fileBuffer })).value;

  const documents = [
    new Document({
      pageContent: text.trim(),
      metadata: { source: filename },
    }),
  ];

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

async function extractPdfText(fileBuffer: Buffer) {
  const parser = new PDFParse({ data: fileBuffer });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
