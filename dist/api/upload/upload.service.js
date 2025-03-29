// upload.service.ts
import { put } from "@vercel/blob";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import * as https from "https";
import ffmpeg from "fluent-ffmpeg";
import os from "os";
// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Temp directory for processing
const tempDir = path.join(os.tmpdir(), "video-processing");
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}
/**
 * Download a file from a URL to a local path
 */
const downloadFile = async (url, localPath) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(localPath);
        https
            .get(url, (response) => {
            response.pipe(file);
            file.on("finish", () => {
                file.close();
                resolve();
            });
        })
            .on("error", (err) => {
            fs.unlink(localPath, () => { }); // Clean up file on error
            reject(err);
        });
    });
};
/**
 * Generate a thumbnail from a video
 */
const generateThumbnail = async (videoPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .on("end", () => resolve(outputPath))
            .on("error", (err) => reject(err))
            .screenshots({
            count: 1,
            folder: path.dirname(outputPath),
            filename: path.basename(outputPath),
            size: "320x240",
            timemarks: ["00:00:02"], // Take screenshot at 2 seconds
        });
    });
};
/**
 * Process the videos that have been uploaded to Vercel Blob Storage
 */
const processVideos = async (videos) => {
    const processedVideos = [];
    for (const video of videos) {
        try {
            // Create temp paths for processing
            const tempVideoPath = path.join(tempDir, video.fileName);
            const thumbnailFileName = `${path.basename(video.fileName, path.extname(video.fileName))}-thumb.jpg`;
            const tempThumbnailPath = path.join(tempDir, thumbnailFileName);
            // Download video from Vercel Blob
            await downloadFile(video.url, tempVideoPath);
            // Generate thumbnail
            await generateThumbnail(tempVideoPath, tempThumbnailPath);
            // Upload thumbnail to Vercel Blob
            const { url: thumbnailUrl } = await put(thumbnailFileName, fs.readFileSync(tempThumbnailPath), {
                access: "public",
                contentType: "image/jpeg",
            });
            // Clean up temp files
            fs.unlinkSync(tempVideoPath);
            fs.unlinkSync(tempThumbnailPath);
            // Add to processed videos
            processedVideos.push({
                videoUrl: video.url,
                fileName: video.fileName,
                thumbnailUrl,
                thumbnailName: thumbnailFileName,
                contentType: video.contentType,
                uploadDate: new Date(),
            });
        }
        catch (error) {
            console.error(`Error processing video ${video.fileName}:`, error);
            // Continue processing other videos
        }
    }
    return processedVideos;
};
// Export all functions as a single object
export const uploadService = {
    processVideos,
};
