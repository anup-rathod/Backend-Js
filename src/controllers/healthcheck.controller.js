import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const healthcheck = asyncHandler(async (req, res) => {
    return res.status(201).json(
        new ApiResponse(200, "data", "API is Working fine")
    )
})

export { healthcheck };