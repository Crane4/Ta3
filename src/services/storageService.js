import AsyncStorage from '@react-native-async-storage/async-storage';

const INCIDENTS_KEY = 'samer_incidents';
const SETTINGS_KEY = 'samer_settings';

// Save incident to storage
export const saveIncident = async (incident) => {
  try {
    const incidents = await getIncidents();
    incidents.push(incident);
    
    // Keep only last 1000 incidents
    if (incidents.length > 1000) {
      incidents.shift();
    }
    
    await AsyncStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents));
    return true;
  } catch (error) {
    console.error('Error saving incident:', error);
    return false;
  }
};

// Get all incidents
export const getIncidents = async () => {
  try {
    const incidentsJson = await AsyncStorage.getItem(INCIDENTS_KEY);
    return incidentsJson ? JSON.parse(incidentsJson) : [];
  } catch (error) {
    console.error('Error getting incidents:', error);
    return [];
  }
};

// Get incidents by type
export const getIncidentsByType = async (type) => {
  try {
    const incidents = await getIncidents();
    return incidents.filter(incident => incident.type === type);
  } catch (error) {
    console.error('Error getting incidents by type:', error);
    return [];
  }
};

// Get incidents by date range
export const getIncidentsByDateRange = async (startDate, endDate) => {
  try {
    const incidents = await getIncidents();
    return incidents.filter(incident => {
      const incidentDate = new Date(incident.timestamp);
      return incidentDate >= startDate && incidentDate <= endDate;
    });
  } catch (error) {
    console.error('Error getting incidents by date range:', error);
    return [];
  }
};

// Get today's incidents
export const getTodayIncidents = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return await getIncidentsByDateRange(today, tomorrow);
  } catch (error) {
    console.error('Error getting today incidents:', error);
    return [];
  }
};

// Get incidents by location (within radius)
export const getIncidentsByLocation = async (latitude, longitude, radiusKm = 5) => {
  try {
    const incidents = await getIncidents();
    
    return incidents.filter(incident => {
      if (!incident.location) return false;
      
      const distance = calculateDistance(
        latitude,
        longitude,
        incident.location.latitude,
        incident.location.longitude
      );
      
      return distance <= radiusKm;
    });
  } catch (error) {
    console.error('Error getting incidents by location:', error);
    return [];
  }
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Delete incident
export const deleteIncident = async (incidentId) => {
  try {
    const incidents = await getIncidents();
    const filtered = incidents.filter(incident => incident.id !== incidentId);
    await AsyncStorage.setItem(INCIDENTS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting incident:', error);
    return false;
  }
};

// Clear all incidents
export const clearAllIncidents = async () => {
  try {
    await AsyncStorage.removeItem(INCIDENTS_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing incidents:', error);
    return false;
  }
};

// Save settings
export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

// Get settings
export const getSettings = async () => {
  try {
    const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
    return settingsJson ? JSON.parse(settingsJson) : {
      emergencyContact: '911',
      autoSendAlerts: true,
      detectionSensitivity: 'medium',
      enableNotifications: true,
      backendUrl: 'http://172.20.10.2:3000',
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      emergencyContact: '911',
      autoSendAlerts: true,
      detectionSensitivity: 'medium',
      enableNotifications: true,
      backendUrl: 'http://172.20.10.2:3000',
    };
  }
};

