import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Logger } from './loggerService';

let socket = null;
let isConnected = false;
let reconnectTimer = null;
let heartbeatInterval = null;
let listeners = [];
let deviceId = null;

const getDeviceId = async () => {
  if (deviceId) return deviceId;
  let id = await AsyncStorage.getItem('device_id');
  if (!id) {
    id = 'UNIT-' + Math.floor(1000 + Math.random() * 9000); // e.g. UNIT-1234
    await AsyncStorage.setItem('device_id', id);
  }
  deviceId = id;
  return id;
};

const startHeartbeat = async (id) => {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  
  heartbeatInterval = setInterval(async () => {
    if (socket && isConnected) {
      try {
        // Try to get current location for live tracking
        // We use lastKnownPosition for speed, or basic getCurrentPosition
        let location = null;
        try {
           const loc = await Location.getLastKnownPositionAsync({});
           if (loc) {
             location = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
           }
        } catch (e) {}

        socket.send(JSON.stringify({
          type: 'heartbeat',
          payload: {
            id,
            battery: 85, // Mock battery for now
            location
          }
        }));
      } catch (e) {
        console.log('Heartbeat error:', e.message);
      }
    }
  }, 5000);
};

export const initSocket = async () => {
  try {
    const backendUrl = await AsyncStorage.getItem('backendUrl');
    let url = backendUrl || 'http://172.20.10.2:3000';
    
    // Ensure protocol exists
    if (!url.match(/^https?:\/\//)) {
      url = 'http://' + url;
    }
    
    // Replace http/https with ws/wss
    // Also handle localhost on Android emulator if needed (10.0.2.2), but user should set IP in settings
    const wsUrl = url.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws/incidents';
    
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    Logger.log('network', 'Connecting to WebSocket', { url: wsUrl });
    
    if (socket) {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        console.log('🔌 WebSocket already connected or connecting');
        return; 
      }
      try {
        socket.close();
      } catch (e) {}
    }

    socket = new WebSocket(wsUrl);

    socket.onopen = async () => {
      console.log('✅ WebSocket Connected to:', wsUrl);
      Logger.log('network', 'WebSocket Connected');
      isConnected = true;
      notifyListeners('connected');
      
      // Register Device
      const id = await getDeviceId();
      const registerPayload = {
        type: 'register',
        payload: {
          id,
          type: 'mobile',
          name: `دورية ${id}`,
          battery: 100
        }
      };
      socket.send(JSON.stringify(registerPayload));
      startHeartbeat(id);
    };

    socket.onclose = (e) => {
      console.log(`❌ WebSocket Disconnected from ${wsUrl}:`, e.reason);
      Logger.log('network', 'WebSocket Disconnected', { reason: e.reason });
      isConnected = false;
      notifyListeners('disconnected');
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      
      // Try to reconnect in 5 seconds
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(initSocket, 5000);
    };

    socket.onerror = (error) => {
      console.log(`⚠️ WebSocket Error (${wsUrl}):`, error.message);
      Logger.log('error', 'WebSocket Error', { message: error.message });
      // Connection failure often doesn't give details in RN, but onclose will trigger
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Handle incoming messages if needed (e.g. sync, new incidents from others)
        console.log('📩 WS Message:', data.type);
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };

  } catch (error) {
    console.error('Error initializing WebSocket:', error);
    Logger.log('error', 'Error initializing WebSocket', { error: error.message });
  }
};

export const sendIncidentViaWS = (incident) => {
  if (!socket || !isConnected) {
    console.warn('⚠️ WebSocket not connected, cannot send incident via WS');
    Logger.log('warning', 'Cannot send incident: WS disconnected');
    return false;
  }

  try {
    const payload = {
      type: 'incident',
      payload: incident
    };
    socket.send(JSON.stringify(payload));
    console.log('🚀 Incident sent via WebSocket');
    Logger.log('incident', 'Incident sent via WS', { type: incident.type });
    return true;
  } catch (error) {
    console.error('Error sending via WebSocket:', error);
    Logger.log('error', 'Error sending incident via WS', { error: error.message });
    return false;
  }
};

export const isSocketConnected = () => isConnected;

export const addSocketListener = (listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

const notifyListeners = (status) => {
  listeners.forEach(listener => listener(status));
};
