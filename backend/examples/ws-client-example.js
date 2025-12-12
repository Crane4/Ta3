const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Connect to local backend
const WS_URL = 'ws://localhost:3000/ws/incidents';

console.log(`Connecting to ${WS_URL}...`);
const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ Connected to WebSocket server');

  // Create a test incident with image
  const incident = {
    type: 'incident',
    payload: {
      incidentId: `TEST-${Date.now()}`,
      type: 'accident',
      message: 'تجربة اتصال ويب سوكت مع صورة',
      location: {
        latitude: 24.7136,
        longitude: 46.6753
      },
      timestamp: new Date().toISOString(),
      severity: 'critical',
      image: {
        type: 'image/png',
        // 1x1 Red pixel
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
      }
    }
  };

  console.log('Sending incident:', incident.payload.incidentId);
  ws.send(JSON.stringify(incident));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('📩 Received message:', message);

  if (message.type === 'ack' || message.type === 'incident') {
    console.log('✅ Test successful!');
    ws.close();
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

ws.on('close', () => {
  console.log('Disconnected');
});
