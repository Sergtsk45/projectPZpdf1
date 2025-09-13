const { calculateValues } = require('./server');

// Test calculation functions
function testCalculations() {
  console.log('Testing calculation functions...');
  
  // Test case 1
  const result1 = calculateValues(100.5);
  console.log('Input: 100.5');
  console.log('Expected hourly: 16.33, Actual:', result1.hourlyConsumption);
  console.log('Expected secondly: 4.54, Actual:', result1.secondlyConsumption);
  
  // Test case 2
  const result2 = calculateValues(200);
  console.log('\nInput: 200');
  console.log('Expected hourly: 32.50, Actual:', result2.hourlyConsumption);
  console.log('Expected secondly: 9.03, Actual:', result2.secondlyConsumption);
  
  // Test case 3
  const result3 = calculateValues(50.25);
  console.log('\nInput: 50.25');
  console.log('Expected hourly: 8.17, Actual:', result3.hourlyConsumption);
  console.log('Expected secondly: 2.27, Actual:', result3.secondlyConsumption);
  
  console.log('\nAll tests completed!');
}

// Run the tests
testCalculations();