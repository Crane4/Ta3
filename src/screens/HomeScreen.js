import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
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

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
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
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="warning" size={40} color="#0066CC" />
            </View>
          </View>
          <Text style={styles.title}>سامر</Text>
          <Text style={styles.subtitle}>
            نظام ذكي لمراقبة الحوادث والاستجابة الطارئة
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="warning" size={28} color="#0066CC" />
            </View>
            <Text style={styles.statValue}>{stats.totalIncidents}</Text>
            <Text style={styles.statTitle}>إجمالي الحوادث</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="stats-chart" size={28} color="#2E7D32" />
            </View>
            <Text style={styles.statValue}>{stats.todayIncidents}</Text>
            <Text style={styles.statTitle}>حوادث اليوم</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="alert-circle" size={28} color="#F57C00" />
            </View>
            <Text style={styles.statValue}>{stats.highRiskAreas}</Text>
            <Text style={styles.statTitle}>مناطق عالية الخطورة</Text>
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
            <Ionicons name="information-circle" size={24} color="#0066CC" style={styles.infoIcon} />
            <Text style={styles.infoTitle}>كيف يعمل النظام</Text>
          </View>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={18} color="#0066CC" style={styles.infoBulletIcon} />
              <Text style={styles.infoText}>كشف الحوادث في الوقت الفعلي باستخدام الرؤية الحاسوبية</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={18} color="#0066CC" style={styles.infoBulletIcon} />
              <Text style={styles.infoText}>إرسال تنبيهات تلقائية لخدمات الطوارئ</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={18} color="#0066CC" style={styles.infoBulletIcon} />
              <Text style={styles.infoText}>مراقبة سلوكيات القيادة الخطيرة</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={18} color="#0066CC" style={styles.infoBulletIcon} />
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
    backgroundColor: '#F5F5F5',
    paddingTop: 50,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
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
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0066CC',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#0066CC',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    elevation: 3,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonIcon: {
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoIcon: {
    marginLeft: 10,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  infoList: {
    gap: 14,
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
    color: '#333',
    lineHeight: 24,
    textAlign: 'right',
  },
});

