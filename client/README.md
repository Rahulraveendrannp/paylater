# PayLater Application

A QR code scanning application similar to Scavenger, featuring a simplified 3-page flow.

## Features

1. **Landing Page** - Initial page with PayLater branding and "STEP INTO THE ACTION" call-to-action
2. **Registration Page** - User registration with Name and Phone number (no OTP required)
3. **Dashboard/Scanning Page** - Activity selection with two options:
   - GAME: Finish Line Frenzy
   - PHOTO: Your Marathon Moment

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The application will run on `http://localhost:5174`

## Environment Variables

Create a `.env` file in the `paylater/client` directory:

```
VITE_API_BASE=http://localhost:3000/api
```

## Project Structure

```
paylater/client/
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx       # Initial landing page
│   │   ├── RegistrationPage.tsx  # Registration (no OTP)
│   │   ├── Dashboard.tsx         # Activity selection & scanning
│   │   └── SimpleQRScanner.tsx   # QR code scanner component
│   ├── api.ts                    # API service
│   ├── types.ts                  # TypeScript types
│   ├── App.tsx                   # Main app with routing
│   └── main.tsx                  # Entry point
├── package.json
└── vite.config.ts
```

## API Endpoints

The application expects the following API endpoints:

- `POST /api/auth/register` - Register user (returns token, no OTP)
- `POST /api/scan` - Scan QR code for activity

## Technologies

- React 19
- TypeScript
- Vite
- Tailwind CSS
- jsQR (QR code scanning)
- React Router

## Notes

- Uses the same QR scanning setup as Scavenger application
- No OTP verification required
- Simple 3-page flow
- Dark purple (#4A148C) and teal (#14B8A6) color scheme

