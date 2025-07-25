import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {toggleSubscription, getUserChannelSubscribers, getSubscribedChannels, getSubscriptionStatus} from "../controllers/subscription.controller.js"



const router = Router();





router.route("/toggle/:channelId").patch(verifyJWT, toggleSubscription);

router.route("/subscribers/:channelId").get(verifyJWT, getUserChannelSubscribers);


router.route("/subscribedto/:channelId").get(verifyJWT, getSubscribedChannels);

router.route("/subscription-status/:channelId").get(verifyJWT,getSubscriptionStatus)

export default router;