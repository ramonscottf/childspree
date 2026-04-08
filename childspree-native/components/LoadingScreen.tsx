import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../constants/theme';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Text selectable={false} style={styles.title}>
        Child Spree
      </Text>
      <ActivityIndicator
        size="large"
        color={theme.colors.background}
        style={styles.spinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: theme.spacing.lg,
  },
  spinner: {
    marginTop: theme.spacing.md,
  },
});
