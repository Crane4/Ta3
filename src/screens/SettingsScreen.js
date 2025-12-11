import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saveSettings, getSettings, clearAllIncidents } from '../services/storageService';
import { sendTestNotification } from '../services/alertService';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    emergencyContact: '911',
    autoSendAlerts: true,
    detectionSensitivity: 'medium',
    enableNotifications: true,
    backendUrl: 'http://localhost:3000',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await getSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleClearData = () => {
    Alert.alert(
      'مسح جميع البيانات',
      'هل أنت متأكد من حذف جميع بيانات الحوادث؟ لا يمكن التراجع عن هذا الإجراء.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            await clearAllIncidents();
            Alert.alert('نجح', 'تم مسح جميع بيانات الحوادث.');
          },
        },
      ]
    );
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      Alert.alert('نجح', 'تم إرسال إشعار الاختبار!');
    } catch (error) {
      Alert.alert('خطأ', 'فشل إرسال إشعار الاختبار.');
    }
  };

  const getSensitivityLabel = (level) => {
    switch (level) {
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return level;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffa500" />
        <Text style={styles.loadingText}>جاري تحميل الإعدادات...</Text>
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
            <Ionicons name="settings" size={32} color="#ffa500" />
          </View>
          <Text style={styles.headerTitle}>الإعدادات</Text>
          <Text style={styles.headerSubtitle}>تخصيص تجربة التطبيق</Text>
        </View>

        {/* Emergency Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>إعدادات الطوارئ</Text>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="warning" size={20} color="#ffa500" />
            </View>
          </View>

          {/* Emergency Contact */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrapper}>
                <Ionicons name="call" size={22} color="#4caf50" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>جهة اتصال الطوارئ</Text>
                <Text style={styles.cardSubtitle}>رقم الهاتف لتنبيهات الطوارئ</Text>
              </View>
            </View>
            <TextInput
              style={styles.textInput}
              value={settings.emergencyContact}
              onChangeText={(text) => updateSetting('emergencyContact', text)}
              placeholder="911"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          {/* Backend URL */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrapper}>
                <Ionicons name="server" size={22} color="#0066CC" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>عنوان الخادم</Text>
                <Text style={styles.cardSubtitle}>رابط خادم الباكند</Text>
              </View>
            </View>
            <TextInput
              style={styles.textInput}
              value={settings.backendUrl}
              onChangeText={(text) => updateSetting('backendUrl', text)}
              placeholder="http://localhost:3000"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Auto Send Alerts */}
          <View style={styles.cardRow}>
            <View style={styles.cardRowSide}>
              <Switch
                value={settings.autoSendAlerts}
                onValueChange={(value) => updateSetting('autoSendAlerts', value)}
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={settings.autoSendAlerts ? '#4caf50' : '#BDBDBD'}
              />
            </View>
            <View style={styles.cardRowCenter}>
              <Text style={styles.cardTitle}>إرسال التنبيهات تلقائياً</Text>
              <Text style={styles.cardSubtitle}>إرسال تلقائي عند اكتشاف الحوادث</Text>
            </View>
            <View style={styles.cardRowSide}>
              <View style={styles.cardIconWrapper}>
                <Ionicons name="send" size={22} color="#ffa500" />
              </View>
            </View>
          </View>
        </View>

        {/* Detection Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>إعدادات الكشف</Text>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="eye" size={20} color="#0066CC" />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrapper}>
                <Ionicons name="speedometer" size={22} color="#ffa500" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>حساسية الكشف</Text>
                <Text style={styles.cardSubtitle}>تعديل مدى حساسية نظام الكشف</Text>
              </View>
            </View>
            <View style={styles.sensitivityContainer}>
              {['high', 'medium', 'low'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.sensitivityButton,
                    settings.detectionSensitivity === level && styles.sensitivityButtonActive,
                  ]}
                  onPress={() => updateSetting('detectionSensitivity', level)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.sensitivityButtonText,
                      settings.detectionSensitivity === level && styles.sensitivityButtonTextActive,
                    ]}
                  >
                    {getSensitivityLabel(level)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Notification Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>الإشعارات</Text>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="notifications" size={20} color="#4caf50" />
            </View>
          </View>

          {/* Enable Notifications */}
          <View style={styles.cardRow}>
            <View style={styles.cardRowSide}>
              <Switch
                value={settings.enableNotifications}
                onValueChange={(value) => updateSetting('enableNotifications', value)}
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={settings.enableNotifications ? '#4caf50' : '#BDBDBD'}
              />
            </View>
            <View style={styles.cardRowCenter}>
              <Text style={styles.cardTitle}>تفعيل الإشعارات</Text>
              <Text style={styles.cardSubtitle}>تلقي إشعارات للحوادث المكتشفة</Text>
            </View>
            <View style={styles.cardRowSide}>
              <View style={styles.cardIconWrapper}>
                <Ionicons name="notifications-outline" size={22} color="#4caf50" />
              </View>
            </View>
          </View>

          {/* Test Notification Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTestNotification}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonText}>اختبار الإشعار</Text>
              <View style={styles.actionButtonIconWrapper}>
                <Ionicons name="notifications" size={20} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>إدارة البيانات</Text>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="folder" size={20} color="#ff6b6b" />
            </View>
          </View>

          {/* Clear Data Button */}
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleClearData}
            activeOpacity={0.8}
          >
            <View style={styles.dangerButtonContent}>
              <Text style={styles.dangerButtonText}>مسح جميع بيانات الحوادث</Text>
              <View style={styles.dangerButtonIconWrapper}>
                <Ionicons name="trash" size={20} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>حول التطبيق</Text>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="information-circle" size={20} color="#ffa500" />
            </View>
          </View>

          <View style={styles.aboutCard}>
            <View style={styles.aboutLogoContainer}>
              <View style={styles.aboutLogo}>
                <Ionicons name="car-sport" size={40} color="#ffa500" />
              </View>
            </View>
            <Text style={styles.aboutAppName}>سامر</Text>
            <Text style={styles.aboutVersion}>الإصدار 1.0.0</Text>
            <View style={styles.aboutDivider} />
            <Text style={styles.aboutDescription}>
              نظام ذكي لمراقبة الحوادث والاستجابة الطارئة
            </Text>
            <Text style={styles.aboutFeatures}>
              يستخدم تقنية الرؤية الحاسوبية لاكتشاف حوادث الطرق وسلوكيات القيادة الخطيرة، مع إشعار خدمات الطوارئ تلقائياً.
            </Text>
            <View style={styles.aboutBadges}>
              <View style={styles.aboutBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#4caf50" />
                <Text style={styles.aboutBadgeText}>آمن</Text>
              </View>
              <View style={styles.aboutBadge}>
                <Ionicons name="flash" size={16} color="#ffa500" />
                <Text style={styles.aboutBadgeText}>سريع</Text>
              </View>
              <View style={styles.aboutBadge}>
                <Ionicons name="eye" size={16} color="#0066CC" />
                <Text style={styles.aboutBadgeText}>ذكي</Text>
              </View>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 15,
    textAlign: 'right',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  // Header Styles
  header: {
    alignItems: 'center',
    marginBottom: 30,
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
  // Section Styles
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'right',
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  // Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  cardInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'right',
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'right',
    lineHeight: 18,
  },
  // Card Row (for switches)
  cardRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardRowSide: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRowCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Text Input Styles
  textInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1A1A1A',
    textAlign: 'right',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    fontWeight: '500',
  },
  // Sensitivity Buttons
  sensitivityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  sensitivityButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    alignItems: 'center',
  },
  sensitivityButtonActive: {
    backgroundColor: '#ffa500',
    borderColor: '#ffa500',
    elevation: 4,
    shadowColor: '#ffa500',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  sensitivityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  sensitivityButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Action Button (Test Notification)
  actionButton: {
    backgroundColor: '#4caf50',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    elevation: 4,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Danger Button (Clear Data)
  dangerButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 14,
    padding: 16,
    elevation: 4,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  dangerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  // About Section
  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  aboutLogoContainer: {
    marginBottom: 15,
  },
  aboutLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffa500',
  },
  aboutAppName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 14,
    color: '#888',
    marginBottom: 15,
    fontWeight: '500',
  },
  aboutDivider: {
    width: 60,
    height: 3,
    backgroundColor: '#ffa500',
    borderRadius: 2,
    marginBottom: 15,
  },
  aboutDescription: {
    fontSize: 15,
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 10,
    lineHeight: 24,
  },
  aboutFeatures: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  aboutBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  aboutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  aboutBadgeText: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '600',
  },
});

