import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomText } from '../components/CustomText';
import { AppButton } from '../components/ui/AppButton';
import { TVTouchable } from '../components/ui/TVTouchable';
import { AudioRecorderWidget } from '../components/media/AudioRecorderWidget';
import { useMediaPicker } from '../hooks/useMediaPicker';
import { useAudioRecorderSession } from '../hooks/useAudioRecorder';
import { useContentUpload } from '../hooks/useContentUpload';
import { useRequireMobileSession } from '../hooks/useRequireMobileSession';
import { useToast } from '../context/ToastContext';
import { useAppTheme } from '../util/colorScheme';

type Step = 'type' | 'source' | 'meta' | 'uploading' | 'done';
type ContentKind = 'audio' | 'video';

export default function UploadScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const isAuthorized = useRequireMobileSession();

  const { pickFromGallery, captureFromCamera, pickAudioFile } = useMediaPicker();
  const recorder = useAudioRecorderSession();
  const { upload, progress, status: uploadStatus } = useContentUpload();

  const [step, setStep] = useState<Step>('type');
  const [kind, setKind] = useState<ContentKind>('audio');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaMime, setMediaMime] = useState<string>('audio/mpeg');
  const [mediaName, setMediaName] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (!isAuthorized) return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;

  const handlePickFile = async () => {
    const mediaKind: 'image' | 'video' = kind === 'audio' ? 'video' : 'video';
    const picked = kind === 'audio'
      ? await pickAudioFile()
      : await pickFromGallery(mediaKind);
    if (!picked) return;
    setMediaUri(picked.uri);
    setMediaMime(picked.mimeType);
    setMediaName(picked.fileName);
    setStep('meta');
  };

  const handleCaptureCamera = async () => {
    const picked = await captureFromCamera(kind === 'audio' ? 'video' : 'video');
    if (!picked) return;
    setMediaUri(picked.uri);
    setMediaMime(picked.mimeType);
    setMediaName(picked.fileName);
    setStep('meta');
  };

  const handleRecordingStop = async () => {
    const uri = await recorder.stopRecording();
    if (!uri) return;
    setMediaUri(uri);
    setMediaMime('audio/mpeg');
    setMediaName(`recording_${Date.now()}.m4a`);
    setStep('meta');
  };

  const handleUpload = async () => {
    if (!mediaUri || !title.trim()) {
      showToast({ title: 'Missing info', message: 'Add a title before uploading.', tone: 'warning' });
      return;
    }
    setStep('uploading');
    const result = await upload({ uri: mediaUri, mimeType: mediaMime, fileName: mediaName });
    if (!result) {
      showToast({ title: 'Upload failed', message: 'Please check your connection and try again.', tone: 'warning' });
      setStep('meta');
      return;
    }
    setStep('done');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 }}>
        <TVTouchable
          onPress={() => router.back()}
          showFocusBorder={false}
          style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)' }}
        >
          <MaterialIcons name="close" size={20} color={theme.colors.text} />
        </TVTouchable>
        <CustomText style={{ color: theme.colors.text, fontSize: 16, fontWeight: '700', flex: 1 }}>
          Upload content
        </CustomText>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>

        {/* Step 1 — Type */}
        {step === 'type' ? (
          <View style={{ gap: 16 }}>
            <CustomText style={{ color: 'rgba(247,242,255,0.55)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              What are you uploading?
            </CustomText>
            {(['audio', 'video'] as ContentKind[]).map((t) => (
              <TVTouchable
                key={t}
                onPress={() => { setKind(t); setStep('source'); }}
                showFocusBorder={false}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 16,
                  padding: 18, borderRadius: 16,
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.colors.primary}18` }}>
                  <MaterialIcons name={t === 'audio' ? 'graphic-eq' : 'smart-display'} size={22} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <CustomText style={{ color: theme.colors.text, fontSize: 15, fontWeight: '600' }}>
                    {t === 'audio' ? 'Audio' : 'Video'}
                  </CustomText>
                  <CustomText style={{ color: 'rgba(247,242,255,0.40)', fontSize: 12, marginTop: 2 }}>
                    {t === 'audio' ? 'Music, messages, or a recording' : 'Sessions, clips, and replays'}
                  </CustomText>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="rgba(247,242,255,0.25)" />
              </TVTouchable>
            ))}
          </View>
        ) : null}

        {/* Step 2 — Source */}
        {step === 'source' ? (
          <View style={{ gap: 16 }}>
            <CustomText style={{ color: 'rgba(247,242,255,0.55)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Choose source
            </CustomText>

            <AppButton
              title="Pick from library"
              variant="secondary"
              size="lg"
              fullWidth
              leftIcon={<MaterialIcons name="photo-library" size={18} color={theme.colors.text} />}
              onPress={() => { void handlePickFile(); }}
            />
            <AppButton
              title="Capture with camera"
              variant="secondary"
              size="lg"
              fullWidth
              leftIcon={<MaterialIcons name="camera-alt" size={18} color={theme.colors.text} />}
              onPress={() => { void handleCaptureCamera(); }}
            />

            {kind === 'audio' ? (
              <View style={{ gap: 12 }}>
                <CustomText style={{ color: 'rgba(247,242,255,0.35)', fontSize: 12, textAlign: 'center' }}>
                  or record directly
                </CustomText>
                <AudioRecorderWidget
                  isRecording={recorder.isRecording}
                  isPaused={recorder.isPaused}
                  durationMs={recorder.durationMs}
                  onStart={() => { void recorder.startRecording(); }}
                  onPause={recorder.pauseRecording}
                  onResume={recorder.resumeRecording}
                  onStop={handleRecordingStop}
                  onDiscard={() => { void recorder.discard(); }}
                />
              </View>
            ) : null}

            <AppButton title="Back" variant="ghost" size="md" onPress={() => setStep('type')} />
          </View>
        ) : null}

        {/* Step 3 — Metadata */}
        {step === 'meta' ? (
          <View style={{ gap: 16 }}>
            <CustomText style={{ color: 'rgba(247,242,255,0.55)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Add details
            </CustomText>
            <View style={{ gap: 12 }}>
              <View style={{ backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14 }}>
                <CustomText style={{ color: 'rgba(247,242,255,0.40)', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Title</CustomText>
                <CustomText style={{ color: theme.colors.text, fontSize: 15 }} onPress={() => {}}>
                  {title || <CustomText style={{ color: 'rgba(247,242,255,0.25)' }}>Enter a title…</CustomText>}
                </CustomText>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <AppButton title="Back" variant="ghost" size="md" onPress={() => setStep('source')} style={{ flex: 1 }} />
              <AppButton title="Upload" variant="primary" size="md" onPress={() => { void handleUpload(); }} style={{ flex: 1 }} />
            </View>
          </View>
        ) : null}

        {/* Step 4 — Uploading */}
        {step === 'uploading' ? (
          <View style={{ gap: 20, alignItems: 'center', paddingVertical: 40 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.colors.primary}18` }}>
              <MaterialIcons name="cloud-upload" size={34} color={theme.colors.primary} />
            </View>
            <CustomText style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>
              Uploading…
            </CustomText>
            <View style={{ width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <View style={{ width: `${progress}%`, height: '100%', backgroundColor: theme.colors.primary, borderRadius: 3 }} />
            </View>
            <CustomText style={{ color: 'rgba(247,242,255,0.40)', fontSize: 13 }}>
              {progress}% complete
            </CustomText>
          </View>
        ) : null}

        {/* Step 5 — Done */}
        {step === 'done' ? (
          <View style={{ gap: 20, alignItems: 'center', paddingVertical: 40 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.colors.success}24` }}>
              <MaterialIcons name="check-circle" size={34} color={theme.colors.success} />
            </View>
            <CustomText style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
              Upload complete
            </CustomText>
            <CustomText style={{ color: 'rgba(247,242,255,0.40)', fontSize: 14, textAlign: 'center' }}>
              Your content has been submitted for review.
            </CustomText>
            <AppButton title="Done" variant="primary" size="lg" fullWidth onPress={() => router.back()} />
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}
