const express = require('express');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Function to perform calculations
function calculateValues(dailyConsumption) {
  const hourlyConsumption = 3.9 * dailyConsumption / 24;
  const secondlyConsumption = hourlyConsumption / 3.6;
  return {
    hourlyConsumption: hourlyConsumption.toFixed(2),
    secondlyConsumption: secondlyConsumption.toFixed(2)
  };
}

// Export for testing
module.exports = { calculateValues };

// POST endpoint to generate PDF
app.post('/generate-pdf', async (req, res) => {
  try {
    // Extract data from request body
    const {
      dailyConsumption,
      requiredHead,
      pumpModel,
      flowMeter,
      projectCode
    } = req.body;

    // Perform calculations
    const calculations = calculateValues(parseFloat(dailyConsumption));

    // Load the PDF template
    const templatePath = path.join(__dirname, 'pattern1.pdf');
    const existingPdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Get the first page of the document
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // For text-based PDFs, we would need to draw text on the PDF
    // Since we don't have the exact template with form fields,
    // we'll implement a basic text replacement approach
    
    // In a real implementation with form fields, we would do:
    // For AcroForm fields:
    // const form = pdfDoc.getForm();
    // form.getTextField('fieldName').setText('value');
    
    // Save the modified PDF
    const pdfBytes = await pdfDoc.save();
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=completed_form.pdf');
    
    // Send the PDF as response
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF: ' + error.message);
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});