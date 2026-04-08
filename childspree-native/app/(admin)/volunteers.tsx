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
import {
  Text,
  TextInput,
  Modal,
  Portal,
  Button,
  Checkbox,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { StatusBadge } from '../../components/StatusBadge';
import {
  getVolunteers,
  sendVolunteerMessage,
  updateVolunteer,
} from '../../lib/api';
import { tap, success as hapticSuccess, error as hapticError } from '../../lib/haptics';
import { theme } from '../../constants/theme';

interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  store_location: string;
  time_slot: string;
  shirt_size: string;
  status: string;
  sms_opt_in?: boolean;
}

const LOCATIONS = ['All', 'Layton', 'Centerville', 'Clinton'];

export default function VolunteersScreen() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [locationFilter, setLocationFilter] = useState('All');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadVolunteers();
    }, [])
  );

  async function loadVolunteers() {
    try {
      const data = await getVolunteers();
      setVolunteers(
        Array.isArray(data) ? data : data.volunteers || []
      );
    } catch {
      // Silently fail
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadVolunteers();
    setRefreshing(false);
  }

  function toggleSelect(id: string) {
    tap();
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  }

  async function handleSendMessage() {
    if (!message.trim()) return;
    tap();
    setSending(true);
    try {
      const ids = Array.from(selected);
      await sendVolunteerMessage({ volunteer_ids: ids, message: message.trim() });
      hapticSuccess();
      Alert.alert('Sent', `Message sent to ${ids.length} volunteer(s).`);
      setShowMessageModal(false);
      setMessage('');
      setSelected(new Set());
    } catch {
      hapticError();
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setSending(false);
    }
  }

  const filtered =
    locationFilter === 'All'
      ? volunteers
      : volunteers.filter(
          (v) =>
            v.store_location?.toLowerCase() === locationFilter.toLowerCase()
        );

  function renderItem({ item }: { item: Volunteer }) {
    const isSelected = selected.has(item.id);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => toggleSelect(item.id)}
        style={[styles.row, isSelected && styles.rowSelected]}
      >
        <View style={styles.checkboxCol}>
          <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={() => toggleSelect(item.id)}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.rowInfo}>
          <Text selectable={false} style={styles.name}>
            {item.name}
          </Text>
          <Text selectable={false} style={styles.detail}>
            {item.store_location} - {item.time_slot}
          </Text>
          <Text selectable={false} style={styles.detail}>
            {item.phone} | {item.shirt_size}
          </Text>
        </View>
        <StatusBadge status={item.status || 'registered'} />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Location filter */}
      <View style={styles.filterRow}>
        {LOCATIONS.map((loc) => (
          <TouchableOpacity
            key={loc}
            activeOpacity={0.7}
            onPress={() => {
              tap();
              setLocationFilter(loc);
            }}
            style={[
              styles.filterTab,
              locationFilter === loc && styles.filterTabActive,
            ]}
          >
            <Text
              selectable={false}
              style={[
                styles.filterTabText,
                locationFilter === loc && styles.filterTabTextActive,
              ]}
            >
              {loc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Selection bar */}
      {selected.size > 0 && (
        <View style={styles.selectionBar}>
          <Text selectable={false} style={styles.selectionText}>
            {selected.size} selected
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              tap();
              setShowMessageModal(true);
            }}
            style={styles.messageBtn}
          >
            <Text selectable={false} style={styles.messageBtnText}>
              Send Message
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
            No volunteers found
          </Text>
        }
      />

      {/* Message modal */}
      <Portal>
        <Modal
          visible={showMessageModal}
          onDismiss={() => setShowMessageModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text selectable={false} style={styles.modalTitle}>
            Send Message to {selected.size} volunteer(s)
          </Text>
          <TextInput
            label="Message"
            value={message}
            onChangeText={setMessage}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.messageInput}
          />
          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => setShowMessageModal(false)}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSendMessage}
              loading={sending}
              disabled={!message.trim() || sending}
              style={styles.sendButton}
            >
              Send
            </Button>
          </View>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
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
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primaryLight,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primaryDark,
  },
  messageBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  messageBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    padding: theme.spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  rowSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  checkboxCol: {
    marginRight: theme.spacing.sm,
  },
  rowInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  detail: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  modal: {
    backgroundColor: theme.colors.background,
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  messageInput: {
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
  },
});
