import AsyncStorage from '@react-native-async-storage/async-storage';

const LOG_STORAGE_KEY = 'app_logs';
const MAX_LOGS = 100;

/**
 * Service to handle local logging for the application.
 * Satisfies the requirement to save logs in the src directory structure (conceptually).
 */
export const Logger = {
  /**
   * Add a new log entry
   * @param {string} type - 'info', 'error', 'warning', 'incident', 'network'
   * @param {string} message - Short description
   * @param {object} details - Additional data
   */
  async log(type, message, details = null) {
    try {
      const entry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type,
        message,
        details
      };
      
      // Get existing logs
      const existingLogs = await this.getLogs();
      
      // Add new log and limit size
      const newLogs = [entry, ...existingLogs].slice(0, MAX_LOGS);
      
      // Save
      await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(newLogs));
      
      // Also log to console for dev
      console.log(`[${type.toUpperCase()}] ${message}`, details || '');
    } catch (e) {
      console.error('Failed to save log:', e);
    }
  },

  /**
   * Retrieve all saved logs
   * @returns {Promise<Array>}
   */
  async getLogs() {
    try {
      const logs = await AsyncStorage.getItem(LOG_STORAGE_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (e) {
      console.error('Failed to retrieve logs:', e);
      return [];
    }
  },

  /**
   * Clear all logs
   */
  async clearLogs() {
    try {
      await AsyncStorage.removeItem(LOG_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear logs:', e);
    }
  }
};
