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
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [cameraKey, setCameraKey] = useState(0);
  const [detectedVehicles, setDetectedVehicles] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  const cameraRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(Date.now());
  const processingRef = useRef(false);
  const lastIncidentTimeRef = useRef(0);
  const incidentCooldownRef = useRef(5000);
  
  // Initialize permissions and logs
  useEffect(() => {
    requestLocationPermission();
    loadLogs();
    const logInterval = setInterval(loadLogs, 2000);
    return () => {
      setIsMonitoring(false);
      clearInterval(logInterval);
    };
  }, []);

  // Handle screen focus/blur
  useFocusEffect(
    React.useCallback(() => {
      if (!permission?.granted) requestPermission();
      setIsMonitoring(false);
      setDetectionStatus('جاهز');
      setCameraKey(prev => prev + 1);
      
      return () => {
        setIsMonitoring(false);
        setDetectionStatus('جاهز');
        processingRef.current = false;
      };
    }, [permission])
  );

  const loadLogs = async () => {
    const recentLogs = await getRecentLogs(5);
    setLogs(recentLogs);
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
  };

  // Helper to create vehicle box (kept from original logic)
  const createVehicleBox = (vehicleData, severity, type = null, isMoving = true) => {
    const zoneWidth = width * 0.85;
    const zoneHeight = height * 0.45;
    const zoneCenterX = width / 2;
    const zoneCenterY = height / 2;
    const zoneStartX = zoneCenterX - zoneWidth / 2;
    const zoneStartY = zoneCenterY - zoneHeight / 2;
    
    const boxWidth = vehicleData.width * width;
    const boxHeight = vehicleData.height * height;
    const x = vehicleData.x * width - boxWidth / 2;
    const y = vehicleData.y * height - boxHeight / 2;
    
    const clampedX = Math.max(zoneStartX, Math.min(zoneStartX + zoneWidth - boxWidth, x));
    const clampedY = Math.max(zoneStartY, Math.min(zoneStartY + zoneHeight - boxHeight, y));
    
    let velocityX = 0;
    let velocityY = 0;
    if (isMoving) {
      velocityX = (Math.random() - 0.2) * 5;
      velocityY = (Math.random() - 0.5) * 1.5;
    }
    
    return {
      id: Date.now() + Math.random(),
      x: clampedX,
      y: clampedY,
      width: boxWidth,
      height: boxHeight,
      severity,
      type,
      timestamp: Date.now(),
      lastUpdate: Date.now(),
      velocityX,
      velocityY,
      isMoving,
      hasDisappeared: false,
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
    setDetectedVehicles([]);
    await logInfo('تم إيقاف المراقبة', { timestamp: new Date().toISOString() });
  };

  // Vehicle movement effect
  useEffect(() => {
    if (!isMonitoring) return;

    const updateInterval = setInterval(() => {
      setDetectedVehicles(prev => {
        const zoneWidth = width * 0.85;
        const zoneHeight = height * 0.45;
        const zoneCenterX = width / 2;
        const zoneCenterY = height / 2;
        const zoneStartX = zoneCenterX - zoneWidth / 2;
        const zoneStartY = zoneCenterY - zoneHeight / 2;
        const zoneEndX = zoneStartX + zoneWidth;
        const zoneEndY = zoneStartY + zoneHeight;

        return prev.map(vehicle => {
          if (vehicle.hasDisappeared) return null;

          let newX = vehicle.x;
          let newY = vehicle.y;
          let newVelocityX = vehicle.velocityX;
          let newVelocityY = vehicle.velocityY;

          if (vehicle.isMoving && (Math.abs(vehicle.velocityX) > 0.1 || Math.abs(vehicle.velocityY) > 0.1)) {
            newX = vehicle.x + vehicle.velocityX;
            newY = vehicle.y + vehicle.velocityY;

            if (newX < zoneStartX - vehicle.width || newX > zoneEndX + vehicle.width ||
                newY < zoneStartY - vehicle.height || newY > zoneEndY + vehicle.height) {
              return null;
            }

            if (newX < zoneStartX) { newVelocityX = 0; newX = zoneStartX; }
            else if (newX + vehicle.width > zoneEndX) { newVelocityX = 0; newX = zoneEndX - vehicle.width; }
            
            if (newY < zoneStartY) { newVelocityY = 0; newY = zoneStartY; }
            else if (newY + vehicle.height > zoneEndY) { newVelocityY = 0; newY = zoneEndY - vehicle.height; }
          }

          const timeSinceDetection = Date.now() - vehicle.timestamp;
          const maxVisibleTime = vehicle.severity === 'critical' ? 6000 : 5000;
          
          if (timeSinceDetection > maxVisibleTime) return null;

          return {
            ...vehicle,
            x: newX,
            y: newY,
            lastUpdate: Date.now(),
            velocityX: newVelocityX,
            velocityY: newVelocityY,
          };
        }).filter(v => v !== null);
      });
    }, 50);

    return () => clearInterval(updateInterval);
  }, [isMonitoring]);

  // Detection loop
  useEffect(() => {
    let intervalId = null;

    if (isMonitoring && cameraRef.current && permission?.granted) {
      intervalId = setInterval(async () => {
        if (processingRef.current || !cameraRef.current) return;

        frameCountRef.current++;
        const now = Date.now();
        if (now - lastFrameTimeRef.current >= 1000) {
          setFps(frameCountRef.current);
          frameCountRef.current = 0;
          lastFrameTimeRef.current = now;
        }

        processingRef.current = true;

        try {
          const frameData = { timestamp: Date.now() };
          const timeSinceLastIncident = now - lastIncidentTimeRef.current;
          
          if (timeSinceLastIncident < incidentCooldownRef.current) {
            processingRef.current = false;
            return;
          }

          // Accident Detection
          const accidentResult = await detectAccident(frameData);
          if (accidentResult.detected && accidentResult.vehicle) {
            const vehicleBox = createVehicleBox(accidentResult.vehicle, 'critical', 'accident', accidentResult.isMoving);
            setDetectedVehicles(prev => {
              const isDuplicate = prev.some(v => 
                Math.abs(v.x - vehicleBox.x) < 50 && 
                Math.abs(v.y - vehicleBox.y) < 50 &&
                v.severity === 'critical'
              );
              return isDuplicate ? prev : [...prev, vehicleBox];
            });
            
            await handleIncident('accident', 'تم اكتشاف حادث مروري');
            lastIncidentTimeRef.current = now;
            incidentCooldownRef.current = 10000;
            processingRef.current = false;
            return;
          }

          // Dangerous Behavior Detection
          const behaviorResult = await detectDangerousBehavior(frameData);
          if (behaviorResult.detected && behaviorResult.vehicle && timeSinceLastIncident >= 3000) {
            const vehicleBox = createVehicleBox(behaviorResult.vehicle, 'warning', behaviorResult.type, behaviorResult.isMoving);
            setDetectedVehicles(prev => {
              const isDuplicate = prev.some(v => 
                Math.abs(v.x - vehicleBox.x) < 50 && 
                Math.abs(v.y - vehicleBox.y) < 50 &&
                v.type === behaviorResult.type
              );
              return isDuplicate ? prev : [...prev, vehicleBox];
            });
            
            await handleIncident(behaviorResult.type, behaviorResult.message);
            lastIncidentTimeRef.current = now;
            incidentCooldownRef.current = 5000;
          }
        } catch (error) {
          console.error('Detection error:', error);
        } finally {
          processingRef.current = false;
        }
      }, 500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      processingRef.current = false;
    };
  }, [isMonitoring, permission]);

  const handleIncident = async (type, message) => {
    setIncidentCount(prev => prev + 1);
    setDetectionStatus(message);

    try {
      // Capture image of the incident
      let imageData = null;
      if (cameraRef.current) {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.5,
            base64: true,
            skipProcessing: true,
          });
          
          if (photo && photo.base64) {
            imageData = {
              type: 'image/jpeg',
              data: photo.base64
            };
          }
        } catch (camError) {
          console.error('Error capturing incident image:', camError);
        }
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const incident = {
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date().toISOString(),
        location: { latitude: location.coords.latitude, longitude: location.coords.longitude },
        severity: type === 'accident' ? 'critical' : 'warning',
        image: imageData,
      };

      // Don't save large base64 to async storage to prevent quota issues
      // Create a copy for storage without the full image data if needed, 
      // or rely on storage service to handle it.
      // For now, we save it as is, but be mindful of storage limits.
      await saveIncident(incident);

      if (type === 'accident') {
        await logCritical('حادث مروري', { location: incident.location, timestamp: incident.timestamp });
        try {
          const alertResult = await sendEmergencyAlert(incident);
          if (alertResult && alertResult.success !== false) {
            await logSuccess('تم إرسال تنبيه طوارئ', { incidentId: incident.id });
          } else {
            await logWarning('فشل إرسال التنبيه', { error: alertResult?.error });
          }
        } catch (error) {
          console.error('Error sending alert:', error);
        }
      } else {
        await logWarning(message, { type, location: incident.location });
      }
      
      await loadLogs();
    } catch (error) {
      console.error('Error handling incident:', error);
      await logError('فشل معالجة الحادث', { error: error.message });
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.permissionContent}>
          <View style={styles.permissionIconContainer}>
            <Ionicons name="camera" size={50} color="#FF9800" />
          </View>
          <Text style={styles.permissionTitle}>إذن الكاميرا مطلوب</Text>
          <Text style={styles.permissionText}>
            يحتاج التطبيق إلى الوصول للكاميرا لاكتشاف الحوادث ومراقبة الطريق
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>منح الإذن</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <CameraView
        key={cameraKey}
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        enableTorch={false}
        autofocus="on"
      />

      {/* Overlay UI */}
      <View style={styles.overlay}>
        {/* Top Gradient & Header */}
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent']}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-forward" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              {isMonitoring && (
                <View style={styles.fpsBadge}>
                  <Text style={styles.fpsText}>{fps} FPS</Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={styles.logsButton}
              onPress={() => setShowLogs(!showLogs)}
            >
              <Ionicons name="list" size={24} color="#FFF" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Status & Incidents Cards - Moved to Top */}
          <View style={styles.statsContainer}>
            {/* Status Card */}
            <View style={[styles.statCard, isMonitoring ? styles.statCardActive : null]}>
              <View style={[styles.iconCircle, isMonitoring ? styles.iconCircleActive : null]}>
                <Ionicons name={isMonitoring ? "eye" : "eye-off"} size={16} color={isMonitoring ? "#FFF" : "#AAA"} />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.statLabel}>الحالة</Text>
                <Text style={styles.statValueSmall} numberOfLines={1} adjustsFontSizeToFit>
                  {detectionStatus}
                </Text>
              </View>
            </View>

            {/* Incidents Card */}
            <View style={styles.statCard}>
              <View style={[styles.iconCircle, styles.iconCircleWarning]}>
                <Ionicons name="warning" size={16} color="#FFF" />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.statLabel}>الحوادث</Text>
                <Text style={styles.statValueLarge}>{incidentCount}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* HUD Detection Zone */}
        <View style={styles.hudContainer} pointerEvents="none">
          <View style={styles.hudCornerTopLeft} />
          <View style={styles.hudCornerTopRight} />
          <View style={styles.hudCornerBottomLeft} />
          <View style={styles.hudCornerBottomRight} />
          
          {isMonitoring && (
            <Animated.View 
              entering={FadeIn}
              style={styles.scanningLine} 
            />
          )}
        </View>

        {/* Detected Objects */}
        {detectedVehicles.map((vehicle) => (
          <Animated.View
            key={vehicle.id}
            entering={FadeIn}
            exiting={FadeOut}
            style={[
              styles.vehicleBox,
              {
                left: vehicle.x,
                top: vehicle.y,
                width: vehicle.width,
                height: vehicle.height,
                borderColor: vehicle.severity === 'critical' ? '#FF4444' : '#FF9800',
              },
            ]}
          >
            <View style={[
              styles.vehicleTag,
              { backgroundColor: vehicle.severity === 'critical' ? '#FF4444' : '#FF9800' }
            ]}>
              <Text style={styles.vehicleTagText}>
                {vehicle.severity === 'critical' ? 'خطر' : 'تحذير'}
              </Text>
            </View>
          </Animated.View>
        ))}

        {/* Bottom Controls */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
          style={styles.bottomGradient}
        >

          {showLogs && (
            <Animated.View 
              entering={SlideInDown} 
              exiting={SlideOutDown}
              style={styles.logsContainer}
            >
              <View style={styles.logsHeader}>
                <Text style={styles.logsTitle}>سجل العمليات</Text>
                <TouchableOpacity onPress={() => setShowLogs(false)}>
                  <Ionicons name="close" size={20} color="#AAA" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.logsScroll} contentContainerStyle={styles.logsContent}>
                {logs.map((log, index) => (
                  <View key={index} style={styles.logItem}>
                    <Text style={[
                      styles.logText, 
                      log.level === 'critical' ? styles.logCritical : 
                      log.level === 'warning' ? styles.logWarning : styles.logInfo
                    ]}>
                      {log.message}
                    </Text>
                    <Text style={styles.logTime}>
                      {new Date(log.timestamp).toLocaleTimeString('ar-SA')}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[styles.mainButton, isMonitoring ? styles.stopButton : styles.startButton]}
              onPress={isMonitoring ? stopMonitoring : startMonitoring}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isMonitoring ? ['#FF5252', '#D32F2F'] : ['#FFA726', '#F57C00']}
                style={styles.mainButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons 
                  name={isMonitoring ? "stop-circle-outline" : "scan-circle-outline"} 
                  size={28} 
                  color="#FFF" 
                />
                <Text style={styles.mainButtonText}>
                  {isMonitoring ? 'إيقاف المراقبة' : 'بدء المراقبة'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  permissionContent: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFF',
    borderRadius: 24,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  permissionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderColor: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#AAA',
  },
  statusDotActive: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  fpsBadge: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fpsText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  logsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hudContainer: {
    position: 'absolute',
    top: height * 0.25,
    left: width * 0.075,
    width: width * 0.85,
    height: height * 0.45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hudCornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    borderTopLeftRadius: 16,
  },
  hudCornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    borderTopRightRadius: 16,
  },
  hudCornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    borderBottomLeftRadius: 16,
  },
  hudCornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    borderBottomRightRadius: 16,
  },
  scanningLine: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255, 152, 0, 0.6)',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  vehicleBox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  vehicleTag: {
    position: 'absolute',
    top: -28,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  vehicleTagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomGradient: {
    paddingBottom: 40,
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statCardActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleActive: {
    backgroundColor: '#4CAF50',
  },
  iconCircleWarning: {
    backgroundColor: '#FF9800',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginBottom: 1,
    textAlign: 'right',
  },
  statValueSmall: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  statValueLarge: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
    textAlign: 'right',
  },
  logsContainer: {
    maxHeight: 200,
    marginBottom: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  logsHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  logsTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logsScroll: {
    padding: 12,
  },
  logsContent: {
    paddingBottom: 10,
  },
  logItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 8,
  },
  logText: {
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
    lineHeight: 18,
  },
  logInfo: { color: '#E0E0E0' },
  logWarning: { color: '#FFB74D' },
  logCritical: { color: '#FF5252' },
  logTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  },
  controlsContainer: {
    alignItems: 'center',
  },
  mainButton: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  mainButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    gap: 12,
  },
  mainButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
