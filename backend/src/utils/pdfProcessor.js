/**
 * @file: pdfProcessor.js
 * @description: Утилиты для обработки PDF: детекция меток, заполнение значений
 * @dependencies: pdf-lib, pdfjs-dist
 * @created: 2025-01-13
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { FIELD_NAMES, MARKERS } from '../models/Manifest.js';
import fs from 'fs/promises';
import path from 'path';
import fontkit from '@pdf-lib/fontkit';

/**
 * Привязки маркеров к полям (для обработки дублей)
 */
const MARKER_BINDINGS = {
  [MARKERS.MSR]: [FIELD_NAMES.MSR_DAILY, FIELD_NAMES.MSR_SECONDLY],
  [MARKERS.N]: [FIELD_NAMES.PUMP_MODEL],
  [MARKERS.SH]: [FIELD_NAMES.PROJECT_CODE],
  [MARKERS.MCHR]: [FIELD_NAMES.MAX_HOURLY]
};

/**
 * Детектирует текстовые метки в PDF и возвращает поля для манифеста
 * @param {Buffer} pdfBuffer 
 * @returns {Promise<Array>}
 */
export async function detectMarkers(pdfBuffer) {
  try {
    // Конвертируем Buffer в Uint8Array если нужно
    const data = pdfBuffer instanceof Buffer ? new Uint8Array(pdfBuffer) : pdfBuffer;
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    const markers = [];
    const markerTexts = Object.keys(MARKER_BINDINGS);
    const customBraceRegex = /\{\{\s*([a-zA-Z0-9._\u0400-\u04FF\u0500-\u052F\u2DE0-\u2DFF\uA640-\uA69F\s-]{1,64})\s*\}\}/g;
    const seenFieldNames = new Set();
    
    // Сканируем все страницы
    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex++) {
      const page = await pdf.getPage(pageIndex);
      const textContent = await page.getTextContent();
      
      // Собираем текст по строкам, чтобы корректно обрабатывать маркеры, разбитые на фрагменты
      const lineTexts = new Map(); // y -> {text, items}
      for (const item of textContent.items) {
        const text = (item.str || '').trim();
        if (!text) continue;
        const y = Math.round(item.transform[5]);
        if (!lineTexts.has(y)) {
          lineTexts.set(y, { text: '', items: [] });
        }
        const line = lineTexts.get(y);
        line.text += text;
        line.items.push(item);
      }

      for (const [y, line] of lineTexts) {
        const text = line.text.trim();

        // 1) Стандартные маркеры (msr:, n:, sh:, mchr:)
        if (markerTexts.includes(text)) {
          const firstItem = line.items[0];
          const transform = firstItem.transform;
          const x = transform[4];
          const y = transform[5];

          markers.push({
            pageIndex: pageIndex - 1,
            text,
            x,
            y,
            transform
          });
          continue;
        }

        // 2) Пользовательские метки вида {{name}} (поддержка Unicode и пробелов)
        let match;
        while ((match = customBraceRegex.exec(text)) !== null) {
          const fieldName = match[1].trim();
          if (seenFieldNames.has(fieldName)) {
            continue;
          }

          // Вычисляем позицию метки внутри строки
          const firstItem = line.items[0];
          const baseTransform = firstItem.transform;
          const baseX = baseTransform[4];
          const baseY = baseTransform[5];
          
          // Вычисляем X координату КОНЦА метки внутри строки
          const markerStart = match.index;
          const markerEnd = markerStart + match[0].length;
          const charWidth = 6; // Примерная ширина символа
          const markerX = baseX + (markerEnd * charWidth); // Позиция ПОСЛЕ метки
          const markerWidth = match[0].length * charWidth;

          markers.push({
            pageIndex: pageIndex - 1,
            text: match[0], // исходный текст маркера, например {{name}}
            x: markerX,
            y: baseY,
            transform: baseTransform,
            __customName: fieldName
          });
          seenFieldNames.add(fieldName);
        }
      }
    }
    
    // Сортируем маркеры по странице, затем по Y (сверху вниз), затем по X (слева направо)
    markers.sort((a, b) => {
      if (a.pageIndex !== b.pageIndex) return a.pageIndex - b.pageIndex;
      if (Math.abs(a.y - b.y) > 5) return b.y - a.y; // Сверху вниз
      return a.x - b.x; // Слева направо
    });
    
    // Привязываем маркеры к полям
    const fieldCounters = {};
    const fields = [];
    
    for (const marker of markers) {
      // Кастомные {{name}}: создаём поле с именем name напрямую
      if (marker.__customName) {
        const name = marker.__customName;

        fields.push({
          name,
          strategy: 'text',
          marker: marker.text,
          page: marker.pageIndex,
          markerBox: {
            x: marker.x,
            y: marker.y,
            w: marker.text.length * 6,
            h: 10
          },
          draw: {
            x: marker.x + (marker.text.length * 6) + 6,
            y: marker.y,
            gap: 6,
            font: 'Helvetica',
            size: 10
          }
        });
        continue;
      }

      // Стандартные маркеры по биндингам
      const binding = MARKER_BINDINGS[marker.text];
      if (!binding) continue;
      const counter = fieldCounters[marker.text] || 0;
      const fieldName = binding[counter];
      if (fieldName) {
        fields.push({
          name: fieldName,
          strategy: 'text',
          marker: marker.text,
          page: marker.pageIndex,
          markerBox: {
            x: marker.x,
            y: marker.y,
            w: marker.text.length * 6,
            h: 10
          },
          draw: {
            x: marker.x + (marker.text.length * 6) + 6,
            y: marker.y,
            gap: 6,
            font: 'Helvetica',
            size: 10
          }
        });
        fieldCounters[marker.text] = counter + 1;
      }
    }
    
    return fields;
  } catch (error) {
    console.error('Ошибка детекции меток:', error);
    throw new Error(`Не удалось обработать PDF: ${error.message}`);
  }
}

