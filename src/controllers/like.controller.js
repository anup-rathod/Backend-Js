import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    // Validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors(["Invalid video ID"])
            .build();
    }

    // Check if user has already liked the video
    const existingVideoLike = await Like.findOne({
        video: videoId,
        likedBy: userId,
    });

    if (existingVideoLike) {
        // If already liked, remove the like (unlike)
        await Like.deleteOne({ _id: existingVideoLike._id });

        return res.status(200).json(
            ApiResponse.builder()
                .setStatusCode(200)
                .setData(null)
                .setMessage("Video unliked")
                .build()
        );
    } else {
        // If not liked, create a new like
        const newLike = await Like.create({
            video: videoId,
            likedBy: userId,
        });

        if (!newLike) {
            throw ApiError.builder()
                .setStatusCode(500)
                .setErrors(["Failed to like video"])
                .build();
        }

        return res
            .status(201)
            .json(
                ApiResponse.builder()
                    .setStatusCode(201)
                    .setData(newLike)
                    .setMessage("Video liked successfully")
                    .build()
            );
    }
});


const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    const userId = req.user._id;

    if (!commentId || !isValidObjectId(commentId)) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors(["Invalid comment ID"])
            .build();
    }

    // Check if user has already liked the comment
    const existingCommentLike = await Like.findOne({
        comment: commentId,
        likedBy: userId
    })

    if (existingCommentLike) {
        await Like.deleteOne({ _id: existingCommentLike._id })
        return res.status(200).json(
            ApiResponse.builder()
                .setStatusCode(200)
                .setData(null)
                .setMessage("Comment unliked")
                .build()
        )
    } else {
        const newCommentLike = await Like.create({
            comment: commentId,
            likedBy: userId
        })

        if (!newCommentLike) {
            throw ApiError.builder()
                .setStatusCode(500)
                .setErrors(["Failed to like comment"])
                .build();
        }

        return res
            .status(201)
            .json(
                ApiResponse.builder()
                    .setStatusCode(201)
                    .setData(newCommentLike)
                    .setMessage("Comment liked successfully")
                    .build()
            )
    }
})


const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    const userId = req.user._id;

    if (!tweetId || !isValidObjectId(tweetId)) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors(["Invalid tweet ID"])
            .build();
    }

    const existingTweetLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    })

    if (existingTweetLike) {
        await Like.deleteOne({ _id: existingTweetLike._id })
        return res.status(200).json(
            ApiResponse.builder()
                .setStatusCode(200)
                .setData(null)
                .setMessage("Tweet unliked")
                .build()
        )
    } else {
        const newTweetLike = await Like.create({
            tweet: tweetId,
            likedBy: userId
        })

        if (!newTweetLike) {
            throw ApiError.builder()
                .setStatusCode(500)
                .setErrors(["Failed to like tweet"])
                .build();
        }

        return res
            .status(201)
            .json(
                ApiResponse.builder()
                    .setStatusCode(201)
                    .setData(newTweetLike)
                    .setMessage("Tweet liked successfully")
                    .build()
            )

    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id;

    const likedVideos = await Like.find({ likedBy: userId, video: { $exists: true } })
        .populate("video", "title description thumbnail videoFile duration")
        .populate("likedBy", "username avatar");    

    if (!likedVideos || likedVideos.length === 0) {
        return res.status(404).json(
            ApiError.builder()
                .setStatusCode(404)
                .setErrors(["No liked videos found"])
                .build()
        );
    }  

    return res
    .status(200)
    .json(
        ApiResponse.builder()
            .setStatusCode(200)
            .setData(likedVideos)
            .setMessage("Liked videos fetched successfully")
            .build()
    );

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}