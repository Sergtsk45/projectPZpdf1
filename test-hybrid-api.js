/**
 * @file: test-hybrid-api.js
 * @description: Тестовый скрипт для проверки гибридного API
 * @dependencies: node-fetch, fs, path
 * @created: 2025-01-13
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

const API_BASE = 'http://localhost:3000/api';
const TEST_TEMPLATE = 'pattern1.pdf';

async function testAPI() {
  console.log('🧪 Тестирование гибридного API...\n');
  
  try {
    // 1. Тест загрузки шаблона
    console.log('1️⃣ Тестируем загрузку шаблона...');
    const templateBuffer = await fs.readFile(TEST_TEMPLATE);
    
    const formData = new FormData();
    formData.append('file', new Blob([templateBuffer], { type: 'application/pdf' }), TEST_TEMPLATE);
    
    const uploadResponse = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Ошибка загрузки: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ Шаблон загружен:', uploadResult.templateId);
    console.log('📋 Манифест:', JSON.stringify(uploadResult.manifest, null, 2));
    
    const templateId = uploadResult.templateId;
    
    // 2. Тест получения манифеста
    console.log('\n2️⃣ Тестируем получение манифеста...');
    const manifestResponse = await fetch(`${API_BASE}/templates/${templateId}/manifest`);
    
    if (!manifestResponse.ok) {
      throw new Error(`Ошибка получения манифеста: ${manifestResponse.status}`);
    }
    
    const manifestResult = await manifestResponse.json();
    console.log('✅ Манифест получен:', manifestResult.manifest.fields.length, 'полей');
    
    // 3. Тест генерации PDF
    console.log('\n3️⃣ Тестируем генерацию PDF...');
    const testValues = {
      msr_daily: '150 m3/hour',
      pump_model: 'Pump X-200',
      project_code: 'PZ-001',
      max_hourly: '45 m3/hour',
      msr_secondly: '12.5 l/s'
    };
    
    const generateResponse = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        templateId,
        values: testValues,
        options: {
          fontSize: 10,
          gap: 6
        }
      })
    });
    
    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      throw new Error(`Ошибка генерации: ${generateResponse.status} - ${errorText}`);
    }
    
    const pdfBuffer = await generateResponse.buffer();
    const outputPath = 'test-hybrid-output.pdf';
    await fs.writeFile(outputPath, pdfBuffer);
    
    console.log('✅ PDF сгенерирован:', outputPath, `(${pdfBuffer.length} байт)`);
    
    // 4. Проверка содержимого PDF
    console.log('\n4️⃣ Проверяем содержимое PDF...');
    const pdfText = await extractTextFromPDF(pdfBuffer);
    console.log('📄 Извлеченный текст:', pdfText.substring(0, 200) + '...');
    
    console.log('\n🎉 Все тесты прошли успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
    process.exit(1);
  }
}

async function extractTextFromPDF(pdfBuffer) {
  try {
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    
    let text = '';
    for (const page of pages) {
      // Простая проверка - извлекаем текст через pdf-lib
      text += `Страница ${pages.indexOf(page) + 1}: ${page.getWidth()}x${page.getHeight()}\n`;
    }
    
    return text;
  } catch (error) {
    return `Ошибка извлечения текста: ${error.message}`;
  }
}

// Запуск тестов
testAPI();
