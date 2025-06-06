import {v2 as cloudinary} from 'cloudinary'; 
import multer from 'multer';
import  {CloudinaryStorage} from "multer-storage-cloudinary"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "Bid Master",
        allowed_formats: ["jpg", "png", "jpeg"],
        transformation: [{ width: 1000, height: 500, crop: "limit" }],
    },
})


const upload = multer({storage: storage})

export default upload
export {cloudinary}