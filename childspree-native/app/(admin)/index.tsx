import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, Modal, Portal, Button, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../components/AuthProvider';
import { StatusBadge } from '../../components/StatusBadge';
import { getNominations, updateNomination } from '../../lib/api';
import { tap, success as hapticSuccess, error as hapticError } from '../../lib/haptics';
import { theme } from '../../constants/theme';

interface Nomination {
  id: string;
  child_first_name: string;
  child_last_name: string;
  school: string;
  grade: string;
  status: string;
  nominator_name: string;
  parent_name: string;
  parent_phone: string;
  parent_email?: string;
  reason: string;
  intake_completed?: boolean;
  video_uploaded?: boolean;
  consent_given?: boolean;
  shirt_size?: string;
  pant_size?: string;
  shoe_size?: string;
  gender?: string;
  department?: string;
  favorite_colors?: string;
  avoid_colors?: string;
  allergies?: string;
  created_at?: string;
}

const FILTER_TABS = ['All', 'Pending', 'Approved', 'Sent', 'Complete'] as const;

export default function AdminPipeline() {
  const { user, logout } = useAuth();
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('All');
  const [selectedNom, setSelectedNom] = useState<Nomination | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadNominations();
    }, [])
  );

  async function loadNominations() {
    try {
      const data = await getNominations();
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

  async function handleAction(nom: Nomination, action: string) {
    tap();
    try {
      await updateNomination(nom.id, { status: action });
      hapticSuccess();
      loadNominations();
      setSelectedNom(null);
    } catch {
      hapticError();
      Alert.alert('Error', `Failed to ${action} nomination.`);
    }
  }

  const filtered =
    filter === 'All'
      ? nominations
      : nominations.filter(
          (n) => n.status === filter.toLowerCase()
        );

  function renderItem({ item }: { item: Nomination }) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          tap();
          setSelectedNom(item);
        }}
        style={styles.row}
      >
        <View style={styles.rowTop}>
          <View style={styles.rowInfo}>
            <Text selectable={false} style={styles.childName}>
              {item.child_first_name} {item.child_last_name}
            </Text>
            <Text selectable={false} style={styles.subText}>
              {item.school} - {item.grade}
            </Text>
            <Text selectable={false} style={styles.nominatorText}>
              by {item.nominator_name}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        {/* Quick action buttons */}
        {item.status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleAction(item, 'approved')}
              style={[styles.actionBtn, styles.approveBtn]}
            >
              <Text selectable={false} style={styles.actionBtnText}>
                Approve
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleAction(item, 'declined')}
              style={[styles.actionBtn, styles.declineBtn]}
            >
              <Text selectable={false} style={styles.actionBtnText}>
                Decline
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {item.status === 'approved' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleAction(item, 'sent')}
              style={[styles.actionBtn, styles.sendBtn]}
            >
              <Text selectable={false} style={styles.actionBtnText}>
                Send to Parent
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Logout in header area */}
      <View style={styles.topBar}>
        <Text selectable={false} style={styles.countText}>
          {filtered.length} nomination{filtered.length !== 1 ? 's' : ''}
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

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            activeOpacity={0.7}
            onPress={() => {
              tap();
              setFilter(tab);
            }}
            style={[
              styles.filterTab,
              filter === tab && styles.filterTabActive,
            ]}
          >
            <Text
              selectable={false}
              style={[
                styles.filterTabText,
                filter === tab && styles.filterTabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text selectable={false} style={styles.emptyText}>
            No nominations with status "{filter.toLowerCase()}"
          </Text>
        }
      />

      {/* Detail modal */}
      <Portal>
        <Modal
          visible={!!selectedNom}
          onDismiss={() => setSelectedNom(null)}
          contentContainerStyle={styles.modal}
        >
          {selectedNom && (
            <View>
              <Text selectable={false} style={styles.modalTitle}>
                {selectedNom.child_first_name} {selectedNom.child_last_name}
              </Text>

              {[
                ['School', selectedNom.school],
                ['Grade', selectedNom.grade],
                ['Nominator', selectedNom.nominator_name],
                ['Parent', selectedNom.parent_name],
                ['Phone', selectedNom.parent_phone],
                ['Email', selectedNom.parent_email || '-'],
                ['Reason', selectedNom.reason],
              ].map(([label, value]) => (
                <View key={label} style={styles.modalRow}>
                  <Text selectable={false} style={styles.modalLabel}>
                    {label}
                  </Text>
                  <Text selectable={false} style={styles.modalValue}>
                    {value}
                  </Text>
                </View>
              ))}

              {/* Size sheet if intake done */}
              {selectedNom.intake_completed && (
                <>
                  <Text selectable={false} style={styles.sizeHeader}>
                    Size Sheet
                  </Text>
                  {[
                    ['Gender', selectedNom.gender],
                    ['Department', selectedNom.department],
                    ['Shirt', selectedNom.shirt_size],
                    ['Pants', selectedNom.pant_size],
                    ['Shoes', selectedNom.shoe_size],
                    ['Favorites', selectedNom.favorite_colors],
                    ['Avoid', selectedNom.avoid_colors],
                    ['Allergies', selectedNom.allergies],
                  ].map(([label, value]) => (
                    <View key={label} style={styles.modalRow}>
                      <Text selectable={false} style={styles.modalLabel}>
                        {label}
                      </Text>
                      <Text selectable={false} style={styles.modalValue}>
                        {value || '-'}
                      </Text>
                    </View>
                  ))}
                </>
              )}

              <View style={styles.modalActions}>
                {selectedNom.status === 'pending' && (
                  <>
                    <Button
                      mode="contained"
                      onPress={() => handleAction(selectedNom, 'approved')}
                      style={styles.approveButton}
                    >
                      Approve
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => handleAction(selectedNom, 'declined')}
                      textColor={theme.colors.error}
                      style={styles.declineButton}
                    >
                      Decline
                    </Button>
                  </>
                )}
                {selectedNom.status === 'approved' && (
                  <Button
                    mode="contained"
                    onPress={() => handleAction(selectedNom, 'sent')}
                    style={styles.approveButton}
                  >
                    Send to Parent
                  </Button>
                )}
              </View>

              <Button
                mode="text"
                onPress={() => setSelectedNom(null)}
              >
                Close
              </Button>
            </View>
          )}
        </Modal>
      </Portal>

      {/* FAB for manual nomination */}
      <FAB
        icon="plus"
        style={styles.fab}
        color="#FFF"
        onPress={() => {
          tap();
          // Admin can also nominate
          router.push('/(fa)/nominate');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  countText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  logoutText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  filterTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
    marginHorizontal: 2,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  list: {
    padding: theme.spacing.md,
    paddingBottom: 80,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    padding: theme.spacing.xl,
  },
  row: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rowInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  subText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  nominatorText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  approveBtn: {
    backgroundColor: theme.colors.success,
  },
  declineBtn: {
    backgroundColor: theme.colors.error,
  },
  sendBtn: {
    backgroundColor: theme.colors.primary,
  },
  modal: {
    backgroundColor: theme.colors.background,
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    width: 80,
  },
  modalValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    color: theme.colors.text,
  },
  sizeHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  approveButton: {
    flex: 1,
    backgroundColor: theme.colors.success,
  },
  declineButton: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
});
