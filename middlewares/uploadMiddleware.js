const multer = require("multer");
const cloudinary = require("../configs/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "3a3tha profile images",
    public_id: (req, file) => Date.now() + "-" + file.originalname,
    allowedFormats: ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"],
  },
});

const serviceImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sa3tha services images",
    public_id: (req, file) => Date.now() + "-" + file.originalname,
    allowedFormats: ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"],
  },
});

const uploadProfileImage = multer({ storage: profileImageStorage });
const uploadServiceImage = multer({ storage: serviceImageStorage });

module.exports = { uploadProfileImage, uploadServiceImage };
