// api/gallery/index.ts
import { Request, Response } from "express";
import { handleCors } from "../../lib/utils/cors.js";
import { galleryController } from "./gallery.controller.js";

export default async function handler(req: Request, res: Response) {
  // Handle CORS
  handleCors(req, res);

  // Handle OPTIONS for CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Call the controller to get all videos
  return galleryController.getAllVideos(req, res);
}
