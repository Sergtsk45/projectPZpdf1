const express = require('express');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');

require('dotenv').config();
const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Load markers config and cache template PDF bytes
const markersConfigPath = path.join(__dirname, 'config', 'markers.json');
let markersConfig = { anchors: {}, font: { name: 'Helvetica', size: 12 } };
try {
  if (fs.existsSync(markersConfigPath)) {
    markersConfig = JSON.parse(fs.readFileSync(markersConfigPath, 'utf8'));
  }
} catch (e) {
  console.warn('Unable to load markers config, using defaults:', e.message);
}

const templatePath = path.join(__dirname, 'pattern1.pdf');
let cachedTemplateBytes = null;
try {
  if (fs.existsSync(templatePath)) {
    cachedTemplateBytes = fs.readFileSync(templatePath);
  } else {
    console.warn('Template PDF not found at', templatePath);
  }
} catch (e) {
  console.warn('Unable to read template PDF:', e.message);
}

function drawAtAnchor(page, key, text, font, fontSize) {
  const anchor = (markersConfig.anchors || {})[key];
  if (!anchor) return;
  const x = (anchor.x || 0) + (anchor.dx || 0);
  const y = (anchor.y || 0) + (anchor.dy || 0);
  page.drawText(String(text ?? ''), {
    x,
    y,
    size: fontSize,
    font,
  });
}

// Optional custom TTF font (for Cyrillic and extended glyphs)
const defaultFontCandidate = path.join(__dirname, 'assets', 'fonts', 'DejaVuSans.ttf');
const fontPathFromEnv = process.env.FONT_PATH;
let customFontBytes = null;
try {
  const ttfPath = fontPathFromEnv && fs.existsSync(fontPathFromEnv)
    ? fontPathFromEnv
    : (fs.existsSync(defaultFontCandidate) ? defaultFontCandidate : null);
  if (ttfPath) {
    customFontBytes = fs.readFileSync(ttfPath);
    console.log('Custom TTF font loaded from', ttfPath);
  }
} catch (e) {
  console.warn('Unable to load custom TTF font:', e.message);
}

function hasNonLatin1Characters(value) {
  if (value == null) return false;
  const str = String(value);
  for (let i = 0; i < str.length; i += 1) {
    if (str.charCodeAt(i) > 0x00FF) return true;
  }
  return false;
}

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

    // Load the PDF template (from cache)
    if (!cachedTemplateBytes) {
      return res.status(500).send('Template PDF is not available');
    }
    const pdfDoc = await PDFDocument.load(cachedTemplateBytes);
    
    // Register fontkit for custom font support
    pdfDoc.registerFontkit(fontkit);

    // Get the first page of the document
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Choose font: prefer custom TTF for Cyrillic, fallback to standard font
    const fontSize = (markersConfig.font && markersConfig.font.size) || 12;
    const needsCyrillic = [dailyConsumption, pumpModel, projectCode, calculations.hourlyConsumption, calculations.secondlyConsumption]
      .some(hasNonLatin1Characters);
    
    let font;
    if (customFontBytes && needsCyrillic) {
      // Use custom font for Cyrillic support
      font = await pdfDoc.embedFont(customFontBytes);
    } else if (needsCyrillic) {
      // Cyrillic requested but no custom font available
      return res.status(400).json({ code: 'FONT_UNSUPPORTED', message: 'Кириллица недоступна. Установите TTF шрифт или используйте латинские символы.' });
    } else {
      // Use standard font for Latin characters
      const fontName = (markersConfig.font && markersConfig.font.name) || 'Helvetica';
      const stdFont = StandardFonts[fontName] || StandardFonts.Helvetica;
      font = await pdfDoc.embedFont(stdFont);
    }

    // Fill data relative to anchors (to the right of labels)
    // Максимальный суточный расход воды м3/час  msr:
    drawAtAnchor(firstPage, 'msr_daily', dailyConsumption, font, fontSize);
    // Установленный насос (марка)  n:
    drawAtAnchor(firstPage, 'n', pumpModel, font, fontSize);
    // Шифр проекта  sh:
    drawAtAnchor(firstPage, 'sh', projectCode, font, fontSize);
    // Максимальный часовой расход  mchr:
    drawAtAnchor(firstPage, 'mchr', calculations.hourlyConsumption, font, fontSize);
    // Максимальный секундный расход  msr:
    drawAtAnchor(firstPage, 'msr_secondly', calculations.secondlyConsumption, font, fontSize);

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