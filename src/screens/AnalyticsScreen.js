import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  getIncidentStats,
  identifyHighRiskAreas,
  predictAccidentLocations,
  getIncidentTrends,
} from '../services/analyticsService';

const { width, height } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [highRiskAreas, setHighRiskAreas] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [trends, setTrends] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [statsData, riskAreas, predictionsData, trendsData] = await Promise.all([
        getIncidentStats(),
        identifyHighRiskAreas(),
        predictAccidentLocations(),
        getIncidentTrends(30),
      ]);

      setStats(statsData);
      setHighRiskAreas(riskAreas);
      setPredictions(predictionsData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'critical': return '#FF5252';
      case 'high': return '#FF9800';
      case 'medium': return '#FFC107';
      default: return '#4CAF50';
    }
  };

  const getRiskLabel = (riskLevel) => {
    switch (riskLevel) {
      case 'critical': return 'حرج جداً';
      case 'high': return 'عالي الخطورة';
      case 'medium': return 'متوسط الخطورة';
      default: return 'منخفض الخطورة';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
      </View>
    );
  }

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return (
          <Animated.View entering={FadeInDown.duration(500)}>
            {/* Main Stats Grid */}
            <View style={styles.gridContainer}>
              <View style={styles.gridRow}>
                <View style={[styles.statCard, styles.cardElevated]}>
                  <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="warning" size={24} color="#FF9800" />
                  </View>
                  <Text style={styles.statValue}>{stats?.totalIncidents || 0}</Text>
                  <Text style={styles.statLabel}>إجمالي الحوادث</Text>
                </View>
                <View style={[styles.statCard, styles.cardElevated]}>
                  <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  </View>
                  <Text style={styles.statValue}>{stats?.todayIncidents || 0}</Text>
                  <Text style={styles.statLabel}>حوادث اليوم</Text>
                </View>
              </View>
              <View style={styles.gridRow}>
                <View style={[styles.statCard, styles.cardElevated]}>
                  <View style={[styles.iconBox, { backgroundColor: '#FFEBEE' }]}>
                    <Ionicons name="alert" size={24} color="#F44336" />
                  </View>
                  <Text style={styles.statValue}>{stats?.criticalIncidents || 0}</Text>
                  <Text style={styles.statLabel}>حالات حرجة</Text>
                </View>
                <View style={[styles.statCard, styles.cardElevated]}>
                  <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="notifications" size={24} color="#2196F3" />
                  </View>
                  <Text style={styles.statValue}>{stats?.warningIncidents || 0}</Text>
                  <Text style={styles.statLabel}>تنبيهات</Text>
                </View>
              </View>
            </View>

            {/* Trends Section */}
            {trends && (
              <View style={[styles.sectionCard, styles.cardElevated]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>اتجاهات الحوادث</Text>
                  <Ionicons name="trending-up" size={20} color="#FF9800" />
                </View>
                <View style={styles.trendInfo}>
                  <View style={styles.trendItem}>
                    <Text style={styles.trendValue}>{trends.averagePerDay.toFixed(1)}</Text>
                    <Text style={styles.trendLabel}>متوسط يومي</Text>
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.trendItem}>
                    <Text style={styles.trendValue}>{trends.total}</Text>
                    <Text style={styles.trendLabel}>آخر 30 يوم</Text>
                  </View>
                </View>
                <View style={styles.trendBadgeContainer}>
                  <View style={[styles.trendBadge, { backgroundColor: trends.trend === 'up' ? '#FFEBEE' : '#E8F5E9' }]}>
                    <Ionicons 
                      name={trends.trend === 'up' ? 'arrow-up' : 'arrow-down'} 
                      size={16} 
                      color={trends.trend === 'up' ? '#F44336' : '#4CAF50'} 
                    />
                    <Text style={[styles.trendBadgeText, { color: trends.trend === 'up' ? '#F44336' : '#4CAF50' }]}>
                      {trends.trend === 'up' ? 'ارتفاع في المعدل' : 'انخفاض في المعدل'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </Animated.View>
        );

      case 'risks':
        return (
          <Animated.View entering={FadeInDown.duration(500)}>
            {highRiskAreas.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="shield-checkmark-outline" size={80} color="#E0E0E0" />
                <Text style={styles.emptyText}>لا توجد مناطق خطرة مسجلة</Text>
              </View>
            ) : (
              highRiskAreas.map((area, index) => (
                <View key={index} style={[styles.riskCard, styles.cardElevated]}>
                  <View style={styles.riskHeader}>
                    <View style={[styles.riskLevelBadge, { backgroundColor: getRiskColor(area.riskLevel) + '20' }]}>
                      <Text style={[styles.riskLevelText, { color: getRiskColor(area.riskLevel) }]}>
                        {getRiskLabel(area.riskLevel)}
                      </Text>
                    </View>
                    <Text style={styles.riskTitle}>منطقة #{index + 1}</Text>
                  </View>
                  <View style={styles.riskDetails}>
                    <View style={styles.riskDetailItem}>
                      <Ionicons name="car-sport-outline" size={18} color="#666" />
                      <Text style={styles.riskDetailText}>{area.incidentCount} حادثة</Text>
                    </View>
                    <View style={styles.riskDetailItem}>
                      <Ionicons name="location-outline" size={18} color="#666" />
                      <Text style={styles.riskDetailText}>
                        {area.center.latitude.toFixed(4)}, {area.center.longitude.toFixed(4)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        );

      case 'predictions':
        return (
          <Animated.View entering={FadeInDown.duration(500)}>
            {predictions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="analytics-outline" size={80} color="#E0E0E0" />
                <Text style={styles.emptyText}>جاري جمع البيانات للتنبؤ...</Text>
              </View>
            ) : (
              predictions.map((pred, index) => (
                <View key={index} style={[styles.predictionCard, styles.cardElevated]}>
                  <View style={styles.predictionHeader}>
                    <View style={styles.predictionScore}>
                      <Text style={styles.scoreText}>{pred.predictionScore}%</Text>
                      <Text style={styles.scoreLabel}>احتمالية</Text>
                    </View>
                    <View style={styles.predictionTitleBox}>
                      <Text style={styles.predictionTitle}>تنبؤ #{index + 1}</Text>
                      <Text style={styles.predictionSubtitle}>تحليل مستقبلي</Text>
                    </View>
                  </View>
                  
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${pred.predictionScore}%`, backgroundColor: getRiskColor(pred.riskLevel) }]} />
                  </View>

                  <View style={styles.recommendationBox}>
                    <Ionicons name="bulb-outline" size={20} color="#FF9800" style={{ marginBottom: 5 }} />
                    <Text style={styles.recommendationText}>{pred.recommendation}</Text>
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header Background */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#FF9800', '#F57C00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        />
        <View style={styles.headerCircle} />
        <View style={styles.headerCircleSmall} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContent}>
          <Text style={styles.pageTitle}>التحليلات</Text>
          <Text style={styles.pageSubtitle}>نظرة شاملة على البيانات</Text>
        </View>

        {/* Custom Tab Bar */}
        <View style={styles.tabBarContainer}>
          <View style={styles.tabBar}>
            {[
              { id: 'predictions', label: 'التنبؤات' },
              { id: 'risks', label: 'المخاطر' },
              { id: 'overview', label: 'نظرة عامة' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabItem,
                  selectedTab === tab.id && styles.tabItemActive
                ]}
                onPress={() => setSelectedTab(tab.id)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.tabText,
                  selectedTab === tab.id && styles.tabTextActive
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderTabContent()}
          
          <View style={styles.footerSpacing} />
        </ScrollView>
      </SafeAreaView>

      {/* Floating Action Button for Refresh */}
      <Animated.View entering={SlideInRight.delay(500)} style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={loadAnalytics}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF9800', '#F57C00']}
            style={styles.fabGradient}
          >
            <Ionicons name="refresh" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    overflow: 'hidden',
  },
  headerGradient: {
    width: '100%',
    height: '100%',
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
  safeArea: {
    flex: 1,
  },
  headerContent: {
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'flex-end',
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 5,
  },
  pageSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  tabBarContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  tabItemActive: {
    backgroundColor: '#FF9800',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  gridContainer: {
    marginBottom: 20,
  },
  gridRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    width: (width - 55) / 2,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'flex-end',
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 6,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  trendInfo: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  trendItem: {
    alignItems: 'center',
  },
  trendValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginBottom: 5,
  },
  trendLabel: {
    fontSize: 13,
    color: '#888',
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#EEE',
  },
  trendBadgeContainer: {
    alignItems: 'flex-start',
  },
  trendBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  trendBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  riskCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 15,
  },
  riskHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  riskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  riskLevelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  riskLevelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  riskDetails: {
    flexDirection: 'row-reverse',
    gap: 15,
  },
  riskDetailItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  riskDetailText: {
    fontSize: 14,
    color: '#666',
  },
  predictionCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 15,
  },
  predictionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  predictionTitleBox: {
    alignItems: 'flex-end',
  },
  predictionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  predictionSubtitle: {
    fontSize: 13,
    color: '#888',
  },
  predictionScore: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF9800',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#888',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  recommendationBox: {
    backgroundColor: '#FFF8E1',
    padding: 15,
    borderRadius: 16,
    alignItems: 'flex-end',
  },
  recommendationText: {
    fontSize: 14,
    color: '#5D4037',
    textAlign: 'right',
    lineHeight: 20,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerSpacing: {
    height: 80,
  },
});
