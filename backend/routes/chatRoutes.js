const express = require("express");
const router = express.Router();
const { publicChat } = require("../controllers/chatController");

router.post("/:slug", publicChat);

module.exports = router;
