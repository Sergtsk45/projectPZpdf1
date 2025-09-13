/**
 * @file: routes.js
 * @description: API маршруты для загрузки шаблонов и генерации PDF
 * @dependencies: express, multer, services/
 * @created: 2025-01-13
 */

import express from 'express';
import multer from 'multer';
import { uploadTemplate, generatePDF, getManifest } from '../services/templateService.js';

const router = express.Router();

// Настройка multer для загрузки файлов
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'backend/storage/templates/');
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const ext = file.originalname.split('.').pop();
      cb(null, `template_${timestamp}.${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Только PDF файлы разрешены'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * POST /api/templates
 * Загрузка PDF шаблона и генерация манифеста
 */
router.post('/templates', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 'NO_FILE',
        message: 'Файл не предоставлен'
      });
    }

    const { templateId, manifest } = await uploadTemplate(req.file);
    
    res.json({
      success: true,
      templateId,
      manifest,
      message: 'Шаблон успешно загружен'
    });
  } catch (error) {
    console.error('Ошибка загрузки шаблона:', error);
    res.status(500).json({
      code: 'UPLOAD_ERROR',
      message: 'Ошибка загрузки шаблона',
      details: error.message
    });
  }
});

/**
 * GET /api/templates/:id/manifest
 * Получение манифеста шаблона
 */
router.get('/templates/:id/manifest', async (req, res) => {
  try {
    const { id } = req.params;
    const manifest = await getManifest(id);
    
    if (!manifest) {
      return res.status(404).json({
        code: 'TEMPLATE_NOT_FOUND',
        message: 'Шаблон не найден'
      });
    }
    
    res.json({
      success: true,
      manifest
    });
  } catch (error) {
    console.error('Ошибка получения манифеста:', error);
    res.status(500).json({
      code: 'MANIFEST_ERROR',
      message: 'Ошибка получения манифеста',
      details: error.message
    });
  }
});

/**
 * POST /api/generate
 * Генерация PDF с заполненными данными
 */
router.post('/generate', async (req, res) => {
  try {
    const { templateId, values, options = {} } = req.body;
    
    if (!templateId) {
      return res.status(400).json({
        code: 'MISSING_TEMPLATE_ID',
        message: 'ID шаблона обязателен'
      });
    }
    
    if (!values || typeof values !== 'object') {
      return res.status(400).json({
        code: 'INVALID_VALUES',
        message: 'Данные для заполнения обязательны'
      });
    }

    const pdfBuffer = await generatePDF(templateId, values, options);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="filled_template.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Ошибка генерации PDF:', error);
    res.status(500).json({
      code: 'GENERATION_ERROR',
      message: 'Ошибка генерации PDF',
      details: error.message
    });
  }
});

export default router;