/**
 * Заполняет PDF значениями согласно манифесту
 * @param {Buffer} templateBuffer 
 * @param {Object} manifest 
 * @param {Object} values 
 * @param {Object} options 
 * @returns {Promise<Buffer>}
 */
export async function fillPDFWithValues(templateBuffer, manifest, values, options = {}) {
  try {
    const pdfDoc = await PDFDocument.load(templateBuffer);
    
    // Регистрируем fontkit для поддержки кастомных шрифтов
    pdfDoc.registerFontkit(fontkit);
    
    const pages = pdfDoc.getPages();
    
    // Пытаемся загрузить кастомный шрифт для кириллицы (приоритет FONT_PATH)
    let font;
    const envPath = process.env.FONT_PATH;
    const defaultPath = path.join(process.cwd(), 'assets/fonts/DejaVuSans.ttf');
    const tryPaths = [envPath, defaultPath].filter(Boolean);
    let loaded = false;
    for (const p of tryPaths) {
      try {
        const isAbsolute = path.isAbsolute(p);
        const resolved = isAbsolute ? p : path.join(process.cwd(), p);
        const fontBytes = await fs.readFile(resolved);
        font = await pdfDoc.embedFont(fontBytes);
        console.log(`✅ Загружен кастомный шрифт: ${resolved}`);
        loaded = true;
        break;
      } catch (e) {
        // пробуем следующий
      }
    }
    if (!loaded) {
      console.warn('Не удалось загрузить кастомный шрифт, используем стандартный Helvetica');
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
    
    const fontSize = options.fontSize || 10;
    const gap = options.gap || 6;
    
    // Заполняем поля
    for (const field of manifest.fields) {
      const value = values[field.name];
      if (value === undefined || value === null) continue;
      
      const stringValue = String(value);
      
      if (field.strategy === 'text') {
        // Отрисовываем справа от метки
        const page = pages[field.page];
        if (!page) continue;
        
        const drawX = field.draw.x;
        const drawY = field.draw.y;
        
        page.drawText(stringValue, {
          x: drawX,
          y: drawY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0)
        });
      } else if (field.strategy === 'acroform') {
        // Заполняем поле AcroForm (если есть)
        const form = pdfDoc.getForm();
        try {
          const formField = form.getField(field.acroformName);
          if (formField) {
            formField.setText(stringValue);
          }
        } catch (error) {
          console.warn(`Поле AcroForm ${field.acroformName} не найдено:`, error.message);
        }
      }
    }
    
    // Сохраняем PDF
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Ошибка заполнения PDF:', error);
    throw new Error(`Не удалось заполнить PDF: ${error.message}`);
  }
}

/**
 * Вычисляет ширину текста для заданного шрифта и размера
 * @param {string} text 
 * @param {Object} font 
 * @param {number} fontSize 
 * @returns {number}
 */
export function calculateTextWidth(text, font, fontSize) {
  return font.widthOfTextAtSize(text, fontSize);
}
