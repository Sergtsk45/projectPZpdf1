const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');

async function createTemplate() {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Add a page
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  
  // Embed the Helvetica font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Draw the template title
  page.drawText('Форма для заполнения данных о водопотреблении', {
    x: 50,
    y: 750,
    size: 16,
    font: font,
  });
  
  // Add labels with positions for data
  page.drawText('Максимальный суточный расход воды м3/час  msr:', {
    x: 50,
    y: 700,
    size: 12,
    font: font,
  });
  
  page.drawText('Установленный насос (марка)  n:', {
    x: 50,
    y: 650,
    size: 12,
    font: font,
  });
  
  page.drawText('Шифр проекта  sh:', {
    x: 50,
    y: 600,
    size: 12,
    font: font,
  });
  
  page.drawText('Максимальный часовой расход  mchr:', {
    x: 50,
    y: 550,
    size: 12,
    font: font,
  });
  
  page.drawText('Максимальный секундный расход  msr:', {
    x: 50,
    y: 500,
    size: 12,
    font: font,
  });
  
  // Add some additional formatting
  page.drawText('Дата заполнения: _________', {
    x: 50,
    y: 450,
    size: 12,
    font: font,
  });
  
  page.drawText('Подпись: _________', {
    x: 300,
    y: 450,
    size: 12,
    font: font,
  });
  
  // Save the PDF to a file
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('pattern1.pdf', pdfBytes);
  
  console.log('Шаблон PDF успешно создан!');
}

createTemplate().catch(err => console.error('Ошибка при создании шаблона:', err));