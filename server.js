import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";

import userRouter from "./routes/userRoutes.js";
import resumeRouter from "./routes/resume.Routes.js";
import aiRouter from "./routes/ai.Routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ========================
// CORS CONFIG (FIXED)
// ========================
app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        origin === "http://localhost:5173" ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Blocked by CORS"));
      }
    },
    credentials: true,
  })
);

// ========================
// BODY PARSER (MUST COME FIRST)
// ========================
app.use(express.json());

// ========================
// DEBUG LOGGER (NOW WORKS PROPERLY)
// ========================
app.use((req, res, next) => {
  // console.log("Incoming:", req.method, req.url);
  // console.log("Body:", req.body);
  next();
});

// Routes
app.use("/api/users", userRouter);
app.use("/api/resumes", resumeRouter);
app.use("/api/ai", aiRouter);

// Health check
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

// Root route
app.get("/", (req, res) => {
  res.send("Resume Builder API is running");
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

// Start server safely
const startServer = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("DB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();