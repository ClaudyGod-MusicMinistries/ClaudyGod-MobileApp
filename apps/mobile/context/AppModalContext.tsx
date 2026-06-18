import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { MaterialIcons } from '@expo/vector-icons';

import { ConfirmModal } from '../components/ui/ConfirmModal';
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

function resolveIcon(
  tone: AppModalTone,
  override?: React.ComponentProps<typeof MaterialIcons>['name'],
): React.ComponentProps<typeof MaterialIcons>['name'] {
  if (override) return override;
  if (tone === 'success')  return 'check-circle';
  if (tone === 'error')    return 'error-outline';
  if (tone === 'warning')  return 'priority-high';
  if (tone === 'danger')   return 'report-gmailerrorred';
  return 'info-outline';
}

function resolveIconColor(tone: AppModalTone, primary: string, danger: string): string {
  if (tone === 'success')  return '#56D28E';
  if (tone === 'error')    return '#FF8E8E';
  if (tone === 'warning')  return '#FBBF24';
  if (tone === 'danger')   return danger;
  return primary;
}

export function AppModalProvider({ children }: { children: ReactNode }) {
  const theme = useAppTheme();
  const [modal, setModal] = useState<AppModalPayload | null>(null);

  const hideModal = useCallback(() => setModal(null), []);
  const showModal = useCallback((payload: AppModalPayload) => {
    setModal({ dismissible: true, tone: 'info', ...payload });
  }, []);

  const value = useMemo(() => ({ showModal, hideModal }), [hideModal, showModal]);

  const runAction = (action?: AppModalAction) => {
    hideModal();
    action?.onPress?.();
  };

  const tone = modal?.tone ?? 'info';
  const isDanger = tone === 'danger' || tone === 'error';

  return (
    <AppModalContext.Provider value={value}>
      {children}
      {modal ? (
        <ConfirmModal
          visible
          icon={resolveIcon(tone, modal.icon)}
          iconColor={resolveIconColor(tone, theme.colors.primary, theme.colors.danger)}
          title={modal.title}
          body={modal.message}
          primaryLabel={modal.primaryAction?.label ?? 'Done'}
          primaryTone={isDanger ? 'danger' : 'primary'}
          secondaryLabel={
            modal.secondaryAction
              ? modal.secondaryAction.label
              : modal.dismissible !== false
                ? 'Cancel'
                : undefined
          }
          onPrimary={() => runAction(modal.primaryAction)}
          onSecondary={
            modal.secondaryAction
              ? () => runAction(modal.secondaryAction)
              : undefined
          }
          onDismiss={() => {
            if (modal.dismissible !== false) hideModal();
          }}
        />
      ) : null}
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
