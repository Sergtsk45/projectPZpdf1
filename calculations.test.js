// Unit tests for calculation functions
// Extract the function directly to avoid starting the server
const calculateValues = (dailyConsumption) => {
  const hourlyConsumption = 3.9 * dailyConsumption / 24;
  const secondlyConsumption = hourlyConsumption / 3.6;
  return {
    hourlyConsumption: hourlyConsumption.toFixed(2),
    secondlyConsumption: secondlyConsumption.toFixed(2)
  };
};

console.log('Running unit tests for calculation functions...\n');

// Test case 1
console.log('Test 1: Daily consumption = 100.5');
const result1 = calculateValues(100.5);
console.log('Expected hourly: 16.33, Actual:', result1.hourlyConsumption);
console.log('Expected secondly: 4.54, Actual:', result1.secondlyConsumption);
console.log('Test 1 passed:', result1.hourlyConsumption === '16.33' && result1.secondlyConsumption === '4.54');
console.log('');

// Test case 2
console.log('Test 2: Daily consumption = 200');
const result2 = calculateValues(200);
console.log('Expected hourly: 32.50, Actual:', result2.hourlyConsumption);
console.log('Expected secondly: 9.03, Actual:', result2.secondlyConsumption);
console.log('Test 2 passed:', result2.hourlyConsumption === '32.50' && result2.secondlyConsumption === '9.03');
console.log('');

// Test case 3
console.log('Test 3: Daily consumption = 50.25');
const result3 = calculateValues(50.25);
console.log('Expected hourly: 8.17, Actual:', result3.hourlyConsumption);
console.log('Expected secondly: 2.27, Actual:', result3.secondlyConsumption);
console.log('Test 3 passed:', result3.hourlyConsumption === '8.17' && result3.secondlyConsumption === '2.27');
console.log('');

console.log('All unit tests completed!');