import express from 'express';
import galleryRoutes from './api/gallery/gallery.routes';
import uploadRoutes from './api/upload/upload.routes';

const router = express.Router();

router.use('/gallery', galleryRoutes);
router.use('/upload', uploadRoutes);

export default router;
