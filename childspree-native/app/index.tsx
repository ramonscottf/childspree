import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../components/AuthProvider';
import { LoadingScreen } from '../components/LoadingScreen';

export default function Index() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role === 'admin') {
      router.replace('/(admin)');
    } else if (user.role === 'fa') {
      router.replace('/(fa)');
    } else {
      router.replace('/login');
    }
  }, [user, isLoading]);

  return <LoadingScreen />;
}
