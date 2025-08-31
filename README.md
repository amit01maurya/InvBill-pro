# Inventory & Billing Management System

A full-stack application for managing inventory and billing operations.

## Project Structure

```
project/
├── frontend/          # React + TypeScript frontend
│   ├── src/          # Source code
│   ├── package.json  # Frontend dependencies
│   └── ...
├── backend/           # Node.js + Express backend
│   ├── models/       # MongoDB models
│   ├── routes/       # API routes
│   ├── middleware/   # Express middleware
│   ├── utils/        # Utility functions
│   ├── index.js      # Server entry point
│   └── package.json  # Backend dependencies
└── package.json      # Root package.json for running both
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB running locally or MongoDB Atlas connection string
- npm or yarn

## Installation

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   cd ..
   ```

   **Or use the convenience command:**
   ```bash
   npm run install:all
   ```

## Environment Setup

1. **Create a `.env` file in the backend directory:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit the `.env` file with your configuration:**
   ```
   MONGODB_URI=mongodb://localhost:27017/inventory-billing
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   ```

## Running the Application

### Development Mode (Both Frontend and Backend)

```bash
npm run dev
```

This will start both the frontend (on port 5173/5174) and backend (on port 5000) concurrently.

### Individual Services

**Frontend only:**
```bash
npm run frontend
```

**Backend only:**
```bash
npm run backend
```

### Production Build

```bash
npm run build
```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run frontend` - Start only the frontend
- `npm run backend` - Start only the backend
- `npm run build` - Build the frontend for production
- `npm run lint` - Run ESLint on the frontend
- `npm run preview` - Preview the production build
- `npm run install:all` - Install dependencies for all parts

## API Endpoints

The backend provides the following API endpoints:

- **Authentication:** `/api/auth/*`
- **Products:** `/api/products/*`
- **Invoices:** `/api/invoices/*`
- **Analytics:** `/api/analytics/*`

## Database

The application uses MongoDB. Make sure you have MongoDB running locally or update the `MONGODB_URI` in your `.env` file to point to your MongoDB instance.

## Troubleshooting

1. **Port conflicts:** If ports 5000 or 5173 are in use, the application will automatically try alternative ports.

2. **MongoDB connection:** Ensure MongoDB is running and accessible at the URI specified in your `.env` file.

3. **Dependencies:** If you encounter module not found errors, run `npm run install:all` to ensure all dependencies are installed.

