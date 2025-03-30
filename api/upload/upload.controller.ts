// api/upload/upload.controller.ts
import { Request, Response } from "express";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { uploadService } from "./upload.service.js";

// Handle Vercel Blob client upload token generation and completion
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

        // Accept both video and image content types
        const isThumb = pathname.includes("-thumb.jpg") || pathname.includes("-thumb.jpeg");

        const allowedContentTypes = isThumb
          ? ["image/jpeg", "image/jpg"]
          : ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];

        return {
          allowedContentTypes,
          tokenPayload: JSON.stringify({
            fileName: pathname,
            isThumb,
            timestamp: Date.now(),
          }),
        };
      },
      // We won't use this callback anymore since we're handling processing in the process endpoint
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          console.log("Upload completed:", blob);
          // We don't need to do anything here since both video and thumbnail uploads
          // will be processed together in the process endpoint
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

// Process uploaded video (used in both development and production)
const processUploadedVideo = async (req: Request, res: Response) => {
  try {
    console.log("Processing video metadata:", req.body);
    const { videoUrl, videoPathname, thumbnailUrl, thumbnailPathname, width, height } = req.body;

    if (!videoUrl || !videoPathname) {
      return res.status(400).json({
        error: "Missing required video parameters",
      });
    }

    // Create metadata for processing
    const videoMetadata = {
      videoUrl,
      videoPathname,
      thumbnailUrl: thumbnailUrl || "",
      thumbnailPathname: thumbnailPathname || "",
      width: width || 0,
      height: height || 0,
    };

    // Process the video with the provided thumbnail
    const processedVideo = await uploadService.saveVideoMetadata(videoMetadata);

    res.status(200).json({
      success: true,
      data: processedVideo,
    });
  } catch (error: any) {
    console.error("Error processing video:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

export const uploadController = {
  handleBlobUpload,
  processUploadedVideo,
};
