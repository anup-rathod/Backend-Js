import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    const tweet = await Tweet.create({
        content: content,
        owner: req.user._id,
    });

    if (!tweet) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors("Failed to create tweet")
            .build();
    }

    const populatedTweet = await Tweet.findById(tweet._id).populate(
        "owner",
        "username avatar"
    );

    return res
        .status(201)
        .json(
            ApiResponse.builder()
                .setStatusCode(201)
                .setData(populatedTweet)
                .setMessage("Tweet created successfully")
                .build()
        );
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId || !isValidObjectId(userId)) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors("Invalid user ID")
            .build();
    }

    const tweets = await Tweet.find({ owner: userId })
        .populate("owner", "username avatar")
        .sort({ createdAt: -1 });

    if (!tweets || tweets.length === 0) {
        return res
            .status(404)
            .json(
                ApiResponse.builder()
                    .setStatusCode(404)
                    .setErrors("No tweets found for this user")
                    .build()
            );
    }

    return res
        .status(200)
        .json(
            ApiResponse.builder()
                .setStatusCode(200)
                .setData(tweets)
                .setMessage("User tweets fetched successfully")
                .build()
        );
});

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;

    if (!tweetId || !isValidObjectId(tweetId)) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors("Invalid tweet ID")
            .build();
    }

    const { content } = req.body;
    if (!content) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors("Content is required to update tweet")
            .build();
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { content },
        { new: true }
    ).populate("owner", "username avatar");


    if (!tweet) {
        throw ApiError.builder()
            .setStatusCode(404)
            .setErrors("Tweet not found")
            .build();
    }

    return res
        .status(200)
        .json(ApiResponse.builder()
            .setStatusCode(200)
            .setData(tweet)
            .setMessage("Tweet updated successfully")
            .build()
        );

});

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;
    if (!tweetId || !isValidObjectId(tweetId)) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors("Invalid tweet ID")
            .build();
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId);
    if (!tweet) {
        throw ApiError.builder()
            .setStatusCode(404)
            .setErrors("Tweet not found")
            .build();
    }

    return res
        .status(200)
        .json(ApiResponse.builder()
            .setStatusCode(200)
            .setData(tweet)
            .setMessage("Tweet deleted successfully")
            .build()
        );
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
