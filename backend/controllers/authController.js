const crypto = require("crypto");
const { User, Organization } = require("../models");
const {
  buildSubscriptionSummary,
  syncOrganizationSubscription,
} = require("../services/subscriptionService");

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const serializeCompany = (company) => {
  if (!company) {
    return null;
  }

  return {
    _id: company._id,
    id: company._id,
    name: company.name,
    slug: company.slug,
    status: company.status,
    plan: company.plan,
    brandColor: company.brandColor,
    chatBg: company.chatBg,
    titleColor: company.titleColor,
    textColor: company.textColor,
    greeting: company.greeting,
    subtitle: company.subtitle,
    logoUrl: company.logoUrl,
    systemPrompt: company.systemPrompt,
    subscriptionStatus: company.subscriptionStatus,
    subscriptionStartsAt: company.subscriptionStartsAt || null,
    subscriptionEndsAt: company.subscriptionEndsAt || null,
    lastPaymentAt: company.lastPaymentAt || null,
    currentPackage: company.currentPackage
      ? {
          _id: company.currentPackage._id || company.currentPackage,
          id: company.currentPackage._id || company.currentPackage,
          name: company.currentPackage.name || "",
          code: company.currentPackage.code || company.plan,
          price: company.currentPackage.price ?? null,
          currency: company.currentPackage.currency || "MNT",
          durationDays: company.currentPackage.durationDays ?? null,
          billingCycle: company.currentPackage.billingCycle || "monthly",
        }
      : null,
    subscription: buildSubscriptionSummary(company),
  };
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;

    if (!name || !email || !password || !companyName) {
      return res.status(400).json({
        status: "error",
        message: "Нэр, и-мэйл, нууц үг, company нэр шаардлагатай",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Энэ и-мэйл бүртгэлтэй байна",
      });
    }

    const baseSlug = slugify(companyName) || `company-${crypto.randomBytes(3).toString("hex")}`;
    const slug = `${baseSlug}-${crypto.randomBytes(2).toString("hex")}`;

    const user = await User.create({
      name,
      email,
      password,
      role: "company_admin",
    });

    const company = await Organization.create({
      name: companyName,
      slug,
      owner: user._id,
      plan: "trial",
      status: "active",
      subscriptionStatus: "pending",
      pineconeNamespace: `org-${slug}`,
      verifyToken: crypto.randomBytes(8).toString("hex"),
    });

    user.company = company._id;
    await user.save();

    const token = user.getSignedJwtToken();

    res.status(201).json({
      status: "success",
      message: "Company бүртгэл амжилттай үүслээ",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: serializeCompany(company),
        },
        token,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      status: "error",
      message: "Бүртгэл үүсгэхэд алдаа гарлаа",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "И-мэйл болон нууц үгээ оруулна уу",
      });
    }

    const user = await User.findOne({ email })
      .select("+password")
      .populate({
        path: "company",
        populate: { path: "currentPackage" },
      });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "И-мэйл эсвэл нууц үг буруу байна",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "И-мэйл эсвэл нууц үг буруу байна",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        status: "error",
        message: "Таны эрх хаагдсан байна",
      });
    }

    if (user.role === "company_admin" && user.company?.status !== "active") {
      return res.status(403).json({
        status: "error",
        message: "Таны company идэвхгүй байна",
        code: "COMPANY_SUSPENDED",
      });
    }

    if (user.company) {
      await syncOrganizationSubscription(user.company);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = user.getSignedJwtToken();

    res.status(200).json({
      status: "success",
      message: "Амжилттай нэвтэрлээ",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: serializeCompany(user.company),
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Нэвтрэхэд алдаа гарлаа",
      error: error.message,
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "company",
      populate: { path: "currentPackage" },
    });

    if (user?.company) {
      await syncOrganizationSubscription(user.company);
    }

    res.status(200).json({
      status: "success",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        company: serializeCompany(user.company),
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      status: "error",
      message: "Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа",
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
    };

    Object.keys(fieldsToUpdate).forEach((key) => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    }).populate("company");

    res.status(200).json({
      status: "success",
      message: "Профайл амжилттай шинэчлэгдлээ",
      data: user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      status: "error",
      message: "Профайл шинэчлэхэд алдаа гарлаа",
      error: error.message,
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: "error",
        message: "Одоогийн болон шинэ нууц үгээ оруулна уу",
      });
    }

    const user = await User.findById(req.user.id).select("+password");
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "Одоогийн нууц үг буруу байна",
      });
    }

    user.password = newPassword;
    await user.save();

    const token = user.getSignedJwtToken();

    res.status(200).json({
      status: "success",
      message: "Нууц үг амжилттай солигдлоо",
      data: { token },
    });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({
      status: "error",
      message: "Нууц үг солих үед алдаа гарлаа",
      error: error.message,
    });
  }
};

exports.logout = async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Амжилттай гарлаа",
  });
};
