import {
  AIMessage,
  HumanMessage,
  type BaseMessage,
} from "@langchain/core/messages";

export interface ChatMessagePayload {
  role: "user" | "assistant";
  content: string;
}

export function isChatMessagePayload(value: unknown): value is ChatMessagePayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string"
  );
}

export function toLangChainMessages(messages: ChatMessagePayload[]): BaseMessage[] {
  return messages.map((message) =>
    message.role === "user"
      ? new HumanMessage(message.content)
      : new AIMessage(message.content),
  );
}
