import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Modal, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { CustomText } from '../components/CustomText';
import { AppButton } from '../components/ui/AppButton';
import { TVTouchable } from '../components/ui/TVTouchable';
import { useAppTheme } from '../util/colorScheme';

type AppModalTone = 'success' | 'error' | 'info' | 'warning' | 'danger';

type AppModalAction = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
};

type AppModalPayload = {
  title: string;
  message?: string;
  tone?: AppModalTone;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  primaryAction?: AppModalAction;
  secondaryAction?: AppModalAction;
  dismissible?: boolean;
};

type AppModalContextValue = {
  showModal: (_payload: AppModalPayload) => void;
  hideModal: () => void;
};

const AppModalContext = createContext<AppModalContextValue | undefined>(undefined);

function getModalPalette(tone: AppModalTone, primary: string, danger: string) {
  if (tone === 'success') return { icon: 'check-circle' as const, accent: '#56D28E' };
  if (tone === 'error') return { icon: 'error-outline' as const, accent: '#FF8E8E' };
  if (tone === 'warning') return { icon: 'priority-high' as const, accent: '#FBBF24' };
  if (tone === 'danger') return { icon: 'report-gmailerrorred' as const, accent: danger };
  return { icon: 'info-outline' as const, accent: primary };
}

export function AppModalProvider({ children }: { children: ReactNode }) {
  const theme = useAppTheme();
  const [modal, setModal] = useState<AppModalPayload | null>(null);

  const hideModal = useCallback(() => setModal(null), []);
  const showModal = useCallback((payload: AppModalPayload) => {
    setModal({ dismissible: true, tone: 'info', ...payload });
  }, []);

  const value = useMemo(() => ({ showModal, hideModal }), [hideModal, showModal]);
  const palette = modal
    ? getModalPalette(modal.tone ?? 'info', theme.colors.primary, theme.colors.danger)
    : null;

  const runAction = (action?: AppModalAction) => {
    hideModal();
    action?.onPress?.();
  };

  return (
    <AppModalContext.Provider value={value}>
      {children}
      <Modal
        visible={Boolean(modal)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (modal?.dismissible !== false) hideModal();
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: 18,
            backgroundColor: 'rgba(2,1,6,0.60)',
          }}
        >
          {modal && palette ? (
            <View
              style={{
                width: '100%',
                maxWidth: 440,
                alignSelf: 'center',
                borderRadius: 28,
                borderWidth: 1,
                borderColor: theme.colors.borderStrong,
                backgroundColor: theme.colors.elevated,
                padding: theme.spacing.lg,
                shadowColor: '#000000',
                shadowOpacity: 0.3,
                shadowRadius: 28,
                shadowOffset: { width: 0, height: 18 },
                elevation: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 13 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${palette.accent}1F`,
                    borderWidth: 1,
                    borderColor: `${palette.accent}45`,
                  }}
                >
                  <MaterialIcons name={modal.icon ?? palette.icon} size={24} color={palette.accent} />
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <CustomText variant="heading" style={{ color: theme.colors.text }}>
                    {modal.title}
                  </CustomText>
                  {modal.message ? (
                    <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 7, lineHeight: 21 }}>
                      {modal.message}
                    </CustomText>
                  ) : null}
                </View>

                {modal.dismissible !== false ? (
                  <TVTouchable
                    onPress={hideModal}
                    showFocusBorder={false}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.colors.surfaceAlt,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <MaterialIcons name="close" size={18} color={theme.colors.textSecondary} />
                  </TVTouchable>
                ) : null}
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: theme.spacing.lg }}>
                {modal.secondaryAction ? (
                  <AppButton
                    title={modal.secondaryAction.label}
                    variant={modal.secondaryAction.variant ?? 'secondary'}
                    size="lg"
                    fullWidth
                    onPress={() => runAction(modal.secondaryAction)}
                    style={{ flex: 1 }}
                  />
                ) : null}
                <AppButton
                  title={modal.primaryAction?.label ?? 'Done'}
                  variant={modal.primaryAction?.variant ?? 'primary'}
                  size="lg"
                  fullWidth
                  onPress={() => runAction(modal.primaryAction)}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </AppModalContext.Provider>
  );
}

export function useAppModal() {
  const context = useContext(AppModalContext);
  if (!context) {
    throw new Error('useAppModal must be used inside AppModalProvider');
  }

  return context;
}
