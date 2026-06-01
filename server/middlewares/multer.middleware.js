import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype.toLowerCase());
  if (extname && mimetype) cb(null, true);
  else cb(new Error("Only image files (/jpeg|jpg|png|gif|webp/) are allowed"));
};

const uploadImg = multer({ storage, fileFilter: imageFilter });

const docFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|ppt|xlsx|txt/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype.toLowerCase());
  if (extname && mimetype) cb(null, true);
  else cb(new Error("Only document files (/pdf|doc|docx|ppt|xlsx|txt/) are allowed"));
};

const uploadDoc = multer({ storage, fileFilter: docFilter });

export { uploadImg, uploadDoc };
