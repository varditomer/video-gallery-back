import express from "express";
import { galleryController } from "./gallery.controller.js";
const { getVideos, getVideoById } = galleryController;
const router = express.Router();
// Define routes with controller handlers
router.get("/", (req, res) => {
    getVideos(req, res);
});
router.get("/:id", (req, res) => {
    getVideoById(req, res);
});
export const galleryRouter = router;
