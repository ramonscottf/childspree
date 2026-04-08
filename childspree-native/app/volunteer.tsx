import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { ActivityIndicator, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SizeSelector } from '../components/SizeSelector';
import { createVolunteer } from '../lib/api';
import {
  tap,
  success as hapticSuccess,
  error as hapticError,
} from '../lib/haptics';
import { theme } from '../constants/theme';

const STORE_LOCATIONS = ['Layton', 'Centerville', 'Clinton'];
const TIME_SLOTS = [
  'Morning (8am - 12pm)',
  'Afternoon (12pm - 4pm)',
  'Evening (4pm - 8pm)',
];
const SHIRT_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

export default function VolunteerScreen() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    store_location: '',
    time_slot: '',
    shirt_size: '',
    sms_opt_in: true,
  });

  function updateField(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    tap();
    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.store_location ||
      !form.time_slot ||
      !form.shirt_size
    ) {
      hapticError();
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await createVolunteer(form);
      hapticSuccess();
      setSubmitted(true);
    } catch {
      hapticError();
      Alert.alert('Error', 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <SafeAreaView style={styles.successContainer}>
        <StatusBar style="dark" />
        <Text selectable={false} style={styles.successEmoji}>
          {'\u2714'}
        </Text>
        <Text selectable={false} style={styles.successTitle}>
          Thank you!
        </Text>
        <Text selectable={false} style={styles.successText}>
          You're signed up to volunteer for Child Spree 2026. We'll be in touch
          with more details soon!
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          bounces={Platform.OS === 'ios'}
          overScrollMode="never"
          keyboardShouldPersistTaps="handled"
        >
          <Text selectable={false} style={styles.title}>
            Volunteer for Child Spree 2026
          </Text>
          <Text selectable={false} style={styles.subtitle}>
            Help us make a difference for kids in our community!
          </Text>

          <TextInput
            label="Full name"
            value={form.name}
            onChangeText={(v) => updateField('name', v)}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Email"
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            label="Phone number"
            value={form.phone}
            onChangeText={(v) => updateField('phone', v)}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
          />

          {/* Store location */}
          <Text selectable={false} style={styles.label}>
            Store location
          </Text>
          <View style={styles.chipRow}>
            {STORE_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc}
                activeOpacity={0.7}
                onPress={() => {
                  tap();
                  updateField('store_location', loc);
                }}
                style={[
                  styles.chip,
                  form.store_location === loc && styles.chipSelected,
                ]}
              >
                <Text
                  selectable={false}
                  style={[
                    styles.chipText,
                    form.store_location === loc && styles.chipTextSelected,
                  ]}
                >
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Time slot */}
          <Text selectable={false} style={styles.label}>
            Preferred time slot
          </Text>
          {TIME_SLOTS.map((slot) => (
            <TouchableOpacity
              key={slot}
              activeOpacity={0.7}
              onPress={() => {
                tap();
                updateField('time_slot', slot);
              }}
              style={[
                styles.timeSlot,
                form.time_slot === slot && styles.timeSlotSelected,
              ]}
            >
              <Text
                selectable={false}
                style={[
                  styles.timeSlotText,
                  form.time_slot === slot && styles.timeSlotTextSelected,
                ]}
              >
                {slot}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Shirt size */}
          <SizeSelector
            label="Your shirt size"
            value={form.shirt_size}
            options={SHIRT_SIZES}
            onSelect={(v) => updateField('shirt_size', v)}
          />

          {/* SMS opt-in */}
          <View style={styles.switchRow}>
            <Text selectable={false} style={styles.switchLabel}>
              Opt in to SMS updates
            </Text>
            <Switch
              value={form.sms_opt_in}
              onValueChange={(v) => {
                tap();
                updateField('sms_opt_in', v);
              }}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primaryLight,
              }}
              thumbColor={
                form.sms_opt_in ? theme.colors.primary : '#f4f3f4'
              }
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submitButton, submitting && styles.submitDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text selectable={false} style={styles.submitText}>
                Sign up to volunteer
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: 60,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  input: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFF',
  },
  timeSlot: {
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  timeSlotSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  timeSlotText: {
    fontSize: 15,
    color: theme.colors.text,
  },
  timeSlotTextSelected: {
    color: '#FFF',
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  switchLabel: {
    fontSize: 15,
    color: theme.colors.text,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  successEmoji: {
    fontSize: 64,
    color: theme.colors.success,
    marginBottom: theme.spacing.lg,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  successText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
