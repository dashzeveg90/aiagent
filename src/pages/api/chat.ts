import type { NextApiRequest, NextApiResponse } from "next";
import {
  isChatMessagePayload,
} from "@/lib/rag/messages";
import { getAuthenticatedChatOrganization } from "@/lib/rag/organization";
import { streamChatText } from "@/lib/rag/streamChat";

const MAX_MESSAGE_COUNT = 20;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOTAL_MESSAGE_LENGTH = 20000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end();

  const { messages } = req.body;
  if (!Array.isArray(messages) || !messages.length)
    return res.status(400).json({ error: "Асуулт хоосон байна" });

  if (!messages.every(isChatMessagePayload)) {
    return res.status(400).json({ error: "Мессежийн бүтэц буруу байна" });
  }

  if (messages.length > MAX_MESSAGE_COUNT) {
    return res.status(400).json({ error: "Хэт олон мессеж илгээлээ" });
  }

  if (
    messages.some(
      (message) =>
        !message.content.trim() || message.content.length > MAX_MESSAGE_LENGTH,
    )
  ) {
    return res.status(400).json({ error: "Мессеж хэт урт эсвэл хоосон байна" });
  }

  const totalMessageLength = messages.reduce(
    (total, message) => total + message.content.length,
    0,
  );

  if (totalMessageLength > MAX_TOTAL_MESSAGE_LENGTH) {
    return res.status(400).json({ error: "Нийт мессежийн хэмжээ хэтэрлээ" });
  }

  const lastMessage = messages[messages.length - 1];

  if (lastMessage.role !== "user") {
    return res.status(400).json({ error: "Сүүлийн мессеж хэрэглэгчээс байх ёстой" });
  }

  const organization = await getAuthenticatedChatOrganization(req, res);

  if (!organization) {
    return res.status(401).json({ error: "Нэвтэрч орсны дараа чат ашиглана уу" });
  }

  // Streaming тохируулна
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    await streamChatText(
      messages,
      (text) => {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      },
      {
        namespace: organization.pinecone_namespace,
        orgInstruction: organization.system_prompt,
      },
    );
  } catch (error) {
    console.error("Chat failed:", error);
    res.write(
      `data: ${JSON.stringify({ text: "Алдаа гарлаа. Дахин оролдоно уу." })}\n\n`,
    );
  } finally {
    res.write("data: [DONE]\n\n");
    res.end();
  }
}

export const config = {
  api: { responseLimit: false },
};
