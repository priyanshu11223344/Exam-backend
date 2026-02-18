const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "*", // change this for production frontend URL
  })
);

// Ensure DB is connected before handling request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
app.use("/api/boards", require("./routes/board.routes"));
app.use("/api/subjects", require("./routes/subject.routes"));
app.use("/api/topics", require("./routes/topic.routes"));
app.use("/api/papers", require("./routes/paper.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

module.exports = app;
