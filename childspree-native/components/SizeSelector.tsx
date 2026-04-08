import React from 'react';
import {
  ActionSheetIOS,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, Dialog, Portal, RadioButton } from 'react-native-paper';
import { theme } from '../constants/theme';
import { tap } from '../lib/haptics';

interface SizeSelectorProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
}

export function SizeSelector({
  label,
  value,
  options,
  onSelect,
}: SizeSelectorProps) {
  const [dialogVisible, setDialogVisible] = React.useState(false);

  function handlePress() {
    tap();
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...options],
          cancelButtonIndex: 0,
          title: label,
        },
        (index) => {
          if (index > 0) {
            onSelect(options[index - 1]);
          }
        }
      );
    } else {
      setDialogVisible(true);
    }
  }

  return (
    <View style={styles.container}>
      <Text selectable={false} style={styles.label}>
        {label}
      </Text>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={styles.selector}
      >
        <Text
          selectable={false}
          style={[
            styles.value,
            !value && styles.placeholder,
          ]}
        >
          {value || `Select ${label.toLowerCase()}`}
        </Text>
        <Text selectable={false} style={styles.chevron}>
          {'\u25BC'}
        </Text>
      </TouchableOpacity>

      {Platform.OS === 'android' && (
        <Portal>
          <Dialog
            visible={dialogVisible}
            onDismiss={() => setDialogVisible(false)}
          >
            <Dialog.Title>{label}</Dialog.Title>
            <Dialog.Content>
              <RadioButton.Group
                onValueChange={(val) => {
                  onSelect(val);
                  setDialogVisible(false);
                }}
                value={value}
              >
                {options.map((opt) => (
                  <RadioButton.Item key={opt} label={opt} value={opt} />
                ))}
              </RadioButton.Group>
            </Dialog.Content>
          </Dialog>
        </Portal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  value: {
    fontSize: 16,
    color: theme.colors.text,
  },
  placeholder: {
    color: theme.colors.textSecondary,
  },
  chevron: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
