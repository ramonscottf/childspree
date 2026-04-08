import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../constants/theme';
import { tap as hapticTap, success as hapticSuccess } from '../lib/haptics';
import { getUploadUrl } from '../lib/api';

const MAX_DURATION = 60;

interface VideoCaptureProps {
  token: string;
  onComplete: () => void;
  onBack: () => void;
}

export function VideoCapture({ token, onComplete, onBack }: VideoCaptureProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [timer, setTimer] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text selectable={false} style={styles.permissionText}>
          Camera permission is required to record a video.
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text selectable={false} style={styles.permissionButtonText}>
            Grant Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function startRecording() {
    if (!cameraRef.current) return;
    hapticTap();
    setIsRecording(true);
    setTimer(0);

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev >= MAX_DURATION - 1) {
          stopRecording();
          return MAX_DURATION;
        }
        return prev + 1;
      });
    }, 1000);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_DURATION,
      });
      if (video?.uri) {
        setVideoUri(video.uri);
      }
    } catch {
      // Recording cancelled or error
    }
  }

  async function stopRecording() {
    if (!cameraRef.current) return;
    hapticTap();
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    cameraRef.current.stopRecording();
  }

  function recordAgain() {
    hapticTap();
    setVideoUri(null);
    setTimer(0);
  }

  async function uploadVideo() {
    if (!videoUri) return;
    hapticTap();
    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadUrl = getUploadUrl(token);
      const uploadResult = await FileSystem.uploadAsync(uploadUrl, videoUri, {
        fieldName: 'video',
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (uploadResult.status >= 200 && uploadResult.status < 300) {
        hapticSuccess();
        setUploadProgress(1);
        onComplete();
      } else {
        throw new Error('Upload failed');
      }
    } catch {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Preview mode
  if (videoUri) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <Video
          source={{ uri: videoUri }}
          style={styles.preview}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
          shouldPlay
        />
        {uploading ? (
          <View style={styles.uploadBar}>
            <View
              style={[
                styles.uploadProgress,
                { width: `${uploadProgress * 100}%` },
              ]}
            />
            <Text selectable={false} style={styles.uploadText}>
              Uploading...
            </Text>
          </View>
        ) : (
          <View style={styles.previewControls}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.secondaryButton}
              onPress={recordAgain}
            >
              <Text selectable={false} style={styles.secondaryButtonText}>
                Record again
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.primaryButton}
              onPress={uploadVideo}
            >
              <Text selectable={false} style={styles.primaryButtonText}>
                Use this video
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Camera mode
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mirror={facing === 'front'}
        mode="video"
      >
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(timer / MAX_DURATION) * 100}%` },
            ]}
          />
        </View>

        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.redDot} />
            <Text selectable={false} style={styles.timerText}>
              {formatTime(timer)}
            </Text>
          </View>
        )}

        {/* Back button */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={onBack}
        >
          <Text selectable={false} style={styles.backButtonText}>
            {'\u2715'}
          </Text>
        </TouchableOpacity>

        {/* Flip camera */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.flipButton}
          onPress={() => {
            hapticTap();
            setFacing((prev) => (prev === 'front' ? 'back' : 'front'));
          }}
        >
          <Text selectable={false} style={styles.flipText}>
            {'\u21BB'}
          </Text>
        </TouchableOpacity>

        {/* Record button */}
        <View style={styles.recordContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
          />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  permissionText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.error,
  },
  recordingIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.error,
    marginRight: 8,
  },
  timerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 20,
  },
  flipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    alignSelf: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipText: {
    color: '#FFF',
    fontSize: 24,
  },
  recordContainer: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.error,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  recordButtonActive: {
    borderRadius: 12,
    width: 52,
    height: 52,
    margin: 10,
  },
  preview: {
    flex: 1,
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.lg,
    backgroundColor: '#000',
  },
  secondaryButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  secondaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadBar: {
    height: 50,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  uploadText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
