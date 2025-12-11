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

  const StatCard = ({ title, value, subtitle, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const RiskAreaCard = ({ area, index }) => (
    <View style={styles.riskCard}>
      <View style={styles.riskHeader}>
        <Text style={styles.riskTitle}>منطقة عالية الخطورة #{index + 1}</Text>
        <View style={[styles.riskBadge, { backgroundColor: getRiskColor(area.riskLevel) }]}>
          <Text style={styles.riskBadgeText}>{area.riskLevel.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.riskText}>الحوادث: {area.incidentCount}</Text>
      <Text style={styles.riskText}>
        الموقع: {area.center.latitude.toFixed(4)}, {area.center.longitude.toFixed(4)}
      </Text>
    </View>
  );

  const PredictionCard = ({ prediction, index }) => (
    <View style={styles.predictionCard}>
      <View style={styles.predictionHeader}>
        <Text style={styles.predictionTitle}>التنبؤ #{index + 1}</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{prediction.predictionScore}%</Text>
        </View>
      </View>
      <View style={[styles.scoreBar, { width: `${prediction.predictionScore}%` }]} />
      <Text style={styles.predictionText}>
        مستوى الخطر: <Text style={styles.boldText}>{prediction.riskLevel === 'critical' ? 'حرج' : prediction.riskLevel === 'high' ? 'عالي' : prediction.riskLevel === 'medium' ? 'متوسط' : 'منخفض'}</Text>
      </Text>
      <Text style={styles.predictionText}>
        الحوادث التاريخية: {prediction.incidentCount}
      </Text>
      <Text style={styles.predictionText}>
        ساعة الذروة: {prediction.timePatterns.peakHour}:00
      </Text>
      <Text style={styles.recommendationText}>{prediction.recommendation}</Text>
    </View>
  );

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffa500';
      default: return '#4caf50';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.loadingText}>جاري تحميل التحليلات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
            onPress={() => setSelectedTab('overview')}
          >
            <Text style={[styles.tabText, selectedTab === 'overview' && styles.tabTextActive]}>
              نظرة عامة
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'risks' && styles.tabActive]}
            onPress={() => setSelectedTab('risks')}
          >
            <Text style={[styles.tabText, selectedTab === 'risks' && styles.tabTextActive]}>
              مناطق الخطر
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'predictions' && styles.tabActive]}
            onPress={() => setSelectedTab('predictions')}
          >
            <Text style={[styles.tabText, selectedTab === 'predictions' && styles.tabTextActive]}>
              التنبؤات
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'overview' && (
          <View>
            <Text style={styles.sectionTitle}>الإحصائيات</Text>
            <View style={styles.statsGrid}>
              <StatCard
                title="إجمالي الحوادث"
                value={stats?.totalIncidents || 0}
                color="#ffa500"
              />
              <StatCard
                title="اليوم"
                value={stats?.todayIncidents || 0}
                color="#4caf50"
              />
              <StatCard
                title="حرجة"
                value={stats?.criticalIncidents || 0}
                color="#ffa500"
              />
              <StatCard
                title="تحذيرات"
                value={stats?.warningIncidents || 0}
                color="#ffa500"
              />
            </View>

            {trends && (
              <View style={styles.trendsCard}>
                <Text style={styles.sectionTitle}>الاتجاهات (آخر 30 يوم)</Text>
                <Text style={styles.trendValue}>{trends.total} حادث</Text>
                <Text style={styles.trendText}>
                  المتوسط: {trends.averagePerDay.toFixed(1)} في اليوم
                </Text>
                <View style={styles.trendBadge}>
                  <Text style={styles.trendBadgeText}>
                    الاتجاه: {trends.trend}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {selectedTab === 'risks' && (
          <View>
            <Text style={styles.sectionTitle}>مناطق عالية الخطورة</Text>
            {highRiskAreas.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>لم يتم تحديد مناطق عالية الخطورة بعد</Text>
              </View>
            ) : (
              highRiskAreas.map((area, index) => (
                <RiskAreaCard key={index} area={area} index={index} />
              ))
            )}
          </View>
        )}

        {selectedTab === 'predictions' && (
          <View>
            <Text style={styles.sectionTitle}>تنبؤات الحوادث</Text>
            {predictions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>لا توجد تنبؤات متاحة بعد</Text>
                <Text style={styles.emptySubtext}>
                  هناك حاجة إلى المزيد من بيانات الحوادث للتنبؤات الدقيقة
                </Text>
              </View>
            ) : (
              predictions.map((prediction, index) => (
                <PredictionCard key={index} prediction={prediction} index={index} />
              ))
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadAnalytics}
        >
          <Text style={styles.refreshButtonText}>🔄 تحديث البيانات</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderLeftColor: '#0066CC',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  trendsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  trendValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  trendText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  trendBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trendBadgeText: {
    color: '#0066CC',
    fontSize: 12,
    fontWeight: '600',
  },
  riskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  riskText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  predictionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  scoreContainer: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scoreBar: {
    height: 5,
    backgroundColor: '#0066CC',
    borderRadius: 3,
    marginBottom: 12,
  },
  predictionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  recommendationText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  refreshButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  refreshButtonText: {
    color: '#0066CC',
    fontSize: 16,
    fontWeight: '600',
  },
});

