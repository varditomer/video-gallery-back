// api/upload/upload.service.ts
import * as https from "https";
import { dbService } from "../../lib/services/db.service.js";

/**
 * Video metadata structure for storing in the database
 */
interface VideoMetadata {
  videoUrl: string;
  videoPathname: string;
  thumbnailUrl: string;
  thumbnailPathname: string;
  width: number;
  height: number;
}

/**
 * Get file size from a URL using HTTP HEAD request
 */
const getFileSize = async (url: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    https
      .request(url, { method: "HEAD" }, (response) => {
        const contentLength = response.headers["content-length"];
        resolve(contentLength ? parseInt(contentLength, 10) : 0);
      })
      .on("error", reject)
      .end();
  });
};

/**
 * Save video metadata to the database
 */
const saveVideoMetadata = async (metadata: VideoMetadata) => {
  try {
    console.log("Saving video metadata:", metadata);

    // Extract file details
    const videoPathname = metadata.videoPathname;
    const videoUrl = metadata.videoUrl;
    const thumbnailUrl = metadata.thumbnailUrl;

    // Get the video filename without extension
    const videoExt = videoPathname.substring(videoPathname.lastIndexOf("."));
    const videoBasename = videoPathname.substring(0, videoPathname.lastIndexOf("."));

    // Get file size using HTTP HEAD request
    let fileSizeInBytes = 0;
    try {
      fileSizeInBytes = await getFileSize(videoUrl);
      console.log(`File size for ${videoPathname}: ${fileSizeInBytes} bytes`);
    } catch (error) {
      console.error("Error getting file size:", error);
    }

    // Create complete video metadata for database
    const videoDbMetadata = {
      title: videoBasename,
      videoUrl,
      thumbnailUrl,
      width: metadata.width || 0,
      height: metadata.height || 0,
      contentType: getContentTypeFromFilename(videoPathname) || "video/mp4",
      size: fileSizeInBytes,
      uploadDate: new Date(),
    };

    // Store video metadata in the database using our database service
    console.log("Storing video metadata in database:", videoDbMetadata);
    const videosCollection = await dbService.getCollection("videos");
    const result = await videosCollection.insertOne(videoDbMetadata);

    return {
      id: result.insertedId,
      ...videoDbMetadata,
    };
  } catch (error) {
    console.error("Error saving video metadata:", error);
    throw error;
  }
};

/**
 * Helper function to determine content type from filename
 */
function getContentTypeFromFilename(fileName: string): string | null {
  const extension = fileName.split(".").pop()?.toLowerCase();

  const contentTypeMap: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
  };

  return extension ? contentTypeMap[extension] || null : null;
}

export const uploadService = {
  saveVideoMetadata,
};
