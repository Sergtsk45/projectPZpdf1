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
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { createEmptyManifest, validateManifest, findField, FIELD_NAMES, MARKERS } from '../models/Manifest.js';
import { detectMarkers, fillPDFWithValues } from '../utils/pdfProcessor.js';

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
    const markers = await detectMarkers(fileBuffer);
    
    // Создаем манифест
    const manifest = createEmptyManifest(templateId, file.originalname, 1);
    manifest.fields = markers;
    
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
export async function generatePDF(templateId, values, options = {}) {
  try {
    // Получаем манифест
    const manifest = await getManifest(templateId);
    if (!manifest) {
      throw new Error(`Шаблон ${templateId} не найден`);
    }
    
    // Находим файл шаблона
    const templatePath = path.join(TEMPLATES_DIR, `template_${templateId}.pdf`);
    try {
      await fs.access(templatePath);
    } catch (error) {
      // Ищем по оригинальному имени
      const files = await fs.readdir(TEMPLATES_DIR);
      const templateFile = files.find(f => f.startsWith('template_') && f.endsWith('.pdf'));
      if (!templateFile) {
        throw new Error(`Файл шаблона для ${templateId} не найден`);
      }
      templatePath = path.join(TEMPLATES_DIR, templateFile);
    }
    
    // Читаем шаблон
    const templateBuffer = await fs.readFile(templatePath);
    
    // Заполняем PDF
    const filledBuffer = await fillPDFWithValues(templateBuffer, manifest, values, options);
    
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
