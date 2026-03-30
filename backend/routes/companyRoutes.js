const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getCompanies,
  getCompanyById,
  updateCompanyStatus,
  getCurrentCompany,
  updateCurrentCompany,
  uploadDocument,
  deleteDocument,
} = require("../controllers/companyController");
const {
  authenticateToken,
  checkRole,
  requireCompanyAccess,
} = require("../middleware/auth");

router.get("/dashboard", authenticateToken, getDashboardStats);

router.get("/companies", authenticateToken, checkRole("superadmin"), getCompanies);
router.get(
  "/companies/:id",
  authenticateToken,
  checkRole("superadmin"),
  getCompanyById,
);
router.patch(
  "/companies/:id/status",
  authenticateToken,
  checkRole("superadmin"),
  updateCompanyStatus,
);

router.get("/company/current", authenticateToken, requireCompanyAccess, getCurrentCompany);
router.put(
  "/company/current",
  authenticateToken,
  requireCompanyAccess,
  updateCurrentCompany,
);
router.post(
  "/company/current/documents",
  authenticateToken,
  requireCompanyAccess,
  uploadDocument,
);
router.delete(
  "/company/current/documents/:id",
  authenticateToken,
  requireCompanyAccess,
  deleteDocument,
);

module.exports = router;
