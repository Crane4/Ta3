import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getIncidentStats,
  identifyHighRiskAreas,
  predictAccidentLocations,
  getIncidentTrends,
} from '../services/analyticsService';
import { getIncidents } from '../services/storageService';

const { width } = Dimensions.get('window');

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
      case 'critical': return '#ff0000';
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffa500';
      default: return '#4caf50';
    }
  };

  const getRiskLabel = (riskLevel) => {
    switch (riskLevel) {
      case 'critical': return 'حرج';
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      default: return 'منخفض';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIconContainer}>
          <ActivityIndicator size="large" color="#ffa500" />
        </View>
        <Text style={styles.loadingText}>جاري تحميل التحليلات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="stats-chart" size={32} color="#ffa500" />
          </View>
          <Text style={styles.headerTitle}>لوحة التحليلات</Text>
          <Text style={styles.headerSubtitle}>مراقبة وتحليل بيانات الحوادث</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
            onPress={() => setSelectedTab('overview')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="grid"
              size={18}
              color={selectedTab === 'overview' ? '#FFFFFF' : '#888'}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabText, selectedTab === 'overview' && styles.tabTextActive]}>
              نظرة عامة
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'risks' && styles.tabActive]}
            onPress={() => setSelectedTab('risks')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="warning"
              size={18}
              color={selectedTab === 'risks' ? '#FFFFFF' : '#888'}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabText, selectedTab === 'risks' && styles.tabTextActive]}>
              المخاطر
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'predictions' && styles.tabActive]}
            onPress={() => setSelectedTab('predictions')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="bulb"
              size={18}
              color={selectedTab === 'predictions' ? '#FFFFFF' : '#888'}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabText, selectedTab === 'predictions' && styles.tabTextActive]}>
              التنبؤات
            </Text>
          </TouchableOpacity>
        </View>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <View>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>الإحصائيات</Text>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="pie-chart" size={20} color="#ffa500" />
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statCardOrange]}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="warning" size={24} color="#ffa500" />
                </View>
                <Text style={styles.statValue}>{stats?.totalIncidents || 0}</Text>
                <Text style={styles.statTitle}>إجمالي الحوادث</Text>
              </View>

              <View style={[styles.statCard, styles.statCardGreen]}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="today" size={24} color="#4caf50" />
                </View>
                <Text style={[styles.statValue, { color: '#4caf50' }]}>{stats?.todayIncidents || 0}</Text>
                <Text style={styles.statTitle}>حوادث اليوم</Text>
              </View>

              <View style={[styles.statCard, styles.statCardRed]}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="alert-circle" size={24} color="#ff6b6b" />
                </View>
                <Text style={[styles.statValue, { color: '#ff6b6b' }]}>{stats?.criticalIncidents || 0}</Text>
                <Text style={styles.statTitle}>حرجة</Text>
              </View>

              <View style={[styles.statCard, styles.statCardBlue]}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="notifications" size={24} color="#0066CC" />
                </View>
                <Text style={[styles.statValue, { color: '#0066CC' }]}>{stats?.warningIncidents || 0}</Text>
                <Text style={styles.statTitle}>تحذيرات</Text>
              </View>
            </View>

            {/* Trends Card */}
            {trends && (
              <View style={styles.trendsCard}>
                <View style={styles.trendsHeader}>
                  <View style={styles.trendsIconContainer}>
                    <Ionicons name="trending-up" size={24} color="#ffa500" />
                  </View>
                  <Text style={styles.trendsTitle}>الاتجاهات (آخر 30 يوم)</Text>
                </View>
                <View style={styles.trendsDivider} />
                <View style={styles.trendsContent}>
                  <View style={styles.trendItem}>
                    <Text style={styles.trendValue}>{trends.total}</Text>
                    <Text style={styles.trendLabel}>إجمالي الحوادث</Text>
                  </View>
                  <View style={styles.trendItemDivider} />
                  <View style={styles.trendItem}>
                    <Text style={styles.trendValue}>{trends.averagePerDay.toFixed(1)}</Text>
                    <Text style={styles.trendLabel}>متوسط يومي</Text>
                  </View>
                </View>
                <View style={styles.trendBadgeContainer}>
                  <View style={styles.trendBadge}>
                    <Ionicons name="analytics" size={14} color="#0066CC" />
                    <Text style={styles.trendBadgeText}>الاتجاه: {trends.trend}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Risks Tab */}
        {selectedTab === 'risks' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>مناطق عالية الخطورة</Text>
              <View style={[styles.sectionIconContainer, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="location" size={20} color="#ff6b6b" />
              </View>
            </View>

            {highRiskAreas.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="shield-checkmark" size={50} color="#4caf50" />
                </View>
                <Text style={styles.emptyTitle}>لا توجد مناطق خطرة</Text>
                <Text style={styles.emptyText}>لم يتم تحديد مناطق عالية الخطورة بعد</Text>
              </View>
            ) : (
              highRiskAreas.map((area, index) => (
                <View key={index} style={styles.riskCard}>
                  <View style={styles.riskCardHeader}>
                    <View style={styles.riskCardLeft}>
                      <View style={[styles.riskBadge, { backgroundColor: getRiskColor(area.riskLevel) }]}>
                        <Text style={styles.riskBadgeText}>{getRiskLabel(area.riskLevel)}</Text>
                      </View>
                    </View>
                    <View style={styles.riskCardRight}>
                      <Text style={styles.riskCardTitle}>منطقة #{index + 1}</Text>
                      <View style={styles.riskIconContainer}>
                        <Ionicons name="warning" size={22} color={getRiskColor(area.riskLevel)} />
                      </View>
                    </View>
                  </View>
                  <View style={styles.riskCardDivider} />
                  <View style={styles.riskCardInfo}>
                    <View style={styles.riskInfoItem}>
                      <Ionicons name="car-sport" size={18} color="#666" />
                      <Text style={styles.riskInfoText}>الحوادث: {area.incidentCount}</Text>
                    </View>
                    <View style={styles.riskInfoItem}>
                      <Ionicons name="navigate" size={18} color="#666" />
                      <Text style={styles.riskInfoText}>
                        {area.center.latitude.toFixed(4)}\xB0, {area.center.longitude.toFixed(4)}\xB0
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Predictions Tab */}
        {selectedTab === 'predictions' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>تنبؤات الحوادث</Text>
              <View style={[styles.sectionIconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="bulb" size={20} color="#0066CC" />
              </View>
            </View>

            {predictions.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconContainer, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="analytics" size={50} color="#0066CC" />
                </View>
                <Text style={styles.emptyTitle}>لا توجد تنبؤات</Text>
                <Text style={styles.emptyText}>هناك حاجة إلى المزيد من بيانات الحوادث للتنبؤات الدقيقة</Text>
              </View>
            ) : (
              predictions.map((prediction, index) => (
                <View key={index} style={styles.predictionCard}>
                  <View style={styles.predictionHeader}>
                    <View style={styles.predictionScoreContainer}>
                      <Text style={styles.predictionScoreText}>{prediction.predictionScore}%</Text>
                    </View>
                    <View style={styles.predictionHeaderRight}>
                      <Text style={styles.predictionTitle}>التنبؤ #{index + 1}</Text>
                      <View style={styles.predictionIconContainer}>
                        <Ionicons name="bulb" size={22} color="#ffa500" />
                      </View>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${prediction.predictionScore}%` }]} />
                  </View>

                  <View style={styles.predictionDetails}>
                    <View style={styles.predictionDetailItem}>
                      <View style={[styles.detailBadge, { backgroundColor: getRiskColor(prediction.riskLevel) + '20' }]}>
                        <Ionicons name="shield" size={16} color={getRiskColor(prediction.riskLevel)} />
                        <Text style={[styles.detailBadgeText, { color: getRiskColor(prediction.riskLevel) }]}>
                          {getRiskLabel(prediction.riskLevel)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.predictionInfoRow}>
                      <View style={styles.predictionInfoItem}>
                        <Ionicons name="car" size={16} color="#888" />
                        <Text style={styles.predictionInfoText}>{prediction.incidentCount} حادثة</Text>
                      </View>
                      <View style={styles.predictionInfoItem}>
                        <Ionicons name="time" size={16} color="#888" />
                        <Text style={styles.predictionInfoText}>الذروة: {prediction.timePatterns.peakHour}:00</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.recommendationContainer}>
                    <View style={styles.recommendationHeader}>
                      <Text style={styles.recommendationTitle}>التوصية</Text>
                      <Ionicons name="information-circle" size={18} color="#0066CC" />
                    </View>
                    <Text style={styles.recommendationText}>{prediction.recommendation}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadAnalytics}
          activeOpacity={0.8}
        >
          <View style={styles.refreshButtonContent}>
            <Text style={styles.refreshButtonText}>تحديث البيانات</Text>
            <View style={styles.refreshIconContainer}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 25,
    paddingTop: 10,
  },
  headerIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#ffa500',
    elevation: 4,
    shadowColor: '#ffa500',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 6,
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    fontWeight: '500',
  },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#ffa500',
    elevation: 3,
    shadowColor: '#ffa500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabIcon: {
    marginRight: 4,
  },
  tabText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'right',
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: (width - 50) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statCardOrange: {
    borderBottomWidth: 3,
    borderBottomColor: '#ffa500',
  },
  statCardGreen: {
    borderBottomWidth: 3,
    borderBottomColor: '#4caf50',
  },
  statCardRed: {
    borderBottomWidth: 3,
    borderBottomColor: '#ff6b6b',
  },
  statCardBlue: {
    borderBottomWidth: 3,
    borderBottomColor: '#0066CC',
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffa500',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  // Trends Card
  trendsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  trendsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  trendsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  trendsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'right',
  },
  trendsDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 18,
  },
  trendsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  trendItem: {
    alignItems: 'center',
    flex: 1,
  },
  trendItemDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  trendValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  trendLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  trendBadgeContainer: {
    alignItems: 'center',
    marginTop: 18,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  trendBadgeText: {
    color: '#0066CC',
    fontSize: 13,
    fontWeight: '600',
  },
  // Empty State
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Risk Card
  riskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  riskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginRight: 10,
  },
  riskIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  riskBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  riskCardDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 14,
  },
  riskCardInfo: {
    gap: 10,
  },
  riskInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  riskInfoText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  // Prediction Card
  predictionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  predictionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predictionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginRight: 10,
  },
  predictionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  predictionScoreContainer: {
    backgroundColor: '#ffa500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#ffa500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  predictionScoreText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginBottom: 18,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ffa500',
    borderRadius: 4,
  },
  predictionDetails: {
    marginBottom: 16,
  },
  predictionDetailItem: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  detailBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  predictionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
  },
  predictionInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  predictionInfoText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  recommendationContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 10,
    gap: 6,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0066CC',
  },
  recommendationText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    textAlign: 'right',
  },
  // Refresh Button
  refreshButton: {
    backgroundColor: '#ffa500',
    borderRadius: 16,
    padding: 18,
    marginTop: 25,
    elevation: 4,
    shadowColor: '#ffa500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  refreshButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

