import { useCallback, useRef, useState } from 'react';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { useToast } from '../context/ToastContext';

type RecorderStatus = 'idle' | 'preparing' | 'recording' | 'paused' | 'stopped' | 'error';

export function useAudioRecorderSession() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [uri, setUri] = useState<string | null>(null);
  const hasPermission = useRef(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 100);

  const durationMs = recorderState.durationMillis ?? 0;

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (hasPermission.current) return true;
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      showToast({
        title: 'Microphone access needed',
        message: 'Allow microphone access in Settings to record audio.',
        tone: 'warning',
      });
      return false;
    }
    hasPermission.current = true;
    return true;
  }, [showToast]);

  const startRecording = useCallback(async () => {
    if (!(await requestPermission())) return;
    setStatus('preparing');
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStatus('recording');
      setUri(null);
    } catch {
      setStatus('error');
      showToast({ title: 'Recording failed', message: 'Could not start recording.', tone: 'warning' });
    }
  }, [recorder, requestPermission, showToast]);

  const pauseRecording = useCallback(() => {
    recorder.pause();
    setStatus('paused');
  }, [recorder]);

  const resumeRecording = useCallback(() => {
    recorder.record();
    setStatus('recording');
  }, [recorder]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      await recorder.stop();
      const recordedUri = recorder.uri;
      setUri(recordedUri);
      setStatus('stopped');
      return recordedUri;
    } catch {
      setStatus('error');
      return null;
    }
  }, [recorder]);

  const discard = useCallback(async () => {
    try { await recorder.stop(); } catch { /* ignore */ }
    setUri(null);
    setStatus('idle');
  }, [recorder]);

  return {
    status,
    durationMs,
    uri,
    isRecording: status === 'recording',
    isPaused: status === 'paused',
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discard,
  };
}
