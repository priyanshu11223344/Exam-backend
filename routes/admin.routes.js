const express = require("express");
const router = express.Router();
const multer = require("multer");

// ✅ Use memory storage instead of disk
const storage = multer.memoryStorage();
const upload = multer({ storage });

const { uploadExcel } = require("../controllers/admin.controller");

router.post("/upload-excel", upload.single("file"), uploadExcel);

module.exports = router;
