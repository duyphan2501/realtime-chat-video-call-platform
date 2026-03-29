import { v2 as cloudinary } from 'cloudinary'
import ENV from '../utils/env.util.js';

cloudinary.config({ 
  cloud_name: ENV.CLOUDINARY_NAME, 
  api_key: ENV.CLOUDINARY_API_KEY, 
  api_secret: ENV.CLOUDINARY_SECRET_KEY
});

export default cloudinary;