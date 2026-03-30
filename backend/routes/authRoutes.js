const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  updatePassword,
  updateProfile,
  logout,
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.get("/me", authenticateToken, getMe);
router.put("/update-password", authenticateToken, updatePassword);
router.put("/update-profile", authenticateToken, updateProfile);

module.exports = router;
