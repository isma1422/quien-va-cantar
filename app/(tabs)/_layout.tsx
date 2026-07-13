import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].tabBarBackground,
          borderTopColor: Colors[colorScheme].tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          ...(Platform.OS === 'web' ? {
            maxWidth: 680,
            alignSelf: 'center' as const,
            width: '100%' as any,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          } : {}),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Eventos',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Guardados',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="bookmark" color={color} />,
        }}
      />
      <Tabs.Screen
        name="submit"
        options={{
          title: 'Publicar',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="plus-circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
