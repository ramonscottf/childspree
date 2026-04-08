import React from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { AuthProvider } from '../components/AuthProvider';
import { LanguageProvider } from '../components/LanguageProvider';
import { paperTheme } from '../constants/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <AuthProvider>
            <LanguageProvider>
              <StatusBar style="light" backgroundColor="#E8548C" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="(fa)" />
                <Stack.Screen name="(admin)" />
                <Stack.Screen
                  name="intake/[token]"
                  options={{ gestureEnabled: false }}
                />
                <Stack.Screen
                  name="video/[token]"
                  options={{
                    gestureEnabled: false,
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen name="volunteer" />
              </Stack>
            </LanguageProvider>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
