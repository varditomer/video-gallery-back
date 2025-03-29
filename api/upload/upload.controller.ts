// upload.controller.ts
import { Request, Response } from "express";
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

// Handle Vercel Blob client upload token generation and completion
const handleBlobUpload = async (req: Request, res: Response) => {
  try {
    const body = req.body as HandleUploadBody;

     // Get token from environment or fallback
     const token = process.env.BLOB_READ_WRITE_TOKEN;
    
     console.log("Token available:", !!token);
     
     if (!token) {
       console.error("BLOB_READ_WRITE_TOKEN not found in environment variables");
       return res.status(500).json({
         error: "Blob token not configured on server"
       });
     }
    
    const jsonResponse = await handleUpload({
      body,
      request: req,
      token: 'vercel_blob_rw_Don0j4yn15QigBE3_y7yDfYCxRn1T1wHpK3efUUxd3PFlcw',
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
          
          // In a real application, you would store metadata in a database here
          // For example: 
          // await db.videos.create({
          //   url: blob.url,
          //   fileName: blob.pathname,
          //   contentType: blob.contentType,
          //   uploadedAt: new Date()
          // });
          
        } catch (error) {
          console.error('Error in onUploadCompleted:', error);
        }
      },
    });

    return res.json(jsonResponse);
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
