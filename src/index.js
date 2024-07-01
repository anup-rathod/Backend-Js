// require('dotenv).config({path: './env})
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import dotenv from 'dotenv'
import { app } from "./app.js";

dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log((`Server is running at portal : ${process.env.PORT}`))
    })
})
.catch((err) => {
    console.log("Mongo db connection failed !!!", err)
})




// import express from 'express'
// const app = express()

// ( async () => {
//     try {
//         mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", (error) => {
//             console.log("Errr:", error);
//             throw error;
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on port ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.log("error", error);
//         throw error;
//     }
// })()