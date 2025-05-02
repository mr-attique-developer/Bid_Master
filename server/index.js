import express from 'express';
import cors from "cors"
import cookieParser from 'cookie-parser';
import "dotenv/config.js"
import connectDB from './config/db.js';
import userRoutes from "./routes/user.routes.js"
import productRoutes from "./routes/product.routes.js"
import bodyParser from "body-parser"


const app = express()

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())


app.get("/", (req, res) => {
    res.send("API is running...")
})
const port = process.env.PORT || 4000


// Connection of MongoDB
connectDB()

// Routes

app.use("/api/v1/user", userRoutes)
app.use("/api/v1/product", productRoutes)

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})