import createHttpError from "http-errors";
import uploadFiles from "../helpers/upload.helper.js";

const CHAT_FOLDER_IMAGES = "chat_images";
const CHAT_FOLDER_DOCUMENTS = "chat_documents";

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0)
      throw createHttpError.BadRequest("No files uploaded.");

    const files = req.files;
    const options = {
      folder: CHAT_FOLDER_DOCUMENTS,
      use_filename: true,
      unique_filename: false,
      overwrite: true,
      resource_type: "auto",
      flags: "attachment",
    };

    // upload new documents to cloudinary
    const uploadedDocuments = await uploadFiles(files, options);

    return res.status(200).json({
      message: "Upload documents successful",
      uploadedDocuments,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0)
      throw createHttpError.BadRequest("No files uploaded.");

    const images = req.files;
    // upload new images to cloudinary
    const options = {
      folder: CHAT_FOLDER_IMAGES,
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    };

    const uploadedImages = await uploadFiles(images, options);

    return res.status(200).json({
      message: "Upload images successful",
      uploadedImages,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export { uploadDocument, uploadImages };
