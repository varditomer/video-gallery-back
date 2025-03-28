import { galleryService } from "./gallery.service.js";
// Controller for fetching all videos
export const getVideos = async (req, res) => {
    try {
        const videos = await galleryService.getVideos();
        return res.status(200).json({
            success: true,
            message: "Get videos endpoint placeholder",
            data: videos,
        });
    }
    catch (error) {
        console.error("Error in gallery controller:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
// Controller for fetching a single video by ID
export const getVideoById = async (req, res) => {
    try {
        const { id } = req.params;
        const video = await galleryService.getVideoById(id);
        return res.status(200).json({
            success: true,
            message: `Get video ${id} endpoint placeholder`,
            data: video,
        });
    }
    catch (error) {
        console.error("Error in gallery controller:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const galleryController = {
    getVideos,
    getVideoById,
};
