import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { VideoCapture } from '../../components/VideoCapture';

export default function VideoScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();

  return (
    <VideoCapture
      token={token || ''}
      onComplete={() => {
        router.back();
      }}
      onBack={() => {
        router.back();
      }}
    />
  );
}
