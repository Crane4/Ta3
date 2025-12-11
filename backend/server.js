const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store incidents in memory (in production, use a database)
let incidents = [];

// API endpoint to receive incidents from the app
app.post('/api/incidents', (req, res) => {
  try {
    const incident = {
      id: req.body.incidentId || `INC-${Date.now()}`,
      type: req.body.type,
      message: req.body.message,
      location: req.body.location,
      timestamp: req.body.timestamp || new Date().toISOString(),
      severity: req.body.severity,
      receivedAt: new Date().toISOString(),
    };

    incidents.unshift(incident); // Add to beginning of array
    
    // Keep only last 1000 incidents
    if (incidents.length > 1000) {
      incidents = incidents.slice(0, 1000);
    }

    console.log('📱 Received incident:', incident);
    
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

// API endpoint to get all incidents
app.get('/api/incidents', (req, res) => {
  res.json({
    success: true,
    count: incidents.length,
    incidents: incidents
  });
});

// API endpoint to get incident statistics
app.get('/api/stats', (req, res) => {
  const stats = {
    total: incidents.length,
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

// Serve the dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}`);
});

