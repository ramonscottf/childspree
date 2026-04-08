import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../components/AuthProvider';
import { NominationForm } from '../../components/NominationForm';
import { theme } from '../../constants/theme';

export default function NominateScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <NominationForm
        nominatorName={user?.displayName || ''}
        nominatorEmail={user?.mail || ''}
        onSuccess={() => {
          router.push('/(fa)/portal');
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
});
