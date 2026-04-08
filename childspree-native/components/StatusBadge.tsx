import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../constants/theme';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FFF3E0', text: '#E65100' },
  approved: { bg: '#E8F5E9', text: '#2E7D32' },
  sent: { bg: '#E3F2FD', text: '#1565C0' },
  complete: { bg: '#F3E5F5', text: '#7B1FA2' },
  declined: { bg: '#FFEBEE', text: '#C62828' },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] || {
    bg: theme.colors.surface,
    text: theme.colors.textSecondary,
  };

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text
        selectable={false}
        style={[styles.text, { color: colors.text }]}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
