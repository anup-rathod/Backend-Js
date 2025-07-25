import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {

  const { name, description } = req.body;

  const userId = req.user?._id;

  if (!userId) {
    throw ApiError.builder()
      .setStatusCode(401)
      .setErrors(["You must be logged in to create playlist."])
      .build();
  }

  if (!name || !description) {
    throw ApiError.builder()
      .setStatusCode(400)
      .setErrors(["All fields are required."])
      .build();
  }

  // Create playlist (with or without video)
  const playlist = await Playlist.create({
    name,
    description,
    owner: userId,
  });

  if (!playlist) {
    throw ApiError.builder()
      .setStatusCode(500)
      .setErrors(["Something went wrong while creating playlist"])
      .build();
  }

  console.log("playlist resonse sent : ",playlist);

  return res
    .status(201)
    .json(
      ApiResponse.builder()
        .setStatusCode(201)
        .setData(playlist)
        .setMessage("Playlist created successfully.")
        .build()
    );
});


const getUserPlaylists = asyncHandler(async (req, res) => {

  const userId = req.user?._id

  // console.log(req.user);

  // TODO: get user playlists

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw ApiError.builder()
      .setStatusCode(400)
      .setErrors(["Invalid user ID."])
      .build();
  }

  const userPlaylists = await Playlist.find({ owner: userId })
    .populate({
      path: "videos",
      populate: {
        path: "owner",
        select: "fullName username avatar"
      }
    })
    .populate("owner", "fullName username avatar")
    .sort({ createdAt: -1 });

//   console.log("user playlists: ", userPlaylists);

  if (!userPlaylists || userPlaylists.length === 0) {
    throw ApiError.builder()
      .setStatusCode(404)
      .setErrors(["No playlists found for this user."])
      .build();
  }

  return res
    .status(200)
    .json(
      ApiResponse.builder()
        .setStatusCode(200)
        .setData(userPlaylists)
        .setMessage("User playlists fetched successfully.")
        .build()
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {

  
   const  playlistId  = req.params.id

  // console.log("playlistid: ",playlistId)

  if (playlistId && !mongoose.Types.ObjectId.isValid(playlistId)) {
    throw ApiError.builder()
      .setStatusCode(400)
      .setErrors(["Invalid playlist ID."])
      .build();
  }
const playlist = await Playlist.findById(playlistId)
  .populate({
    path: "videos",
    populate: {
      path: "owner",
      select: "fullName username avatar"
    }
  })
  .populate("owner", "fullName username avatar");


  if (!playlist) {
    throw ApiError.builder()
      .setStatusCode(404)
      .setErrors(["Playlist not found."])
      .build();
  }
  // console.log("playlist by id: ",playlist);

  return res
    .status(200)
    .json(
      ApiResponse.builder()
        .setStatusCode(200)
        .setData(playlist)
        .setMessage("Playlist fetched successfully")
        .build()
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {

  const playlistId = req.params.id;;
  
  const userId = req.user?._id;
   const videoId = req.body.videoId;
console.log("playlist id: ",playlistId)
  
console.log("videoid: ",videoId);
  // Check if user is logged in
  if (!userId) {
    throw ApiError.builder()
      .setStatusCode(401)
      .setErrors(["You must be logged in to modify playlists."])
      .build();
  }

  // Validate playlistId
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw ApiError.builder()
      .setStatusCode(400)
      .setErrors(["Invalid playlist ID"])
      .build();
  }

  // Validate videoId
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw ApiError.builder()
      .setStatusCode(400)
      .setErrors(["Invalid video ID"])
      .build();
  }

  // Check if video exists
  const existingVideo = await Video.findById(videoId);
  if (!existingVideo) {
    throw ApiError.builder()
      .setStatusCode(404)
      .setErrors(["Video not found."])
      .build();
  }

  // Check if playlist exists
  const existingPlaylist = await Playlist.findById(playlistId);
  if (!existingPlaylist) {
    throw ApiError.builder()
      .setStatusCode(404)
      .setErrors(["Playlist not found."])
      .build();
  }

  // Check if the logged-in user is the owner of the playlist
  if (existingPlaylist.owner.toString() !== userId.toString()) {
    throw ApiError.builder()
      .setStatusCode(403)
      .setErrors(["You are not allowed to modify this playlist."])
      .build();
  }

  // Check if video already in playlist
  if (existingPlaylist.videos.includes(videoId)) {
    throw ApiError.builder()
      .setStatusCode(409)
      .setErrors(["Video already exist in the playlist."])
      .build();
  }

  // Add video to playlist
  existingPlaylist.videos.push(videoId);
  await existingPlaylist.save();

  console.log("video added to playlist: ",existingPlaylist);

  return res
    .status(200)
    .json(
      ApiResponse.builder()
        .setStatusCode(200)
        .setData(existingPlaylist)
        .setMessage("Video added to playlist successfully.")
        .build()
    );
});


const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
 
  // TODO: remove video from playlist

    const playlistId = req.params.id;;
  
 
   const videoId = req.body.videoId;
console.log("playlist id: ",playlistId)
  
console.log("videoid: ",videoId);
  const userId = req.user?._id;

  // Check if user is logged in
  if (!userId) {
    throw ApiError.builder()
      .setStatusCode(401)
      .setErrors(["You must be logged in to modify playlists."])
      .build();
  }

  // Validate playlistId
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw ApiError.builder()
      .setStatusCode(400)
      .setErrors(["Invalid playlist ID"])
      .build();
  }

  // Validate videoId
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw ApiError.builder()
      .setStatusCode(400)
      .setErrors(["Invalid video ID"])
      .build();
  }

  // Check if video exists
  const existingVideo = await Video.findById(videoId);
  if (!existingVideo) {
    throw ApiError.builder()
      .setStatusCode(404)
      .setErrors(["Video not found."])
      .build();
  }

  // Check if playlist exists
  const existingPlaylist = await Playlist.findById(playlistId);
  if (!existingPlaylist) {
    throw ApiError.builder()
      .setStatusCode(404)
      .setErrors(["Playlist not found."])
      .build();
  }

  // Check if the logged-in user is the owner of the playlist
  if (existingPlaylist.owner.toString() !== userId.toString()) {
    throw ApiError.builder()
      .setStatusCode(403)
      .setErrors(["You are not allowed to modify this playlist."])
      .build();
  }

  // Check if video  is present in playlist
  if (!existingPlaylist.videos.includes(videoId)) {
    throw ApiError.builder()
      .setStatusCode(404)
      .setErrors(["Video does not exist in the playlist."])
      .build();
  }

 const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true }
  );

   return res.status(200).json(
    ApiResponse.builder()
      .setStatusCode(200)
      .setData(updatedPlaylist)
      .setMessage("Video removed from playlist successfully.")
      .build()
  );
});


