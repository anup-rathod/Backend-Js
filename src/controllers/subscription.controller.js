import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors(["Invalid channel ID"])
            .build();
    }

    // Check if already subscribed
    const existingSub = await Subscription.findOne({
        channel: channelId,
        subscriber: userId
    });

    if (existingSub) {
        // Unsubscribe
        await Subscription.deleteOne({ _id: existingSub._id });
        return res.status(200).json(
            ApiResponse.builder()
                .setStatusCode(200)
                .setData(null)
                .setMessage("Unsubscribed from channel")
                .build()
        );
    } else {
        // Subscribe
        const newSub = await Subscription.create({
            channel: channelId,
            subscriber: userId
        });
        return res.status(201).json(
            ApiResponse.builder()
                .setStatusCode(201)
                .setData(newSub)
                .setMessage("Subscribed to channel successfully")
                .build()
        );
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors("Channel ID is required")
            .build();
    }

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username avatar"); 

    return res.status(200).json(
        ApiResponse.builder()
            .setStatusCode(200)
            .setData({ count: subscribers.length, subscribers })
            .setMessage("Subscribers fetched successfully")
            .build()
    );
});


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!subscriberId){
        throw ApiError.builder()
            .setStatusCode(404)
            .setErrors()
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}