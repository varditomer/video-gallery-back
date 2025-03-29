// api/upload/upload.controller.ts
import { Request, Response } from 'express';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
// import { uploadService } from './upload.service.js';

// Handle Vercel Blob client upload token generation and completion
const handleBlobUpload = async (req: Request, res: Response) => {
  try {
    const body = req.body as HandleUploadBody;

    // Process the upload using Vercel Blob
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Generate a client token for the browser to upload the file
        console.log(`Generating token for ${pathname}`);
        
        return {
          allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
          tokenPayload: JSON.stringify({
            fileName: pathname,
            timestamp: Date.now()
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          console.log('Video upload completed:', blob);
          console.log('Token payload:', tokenPayload);
          
          // Process the uploaded video
          // await uploadService.processVideo(blob, tokenPayload);
        } catch (error) {
          console.error('Error in onUploadCompleted:', error);
        }
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error: any) {
    console.error("Error handling Blob upload:", error);
    return res.status(400).json({
      error: error.message
    });
  }
};

export const uploadController = {
  handleBlobUpload,
};
