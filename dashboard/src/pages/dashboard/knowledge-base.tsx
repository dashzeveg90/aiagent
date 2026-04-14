import { useCallback, useEffect, useRef, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/lib/auth";
import apiService from "@/lib/api";
import { toast } from "sonner";

type Company = {
  name?: string;
  slug?: string;
};

type DocumentRecord = {
  _id: string;
  filename: string;
  chunkCount?: number;
  createdAt?: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Алдаа гарлаа";
}

function formatDate(value?: string) {
  if (!value) {
    return "Огноо байхгүй";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Огноо байхгүй";
  }

  return date.toLocaleDateString();
}

export default function KnowledgeBasePage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const response = await apiService.company.getCurrent();
      setCompany(response.data.company || null);
      setDocuments(response.data.documents || []);
    } catch (loadError) {
      toast.error(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "superadmin") {
      setLoading(false);
      return;
    }

    if (user?.role === "company_admin") {
      loadData();
    }
  }, [loadData, user]);

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedFile) {
      toast.error("Оруулах файлаа сонгоно уу");
      return;
    }

    setUploading(true);

    try {
      await apiService.company.uploadDocument(selectedFile);
      toast.success("Баримт амжилттай оруулагдлаа");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadData();
    } catch (uploadError) {
      toast.error(getErrorMessage(uploadError));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    try {
      await apiService.company.deleteDocument(id);
      toast.success("Баримт устгагдлаа");
      await loadData();
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-100 md:flex ml-64">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <h1 className="text-3xl font-bold text-slate-900">Мэдлэгийн сан</h1>
          <p className="mt-2 text-slate-500">
            Компанийн баримт бичгийг оруулж chatbot-ийн мэдлэгийн санд нэмнэ.
          </p>

          {user?.role === "superadmin" ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              Энэ хэсэг нь company admin хэрэглэгчдэд зориулагдсан.
            </div>
          ) : loading ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              Мэдээлэл ачааллаж байна...
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_360px]">
              <div className="space-y-6">
                <form
                  onSubmit={handleUpload}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <h2 className="text-xl font-semibold text-slate-900">
                    Баримт оруулах
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    `.docx` болон `.pdf` файлыг backend API руу илгээж мэдлэгийн
                    санд боловсруулан хадгална.
                  </p>

                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Файл сонгох
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Дэмжигдэх формат: `.docx`, `.pdf`
                        </p>
                      </div>
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800">
                        Баримт сонгох
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".docx,.pdf"
                          className="hidden"
                          onChange={(event) =>
                            setSelectedFile(event.target.files?.[0] || null)
                          }
                        />
                      </label>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                      {selectedFile
                        ? `Сонгосон файл: ${selectedFile.name}`
                        : "Одоогоор файл сонгогдоогүй байна"}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={uploading || !selectedFile}
                      className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
                    >
                      {uploading ? "Оруулж байна..." : "Мэдлэгийн санд нэмэх"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);

                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      disabled={uploading || !selectedFile}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Цэвэрлэх
                    </button>
                  </div>
                </form>

                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="font-semibold text-slate-900">
                      Оруулсан баримтууд
                    </h2>
                  </div>

                  {documents.length === 0 ? (
                    <div className="px-5 py-10 text-center text-sm text-slate-500">
                      Одоогоор баримт оруулаагүй байна.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {documents.map((document) => (
                        <div
                          key={document._id}
                          className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="font-medium text-slate-900">
                              {document.filename}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {document.chunkCount || 0} chunk ·{" "}
                              {formatDate(document.createdAt)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDelete(document._id)}
                            disabled={deletingId === document._id}
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                          >
                            {deletingId === document._id
                              ? "Устгаж байна..."
                              : "Устгах"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="font-semibold text-slate-900">Company info</h2>
                  <p className="mt-4 text-sm text-slate-500">
                    Company: {company?.name || user?.company?.name || "-"}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Public slug: /chat/
                    {company?.slug || user?.company?.slug || ""}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Нийт баримт: {documents.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="font-semibold text-slate-900">Санамж</h2>
                  <div className="mt-4 space-y-3 text-sm text-slate-500">
                    <p>
                      - Файл оруулсны дараа баримт автоматаар backend дээр
                      боловсруулагдана.
                    </p>
                    <p>
                      - Chatbot зөвхөн танай company-ийн namespace доторх
                      мэдээллийг ашиглана.
                    </p>
                    <p>
                      - Шинэ баримт нэмсний дараа public chat дээр шууд шалгаж
                      болно.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
