const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let incidents = [];
let wss;
const connectedDevices = new Map(); // Store active devices: id -> { info, lastSeen, socket }

const INCIDENT_IMAGE_DIR = path.join(__dirname, 'public', 'incidents');

if (!fs.existsSync(INCIDENT_IMAGE_DIR)) {
  fs.mkdirSync(INCIDENT_IMAGE_DIR, { recursive: true });
}

// Broadcast active devices list to admins
function broadcastDeviceList() {
  if (!wss) return;
  
  const devicesList = Array.from(connectedDevices.values()).map(d => ({
    id: d.info.id,
    type: d.info.type,
    name: d.info.name,
    battery: d.info.battery,
    status: d.info.status,
    lastSeen: d.lastSeen,
    location: d.info.location
  }));

  const payload = JSON.stringify({ type: 'devices_update', devices: devicesList });
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.isAdmin) {
      client.send(payload);
    }
  });
}

// Check for offline devices every 10 seconds
setInterval(() => {
  const now = Date.now();
  let changed = false;
  
  connectedDevices.forEach((device, id) => {
    if (now - device.lastSeen > 30000) { // 30 seconds timeout
      connectedDevices.delete(id);
      changed = true;
    }
  });
  
  if (changed) {
    broadcastDeviceList();
  }
}, 10000);

function buildIncidentFromPayload(payload) {
  const baseIncident = {
    id: payload.incidentId || `INC-${Date.now()}`,
    type: payload.type,
    message: payload.message,
    location: payload.location,
    timestamp: payload.timestamp || new Date().toISOString(),
    severity: payload.severity,
    receivedAt: new Date().toISOString(),
  };

  const image = payload.image;
  if (image && image.data && image.type) {
    const isPng = image.type === 'image/png';
    const extension = isPng ? 'png' : 'jpg';
    const fileName = `${baseIncident.id}.${extension}`;
    const filePath = path.join(INCIDENT_IMAGE_DIR, fileName);
    const base64Data = image.data.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    baseIncident.imagePath = `/incidents/${fileName}`;
    baseIncident.imageType = image.type;
  }

  return baseIncident;
}

function addIncident(incident) {
  incidents.unshift(incident);
  if (incidents.length > 1000) {
    incidents = incidents.slice(0, 1000);
  }
}

function broadcastIncident(incident) {
  if (!wss) return;
  const payload = JSON.stringify({ type: 'incident', incident });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

app.post('/api/incidents', (req, res) => {
  try {
    const incident = buildIncidentFromPayload(req.body);
    addIncident(incident);

    console.log('📱 Received incident:', incident);
    broadcastIncident(incident);
    
    res.json({ 
      success: true, 
      alertId: incident.id,
      message: 'تم استلام الحادث بنجاح'
    });
  } catch (error) {
    console.error('Error receiving incident:', error);
    res.status(500).json({ 
      success: false, 
      error: 'فشل في استلام الحادث' 
    });
  }
});

// Simple Auth Endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  // Mock credentials for demo
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, token: 'admin-token-' + Date.now(), role: 'admin' });
  } else if (username === 'monitor' && password === 'monitor123') {
    res.json({ success: true, token: 'monitor-token-' + Date.now(), role: 'monitor' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.get('/api/incidents', (req, res) => {
  res.json({
    success: true,
    count: incidents.length,
    incidents: incidents
  });
});

app.get('/api/devices', (req, res) => {
  const devicesList = Array.from(connectedDevices.values()).map(d => ({
    id: d.info.id,
    type: d.info.type,
    name: d.info.name,
    battery: d.info.battery,
    status: d.info.status,
    lastSeen: d.lastSeen,
    location: d.info.location
  }));
  res.json({ success: true, devices: devicesList });
});

app.get('/api/stats', (req, res) => {
  const stats = {
    total: incidents.length,
    activeDevices: connectedDevices.size,
    accidents: incidents.filter(i => i.type === 'accident').length,
    laneDepartures: incidents.filter(i => i.type === 'lane_departure').length,
    abnormalStopping: incidents.filter(i => i.type === 'abnormal_stopping').length,
    distractedDriving: incidents.filter(i => i.type === 'distracted_driving').length,
    drowsyDriving: incidents.filter(i => i.type === 'drowsy_driving').length,
    critical: incidents.filter(i => i.severity === 'critical').length,
    warning: incidents.filter(i => i.severity === 'warning').length,
  };
  
  res.json({ success: true, stats });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = http.createServer(app);

const WEBSOCKET_PATH = '/ws/incidents';

wss = new WebSocket.Server({
  server,
  path: WEBSOCKET_PATH,
});

wss.on('connection', (socket, req) => {
  // Check for admin token in protocol or query params if needed
  // For now, we rely on the 'register' message to identify role
  
  const snapshot = {
    type: 'sync',
    incidents,
  };
  socket.send(JSON.stringify(snapshot));

  socket.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'ping') {
        socket.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
        return;
      }

      // Handle Device Registration
      if (data.type === 'register') {
        const { id, role, ...info } = data.payload;
        
        if (role === 'admin' || role === 'monitor') {
          socket.isAdmin = true;
          // Send current device list to admin immediately
          const devicesList = Array.from(connectedDevices.values()).map(d => d.info);
          socket.send(JSON.stringify({ type: 'devices_update', devices: devicesList }));
        } else {
          // It's a field device (mobile app)
          connectedDevices.set(id, {
            info: { id, ...info, status: 'online' },
            lastSeen: Date.now(),
            socket: socket
          });
          broadcastDeviceList();
        }
        return;
      }

      // Handle Heartbeat/Status Update
      if (data.type === 'heartbeat') {
        const { id, ...statusInfo } = data.payload;
        if (connectedDevices.has(id)) {
          const device = connectedDevices.get(id);
          device.lastSeen = Date.now();
          device.info = { ...device.info, ...statusInfo, status: 'online' };
          broadcastDeviceList();
        }
        return;
      }

      if (data.type === 'incident') {
        const payload = data.payload || data;
        const incident = buildIncidentFromPayload(payload);
        addIncident(incident);
        broadcastIncident(incident);
        socket.send(JSON.stringify({ type: 'ack', incidentId: incident.id }));
        return;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      try {
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      } catch (e) {}
    }
  });

  socket.on('close', () => {
    // If it was a device, remove it
    let removedId = null;
    connectedDevices.forEach((device, id) => {
      if (device.socket === socket) {
        removedId = id;
      }
    });

    if (removedId) {
      connectedDevices.delete(removedId);
      broadcastDeviceList();
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}`);
  console.log(`🔌 WebSocket endpoint ws://localhost:${PORT}${WEBSOCKET_PATH}`);
});

