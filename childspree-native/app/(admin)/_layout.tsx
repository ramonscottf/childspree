import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { theme } from '../../constants/theme';

function TabIcon({
  name,
  color,
  size,
}: {
  name: string;
  color: string;
  size: number;
}) {
  const icons: Record<string, string> = {
    pipeline: '\u25A6',
    volunteers: '\u263A',
    stats: '\u2637',
  };
  return (
    <Text
      selectable={false}
      style={{ color, fontSize: size, fontWeight: '600' }}
    >
      {icons[name] || '?'}
    </Text>
  );
}

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          borderTopColor: theme.colors.border,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pipeline',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="pipeline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="volunteers"
        options={{
          title: 'Volunteers',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="volunteers" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="stats" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
