// api/upload/upload.controller.ts
import { Request, Response } from "express";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { uploadService } from "./upload.service.js";

// Handle Vercel Blob client upload token generation and completion for videos
const handleBlobUpload = async (req: Request, res: Response) => {
  try {
    const body = req.body as HandleUploadBody;

    // Get token from environment
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    console.log("Token available:", !!token);

    if (!token) {
      console.error("BLOB_READ_WRITE_TOKEN not found in environment variables");
      return res.status(500).json({
        error: "Blob token not configured on server",
      });
    }

    // Process the upload using Vercel Blob
    const jsonResponse = await handleUpload({
      body,
      request: req,
      token, // Explicitly pass the token
      onBeforeGenerateToken: async (pathname) => {
        // Generate a client token for the browser to upload the file
        console.log(`Generating token for ${pathname}`);

        return {
          allowedContentTypes: ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"],
          tokenPayload: JSON.stringify({
            fileName: pathname,
            timestamp: Date.now(),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          console.log("Video upload completed:", blob);
          // We don't process here anymore since we'll wait for the client to link video and thumbnail
        } catch (error) {
          console.error("Error in onUploadCompleted callback:", error);
        }
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error: any) {
    console.error("Error handling Blob upload:", error);
    return res.status(400).json({
      error: error.message,
    });
  }
};

// Handle thumbnail upload
const handleThumbnailUpload = async (req: Request, res: Response) => {
  try {
    const body = req.body as HandleUploadBody;
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "Blob token not configured on server",
      });
    }

    const jsonResponse = await handleUpload({
      body,
      request: req,
      token,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ["image/jpeg", "image/png"],
          tokenPayload: JSON.stringify({
            fileName: pathname,
            timestamp: Date.now(),
          }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Thumbnail upload completed:", blob);
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error: any) {
    console.error("Error handling thumbnail upload:", error);
    return res.status(400).json({
      error: error.message,
    });
  }
};

// Process uploaded video (used in development only)
const processUploadedVideo = async (req: Request, res: Response) => {
  try {
    console.log("Request body for manual processing:", req.body);
    const { blobUrl, fileName } = req.body;

    if (!blobUrl || !fileName) {
      return res.status(400).json({
        error: "Missing required parameters: blobUrl and fileName",
      });
    }

    console.log("Processing video manually:", { blobUrl, fileName });

    // Create a blob-like object that matches PutBlobResult
    const blobInfo = {
      url: blobUrl,
      pathname: fileName,
      contentType: getContentTypeFromFilename(fileName) || "video/mp4",
      downloadUrl: blobUrl, // Same as url for simplicity
      contentDisposition: "inline", // Default value
    };

    // Process the video manually
    const processedVideo = await uploadService.processVideo(blobInfo);

    res.status(200).json({
      success: true,
      data: processedVideo,
    });
  } catch (error: any) {
    console.error("Error processing video manually:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

// Process video with thumbnail URL provided
const processVideoWithThumbnail = async (req: Request, res: Response) => {
  try {
    const { videoUrl, thumbnailUrl, fileName } = req.body;

    if (!videoUrl || !thumbnailUrl) {
      return res.status(400).json({
        error: "Missing required parameters: videoUrl and thumbnailUrl",
      });
    }

    console.log("Processing video with thumbnail:", { videoUrl, thumbnailUrl });

    // Get file size using HTTP HEAD request
    let fileSizeInBytes = 0;
    try {
      fileSizeInBytes = await new Promise((resolve, reject) => {
        require("https")
          .request(videoUrl, { method: "HEAD" }, (response: any) => {
            const contentLength = response.headers["content-length"];
            resolve(contentLength ? parseInt(contentLength, 10) : 0);
          })
          .on("error", reject)
          .end();
      });
    } catch (error) {
      console.error("Error getting file size:", error);
    }

    // Extract file basename from URL or use provided fileName
    const videoBasename = fileName || videoUrl.split("/").pop().split("?")[0];

    // Create video metadata
    const videoMetadata = {
      title: videoBasename.replace(/\.[^/.]+$/, ""), // Remove extension
      videoUrl,
      thumbnailUrl,
      contentType: getContentTypeFromFilename(videoBasename) || "video/mp4",
      size: fileSizeInBytes,
      uploadDate: new Date(),
    };

    // Store in database
    const videosCollection = await uploadService.dbService.getCollection("videos");
    const result = await videosCollection.insertOne(videoMetadata);

    res.status(200).json({
      success: true,
      data: {
        id: result.insertedId,
        ...videoMetadata,
      },
    });
  } catch (error: any) {
    console.error("Error processing video with thumbnail:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

// Helper function to determine content type from filename
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

export const uploadController = {
  handleBlobUpload,
  handleThumbnailUpload,
  processUploadedVideo,
  processVideoWithThumbnail,
};
