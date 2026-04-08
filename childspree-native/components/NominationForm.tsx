import React, { useState } from 'react';
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
  Text,
  TextInput,
  SegmentedButtons,
  ActivityIndicator,
} from 'react-native-paper';
import { theme } from '../constants/theme';
import { useLanguage } from './LanguageProvider';
import { createNomination } from '../lib/api';
import { tap, success as hapticSuccess, error as hapticError } from '../lib/haptics';

const DSD_SCHOOLS = [
  'Antelope Elementary',
  'Bluff Ridge Elementary',
  'Boulton Elementary',
  'Burton Elementary',
  'Clinton Elementary',
  'Clearfield Elementary',
  'Cook Elementary',
  'Creekside Elementary',
  'Doxey Elementary',
  'Eagle Bay Elementary',
  'East Layton Elementary',
  'Ellison Park Elementary',
  'Endeavour Elementary',
  'Farmington Elementary',
  'Foxboro Elementary',
  'Heritage Elementary',
  'Hill Field Elementary',
  'Holbrook Elementary',
  'Holt Elementary',
  'Kaysville Elementary',
  'King Elementary',
  'Knowlton Elementary',
  'Lakeside Elementary',
  'Layton Elementary',
  'Lincoln Elementary',
  'Morgan Elementary',
  'Mountain View Elementary',
  'Muir Elementary',
  'Oak Hills Elementary',
  'Orchard Elementary',
  'Parkside Elementary',
  'Pioneer Elementary',
  'Reading Elementary',
  'Riverdale Elementary',
  'Sand Springs Elementary',
  'Snow Horse Elementary',
  'South Clearfield Elementary',
  'South Weber Elementary',
  'Stewart Elementary',
  'Sunset Elementary',
  'Syracuse Elementary',
  'Taylor Elementary',
  'Tolman Elementary',
  'Vae View Elementary',
  'Wasatch Elementary',
  'Washington Elementary',
  'Wasatch Peak Academy',
  'West Bountiful Elementary',
  'West Clinton Elementary',
  'West Point Elementary',
  'Whitesides Elementary',
  'Woods Cross Elementary',
];

const GRADES = ['K', '1st', '2nd', '3rd', '4th', '5th', '6th'];
const ROLES = ['Family Advocate', 'Teacher', 'Counselor', 'Other'];

interface NominationFormProps {
  nominatorName: string;
  nominatorEmail: string;
  onSuccess: () => void;
}

