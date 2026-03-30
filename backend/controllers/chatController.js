const OpenAI = require("openai");
const { Pinecone } = require("@pinecone-database/pinecone");
const { Organization, MessageLog } = require("../models");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.Index(process.env.PINECONE_INDEX);

async function getEmbedding(text) {
  const response = await client.embeddings.create({
    input: text,
    model: "text-embedding-3-large",
  });
  return response.data[0].embedding;
}

async function getContext(namespace, question) {
  const vector = await getEmbedding(question);
  const results = await index.namespace(namespace).query({
    vector,
    topK: 4,
    includeMetadata: true,
  });

  const parts = results.matches
    .filter((match) => (match.score || 0) > 0.3)
    .map((match) => match.metadata?.text)
    .filter(Boolean);

  return parts.join("\n\n");
}

exports.publicChat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages?.length) {
      return res.status(400).json({
        status: "error",
        message: "Асуулт хоосон байна",
      });
    }

    const company = await Organization.findOne({
      slug: req.params.slug,
      status: "active",
    });

    if (!company) {
      return res.status(404).json({
        status: "error",
        message: "Company assistant олдсонгүй",
      });
    }

    const lastQuestion = messages[messages.length - 1].content;
    const context = await getContext(company.pineconeNamespace, lastQuestion);

    const systemPrompt = context
      ? `${company.systemPrompt}

МЭДЭЭЛЭЛ:
${context}`
      : `${company.systemPrompt}

МЭДЭЭЛЭЛ:
Одоогоор тохирох мэдээлэл олдсонгүй.

Хэрэв мэдээлэл байхгүй бол "Энэ талаар манай ажилтантай холбогдоно уу" гэж хариул.`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await client.chat.completions.create({
      model: "gpt-5.4",
      temperature: 0,
      stream: true,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });

    let answer = "";

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        answer += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();

    await MessageLog.create({
      org: company._id,
      question: lastQuestion,
      answer,
    });
  } catch (error) {
    console.error("Public chat error:", error);
    res.status(500).json({
      status: "error",
      message: "Chat ажиллуулахад алдаа гарлаа",
      error: error.message,
    });
  }
};
