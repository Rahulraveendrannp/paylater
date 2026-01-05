# PayLater Server

Backend API for PayLater application with minimal requirements.

## Features

- User registration (no OTP required)
- QR code scanning for game and photo activities
- Single User schema with name, phone number, and game progress

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `env.example`):
```bash
cp env.example .env
```

3. Update `.env` with your configuration:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/paylater
JWT_SECRET=your-super-secret-jwt-key
```

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

The server will run on `http://localhost:3000`

## API Endpoints

### Authentication

**POST** `/api/auth/register`
- Register a new user (no OTP required)
- Body: `{ phoneNumber: string, name: string }`
- Returns: JWT token and session data

### QR Scanning

**POST** `/api/scan`
- Scan QR code for game or photo activity
- Headers: `Authorization: Bearer <token>`
- Body: `{ qrCode: string, activityType: "game" | "photo" }`
- Returns: Scan confirmation

**GET** `/api/scan/progress`
- Get user's scanning progress
- Headers: `Authorization: Bearer <token>`
- Returns: User progress data

### Health Check

**GET** `/health`
- Check if server is running

## Database Schema

### User Model
```javascript
{
  phoneNumber: String (required, unique),
  name: String (required),
  gameProgress: {
    game: {
      completed: Boolean,
      scannedQR: String,
      scannedAt: Date
    },
    photo: {
      completed: Boolean,
      scannedQR: String,
      scannedAt: Date
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Technologies

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication

