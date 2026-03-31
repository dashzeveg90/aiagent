import { SystemMessage, type AIMessageChunk } from "@langchain/core/messages";

import { getRagChatModel } from "@/lib/rag/chatModel";
import {
  type ChatMessagePayload,
  toLangChainMessages,
} from "@/lib/rag/messages";
import { buildChatSystemPrompt } from "@/lib/rag/prompt";
import { getRelevantContext } from "@/lib/rag/retrieval";

interface ChatStreamDependencies {
  namespace?: string | null;
  orgInstruction?: string | null;
  getContext?: (question: string) => Promise<string>;
  streamMessages?: (
    messages: [SystemMessage, ...ReturnType<typeof toLangChainMessages>],
  ) => Promise<AsyncIterable<AIMessageChunk>>;
}

export async function streamChatText(
  messages: ChatMessagePayload[],
  onToken: (text: string) => void,
  dependencies: ChatStreamDependencies = {},
) {
  const getContext =
    dependencies.getContext ??
    ((question: string) =>
      getRelevantContext(question, dependencies.namespace ?? undefined));
  const streamMessages =
    dependencies.streamMessages ??
    ((langChainMessages) => getRagChatModel().stream(langChainMessages));

  const lastQuestion = messages[messages.length - 1].content;
  const context = await getContext(lastQuestion);
  const systemPrompt = buildChatSystemPrompt({
    context,
    orgInstruction: dependencies.orgInstruction,
  });
  const langChainMessages = [
    new SystemMessage(systemPrompt),
    ...toLangChainMessages(messages),
  ] as [SystemMessage, ...ReturnType<typeof toLangChainMessages>];

  const stream = await streamMessages(langChainMessages);

  for await (const chunk of stream) {
    const text = chunk.text ?? "";

    if (text) {
      onToken(text);
    }
  }
}
