import multer from 'multer'

const storage = multer.memoryStorage()

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
])

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5 MB por archivo
    files: 10,                   // máximo 10 archivos por request
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP, GIF)'))
    }
  },
}).array('imagenes', 10)
