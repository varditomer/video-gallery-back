// api/upload/upload.service.ts
import { put, PutBlobResult } from "@vercel/blob";
import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { dbService } from "../../lib/services/db.service.js";

// Determine environment
const isDevelopment = process.env.NODE_ENV !== "production";

// For conditional imports in ESM
// Define types for ffmpeg modules
type FfmpegType = any; // You could use a more specific type if needed
type FfmpegStaticType = any; // Using any to handle the module type

let ffmpeg: FfmpegType | undefined;
let ffmpegStatic: string | undefined;

// Dynamically import ffmpeg modules in development
if (isDevelopment) {
  try {
    // Use dynamic import for ES modules
    const fluentFfmpegPromise = import("fluent-ffmpeg");
    const ffmpegStaticPromise = import("ffmpeg-static");

    // Wait for imports to complete
    Promise.all([fluentFfmpegPromise, ffmpegStaticPromise])
      .then(([fluentFfmpegModule, ffmpegStaticModule]) => {
        ffmpeg = fluentFfmpegModule.default;
        // Extract the string path from the ffmpeg-static module
        ffmpegStatic = ffmpegStaticModule.default as unknown as string;

        // Set ffmpeg path
        ffmpeg.setFfmpegPath(ffmpegStatic);
        console.log("FFmpeg initialized successfully for development");
      })
      .catch((error) => {
        console.warn("Failed to initialize FFmpeg:", error);
      });
  } catch (error) {
    console.warn("Failed to import FFmpeg modules:", error);
  }
}

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
 * Only works in development environment
 */
const generateThumbnail = async (videoPath: string, outputPath: string): Promise<boolean> => {
  if (!isDevelopment) {
    console.log("Skipping thumbnail generation in production environment");
    return false;
  }

  if (!ffmpeg) {
    console.warn("FFmpeg not available yet, skipping thumbnail generation");
    return false;
  }

  // Type assertion to help TypeScript recognize ffmpeg is available
  const ffmpegInstance = ffmpeg as FfmpegType;

  try {
    return new Promise((resolve, reject) => {
      ffmpegInstance(videoPath)
        .on("end", () => resolve(true))
        .on("error", (err: Error) => {
          console.error("Error generating thumbnail:", err);
          reject(err);
        })
        .screenshots({
          count: 1,
          folder: path.dirname(outputPath),
          filename: path.basename(outputPath),
          size: "320x240",
          timemarks: ["00:00:02"], // Take screenshot at 2 seconds
        });
    });
  } catch (error) {
    console.error("Error in thumbnail generation:", error);
    return false;
  }
};

/**
 * Get a still frame from the video URL (for production)
 * This is a simplified approach that works in production
 */
const getDefaultThumbnail = async (videoBasename: string): Promise<string> => {
  // Use a default placeholder image
  const placeholderUrl = "https://placehold.co/320x240/gray/white?text=Video+Preview";

  // For a real implementation, you could:
  // 1. Use a cloud service API to generate thumbnails
  // 2. Use a predefined placeholder specific to the video type
  // 3. Use the first frame of the video if available via another service

  return placeholderUrl;
};

/**
 * Process a video that has been uploaded to Vercel Blob
 * Handles both development and production environments
 */
const processVideo = async (blob: PutBlobResult) => {
  try {
    console.log("Processing video:", blob.url);

    // Extract file details
    const videoExt = path.extname(blob.pathname);
    const videoBasename = path.basename(blob.pathname, videoExt);
    let thumbnailUrl = "";
    let fileSizeInBytes = 0;

    if (isDevelopment) {
      // Development flow - download and process locally
      const uniqueId = Date.now().toString();
      const tempVideoPath = path.join(tempDir, `${videoBasename}-${uniqueId}${videoExt}`);
      const thumbnailPath = path.join(tempDir, `${videoBasename}-${uniqueId}-thumb.jpg`);

      try {
        // Download the video from Vercel Blob
        console.log("Downloading video to:", tempVideoPath);
        await downloadFile(blob.url, tempVideoPath);

        // Get file size
        const stats = fs.statSync(tempVideoPath);
        fileSizeInBytes = stats.size;

        // Generate thumbnail
        console.log("Generating thumbnail at:", thumbnailPath);
        const success = await generateThumbnail(tempVideoPath, thumbnailPath);

        if (success && fs.existsSync(thumbnailPath)) {
          // Upload thumbnail to Vercel Blob
          console.log("Uploading thumbnail to Vercel Blob");
          const thumbnailFilename = `${videoBasename}-thumb.jpg`;
          const result = await put(thumbnailFilename, fs.readFileSync(thumbnailPath), {
            access: "public",
            contentType: "image/jpeg",
          });
          thumbnailUrl = result.url;
          fs.unlinkSync(thumbnailPath); // Clean up thumbnail file
        }

        // Clean up temporary files
        fs.unlinkSync(tempVideoPath);
      } catch (error) {
        console.error("Error in development processing:", error);
        // Continue with available information
      }
    } else {
      // Production flow - no local processing
      // Get default thumbnail or placeholder
      thumbnailUrl = await getDefaultThumbnail(videoBasename);

      // For size, we could:
      // 1. Use HTTP HEAD request to get Content-Length
      // 2. Use a default size
      // 3. Skip the size or set it to 0
      try {
        // Get file size using HTTP HEAD request
        const sizeInfo = await new Promise((resolve, reject) => {
          https
            .request(blob.url, { method: "HEAD" }, (response) => {
              const contentLength = response.headers["content-length"];
              resolve(contentLength ? parseInt(contentLength, 10) : 0);
            })
            .on("error", reject)
            .end();
        });
        fileSizeInBytes = sizeInfo as number;
      } catch (error) {
        console.error("Error getting file size:", error);
        fileSizeInBytes = 0; // Default to 0 if we can't get the size
      }
    }

    // Extract video metadata (works in both environments)
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
  dbService, // Export dbService for use in the controller
};
