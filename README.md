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
- PDF-lib for PDF processing

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. Fill in the form with the required data:
   - Maximum daily water consumption (м³/час)
   - Required water head (м)
   - Pump model
   - Flow meter
   - Project code

4. Click "Calculate" to see the computed values

5. Click "Generate PDF" to create and download the completed PDF document

## API Endpoints

### POST /generate-pdf
Generates a PDF document with the provided data

**Request Body:**
```json
{
  "dailyConsumption": "100.5",
  "requiredHead": "25.0",
  "pumpModel": "Model XYZ",
  "flowMeter": "Meter ABC",
  "projectCode": "PROJ-123"
}
```

**Response:**
A PDF file with the completed form

## Calculations

The service performs the following automatic calculations:

1. Maximum hourly consumption: `3.9 * dailyConsumption / 24`
2. Maximum secondly consumption: `hourlyConsumption / 3.6`

## Project Structure

```
.
├── public/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── pattern1.pdf (template)
├── server.js
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