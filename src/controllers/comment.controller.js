import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw ApiError.builder()
      .setStatusCode(400)
      .setErrors(["Invalid video ID"])
      .build();
  }

  const comments = await Comment.find({ video: videoId })
    .populate("owner", "fullName username avatar")
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  console.log(`Fetched comments for video ${videoId}:`, comments);

  if (!comments || comments.length === 0) {
    return res
      .status(404)
      .json(
        ApiResponse.builder()
          .setStatusCode(404)
          .setData(null)
          .setMessage("No comments found for this video")
          .build()
      );
  }

  return res
    .status(200)
    .json(
      ApiResponse.builder()
        .setStatusCode(200)
        .setData(comments)
        .setMessage("Comments fetched successfully")
        .build()
    );
});

const addComment = asyncHandler(async (req, res) => {
  // Accept { content } in req.body
  const { content } = req.body;
  const { videoId } = req.params;

  const userId = req.user._id;

  if (!content || !videoId) {
    throw ApiError.builder()
      .setStatusCode(400)
      .setErrors(["Content and video ID are required"])
      .build();
  }

  const newComment = await Comment.create({
    content,
    video: videoId,
    owner: userId,
  });
  await newComment.populate("owner", "fullName username avatar");

  if (!newComment) {
    throw ApiError.builder()
      .setStatusCode(500)
      .setErrors(["Failed to add comment"])
      .build();
  }
  return res
    .status(201)
    .json(
      ApiResponse.builder()
        .setStatusCode(201)
        .setData(newComment)
        .setMessage("Comment added successfully")
        .build()
    );
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!commentId || !content) {
    throw ApiError.builder()
    .setStatusCode(400)
    .setErrors(["Comment ID and content are required"])
    .build();
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { content },
    { new: true }
  ).populate("owner", "username avatar");

  if (!updatedComment) {
    throw ApiError.builder()
      .setStatusCode(404)
      .setErrors(["Comment not found"])
      .build();
  }

  return res
    .status(200)
    .json(
      ApiResponse.builder()
        .setStatusCode(200)
        .setData(updatedComment)
        .setMessage("Comment updated successfully")
        .build()
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    throw ApiError.builder()
      .setStatusCode(400)
      .setErrors(["Invalid comment ID"])
      .build();
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);
  if (!deletedComment) {
    throw ApiError.builder()
      .setStatusCode(404)
      .setErrors(["Comment not found"])
      .build();
  }

  return res
    .status(200)
    .json(
      ApiResponse.builder()
        .setStatusCode(200)
        .setData(deletedComment)
        .setMessage("Comment deleted successfully")
        .build()
    );
});

export { getVideoComments, addComment, updateComment, deleteComment };
