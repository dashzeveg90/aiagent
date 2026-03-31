import type { NextApiRequest, NextApiResponse } from "next";
import { promises as fs } from "node:fs";
import os from "node:os";
import formidable from "formidable";
import { supabaseAdmin } from "@/lib/supabase";
import {
  buildUploadChunkIds,
  indexUploadDocuments,
} from "@/lib/upload/indexDocuments";
import {
  isSupportedUpload,
  loadUploadDocument,
} from "@/lib/upload/loadDocument";
import { splitUploadDocuments } from "@/lib/upload/splitDocuments";

export const config = { api: { bodyParser: false } };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const form = formidable({
    uploadDir: os.tmpdir(),
    keepExtensions: true,
  });

  let tempFilePath: string | undefined;

  try {
    const [fields, files] = await form.parse(req);

    const orgId = fields.orgId?.[0];
    const namespace = fields.namespace?.[0]?.trim();
    const file = files.file?.[0];
    const filename = file?.originalFilename?.trim();

    tempFilePath = file?.filepath;

    if (!file || !orgId || !namespace || !filename) {
      return res.status(400).json({ error: "Файл дутуу байна" });
    }

    if (!isSupportedUpload(filename)) {
      return res.status(400).json({ error: "Зөвхөн DOCX эсвэл PDF файл оруулна уу" });
    }

    const documents = await loadUploadDocument(file.filepath, filename);
    const chunks = await splitUploadDocuments(documents);

    if (!chunks.length) {
      return res
        .status(400)
        .json({ error: "Файлаас ашиглах боломжтой текст олдсонгүй" });
    }

    const ids = buildUploadChunkIds(filename, chunks.length);
    await indexUploadDocuments({ documents: chunks, ids, namespace });


    // console.log("before supa");
    // const { error } = await supabaseAdmin.from("documents").insert({
    //   org_id: orgId,
    //   filename,
    //   chunk_count: chunks.length,
    // });

    // console.log("after supa"); 


    // if (error) {
    //   throw error;
    // }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Upload failed:", error);
    return res.status(500).json({ error: "Файл боловсруулахад алдаа гарлаа" });
  } finally {
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => undefined);
    }
  }
}
