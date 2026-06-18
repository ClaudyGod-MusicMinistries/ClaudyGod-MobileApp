import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useToast } from '../context/ToastContext';

export interface PickedMedia {
  uri: string;
  mimeType: string;
  fileName: string;
  width?: number;
  height?: number;
  duration?: number;
}

function assetToPickedMedia(asset: ImagePicker.ImagePickerAsset, forceAudio = false): PickedMedia {
  const ext = asset.uri.split('?')[0]?.split('.').pop()?.toLowerCase() ?? 'jpg';
  let mime: string;
  if (forceAudio) {
    mime = `audio/${ext === 'mp3' ? 'mpeg' : ext}`;
  } else if (asset.type === 'video') {
    mime = `video/${ext === 'mov' ? 'quicktime' : ext}`;
  } else {
    mime = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  }
  return {
    uri: asset.uri,
    mimeType: mime,
    fileName: asset.fileName ?? `pick_${Date.now()}.${ext}`,
    width: asset.width,
    height: asset.height,
    duration: asset.duration ?? undefined,
  };
}

export function useMediaPicker() {
  const { showToast } = useToast();

  const requestGalleryPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast({
        title: 'Permission needed',
        message: 'Allow photo library access in Settings to pick files.',
        tone: 'warning',
      });
      return false;
    }
    return true;
  }, [showToast]);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showToast({
        title: 'Permission needed',
        message: 'Allow camera access in Settings to take a photo.',
        tone: 'warning',
      });
      return false;
    }
    return true;
  }, [showToast]);

  const pickFromGallery = useCallback(
    async (type: 'image' | 'video'): Promise<PickedMedia | null> => {
      if (!(await requestGalleryPermission())) return null;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'image' ? 'images' : 'videos',
        allowsEditing: type === 'image',
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]) return null;
      return assetToPickedMedia(result.assets[0]);
    },
    [requestGalleryPermission],
  );

  const captureFromCamera = useCallback(
    async (type: 'image' | 'video'): Promise<PickedMedia | null> => {
      if (!(await requestCameraPermission())) return null;
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: type === 'image' ? 'images' : 'videos',
        allowsEditing: type === 'image',
        quality: 0.85,
        videoMaxDuration: 300,
      });
      if (result.canceled || !result.assets[0]) return null;
      return assetToPickedMedia(result.assets[0]);
    },
    [requestCameraPermission],
  );

  const pickAudioFile = useCallback(async (): Promise<PickedMedia | null> => {
    if (!(await requestGalleryPermission())) return null;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'videos',
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return null;
    return assetToPickedMedia(result.assets[0], true);
  }, [requestGalleryPermission]);

  return { pickFromGallery, captureFromCamera, pickAudioFile };
}
