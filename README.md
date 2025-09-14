# PDF Template Filling Web Service

A web service that accepts user input through a web form, performs calculations, and fills a PDF template with the results.

## Features

- User-friendly web form for data input
- Automatic calculations based on water consumption data
- PDF generation with filled template
- Downloadable completed PDF documents

## Technology Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Fetch API for backend communication

### Backend
- Node.js
- Express.js
- pdf-lib for PDF processing
- pdfjs-dist for marker detection
- Multer for template uploads

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Configure environment (optional):
   ```bash
   cp .env.example .env
   # edit PORT if needed (default 3000)
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:${PORT:-3000}`

### Cyrillic Support

The service now includes full support for Cyrillic characters in PDF generation. The DejaVuSans.ttf font is automatically loaded from `assets/fonts/` to handle Russian text.

To use a different font:
```bash
# Replace the font file
cp /path/to/your-font.ttf assets/fonts/DejaVuSans.ttf
# Or set FONT_PATH in .env
echo "FONT_PATH=/path/to/your-font.ttf" >> .env
```

3. Fill in the form with the required data:
   - Maximum daily water consumption (м³/час)
   - Required water head (м)
   - Pump model
   - Flow meter
   - Project code

4. Click "Calculate" to see the computed values

5. Click "Generate PDF" to create and download the completed PDF document

## API Endpoints

### POST /api/templates
Uploads a PDF template, auto-detects markers, and returns a manifest

Response: `{ templateId: string, manifest: TemplateManifest }`

### GET /api/templates/:id/manifest
Returns a previously generated manifest for the template

### POST /api/generate
Generates a filled PDF using the template, request values, and auto-calculated fields

Example request body:
```json
{
  "templateId": "<sha256>",
  "values": {
    "dailyConsumption": 100.5,
    "pump_model": "Model XYZ",
    "project_code": "PROJ-123"
  },
  "options": {
    "fontSize": 10,
    "gap": 6,
    "calculationOptions": { "precision": 2 }
  }
}
```

Response: PDF file

## Calculations

The service performs the following automatic calculations:

1. Maximum hourly consumption (m³/hour): `3.9 * dailyConsumption / 24`
2. Maximum secondly consumption (l/s): `hourlyConsumption / 3.6`

Notes:
- Input `dailyConsumption` is in m³/day.
- Server formats values with units in the generated PDF: m³/сут, m³/час, л/с.

## Project Structure

```
.
├── public/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── backend/
│   ├── app.js
│   └── src/
│       ├── api/routes.js
│       ├── services/
│       ├── utils/
│       └── models/
├── assets/fonts/DejaVuSans.ttf
├── pattern1.pdf (example template)
├── package.json
└── README.md
```

## Development

To run the development server with auto-restart:
```bash
npm run dev
```

To run the production server:
```bash
npm start
```

## License

MIT
