const { formidable } = require("formidable");
const mammoth = require("mammoth");
const os = require("os");
const pdfParse = require("pdf-parse");
const { Pinecone } = require("@pinecone-database/pinecone");
const OpenAI = require("openai");
const { Organization, Document, MessageLog, User } = require("../models");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.Index(process.env.PINECONE_INDEX);

const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = formidable({ uploadDir: os.tmpdir(), keepExtensions: true });
    form.parse(req, (error, fields, files) => {
      if (error) reject(error);
      else resolve({ fields, files });
    });
  });

const chunkText = (text) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  const chunkSize = 800;
  const overlap = 120;
  const chunks = [];

  for (let start = 0; start < normalized.length; start += chunkSize - overlap) {
    chunks.push(normalized.slice(start, start + chunkSize));
  }

  return chunks.filter(Boolean);
};

const embedBatch = async (chunks) => {
  const response = await openai.embeddings.create({
    input: chunks,
    model: "text-embedding-3-large",
  });

  return response.data.map((item) => item.embedding);
};

exports.getDashboardStats = async (req, res) => {
  try {
    if (req.user.role === "superadmin") {
      const [companies, companyAdmins] = await Promise.all([
        Organization.countDocuments(),
        User.countDocuments({ role: "company_admin" }),
      ]);

      const recentCompanies = await Organization.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      return res.status(200).json({
        status: "success",
        data: {
          stats: {
            companies,
            companyAdmins,
            activeCompanies: await Organization.countDocuments({ status: "active" }),
          },
          companies: recentCompanies,
        },
      });
    }

    const company = await Organization.findById(req.user.company).lean();
    const [documents, messages] = await Promise.all([
      Document.find({ org: company._id }).sort({ createdAt: -1 }).lean(),
      MessageLog.find({ org: company._id }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        company,
        documents,
        messages,
        stats: {
          documentCount: documents.length,
          messageCount: messages.length,
        },
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Dashboard мэдээлэл авахад алдаа гарлаа",
    });
  }
};

exports.getCompanies = async (req, res) => {
  try {
    const companies = await Organization.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({
      status: "success",
      data: companies,
    });
  } catch (error) {
    console.error("Get companies error:", error);
    res.status(500).json({
      status: "error",
      message: "Company жагсаалт авахад алдаа гарлаа",
    });
  }
};

exports.getCompanyById = async (req, res) => {
  try {
    const company = await Organization.findById(req.params.id).lean();
    if (!company) {
      return res.status(404).json({
        status: "error",
        message: "Company олдсонгүй",
      });
    }

    const [owner, documents] = await Promise.all([
      User.findById(company.owner).lean(),
      Document.find({ org: company._id }).sort({ createdAt: -1 }).lean(),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        company,
        owner,
        documents,
      },
    });
  } catch (error) {
    console.error("Get company by id error:", error);
    res.status(500).json({
      status: "error",
      message: "Company мэдээлэл авахад алдаа гарлаа",
    });
  }
};

exports.updateCompanyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Status буруу байна",
      });
    }

    const company = await Organization.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!company) {
      return res.status(404).json({
        status: "error",
        message: "Company олдсонгүй",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Company status шинэчлэгдлээ",
      data: company,
    });
  } catch (error) {
    console.error("Update company status error:", error);
    res.status(500).json({
      status: "error",
      message: "Company status шинэчлэхэд алдаа гарлаа",
    });
  }
};

exports.getCurrentCompany = async (req, res) => {
  try {
    const company = await Organization.findById(req.user.company).lean();
    const [documents, messages] = await Promise.all([
      Document.find({ org: company._id }).sort({ createdAt: -1 }).lean(),
      MessageLog.find({ org: company._id }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        company,
        documents,
        messages,
      },
    });
  } catch (error) {
    console.error("Get current company error:", error);
    res.status(500).json({
      status: "error",
      message: "Company мэдээлэл авахад алдаа гарлаа",
    });
  }
};

exports.updateCurrentCompany = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      slug: req.body.slug,
      brandColor: req.body.brandColor,
      systemPrompt: req.body.systemPrompt,
      logoUrl: req.body.logoUrl,
    };

    Object.keys(fieldsToUpdate).forEach((key) => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });

    const company = await Organization.findByIdAndUpdate(
      req.user.company,
      fieldsToUpdate,
      { new: true, runValidators: true },
    );

    res.status(200).json({
      status: "success",
      message: "Company тохиргоо шинэчлэгдлээ",
      data: company,
    });
  } catch (error) {
    console.error("Update current company error:", error);
    res.status(500).json({
      status: "error",
      message: "Company тохиргоо шинэчлэхэд алдаа гарлаа",
    });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const { files } = await parseForm(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({
        status: "error",
        message: "Файл шаардлагатай",
      });
    }

    const company = await Organization.findById(req.user.company);
    const extension = (file.originalFilename || "").split(".").pop()?.toLowerCase();

    let text = "";
    if (extension === "docx") {
      const result = await mammoth.extractRawText({ path: file.filepath });
      text = result.value;
    } else if (extension === "pdf") {
      const pdfBuffer = await require("fs").promises.readFile(file.filepath);
      const result = await pdfParse(pdfBuffer);
      text = result.text;
    } else {
      return res.status(400).json({
        status: "error",
        message: "Зөвхөн .docx эсвэл .pdf файл дэмжинэ",
      });
    }

    const chunks = chunkText(text);
    if (!chunks.length) {
      return res.status(400).json({
        status: "error",
        message: "Файлаас уншигдах текст олдсонгүй",
      });
    }

    const document = await Document.create({
      org: company._id,
      filename: file.originalFilename,
      chunkCount: chunks.length,
    });

    const batchSize = 25;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embeddings = await embedBatch(batch);

      await index.namespace(company.pineconeNamespace).upsert({
        records: batch.map((chunk, batchIndex) => ({
          id: `${document._id}-${i + batchIndex}`,
          values: embeddings[batchIndex],
          metadata: {
            text: chunk,
            source: file.originalFilename,
            documentId: String(document._id),
            orgId: String(company._id),
          },
        })),
      });
    }

    res.status(201).json({
      status: "success",
      message: "Файл амжилттай боловсруулагдлаа",
      data: document,
    });
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({
      status: "error",
      message: "Файл оруулахад алдаа гарлаа",
      error: error.message,
    });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      org: req.user.company,
    });

    if (!document) {
      return res.status(404).json({
        status: "error",
        message: "Document олдсонгүй",
      });
    }

    const company = await Organization.findById(req.user.company);

    const vectorIds = Array.from({ length: document.chunkCount }, (_, indexValue) => {
      return `${document._id}-${indexValue}`;
    });

    if (vectorIds.length) {
      await index.namespace(company.pineconeNamespace).deleteMany(vectorIds);
    }

    await document.deleteOne();

    res.status(200).json({
      status: "success",
      message: "Document устгагдлаа",
    });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({
      status: "error",
      message: "Document устгахад алдаа гарлаа",
      error: error.message,
    });
  }
};
