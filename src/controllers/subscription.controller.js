import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";



const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw ApiError.builder()
      .setStatusCode(400)
      .setErrors(["Invalid channel ID."])
      .build();
  }

  const userId = req.user?._id;

  if (!userId) {
    throw ApiError.builder()
      .setStatusCode(401)
      .setErrors(["You must be logged in to toggle subscription."])
      .build();
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (!existingSubscription) {
    const subscribed = await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });

    console.log("data sent from subscription controller: ",subscribed);
    return res
      .status(200)
      .json(
        ApiResponse.builder()
          .setStatusCode(200)
          .setData(subscribed)
          .setMessage("Channel Subscribed successfully.")
          .build()
      );
  } else {
    const unsubscribed = await existingSubscription.deleteOne();

    console.log("while unsubscribing:",unsubscribed)

    return res
      .status(200)
      .json(
        ApiResponse.builder()
          .setStatusCode(200)
          .setData(null)
          .setMessage("Channel unsubscribed successfully.")
          .build()
      );
  }

});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {

  const { channelId } = req.params;

  // console.log("params :",req.params);
  

  if (!isValidObjectId(channelId)) {
    throw ApiError.builder()
      .setStatusCode(400)
      .setErrors(["Invalid channel ID."])
      .build();
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberInfo",
      },
    },
    { $unwind: "$subscriberInfo" },
    {
      $project: {
        _id: 0,
        fullName: "$subscriberInfo.fullName",
        username: "$subscriberInfo.username",
        avatar: "$subscriberInfo.avatar",
      },
    },
  ]);

  if (subscribers.length === 0) {
    throw ApiError.builder()
      .setStatusCode(404)
      .setErrors(["Subscribers not found."])
      .build();
  }
  //  console.log("subscribers of channels: ",subscribers)

  return res
    .status(200)
    .json(
      ApiResponse.builder()
        .setStatusCode(200)
        .setData(subscribers)
        .setMessage("Subscribers fetched successfully.")
        .build()
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

//  console.log(" Channel ID received in controller:", channelId);

  // console.log("params:",req.params);
  if (!isValidObjectId(channelId)) {
    throw ApiError.builder()
      .setStatusCode(400)
      .setErrors(["Invalid subscriber ID."])
      .build();
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: { subscriber: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedChannelInfo",
      },
    },
    { $unwind: "$subscribedChannelInfo" },
    {
      $project: {
        _id: 0,
        fullName: "$subscribedChannelInfo.fullName",
        username: "$subscribedChannelInfo.username",
        avatar: "$subscribedChannelInfo.avatar",
      },
    },
  ]);

 

  // console.log("subscribed channels: ",subscribedChannels)
  return res
    .status(200)
    .json(
      ApiResponse.builder()
        .setStatusCode(200)
        .setData(subscribedChannels)
        .setMessage("Subscribed channels fetched successfully.")
        .build()
    );
});

const getSubscriptionStatus = asyncHandler(async(req,res)=>{
  const { channelId } = req.params;
  const currentUser = req.user?._id;

   if (!currentUser) {
    return res.status(401).json(
      ApiResponse.builder()
        .setStatusCode(401)
        .setData(null)
        .setMessage("Unauthorized user.")
        .build()
    );
  }

  console.log("channelId:", channelId);
console.log("currentUser:", currentUser);

    const subscribe = await Subscription.findOne({ subscriber: currentUser, channel: channelId });

    const isSubscribed= !!subscribe;

     console.log("isSubscribed : ",isSubscribed);


  return res.status(200).json(
    ApiResponse.builder()
      .setStatusCode(200)
      .setData({ isSubscribed })
      .setMessage("Subscribe status fetched successfully.")
      .build()
  );


})

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels,getSubscriptionStatus };