import React, { useCallback, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { getStats } from '../../lib/api';
import { theme } from '../../constants/theme';

interface StatsData {
  total_nominations?: number;
  pending?: number;
  approved?: number;
  sent?: number;
  complete?: number;
  declined?: number;
  intake_completed?: number;
  videos_uploaded?: number;
  total_volunteers?: number;
  [key: string]: number | undefined;
}

export default function StatsScreen() {
  const [stats, setStats] = useState<StatsData>({});
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  async function loadStats() {
    try {
      const data = await getStats();
      setStats(data);
    } catch {
      // Silently fail
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }

  const sections = [
    {
      title: 'Nominations',
      items: [
        { label: 'Total', value: stats.total_nominations || 0, color: theme.colors.primary },
        { label: 'Pending', value: stats.pending || 0, color: theme.colors.warning },
        { label: 'Approved', value: stats.approved || 0, color: theme.colors.success },
        { label: 'Sent', value: stats.sent || 0, color: '#1565C0' },
        { label: 'Complete', value: stats.complete || 0, color: '#7B1FA2' },
        { label: 'Declined', value: stats.declined || 0, color: theme.colors.error },
      ],
    },
    {
      title: 'Intake Progress',
      items: [
        { label: 'Forms Completed', value: stats.intake_completed || 0, color: theme.colors.success },
        { label: 'Videos Uploaded', value: stats.videos_uploaded || 0, color: theme.colors.primary },
      ],
    },
    {
      title: 'Volunteers',
      items: [
        { label: 'Total Signed Up', value: stats.total_volunteers || 0, color: theme.colors.primary },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        bounces={Platform.OS === 'ios'}
        overScrollMode="never"
        contentContainerStyle={styles.scrollContent}
      >
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text selectable={false} style={styles.sectionTitle}>
              {section.title}
            </Text>
            <View style={styles.grid}>
              {section.items.map((item) => (
                <View key={item.label} style={styles.card}>
                  <Text
                    selectable={false}
                    style={[styles.cardValue, { color: item.color }]}
                  >
                    {item.value}
                  </Text>
                  <Text selectable={false} style={styles.cardLabel}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Completion rate */}
        {(stats.total_nominations || 0) > 0 && (
          <View style={styles.section}>
            <Text selectable={false} style={styles.sectionTitle}>
              Completion Rate
            </Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        ((stats.complete || 0) /
                          (stats.total_nominations || 1)) *
                        100
                      }%`,
                    },
                  ]}
                />
              </View>
              <Text selectable={false} style={styles.progressText}>
                {Math.round(
                  ((stats.complete || 0) / (stats.total_nominations || 1)) *
                    100
                )}
                % complete
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  card: {
    width: '47%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  cardLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  progressContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
});
