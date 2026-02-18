const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

const app = express();

// Connect DB once
connectDB();

app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

app.use("/api/boards", require("./routes/board.routes"));
app.use("/api/subjects", require("./routes/subject.routes"));
app.use("/api/topics", require("./routes/topic.routes"));
app.use("/api/papers", require("./routes/paper.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

module.exports = app;
