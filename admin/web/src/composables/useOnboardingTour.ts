import { reactive, ref } from 'vue';
import { usePreferencesStore } from '@/stores/preferences.store';

export interface TourStep {
  /** CSS selector for a `data-tour="..."` attribute — stable across restyles, unlike class names. */
  target: string;
  title: string;
  body: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface TourState {
  tourId: string | null;
  steps: TourStep[];
  stepIndex: number;
  active: boolean;
}

// Module-scoped singleton (not Pinia) — this is ephemeral "what's on screen right
// now" UI state, not a persisted preference; every TourOverlay/TourTooltip instance
// and every view's onMounted call share the same object by import, same pattern
// Vue composables use for cross-component state without a store.
const state = reactive<TourState>({ tourId: null, steps: [], stepIndex: 0, active: false });

// Steps are colocated per-view (registered on mount) rather than a central config,
// so the "?" replay button in the TopBars — which lives outside the view that owns
// the tour — can still find and re-run whichever tour belongs to the current route.
const registry = new Map<string, TourStep[]>();
const currentTourId = ref<string | null>(null);

function begin(tourId: string, steps: TourStep[]): void {
  if (!steps.length) return;
  state.tourId = tourId;
  state.steps = steps;
  state.stepIndex = 0;
  state.active = true;
}

export function useOnboardingTour() {
  const preferences = usePreferencesStore();

  /** Called by a view in onMounted. Auto-starts the tour on a visitor's first visit only. */
  function registerTour(tourId: string, steps: TourStep[]): void {
    registry.set(tourId, steps);
    currentTourId.value = tourId;
    if (!preferences.hasSeenTour(tourId)) {
      begin(tourId, steps);
    }
  }

  /** Called by the "?" button — forces the current route's tour to run again. */
  function replayCurrentTour(): void {
    const tourId = currentTourId.value;
    if (!tourId) return;
    const steps = registry.get(tourId);
    if (steps) begin(tourId, steps);
  }

  function next(): void {
    if (state.stepIndex < state.steps.length - 1) state.stepIndex += 1;
    else end();
  }

  function prev(): void {
    if (state.stepIndex > 0) state.stepIndex -= 1;
  }

  function skip(): void {
    end();
  }

  function end(): void {
    if (state.tourId) preferences.markTourSeen(state.tourId);
    state.active = false;
    state.tourId = null;
    state.steps = [];
    state.stepIndex = 0;
  }

  return {
    state,
    hasCurrentTour: () => !!currentTourId.value,
    registerTour,
    replayCurrentTour,
    next,
    prev,
    skip,
    end,
  };
}
