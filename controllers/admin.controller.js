const XLSX = require("xlsx");
const mongoose = require("mongoose");

const Board = require("../models/Board");
const Subject = require("../models/Subject");
const Topic = require("../models/Topic");
const Paper = require("../models/Paper");

/* ===============================
   Helper Functions
================================= */

// Remove unwanted quotes from Excel cell
const cleanUrl = (url) => {
  if (!url) return null;

  let cleaned = url.toString().replace(/^"|"$/g, "").trim();

  // Convert Google Drive file link to Google image CDN format
  if (cleaned.includes("drive.google.com/file/d/")) {
    const match = cleaned.match(/\/d\/(.*?)\//);
    if (match && match[1]) {
      const fileId = match[1];
      cleaned = `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }

  return cleaned;
};


// Detect file type automatically
const detectFileType = (url) => {
  if (!url) return "link";

  const lower = url.toLowerCase();

  // PDF detection
  if (lower.endsWith(".pdf")) return "pdf";

  // Standard image extensions
  if (
    lower.includes(".png") ||
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".webp")
  ) {
    return "image";
  }

  // 🔥 Google image CDN detection
  if (lower.includes("lh3.googleusercontent.com")) {
    return "image";
  }

  // 🔥 Imgur domain detection
  if (lower.includes("imgur.com")) {
    return "image";
  }

  return "link";
};

const buildFileArray = (field) => {
  if (!field) return [];

  return field
    .toString()
    .split("|")
    .map(link => link.trim())
    .filter(link => link.length > 0)
    .map(link => {
      const cleaned = cleanUrl(link); // CLEAN FIRST
      return {
        fileType: detectFileType(cleaned), // THEN DETECT
        url: cleaned
      };
    });
};


/* ===============================
   MAIN CONTROLLER
================================= */

exports.uploadExcel = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let inserted = 0;
    let skipped = 0;

    for (const row of rows) {
      const {
        board,
        subject,
        topic,
        year,
        season,
        paperNumber,
        variant,
        questionPaper,
        markScheme,
        explanation,
        specialComment,
      } = row;

      if (!board || !subject || !topic) continue;

      /* ===== BOARD ===== */
      let boardDoc = await Board.findOne({ name: board }).session(session);

      if (!boardDoc) {
        const created = await Board.create([{ name: board }], { session });
        boardDoc = created[0];
      }

      /* ===== SUBJECT ===== */
      let subjectDoc = await Subject.findOne({
        name: subject,
        board: boardDoc._id,
      }).session(session);

      if (!subjectDoc) {
        const created = await Subject.create(
          [{ name: subject, board: boardDoc._id }],
          { session }
        );
        subjectDoc = created[0];
      }

      /* ===== TOPIC ===== */
      let topicDoc = await Topic.findOne({
        name: topic,
        subject: subjectDoc._id,
      }).session(session);

      if (!topicDoc) {
        const created = await Topic.create(
          [{ name: topic, subject: subjectDoc._id }],
          { session }
        );
        topicDoc = created[0];
      }

      /* ===== DUPLICATE CHECK ===== */
      const existingPaper = await Paper.findOne({
        topic: topicDoc._id,
        year,
        season,
        paperNumber,
        variant,
      }).session(session);

      if (existingPaper) {
        skipped++;
        continue;
      }

      /* ===== CREATE PAPER ===== */

      await Paper.create(
        [
          {
            topic: topicDoc._id,
            topicName:topicDoc.name,
            year,
            season,
            paperNumber,
            variant,

            questionPaper: buildFileArray(questionPaper),

          

            markScheme: markScheme
              ? {
                  fileType: detectFileType(markScheme),
                  url: cleanUrl(markScheme),
                }
              : undefined,

            explanation: explanation
              ? {
                  fileType: detectFileType(explanation),
                  url: cleanUrl(explanation),
                }
              : undefined,

            specialComment: specialComment
              ? {
                  fileType: detectFileType(specialComment),
                  url: cleanUrl(specialComment),
                }
              : undefined,
          },
        ],
        { session }
      );

      inserted++;
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Excel processed successfully",
      inserted,
      skipped,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error(error);

    return res.status(500).json({
      message: "Upload failed",
      error: error.message,
    });
  }
};
