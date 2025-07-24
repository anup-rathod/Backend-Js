import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    const pipeline = [];

    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        });
    }

    if (userId) {
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    pipeline.push({
        $sort: {
            [sortBy || "createdAt"]: sortType === "asc" ? 1 : -1
        }
    });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const allVideos = await Video.aggregate(pipeline);

    return res
        .status(200)
        .json(new ApiResponse(200, allVideos, "All videos fetched"));
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoFileLocalPath || !thumbnailLocalPath) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors(["Video file and thumbnail are required"])
            .build()
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile?.url,
        thumbnail: thumbnail?.url,
        duration: 0, // You can calculate using ffmpeg if needed
        owner: req.user._id, // from verifyJWT middleware
    });

    return res
        .status(201)
        .json(ApiResponse.builder()
            .setStatusCode(201)
            .setData(video)
            .setMessage("Video uploaded successfully")
            .build())
});


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findById(videoId).populate("owner", "username avatar");

    if (!video) {
        throw ApiError.builder()
            .setStatusCode(404)
            .setErrors(["Video not found"])
            .build()
    }

    return res
        .status(200)
        .json(
            ApiResponse.builder()
                .setStatusCode(200)
                .setData(video)
                .setMessage("Videos fetched successfully")
                .build())
})

const updateThumbnailVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    const thumbnailLocalPath = req.file?.path;

    if (!title || !description) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors(["Title and Description fields are required"])
            .build()
    }

    // ✅ Upload new thumbnail to Cloudinary
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!uploadedThumbnail || !uploadedThumbnail.url) {
        throw ApiError.builder()
            .setStatusCode(500)
            .setErrors(["Failed to upload thumbnail"])
            .build()
    }

    // ✅ Update video
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: uploadedThumbnail.url,
            }
        },
        { new: true }
    );

    return res
        .status(200)
        .json(ApiResponse.builder()
            .setStatusCode(200)
            .setData(updatedVideo)
            .setMessage("Updated Video Thumbnail Successfully")
            .build())
});


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) {
        throw ApiError.builder()
            .setStatusCode(404)
            .setErrors(["Video not found"])
            .build()
    }

    return res
        .status(200)
        .json(ApiResponse.builder()
            .setStatusCode(200)
            .setData(deletedVideo)
            .setMessage("Deleted Video Successfully")
            .build())
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId);

    if (!video) {
        throw ApiError.builder()
            .setStatusCode(404)
            .setErrors(["Video not found"])
            .build();
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res
    .status(200)
        .json(
            ApiResponse.builder()
            .setStatusCode(200)
            .setData(video)
            .setMessage("Video Publish toggle Successfully")
            .build())
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateThumbnailVideo,
    deleteVideo,
    togglePublishStatus
}