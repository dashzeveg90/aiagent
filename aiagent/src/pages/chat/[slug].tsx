import { useRouter } from "next/router";
import Link from "next/link";
import Chatbot from "@/components/Chatbot";

export default function PublicChatPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_420px] gap-8 items-start">
        <div className="pt-10">
          <p className="text-sm font-medium text-blue-600 mb-3">Public AI assistant</p>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{slug}</h1>
          <p className="text-slate-600 leading-relaxed max-w-2xl">
            Энэ public chatbot хуудас нь backend-ийн `Express + MongoDB` API-аар
            дамжиж Pinecone namespace-аас tenant context татаж хариулна.
          </p>
          <Link href="/" className="inline-block mt-6 text-blue-600 font-medium">
            Landing руу буцах
          </Link>
        </div>
        <Chatbot slug={slug} />
      </div>
    </div>
  );
}
