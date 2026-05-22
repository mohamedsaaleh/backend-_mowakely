const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');
const constants = require('../constants');
const logger = require('./logger');

const uploadPath = path.join(__dirname, '../../', config.upload?.path || 'uploads');

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const createFolder = (folderName) => {
  const folderPath = path.join(uploadPath, folderName);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  return folderPath;
};

['avatars', 'documents', 'cases', 'temp'].forEach(createFolder);

const fileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  };
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.uploadFolder || 'temp';
    cb(null, path.join(uploadPath, folder));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const imageFilter = (req, file, cb) => {
  if (constants.UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image file type'), false);
  }
};

const documentFilter = (req, file, cb) => {
  if (constants.UPLOAD.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid document file type'), false);
  }
};

const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: constants.UPLOAD.AVATAR_MAX_SIZE
  }
});

const uploadDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: constants.UPLOAD.DOCUMENT_MAX_SIZE
  }
});

const uploadAny = multer({
  storage,
  limits: {
    fileSize: config.upload?.maxFileSize || constants.UPLOAD.MAX_FILE_SIZE
  }
});

const compressImage = async (inputPath, outputPath, options = {}) => {
  const { width, height, quality = 80 } = options;

  let pipeline = sharp(inputPath);

  if (width || height) {
    pipeline = pipeline.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  await pipeline
    .jpeg({ quality, progressive: true })
    .png({ compressionLevel: 9 })
    .webp({ quality })
    .toFile(outputPath);

  const inputStats = fs.statSync(inputPath);
  const outputStats = fs.statSync(outputPath);

  return {
    originalSize: inputStats.size,
    compressedSize: outputStats.size,
    savings: Math.round((1 - outputStats.size / inputStats.size) * 100)
  };
};

const processAndSave = async (file, folder, options = {}) => {
  const { compress = true, keepOriginal = false } = options;

  const tempPath = file.path;
  const ext = path.extname(file.originalname);
  const newFilename = `${uuidv4()}${ext}`;
  const finalPath = path.join(uploadPath, folder, newFilename);

  if (compress && constants.UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    await compressImage(tempPath, finalPath);

    if (!keepOriginal) {
      fs.unlinkSync(tempPath);
    }

    return {
      filename: newFilename,
      path: finalPath,
      mimetype: file.mimetype,
      originalName: file.originalname
    };
  }

  fs.renameSync(tempPath, finalPath);

  return {
    filename: newFilename,
    path: finalPath,
    mimetype: file.mimetype,
    originalName: file.originalname
  };
};

const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error deleting file:', error);
    return false;
  }
};

const getFileUrl = (filename, folder) => {
  return `/uploads/${folder}/${filename}`;
};

const uploadMiddleware = {
  avatar: uploadImage.single('avatar'),
  document: uploadDocument.single('document'),
  multiple: uploadAny.array('files', 10),
  any: uploadAny.any()
};

module.exports = {
  uploadPath,
  uploadImage,
  uploadDocument,
  uploadAny,
  compressImage,
  processAndSave,
  deleteFile,
  getFileUrl,
  uploadMiddleware
};