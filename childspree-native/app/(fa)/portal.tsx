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
import { Text, Modal, Portal, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../components/AuthProvider';
import { StatusBadge } from '../../components/StatusBadge';
import { getNominations, updateNomination } from '../../lib/api';
import { tap, success as hapticSuccess } from '../../lib/haptics';
import { theme } from '../../constants/theme';
import { useLanguage } from '../../components/LanguageProvider';

interface Nomination {
  id: string;
  child_first_name: string;
  child_last_name: string;
  school: string;
  grade: string;
  status: string;
  parent_name: string;
  parent_phone: string;
  parent_email?: string;
  reason: string;
  intake_completed?: boolean;
  video_uploaded?: boolean;
  consent_given?: boolean;
  created_at?: string;
}

export default function PortalScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNom, setSelectedNom] = useState<Nomination | null>(null);

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

  async function handleSendToParent(nom: Nomination) {
    tap();
    try {
      await updateNomination(nom.id, { status: 'sent' });
      hapticSuccess();
      Alert.alert('Sent!', `Intake form sent to ${nom.parent_name}.`);
      loadNominations();
    } catch {
      Alert.alert('Error', 'Failed to send. Please try again.');
    }
  }

  const stats = {
    total: nominations.length,
    sent: nominations.filter((n) => n.status === 'sent' || n.status === 'complete').length,
    intake: nominations.filter((n) => n.intake_completed).length,
    videos: nominations.filter((n) => n.video_uploaded).length,
  };

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
        <View style={styles.rowContent}>
          <View style={styles.rowInfo}>
            <Text selectable={false} style={styles.childName}>
              {item.child_first_name} {item.child_last_name}
            </Text>
            <Text selectable={false} style={styles.schoolText}>
              {item.school} - {item.grade}
            </Text>
          </View>
          <View style={styles.rowRight}>
            <StatusBadge status={item.status} />
            <View style={styles.indicators}>
              <Text
                selectable={false}
                style={[
                  styles.indicator,
                  item.intake_completed && styles.indicatorDone,
                ]}
              >
                F
              </Text>
              <Text
                selectable={false}
                style={[
                  styles.indicator,
                  item.video_uploaded && styles.indicatorDone,
                ]}
              >
                V
              </Text>
              <Text
                selectable={false}
                style={[
                  styles.indicator,
                  item.consent_given && styles.indicatorDone,
                ]}
              >
                C
              </Text>
            </View>
          </View>
        </View>
        {item.status === 'approved' && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleSendToParent(item)}
            style={styles.sendButton}
          >
            <Text selectable={false} style={styles.sendButtonText}>
              {t('sendToParent')}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Stats strip */}
      <View style={styles.statsRow}>
        {[
          { label: t('totalNominations'), value: stats.total },
          { label: t('sent'), value: stats.sent },
          { label: t('intakeComplete'), value: stats.intake },
          { label: t('videosUploaded'), value: stats.videos },
        ].map((stat) => (
          <View key={stat.label} style={styles.statPill}>
            <Text selectable={false} style={styles.statValue}>
              {stat.value}
            </Text>
            <Text selectable={false} style={styles.statLabel}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      <FlatList
        data={nominations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text selectable={false} style={styles.emptyText}>
            {t('noNominations')}
          </Text>
        }
      />

      {/* Detail bottom sheet */}
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
              <View style={styles.modalRow}>
                <Text selectable={false} style={styles.modalLabel}>School</Text>
                <Text selectable={false}>{selectedNom.school}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text selectable={false} style={styles.modalLabel}>Grade</Text>
                <Text selectable={false}>{selectedNom.grade}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text selectable={false} style={styles.modalLabel}>Parent</Text>
                <Text selectable={false}>{selectedNom.parent_name}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text selectable={false} style={styles.modalLabel}>Phone</Text>
                <Text selectable={false}>{selectedNom.parent_phone}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text selectable={false} style={styles.modalLabel}>Status</Text>
                <StatusBadge status={selectedNom.status} />
              </View>
              <View style={styles.modalRow}>
                <Text selectable={false} style={styles.modalLabel}>Reason</Text>
                <Text selectable={false} style={styles.reasonText}>
                  {selectedNom.reason}
                </Text>
              </View>

              {selectedNom.status === 'approved' && (
                <Button
                  mode="contained"
                  onPress={() => {
                    handleSendToParent(selectedNom);
                    setSelectedNom(null);
                  }}
                  style={styles.modalButton}
                >
                  {t('sendToParent')}
                </Button>
              )}

              <Button
                mode="text"
                onPress={() => setSelectedNom(null)}
                style={styles.modalCloseButton}
              >
                Close
              </Button>
            </View>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  list: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    padding: theme.spacing.xl,
    fontSize: 15,
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
  rowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  schoolText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  indicators: {
    flexDirection: 'row',
    marginTop: theme.spacing.xs,
  },
  indicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.border,
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    marginLeft: 4,
    overflow: 'hidden',
  },
  indicatorDone: {
    backgroundColor: theme.colors.success,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modal: {
    backgroundColor: theme.colors.background,
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    maxHeight: '80%',
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
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    width: 80,
  },
  reasonText: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
  },
  modalButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  modalCloseButton: {
    marginTop: theme.spacing.sm,
  },
});