const deletePlaylist = asyncHandler(async (req, res) => {
 
  // TODO: delete playlist
 
  const playlistId  = req.params.id;

 
console.log(playlistId)
  // Check if user is logged in
    
  const userId = req.user?._id;
  if (!userId) {
    throw ApiError.builder()
      .setStatusCode(401)
      .setErrors(["You must be logged in to modify playlists."])
      .build();
  }

  // Validate playlistId
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw ApiError.builder()
      .setStatusCode(400)
      .setErrors(["Invalid playlist ID"])
      .build();
  }


  // Check if playlist exists
  const existingPlaylist = await Playlist.findById(playlistId);
  if (!existingPlaylist) {
    throw ApiError.builder()
      .setStatusCode(404)
      .setErrors(["Playlist not found."])
      .build();
  }

  // Check if the logged-in user is the owner of the playlist
  if (existingPlaylist.owner.toString() !== userId.toString()) {
    throw ApiError.builder()
      .setStatusCode(403)
      .setErrors(["You are not allowed to modify this playlist."])
      .build();
  }

 await existingPlaylist.deleteOne();


  return res
  .status(200)
  .json(
    ApiResponse.builder()
      .setStatusCode(200)
      .setData(null)
      .setMessage("Playlist deleted successfully")
      .build()
  )

});

const updatePlaylist = asyncHandler(async (req, res) => {
  const playlistId  = req.params.id;
  const { name, description } = req.body;
  console.log(req.params);

  // Validate fields
  if (!name && !description) {
    throw ApiError.builder()
      .setStatusCode(400)
      .setErrors(["At least one field (name or description) is required."])
      .build();
  }


  // Check if user is logged in
  const userId = req.user?._id;
  if (!userId) {
    throw ApiError.builder()
      .setStatusCode(401)
      .setErrors(["You must be logged in to modify playlists."])
      .build();
  }

  // Validate playlistId
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw ApiError.builder()
      .setStatusCode(400)
      .setErrors(["Invalid playlist ID"])
      .build();
  }

  // Check if playlist exists
  const existingPlaylist = await Playlist.findById(playlistId);
  if (!existingPlaylist) {
    throw ApiError.builder()
      .setStatusCode(404)
      .setErrors(["Playlist not found."])
      .build();
  }

  // Ownership check
  if (existingPlaylist.owner.toString() !== userId.toString()) {
    throw ApiError.builder()
      .setStatusCode(403)
      .setErrors(["You are not allowed to modify this playlist."])
      .build();
  }

  // Update fields if provided
  if (name) existingPlaylist.name = name;
  if (description) existingPlaylist.description = description;

  await existingPlaylist.save();

  console.log("updated playlist: ",existingPlaylist)

  return res
    .status(200)
    .json(
      ApiResponse.builder()
        .setStatusCode(200)
        .setData(existingPlaylist)
        .setMessage("Playlist updated successfully.")
        .build()
    );
});


export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist
};