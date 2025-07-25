import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
  getChannelStats,
  getChannelVideos
} from "../controllers/dashboard.controller.js";

const router = Router();

// 📊 Get channel statistics (views, subs, likes, etc.)
router.route("/stats").get(verifyJWT, getChannelStats);

// 🎥 Get videos uploaded by the current user's channel
router.route("/videos").get(verifyJWT, getChannelVideos);

export default router;