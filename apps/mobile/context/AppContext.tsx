import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const DEVICE_ID_KEY = 'claudygod.device.id';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface AppContextValue {
  isReady: boolean;
  deviceId: string;
}

const AppContext = createContext<AppContextValue>({ isReady: false, deviceId: '' });

export function AppProvider({ children }: { children: ReactNode }) {
  const [deviceId, setDeviceId] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(DEVICE_ID_KEY)
      .then(async (stored) => {
        if (!active) return;
        const id = stored ?? generateUUID();
        if (!stored) await AsyncStorage.setItem(DEVICE_ID_KEY, id);
        setDeviceId(id);
        setIsReady(true);
      })
      .catch(() => {
        if (active) {
          setDeviceId(generateUUID());
          setIsReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return <AppContext.Provider value={{ isReady, deviceId }}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  return useContext(AppContext);
}
