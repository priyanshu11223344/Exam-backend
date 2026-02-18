const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Connect DB
connectDB();

// Routes
const boardRoutes = require("./routes/board.routes");
const subjectRoutes = require("./routes/subject.routes");
const topicRoutes = require("./routes/topic.routes");
const paperRoutes = require("./routes/paper.routes");
const adminUpload = require("./routes/admin.routes");

app.use("/api/boards", boardRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/papers", paperRoutes);
app.use("/api/admin", adminUpload);

// 🚀 EXPORT instead of listen
module.exports = app;
