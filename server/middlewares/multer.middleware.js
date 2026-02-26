import fs from "fs";
import multer from "multer";
import path from "path";

const uploadDir = path.join(process.cwd(), "uploads/images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/images/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

export const uploadSingleImage = upload.single("image");
export const uploadAnyFiles = upload.any();
