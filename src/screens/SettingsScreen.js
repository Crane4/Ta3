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
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveSettings, getSettings, clearAllIncidents } from '../services/storageService';
import { sendTestNotification } from '../services/alertService';
import { initSocket } from '../services/socketService';

const { width, height } = Dimensions.get('window');

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    emergencyContact: '911',
    autoSendAlerts: true,
    detectionSensitivity: 'medium',
    enableNotifications: true,
    backendUrl: 'http://172.20.10.2:3000',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await getSettings();
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...savedSettings }));
      }
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
    
    if (key === 'backendUrl') {
      // Reconnect WebSocket with new URL
      // Add a small delay to let storage finish saving (though await saveSettings handles it)
      setTimeout(() => initSocket(), 500);
    }
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
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>جاري تحميل الإعدادات...</Text>
      </View>
    );
  }

  const SettingSection = ({ title, icon, color, delay, children }) => (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={[styles.sectionIconBox, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
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
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Content */}
            <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.headerIconContainer}>
                  <Ionicons name="settings" size={32} color="#FFF" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>الإعدادات</Text>
                  <Text style={styles.headerSubtitle}>تخصيص تجربة التطبيق</Text>
                </View>
              </View>
            </Animated.View>

            {/* Emergency Settings */}
            <SettingSection title="إعدادات الطوارئ" icon="warning" color="#FF9800" delay={200}>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>جهة اتصال الطوارئ</Text>
                  <TextInput
                    style={styles.input}
                    value={settings.emergencyContact}
                    onChangeText={(text) => updateSetting('emergencyContact', text)}
                    placeholder="911"
                    keyboardType="phone-pad"
                    textAlign="right"
                  />
                </View>
                <View style={styles.settingIcon}>
                  <Ionicons name="call" size={22} color="#666" />
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>عنوان الخادم</Text>
                  <TextInput
                    style={styles.input}
                    value={settings.backendUrl}
                    onChangeText={(text) => updateSetting('backendUrl', text)}
                    placeholder="http://..."
                    autoCapitalize="none"
                    textAlign="right"
                  />
                </View>
                <View style={styles.settingIcon}>
                  <Ionicons name="server" size={22} color="#666" />
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.settingRow}>
                <Switch
                  value={settings.autoSendAlerts}
                  onValueChange={(value) => updateSetting('autoSendAlerts', value)}
                  trackColor={{ false: '#E0E0E0', true: '#FFB74D' }}
                  thumbColor={settings.autoSendAlerts ? '#FF9800' : '#F5F5F5'}
                />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingRowLabel}>إرسال التنبيهات تلقائياً</Text>
                  <Text style={styles.settingRowSubLabel}>إرسال فوري عند اكتشاف خطر</Text>
                </View>
                <View style={styles.settingIcon}>
                  <Ionicons name="send" size={22} color="#666" />
                </View>
              </View>
            </SettingSection>

            {/* Detection Settings */}
            <SettingSection title="إعدادات الكشف" icon="eye" color="#2196F3" delay={400}>
              <View style={styles.settingItemColumn}>
                <View style={styles.settingHeaderRow}>
                  <Text style={styles.settingLabel}>حساسية الكشف</Text>
                  <Ionicons name="speedometer" size={22} color="#666" />
                </View>
                <View style={styles.sensitivityContainer}>
                  {['high', 'medium', 'low'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.sensitivityButton,
                        settings.detectionSensitivity === level && styles.sensitivityButtonActive,
                        { borderColor: settings.detectionSensitivity === level ? '#2196F3' : '#E0E0E0' }
                      ]}
                      onPress={() => updateSetting('detectionSensitivity', level)}
                    >
                      <Text
                        style={[
                          styles.sensitivityButtonText,
                          settings.detectionSensitivity === level && { color: '#2196F3', fontWeight: 'bold' },
                        ]}
                      >
                        {getSensitivityLabel(level)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </SettingSection>

            {/* Notification Settings */}
            <SettingSection title="الإشعارات" icon="notifications" color="#4CAF50" delay={600}>
              <View style={styles.settingRow}>
                <Switch
                  value={settings.enableNotifications}
                  onValueChange={(value) => updateSetting('enableNotifications', value)}
                  trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                  thumbColor={settings.enableNotifications ? '#4CAF50' : '#F5F5F5'}
                />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingRowLabel}>تفعيل الإشعارات</Text>
                  <Text style={styles.settingRowSubLabel}>استلام تنبيهات فورية</Text>
                </View>
                <View style={styles.settingIcon}>
                  <Ionicons name="notifications-outline" size={22} color="#666" />
                </View>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleTestNotification}
              >
                <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>اختبار الإشعار</Text>
                <Ionicons name="notifications" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </SettingSection>

            {/* Data Management */}
            <SettingSection title="إدارة البيانات" icon="folder" color="#F44336" delay={800}>
              <TouchableOpacity 
                style={styles.dangerButton}
                onPress={handleClearData}
              >
                <Text style={styles.dangerButtonText}>مسح جميع بيانات الحوادث</Text>
                <Ionicons name="trash-outline" size={20} color="#F44336" />
              </TouchableOpacity>
            </SettingSection>

            {/* About Section */}
            <SettingSection title="حول التطبيق" icon="information-circle" color="#9C27B0" delay={1000}>
              <View style={styles.aboutContent}>
                <View style={styles.aboutLogoContainer}>
                  <Ionicons name="car-sport" size={32} color="#9C27B0" />
                </View>
                <Text style={styles.aboutAppName}>سامر</Text>
                <Text style={styles.aboutVersion}>الإصدار 1.0.0</Text>
                <Text style={styles.aboutDescription}>
                  نظام ذكي لمراقبة الحوادث والاستجابة الطارئة
                </Text>
                
                <View style={styles.aboutBadges}>
                  <View style={styles.aboutBadge}>
                    <Text style={styles.aboutBadgeText}>آمن</Text>
                    <Ionicons name="shield-checkmark" size={14} color="#4CAF50" />
                  </View>
                  <View style={styles.aboutBadge}>
                    <Text style={styles.aboutBadgeText}>سريع</Text>
                    <Ionicons name="flash" size={14} color="#FF9800" />
                  </View>
                  <View style={styles.aboutBadge}>
                    <Text style={styles.aboutBadgeText}>ذكي</Text>
                    <Ionicons name="eye" size={14} color="#2196F3" />
                  </View>
                </View>
              </View>
            </SettingSection>
            
            <View style={styles.footerSpacing} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
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
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
    marginTop: 10,
  },
  headerTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 15,
  },
  headerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
    paddingRight: 5,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    textAlign: 'right',
  },
  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  settingItemColumn: {
    flexDirection: 'column',
    gap: 15,
  },
  settingHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginLeft: 15,
  },
  settingLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 5,
  },
  settingIcon: {
    width: 30,
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 15,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 15,
    alignItems: 'flex-end',
  },
  settingRowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
  },
  settingRowSubLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    textAlign: 'right',
  },
  sensitivityContainer: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  sensitivityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  sensitivityButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  sensitivityButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    gap: 8,
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
  },
  footerSpacing: {
    height: 40,
  },
  aboutContent: {
    alignItems: 'center',
    padding: 10,
  },
  aboutLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  aboutAppName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  aboutVersion: {
    fontSize: 12,
    color: '#888',
    marginBottom: 15,
  },
  aboutDescription: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  aboutBadges: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  aboutBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    gap: 5,
  },
  aboutBadgeText: {
    fontSize: 11,
    color: '#555',
    fontWeight: '500',
  }
});

