const fs = require('fs');
const path = require('path');

// Test data
const testData = {
  dailyConsumption: "100.5",
  requiredHead: "25.0",
  pumpModel: "Model XYZ",
  flowMeter: "Meter ABC",
  projectCode: "PROJ-123"
};

// Simple test function
async function testPdfGeneration() {
  try {
    console.log('Testing PDF generation with data:', testData);
    
    const response = await fetch('http://localhost:3000/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    if (response.ok) {
      console.log('PDF generation successful!');
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(path.join(__dirname, 'test-output.pdf'), Buffer.from(buffer));
      console.log('Test PDF saved as test-output.pdf');
    } else {
      console.error('PDF generation failed with status:', response.status);
    }
  } catch (error) {
    console.error('Error during test:', error.message);
  }
}

// Run the test
testPdfGeneration();