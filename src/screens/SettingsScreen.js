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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saveSettings, getSettings, clearAllIncidents } from '../services/storageService';
import { sendTestNotification } from '../services/alertService';

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

  const SettingItem = ({ title, subtitle, children }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {children}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>جاري تحميل الإعدادات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إعدادات الطوارئ</Text>
          
          <SettingItem
            title="جهة اتصال الطوارئ"
            subtitle="رقم الهاتف لتنبيهات الطوارئ"
          >
            <TextInput
              style={styles.input}
              value={settings.emergencyContact}
              onChangeText={(text) => updateSetting('emergencyContact', text)}
              placeholder="911"
              placeholderTextColor="#888"
              keyboardType="phone-pad"
            />
          </SettingItem>

          <SettingItem
            title="عنوان الباكند"
            subtitle="رابط خادم الباكند (مثال: http://192.168.1.100:3000)"
          >
            <TextInput
              style={[styles.input, { minWidth: 200, textAlign: 'right' }]}
              value={settings.backendUrl}
              onChangeText={(text) => updateSetting('backendUrl', text)}
              placeholder="http://localhost:3000"
              placeholderTextColor="#888"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </SettingItem>

          <SettingItem
            title="إرسال التنبيهات تلقائياً"
            subtitle="إرسال التنبيهات تلقائياً عند اكتشاف الحوادث"
          >
            <Switch
              value={settings.autoSendAlerts}
              onValueChange={(value) => updateSetting('autoSendAlerts', value)}
              trackColor={{ false: '#767577', true: '#4caf50' }}
              thumbColor={settings.autoSendAlerts ? '#fff' : '#f4f3f4'}
            />
          </SettingItem>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إعدادات الكشف</Text>
          
          <SettingItem
            title="حساسية الكشف"
            subtitle="تعديل مدى حساسية نظام الكشف"
          >
            <View style={styles.sensitivityContainer}>
              {['low', 'medium', 'high'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.sensitivityButton,
                    settings.detectionSensitivity === level && styles.sensitivityButtonActive,
                  ]}
                  onPress={() => updateSetting('detectionSensitivity', level)}
                >
                  <Text
                    style={[
                      styles.sensitivityButtonText,
                      settings.detectionSensitivity === level && styles.sensitivityButtonTextActive,
                    ]}
                  >
                    {level === 'low' ? 'منخفض' : level === 'medium' ? 'متوسط' : 'عالي'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SettingItem>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إعدادات الإشعارات</Text>
          
          <SettingItem
            title="تفعيل الإشعارات"
            subtitle="تلقي إشعارات للحوادث المكتشفة"
          >
            <Switch
              value={settings.enableNotifications}
              onValueChange={(value) => updateSetting('enableNotifications', value)}
              trackColor={{ false: '#767577', true: '#4caf50' }}
              thumbColor={settings.enableNotifications ? '#fff' : '#f4f3f4'}
            />
          </SettingItem>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestNotification}
          >
            <Ionicons name="notifications" size={18} color="#4caf50" style={styles.testButtonIcon} />
            <Text style={styles.testButtonText}>اختبار الإشعار</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إدارة البيانات</Text>
          
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleClearData}
          >
            <Ionicons name="trash" size={18} color="#ff6b6b" style={styles.dangerButtonIcon} />
            <Text style={styles.dangerButtonText}>مسح جميع بيانات الحوادث</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>حول</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>سامر الإصدار 1.0.0</Text>
            <Text style={styles.aboutText}>
              نظام ذكي لمراقبة الحوادث والاستجابة الطارئة
            </Text>
            <Text style={styles.aboutText}>
              يستخدم تقنية الرؤية الحاسوبية لاكتشاف حوادث الطرق وسلوكيات القيادة الخطيرة، مع إشعار خدمات الطوارئ تلقائياً.
            </Text>
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
    paddingTop: 70,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    color: '#666',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    color: '#1A1A1A',
    minWidth: 100,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 13,
  },
  sensitivityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sensitivityButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  sensitivityButtonActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sensitivityButtonText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  sensitivityButtonTextActive: {
    color: '#FFFFFF',
  },
  testButton: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    elevation: 2,
  },
  testButtonIcon: {
    marginLeft: 8,
  },
  testButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#F44336',
    elevation: 2,
  },
  dangerButtonIcon: {
    marginLeft: 8,
  },
  dangerButtonText: {
    color: '#D32F2F',
    fontSize: 15,
    fontWeight: '700',
  },
  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
});

