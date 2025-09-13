/**
 * @file: test-frontend-integration.js
 * @description: Тест полной интеграции frontend + backend
 * @dependencies: node-fetch, fs
 * @created: 2025-01-13
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';

const API_BASE = 'http://localhost:3000/api';
const TEST_TEMPLATE = 'pattern1.pdf';

async function testFullWorkflow() {
  console.log('🧪 Тестирование полного workflow...\n');
  
  try {
    // 1. Загрузка шаблона
    console.log('1️⃣ Загружаем шаблон...');
    const templateBuffer = await fs.readFile(TEST_TEMPLATE);
    
    const formData = new FormData();
    formData.append('file', new Blob([templateBuffer], { type: 'application/pdf' }), TEST_TEMPLATE);
    
    const uploadResponse = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Ошибка загрузки: ${uploadResponse.status}`);
    }
    
    const uploadResult = await uploadResponse.json();
    const templateId = uploadResult.templateId;
    console.log('✅ Шаблон загружен:', templateId);
    console.log('📋 Найдено полей:', uploadResult.manifest.fields.length);
    
    // 2. Генерация PDF с тестовыми данными
    console.log('\n2️⃣ Генерируем PDF с тестовыми данными...');
    const testValues = {
      msr_daily: '150 м3/час',
      pump_model: 'Насос X-200',
      project_code: 'PZ-001',
      max_hourly: '45 м3/час',
      msr_secondly: '12.5 л/с'
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
    
    const pdfBuffer = await generateResponse.arrayBuffer();
    const outputPath = 'test-frontend-integration.pdf';
    await fs.writeFile(outputPath, Buffer.from(pdfBuffer));
    
    console.log('✅ PDF сгенерирован:', outputPath, `(${pdfBuffer.byteLength} байт)`);
    
    // 3. Проверяем доступность frontend
    console.log('\n3️⃣ Проверяем frontend...');
    const frontendResponse = await fetch('http://localhost:3000/');
    
    if (!frontendResponse.ok) {
      throw new Error(`Frontend недоступен: ${frontendResponse.status}`);
    }
    
    const frontendHtml = await frontendResponse.text();
    if (frontendHtml.includes('Загрузка PDF шаблона')) {
      console.log('✅ Frontend обновлен и доступен');
    } else {
      console.log('⚠️ Frontend может быть не обновлен');
    }
    
    console.log('\n🎉 Полный workflow работает!');
    console.log('\n📝 Инструкции для тестирования:');
    console.log('1. Откройте http://localhost:3000 в браузере');
    console.log('2. Загрузите pattern1.pdf как шаблон');
    console.log('3. Заполните форму и сгенерируйте PDF');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
    process.exit(1);
  }
}

// Запуск тестов
testFullWorkflow();

