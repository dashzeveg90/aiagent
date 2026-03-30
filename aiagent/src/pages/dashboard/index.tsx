import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/router";

interface Organization {
  id: string;
  name: string;
  plan?: string;
  system_prompt?: string;
  pinecone_namespace?: string;
  verify_token?: string;
}

interface DocumentRecord {
  id: string;
  filename: string;
  chunk_count: number;
  uploaded_at: string;
}

interface MessageLogRecord {
  id: string;
  created_at: string;
}

export default function Dashboard() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [logs, setLogs] = useState<MessageLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const router = useRouter();

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push("/auth");

    let { data: orgData } = await supabase
      .from("organizations")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    // Org байхгүй бол шинээр үүсгэнэ
    if (!orgData) {
      const { data: newOrg, error } = await supabase
        .from("organizations")
        .insert({
          name: user.email?.split("@")[0] + "-company",
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Org үүсгэхэд алдаа:", error);
        return;
      }
      orgData = newOrg;
    }

    setOrg(orgData);
    setPrompt(orgData.system_prompt);

    const { data: docsData } = await supabase
      .from("documents")
      .select("*")
      .eq("org_id", orgData.id)
      .order("uploaded_at", { ascending: false });

    const { data: logsData } = await supabase
      .from("message_logs")
      .select("*")
      .eq("org_id", orgData.id)
      .order("created_at", { ascending: false })
      .limit(5);

    setDocs(docsData || []);
    setLogs(logsData || []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  const savePrompt = async () => {
    if (!org) return;
    await supabase
      .from("organizations")
      .update({ system_prompt: prompt })
      .eq("id", org.id);
    alert("Хадгалагдлаа!");
  };

  const uploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !org) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("orgId", org.id);
    formData.append("namespace", org.pinecone_namespace || "");

    await fetch("/api/upload", { method: "POST", body: formData });
    await loadData();
    setUploading(false);
  };

  const deleteDoc = async (docId: string, filename: string) => {
    if (!org) return;
    await fetch("/api/delete-doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        docId,
        filename,
        namespace: org.pinecone_namespace,
      }),
    });
    await loadData();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Ачааллаж байна...
      </div>
    );

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Company мэдээлэл олдсонгүй
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-medium text-gray-900">{org.name}</h1>
          <p className="text-xs text-gray-400 mt-0.5">Admin dashboard</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Гарах
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Нийт баримт</p>
            <p className="text-2xl font-medium text-gray-900">{docs.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Нийт мессеж</p>
            <p className="text-2xl font-medium text-gray-900">{logs.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Plan</p>
            <p className="text-2xl font-medium text-blue-600 capitalize">
              {org.plan}
            </p>
          </div>
        </div>

        {/* System prompt */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-medium text-gray-900 mb-3">
            Chatbot зааварчилгаа
          </h2>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none"
          />
          <button
            onClick={savePrompt}
            className="mt-3 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Хадгалах
          </button>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium text-gray-900">Баримт бичгүүд</h2>
            <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors">
              {uploading ? "Оруулж байна..." : "+ Нэмэх"}
              <input
                type="file"
                accept=".docx,.pdf"
                onChange={uploadDoc}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          {docs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Баримт байхгүй байна
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {doc.filename}
                    </p>
                    <p className="text-xs text-gray-400">
                      {doc.chunk_count} chunk ·{" "}
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteDoc(doc.id, doc.filename)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Устгах
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Webhook info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-medium text-gray-900 mb-3">
            Facebook Messenger тохиргоо
          </h2>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-400">Webhook URL</span>
              <span className="text-xs font-mono text-gray-600 select-all">
                https://таны-домайн.vercel.app/api/messenger?org={org.id}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-400">Verify token</span>
              <span className="text-xs font-mono text-gray-600 select-all">
                {org.verify_token}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
