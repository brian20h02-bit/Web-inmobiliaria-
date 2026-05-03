import { Request, Response, NextFunction } from 'express'
import multer from 'multer'

const storage = multer.memoryStorage()

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',   // iOS camera
  'image/heif',   // iOS camera (variante)
])

const _multer = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5 MB por archivo
    files: 10,                   // máximo 10 archivos por request
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP, GIF, HEIC)'))
    }
  },
}).array('imagenes', 10)

/**
 * Wrapper que convierte errores de multer en respuestas JSON 400
 * en lugar de dejar que Express los maneje con HTML/500.
 */
export function upload(req: Request, res: Response, next: NextFunction): void {
  _multer(req, res, (err: unknown) => {
    if (!err) return next()

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'El archivo es demasiado grande. El máximo es 5 MB por imagen.' })
        return
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        res.status(400).json({ error: 'Se permiten hasta 10 imágenes por publicación.' })
        return
      }
      res.status(400).json({ error: `Error al procesar el archivo: ${err.message}` })
      return
    }

    // Error personalizado del fileFilter u otro error
    const message = err instanceof Error ? err.message : 'Error al procesar el archivo.'
    res.status(400).json({ error: message })
  })
}
