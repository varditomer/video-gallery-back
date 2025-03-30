// api/upload/upload.service.ts
import { put, PutBlobResult } from "@vercel/blob";
import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { dbService } from "../../lib/services/db.service.js";

// Set ffmpeg path
// @ts-ignore
ffmpeg.setFfmpegPath(ffmpegStatic);

// Create temp directory for video processing
const tempDir = path.join(os.tmpdir(), "video-processing");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Download a file from a URL to a local path
 */
const downloadFile = async (url: string, localPath: string): Promise<void> => {
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
        fs.unlink(localPath, () => {}); // Clean up file on error
        reject(err);
      });
  });
};

/**
 * Generate a thumbnail from a video file
 */
const generateThumbnail = async (videoPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .on("end", () => resolve())
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
 * Process a video that has been uploaded to Vercel Blob
 * - Download the video temporarily
 * - Generate a thumbnail
 * - Upload the thumbnail to Vercel Blob
 * - Store metadata in the database
 */
const processVideo = async (blob: PutBlobResult) => {
  try {
    console.log("Processing video:", blob.url);

    // Create temporary file paths
    const uniqueId = Date.now().toString();
    const videoExt = path.extname(blob.pathname);
    const videoBasename = path.basename(blob.pathname, videoExt);
    const tempVideoPath = path.join(tempDir, `${videoBasename}-${uniqueId}${videoExt}`);
    const thumbnailPath = path.join(tempDir, `${videoBasename}-${uniqueId}-thumb.jpg`);

    // Download the video from Vercel Blob
    console.log("Downloading video to:", tempVideoPath);
    await downloadFile(blob.url, tempVideoPath);

    // Generate thumbnail
    console.log("Generating thumbnail at:", thumbnailPath);
    await generateThumbnail(tempVideoPath, thumbnailPath);

    // Upload thumbnail to Vercel Blob
    console.log("Uploading thumbnail to Vercel Blob");
    const thumbnailFilename = `${videoBasename}-thumb.jpg`;
    const { url: thumbnailUrl } = await put(thumbnailFilename, fs.readFileSync(thumbnailPath), {
      access: "public",
      contentType: "image/jpeg",
    });

    // Get file size from temporary file
    const stats = fs.statSync(tempVideoPath);
    const fileSizeInBytes = stats.size;

    // Extract video metadata
    const videoMetadata = {
      title: videoBasename,
      videoUrl: blob.url,
      thumbnailUrl,
      contentType: blob.contentType || "video/mp4",
      size: fileSizeInBytes,
      uploadDate: new Date(),
    };

    // Store video metadata in the database using our database service
    console.log("Storing video metadata in database");
    const videosCollection = await dbService.getCollection("videos");
    const result = await videosCollection.insertOne(videoMetadata);

    // Clean up temporary files
    fs.unlinkSync(tempVideoPath);
    fs.unlinkSync(thumbnailPath);

    return {
      id: result.insertedId,
      ...videoMetadata,
    };
  } catch (error) {
    console.error("Error processing video:", error);
    throw error;
  }
};

export const uploadService = {
  processVideo,
};
