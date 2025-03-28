// upload.routes.ts
import express from 'express';
import { uploadController } from './upload.controller.js';
const { upload } = uploadController;
const router = express.Router();
router.get("/", upload);
export const uploadRouter = router;
