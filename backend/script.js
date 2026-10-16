const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Finance Tracker backend is running");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "React and Express are communiceating!!",
    app: "financial Portfolio & BUdget Tracker"
  });
});

app.get("/api/transactions", (req, res) => {
  res.json({
    success: true,
    transactions: []
   });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});