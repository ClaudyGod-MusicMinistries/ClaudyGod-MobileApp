// services/pushNotificationService.ts - Alternative Type-Safe Version
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { ENV } from './config';
import { removeDevicePushToken, saveDevicePushToken } from './userFlowService';

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
      const existingPermission = await Notifications.getPermissionsAsync();
      let isGranted = existingPermission.granted;

      if (!isGranted) {
        const requestedPermission = await Notifications.requestPermissionsAsync();
        isGranted = requestedPermission.granted;
      }

      if (!isGranted) {
        return false;
      }

      const token = await this.getPushToken();
      
      if (token) {
        await this.storePushToken(token);
        this.isInitialized = true;
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  private async getPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        return null;
      }

      const projectId = ENV.easProjectId;
      if (!projectId) {
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      return token;
    } catch {
      return null;
    }
  }

  private async storePushToken(token: string): Promise<void> {
    try {
      await saveDevicePushToken({
        expoPushToken: token,
        deviceType: Platform.OS,
      });
    } catch {}
  }

  // Schedule local notification with proper typing
  async scheduleLocalNotification(title: string, body: string, data?: Record<string, unknown>): Promise<string> {
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
      throw error;
    }
  }

  async scheduleNotification(
    title: string, 
    body: string, 
    delayInSeconds: number, 
    data?: Record<string, unknown>
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
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: delayInSeconds,
          repeats: false,
        },
      });

      return notificationId;
    } catch (error) {
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
    const permissions = await Notifications.getPermissionsAsync();
    return permissions.status;
  }

  async removePushToken(): Promise<void> {
    try {
      const token = await this.getPushToken();
      if (!token) {
        return;
      }

      await removeDevicePushToken({
        expoPushToken: token,
        deviceType: Platform.OS,
      });
    } catch {}
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
