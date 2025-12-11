import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Animated,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIncidentStats } from '../services/analyticsService';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState({
    totalIncidents: 0,
    todayIncidents: 0,
    highRiskAreas: 0,
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const animatedBoxes = useRef([]);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Create static triangles on left and right sides
  useEffect(() => {
    const triangles = [];
    const colors = ['#ffa500', '#4caf50']; // Orange and Green
    const sides = ['left', 'right']; // Position on left or right
    
    // Create triangles for left side
    for (let i = 0; i < 15; i++) {
      triangles.push({
        id: `left-${i}`,
        color: colors[i % 2], // Alternate between orange and green
        size: 20 + Math.random() * 30, // Random size between 20-50
        topPosition: Math.random() * 100, // Random vertical position
        side: 'left',
        rotation: Math.random() * 360, // Random rotation
        opacity: 0.2 + Math.random() * 0.3, // Opacity between 0.2-0.5
      });
    }
    
    // Create triangles for right side
    for (let i = 0; i < 15; i++) {
      triangles.push({
        id: `right-${i}`,
        color: colors[i % 2], // Alternate between orange and green
        size: 20 + Math.random() * 30, // Random size between 20-50
        topPosition: Math.random() * 100, // Random vertical position
        side: 'right',
        rotation: Math.random() * 360, // Random rotation
        opacity: 0.2 + Math.random() * 0.3, // Opacity between 0.2-0.5
      });
    }
    
    animatedBoxes.current = triangles;
  }, []);

  const loadStats = async () => {
    try {
      const incidentStats = await getIncidentStats();
      setStats(incidentStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleStartMonitoring = () => {
    navigation.navigate('Camera');
  };


  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {/* Static Triangles Background */}
      <View style={styles.trianglesContainer} pointerEvents="none">
        {animatedBoxes.current.map((triangle) => {
          const triangleSize = triangle.size;
          const isLeft = triangle.side === 'left';
          
          return (
            <View
              key={triangle.id}
              style={[
                styles.triangle,
                {
                  top: `${triangle.topPosition}%`,
                  left: isLeft ? 0 : undefined,
                  right: !isLeft ? 0 : undefined,
                  opacity: triangle.opacity,
                  transform: [{ rotate: `${triangle.rotation}deg` }],
                },
              ]}
            >
              <View
                style={{
                  width: 0,
                  height: 0,
                  backgroundColor: 'transparent',
                  borderStyle: 'solid',
                  borderRightWidth: isLeft ? triangleSize : 0,
                  borderLeftWidth: !isLeft ? triangleSize : 0,
                  borderBottomWidth: triangleSize * 0.866,
                  borderRightColor: isLeft ? 'transparent' : 'transparent',
                  borderLeftColor: !isLeft ? 'transparent' : 'transparent',
                  borderBottomColor: triangle.color,
                }}
              />
            </View>
          );
        })}
      </View>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image 
                source={require('../../assets/app.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.title}>سامر</Text>
          <Text style={styles.subtitle}>
            نظام ذكي لمراقبة الحوادث والاستجابة الطارئة
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.statCardOrange]}>
            <View style={styles.statCardContent}>
              <View style={styles.statIconWrapper}>
                <View style={[styles.statIconContainer, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="warning" size={24} color="#ffa500" />
                </View>
              </View>
              <View style={styles.statTextWrapper}>
                <Text style={styles.statValue}>{stats.totalIncidents}</Text>
                <Text style={styles.statTitle}>إجمالي الحوادث</Text>
              </View>
            </View>
          </View>
          
          <View style={[styles.statCard, styles.statCardGreen]}>
            <View style={styles.statCardContent}>
              <View style={styles.statIconWrapper}>
                <View style={[styles.statIconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="stats-chart" size={24} color="#4caf50" />
                </View>
              </View>
              <View style={styles.statTextWrapper}>
                <Text style={[styles.statValue, styles.statValueGreen]}>{stats.todayIncidents}</Text>
                <Text style={styles.statTitle}>حوادث اليوم</Text>
              </View>
            </View>
          </View>
          
          <View style={[styles.statCard, styles.statCardOrange]}>
            <View style={styles.statCardContent}>
              <View style={styles.statIconWrapper}>
                <View style={[styles.statIconContainer, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="alert-circle" size={24} color="#ffa500" />
                </View>
              </View>
              <View style={styles.statTextWrapper}>
                <Text style={styles.statValue}>{stats.highRiskAreas}</Text>
                <Text style={styles.statTitle}>مناطق عالية الخطورة</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleStartMonitoring}
          activeOpacity={0.8}
        >
          <Ionicons name="car" size={24} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>بدء المراقبة</Text>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={styles.infoBox}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#ffa500" style={styles.infoIcon} />
            <Text style={styles.infoTitle}>كيف يعمل النظام</Text>
          </View>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={18} color="#4caf50" style={styles.infoBulletIcon} />
              <Text style={styles.infoText}>كشف الحوادث في الوقت الفعلي باستخدام الرؤية الحاسوبية</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={18} color="#4caf50" style={styles.infoBulletIcon} />
              <Text style={styles.infoText}>إرسال تنبيهات تلقائية لخدمات الطوارئ</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={18} color="#4caf50" style={styles.infoBulletIcon} />
              <Text style={styles.infoText}>مراقبة سلوكيات القيادة الخطيرة</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={18} color="#4caf50" style={styles.infoBulletIcon} />
              <Text style={styles.infoText}>تقييم المخاطر والتنبؤ بها</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 50,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  logoContainer: {
    marginBottom: 15,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#19941D',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'right',
    lineHeight: 22,
    paddingHorizontal: 20,
    fontWeight: '500',
    writingDirection: 'rtl',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    minHeight: 110,
  },
  statCardOrange: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#ffa500',
  },
  statCardGreen: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  statCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  statIconWrapper: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTextWrapper: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  statValueGreen: {
    color: '#1A1A1A',
  },
  statTitle: {
    fontSize: 11,
    color: '#555',
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '600',
    lineHeight: 16,
  },
  primaryButton: {
    backgroundColor: '#ffa500',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    elevation: 5,
    shadowColor: '#ffa500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 0,
  },
  buttonIcon: {
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  infoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#F0F0F0',
  },
  infoIcon: {
    marginLeft: 10,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    letterSpacing: 0.3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  infoList: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBulletIcon: {
    marginLeft: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: '#2A2A2A',
    lineHeight: 24,
    textAlign: 'right',
    fontWeight: '500',
  },
  trianglesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  triangle: {
    position: 'absolute',
  },
});

