/**
 * @file: Manifest.js
 * @description: Схема манифеста шаблона PDF для гибридного подхода (авто-детект + AcroForm)
 * @dependencies: pdf-lib, pdfjs-dist
 * @created: 2025-01-13
 */

/**
 * Схема манифеста шаблона PDF
 * @typedef {Object} TemplateManifest
 * @property {string} templateId - SHA256 хеш файла шаблона
 * @property {string} fileName - Исходное имя файла
 * @property {number} pages - Количество страниц
 * @property {Field[]} fields - Массив полей для заполнения
 * @property {string} createdAt - ISO дата создания
 * @property {number} version - Версия схемы манифеста
 */

/**
 * Поле для заполнения в PDF
 * @typedef {Object} Field
 * @property {string} name - Уникальное имя поля (msr_daily, pump_model, etc.)
 * @property {'text'|'acroform'} strategy - Стратегия заполнения
 * @property {string} marker - Текстовая метка для поиска (msr:, n:, etc.)
 * @property {number} page - Номер страницы (0-based)
 * @property {BoundingBox} [markerBox] - Координаты метки (для text strategy)
 * @property {DrawConfig} [draw] - Параметры отрисовки (для text strategy)
 * @property {string} [acroformName] - Имя поля AcroForm (для acroform strategy)
 */

/**
 * Координаты и размеры элемента
 * @typedef {Object} BoundingBox
 * @property {number} x - X координата
 * @property {number} y - Y координата
 * @property {number} w - Ширина
 * @property {number} h - Высота
 */

/**
 * Параметры отрисовки текста
 * @typedef {Object} DrawConfig
 * @property {number} x - X координата для отрисовки
 * @property {number} y - Y координата для отрисовки
 * @property {number} gap - Отступ справа от метки
 * @property {string} font - Название шрифта
 * @property {number} size - Размер шрифта
 */

/**
 * Стандартные имена полей
 */
export const FIELD_NAMES = {
  MSR_DAILY: 'msr_daily',
  PUMP_MODEL: 'pump_model', 
  PROJECT_CODE: 'project_code',
  MAX_HOURLY: 'max_hourly',
  MSR_SECONDLY: 'msr_secondly'
};

/**
 * Стандартные маркеры
 */
export const MARKERS = {
  MSR: 'msr:',
  N: 'n:',
  SH: 'sh:',
  MCHR: 'mchr:'
};

/**
 * Создает пустой манифест
 * @param {string} templateId 
 * @param {string} fileName 
 * @param {number} pages 
 * @returns {TemplateManifest}
 */
export function createEmptyManifest(templateId, fileName, pages = 1) {
  return {
    templateId,
    fileName,
    pages,
    fields: [],
    createdAt: new Date().toISOString(),
    version: 1
  };
}

/**
 * Валидирует манифест
 * @param {TemplateManifest} manifest 
 * @returns {boolean}
 */
export function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') return false;
  if (!manifest.templateId || !manifest.fileName) return false;
  if (!Array.isArray(manifest.fields)) return false;
  
  // Проверяем уникальность имен полей
  const fieldNames = manifest.fields.map(f => f.name);
  const uniqueNames = new Set(fieldNames);
  if (fieldNames.length !== uniqueNames.size) return false;
  
  return true;
}

/**
 * Находит поле по имени
 * @param {TemplateManifest} manifest 
 * @param {string} fieldName 
 * @returns {Field|undefined}
 */
export function findField(manifest, fieldName) {
  return manifest.fields.find(field => field.name === fieldName);
}
