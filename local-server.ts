import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Import API handlers (routes)
import aliveHandler from "./api/alive.js";
import uploadHandler from "./api/upload/index.js";
import processHandler from "./api/upload/process.js";
// import galleryHandler from "./api/gallery/index.js";
// import galleryByIdHandler from "./api/gallery/[id].js";

// Setup Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
import { getAllowedOrigins } from "./lib/utils/cors.js";

// Middleware
const allowedOrigins = getAllowedOrigins();
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

// API Routes - map to the serverless functions
app.get("/api/alive", async (req, res) => {
  await aliveHandler(req, res);
});

app.post("/api/upload", async (req, res) => {
  await uploadHandler(req, res);
});

app.post("/api/upload/process", async (req, res) => {
  await processHandler(req, res);
});

// app.get("/api/gallery", (req, res) => galleryHandler(req, res));
// app.get("/api/gallery/:id", (req, res) => {
//   // Map route parameter to query parameter expected by [id].js
//   req.query.id = req.params.id;
//   return galleryByIdHandler(req, res);
// });

// Make every server-side-route to match the index.html
// so when requesting http://localhost:3000/index.html/video/123 it will still respond with
// our SPA (single page app) (the index.html file) and allow react-router to take it from there
app.get("/**", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(
    `🚀 Local development server running at http://localhost:${PORT}`
  );
});
