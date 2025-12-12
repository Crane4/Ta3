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

## Features

- **Real-time Incident Tracking**: Receive incidents via WebSocket or HTTP.
- **Admin Dashboard**: Professional Vue.js-based dashboard with:
  - Interactive Map (Leaflet.js)
  - Real-time Statistics
  - Active Device Tracking
  - Incident Management
- **Device Management**: Track connected devices, battery status, and location.
- **Secure Authentication**: Mock authentication for demonstration (admin/admin123).

## Dashboard

Access the dashboard at `http://localhost:3000`.

**Credentials:**
- Username: `admin`
- Password: `admin123`

### Dashboard Sections
1. **Overview**: Key statistics and map view.
2. **Incidents**: List of all reported incidents with filtering.
3. **Active Units**: Real-time list of connected devices (mobile units) with battery and location status.

## API Endpoints

### POST /api/incidents
Receive an incident from the mobile app.

**Request Body:**
```json
{
  "incidentId": "INC-1234567890",
  "type": "accident",
  "message": "Traffic accident detected",
  "location": {
    "latitude": 24.7136,
    "longitude": 46.6753
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "severity": "critical"
}
```

### POST /api/auth/login
Admin login endpoint.

### GET /api/devices
Get list of currently active devices.

## WebSocket API

The server provides a WebSocket endpoint for real-time bidirectional communication.

**URL:** `ws://localhost:3000/ws/incidents`

### Device Registration & Tracking

#### Client -> Server: Register Device
Sent upon connection to identify the device.
```json
{
  "type": "register",
  "payload": {
    "id": "UNIT-1234",
    "type": "mobile",
    "name": "Patrol 1234",
    "battery": 95
  }
}
```

#### Client -> Server: Heartbeat
Sent every 5 seconds to update status.
```json
{
  "type": "heartbeat",
  "payload": {
    "id": "UNIT-1234",
    "battery": 94,
    "location": { "latitude": 24.7, "longitude": 46.7 }
  }
}
```

#### Client -> Server: Send Incident
```json
{
  "type": "incident",
  "payload": {
    "incidentId": "INC-123",
    "type": "accident",
    "message": "Accident detected",
    "location": { ... },
    "image": { "type": "image/jpeg", "data": "base64..." }
  }
}
```

## Logs
The mobile app maintains local logs of network activity and incidents in `src/services/loggerService.js`, stored via AsyncStorage.
