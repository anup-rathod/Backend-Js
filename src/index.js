// require('dotenv).config({path: './env})
import mongoose from "mongoose"
import { DB_NAME } from "./constants.js"
import connectDB from "./db/index.js"
import dotenv from "dotenv"
import { app } from "./app.js"

dotenv.config({
    path : './.env'
})

connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log(error, "error");
        throw new error
    })
    app.listen(process.env.PORT) || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT}`)
    }  
})
.catch((err) => {
    console.error(err, "Mongo db connection failed!!!")
})

/*   
(  async() => {
    try {
        mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)
        app.on("error", (error) => {
            console.log(error, "error");
            throw new error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.log(error, "Error while connecting DB")
    }
})
*/