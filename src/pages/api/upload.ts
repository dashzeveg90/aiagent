import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { supabaseAdmin } from "@/lib/supabase";
import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

export const config = { api: { bodyParser: false } };

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const form = formidable({ uploadDir: "/tmp", keepExtensions: true });
  const [fields, files] = await form.parse(req);

  const orgId = fields.orgId?.[0];
  const namespace = fields.namespace?.[0];
  const file = files.file?.[0];
  if (!file || !orgId || !namespace) return res.status(400).end();

  // Файл уншина (docx эсвэл pdf)
  const { execSync } = require("child_process");
  const text = execSync(`python3 -c "
import sys
from docx import Document
doc = Document('${file.filepath}')
print(' '.join([p.text for p in doc.paragraphs]))
"`).toString();

  // Chunk болгоно
  const chunkSize = 800;
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  // Pinecone-д хадгална
  const index = pc.Index(process.env.PINECONE_INDEX!);
  const batchSize = 50;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const embedRes = await client.embeddings.create({
      input: batch,
      model: "text-embedding-3-large",
    });
    await index.namespace(namespace).upsert({
      records: batch.map((text, j) => ({
        id: `${file.originalFilename}-${i + j}`,
        values: embedRes.data[j].embedding,
        metadata: { text, source: file.originalFilename! },
      })),
    });
  }

  // Supabase-д бүртгэнэ
  await supabaseAdmin.from("documents").insert({
    org_id: orgId,
    filename: file.originalFilename,
    chunk_count: chunks.length,
  });

  res.status(200).json({ ok: true });
}
