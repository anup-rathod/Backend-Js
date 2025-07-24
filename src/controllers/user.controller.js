import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { response } from 'express';
import jwt, { decode } from 'jsonwebtoken'
import mongoose from 'mongoose';

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors(["All fields are required"])
            .build()
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw ApiError.builder()
            .setStatusCode(409)
            .setErrors(["User with email or username already exists"])
            .build()
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors(["Avatar file is required"])
            .build()
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors(["Avatar file is required"])
            .build()
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw ApiError.builder()
            .setStatusCode(500)
            .setErrors(["Something went wrong while registering the user"])
            .build()
    }

    return res.status(201).json(
        ApiResponse.builder()
            .setStatusCode(200)
            .setData(createdUser)
            .setMessage("User registered Successfully")
            .build()
    )

} )

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const { email, username, password } = req.body

    if (!(username || email)) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors(["username or email is required"])
            .build()
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw ApiError.builder()
            .setStatusCode(404)
            .setErrors(["user does not exists"])
            .build()
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw ApiError.builder()
            .setStatusCode(401)
            .setErrors(["Invalid user credentials"])
            .build()
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            ApiResponse.builder()
                .setStatusCode(200)
                .setData({ user: loggedInUser, accessToken, refreshToken })
                .setMessage("User logged in Successfully")
                .build()
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 //this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(ApiResponse.builder()
            .setStatusCode(200)
            .setData({})
            .setMessage("User logged out")
            .build())
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if (!incomingRefreshToken) {
            throw ApiError.builder()
                .setStatusCode(401)
                .setErrors(["Unauthorized Request"])
                .build()
        }

        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw ApiError.builder()
                .setStatusCode(401)
                .setErrors(["Invalid refresh token"])
                .build()
        }

        if (incomingRefreshToken != user?.refreshToken) {
            throw ApiError.builder()
                .setStatusCode(401)
                .setErrors(["Refresh token is expired or used"])
                .build()
        }

        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                ApiResponse.builder()
                    .setStatusCode(200)
                    .setData({ accessToken, newRefreshToken, options })
                    .setMessage("Access token refreshed")
                    .build()
            )
    } catch (error) {
        throw ApiError.builder()
            .setStatusCode(401)
            .setErrors([error?.message || "Invalid refresh token"])
            .build()
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors(["Invalid old password"])
            .build()
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(ApiResponse.builder()
            .setStatusCode(200)
            .setData({})
            .setMessage("Password Changed Successfully")
            .build())
})


const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(ApiResponse.builder()
            .setStatusCode(200)
            .setData(req.user)
            .setMessage("current user fetched successfully")
            .build())
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors(["All fields are required"])
            .build()
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(ApiResponse.builder()
            .setStatusCode(200)
            .setData(user)
            .setMessage("Account details updated successfully")
            .build())
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors(["Avatar file is missing"])
            .build()
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors(["Error while uplaoding on avatar"])
            .build()
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
        .json(
            ApiResponse.builder()
                .setStatusCode(200)
                .setData(user)
                .setMessage("Avatar image updated successfully")
                .build()
        )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors(["Cover image file is missing"])
            .build()
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors(["Error while uplaoding on avatar"])
            .build()
    }


    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")


    return res.status(200)
        .json(
            ApiResponse.builder()
                .setStatusCode(200)
                .setData(user)
                .setMessage("Avatar image updated successfully")
                .build()
        )
})


const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if(!username?.trim()){
        throw ApiError.builder()
            .setStatusCode(400)
            .setErrors(["username is missing"])
            .build()
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localfield: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localfield: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1, 
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length){
        throw ApiError.builder()
            .setStatusCode(404)
            .setErrors(["channel does not exist"])
            .build()
    }

    return res
    .status(200)
    .json(
        ApiResponse.builder()
            .setStatusCode(200)
            .setData(channel[0])
            .setMessage("User channel fecthed successfully")
            .build()
    )

})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                    avatar: 1
                                    }
                                },
                                {
                                    $addFields: {
                                        owner: {
                                            $first: "$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        ApiResponse.builder()
            .setStatusCode(200)
            .setData(user[0].watchHistory)
            .setMessage("Watch history fetched successfully.")
            .build()
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}