export function NominationForm({
  nominatorName,
  nominatorEmail,
  onSuccess,
}: NominationFormProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState('');

  const [form, setForm] = useState({
    nominatorName,
    nominatorEmail,
    nominatorRole: 'Family Advocate',
    childFirstName: '',
    childLastName: '',
    school: '',
    grade: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    reason: '',
    siblingCount: 0,
    siblingNames: [] as string[],
    parentLanguage: 'en' as 'en' | 'es',
  });

  const filteredSchools = DSD_SCHOOLS.filter((s) =>
    s.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  function updateField(key: string, value: string | number | string[]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateSiblingName(index: number, name: string) {
    const names = [...form.siblingNames];
    names[index] = name;
    updateField('siblingNames', names);
  }

  function adjustSiblings(delta: number) {
    tap();
    const newCount = Math.max(0, Math.min(5, form.siblingCount + delta));
    const names = [...form.siblingNames];
    while (names.length < newCount) names.push('');
    updateField('siblingCount', newCount);
    updateField('siblingNames', names.slice(0, newCount));
  }

  async function handleSubmit() {
    tap();
    if (
      !form.childFirstName ||
      !form.childLastName ||
      !form.school ||
      !form.grade ||
      !form.parentName ||
      !form.parentPhone ||
      !form.reason
    ) {
      hapticError();
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      await createNomination({
        nominator_name: form.nominatorName,
        nominator_email: form.nominatorEmail,
        nominator_role: form.nominatorRole,
        child_first_name: form.childFirstName,
        child_last_name: form.childLastName,
        school: form.school,
        grade: form.grade,
        parent_name: form.parentName,
        parent_phone: form.parentPhone,
        parent_email: form.parentEmail,
        reason: form.reason,
        sibling_count: form.siblingCount,
        sibling_names: form.siblingNames.filter(Boolean).join(', '),
        parent_language: form.parentLanguage,
      });
      hapticSuccess();
      Alert.alert('Success', 'Nomination submitted!');
      onSuccess();
    } catch {
      hapticError();
      Alert.alert('Error', 'Failed to submit nomination. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
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
        {/* Nominator info (read-only) */}
        <TextInput
          label="Your name"
          value={form.nominatorName}
          mode="outlined"
          disabled
          style={styles.input}
        />
        <TextInput
          label="Your email"
          value={form.nominatorEmail}
          mode="outlined"
          disabled
          style={styles.input}
        />

        {/* Role picker */}
        <Text selectable={false} style={styles.label}>
          Your role
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
        >
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role}
              activeOpacity={0.7}
              onPress={() => {
                tap();
                updateField('nominatorRole', role);
              }}
              style={[
                styles.chip,
                form.nominatorRole === role && styles.chipSelected,
              ]}
            >
              <Text
                selectable={false}
                style={[
                  styles.chipText,
                  form.nominatorRole === role && styles.chipTextSelected,
                ]}
              >
                {role}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Child info */}
        <TextInput
          label={t('childFirstName')}
          value={form.childFirstName}
          onChangeText={(v) => updateField('childFirstName', v)}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label={t('childLastName')}
          value={form.childLastName}
          onChangeText={(v) => updateField('childLastName', v)}
          mode="outlined"
          style={styles.input}
        />

        {/* School picker */}
        <Text selectable={false} style={styles.label}>
          {t('school')}
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            tap();
            setShowSchoolPicker(!showSchoolPicker);
          }}
          style={styles.pickerButton}
        >
          <Text
            selectable={false}
            style={form.school ? styles.pickerText : styles.pickerPlaceholder}
          >
            {form.school || 'Select a school'}
          </Text>
        </TouchableOpacity>
        {showSchoolPicker && (
          <View style={styles.schoolDropdown}>
            <TextInput
              placeholder="Search schools..."
              value={schoolSearch}
              onChangeText={setSchoolSearch}
              mode="outlined"
              dense
              style={styles.schoolSearch}
            />
            <ScrollView
              style={styles.schoolList}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {filteredSchools.map((school) => (
                <TouchableOpacity
                  key={school}
                  activeOpacity={0.7}
                  onPress={() => {
                    tap();
                    updateField('school', school);
                    setShowSchoolPicker(false);
                    setSchoolSearch('');
                  }}
                  style={styles.schoolItem}
                >
                  <Text selectable={false}>{school}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Grade picker */}
        <Text selectable={false} style={styles.label}>
          {t('grade')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
        >
          {GRADES.map((grade) => (
            <TouchableOpacity
              key={grade}
              activeOpacity={0.7}
              onPress={() => {
                tap();
                updateField('grade', grade);
              }}
              style={[
                styles.chip,
                form.grade === grade && styles.chipSelected,
              ]}
            >
              <Text
                selectable={false}
                style={[
                  styles.chipText,
                  form.grade === grade && styles.chipTextSelected,
                ]}
              >
                {grade}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Parent info */}
        <TextInput
          label={t('parentName')}
          value={form.parentName}
          onChangeText={(v) => updateField('parentName', v)}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label={t('parentPhone')}
          value={form.parentPhone}
          onChangeText={(v) => updateField('parentPhone', v)}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          label={t('parentEmail')}
          value={form.parentEmail}
          onChangeText={(v) => updateField('parentEmail', v)}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        {/* Reason */}
        <TextInput
          label={t('reason')}
          value={form.reason}
          onChangeText={(v) => {
            if (v.length <= 500) updateField('reason', v);
          }}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.input}
        />
        <Text selectable={false} style={styles.counter}>
          {form.reason.length}/500
        </Text>

        {/* Siblings */}
        <Text selectable={false} style={styles.label}>
          {t('siblings')}
        </Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => adjustSiblings(-1)}
            style={styles.stepperButton}
          >
            <Text selectable={false} style={styles.stepperText}>
              -
            </Text>
          </TouchableOpacity>
          <Text selectable={false} style={styles.stepperValue}>
            {form.siblingCount}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => adjustSiblings(1)}
            style={styles.stepperButton}
          >
            <Text selectable={false} style={styles.stepperText}>
              +
            </Text>
          </TouchableOpacity>
        </View>

        {form.siblingCount > 0 &&
          Array.from({ length: form.siblingCount }).map((_, i) => (
            <TextInput
              key={i}
              label={`Sibling ${i + 1} name`}
              value={form.siblingNames[i] || ''}
              onChangeText={(v) => updateSiblingName(i, v)}
              mode="outlined"
              style={styles.input}
            />
          ))}

        {/* Parent language */}
        <Text selectable={false} style={styles.label}>
          {t('language')}
        </Text>
        <SegmentedButtons
          value={form.parentLanguage}
          onValueChange={(v) => updateField('parentLanguage', v)}
          buttons={[
            { value: 'en', label: '\ud83c\uddfa\ud83c\uddf8 English' },
            { value: 'es', label: '\ud83c\uddf2\ud83c\uddfd Espa\u00f1ol' },
          ]}
          style={styles.segment}
        />

        {/* Submit */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.submitButton, loading && styles.submitDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text selectable={false} style={styles.submitText}>
              {t('submit')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: theme.spacing.md,
    paddingBottom: 60,
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
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
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
  pickerButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  pickerText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  schoolDropdown: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
    maxHeight: 250,
    backgroundColor: theme.colors.background,
  },
  schoolSearch: {
    margin: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  schoolList: {
    maxHeight: 180,
  },
  schoolItem: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  counter: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '600',
  },
  stepperValue: {
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: theme.spacing.lg,
    color: theme.colors.text,
  },
  segment: {
    marginBottom: theme.spacing.lg,
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
});
