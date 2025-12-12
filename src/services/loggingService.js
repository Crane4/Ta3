import AsyncStorage from '@react-native-async-storage/async-storage';

const LOGS_KEY = 'samer_logs';
const MAX_LOGS = 200; // Keep last 200 logs

// Log levels
export const LogLevel = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
  CRITICAL: 'critical',
};

// Add log entry
export const addLog = async (level, message, data = null) => {
  try {
    const logEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    const logs = await getLogs();
    logs.unshift(logEntry); // Add to beginning

    // Keep only last MAX_LOGS
    if (logs.length > MAX_LOGS) {
      logs.pop();
    }

    await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    
    // Also log to console for debugging
    const emoji = getLogEmoji(level);
    console.log(`${emoji} [${level.toUpperCase()}] ${message}`, data || '');
    
    return logEntry;
  } catch (error) {
    console.error('Error adding log:', error);
  }
};

// Get all logs
export const getLogs = async () => {
  try {
    const logsJson = await AsyncStorage.getItem(LOGS_KEY);
    return logsJson ? JSON.parse(logsJson) : [];
  } catch (error) {
    console.error('Error getting logs:', error);
    return [];
  }
};

// Get logs by level
export const getLogsByLevel = async (level) => {
  try {
    const logs = await getLogs();
    return logs.filter(log => log.level === level);
  } catch (error) {
    console.error('Error getting logs by level:', error);
    return [];
  }
};

// Get recent logs (last N)
export const getRecentLogs = async (count = 50) => {
  try {
    const logs = await getLogs();
    return logs.slice(0, count);
  } catch (error) {
    console.error('Error getting recent logs:', error);
    return [];
  }
};

// Clear all logs
export const clearLogs = async () => {
  try {
    await AsyncStorage.removeItem(LOGS_KEY);
    await addLog(LogLevel.INFO, 'تم مسح جميع السجلات');
    return true;
  } catch (error) {
    console.error('Error clearing logs:', error);
    return false;
  }
};

// Helper functions
const getLogEmoji = (level) => {
  switch (level) {
    case LogLevel.INFO: return 'ℹ️';
    case LogLevel.WARNING: return '⚠️';
    case LogLevel.ERROR: return '❌';
    case LogLevel.SUCCESS: return '✅';
    case LogLevel.CRITICAL: return '🚨';
    default: return '📝';
  }
};

// Convenience functions
export const logInfo = (message, data) => addLog(LogLevel.INFO, message, data);
export const logWarning = (message, data) => addLog(LogLevel.WARNING, message, data);
export const logError = (message, data) => addLog(LogLevel.ERROR, message, data);
export const logSuccess = (message, data) => addLog(LogLevel.SUCCESS, message, data);
export const logCritical = (message, data) => addLog(LogLevel.CRITICAL, message, data);

