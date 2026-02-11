/* eslint-disable @typescript-eslint/no-explicit-any */
// services/pushNotificationService.ts - Alternative Type-Safe Version
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { ENV } from './config';

// Type-safe notification handler
const notificationHandler: Notifications.NotificationHandler = {
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => {
    const behavior: Notifications.NotificationBehavior = {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: false,
        shouldShowList: false
    };

    // Add iOS-specific properties conditionally
    if (Platform.OS === 'ios') {
      behavior.shouldShowBanner = true;
      behavior.shouldShowList = true;
    }

    return behavior;
  },
};

// Set the notification handler
Notifications.setNotificationHandler(notificationHandler);

export class PushNotificationService {
  private static instance: PushNotificationService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      const token = await this.getPushToken();
      
      if (token) {
        await this.storePushToken(token);
        this.isInitialized = true;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  private async getPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Must use physical device for push notifications');
        return null;
      }

      const projectId = ENV.easProjectId;
      if (!projectId) {
        console.log('EXPO_PUBLIC_EAS_PROJECT_ID not found');
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Push token:', token);
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  private async storePushToken(token: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (user?.user?.id) {
        await supabase
          .from('user_push_tokens')
          .upsert({
            user_id: user.user.id,
            expo_push_token: token,
            device_type: Platform.OS,
            updated_at: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('Error storing push token:', error);
    }
  }

  // Schedule local notification with proper typing
  async scheduleLocalNotification(title: string, body: string, data?: Record<string, any>): Promise<string> {
    try {
      const notificationContent: Notifications.NotificationContentInput = {
        title,
        body,
        data: data || {},
        sound: true, // Use boolean instead of string for better type safety
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  async scheduleNotification(
    title: string, 
    body: string, 
    delayInSeconds: number, 
    data?: Record<string, any>
  ): Promise<string> {
    try {
      const notificationContent: Notifications.NotificationContentInput = {
        title,
        body,
        data: data || {},
        sound: true,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: {
          seconds: delayInSeconds,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getPermissionStatus(): Promise<Notifications.PermissionStatus> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  async removePushToken(): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (user?.user?.id) {
        await supabase
          .from('user_push_tokens')
          .delete()
          .eq('user_id', user.user.id);
      }
    } catch (error) {
      console.error('Error removing push token:', error);
    }
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
