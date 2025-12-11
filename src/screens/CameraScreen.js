import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { detectAccident, detectDangerousBehavior } from '../services/visionService';
import { sendEmergencyAlert } from '../services/alertService';
import { saveIncident } from '../services/storageService';
import { logInfo, logWarning, logCritical, logSuccess, logError, getRecentLogs } from '../services/loggingService';

const { width, height } = Dimensions.get('window');


export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState('جاهز');
  const [incidentCount, setIncidentCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [logs, setLogs] = useState([]);
  const [cameraKey, setCameraKey] = useState(0); // Key to force camera remount
  const [detectedVehicles, setDetectedVehicles] = useState([]); // Store detected vehicles with problems
  const [logsVisible, setLogsVisible] = useState(true); // Toggle logs visibility
  const cameraRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(Date.now());
  const processingRef = useRef(false);
  const lastIncidentTimeRef = useRef(0);
  const incidentCooldownRef = useRef(5000); // 5 seconds cooldown between incidents
  const vehicleTrackingRef = useRef(new Map()); // Track vehicle movements

  useEffect(() => {
    requestLocationPermission();
    loadLogs();
    const logInterval = setInterval(loadLogs, 2000); // Update logs every 2 seconds
    return () => {
      setIsMonitoring(false);
      clearInterval(logInterval);
    };
  }, []);

  // Ensure camera is ready when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Request camera permission when screen is focused
      if (!permission?.granted) {
        requestPermission();
      }
      
      // Reset monitoring state when screen is focused
      setIsMonitoring(false);
      setDetectionStatus('جاهز');
      
      // Force camera remount by changing key
      setCameraKey(prev => prev + 1);
      
      return () => {
        // Cleanup when screen loses focus
        setIsMonitoring(false);
        setDetectionStatus('جاهز');
        processingRef.current = false;
      };
    }, [permission])
  );

  const loadLogs = async () => {
    const recentLogs = await getRecentLogs(10);
    setLogs(recentLogs);
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
  };

  // Convert vehicle position from percentage to pixels and create vehicle box
  const createVehicleBox = (vehicleData, severity, type = null, isMoving = true) => {
    // Convert percentage positions to pixel positions
    const zoneWidth = width * 0.75;
    const zoneHeight = height * 0.35;
    const zoneCenterX = width / 2;
    const zoneCenterY = height / 2;
    const zoneStartX = zoneCenterX - zoneWidth / 2;
    const zoneStartY = zoneCenterY - zoneHeight / 2;
    
    // Convert percentage to pixels
    const boxWidth = vehicleData.width * width;
    const boxHeight = vehicleData.height * height;
    const x = vehicleData.x * width - boxWidth / 2; // Center the box on the position
    const y = vehicleData.y * height - boxHeight / 2;
    
    // Ensure box is within zone bounds
    const clampedX = Math.max(zoneStartX, Math.min(zoneStartX + zoneWidth - boxWidth, x));
    const clampedY = Math.max(zoneStartY, Math.min(zoneStartY + zoneHeight - boxHeight, y));
    
    // Only add velocity if vehicle is moving
    let velocityX = 0;
    let velocityY = 0;
    if (isMoving) {
      // Realistic movement - vehicles typically move horizontally more than vertically
      velocityX = (Math.random() - 0.2) * 5; // -1 to 4 pixels per frame (more forward movement)
      velocityY = (Math.random() - 0.5) * 1.5; // -0.75 to 0.75 pixels per frame (less vertical)
    }
    
    const vehicleId = Date.now() + Math.random();
    
    return {
      id: vehicleId,
      x: clampedX,
      y: clampedY,
      width: boxWidth,
      height: boxHeight,
      severity, // 'critical' or 'warning'
      type,
      timestamp: Date.now(),
      lastUpdate: Date.now(),
      velocityX,
      velocityY,
      isMoving, // Track if vehicle is moving
      hasDisappeared: false, // Track if vehicle has disappeared (won't come back)
    };
  };


  const startMonitoring = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('إذن مطلوب', 'إذن الكاميرا مطلوب لكشف الحوادث.');
        return;
      }
    }

    if (!locationPermission) {
      await requestLocationPermission();
      if (!locationPermission) {
        Alert.alert('إذن مطلوب', 'إذن الموقع مطلوب لإرسال تنبيهات الطوارئ.');
        return;
      }
    }

    setIsMonitoring(true);
    setDetectionStatus('المراقبة نشطة');
    await logInfo('تم بدء المراقبة', { timestamp: new Date().toISOString() });
  };

  const stopMonitoring = async () => {
    setIsMonitoring(false);
    setDetectionStatus('تم إيقاف المراقبة');
    setDetectedVehicles([]); // Clear all vehicle boxes when stopping
    await logInfo('تم إيقاف المراقبة', { timestamp: new Date().toISOString() });
  };

  // Update vehicle positions (movement tracking) - only moves if vehicle is actually moving
  useEffect(() => {
    if (!isMonitoring) return;

    const updateInterval = setInterval(() => {
      setDetectedVehicles(prev => {
        const zoneWidth = width * 0.75;
        const zoneHeight = height * 0.35;
        const zoneCenterX = width / 2;
        const zoneCenterY = height / 2;
        const zoneStartX = zoneCenterX - zoneWidth / 2;
        const zoneStartY = zoneCenterY - zoneHeight / 2;
        const zoneEndX = zoneStartX + zoneWidth;
        const zoneEndY = zoneStartY + zoneHeight;

        return prev.map(vehicle => {
          // If vehicle has already disappeared, don't bring it back
          if (vehicle.hasDisappeared) {
            return null;
          }

          // Only update position if vehicle is moving
          let newX = vehicle.x;
          let newY = vehicle.y;
          let newVelocityX = vehicle.velocityX;
          let newVelocityY = vehicle.velocityY;

          if (vehicle.isMoving && (Math.abs(vehicle.velocityX) > 0.1 || Math.abs(vehicle.velocityY) > 0.1)) {
            // Update position based on velocity
            newX = vehicle.x + vehicle.velocityX;
            newY = vehicle.y + vehicle.velocityY;

            // If vehicle goes out of bounds, mark as disappeared and remove it
            if (newX < zoneStartX - vehicle.width || newX > zoneEndX + vehicle.width ||
                newY < zoneStartY - vehicle.height || newY > zoneEndY + vehicle.height) {
              return null; // Vehicle left the frame, remove it permanently
            }

            // Adjust if hitting boundaries (but don't bounce - just stop or slow down)
            if (newX < zoneStartX) {
              newVelocityX = 0; // Stop at boundary
              newX = zoneStartX;
            } else if (newX + vehicle.width > zoneEndX) {
              newVelocityX = 0;
              newX = zoneEndX - vehicle.width;
            }
            
            if (newY < zoneStartY) {
              newVelocityY = 0;
              newY = zoneStartY;
            } else if (newY + vehicle.height > zoneEndY) {
              newVelocityY = 0;
              newY = zoneEndY - vehicle.height;
            }
          }
          // If vehicle is not moving, keep it in place (don't update position)

          // Check if vehicle should disappear (timeout or detection lost)
          const timeSinceDetection = Date.now() - vehicle.timestamp;
          const maxVisibleTime = vehicle.severity === 'critical' ? 6000 : 5000;
          
          // If vehicle has been visible for too long, remove it
          if (timeSinceDetection > maxVisibleTime) {
            return null; // Remove vehicle after timeout
          }

          return {
            ...vehicle,
            x: newX,
            y: newY,
            lastUpdate: Date.now(),
            velocityX: newVelocityX,
            velocityY: newVelocityY,
          };
        }).filter(v => v !== null); // Remove null vehicles
      });
    }, 50); // Update every 50ms for smooth movement

    return () => clearInterval(updateInterval);
  }, [isMonitoring]);

  useEffect(() => {
    let intervalId = null;

    if (isMonitoring && cameraRef.current && permission?.granted) {
      // Process frames periodically
      intervalId = setInterval(async () => {
        if (processingRef.current) return;
        if (!cameraRef.current) return; // Check if camera is still mounted

        frameCountRef.current++;
        const now = Date.now();
        if (now - lastFrameTimeRef.current >= 1000) {
          setFps(frameCountRef.current);
          frameCountRef.current = 0;
          lastFrameTimeRef.current = now;
        }

        processingRef.current = true;

        try {
          // Take a photo for analysis (simulated frame capture)
          // In production, this would capture actual video frames
          const frameData = {
            timestamp: Date.now(),
            // Simulated frame data - in production, this would be actual image data
          };

          // Smart detection with cooldown to avoid spam
          const now = Date.now();
          const timeSinceLastIncident = now - lastIncidentTimeRef.current;
          
          if (timeSinceLastIncident < incidentCooldownRef.current) {
            processingRef.current = false;
            return; // Skip detection during cooldown
          }

          // Detect accidents (higher priority)
          const accidentResult = await detectAccident(frameData);
          if (accidentResult.detected && accidentResult.vehicle) {
            // Only add vehicle box if we have a valid vehicle position
            const vehicleBox = createVehicleBox(
              accidentResult.vehicle,
              'critical',
              'accident',
              accidentResult.isMoving
            );
            setDetectedVehicles(prev => {
              // Don't add duplicate vehicles (check if similar position already exists)
              const isDuplicate = prev.some(v => 
                Math.abs(v.x - vehicleBox.x) < 50 && 
                Math.abs(v.y - vehicleBox.y) < 50 &&
                v.severity === 'critical'
              );
              return isDuplicate ? prev : [...prev, vehicleBox];
            });
            
            await handleIncident('accident', 'تم اكتشاف حادث مروري');
            lastIncidentTimeRef.current = now;
            incidentCooldownRef.current = 10000; // 10 seconds cooldown for accidents
            processingRef.current = false;
            return;
          }

          // Detect dangerous behaviors (lower priority, longer cooldown)
          const behaviorResult = await detectDangerousBehavior(frameData);
          if (behaviorResult.detected && behaviorResult.vehicle && timeSinceLastIncident >= 3000) {
            // Only add vehicle box if we have a valid vehicle position
            const vehicleBox = createVehicleBox(
              behaviorResult.vehicle,
              'warning',
              behaviorResult.type,
              behaviorResult.isMoving
            );
            setDetectedVehicles(prev => {
              // Don't add duplicate vehicles (check if similar position already exists)
              const isDuplicate = prev.some(v => 
                Math.abs(v.x - vehicleBox.x) < 50 && 
                Math.abs(v.y - vehicleBox.y) < 50 &&
                v.type === behaviorResult.type
              );
              return isDuplicate ? prev : [...prev, vehicleBox];
            });
            
            await handleIncident(behaviorResult.type, behaviorResult.message);
            lastIncidentTimeRef.current = now;
            incidentCooldownRef.current = 5000; // 5 seconds cooldown for warnings
          }
        } catch (error) {
          console.error('Detection error:', error);
        } finally {
          processingRef.current = false;
        }
      }, 500); // Process every 500ms (2 FPS for analysis)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      processingRef.current = false;
    };
  }, [isMonitoring, permission]);

  const handleIncident = async (type, message) => {
    setIncidentCount(prev => prev + 1);
    setDetectionStatus(message);

    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Save incident
      const incident = {
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date().toISOString(),
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        severity: type === 'accident' ? 'critical' : 'warning',
      };

      await saveIncident(incident);

      // Log the incident
      if (type === 'accident') {
        await logCritical('حادث مروري', {
          location: incident.location,
          timestamp: incident.timestamp,
        });
      } else {
        await logWarning(message, {
          type,
          location: incident.location,
          timestamp: incident.timestamp,
        });
      }

      // Send emergency alert (only for accidents, and only if auto-send is enabled)
      if (type === 'accident') {
        try {
          const alertResult = await sendEmergencyAlert(incident);
          if (alertResult && alertResult.success !== false) {
            await logSuccess('تم إرسال تنبيه طوارئ', {
              incidentId: incident.id,
              location: incident.location,
            });
          } else {
            // Alert was sent locally but failed to reach backend
            await logWarning('تم حفظ الحادث محلياً، لكن فشل الاتصال بالباكند', {
              incidentId: incident.id,
              error: alertResult?.error || 'Unknown error',
            });
          }
        } catch (error) {
          // Don't block the app if alert fails
          console.error('Error sending emergency alert:', error);
          await logWarning('تم حفظ الحادث محلياً', {
            incidentId: incident.id,
          });
        }
      }
      
      // Update logs display
      await loadLogs();
    } catch (error) {
      console.error('Error handling incident:', error);
      await logError('فشل في معالجة الحادث', { error: error.message });
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.statusText}>طلب إذن الكاميرا...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>إذن الكاميرا مطلوب</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>منح الإذن</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {permission?.granted ? (
        <>
          <CameraView
            key={cameraKey}
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            enableTorch={false}
            autofocus="on"
          />
          {/* Overlay with absolute positioning */}
          <View style={styles.overlay}>
            {/* Top Status Bar */}
            <View style={styles.statusBar}>
              <View style={styles.statusLeft}>
                <View style={[styles.statusIndicator, isMonitoring && styles.statusActive]} />
                <Text style={styles.statusText}>{detectionStatus}</Text>
              </View>
              <View style={styles.statusRight}>
                <View style={styles.fpsContainer}>
                  <Text style={styles.fpsLabel}>FPS</Text>
                  <Text style={styles.fpsText}>{fps}</Text>
                </View>
              </View>
            </View>

            {/* Detection Zone */}
            <View style={styles.detectionZone}>
              <View style={styles.zoneBorder}>
                <View style={styles.cornerTopLeft} />
                <View style={styles.cornerTopRight} />
                <View style={styles.cornerBottomLeft} />
                <View style={styles.cornerBottomRight} />
              </View>
              <View style={styles.zoneLabelContainer}>
                <Text style={styles.zoneText}>منطقة الكشف</Text>
              </View>
            </View>

            {/* Vehicle Detection Boxes with Circles */}
            {detectedVehicles.map((vehicle) => (
              <View
                key={vehicle.id}
                style={[
                  styles.vehicleBox,
                  {
                    left: vehicle.x,
                    top: vehicle.y,
                    width: vehicle.width,
                    height: vehicle.height,
                    borderColor: vehicle.severity === 'critical' ? '#ff0000' : '#ffa500',
                  },
                ]}
              >
                {/* Circle indicator on top-right corner */}
                <View
                  style={[
                    styles.vehicleIndicator,
                    {
                      backgroundColor: vehicle.severity === 'critical' ? '#ff0000' : '#ffa500',
                      shadowColor: vehicle.severity === 'critical' ? '#ff0000' : '#ffa500',
                    },
                  ]}
                />
              </View>
            ))}

            {/* Stats Card */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="warning" size={24} color="#ff6b6b" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{incidentCount}</Text>
                  <Text style={styles.statLabel}>الحوادث</Text>
                </View>
              </View>
            </View>

            {/* Control Button */}
            <View style={styles.controls}>
              {!isMonitoring ? (
                <TouchableOpacity
                  style={[styles.controlButton, styles.startButton]}
                  onPress={startMonitoring}
                  activeOpacity={0.8}
                >
                <View style={styles.controlButtonContent}>
                  <Ionicons name="play" size={20} color="#fff" style={styles.controlButtonIcon} />
                  <Text style={styles.controlButtonText}>بدء المراقبة</Text>
                </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.controlButton, styles.stopButton]}
                  onPress={stopMonitoring}
                  activeOpacity={0.8}
                >
                  <View style={styles.controlButtonContent}>
                    <View style={styles.stopIconContainer}>
                      <View style={styles.stopIcon} />
                    </View>
                    <Text style={styles.controlButtonText}>إيقاف المراقبة</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Logs Display - Under Control Button */}
            {logsVisible && (
              <View style={styles.logsContainer}>
                <TouchableOpacity 
                  style={styles.logsHeader}
                  onPress={() => setLogsVisible(false)}
                  activeOpacity={0.7}
                >
                  <View style={styles.logsHeaderLeft}>
                    <Ionicons name="document-text" size={16} color="#fff" style={styles.logsTitleIcon} />
                    <Text style={styles.logsTitle}>سجل الأحداث</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setLogsVisible(false)}
                    style={styles.logsToggleButton}
                  >
                    <Ionicons name="chevron-down" size={18} color="#fff" />
                  </TouchableOpacity>
                </TouchableOpacity>
                <ScrollView style={styles.logsScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {logs.length === 0 ? (
                    <View style={styles.emptyLogs}>
                      <Text style={styles.emptyLogsText}>لا توجد أحداث حتى الآن</Text>
                    </View>
                  ) : (
                    logs.slice(0, 5).map((log) => (
                      <View key={log.id} style={styles.logItem}>
                        <View style={styles.logTimeContainer}>
                          <Text style={styles.logTime}>
                            {new Date(log.timestamp).toLocaleTimeString('ar-SA', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Text>
                        </View>
                        <View style={[styles.logMessageContainer, styles[`log${log.level.charAt(0).toUpperCase() + log.level.slice(1)}Container`]]}>
                          <Text style={[styles.logMessage, styles[`log${log.level.charAt(0).toUpperCase() + log.level.slice(1)}`]]}>
                            {log.message}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            )}

            {/* Show Logs Button - When Hidden */}
            {!logsVisible && (
              <TouchableOpacity 
                style={styles.showLogsButton}
                onPress={() => setLogsVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-up" size={18} color="#fff" />
                <Text style={styles.showLogsText}>إظهار سجل الأحداث</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <View style={styles.cameraPlaceholder}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.placeholderText}>جاري تحميل الكاميرا...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    width: '100%',
    height: '100%',
  },
  camera: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  placeholderText: {
    color: '#fff',
    marginTop: 15,
    fontSize: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusRight: {
    alignItems: 'flex-end',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff6b6b',
    marginRight: 12,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusActive: {
    backgroundColor: '#4caf50',
    shadowColor: '#4caf50',
  },
  statusText: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  fpsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fpsLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '600',
  },
  fpsText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  detectionZone: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    position: 'relative',
  },
  zoneBorder: {
    width: width * 0.75,
    height: height * 0.35,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#4caf50',
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#4caf50',
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#4caf50',
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#4caf50',
    borderBottomRightRadius: 8,
  },
  zoneLabelContainer: {
    position: 'absolute',
    top: -15,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  zoneText: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  statsContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
  },
  statBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.5)',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  statIcon: {
    fontSize: 24,
  },
  statContent: {
    alignItems: 'flex-end',
  },
  statValue: {
    color: '#ff6b6b',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  controls: {
    padding: 20,
    paddingBottom: 15,
    paddingTop: 2
  },
  controlButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  startButton: {
    backgroundColor: '#4caf50',
  },
  stopButton: {
    backgroundColor: '#ff6b6b',
  },
  controlButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  controlButtonIcon: {
    marginLeft: 10,
  },
  stopIconContainer: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 4,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIcon: {
    width: 12,
    height: 12,
    backgroundColor: '#ff6b6b',
    borderRadius: 2,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'right',
    marginBottom: 20,
    writingDirection: 'rtl',
  },
  button: {
    backgroundColor: '#4caf50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  logsContainer: {
    position: 'absolute',
    bottom: 90,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 16,
    padding: 10,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  logsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  logsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logsToggleButton: {
    padding: 4,
    borderRadius: 4,
  },
  logsTitleIcon: {
    marginLeft: 8,
  },
  logsTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  logsScroll: {
    maxHeight: 120,
  },
  emptyLogs: {
    padding: 10,
    alignItems: 'center',
  },
  emptyLogsText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  logItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  logTimeContainer: {
    marginRight: 10,
    justifyContent: 'center',
  },
  logTime: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    minWidth: 50,
    fontWeight: '500',
  },
  logMessageContainer: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  logMessage: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  logInfoContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  logWarningContainer: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
  },
  logErrorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  logSuccessContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  logCriticalContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
  },
  logInfo: {
    color: '#4caf50',
  },
  logWarning: {
    color: '#ffa500',
  },
  logError: {
    color: '#ff6b6b',
  },
  logSuccess: {
    color: '#4caf50',
  },
  logCritical: {
    color: '#ff6b6b',
    fontWeight: '700',
  },
  showLogsButton: {
    position: 'absolute',
    bottom: 100,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  showLogsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  vehicleBox: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  vehicleIndicator: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
});

