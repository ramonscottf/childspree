import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useMicrosoftAuth,
  getMicrosoftUserInfo,
  storeAuthToken,
  storeUser,
} from '../lib/auth';
import { getUserRole } from '../lib/api';
import { useAuth } from '../components/AuthProvider';
import { tap, success as hapticSuccess, error as hapticError } from '../lib/haptics';
import { theme } from '../constants/theme';

export default function LoginScreen() {
  const { setUser } = useAuth();
  const { request, response, promptAsync } = useMicrosoftAuth();
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleAuthResponse();
  }, [response]);

  async function handleAuthResponse() {
    if (response?.type !== 'success') return;

    setLoading(true);
    try {
      const { authentication } = response;
      if (!authentication?.accessToken) {
        throw new Error('No access token');
      }

      const accessToken = authentication.accessToken;
      await storeAuthToken(accessToken);

      const msUser = await getMicrosoftUserInfo(accessToken);
      const email = msUser.mail || msUser.userPrincipalName;
      const role = await getUserRole(email);

      const userData = {
        displayName: msUser.displayName,
        mail: email,
        role,
      };
      await storeUser(userData);
      setUser(userData);
      hapticSuccess();

      if (role === 'admin') {
        router.replace('/(admin)');
      } else if (role === 'fa') {
        router.replace('/(fa)');
      } else {
        hapticError();
        Alert.alert(
          'Access Denied',
          'Your account is not authorized. Please contact your administrator.'
        );
      }
    } catch {
      hapticError();
      Alert.alert('Login Failed', 'Could not complete sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleParentLink() {
    tap();
    if (showTokenInput && tokenInput.trim()) {
      router.push(`/intake/${tokenInput.trim()}`);
    } else {
      setShowTokenInput(true);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Logo area */}
            <View style={styles.logoContainer}>
              <Text selectable={false} style={styles.logo}>
                Child Spree
              </Text>
              <Text selectable={false} style={styles.year}>
                2026
              </Text>
            </View>

            {/* Sign in button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                tap();
                promptAsync();
              }}
              disabled={!request || loading}
              style={[styles.signInButton, loading && styles.buttonDisabled]}
            >
              <Text selectable={false} style={styles.msIcon}>
                {'\u2756'}
              </Text>
              <Text selectable={false} style={styles.signInText}>
                {loading ? 'Signing in...' : 'Sign in with Microsoft'}
              </Text>
            </TouchableOpacity>

            {/* Parent link */}
            {showTokenInput && (
              <TextInput
                placeholder="Enter your access code"
                value={tokenInput}
                onChangeText={setTokenInput}
                mode="outlined"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.tokenInput}
                outlineColor="rgba(255,255,255,0.5)"
                activeOutlineColor="#FFF"
                textColor="#FFF"
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
            )}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleParentLink}
              style={styles.parentLink}
            >
              <Text selectable={false} style={styles.parentLinkText}>
                {showTokenInput ? 'Go to intake form' : 'I have a parent link'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  year: {
    fontSize: 24,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.8)',
    marginTop: theme.spacing.xs,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  msIcon: {
    fontSize: 20,
    color: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
  signInText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  tokenInput: {
    width: '100%',
    marginTop: theme.spacing.lg,
    backgroundColor: 'transparent',
  },
  parentLink: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  parentLinkText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
