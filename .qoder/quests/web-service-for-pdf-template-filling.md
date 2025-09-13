# Web Service for PDF Template Filling

## 1. Overview

This document describes the design of a web service that accepts user input through a web form, performs calculations, and fills a PDF template with the results. The service will allow users to:
- Enter water consumption data
- Perform automatic calculations
- Generate a filled PDF document based on a template
- Download the completed PDF

## 2. Architecture

The solution will be a full-stack web application with:
- Frontend: HTML/CSS/JavaScript interface for data input and result display
- Backend: Node.js server with Express framework to handle form submissions and PDF generation
- PDF Processing: PDF-lib library for template filling
- Deployment: Simple local server setup for development and testing

Flow of data from user input through PDF generation and download

## 3. Frontend Component Architecture

### 3.1 Component Definition

The frontend will consist of a single page with the following components:
- Data input form with fields for all required parameters
- Calculation display area showing computed values
- PDF preview section (optional)
- Download button for the completed PDF

### 3.2 Component Hierarchy

Hierarchical structure showing the main application components and their relationships

### 3.3 State Management

The frontend will maintain the following state:
- User input values
- Calculated results
- PDF generation status

### 3.4 Example Component Usage

The frontend will include a form with the following fields:
- Daily water consumption (максимальный суточный расход воды м3/час)
- Required water head (требуемый напор воды м)
- Pump model (установленный насос марка)
- Flow meter (расходомер-счётчик)
- Project code (шифр проекта)

With buttons to calculate values and generate the PDF.

## 4. Backend Architecture

### 4.1 API Endpoints

#### POST /generate-pdf
- **Description**: Accepts form data, performs calculations, and generates a filled PDF
- **Request Body**: Contains all input fields from the form
- **Response**: Generated PDF file for download

### 4.2 Data Models

No persistent data storage is required. All processing is done in memory.

### 4.3 Business Logic Layer

#### Calculations:
1. Maximum hourly consumption: 3.9 * dailyConsumption / 24
2. Maximum secondly consumption: hourlyConsumption / 3.6

#### PDF Template Filling Logic:
- Map form fields to template markers:
  - msr: → Maximum daily consumption value
  - n: → Pump model value
  - sh: → Project code value
  - mchr: → Maximum hourly consumption value
  - msr: → Maximum secondly consumption value (different instance)

### 4.4 Middleware
- Body parser for JSON requests
- Static file serving for frontend assets
- Error handling middleware

## 5. PDF Processing

### 5.1 Template Markers
The PDF template contains markers that will be replaced with actual values:
- msr: - Maximum daily water consumption (м3/час)
- n: - Installed pump model
- sh: - Project code
- mchr: - Maximum hourly consumption
- msr: - Maximum secondly consumption (л/сек)

### 5.2 PDF Library
Using PDF-lib for PDF manipulation:
- Load template PDF
- Find and replace markers with values
- Generate downloadable PDF

## 6. Technology Stack

### Frontend:
- HTML5
- CSS3
- Vanilla JavaScript (no frameworks for simplicity)
- Fetch API for backend communication

### Backend:
- Node.js
- Express.js
- PDF-lib for PDF processing
- Nodemon for development

## 7. Implementation Plan

### Phase 1: Basic Structure
- Set up project directory structure
- Create package.json with dependencies
- Implement basic Express server

### Phase 2: PDF Processing
- Implement PDF template loading
- Create marker replacement functionality
- Add calculation logic

### Phase 3: Frontend Interface
- Create HTML form with all required fields
- Implement JavaScript for form handling
- Add result display and download functionality

### Phase 4: Integration and Testing
- Connect frontend to backend
- Test PDF generation with sample data
- Verify calculations are correct

## 8. Deployment and Running

### Local Development Setup:
1. Install Node.js (version 14 or higher)
2. Install project dependencies: npm install
3. Run development server: npm run dev
4. Access application at http://localhost:3000

### Production Deployment:
- Can be deployed to any Node.js hosting platform
- Environment variables for configuration
- Process manager like PM2 for production

## 9. Security Considerations

- Input validation for all form fields
- File upload restrictions (only template is used, no uploads)
- CORS configuration for frontend-backend communication
- Rate limiting to prevent abuse

## 10. Testing Strategy

### Unit Tests:
- Calculation functions
- PDF marker replacement logic
- Form validation

### Integration Tests:
- End-to-end PDF generation workflow
- Frontend-backend communication

### Manual Testing:
- Visual verification of generated PDF
- Calculation accuracy verification
- Cross-browser compatibility

## 11. Future Enhancements

- User authentication for multiple projects
- Template management system
- Multi-language support
- Email delivery of generated PDFs
- Database storage of generated documents