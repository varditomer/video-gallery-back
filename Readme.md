# Video Processing Backend

A serverless Node.js/Express backend deployed on Vercel that handles video uploads, thumbnail generation, and provides API endpoints for a video gallery application.

## Features

- **Video Upload & Processing**:
  - Accepts video uploads using Vercel Blob Storage
  - Works with client-side generated thumbnails
  - Stores metadata in MongoDB/Atlas DB
  - Supports local development and Vercel deployment

- **Gallery Management**:
  - Retrieve all videos with metadata
  - Get individual video details
  - Pagination and sorting support

## Project Structure

```
/
├── api/                           # Serverless API endpoints (Vercel routes)
│   ├── alive.ts                   # GET /api/alive - Health check endpoint
│   ├── upload/                    # Upload endpoints
│   │   ├── index.ts               # POST /api/upload - Handle video uploads
│   │   ├── process.ts             # POST /api/upload/process - Process videos
│   │   ├── upload.controller.ts   # Upload controller logic
│   │   └── upload.service.ts      # Upload business logic
│   └── gallery/                   # Gallery endpoints
│       ├── index.ts               # GET /api/gallery - List all videos
│       ├── gallery-by-id.ts       # GET /api/gallery/:id - Get specific video
│       ├── gallery.controller.ts  # Gallery controller logic
│       └── gallery.service.ts     # Gallery business logic
├── lib/                           # Shared libraries and utilities
│   ├── services/                  # Database connection and models
│   │   └── db.service.ts          # MongoDB connection
│   └── utils/                     # Utility functions
│       └── cors.ts                # CORS handling utility
├── public/                        # Static files (built frontend)
├── local-server.ts                # Local development server
├── tsconfig.json                  # TypeScript configuration
├── vercel.json                    # Vercel configuration
├── package.json                   # Dependencies and scripts
├── .env                           # Environment variables (local)
└── README.md                      # This file
```

## Technology Stack

- **Node.js/Express**: Backend server framework
- **TypeScript**: Type-safe JavaScript
- **MongoDB/Atlas DB**: Database for storing video metadata
- **Vercel Blob Storage**: Storage solution for videos and thumbnails
- **Vercel Serverless Functions**: Deployment platform

## Key Features Implementation

### Video Processing Architecture

The backend supports a hybrid approach to thumbnail generation:

1. **Client-side Thumbnails**: The frontend generates thumbnails using HTML5 Canvas
2. **Metadata Storage**: The backend receives upload metadata and stores it in MongoDB
3. **Unified API**: Works consistently in both development and production environments

This approach eliminates the dependency on FFmpeg, which isn't available in Vercel's serverless environment.

### Environment-Aware Implementation

The codebase is designed to adapt between:

- **Local Development**: Full Express server with additional debug endpoints
- **Vercel Deployment**: Serverless functions with production optimizations

## Setup and Installation

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- MongoDB instance (local or Atlas)
- Vercel account (for deployment)

### Environment Variables

Create a `.env` file with the following variables:

```
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/video-gallery

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Local Development
PORT=3000
```

### Installation

```bash
# Clone the repository
git clone https://github.com/varditomer/video-gallery-back
cd video-processing-backend

# Install dependencies
npm install
# or
yarn install
```

### Local Development

```bash
# Start the local development server
npm run dev
# or
yarn dev
```

The server will be available at `http://localhost:3000`.

## API Endpoints

### Upload Endpoints

- **POST /api/upload**
  - Handles Vercel Blob client uploads
  - Used by frontend for video and thumbnail uploads

- **POST /api/upload/process**
  - Processes uploaded videos and thumbnails
  - Stores metadata in MongoDB
  - Used in both development and production

### Gallery Endpoints

- **GET /api/gallery**
  - Returns a list of all uploaded videos
  - Supports pagination with `limit` and `page` query parameters
  - Supports sorting with `sort` and `order` query parameters

- **GET /api/gallery/:id**
  - Returns details for a specific video by ID

## Deployment to Vercel

### Setup

1. Connect your GitHub repository to Vercel
2. Configure Environment Variables in the Vercel dashboard
3. Set build settings to use the correct Node.js version

### Custom Configuration

The `vercel.json` file configures the deployment:

```json
{
  "builds": [
    { "src": "api/**/*.ts", "use": "@vercel/node" },
    { "src": "public/**", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/public/$1" }
  ]
}
```

This configuration ensures:
- API routes are handled by serverless functions
- Static frontend files are served from the public directory
- All non-API routes are directed to the React application

## Local vs. Deployment Differences

### Local Development

- Uses a full Express server via `local-server.ts`
- Manually triggers the `process` endpoint after uploads
- Has additional debug logging

### Vercel Deployment

- Uses serverless functions for each API endpoint
- Utilizes `onUploadCompleted` webhook for Vercel Blob
- Integrated with Atlas DB for production data

## Handling Thumbnail Generation

Since FFmpeg is not available in Vercel's serverless environment, we implemented a solution that:

1. Uses client-side thumbnail generation via HTML5 Canvas
2. Uploads both video and thumbnail to Vercel Blob
3. Associates them in the database

This approach works consistently across all environments without dependencies on binary executables.

## Troubleshooting

### Common Issues

- **CORS Errors**: Check the allowed origins in `utils/cors.ts`
- **Blob Upload Failures**: Verify your `BLOB_READ_WRITE_TOKEN` is valid
- **Database Connection Issues**: Ensure your MongoDB URI is correct and network rules allow connections
