import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Checkbox,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getIntake, submitIntake } from '../../lib/api';
import { useLanguage } from '../../components/LanguageProvider';
import { SizeSelector } from '../../components/SizeSelector';
import {
  tap,
  success as hapticSuccess,
  error as hapticError,
} from '../../lib/haptics';
import { theme } from '../../constants/theme';

const SHIRT_SIZES = [
  'Youth XS',
  'Youth S',
  'Youth M',
  'Youth L',
  'Youth XL',
  'Adult S',
  'Adult M',
  'Adult L',
  'Adult XL',
];

const PANT_SIZES = [
  'Youth 4',
  'Youth 5',
  'Youth 6',
  'Youth 7',
  'Youth 8',
  'Youth 10',
  'Youth 12',
  'Youth 14',
  'Youth 16',
  'Adult S',
  'Adult M',
  'Adult L',
  'Adult XL',
];

const SHOE_SIZES = [
  '10C', '11C', '12C', '13C',
  '1Y', '2Y', '3Y', '4Y', '5Y', '6Y', '7Y',
  '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11',
];

export default function IntakeScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { language, setLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [childName, setChildName] = useState('');

  const [form, setForm] = useState({
    gender: '',
    department: '',
    shirt_size: '',
    pant_size: '',
    shoe_size: '',
    favorite_colors: '',
    avoid_colors: '',
    allergies: '',
    consent: false,
  });

  useEffect(() => {
    loadIntakeData();
  }, [token]);

  async function loadIntakeData() {
    if (!token) return;
    try {
      const data = await getIntake(token);
      setChildName(
        `${data.child_first_name || ''} ${data.child_last_name || ''}`.trim()
      );
      if (data.parent_language) {
        setLanguage(data.parent_language as 'en' | 'es');
      }
    } catch {
      Alert.alert('Error', 'Could not load intake form. Please check your link.');
    } finally {
      setLoading(false);
    }
  }

  function updateField(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    tap();
    if (!form.consent) {
      hapticError();
      Alert.alert(
        language === 'en' ? 'Consent Required' : 'Consentimiento requerido',
        t('consentRequired')
      );
      return;
    }
    if (!form.gender || !form.shirt_size || !form.pant_size || !form.shoe_size) {
      hapticError();
      Alert.alert(
        language === 'en' ? 'Missing fields' : 'Campos faltantes',
        language === 'en'
          ? 'Please fill in gender, shirt, pant, and shoe sizes.'
          : 'Por favor complete g\u00e9nero, talla de camisa, pantal\u00f3n y zapato.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await submitIntake(token!, {
        gender: form.gender,
        department: form.department,
        shirt_size: form.shirt_size,
        pant_size: form.pant_size,
        shoe_size: form.shoe_size,
        favorite_colors: form.favorite_colors,
        avoid_colors: form.avoid_colors,
        allergies: form.allergies,
        consent_given: true,
      });
      hapticSuccess();
      Alert.alert(
        language === 'en' ? 'Thank you!' : '\u00a1Gracias!',
        language === 'en'
          ? 'Intake form submitted successfully.'
          : 'Formulario enviado exitosamente.',
        [{ text: 'OK' }]
      );
    } catch {
      hapticError();
      Alert.alert('Error', 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
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
          {/* Language toggle */}
          <View style={styles.langRow}>
            <SegmentedButtons
              value={language}
              onValueChange={(v) => setLanguage(v as 'en' | 'es')}
              buttons={[
                { value: 'en', label: '\ud83c\uddfa\ud83c\uddf8 English' },
                { value: 'es', label: '\ud83c\uddf2\ud83c\uddfd Espa\u00f1ol' },
              ]}
              style={styles.langSegment}
            />
          </View>

          {/* Title */}
          <Text selectable={false} style={styles.title}>
            {t('intakeTitle')}
          </Text>
          {childName ? (
            <Text selectable={false} style={styles.childNameLabel}>
              {childName}
            </Text>
          ) : null}

          {/* Gender */}
          <Text selectable={false} style={styles.label}>
            {t('gender')}
          </Text>
          <View style={styles.chipRow}>
            {[
              { key: 'girl', label: t('genderGirl') },
              { key: 'boy', label: t('genderBoy') },
              { key: 'nonbinary', label: t('genderNonbinary') },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.7}
                onPress={() => {
                  tap();
                  updateField('gender', opt.key);
                }}
                style={[
                  styles.chip,
                  form.gender === opt.key && styles.chipSelected,
                ]}
              >
                <Text
                  selectable={false}
                  style={[
                    styles.chipText,
                    form.gender === opt.key && styles.chipTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Department */}
          <Text selectable={false} style={styles.label}>
            {t('department')}
          </Text>
          <View style={styles.chipRow}>
            {[
              { key: 'girls', label: t('departmentGirls') },
              { key: 'boys', label: t('departmentBoys') },
              { key: 'either', label: t('departmentEither') },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.7}
                onPress={() => {
                  tap();
                  updateField('department', opt.key);
                }}
                style={[
                  styles.chip,
                  form.department === opt.key && styles.chipSelected,
                ]}
              >
                <Text
                  selectable={false}
                  style={[
                    styles.chipText,
                    form.department === opt.key && styles.chipTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Size selectors */}
          <SizeSelector
            label={t('shirtSize')}
            value={form.shirt_size}
            options={SHIRT_SIZES}
            onSelect={(v) => updateField('shirt_size', v)}
          />
          <SizeSelector
            label={t('pantSize')}
            value={form.pant_size}
            options={PANT_SIZES}
            onSelect={(v) => updateField('pant_size', v)}
          />
          <SizeSelector
            label={t('shoeSize')}
            value={form.shoe_size}
            options={SHOE_SIZES}
            onSelect={(v) => updateField('shoe_size', v)}
          />

          {/* Text fields */}
          <TextInput
            label={t('favoriteColors')}
            value={form.favorite_colors}
            onChangeText={(v) => updateField('favorite_colors', v)}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label={t('avoidColors')}
            value={form.avoid_colors}
            onChangeText={(v) => updateField('avoid_colors', v)}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label={t('allergies')}
            value={form.allergies}
            onChangeText={(v) => updateField('allergies', v)}
            mode="outlined"
            multiline
            style={styles.input}
          />

          {/* Consent */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              tap();
              updateField('consent', !form.consent);
            }}
            style={styles.consentRow}
          >
            <Checkbox
              status={form.consent ? 'checked' : 'unchecked'}
              onPress={() => {
                tap();
                updateField('consent', !form.consent);
              }}
              color={theme.colors.primary}
            />
            <Text selectable={false} style={styles.consentText}>
              {t('consent')}
            </Text>
          </TouchableOpacity>

          {/* Record video button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              tap();
              router.push(`/video/${token}`);
            }}
            style={styles.videoButton}
          >
            <Text selectable={false} style={styles.videoButtonText}>
              {t('recordVideo')}
            </Text>
          </TouchableOpacity>
          <Text selectable={false} style={styles.videoHint}>
            {t('videoInstructions')}
          </Text>

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
                {t('submitIntake')}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: 60,
  },
  langRow: {
    marginBottom: theme.spacing.md,
  },
  langSegment: {
    // Default styling
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  childNameLabel: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: theme.spacing.lg,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.text,
    fontSize: 14,
  },
  chipTextSelected: {
    color: '#FFF',
  },
  input: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: theme.spacing.md,
  },
  consentText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginLeft: theme.spacing.sm,
    marginTop: 4,
  },
  videoButton: {
    backgroundColor: theme.colors.primaryDark,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  videoButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  videoHint: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
