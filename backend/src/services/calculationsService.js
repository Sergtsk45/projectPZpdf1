/**
 * @file: calculationsService.js
 * @description: Сервис для расчётов водопотребления (часовой и секундный расход)
 * @dependencies: нет
 * @created: 2025-01-13
 */

/**
 * Выполняет расчёты водопотребления на основе суточного расхода
 * @param {number} dailyConsumption - Суточный расход воды (м³/сут)
 * @param {Object} options - Опции расчёта
 * @param {number} options.hourlyMultiplier - Множитель для часового расхода (по умолчанию 3.9)
 * @param {number} options.secondlyDivisor - Делитель для секундного расхода (по умолчанию 3.6)
 * @param {number} options.precision - Количество знаков после запятой (по умолчанию 2)
 * @returns {Object} Результаты расчётов
 */
export function calculateWaterConsumption(dailyConsumption, options = {}) {
  // Валидация входных данных
  if (typeof dailyConsumption !== 'number' || isNaN(dailyConsumption)) {
    throw new Error('dailyConsumption должен быть числом');
  }
  
  if (dailyConsumption < 0) {
    throw new Error('dailyConsumption не может быть отрицательным');
  }

  // Параметры по умолчанию
  const {
    hourlyMultiplier = 3.9,
    secondlyDivisor = 3.6,
    precision = 2
  } = options;

  // Расчёты
  const hourlyConsumption = hourlyMultiplier * dailyConsumption / 24;
  const secondlyConsumption = hourlyConsumption / secondlyDivisor;

  // Округление по банковскому правилу
  const roundToPrecision = (value, precision) => {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  };

  return {
    dailyConsumption: roundToPrecision(dailyConsumption, precision),
    hourlyConsumption: roundToPrecision(hourlyConsumption, precision),
    secondlyConsumption: roundToPrecision(secondlyConsumption, precision),
    // Дополнительная информация
    calculations: {
      formula: {
        hourly: `${hourlyMultiplier} * dailyConsumption / 24`,
        secondly: 'hourlyConsumption / 3.6'
      },
      parameters: {
        hourlyMultiplier,
        secondlyDivisor,
        precision
      }
    }
  };
}

/**
 * Форматирует числа для отображения в PDF
 * @param {number} value - Значение для форматирования
 * @param {number} precision - Количество знаков после запятой
 * @param {string} locale - Локаль для форматирования (по умолчанию 'ru-RU')
 * @returns {string} Отформатированное значение
 */
export function formatNumber(value, precision = 2, locale = 'ru-RU') {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }
  
  return value.toLocaleString(locale, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
}

/**
 * Валидирует входные данные для расчётов
 * @param {Object} data - Данные для валидации
 * @returns {Object} {valid: boolean, errors: string[]}
 */
export function validateCalculationData(data) {
  const errors = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Данные должны быть объектом');
    return { valid: false, errors };
  }
  
  const { dailyConsumption } = data;
  
  if (dailyConsumption === undefined || dailyConsumption === null) {
    errors.push('dailyConsumption обязателен');
  } else if (typeof dailyConsumption !== 'number' || isNaN(dailyConsumption)) {
    errors.push('dailyConsumption должен быть числом');
  } else if (dailyConsumption < 0) {
    errors.push('dailyConsumption не может быть отрицательным');
  } else if (dailyConsumption > 10000) {
    errors.push('dailyConsumption слишком большой (максимум 10000 м³/сут)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Получает конфигурацию расчётов из переменных окружения
 * @returns {Object} Конфигурация расчётов
 */
export function getCalculationConfig() {
  return {
    hourlyMultiplier: parseFloat(process.env.HOURLY_MULTIPLIER) || 3.9,
    secondlyDivisor: parseFloat(process.env.SECONDLY_DIVISOR) || 3.6,
    precision: parseInt(process.env.CALCULATION_PRECISION) || 2,
    locale: process.env.NUMBER_LOCALE || 'ru-RU'
  };
}
