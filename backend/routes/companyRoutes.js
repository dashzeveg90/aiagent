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
  requireActiveSubscription,
} = require("../middleware/auth");

router.get(
  "/dashboard",
  authenticateToken,
  requireCompanyAccess,
  requireActiveSubscription,
  getDashboardStats,
);

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

router.get(
  "/company/current",
  authenticateToken,
  requireCompanyAccess,
  requireActiveSubscription,
  getCurrentCompany,
);
router.put(
  "/company/current",
  authenticateToken,
  requireCompanyAccess,
  requireActiveSubscription,
  updateCurrentCompany,
);
router.post(
  "/company/current/documents",
  authenticateToken,
  requireCompanyAccess,
  requireActiveSubscription,
  uploadDocument,
);
router.delete(
  "/company/current/documents/:id",
  authenticateToken,
  requireCompanyAccess,
  requireActiveSubscription,
  deleteDocument,
);

module.exports = router;
