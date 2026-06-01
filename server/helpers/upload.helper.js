import cloudinary from "../config/cloudinary.config.js";

const uploadBuffer = (file, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      if (!result) {
        reject(new Error("Cloudinary upload returned no result"));
        return;
      }

      resolve(result);
    });

    stream.end(file.buffer);
  });

async function uploadFiles(files, options) {
  const fileArray = Array.isArray(files) ? files : [files];

  const uploadPromises = fileArray.map(async (file) => {
    const result = await uploadBuffer(file, options);

    return {
      url: result.secure_url,
      name: file.originalname,
      publicId: result.public_id,
      size: result.bytes,
      format: result.format || file.originalname.split(".").pop(),
      type: file.mimetype,
    };
  });

  return Promise.all(uploadPromises);
}

export { uploadFiles };
