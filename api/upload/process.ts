// api/upload/process.ts
import { Request, Response } from "express";
import { uploadController } from "./upload.controller.js";
import { handleCors } from "../../lib/utils/cors.js";

export default async function handler(req: Request, res: Response) {
  // Handle CORS
  handleCors(req, res);

  // Handle OPTIONS for CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Call the controller method for processing
  return uploadController.processUploadedVideo(req, res);
}
