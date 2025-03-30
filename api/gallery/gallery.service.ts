// api/gallery/gallery.service.ts
import { ObjectId } from "mongodb";
import { dbService } from "../../lib/services/db.service.js";

// Get all videos
const getAllVideos = async () => {
  try {
    const videosCollection = await dbService.getCollection("videos");
    const videos = await videosCollection
      .find()
      .sort({ uploadDate: -1 }) // Newest first
      .toArray();

    return videos;
  } catch (error) {
    console.error("Error fetching videos from database:", error);
    throw error;
  }
};

// Get a video by ID
const getVideoById = async (id: string) => {
  try {
    const videosCollection = await dbService.getCollection("videos");
    const video = await videosCollection.findOne({ _id: new ObjectId(id) });
    return video;
  } catch (error) {
    console.error(`Error fetching video with ID ${id}:`, error);
    throw error;
  }
};

export const galleryService = {
  getAllVideos,
  getVideoById,
};
