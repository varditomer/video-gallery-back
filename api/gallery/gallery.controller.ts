// api/gallery/gallery.controller.ts
import { Request, Response } from "express";
import { galleryService } from "./gallery.service.js";

// Get all videos
const getAllVideos = async (req: Request, res: Response) => {
  try {
    const videos = await galleryService.getAllVideos();
    return res.status(200).json({ videos });
  } catch (error: any) {
    console.error("Error fetching all videos:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch videos" });
  }
};

// Get a video by ID
const getVideoById = async (req: Request, res: Response) => {
  try {
    const id = req.query.id as string;
    const video = await galleryService.getVideoById(id);

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    return res.status(200).json({ video });
  } catch (error: any) {
    console.error(`Error fetching video ${req.query.id}:`, error);
    return res.status(500).json({ error: error.message || "Failed to fetch video" });
  }
};

export const galleryController = {
  getAllVideos,
  getVideoById,
};
