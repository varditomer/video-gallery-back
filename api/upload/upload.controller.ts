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

        return {
          allowedContentTypes: [
            "video/mp4",
            "video/webm",
            "video/quicktime",
            "video/x-msvideo",
          ],
          tokenPayload: JSON.stringify({
            fileName: pathname,
            timestamp: Date.now(),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          console.log("Video upload completed:", blob);

          // Process the video (generate thumbnail and store metadata)
          const processedVideo = await uploadService.processVideo(blob);
          console.log("Video processed successfully:", processedVideo);
        } catch (error) {
          console.error("Error processing video:", error);
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

// In your upload controller
const processUploadedVideo = async (req: Request, res: Response) => {
  try {
    console.log("Request body:", req.body);
    const { blobUrl, fileName } = req.body;
    
    console.log("blobUrl:", blobUrl);
    console.log("fileName:", fileName);

    // Create a complete blob-like object that matches PutBlobResult
    const blobInfo = {
      url: blobUrl,
      pathname: fileName,
      contentType: "video/mp4",
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
