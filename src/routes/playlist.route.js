import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist
} from "../controllers/playlist.controller.js";

const router = Router();

// Create a new playlist
router.post("/create", verifyJWT, createPlaylist);

// Get all playlists of current user
router.get("/my-playlists", verifyJWT, getUserPlaylists);

// Get a specific playlist by ID
router.get("/:id", verifyJWT, getPlaylistById);

// Update playlist details
router.patch("/:id/update", verifyJWT, updatePlaylist);

// Add a video to playlist
router.patch("/:id/add-video", verifyJWT, addVideoToPlaylist);

// Remove a video from playlist
router.patch("/:id/remove-video", verifyJWT, removeVideoFromPlaylist);

// Delete a playlist
router.patch("/:id/delete", verifyJWT, deletePlaylist);

export default router;