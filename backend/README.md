# SAMER Backend Server

Backend server for receiving and displaying incidents from the SAMER mobile app.

## Installation

```bash
cd backend
npm install
```

## Running the Server

```bash
npm start
```

The server will run on `http://localhost:3000`

## API Endpoints

### POST /api/incidents
Receive an incident from the mobile app.

**Request Body:**
```json
{
  "incidentId": "INC-1234567890",
  "type": "accident",
  "message": "تم اكتشاف حادث مروري",
  "location": {
    "latitude": 24.7136,
    "longitude": 46.6753
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "severity": "critical"
}
```

### GET /api/incidents
Get all received incidents.

### GET /api/stats
Get statistics about incidents.

## Dashboard

Access the dashboard at `http://localhost:3000` to view all received incidents in real-time.

