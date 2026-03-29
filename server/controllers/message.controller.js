import createHttpError from "http-errors";
import { MessageService } from "../services/message.service.js";
import uploadFiles from "../helpers/upload.helper.js";

const CHAT_FOLDER_IMAGES = "chat_images";
const CHAT_FOLDER_DOCUMENTS = "chat_documents";

const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    if (!conversationId)
      throw createHttpError.BadRequest("ConversationId is required");
    const { cursor } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    if (limit > 100) limit = 100;
    const userId = req.user.userId;

    const resData = await MessageService.getMessages({
      conversationId,
      cursor,
      limit,
      currentUserId: userId,
    });
    return res.status(200).json(resData);
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content, type, attachments, tempId } = req.body;
    if (!conversationId || !type || !tempId)
      throw createHttpError.BadRequest(
        "ConversationId, type, tempId are required",
      );

    if (!content && attachments.length === 0)
      throw createHttpError.BadRequest("Message is empty");
    const senderId = req.user.userId;
    if (!senderId) throw createHttpError.Unauthorized("Unauthorized");

    const newMessage = await MessageService.sendMessage({
      conversationId,
      senderId,
      content,
      type,
      attachments,
      tempId,
    });

    res.status(201).json({
      data: newMessage,
    });
  } catch (error) {
    next(error);
  }
};

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



export { getMessages, sendMessage, uploadDocument, uploadImages };
