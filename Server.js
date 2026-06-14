import dotenv from "dotenv";
dotenv.config();
console.log("MAIL_USER:", process.env.MAIL_USER ? "Set" : "MISSING");
console.log("MAIL_PASS:", process.env.MAIL_PASS ? "Set" : "MISSING");
console.log("CLIENT_URL:", process.env.CLIENT_URL);

import express from "express";
import cors from "cors";
import connectDB from "./configs/db.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Dynamic imports to ensure dotenv loads first
const { default: userRouter } = await import("./routes/userRoutes.js");
const { default: resumeRouter } = await import("./routes/resume.Routes.js");
const { default: aiRouter } = await import("./routes/ai.Routes.js");

// Routes
app.use("/api/users", userRouter);
app.use("/api/resumes", resumeRouter);
app.use("/api/ai", aiRouter);

// Health check
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});