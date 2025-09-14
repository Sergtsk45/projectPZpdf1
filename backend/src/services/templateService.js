/**
 * @file: templateService.js
 * @description: Сервис для работы с PDF шаблонами (загрузка, детекция меток, генерация)
 * @dependencies: pdf-lib, pdfjs-dist, fs, crypto, path
 * @created: 2025-01-13
 */

import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createEmptyManifest, validateManifest, findField, FIELD_NAMES, MARKERS } from '../models/Manifest.js';
import { detectMarkers, fillPDFWithValues } from '../utils/pdfProcessor.js';
import { calculateWaterConsumption, validateCalculationData, formatNumber } from './calculationsService.js';

const MANIFESTS_DIR = 'backend/storage/manifests';
const TEMPLATES_DIR = 'backend/storage/templates';

/**
 * Загружает PDF шаблон и генерирует манифест
 * @param {Object} file - Загруженный файл от multer
 * @returns {Promise<{templateId: string, manifest: Object}>}
 */
export async function uploadTemplate(file) {
  try {
    // Читаем файл и вычисляем хеш
    const fileBuffer = await fs.readFile(file.path);
    const templateId = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // Проверяем, не загружен ли уже такой шаблон
    const manifestPath = path.join(MANIFESTS_DIR, `${templateId}.json`);
    try {
      const existingManifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      if (validateManifest(existingManifest)) {
        return { templateId, manifest: existingManifest };
      }
    } catch (error) {
      // Манифест не существует или поврежден, создаем новый
    }
    
    // Детектируем метки в PDF
    const markers = await detectMarkers(new Uint8Array(fileBuffer));
    
    // Создаем манифест
    const manifest = createEmptyManifest(templateId, file.originalname, 1);
    manifest.fields = markers;
    
    // Переименовываем файл в правильное имя
    const correctFileName = manifest.storageFileName;
    const correctFilePath = path.join(TEMPLATES_DIR, correctFileName);
    
    // Перемещаем файл из временного места в правильное имя
    await fs.rename(file.path, correctFilePath);
    
    // Сохраняем манифест
    await fs.mkdir(MANIFESTS_DIR, { recursive: true });
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    return { templateId, manifest };
  } catch (error) {
    // Очищаем загруженный файл в случае ошибки
    try {
      await fs.unlink(file.path);
    } catch (unlinkError) {
      console.warn('Не удалось удалить временный файл:', unlinkError.message);
    }
    throw error;
  }
}

/**
 * Получает манифест шаблона по ID
 * @param {string} templateId 
 * @returns {Promise<Object|null>}
 */
export async function getManifest(templateId) {
  try {
    const manifestPath = path.join(MANIFESTS_DIR, `${templateId}.json`);
    const manifestData = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestData);
    
    return validateManifest(manifest) ? manifest : null;
  } catch (error) {
    return null;
  }
}

/**
 * Генерирует PDF с заполненными данными
 * @param {string} templateId 
 * @param {Object} values 
 * @param {Object} options 
 * @returns {Promise<Buffer>}
 */
