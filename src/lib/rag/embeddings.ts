import { OpenAIEmbeddings } from "@langchain/openai";

let ragEmbeddings: OpenAIEmbeddings | undefined;

export function getRagEmbeddings() {
  ragEmbeddings ??= new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    model: "text-embedding-3-large",
  });

  return ragEmbeddings;
}
