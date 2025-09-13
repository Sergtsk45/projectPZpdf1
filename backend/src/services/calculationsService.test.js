/**
 * @file: calculationsService.test.js
 * @description: Юнит-тесты для сервиса расчётов водопотребления
 * @dependencies: calculationsService.js
 * @created: 2025-01-13
 */

import { 
  calculateWaterConsumption, 
  formatNumber, 
  validateCalculationData,
  getCalculationConfig 
} from './calculationsService.js';

// Тесты для calculateWaterConsumption
console.log('🧪 Запуск тестов calculateWaterConsumption...\n');

// Тест 1: Базовые расчёты
console.log('Тест 1: Базовые расчёты (dailyConsumption = 100.5)');
const result1 = calculateWaterConsumption(100.5);
console.log('Ожидаемый часовой расход: 16.33, Фактический:', result1.hourlyConsumption);
console.log('Ожидаемый секундный расход: 4.54, Фактический:', result1.secondlyConsumption);
console.log('✅ Тест 1 пройден:', 
  result1.hourlyConsumption === 16.33 && result1.secondlyConsumption === 4.54);
console.log('');

// Тест 2: Целое число
console.log('Тест 2: Целое число (dailyConsumption = 200)');
const result2 = calculateWaterConsumption(200);
console.log('Ожидаемый часовой расход: 32.50, Фактический:', result2.hourlyConsumption);
console.log('Ожидаемый секундный расход: 9.03, Фактический:', result2.secondlyConsumption);
console.log('✅ Тест 2 пройден:', 
  result2.hourlyConsumption === 32.50 && result2.secondlyConsumption === 9.03);
console.log('');

// Тест 3: Малое число
console.log('Тест 3: Малое число (dailyConsumption = 50.25)');
const result3 = calculateWaterConsumption(50.25);
console.log('Ожидаемый часовой расход: 8.17, Фактический:', result3.hourlyConsumption);
console.log('Ожидаемый секундный расход: 2.27, Фактический:', result3.secondlyConsumption);
console.log('✅ Тест 3 пройден:', 
  result3.hourlyConsumption === 8.17 && result3.secondlyConsumption === 2.27);
console.log('');

// Тест 4: Нулевое значение
console.log('Тест 4: Нулевое значение (dailyConsumption = 0)');
const result4 = calculateWaterConsumption(0);
console.log('Часовой расход:', result4.hourlyConsumption);
console.log('Секундный расход:', result4.secondlyConsumption);
console.log('✅ Тест 4 пройден:', 
  result4.hourlyConsumption === 0 && result4.secondlyConsumption === 0);
console.log('');

// Тест 5: Кастомные параметры
console.log('Тест 5: Кастомные параметры');
const result5 = calculateWaterConsumption(100, {
  hourlyMultiplier: 4.0,
  secondlyDivisor: 4.0,
  precision: 3
});
console.log('Часовой расход (множитель 4.0):', result5.hourlyConsumption);
console.log('Секундный расход (делитель 4.0):', result5.secondlyConsumption);
console.log('✅ Тест 5 пройден:', 
  result5.hourlyConsumption === 16.667 && result5.secondlyConsumption === 4.167);
console.log('');

// Тесты для formatNumber
console.log('🧪 Запуск тестов formatNumber...\n');

console.log('Тест 6: Форматирование числа');
const formatted1 = formatNumber(16.33, 2, 'ru-RU');
const formatted2 = formatNumber(4.54, 2, 'en-US');
console.log('Форматирование (ru-RU):', formatted1);
console.log('Форматирование (en-US):', formatted2);
console.log('✅ Тест 6 пройден:', 
  formatted1 === '16,33' && formatted2 === '4.54');
console.log('');

// Тесты для validateCalculationData
console.log('🧪 Запуск тестов validateCalculationData...\n');

console.log('Тест 7: Валидация корректных данных');
const validation1 = validateCalculationData({ dailyConsumption: 100 });
console.log('Валидация корректных данных:', validation1.valid);
console.log('✅ Тест 7 пройден:', validation1.valid === true);
console.log('');

console.log('Тест 8: Валидация некорректных данных');
const validation2 = validateCalculationData({ dailyConsumption: -10 });
const validation3 = validateCalculationData({ dailyConsumption: 'abc' });
const validation4 = validateCalculationData({});
console.log('Валидация отрицательного числа:', validation2.valid, validation2.errors);
console.log('Валидация строки:', validation3.valid, validation3.errors);
console.log('Валидация пустого объекта:', validation4.valid, validation4.errors);
console.log('✅ Тест 8 пройден:', 
  validation2.valid === false && validation3.valid === false && validation4.valid === false);
console.log('');

// Тесты для getCalculationConfig
console.log('🧪 Запуск тестов getCalculationConfig...\n');

const config = getCalculationConfig();
console.log('Конфигурация по умолчанию:', config);
console.log('✅ Тест 9 пройден:', 
  config.hourlyMultiplier === 3.9 && 
  config.secondlyDivisor === 3.6 && 
  config.precision === 2);
console.log('');

console.log('🎉 Все тесты завершены!');
