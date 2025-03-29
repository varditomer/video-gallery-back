// upload.routes.ts
import express from "express";
import { uploadController } from "./upload.controller.js";
const { handleBlobUpload } = uploadController;
const router = express.Router();
// Handle the Vercel Blob client upload token generation and completion
router.post("/handle-upload", (req, res) => {
    handleBlobUpload(req, res);
});
// // Process videos after they've been uploaded to Vercel Blob
// router.post("/process", (req, res) => {
//   processUploadedVideos(req, res);
// });
export const uploadRouter = router;
