/**
 * @file: routes.js
 * @description: API маршруты для загрузки шаблонов и генерации PDF
 * @dependencies: express, multer, services/
 * @created: 2025-01-13
 */

import express from 'express';
import multer from 'multer';
import { uploadTemplate, generatePDF, getManifest } from '../services/templateService.js';
import { calculateWaterConsumption, validateCalculationData } from '../services/calculationsService.js';

const router = express.Router();

// Настройка multer для загрузки файлов
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'backend/storage/templates/');
    },
    filename: (req, file, cb) => {
      // Временно сохраняем с timestamp, потом переименуем в templateService
      const timestamp = Date.now();
      const ext = file.originalname.split('.').pop();
      cb(null, `temp_${timestamp}.${ext}`);
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
 * POST /api/calculate
 * Выполнение расчётов водопотребления
 */
router.post('/calculate', async (req, res) => {
  try {
    const { dailyConsumption, options = {} } = req.body;
    
    if (dailyConsumption === undefined || dailyConsumption === null) {
      return res.status(400).json({
        code: 'MISSING_DAILY_CONSUMPTION',
        message: 'dailyConsumption обязателен'
      });
    }

    // Валидируем данные
    const validation = validateCalculationData({ dailyConsumption });
    if (!validation.valid) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Ошибка валидации данных',
        details: validation.errors
      });
    }

    // Выполняем расчёты
    const calculations = calculateWaterConsumption(dailyConsumption, options);
    
    res.json({
      success: true,
      calculations,
      message: 'Расчёты выполнены успешно'
    });
  } catch (error) {
    console.error('Ошибка расчётов:', error);
    res.status(500).json({
      code: 'CALCULATION_ERROR',
      message: 'Ошибка выполнения расчётов',
      details: error.message
    });
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

    // Подготавливаем данные для расчётов
    const calculationData = {
      dailyConsumption: values.dailyConsumption
    };
    
    // Передаем исходные данные в options для заполнения PDF
    const enrichedOptions = {
      ...options,
      originalValues: values
    };
    
    const pdfBuffer = await generatePDF(templateId, calculationData, enrichedOptions);
    
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
