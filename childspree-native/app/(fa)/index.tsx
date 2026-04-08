import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../components/AuthProvider';
import { StatusBadge } from '../../components/StatusBadge';
import { getNominations } from '../../lib/api';
import { tap } from '../../lib/haptics';
import { theme } from '../../constants/theme';

interface Nomination {
  id: string;
  child_first_name: string;
  child_last_name: string;
  school: string;
  status: string;
  intake_completed?: boolean;
  video_uploaded?: boolean;
}

export default function FAHome() {
  const { user, logout } = useAuth();
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadNominations();
    }, [])
  );

  async function loadNominations() {
    if (!user) return;
    try {
      const data = await getNominations(user.mail);
      setNominations(Array.isArray(data) ? data : data.nominations || []);
    } catch {
      // Silently fail
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadNominations();
    setRefreshing(false);
  }

  const stats = {
    total: nominations.length,
    sent: nominations.filter((n) => n.status === 'sent' || n.status === 'complete').length,
    intake: nominations.filter((n) => n.intake_completed).length,
    videos: nominations.filter((n) => n.video_uploaded).length,
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        bounces={Platform.OS === 'ios'}
        overScrollMode="never"
      >
        {/* Welcome */}
        <View style={styles.header}>
          <Text selectable={false} style={styles.greeting}>
            Welcome, {user?.displayName?.split(' ')[0] || 'Advocate'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              tap();
              logout();
              router.replace('/login');
            }}
          >
            <Text selectable={false} style={styles.logoutText}>
              Sign out
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats strip */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total', value: stats.total },
            { label: 'Sent', value: stats.sent },
            { label: 'Intake', value: stats.intake },
            { label: 'Videos', value: stats.videos },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text selectable={false} style={styles.statValue}>
                {stat.value}
              </Text>
              <Text selectable={false} style={styles.statLabel}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick nominate */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            tap();
            router.push('/(fa)/nominate');
          }}
          style={styles.nominateButton}
        >
          <Text selectable={false} style={styles.nominateButtonText}>
            + Nominate a Child
          </Text>
        </TouchableOpacity>

        {/* Recent nominations */}
        <Text selectable={false} style={styles.sectionTitle}>
          Recent Nominations
        </Text>
        {nominations.length === 0 ? (
          <Text selectable={false} style={styles.emptyText}>
            No nominations yet — tap the button above to nominate your first child
          </Text>
        ) : (
          nominations.slice(0, 5).map((nom) => (
            <View key={nom.id} style={styles.nominationRow}>
              <View style={styles.nominationInfo}>
                <Text selectable={false} style={styles.childName}>
                  {nom.child_first_name} {nom.child_last_name}
                </Text>
                <Text selectable={false} style={styles.schoolText}>
                  {nom.school}
                </Text>
              </View>
              <StatusBadge status={nom.status} />
            </View>
          ))
        )}

        {nominations.length > 5 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              tap();
              router.push('/(fa)/portal');
            }}
            style={styles.viewAllButton}
          >
            <Text selectable={false} style={styles.viewAllText}>
              View all {nominations.length} nominations
            </Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingTop: theme.spacing.lg,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  logoutText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  nominateButton: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  nominateButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    padding: theme.spacing.xl,
    fontSize: 15,
  },
  nominationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  nominationInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  schoolText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  viewAllButton: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  viewAllText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '500',
  },
});
