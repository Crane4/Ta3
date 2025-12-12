import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendIncidentViaWS, isSocketConnected, initSocket } from './socketService';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request notification permissions
export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};

// Send emergency alert to authorities
export const sendEmergencyAlert = async (incident) => {
  try {
    // Request permissions if not already granted
    await requestNotificationPermissions();

    // Get emergency contact from settings
    const emergencyContact = await AsyncStorage.getItem('emergencyContact');
    const emergencyPhone = emergencyContact || '911'; // Default to 911

    // Prepare alert data
    const alertData = {
      incidentId: incident.id,
      type: incident.type,
      message: incident.message,
      location: incident.location,
      timestamp: incident.timestamp,
      severity: incident.severity,
      image: incident.image, // Include image if available
    };

    // Send local notification (this works for real)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 تم إرسال تنبيه طوارئ',
        body: `تم اكتشاف: ${incident.message}`,
        data: alertData,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null, // Send immediately
    });

    // Ensure socket is initialized (idempotent)
    if (!isSocketConnected()) {
      initSocket();
    }

    // Try sending via WebSocket first (faster, real-time)
    let wsSent = false;
    if (isSocketConnected()) {
      wsSent = sendIncidentViaWS(alertData);
    }

    // Also send via HTTP API as backup/confirmation (or if WS failed)
    // The backend handles deduplication or broadcasting regardless of source
    const apiResult = await sendToEmergencyAPI(alertData);

    // Log alert
    await logAlert(alertData);

    // Return result
    return {
      success: wsSent || (apiResult.success !== false),
      localNotification: true,
      backendSent: wsSent || (apiResult.success !== false),
      wsSent: wsSent,
      httpSent: apiResult.success !== false,
      error: apiResult.error,
    };
  } catch (error) {
    console.error('Error sending emergency alert:', error);
    // Don't throw - return error info instead
    return {
      success: false,
      localNotification: false,
      backendSent: false,
      error: error.message,
    };
  }
};

// Send alert to emergency services API
const sendToEmergencyAPI = async (alertData) => {
  try {
    // Get backend URL from settings
    const backendUrl = await AsyncStorage.getItem('backendUrl');
    let apiUrl = backendUrl || 'http://172.20.10.4:3000'; // Default to localhost
    
    // Check if using localhost on mobile device (won't work)
    if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
      console.warn('⚠️ Warning: localhost/127.0.0.1 does not work on mobile devices.');
      console.warn('Please use your computer\'s IP address (e.g., http://192.168.1.100:3000)');
      console.warn('You can set this in Settings > Backend URL');
      // Don't throw error, just log warning and return gracefully
      return { 
        success: false, 
        error: 'Backend URL is set to localhost. Please use your computer\'s IP address on mobile devices.',
        alertId: `ALERT-${Date.now()}` 
      };
    }
    
    // Construct full API endpoint
    const endpoint = `${apiUrl}/api/incidents`;
    
    console.log('Sending to backend API:', endpoint);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        incidentId: alertData.incidentId,
        type: alertData.type,
        message: alertData.message,
        location: alertData.location,
        timestamp: alertData.timestamp,
        severity: alertData.severity,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send alert: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Backend response:', result);
    
    return result;
  } catch (error) {
    // Handle different error types
    let errorMessage = error.message;
    
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout - Backend server may be unreachable';
    } else if (error.message.includes('Network request failed')) {
      errorMessage = 'Network error - Check your internet connection and backend URL';
    } else if (error.message.includes('Failed to connect')) {
      errorMessage = 'Cannot connect to backend server - Make sure it is running';
    }
    
    console.error('❌ API Error:', errorMessage);
    console.error('Full error:', error);
    
    // Fallback: Log error but don't block the app
    // The incident is still saved locally, just not sent to backend
    return { 
      success: false, 
      error: errorMessage,
      alertId: `ALERT-${Date.now()}` 
    };
  }
};

// Send SMS alert as fallback
const sendSMSAlert = async (alertData) => {
  // In production, use SMS gateway service
  // Example: Twilio, AWS SNS, etc.
  console.log('Sending SMS alert:', alertData);
};

// Log alert for tracking
const logAlert = async (alertData) => {
  try {
    const alerts = await AsyncStorage.getItem('sentAlerts');
    const alertsArray = alerts ? JSON.parse(alerts) : [];
    
    alertsArray.push({
      ...alertData,
      sentAt: new Date().toISOString(),
    });
    
    // Keep only last 100 alerts
    if (alertsArray.length > 100) {
      alertsArray.shift();
    }
    
    await AsyncStorage.setItem('sentAlerts', JSON.stringify(alertsArray));
  } catch (error) {
    console.error('Error logging alert:', error);
  }
};

// Get alert history
export const getAlertHistory = async () => {
  try {
    const alerts = await AsyncStorage.getItem('sentAlerts');
    return alerts ? JSON.parse(alerts) : [];
  } catch (error) {
    console.error('Error getting alert history:', error);
    return [];
  }
};

// Test notification
export const sendTestNotification = async () => {
  await requestNotificationPermissions();
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'SAMER Test Alert',
      body: 'This is a test notification from SAMER',
      sound: true,
    },
    trigger: null,
  });
};

