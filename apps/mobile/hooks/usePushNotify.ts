// hooks/usePushNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { pushNotificationService } from '../services/pushNotificationService';

export interface UsePushNotificationsReturn {
  isEnabled: boolean;
  hasPermission: boolean;
  isLoading: boolean;
  toggleNotifications: (_enabled: boolean) => Promise<void>;
  checkPermission: () => Promise<void>;
  scheduleTestNotification: () => Promise<void>;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkPermission = useCallback(async () => {
    try {
      const permissionStatus = await pushNotificationService.getPermissionStatus();
      const permissionGranted = permissionStatus === 'granted';

      setHasPermission(permissionGranted);
      setIsEnabled(permissionGranted);
    } catch (error) {
      console.error('Error checking permission:', error);
    }
  }, []);

  const initializeNotifications = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check current permission status
      const permissionStatus = await pushNotificationService.getPermissionStatus();
      const permissionGranted = permissionStatus === 'granted';

      setHasPermission(permissionGranted);
      setIsEnabled(permissionGranted);

      // If permission is granted, initialize the service
      if (permissionGranted) {
        await pushNotificationService.initialize();
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAppStateChange = useCallback(async (nextAppState: string) => {
    if (nextAppState === 'active') {
      await checkPermission();
    }
  }, [checkPermission]);

  // Check initial state
  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  // Listen for app state changes to refresh permission status
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [handleAppStateChange]);

  const toggleNotifications = async (enabled: boolean) => {
    try {
      setIsLoading(true);

      if (enabled) {
        // Request permission and enable notifications
        const success = await pushNotificationService.initialize();
        
        if (success) {
          setIsEnabled(true);
          setHasPermission(true);
          
          // Send welcome notification
          await pushNotificationService.scheduleLocalNotification(
            'Welcome to ClaudyGod Music!',
            'You will now receive important updates and notifications.',
            { type: 'welcome' }
          );
        } else {
          setIsEnabled(false);
          setHasPermission(false);
        }
      } else {
        // Disable notifications
        await pushNotificationService.cancelAllNotifications();
        await pushNotificationService.removePushToken();
        setIsEnabled(false);
        
        // Note: We can't revoke permissions programmatically on iOS
        // User must manually disable in system settings
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleTestNotification = async () => {
    try {
      await pushNotificationService.scheduleLocalNotification(
        'Test Notification',
        'This is a test notification from ClaudyGod Music!',
        { type: 'test' }
      );
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      throw error;
    }
  };

  return {
    isEnabled,
    hasPermission,
    isLoading,
    toggleNotifications,
    checkPermission,
    scheduleTestNotification,
  };
};
