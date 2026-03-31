import { ChatOpenAI } from "@langchain/openai";

let ragChatModel: ChatOpenAI | undefined;

export function getRagChatModel() {
  ragChatModel ??= new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-5.4",
    temperature: 0,
  });

  return ragChatModel;
}
