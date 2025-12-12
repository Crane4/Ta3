import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { getIncidentStats } from '../services/analyticsService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initSocket, isSocketConnected, addSocketListener } from '../services/socketService';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState({
    totalIncidents: 0,
    todayIncidents: 0,
    highRiskAreas: 0,
  });
  const [isWsConnected, setIsWsConnected] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    initSocket();
    
    // Listen for connection status changes
    const unsubscribe = addSocketListener((status) => {
      setIsWsConnected(status === 'connected');
    });
    
    // Check initial status
    setIsWsConnected(isSocketConnected());

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const incidentStats = await getIncidentStats();
      if (incidentStats) {
        setStats(incidentStats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleStartMonitoring = () => {
    navigation.navigate('Camera');
  };

  const StatCard = ({ title, value, icon, color, delay, index }) => (
    <Animated.View 
      entering={FadeInDown.delay(delay).springify()} 
      style={[styles.statCardContainer, index === 0 ? styles.statCardFull : styles.statCardHalf]}
    >
      <View style={[styles.statCard, { borderColor: color + '30' }]}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statLabel}>{title}</Text>
        </View>
        <View style={[styles.decorativeCircle, { backgroundColor: color + '10' }]} />
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.scrollWrapper}>
          {/* Header Background */}
          <View style={styles.headerBackgroundContainer}>
            <LinearGradient
              colors={['#FF9800', '#F57C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerBackground}
            />
            <View style={styles.headerCircle} />
            <View style={styles.headerCircleSmall} />
          </View>

          <SafeAreaView style={styles.safeArea}>
            <View style={styles.scrollContent}>
              {/* Header Content */}
              <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
                <View style={styles.headerTop}>
                  <View>
                    <Text style={styles.greeting}>مرحباً بك 👋</Text>
                    <Text style={styles.username}>السائق</Text>
                  </View>
                  <View style={styles.headerActions}>
                    <View style={[styles.statusBadge, isWsConnected ? styles.statusConnected : styles.statusDisconnected]}>
                      <View style={[styles.statusDot, isWsConnected ? styles.dotConnected : styles.dotDisconnected]} />
                      <Text style={styles.statusText}>{isWsConnected ? 'متصل' : 'غير متصل'}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.notificationBtn}
                      onPress={() => navigation.navigate('Notifications')}
                    >
                      <Ionicons name="notifications-outline" size={24} color="#fff" />
                      <View style={styles.badge} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>

              {/* Stats Section */}
              <View style={styles.overlappingWrapper}>
                <View style={styles.overlappingCard}>
                  <Text style={styles.sectionTitle}>نظرة عامة</Text>
                  <View style={styles.statsGrid}>
                    <StatCard 
                      title="إجمالي الحوادث"  
                      value={stats.totalIncidents} 
                      icon="warning" 
                      color="#FF9800" 
                      delay={200}
                      index={0}
                    />
                    <View style={styles.statsRow}>
                      <StatCard 
                        title="حوادث اليوم" 
                        value={stats.todayIncidents} 
                        icon="stats-chart" 
                        color="#4CAF50" 
                        delay={400}
                        index={1}
                      />
                      <StatCard 
                        title="مناطق خطرة" 
                        value={stats.highRiskAreas} 
                        icon="alert-circle" 
                        color="#F44336" 
                        delay={600}
                        index={1}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Action Button */}
              <Animated.View entering={FadeInUp.delay(800).springify()} style={styles.actionContainer}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleStartMonitoring}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#FF9800', '#F57C00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>بدء المراقبة</Text>
                    <View style={styles.buttonIconContainer}>
                      <Ionicons name="car-sport" size={24} color="#FFF" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Info Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>كيف يعمل النظام</Text>
                <Animated.View entering={FadeInDown.delay(1000)} style={styles.infoCard}>
                  {[
                    { text: 'كشف الحوادث بالذكاء الاصطناعي', icon: 'eye' },
                    { text: 'تنبيهات فورية للطوارئ', icon: 'notifications' },
                    { text: 'تحليل سلوك السائقين', icon: 'speedometer' },
                    { text: 'تنبؤ بالمخاطر المحتملة', icon: 'analytics' }
                  ].map((item, index) => (
                    <View key={index} style={styles.infoItem}>
                      <View style={styles.infoIconBox}>
                        <Ionicons name={item.icon} size={20} color="#FF9800" />
                      </View>
                      <Text style={styles.infoText}>{item.text}</Text>
                    </View>
                  ))}
                </Animated.View>
              </View>
              
              <View style={styles.footerSpacing} />
            </View>
          </SafeAreaView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollWrapper: {
    position: 'relative',
    minHeight: height,
  },
  safeArea: {
    flex: 1,
  },
  headerBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerCircleSmall: {
    position: 'absolute',
    top: 50,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    marginTop: 10,
    marginBottom: 60,
  },
  headerTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 15,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    gap: 6,
  },
  statusConnected: {
    backgroundColor: 'rgba(46, 213, 115, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(46, 213, 115, 0.3)',
  },
  statusDisconnected: {
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotConnected: {
    backgroundColor: '#2ed573',
    shadowColor: '#2ed573',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  dotDisconnected: {
    backgroundColor: '#ff4757',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4757',
    borderWidth: 1.5,
    borderColor: '#2f3542',
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'right',
    marginBottom: 2,
  },
  appTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'right',
  },
  statsGrid: {
    gap: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  statCardContainer: {
    // flex: 1,
  },
  statCardFull: {
    width: '100%',
  },
  statCardHalf: {
    flex: 1,
  },
  statCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 120,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    alignSelf: 'flex-end',
  },
  statContent: {
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  decorativeCircle: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  actionContainer: {
    marginBottom: 30,
  },
  primaryButton: {
    borderRadius: 24,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 22,
    paddingHorizontal: 30,
    borderRadius: 24,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  buttonIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 14,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: '#444',
    textAlign: 'right',
    fontWeight: '600',
    lineHeight: 22,
  },
  overlappingWrapper: {
    position: 'relative',
    zIndex: 999,
    marginTop: -50,
    marginBottom: 25,
  },
  overlappingCard: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 10,
  },
  footerSpacing: {
    height: 40,
  },
});