export async function generatePDF(templateId, calculationData, options = {}) {
  try {
    // Валидируем входные данные для расчётов
    const validation = validateCalculationData(calculationData);
    if (!validation.valid) {
      throw new Error(`Ошибка валидации данных: ${validation.errors.join(', ')}`);
    }

    // Выполняем расчёты водопотребления
    const calculations = calculateWaterConsumption(calculationData.dailyConsumption, options.calculationOptions);
    
    // Получаем исходные данные и маппинг полей из options (переданные с фронтенда)
    const originalValues = options.originalValues || {};
    const fieldMappings = options.fieldMappings || {};
    
    // Готовим значения для подстановки
    const precision = (options.calculationOptions && options.calculationOptions.precision) || 2;
    
    // Для вычисленных данных - только цифры без единиц измерения
    const hourlyValue = formatNumber(calculations.hourlyConsumption, precision);
    const secondlyValue = formatNumber(calculations.secondlyConsumption, precision);
    const dailyValue = formatNumber(calculationData.dailyConsumption, precision);

    // Создаем маппинг значений к именам полей на основе fieldMappings
    const mappedValues = {};
    
    // Маппинг для исходных данных - берем только то, что ввел пользователь
    mappedValues[fieldMappings.dailyConsumption || 'msr_daily'] = dailyValue;
    mappedValues[fieldMappings.pumpModel || 'n'] = originalValues.pump_model || '';
    mappedValues[fieldMappings.flowMeter || 'flow_meter'] = originalValues.flow_meter || '';
    mappedValues[fieldMappings.projectCode || 'sh'] = originalValues.project_code || '';
    mappedValues[fieldMappings.requiredHead || 'mchr'] = originalValues.requiredHead || '';
    
    // Маппинг для результатов расчётов - только цифры
    mappedValues[fieldMappings.hourlyConsumption || 'mchr'] = hourlyValue;
    mappedValues[fieldMappings.secondlyConsumption || 'msr_secondly'] = secondlyValue;
    
    // Добавляем второе значение для msr (секундный расход) если используется стандартный маппинг
    if (!fieldMappings.secondlyConsumption) {
      const msrSecondlyMarker = fieldMappings.dailyConsumption ? 
        fieldMappings.dailyConsumption + '_secondly' : 'msr_secondly';
      mappedValues[msrSecondlyMarker] = secondlyValue;
    }

    // Объединяем исходные данные с результатами расчётов
    const enrichedValues = {
      ...originalValues,
      // Числовые значения (могут пригодиться)
      hourlyConsumption: calculations.hourlyConsumption,
      secondlyConsumption: calculations.secondlyConsumption,
      // Строковые значения для вывода в PDF (стандартные имена) - только цифры
      msr_daily: dailyValue,
      max_hourly: hourlyValue,
      msr_secondly: secondlyValue,
      // Пользовательские маппинги
      ...mappedValues
    };

    // Получаем манифест
    const manifest = await getManifest(templateId);
    if (!manifest) {
      throw new Error(`Шаблон ${templateId} не найден`);
    }
    
    // Используем имя файла из манифеста (с fallback для старых манифестов)
    const storageFileName = manifest.storageFileName || `template_${templateId}.pdf`;
    const templatePath = path.join(TEMPLATES_DIR, storageFileName);
    console.log(`📄 Используем шаблон: ${templatePath}`);
    
    // Проверяем существование файла
    try {
      await fs.access(templatePath);
    } catch (error) {
      // Fallback: ищем любой файл с templateId в имени
      console.log(`📄 Fallback: ищем файл с templateId ${templateId}`);
      const files = await fs.readdir(TEMPLATES_DIR);
      console.log(`📄 Доступные файлы:`, files);
      
      const templateFile = files.find(f => f.includes(templateId) && f.endsWith('.pdf'));
      if (!templateFile) {
        // Если не нашли по templateId, берем первый PDF файл
        const anyPdfFile = files.find(f => f.endsWith('.pdf'));
        if (!anyPdfFile) {
          throw new Error(`Файл шаблона для ${templateId} не найден. Искали: ${storageFileName}. Доступные файлы: ${files.join(', ')}`);
        }
        console.log(`📄 Fallback: используем любой PDF файл ${anyPdfFile}`);
        const fallbackPath = path.join(TEMPLATES_DIR, anyPdfFile);
        
        // Читаем шаблон из fallback пути
        const templateBuffer = await fs.readFile(fallbackPath);
        
        // Заполняем PDF с обогащенными данными
        const filledBuffer = await fillPDFWithValues(templateBuffer, manifest, enrichedValues, options);
        
        return filledBuffer;
      }
      
      const fallbackPath = path.join(TEMPLATES_DIR, templateFile);
      console.log(`📄 Fallback: используем ${fallbackPath}`);
      
      // Читаем шаблон из fallback пути
      const templateBuffer = await fs.readFile(fallbackPath);
      
      // Заполняем PDF с обогащенными данными
      const filledBuffer = await fillPDFWithValues(templateBuffer, manifest, enrichedValues, options);
      
      return filledBuffer;
    }
    
    // Читаем шаблон
    const templateBuffer = await fs.readFile(templatePath);
    
    // Заполняем PDF с обогащенными данными
    const filledBuffer = await fillPDFWithValues(templateBuffer, manifest, enrichedValues, options);
    
    return filledBuffer;
  } catch (error) {
    throw new Error(`Ошибка генерации PDF: ${error.message}`);
  }
}

/**
 * Валидирует данные для заполнения
 * @param {Object} values 
 * @param {Object} manifest 
 * @returns {Object} {valid: boolean, errors: string[]}
 */
export function validateValues(values, manifest) {
  const errors = [];
  
  // Проверяем обязательные поля
  const requiredFields = manifest.fields.map(f => f.name);
  for (const fieldName of requiredFields) {
    if (!(fieldName in values)) {
      errors.push(`Поле ${fieldName} обязательно`);
    }
  }
  
  // Проверяем типы данных
  for (const [key, value] of Object.entries(values)) {
    if (typeof value !== 'string' && typeof value !== 'number') {
      errors.push(`Поле ${key} должно быть строкой или числом`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
