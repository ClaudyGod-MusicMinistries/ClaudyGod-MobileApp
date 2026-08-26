// services/pushNotificationService.ts
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type {
  NotificationBehavior,
  NotificationContentInput,
} from 'expo-notifications';
import { ENV } from './config';
import { removeDevicePushToken, removeInstallationPushToken, saveDevicePushToken, saveInstallationPushToken } from './userFlowService';
import { getStoredMobileSession } from './authService';

type NotificationsModule = typeof import('expo-notifications');
type NotificationPermissionStatus = 'denied' | 'granted' | 'undetermined';

// Expo Go stopped supporting Android remote push notifications in SDK 53.
// Importing expo-notifications there emits a red-screen console error before
// application code can recover, so load the native module only in a build that
// owns its native notification configuration (development/preview/store build).
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
let notificationsModulePromise: Promise<NotificationsModule> | null = null;
let notificationHandlerConfigured = false;

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  // expo-notifications does not implement remote push registration on web.
  // Importing it just to query permission initializes its web emitter and logs
  // an unsupported push-token listener warning. Browser notification delivery
  // requires a separate Web Push service-worker/VAPID implementation; until
  // that provider exists, expose the capability as unavailable rather than
  // pretending Expo's native transport works in a browser.
  if (isExpoGo || Platform.OS === 'web') return null;

  notificationsModulePromise ??= import('expo-notifications');
  const notifications = await notificationsModulePromise;

  if (!notificationHandlerConfigured) {
    notifications.setNotificationHandler({
      handleNotification: async (): Promise<NotificationBehavior> => {
        const behavior: NotificationBehavior = {
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };

        return behavior;
      },
    });
    notificationHandlerConfigured = true;
  }

  return notifications;
}

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
      const notifications = await getNotificationsModule();
      if (!notifications) return false;

      const existingPermission = await notifications.getPermissionsAsync();
      let isGranted = existingPermission.granted;

      if (!isGranted) {
        const requestedPermission = await notifications.requestPermissionsAsync();
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
      const notifications = await getNotificationsModule();
      if (!notifications) return null;

      if (!Device.isDevice) {
        return null;
      }

      const projectId = ENV.easProjectId;
      if (!projectId) {
        return null;
      }

      const token = (await notifications.getExpoPushTokenAsync({ projectId })).data;
      return token;
    } catch {
      return null;
    }
  }

  private async storePushToken(token: string): Promise<void> {
    // Same guest-mode gap as trackPlayEvent: saveDevicePushToken hits an
    // authenticated /v1/me/* route, and on web apiFetchWithMobileSession relies
    // solely on a session cookie — with no signed-in check here, every guest
    // who grants notification permission fires a doomed 401 on every app launch.
    const { user } = await getStoredMobileSession();
    if (user) {
      await saveDevicePushToken({
        expoPushToken: token,
        deviceType: Platform.OS,
      });
    } else {
      await saveInstallationPushToken({ expoPushToken: token, deviceType: Platform.OS });
    }
  }

  // Schedule local notification with proper typing
  async scheduleLocalNotification(title: string, body: string, data?: Record<string, unknown>): Promise<string> {
    try {
      const notifications = await getNotificationsModule();
      if (!notifications) {
        throw new Error('Notifications require a ClaudyGod development or store build.');
      }

      const notificationContent: NotificationContentInput = {
        title,
        body,
        data: data || {},
        sound: true, // Use boolean instead of string for better type safety
      };

      const notificationId = await notifications.scheduleNotificationAsync({
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
      const notifications = await getNotificationsModule();
      if (!notifications) {
        throw new Error('Notifications require a ClaudyGod development or store build.');
      }

      const notificationContent: NotificationContentInput = {
        title,
        body,
        data: data || {},
        sound: true,
      };

      const notificationId = await notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
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
    const notifications = await getNotificationsModule();
    await notifications?.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    const notifications = await getNotificationsModule();
    await notifications?.cancelAllScheduledNotificationsAsync();
  }

  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    const notifications = await getNotificationsModule();
    if (!notifications) return 'denied';

    const permissions = await notifications.getPermissionsAsync();
    return permissions.status;
  }

  async removePushToken(): Promise<void> {
    try {
      const { user } = await getStoredMobileSession();
      const token = await this.getPushToken();
      if (!token) {
        return;
      }

      if (user) await removeDevicePushToken({ expoPushToken: token, deviceType: Platform.OS });
      else await removeInstallationPushToken({ expoPushToken: token, deviceType: Platform.OS });
      this.isInitialized = false;
    } catch (error) { throw error; }
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
