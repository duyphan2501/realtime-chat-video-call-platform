import cloudinary from "../config/cloudinary.config.js";
import fs from "fs";

async function uploadFiles(files, options) {
  try {
    // Nếu là single file (object) => biến thành mảng có 1 phần tử
    const fileArray = Array.isArray(files) ? files : [files];

    const uploadPromises = fileArray.map(async (file) => {
      const result = await cloudinary.uploader.upload(file.path, options);

      // Xóa file local sau khi upload thành công
      fs.unlink(file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });

      return {
        url: result.secure_url,
        name: file.originalname,
        publicId: result.public_id,
        size: result.bytes, // Thêm dung lượng file
        format: result.format, // Thêm định dạng (jpg, pdf, docx...)
        type: file.mimetype,
      };
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    throw error;
  }
}

export default uploadFiles;
