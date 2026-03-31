const jwt = require("jsonwebtoken");
const { User, Organization } = require("../models");
const {
  getSubscriptionAccessState,
  syncOrganizationSubscription,
} = require("../services/subscriptionService");

exports.authenticateToken = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Нэвтрэх эрхгүй байна. Token байхгүй.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).populate("company");

    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Хэрэглэгч олдсонгүй",
      });
    }

    if (!req.user.isActive) {
      return res.status(403).json({
        status: "error",
        message: "Таны эрх хаагдсан байна",
      });
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "error",
        message: "Token буруу байна",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Token-ий хугацаа дууссан байна",
      });
    }

    res.status(500).json({
      status: "error",
      message: "Нэвтрэх эрх шалгахад алдаа гарлаа",
    });
  }
};

exports.checkRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: `Энэ үйлдэл хийхэд ${roles.join(", ")} эрх шаардлагатай`,
      });
    }
    next();
  };
};

exports.requireCompanyAccess = async (req, res, next) => {
  try {
    if (req.user.role === "superadmin") {
      return next();
    }

    if (!req.user.company) {
      return res.status(403).json({
        status: "error",
        message: "Таны company эрх олдсонгүй",
      });
    }

    const company = await Organization.findById(req.user.company._id);
    if (!company) {
      return res.status(404).json({
        status: "error",
        message: "Company олдсонгүй",
      });
    }

    if (company.status !== "active") {
      return res.status(403).json({
        status: "error",
        message: "Таны company түр хаагдсан байна",
        code: "COMPANY_SUSPENDED",
      });
    }

    await syncOrganizationSubscription(company);
    req.company = company;
    next();
  } catch (error) {
    console.error("Company access check error:", error);
    res.status(500).json({
      status: "error",
      message: "Company эрх шалгахад алдаа гарлаа",
    });
  }
};

exports.requireActiveSubscription = async (req, res, next) => {
  try {
    if (req.user.role === "superadmin") {
      return next();
    }

    const company = req.company || (await Organization.findById(req.user.company?._id));
    if (!company) {
      return res.status(404).json({
        status: "error",
        message: "Company олдсонгүй",
        code: "COMPANY_NOT_FOUND",
      });
    }

    await syncOrganizationSubscription(company);
    const access = getSubscriptionAccessState(company);

    if (!access.isActive) {
      return res.status(403).json({
        status: "error",
        message: access.message,
        code: access.code,
        data: {
          subscription: {
            status: access.status,
            endsAt: company.subscriptionEndsAt || null,
          },
        },
      });
    }

    req.company = company;
    next();
  } catch (error) {
    console.error("Active subscription check error:", error);
    res.status(500).json({
      status: "error",
      message: "Subscription шалгахад алдаа гарлаа",
      code: "SUBSCRIPTION_CHECK_FAILED",
    });
  }
};
