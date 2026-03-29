import multer from "multer";
import path from "path";

// Thư mục lưu file tạm thời
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // cần đảm bảo thư mục 'uploads/' tồn tại
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});

// uploadImage.js
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype.toLowerCase());
  if (extname && mimetype) cb(null, true);
  else cb(new Error("Only image files are allowed"));
};

const uploadImg = multer({ storage, fileFilter: imageFilter });

// uploadFile.js
const docFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|ppt|xlsx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype.toLowerCase());
  if (extname && mimetype) cb(null, true);
  else cb(new Error("Only document files are allowed"));
};

const uploadDoc = multer({ storage, fileFilter: docFilter });

export { uploadImg, uploadDoc };
