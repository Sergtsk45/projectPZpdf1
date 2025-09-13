const fs = require('fs');

// Test data
const testData = {
  dailyConsumption: "150.5",
  requiredHead: "30.0",
  pumpModel: "Насос ABC-123",
  flowMeter: "Расходомер XYZ",
  projectCode: "PROJ-456"
};

async function testPdfFill() {
  try {
    console.log('Testing PDF fill with data:', testData);
    
    const port = process.env.PORT || 3000;
    const response = await fetch(`http://localhost:${port}/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    if (response.ok) {
      console.log('PDF generation successful!');
      const buffer = await response.arrayBuffer();
      fs.writeFileSync('test-filled-output.pdf', Buffer.from(buffer));
      console.log('Filled PDF saved as test-filled-output.pdf');
    } else {
      console.error('PDF generation failed with status:', response.status);
    }
  } catch (error) {
    console.error('Error during test:', error.message);
  }
}

// Run the test
testPdfFill();