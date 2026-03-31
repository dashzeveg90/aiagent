const express = require("express");
const router = express.Router();
const {
  createInvoice,
  createPackage,
  getBillingOverview,
  getPackages,
  getTransactionStatus,
  handleQPayCallback,
  updatePackage,
} = require("../controllers/paymentController");
const {
  authenticateToken,
  checkRole,
  requireCompanyAccess,
} = require("../middleware/auth");

router.get("/packages", authenticateToken, getPackages);
router.post(
  "/packages",
  authenticateToken,
  checkRole("superadmin"),
  createPackage,
);
router.patch(
  "/packages/:id",
  authenticateToken,
  checkRole("superadmin"),
  updatePackage,
);

router.get(
  "/billing/current",
  authenticateToken,
  requireCompanyAccess,
  getBillingOverview,
);
router.post(
  "/billing/invoices",
  authenticateToken,
  requireCompanyAccess,
  createInvoice,
);
router.get(
  "/billing/transactions/:id",
  authenticateToken,
  requireCompanyAccess,
  getTransactionStatus,
);

router.post("/payments/qpay/callback", handleQPayCallback);

module.exports = router;
