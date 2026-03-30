import { useState, useRef, useEffect } from "react";
import { apiUrl } from "@/lib/config";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chatbot({
  slug = "demo-company",
}: {
  slug?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Сайн байна уу! Би танд юугаар туслах вэ?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: question },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${apiUrl}/chat/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Chat request failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.replace("data: ", "").trim();
          if (data === "[DONE]") break;
          try {
            const { text } = JSON.parse(data);
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: updated[updated.length - 1].content + text,
              };
              return updated;
            });
          } catch {
            // Ignore malformed event chunks.
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Алдаа гарлаа. Дахин оролдоно уу.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md h-[600px] bg-white rounded-2xl border border-blue-200 overflow-hidden shadow-lg font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-blue-700 to-blue-500">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <p className="text-white font-semibold text-sm">BotFlow agent</p>
          <p className="text-blue-200 text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            {slug}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-blue-50/40 px-4 py-4 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
            )}
            <div
              className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white border border-blue-100 text-blue-900 rounded-bl-sm"
              }`}
            >
              {msg.content || (
                <span className="flex gap-1 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce [animation-delay:300ms]" />
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-blue-100 bg-white">
        <input
          className="flex-1 px-4 py-2.5 rounded-full border border-blue-200 bg-blue-50 text-sm text-blue-900 placeholder-blue-300 outline-none focus:border-blue-400 focus:bg-white transition-colors"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Асуултаа бичнэ үү..."
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading}
          className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
