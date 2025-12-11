import React, { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    // Enable RTL for Arabic
    if (!I18nManager.isRTL) {
      I18nManager.forceRTL(true);
      I18nManager.allowRTL(true);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Tab.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#E0E0E0',
              height: Platform.OS === 'ios' ? 100 : 100,
              paddingBottom: Platform.OS === 'ios' ? 40 : 40,
              paddingTop: 12,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            },
            tabBarShowLabel: false,
            tabBarActiveTintColor: '#0066CC',
            tabBarInactiveTintColor: '#999',
          }}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              tabBarIcon: ({ color, size, focused }) => (
                <TabIcon 
                  iconName="home" 
                  iconNameOutline="home-outline"
                  color={color} 
                  focused={focused} 
                />
              ),
            }}
          />
          <Tab.Screen 
            name="Camera" 
            component={CameraScreen}
            options={{
              tabBarIcon: ({ color, size, focused }) => (
                <TabIcon 
                  iconName="camera" 
                  iconNameOutline="camera-outline"
                  color={color} 
                  focused={focused} 
                />
              ),
            }}
          />
          <Tab.Screen 
            name="Analytics" 
            component={AnalyticsScreen}
            options={{
              tabBarIcon: ({ color, size, focused }) => (
                <TabIcon 
                  iconName="stats-chart" 
                  iconNameOutline="stats-chart-outline"
                  color={color} 
                  focused={focused} 
                />
              ),
            }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              tabBarIcon: ({ color, size, focused }) => (
                <TabIcon 
                  iconName="settings" 
                  iconNameOutline="settings-outline"
                  color={color} 
                  focused={focused} 
                />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// Custom Tab Icon Component with Smooth Animation
const TabIcon = ({ iconName, iconNameOutline, color, focused }) => {
  const opacityAnim = React.useRef(new Animated.Value(focused ? 1 : 0.5)).current;

  React.useEffect(() => {
    // Smooth opacity animation
    Animated.timing(opacityAnim, {
      toValue: focused ? 1 : 0.5,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Animated.View
      style={{
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: focused ? '#E3F2FD' : 'transparent',
        opacity: opacityAnim,
      }}
    >
      <Ionicons 
        name={focused ? iconName : iconNameOutline} 
        size={24} 
        color={focused ? "#0066CC" : "#999"} 
      />
    </Animated.View>
  );
};

