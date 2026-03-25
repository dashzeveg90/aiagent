import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pc.Index(process.env.PINECONE_INDEX!);

async function getEmbedding(text: string): Promise<number[]> {
  const response = await client.embeddings.create({
    input: text,
    model: "text-embedding-3-large",
  });
  return response.data[0].embedding;
}

async function getContext(question: string): Promise<string> {
  const vector = await getEmbedding(question);
  const results = await index.query({
    vector,
    topK: 4,
    includeMetadata: true,
  });

  const parts = results.matches
    .filter((m) => (m.score ?? 0) > 0.3)
    .map((m) => m.metadata?.text as string)
    .filter(Boolean);

  return parts.join("\n\n");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end();

  const { messages } = req.body;
  if (!messages?.length)
    return res.status(400).json({ error: "Асуулт хоосон байна" });

  const lastQuestion = messages[messages.length - 1].content;

  // Pinecone-с холбогдох мэдээллийг хайна
  const context = await getContext(lastQuestion);

  const systemPrompt = context
    ? `Та компанийн туслах chatbot. Зөвхөн доорх мэдээлэлд тулгуурлан хариул.
Мэдэхгүй бол "Энэ талаар манай ажилтантай холбогдоно уу" гэж хэлнэ.
Монгол хэлээр хариулна.

Мэдээлэл:
${context}`
    : `Та компанийн туслах chatbot. Монгол хэлээр хариулна.
Мэдээлэл олдсонгүй тул "Энэ талаар манай ажилтантай холбогдоно уу" гэж хэлнэ.`;

  // Streaming тохируулна
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const stream = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    stream: true,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? "";
    if (text) {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
  }

  res.write("data: [DONE]\n\n");
  res.end();
}

export const config = {
  api: { responseLimit: false },
};
