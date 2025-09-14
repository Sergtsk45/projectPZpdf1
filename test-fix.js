#!/usr/bin/env node

// Тест исправления генерации PDF
const fetch = require('node-fetch');

async function testPDFGeneration() {
  try {
    console.log('🧪 Тестируем генерацию PDF...');
    
    // Тест 1: API расчётов
    console.log('1. Тестируем API расчётов...');
    const calcResponse = await fetch('http://localhost:3000/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyConsumption: 100.5 })
    });
    
    if (calcResponse.ok) {
      const calcData = await calcResponse.json();
      console.log('✅ API расчётов работает:', calcData.calculations.hourlyConsumption);
    } else {
      console.log('❌ API расчётов не работает');
      return;
    }
    
    // Тест 2: Генерация PDF
    console.log('2. Тестируем генерацию PDF...');
    const pdfResponse = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: '5fac67b72f7c82c9f32ee615b26d7834ccbe1ff4c16ebf600f3912d24beeb7a2',
        values: {
          dailyConsumption: 100.5,
          pumpModel: 'Тест-насос',
          projectCode: 'ТЕСТ-001',
          requiredHead: 25.5,
          flowMeter: 'Тест-счетчик'
        }
      })
    });
    
    if (pdfResponse.ok) {
      const pdfBuffer = await pdfResponse.buffer();
      console.log('✅ PDF сгенерирован, размер:', pdfBuffer.length, 'байт');
      
      // Сохраняем файл
      const fs = require('fs');
      fs.writeFileSync('test-fixed.pdf', pdfBuffer);
      console.log('✅ Файл сохранен: test-fixed.pdf');
    } else {
      const errorText = await pdfResponse.text();
      console.log('❌ Ошибка генерации PDF:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error.message);
  }
}

testPDFGeneration();
