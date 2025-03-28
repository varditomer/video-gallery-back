import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// CORS Configuration
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'public')))
} else {
    const allowedOrigins = ['http://127.0.0.1:5173', 'http://localhost:5173']; // Default React URL
    app.use(cors({
        origin: allowedOrigins,
        credentials: true
    }))
}

app.use(express.json()); // Parse JSON requests

// routes

// Health Check Route
app.get("/api/alive", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", message: "Server is Alive!" });
});

// Make every server-side-route to match the index.html
// so when requesting http://localhost:3000/index.html/video/123 it will still respond with
// our SPA (single page app) (the index.html file) and allow react-router to take it from there
app.get('/**', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})


// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
